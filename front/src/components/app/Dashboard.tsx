'use client'

import { IconIds, OrderbookOption, OrderbookAxisScale, OrderbookSide } from '@/enums'
import numeral from 'numeral'
import { useAppStore } from '@/stores/app.store'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import IconWrapper from '../common/IconWrapper'
import TokenImage from './TokenImage'
import ChainImage from './ChainImage'
import DepthChart from '../charts/DepthChart'
import { AmmAsOrderbook, DashboardMetrics, SelectedTrade, StructuredOutput, Token } from '@/interfaces'
import SelectTokenModal from './SelectTokenModal'
import { useModal } from 'connectkit'
import { useAccount } from 'wagmi'
import { useClickOutside } from '@/hooks/useClickOutside'
import {
    cn,
    extractErrorMessage,
    fetchBalance,
    formatAmount,
    getBaseValueInUsd,
    getDashboardMetrics,
    getQuoteValueInUsd,
    mapProtocolIdToProtocolConfig,
    safeNumeral,
} from '@/utils'
import { useQueries } from '@tanstack/react-query'
import { useApiStore } from '@/stores/api.store'
import { APP_ROUTE } from '@/config/app.config'
import toast from 'react-hot-toast'
import { toastStyle } from '@/config/toasts.config'
import LinkWrapper from '../common/LinkWrapper'
import SvgMapper from '../icons/SvgMapper'
import { OrderbookComponentLayout, OrderbookKeyMetric } from './dashboard-sections/Layouts'
import LiquidityBreakdownSection from './dashboard-sections/LiquidityBreakdownSection'

export default function Dashboard() {
    /**
     * zustand
     */

    const {
        /**
         * store
         */

        // hasHydrated,
        // setHasHydrated,

        /**
         * ui
         */

        // showMobileMenu,
        // setShowMobileMenu,
        // storeRefreshedAt,
        // setStoreRefreshedAt,
        // refetchInterval,
        showMarketDepthSection,
        showRoutingSection,
        showLiquidityBreakdownSection,
        showSections,

        /**
         * orderbook
         */

        // data
        // loadedOrderbooks,
        // saveLoadedOrderbook,

        // chart
        yAxisType,
        yAxisLogBase,
        setYAxisType,
        // setYAxisLogBase,
        coloredAreas,
        setColoredAreas,
        symbolsInYAxis,
        setSymbolsInYAxis,

        /**
         * swap
         */

        // inputs
        sellToken,
        // selectSellToken,
        sellTokenAmountInput,
        setSellTokenAmountInput,
        buyToken,
        // selectBuyToken,
        buyTokenAmountInput,
        // setBuyTokenAmountInput,
        switchSelectedTokens,
        isLoadingSomeTrade,
        setIsLoadingSomeTrade,

        // trade
        selectedTrade,
        selectOrderbookTrade,

        /**
         * modal
         */

        // showSelectTokenModal,
        setShowSelectTokenModal,
        // selectTokenModalFor,
        setSelectTokenModalFor,
        // selectTokenModalSearch,
        // setSelectTokenModalSearch,

        /**
         * computeds
         */

        getAddressPair,
    } = useAppStore()
    const { orderBookRefreshIntervalMs, setApiTokens, setApiOrderbook, setApiStoreRefreshedAt, getOrderbook } = useApiStore()

    // chart
    const [openChartOptions, showChartOptions] = useState(false)
    const chartOptionsDropdown = useRef<HTMLDivElement>(null)
    useClickOutside(chartOptionsDropdown, () => showChartOptions(false))

    /**
     * swap
     */

    // actions
    const account = useAccount()
    const [openTradeDetails, showTradeDetails] = useState(false)
    const [buyTokenBalance, setBuyTokenBalance] = useState(-1)
    const [sellTokenBalance, setSellTokenBalance] = useState(-1)
    const [metrics, setMetrics] = useState<DashboardMetrics>(getDashboardMetrics(undefined, undefined, undefined))
    const { setOpen } = useModal()

    // balances
    useEffect(() => {
        if (account.status === 'connected' && account.address && account.chainId) {
            if (buyToken?.address)
                fetchBalance(account.address, account.chainId, buyToken.address as `0x${string}`).then((balance) =>
                    setBuyTokenBalance(isNaN(balance) ? -1 : balance),
                )
            if (sellToken?.address)
                fetchBalance(account.address, account.chainId, sellToken.address as `0x${string}`).then((balance) =>
                    setSellTokenBalance(isNaN(balance) ? -1 : balance),
                )
        }
    }, [account.address, account.chainId, account.status, buyToken?.address, sellToken?.address])

    /**
     * tokens + data
     */

    // load data from rust api
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [ApiTokensQuery, ApiOrderbookQuery] = useQueries({
        queries: [
            // todo status query to update when the api is ready
            {
                queryKey: ['ApiTokensQuery'],
                enabled: true,
                queryFn: async () => {
                    const tokensEndpoint = `${APP_ROUTE}/api/local/tokens`
                    const tokensResponse = await fetch(tokensEndpoint, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
                    const tokensResponseJson = (await tokensResponse.json()) as StructuredOutput<Token[]>
                    setApiTokens(tokensResponseJson.data ?? [])
                    return tokensResponseJson.data
                },
                refetchOnWindowFocus: false,
                refetchInterval: 1000 * 60 * 5,
            },
            {
                queryKey: ['ApiOrderbookQuery', sellToken?.address, buyToken?.address],
                enabled: true,
                queryFn: async () => {
                    if (!sellToken?.address || !buyToken?.address) return null
                    const url = `${APP_ROUTE}/api/local/orderbook?token0=${sellToken.address}&token1=${buyToken.address}`
                    const orderbookResponse = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
                    const orderbookJson = (await orderbookResponse.json()) as StructuredOutput<AmmAsOrderbook>

                    // handle rust api errors
                    if (orderbookJson.error) {
                        // custom error
                        if (orderbookJson.error.includes('pair has 0 associated components'))
                            toast.error(`No pool for pair ${sellToken.symbol}-${buyToken.symbol} > select another pair`, { style: toastStyle })
                        // generic erros
                        else toast.error(`${orderbookJson.error}`, { style: toastStyle })
                    }

                    // valide some crucial keys-values
                    else if (!orderbookJson.data?.bids || !orderbookJson.data?.asks) {
                        toast.error(`Bad orderbook format`, { style: toastStyle })
                    }

                    // handle success
                    else if (orderbookJson.data) {
                        setApiOrderbook(getAddressPair(), orderbookJson.data)
                        toast.success(`${sellToken.symbol}-${buyToken.symbol} orderbook data updated just now`, { style: toastStyle })
                        const orderbook = getOrderbook(getAddressPair())
                        setMetrics(getDashboardMetrics(orderbook, sellToken, buyToken))
                        setApiStoreRefreshedAt(Date.now())
                        if (sellTokenAmountInput) await simulateTradeAndMergeOrderbook(sellTokenAmountInput)
                    }

                    // -
                    return orderbookJson
                },
                refetchOnWindowFocus: false,
                refetchInterval: orderBookRefreshIntervalMs,
            },
        ],
    })

    /**
     * misc
     */

    const simulateTradeAndMergeOrderbook = async (amountIn: number) => {
        try {
            // state
            setIsLoadingSomeTrade(true)

            // prepare
            const url = `${APP_ROUTE}/api/local/orderbook?token0=${sellToken?.address}&token1=${buyToken?.address}&pointAmount=${amountIn}&pointToken=${sellToken?.address}`
            const tradeResponse = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
            const tradeResponseJson = (await tradeResponse.json()) as StructuredOutput<AmmAsOrderbook>
            const pair = getAddressPair()
            const orderbook = getOrderbook(pair)
            if (!tradeResponseJson.data) return
            if (!orderbook) return

            // -
            const newOrderbook = {
                ...orderbook,
                bids: [...orderbook.bids, ...tradeResponseJson.data.bids],
                asks: [...orderbook.asks, ...tradeResponseJson.data.asks],
                base_worth_eth: tradeResponseJson.data.base_worth_eth,
                quote_worth_eth: tradeResponseJson.data.quote_worth_eth,
                block: tradeResponseJson.data.block,
            }

            // update store
            setApiOrderbook(pair, newOrderbook)

            // -
            const newSelectedTrade = {
                side: OrderbookSide.BID,
                amountIn,
                selectedAt: Date.now(),

                // must be calculated
                trade: newOrderbook.bids.find((bid) => bid.amount === amountIn),
                pools: newOrderbook.pools,

                // meta
                toDisplay: true,
            }

            // update store
            selectOrderbookTrade(newSelectedTrade)
        } catch (error) {
            toast.error(`Unexepected error while fetching price: ${extractErrorMessage(error)}`, {
                style: toastStyle,
            })
        } finally {
            // state
            setIsLoadingSomeTrade(false)
        }
    }

    const handleChangeOfAmountIn = async (event: ChangeEvent<HTMLInputElement>) => {
        try {
            // parse
            const amountIn = Number(numeral(event.target.value).value())

            // prevent errors
            if (isNaN(amountIn)) return

            // prepare
            const newTradeSide = OrderbookSide.BID // always bid
            const newSelectedTrade: SelectedTrade = {
                side: newTradeSide,
                amountIn,
                selectedAt: Date.now(),

                // must be calculated
                trade: undefined,
                pools: [],
            }

            // update store
            selectOrderbookTrade(newSelectedTrade)
            setSellTokenAmountInput(amountIn)

            // prevent errors
            if (!sellToken?.address || !buyToken?.address) return

            // -
            await simulateTradeAndMergeOrderbook(amountIn)
        } catch (error) {
            toast.error(`Unexepected error while fetching price: ${extractErrorMessage(error)}`, {
                style: toastStyle,
            })
        } finally {
            // tba
        }
    }

    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-10 gap-4">
            {/* left */}
            <div className="col-span-1 md:col-span-6 flex flex-col gap-4 xl:col-span-7">
                {/* 1. metrics */}
                <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-2">
                    {/* bid */}
                    <OrderbookComponentLayout
                        title={
                            <div className="w-full flex items-start gap-1 group">
                                <p className="text-milk-600 text-xs">Best bid</p>
                                <IconWrapper icon={IconIds.INFORMATION} className="size-3.5 text-milk-200 group-hover:text-milk cursor-pointer" />
                            </div>
                        }
                        content={
                            <div
                                className={cn('flex gap-1.5 items-center flex-wrap', {
                                    'skeleton-loading p-1': !metrics.highestBid?.average_sell_price,
                                })}
                            >
                                <TokenImage size={20} token={buyToken} />
                                {metrics.highestBid?.average_sell_price && (
                                    <p className="text-milk font-bold text-base">{formatAmount(metrics.highestBid.average_sell_price)}</p>
                                )}
                            </div>
                        }
                    />

                    {/* mid price */}
                    <OrderbookComponentLayout
                        title={
                            <div className="w-full flex items-start gap-1 group">
                                <p className="text-milk-600 text-xs">Mid-price</p>
                                <IconWrapper icon={IconIds.INFORMATION} className="size-3.5 text-milk-200 group-hover:text-milk cursor-pointer" />
                            </div>
                        }
                        content={
                            <div className={cn('flex gap-1.5 items-center flex-wrap', { 'skeleton-loading p-1': metrics.midPrice === undefined })}>
                                <TokenImage size={20} token={buyToken} />
                                {metrics.midPrice !== undefined ? (
                                    <p className="text-milk font-bold text-base">{formatAmount(metrics.midPrice)}</p>
                                ) : null}
                            </div>
                        }
                    />

                    {/* ask */}
                    <OrderbookComponentLayout
                        title={
                            <div className="w-full flex items-start gap-1 group">
                                <p className="text-milk-600 text-xs">Best ask</p>
                                <IconWrapper icon={IconIds.INFORMATION} className="size-3.5 text-milk-200 group-hover:text-milk cursor-pointer" />
                            </div>
                        }
                        content={
                            <div
                                className={cn('flex gap-1.5 items-center flex-wrap', {
                                    'skeleton-loading p-1': metrics?.lowestAsk?.average_sell_price === undefined,
                                })}
                            >
                                <TokenImage size={20} token={buyToken} />
                                {metrics?.lowestAsk?.average_sell_price !== undefined ? (
                                    <p className="text-milk font-bold text-base">{formatAmount(1 / metrics.lowestAsk.average_sell_price)}</p>
                                ) : null}
                            </div>
                        }
                    />

                    {/* spread */}
                    <OrderbookKeyMetric
                        title="Spread"
                        content={
                            !isNaN(Number(metrics.spreadPercent)) ? (
                                <p className="text-milk font-bold text-base">
                                    {numeral(metrics.spreadPercent).format('0,0.[0000]%')}{' '}
                                    <span className="pl-1 text-milk-400 text-xs">
                                        {numeral(metrics.spreadPercent).multiply(10000).format('0,0')} bps
                                    </span>
                                </p>
                            ) : (
                                <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-1">
                                    <p className="text-milk-100 font-bold text-sm">-.--%</p>
                                </div>
                            )
                        }
                    />

                    {/* last block */}
                    {metrics.orderbook?.block !== undefined ? (
                        <OrderbookComponentLayout
                            title={
                                <div className="w-full flex justify-between">
                                    <p className="text-milk-600 text-xs">Last block</p>
                                    <p className="text-milk-600 text-xs">-s</p>
                                </div>
                            }
                            content={
                                <LinkWrapper
                                    target="_blank"
                                    href={`https://etherscan.io/block/${metrics.orderbook.block}`}
                                    className="flex gap-1 items-center group"
                                >
                                    <p className="text-milk font-bold text-base">{numeral(metrics.orderbook.block).format('0,0')}</p>
                                    <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-4 text-milk-200 group-hover:text-milk" />
                                </LinkWrapper>
                            }
                        />
                    ) : (
                        <OrderbookKeyMetric
                            title="Last block"
                            content={
                                <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-1">
                                    <p className="text-milk-100 font-bold text-sm">123456789</p>
                                </div>
                            }
                        />
                    )}

                    {/* TVL */}
                    <OrderbookKeyMetric
                        title="Pools TVL"
                        content={
                            metrics.totalBaseTvlUsd === undefined || metrics.totalQuoteTvlUsd === undefined ? (
                                <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-1 w-full">
                                    <p className="text-milk-100 font-bold text-sm">$ --- m</p>
                                </div>
                            ) : (
                                <div className="flex gap-2 items-baseline">
                                    <p className="text-milk font-bold text-base">
                                        $ {formatAmount(metrics.totalBaseTvlUsd + metrics.totalQuoteTvlUsd)}
                                    </p>
                                    {/* <p className="text-milk-150 font-bold text-sm">
                                        $ {formatAmount(metrics.totalBaseTvlUsd)} of {sellToken?.symbol}
                                    </p> */}
                                    <p className="text-milk-200 font-bold text-sm">
                                        {numeral(metrics.totalBaseTvlUsd / (metrics.totalBaseTvlUsd + metrics.totalQuoteTvlUsd)).format('0,0.%')}{' '}
                                        {sellToken?.symbol} and{' '}
                                        {numeral(metrics.totalQuoteTvlUsd / (metrics.totalBaseTvlUsd + metrics.totalQuoteTvlUsd)).format('0,0.%')}{' '}
                                        {buyToken?.symbol}
                                    </p>
                                </div>
                            )
                        }
                    />
                </div>
                {/* 2. chart */}
                <OrderbookComponentLayout
                    title={
                        <div className="w-full flex justify-between">
                            {/* title */}
                            <div className="flex gap-2 items-center">
                                <p className="text-milk text-base font-bold">Market depth</p>
                                <button
                                    onClick={() => showSections(!showMarketDepthSection, showRoutingSection, showLiquidityBreakdownSection)}
                                    className="flex rounded-full hover:bg-gray-600/30 transition-colors duration-300"
                                >
                                    <IconWrapper icon={showMarketDepthSection ? IconIds.TRIANGLE_UP : IconIds.TRIANGLE_DOWN} className="size-4" />
                                </button>
                            </div>
                            {showMarketDepthSection && (
                                <button onClick={() => showChartOptions(!openChartOptions)} className="relative">
                                    <div className="flex items-center gap-1 hover:bg-milk-100/5 transition-colors duration-300 rounded-lg px-2.5 py-1.5">
                                        <p className="text-milk text-sm">Options</p>
                                        <IconWrapper icon={IconIds.TRIANGLE_DOWN} className="size-4" />
                                    </div>

                                    {/* options dropdown */}
                                    {/* todo make it open left aligned */}
                                    <div
                                        ref={chartOptionsDropdown}
                                        className={cn(
                                            // `z-20 absolute mt-2 w-52 rounded-2xl backdrop-blur-lg border border-milk-150 shadow-lg p-3 transition-all origin-top-left flex flex-col gap-5`,
                                            `z-20 absolute right-0 mt-2 w-52 rounded-2xl backdrop-blur-lg border border-milk-150 shadow-lg p-3 transition-all origin-top-right flex flex-col gap-5`,
                                            {
                                                'scale-100 opacity-100': openChartOptions,
                                                'scale-95 opacity-0 pointer-events-none': !openChartOptions,
                                            },
                                        )}
                                    >
                                        {/* option */}
                                        <div className="flex flex-col w-full items-start gap-0.5">
                                            <p className="text-milk-600 text-sm font-bold">Y Axis scale</p>
                                            <div className="grid grid-cols-2 w-full gap-1">
                                                {[OrderbookAxisScale.VALUE, OrderbookAxisScale.LOG].map((type, typeIndex) => (
                                                    <div
                                                        key={`${type}-${typeIndex}`}
                                                        className={cn('flex items-center gap-2 w-full px-4 py-1.5 rounded-lg transition', {
                                                            'text-white bg-gray-600/20': yAxisType === type,
                                                            'text-milk-400 hover:bg-gray-600/20': yAxisType !== type,
                                                        })}
                                                        onClick={() => setYAxisType(type)}
                                                    >
                                                        <p className="text-sm mx-auto">
                                                            {type === OrderbookAxisScale.VALUE ? 'Linear' : `Log ${yAxisLogBase}`}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* option */}
                                        <div className="flex flex-col w-full items-start gap-0.5">
                                            <p className="text-milk-600 text-sm font-bold">Colored areas</p>
                                            <div className="grid grid-cols-2 w-full gap-1">
                                                {[OrderbookOption.YES, OrderbookOption.NO].map((option, optionIndex) => (
                                                    <div
                                                        key={`${option}-${optionIndex}`}
                                                        className={cn('flex items-center gap-2 w-full px-4 py-1.5 rounded-lg transition', {
                                                            'text-white bg-gray-600/20': coloredAreas === option,
                                                            'text-milk-400 hover:bg-gray-600/20': coloredAreas !== option,
                                                        })}
                                                        onClick={() =>
                                                            setColoredAreas(
                                                                coloredAreas === OrderbookOption.YES ? OrderbookOption.NO : OrderbookOption.YES,
                                                            )
                                                        }
                                                    >
                                                        <p className="text-sm mx-auto">{option}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* titles */}
                                        <div className="flex flex-col w-full items-start gap-0.5">
                                            <p className="text-milk-600 text-sm font-bold">Symbols in Y axis labels</p>
                                            <div className="grid grid-cols-2 w-full gap-1">
                                                {[OrderbookOption.YES, OrderbookOption.NO].map((option, optionIndex) => (
                                                    <div
                                                        key={`${option}-${optionIndex}`}
                                                        className={cn('flex items-center gap-2 w-full px-4 py-1.5 rounded-lg transition', {
                                                            'text-white bg-gray-600/20': symbolsInYAxis === option,
                                                            'text-milk-400 hover:bg-gray-600/20': symbolsInYAxis !== option,
                                                        })}
                                                        onClick={() =>
                                                            setSymbolsInYAxis(
                                                                symbolsInYAxis === OrderbookOption.YES ? OrderbookOption.NO : OrderbookOption.YES,
                                                            )
                                                        }
                                                    >
                                                        <p className="text-sm mx-auto">{option}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            )}
                        </div>
                    }
                    content={showMarketDepthSection ? <DepthChart /> : null}
                />
                {/* 3. routing - simple for now */}
                <OrderbookComponentLayout
                    title={
                        <div className="flex flex-col mb-2">
                            <div className="flex gap-2 items-center">
                                <p className="text-milk text-base font-bold">Routing</p>
                                <button
                                    onClick={() => showSections(showMarketDepthSection, !showRoutingSection, showLiquidityBreakdownSection)}
                                    className="flex rounded-full hover:bg-gray-600/30 transition-colors duration-300"
                                >
                                    <IconWrapper icon={showRoutingSection ? IconIds.TRIANGLE_UP : IconIds.TRIANGLE_DOWN} className="size-4" />
                                </button>
                            </div>
                            <p className="text-milk-400 text-xs">Using a simplistic solver</p>
                        </div>
                    }
                    content={
                        showRoutingSection ? (
                            <div className="flex gap-4 w-full p-1">
                                {/* from */}
                                <div className="max-w-24 flex items-center border-r border-dashed border-milk-150 pr-4 my-1">
                                    <TokenImage size={40} token={sellToken} />
                                </div>

                                {/* routes % */}
                                {ApiOrderbookQuery.isFetching ? (
                                    <div className="skeleton-loading w-full h-16" />
                                ) : metrics.orderbook ? (
                                    <>
                                        {selectedTrade ? (
                                            <>
                                                <div className="flex items-center">
                                                    <p className="font-bold text-milk-400 text-sm">100%</p>
                                                    <IconWrapper
                                                        icon={IconIds.CHEVRON_RIGHT}
                                                        className={cn('size-4 text-milk-400', {
                                                            // 'text-aquamarine': selectedTrade.side === OrderbookSide.BID,
                                                            // 'text-folly': selectedTrade.side === OrderbookSide.ASK,
                                                        })}
                                                    />
                                                </div>

                                                <div className="flex-grow flex flex-col gap-2">
                                                    {/* tokn */}
                                                    <div className="flex gap-2 items-start">
                                                        <TokenImage
                                                            size={22}
                                                            token={selectedTrade.side === OrderbookSide.BID ? buyToken : sellToken}
                                                        />
                                                        <p className="font-semibold text-milk tracking-wide">
                                                            {(selectedTrade.side === OrderbookSide.BID ? buyToken : sellToken)?.symbol}
                                                        </p>
                                                    </div>

                                                    {/* distribution */}
                                                    <div className="flex w-full justify-center items-center rounded-xl gap-1 border border-milk-150 flex-col px-3 py-2">
                                                        {/* headers */}
                                                        <div className="grid grid-cols-10 w-full rounded-xl py-1 px-4 gap-6 items-center text-xs text-milk-200 font-bold">
                                                            <p className="col-span-3">Pool</p>
                                                            <p className="col-span-1 font-bold w-14">Base %</p>
                                                            <p className="col-span-2">Base amount</p>
                                                            <p className="col-span-2">Quote amount</p>
                                                            <p className="col-span-1 font-bold w-14">Quote %</p>
                                                            <p className="col-span-1 font-bold w-14">Simulated</p>
                                                        </div>
                                                        {selectedTrade?.trade?.distribution.map((percent, percentIndex) => {
                                                            const pool = metrics.orderbook?.pools[percentIndex]
                                                            const protocolName = pool?.protocol_system ?? 'Unknown'
                                                            const config = mapProtocolIdToProtocolConfig(protocolName)
                                                            return (
                                                                <div
                                                                    key={`${percent}-${percentIndex}`}
                                                                    className="grid grid-cols-10 w-full bg-gray-600/10 hover:bg-gray-600/20 rounded-xl py-1.5 px-4 gap-6 items-center text-xs"
                                                                >
                                                                    {/* pool */}
                                                                    <LinkWrapper
                                                                        target="_blank"
                                                                        href={`https://etherscan.io/address/${pool?.address}`}
                                                                        className="col-span-3 flex gap-2 items-center group"
                                                                    >
                                                                        <div className="flex justify-center rounded-full p-1 border border-milk-200 bg-milk-200/10">
                                                                            <SvgMapper icon={config.svgId} className="size-3.5" />
                                                                        </div>
                                                                        <p className="text-milk-600 truncate">
                                                                            {config?.version ? `${config?.version.toLowerCase()} - ` : ''}
                                                                            {pool?.fee} bps - {pool?.address.slice(0, 5)}
                                                                        </p>
                                                                        <IconWrapper
                                                                            icon={IconIds.OPEN_LINK_IN_NEW_TAB}
                                                                            className="size-4 text-milk-200 group-hover:text-milk"
                                                                        />
                                                                    </LinkWrapper>

                                                                    {/* input */}
                                                                    <p className="col-span-1 text-milk-600 w-14">
                                                                        {selectedTrade.trade?.distribution &&
                                                                        selectedTrade.trade.distribution[percentIndex] > 0
                                                                            ? numeral(selectedTrade.trade.distribution[percentIndex])
                                                                                  .divide(100)
                                                                                  .format('0,0%')
                                                                            : '-'}
                                                                    </p>
                                                                    <div className="col-span-2 flex gap-1 items-center">
                                                                        <p className="text-milk-600 text-right text-xs">
                                                                            {selectedTrade.trade?.distribution[percentIndex]
                                                                                ? numeral(selectedTrade.trade?.distribution[percentIndex])
                                                                                      .divide(100)
                                                                                      .multiply(selectedTrade.amountIn)
                                                                                      .format('0,0.[000]')
                                                                                : '-'}
                                                                        </p>
                                                                        {selectedTrade.trade?.distribution &&
                                                                            selectedTrade.trade.distribution[percentIndex] > 0 && (
                                                                                <p className="text-xs text-milk-400">
                                                                                    {
                                                                                        (selectedTrade.side === OrderbookSide.BID
                                                                                            ? sellToken
                                                                                            : buyToken
                                                                                        )?.symbol
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                    </div>

                                                                    {/* output */}
                                                                    <div className="col-span-2 flex gap-1 items-center">
                                                                        <p className="text-milk-600 text-right text-xs">
                                                                            {selectedTrade.trade?.distributed[percentIndex]
                                                                                ? numeral(selectedTrade.trade?.distributed[percentIndex])
                                                                                      .divide(100)
                                                                                      .multiply(selectedTrade.trade?.output)
                                                                                      .format('0,0.[000]')
                                                                                : '-'}
                                                                        </p>
                                                                        {selectedTrade.trade?.distributed &&
                                                                            selectedTrade.trade.distributed[percentIndex] > 0 && (
                                                                                <p className="text-xs text-milk-400">
                                                                                    {
                                                                                        (selectedTrade.side === OrderbookSide.BID
                                                                                            ? buyToken
                                                                                            : sellToken
                                                                                        )?.symbol
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                    </div>
                                                                    <p className="col-span-1 text-milk-600 w-14">
                                                                        {selectedTrade.trade?.distributed &&
                                                                        selectedTrade.trade.distributed[percentIndex] > 0
                                                                            ? numeral(selectedTrade.trade.distributed[percentIndex])
                                                                                  .divide(100)
                                                                                  .format('0,0%')
                                                                            : '-'}
                                                                    </p>

                                                                    {/* execution */}
                                                                    <p className="col-span-1 text-milk-600 w-14 truncate">
                                                                        {selectedTrade.trade?.distribution &&
                                                                        selectedTrade.trade.distribution[percentIndex] > 0 &&
                                                                        selectedTrade.trade?.distributed &&
                                                                        selectedTrade.trade.distributed[percentIndex] > 0
                                                                            ? numeral(
                                                                                  selectedTrade.trade?.distributed[percentIndex] *
                                                                                      (selectedTrade.trade?.output / 100),
                                                                              )
                                                                                  .divide(
                                                                                      selectedTrade.trade?.distribution[percentIndex] *
                                                                                          (selectedTrade.amountIn / 100),
                                                                                  )
                                                                                  .format('0,0.[000000]')
                                                                            : '-'}
                                                                    </p>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm font-bold text-milk-200 mx-auto">
                                                Select any positive amount of {sellToken?.symbol} to sell
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <div className="skeleton-loading w-full h-16" />
                                )}

                                {/* to */}
                                <div className="max-w-24 flex items-center border-l border-dashed border-milk-150 pl-4 my-1">
                                    <TokenImage size={40} token={buyToken} />
                                </div>
                            </div>
                        ) : null
                    }
                />

                {/* section */}
                <LiquidityBreakdownSection metrics={metrics} />
            </div>

            {/* right */}
            <div className="col-span-1 md:col-span-4 flex flex-col gap-0.5 xl:col-span-3">
                {/* sell */}
                <div
                    className={cn('flex flex-col gap-1 p-4 rounded-xl border-milk-150 w-full', {
                        'bg-folly/20': account.isConnected && sellToken?.address && sellTokenAmountInput && sellTokenBalance < sellTokenAmountInput,
                        'bg-milk-600/5': !(
                            account.isConnected &&
                            sellToken?.address &&
                            sellTokenAmountInput &&
                            sellTokenBalance < sellTokenAmountInput
                        ),
                    })}
                >
                    <div className="flex justify-between">
                        <p className="text-milk-600 text-xs">Sell</p>
                        <div className="flex items-center">
                            {account.isConnected &&
                            sellToken?.address &&
                            sellTokenBalance &&
                            sellTokenAmountInput &&
                            sellTokenBalance < sellTokenAmountInput ? (
                                <p className="text-folly font-bold text-xs pr-2">Exceeds Balance</p>
                            ) : null}
                            <button
                                onClick={() => {}}
                                className={cn('flex transition-colors duration-300 opacity-80 px-2.5 py-1.5 rounded-lg', {
                                    'bg-milk-100/5': true,
                                    'hover:opacity-100 hover:bg-milk-100/5': false,
                                })}
                            >
                                <p className="font-bold text-aquamarine text-xs">Best bid</p>
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-between gap-3">
                        <button
                            onClick={() => {
                                setSelectTokenModalFor('sell')
                                setShowSelectTokenModal(true)
                            }}
                            className="flex rounded-full bg-gray-600/30 transition-colors duration-300 hover:bg-gray-600/50 items-center gap-1.5 pl-1.5 pr-2 py-1.5 min-w-fit"
                        >
                            <TokenImage size={24} token={sellToken} />
                            {sellToken ? (
                                <p className="font-semibold tracking-wide">{sellToken.symbol}</p>
                            ) : (
                                <div className="skeleton-loading flex w-16 h-6 items-center justify-center rounded-full" />
                            )}
                            <IconWrapper icon={IconIds.TRIANGLE_DOWN} className="size-4" />
                        </button>
                        <input
                            type="text"
                            className="text-xl font-bold text-right border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none bg-transparent w-40"
                            value={numeral(sellTokenAmountInput).format('0,0.[00000]')}
                            onChange={handleChangeOfAmountIn}
                        />
                    </div>
                    {selectedTrade && metrics.midPrice ? (
                        <div className="mt-2 flex justify-between items-center">
                            {/* left: balance */}
                            <div className="flex justify-between gap-1 items-center">
                                <IconWrapper icon={IconIds.WALLET} className="size-4 text-milk-400" />
                                <p className="text-milk-400 text-xs">
                                    {account.isConnected && sellTokenBalance >= 0 ? formatAmount(sellTokenBalance) : 0}
                                </p>
                                {account.isConnected && sellToken?.address && (
                                    <button onClick={() => setSellTokenAmountInput(sellTokenBalance)} className="pl-1">
                                        <p className="text-folly font-bold text-xs">MAX</p>
                                    </button>
                                )}
                            </div>

                            {/* right: input value in $ */}
                            {isLoadingSomeTrade ? (
                                <div className="skeleton-loading w-16 h-4 rounded-full" />
                            ) : (
                                <p className="text-milk-600 text-xs">
                                    ${' '}
                                    {getBaseValueInUsd(metrics.orderbook)
                                        ? safeNumeral(selectedTrade.amountIn * (getBaseValueInUsd(metrics.orderbook) as number), '0,0.[00]')
                                        : '-'}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="mt-2 flex justify-between items-center">
                            <div className="flex justify-between gap-1 items-center">
                                <IconWrapper icon={IconIds.WALLET} className="size-4 text-milk-400" />
                                <p className="text-milk-400 text-xs">
                                    {account.isConnected && buyTokenBalance >= 0 ? formatAmount(buyTokenBalance) : 0}
                                </p>
                            </div>
                            <div className="skeleton-loading w-16 h-4 rounded-full" />
                        </div>
                    )}
                </div>

                {/* arrow */}
                <div className="h-0 w-full flex justify-center items-center z-10">
                    <div className="size-[44px] rounded-xl bg-background p-1">
                        <button
                            onClick={async () => {
                                switchSelectedTokens()
                                if (sellTokenAmountInput) await simulateTradeAndMergeOrderbook(sellTokenAmountInput)
                            }}
                            className="size-full rounded-lg bg-milk-600/5 flex items-center justify-center group"
                        >
                            <IconWrapper icon={IconIds.ARROW_DOWN} className="size-5 transition-transform duration-300 group-hover:rotate-180" />
                        </button>
                    </div>
                </div>

                {/* buy */}
                <div className="bg-milk-600/5 flex flex-col gap-3 p-4 rounded-xl border-milk-150 w-full">
                    <p className="text-milk-600 text-xs">Buy</p>
                    <div className="flex justify-between gap-3 w-full">
                        <button
                            onClick={() => {
                                setSelectTokenModalFor('buy')
                                setShowSelectTokenModal(true)
                            }}
                            className="flex rounded-full bg-gray-600/30 transition-colors duration-300 hover:bg-gray-600/50 items-center gap-1.5 pl-1.5 pr-2 py-1.5 min-w-fit"
                        >
                            <TokenImage size={24} token={buyToken} />
                            {buyToken ? (
                                <p className="font-semibold tracking-wide">{buyToken.symbol}</p>
                            ) : (
                                <div className="skeleton-loading flex w-16 h-6 items-center justify-center rounded-full" />
                            )}
                            <IconWrapper icon={IconIds.TRIANGLE_DOWN} className="size-4" />
                        </button>
                        {/* <p className="text-xl font-bold text-right border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none bg-transparent w-40 cursor-not-allowed">
                            {selectedTrade
                                ? safeNumeral(
                                      selectedTrade.amountIn *
                                          (selectedTrade.side === OrderbookSide.ASK ? 1 / selectedTrade.price : selectedTrade.price),
                                      '0,0.[00000]',
                                  )
                                : '-'}
                        </p> */}
                        <input
                            type="text"
                            className={cn('text-xl font-bold text-right border-none outline-none', {
                                'cursor-not-allowed bg-transparent ring-0 focus:ring-0 focus:outline-none focus:border-none w-40':
                                    selectedTrade?.trade,
                                'skeleton-loading ml-auto w-28 h-8 rounded-full text-transparent': !selectedTrade?.trade,
                            })}
                            value={numeral(buyTokenAmountInput).format('0,0.[00000]')}
                            disabled={true}
                        />
                    </div>

                    {selectedTrade ? (
                        <div className="flex justify-between items-center">
                            <div className="flex justify-between gap-1 items-center">
                                <IconWrapper icon={IconIds.WALLET} className="size-4 text-milk-400" />
                                <p className="text-milk-400 text-xs">
                                    {account.isConnected && sellTokenBalance >= 0 ? formatAmount(sellTokenBalance) : 0}
                                </p>
                            </div>

                            {/* right: input value in $ */}
                            {isLoadingSomeTrade ? (
                                <div className="skeleton-loading w-16 h-4 rounded-full" />
                            ) : (
                                <p className="text-milk-600 text-xs">
                                    ${' '}
                                    {buyTokenAmountInput && getQuoteValueInUsd(metrics.orderbook)
                                        ? numeral(buyTokenAmountInput).multiply(getQuoteValueInUsd(metrics.orderbook)).format('0,0.[00]')
                                        : '-'}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="mt-2 flex justify-between items-center">
                            <div className="flex justify-between gap-1 items-center">
                                <IconWrapper icon={IconIds.WALLET} className="size-4 text-milk-400" />
                                <p className="text-milk-400 text-xs">
                                    {account.isConnected && sellTokenBalance >= 0 ? formatAmount(sellTokenBalance) : 0}
                                </p>
                            </div>
                            <div className="skeleton-loading w-16 h-4 rounded-full" />
                        </div>
                    )}
                </div>

                {/* separator */}
                <div className="h-0 w-full" />

                {/* fees */}
                <div className="bg-milk-600/5 flex flex-col gap-6 px-2 py-4 rounded-xl border-milk-150 text-xs">
                    {/* summary */}
                    <div className="flex w-full justify-between items-center">
                        {sellToken && buyToken && metrics.highestBid && metrics.orderbook ? (
                            <p className="text-milk-600 truncate pl-2">
                                1 {sellToken.symbol} = {formatAmount(metrics.midPrice)} {buyToken.symbol} (${' '}
                                {formatAmount(getBaseValueInUsd(metrics.orderbook))})
                            </p>
                        ) : sellToken && buyToken ? (
                            <div className="flex items-center gap-1">
                                <p className="text-milk-600 truncate pl-2">1 {sellToken.symbol} =</p>
                                <div className="skeleton-loading flex w-12 h-4 items-center justify-center rounded-full" />
                                <p className="text-milk-600 truncate">{buyToken.symbol}</p>
                            </div>
                        ) : (
                            <div className="skeleton-loading flex w-20 h-4 items-center justify-center rounded-full" />
                        )}

                        <button
                            onClick={() => showTradeDetails(!openTradeDetails)}
                            className="flex gap-1.5 items-center hover:bg-milk-100/5 px-2 py-1 rounded-xl"
                        >
                            <IconWrapper icon={IconIds.GAS} className="size-4 text-milk-600" />
                            <ChainImage networkName="ethereum" className="size-4" />
                            <p className="text-milk-600">
                                ${' '}
                                {metrics.highestBid?.gas_costs_usd
                                    ? numeral(metrics.highestBid.gas_costs_usd.reduce((cost, curr) => (cost += curr), 0)).format('0,0.[00]')
                                    : '-'}
                            </p>
                            <IconWrapper
                                icon={openTradeDetails ? IconIds.TRIANGLE_UP : IconIds.TRIANGLE_DOWN}
                                className="size-4 transition-transform duration-300"
                            />
                        </button>
                    </div>

                    {/* details */}
                    {openTradeDetails && (
                        <div className="flex flex-col gap-2 text-xs px-2">
                            <div className="flex justify-between w-full text-milk-400">
                                <p>Expected output</p>
                                <div className="skeleton-loading w-16 h-4 rounded-full" />
                            </div>
                            <div className="flex justify-between w-full text-milk-400">
                                <p>Minimum received after slippage (0.2%)</p>
                                <div className="skeleton-loading w-16 h-4 rounded-full" />
                            </div>
                            <div className="flex justify-between w-full text-milk-400">
                                <p>Price Impact</p>
                                {isLoadingSomeTrade ? (
                                    <div className="skeleton-loading w-16 h-4 rounded-full" />
                                ) : (
                                    <p>
                                        {selectedTrade?.trade?.price_impact ? numeral(selectedTrade?.trade?.price_impact).format('0,0.[000]%') : '-'}
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-between w-full text-milk-400">
                                <p>Gas token</p>
                                <div className="flex gap-1 items-center">
                                    {sellToken ? (
                                        <TokenImage size={16} token={sellToken} />
                                    ) : (
                                        <span className="animate-pulse rounded-full bg-milk-150" style={{ width: 16, height: 16 }} />
                                    )}
                                    {sellToken ? (
                                        <p className="font-semibold tracking-wide">{sellToken.symbol}</p>
                                    ) : (
                                        <div className="skeleton-loading flex w-16 h-6 items-center justify-center rounded-full" />
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between w-full text-milk-400">
                                <p>Network Fee</p>
                                <div className="skeleton-loading w-16 h-4 rounded-full" />
                            </div>
                        </div>
                    )}
                </div>

                {/* separator */}
                <div className="h-0 w-full" />

                {/* fees */}
                {account.isConnected ? (
                    <button
                        onClick={() => {}}
                        className="bg-folly flex justify-center p-4 rounded-xl border-milk-150 transition-all duration-300 hover:opacity-90"
                    >
                        <p className="font-bold">Swap</p>
                    </button>
                ) : (
                    <button
                        onClick={() => setOpen(true)}
                        className="bg-folly flex justify-center p-4 rounded-xl border-milk-150 transition-all duration-300 hover:opacity-90"
                    >
                        <p className="font-bold">Connect wallet</p>
                    </button>
                )}
            </div>

            {/* modal */}
            <SelectTokenModal />
        </div>
    )
}
