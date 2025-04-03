'use client'

import { IconIds, OrderbookOption, OrderbookAxisScale, OrderbookSide } from '@/enums'
import numeral from 'numeral'
import { useAppStore } from '@/stores/app.store'
import { ReactNode, useEffect, useRef, useState } from 'react'
import IconWrapper from '../common/IconWrapper'
import TokenImage from './TokenImage'
import ChainImage from './ChainImage'
import DepthChart from '../charts/DepthChart'
import { AmmAsOrderbook, AmmTrade, SelectedTrade, StructuredOutput, Token } from '@/interfaces'
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
    getHighestBid,
    getLowestAsk,
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

const OrderbookKeyMetric = (props: { title: string; content: ReactNode }) => (
    <OrderbookComponentLayout title={<p className="text-milk-600 text-xs">{props.title}</p>} content={props.content} />
)
const OrderbookComponentLayout = (props: { title: ReactNode; content: ReactNode }) => (
    <div className="flex flex-col w-full border rounded-xl px-4 py-3 border-milk-100 gap-1 bg-gray-500/5">
        {props.title}
        {props.content}
    </div>
)

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

    // todo
    // useEffect(() => {
    //     if (!selectedTrade?.toDisplay) {
    //         toast(`Selected trade can't be displayed...`, { style: toastStyle })
    //     }
    // }, [selectedTrade])

    /**
     * tokens + data
     */

    // load data from rust api
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, ApiOrderbookQuery] = useQueries({
        queries: [
            // todo status query to update when the api is ready
            {
                queryKey: ['ApiTokensQuery'],
                enabled: true,
                queryFn: async () => {
                    // fetch
                    // toast(`Refreshing tokens list...`, { style: toastStyle })
                    const [tokensResponse] = await Promise.all([
                        fetch(`${APP_ROUTE}/api/local/tokens`, { method: 'GET', headers: { 'Content-Type': 'application/json' } }),
                    ])

                    // parse
                    const [tokensResponseJson] = (await Promise.all([tokensResponse.json()])) as [StructuredOutput<Token[]>]

                    // store
                    if (tokensResponseJson?.data) {
                        setApiTokens(tokensResponseJson.data)
                        // toast.success(`Tokens list loaded`, { style: toastStyle })
                    }

                    // finally
                    return { tokensResponseJson }
                },
                refetchOnWindowFocus: false,
                refetchInterval: 1000 * 60 * 5,
            },
            {
                queryKey: ['ApiOrderbookQuery', sellToken?.address, buyToken?.address],
                enabled: true,
                queryFn: async () => {
                    if (!sellToken?.address || !buyToken?.address) return null
                    toast(`Refreshing ${sellToken.symbol}-${buyToken.symbol} orderbook data...`, { style: toastStyle })
                    const url = `${APP_ROUTE}/api/local/orderbook?token0=${sellToken.address}&token1=${buyToken.address}`
                    const [response] = await Promise.all([fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })])
                    const [responseJson] = (await Promise.all([response.json()])) as [StructuredOutput<AmmAsOrderbook>]
                    const pair = `${sellToken.address}-${buyToken.address}`

                    // handle errors
                    if (responseJson.error) {
                        if (responseJson.error.includes('pair has 0 associated components'))
                            toast.error(`No pool for pair ${sellToken.symbol}-${buyToken.symbol} > select another pair`, { style: toastStyle })
                        else toast.error(`${responseJson.error}`, { style: toastStyle })
                    }

                    // handle errors
                    else if (!responseJson.data?.bids || !responseJson.data?.asks) {
                        toast.error(`Bad orderbook format`, { style: toastStyle })
                    }

                    // handle success
                    else if (responseJson.data) {
                        // store orderbook
                        setApiOrderbook(pair, responseJson.data)

                        // notify ui
                        toast.success(`Latest ${sellToken.symbol}-${buyToken.symbol} orderbook data loaded`, { style: toastStyle })

                        // trigger refresh ui
                        setApiStoreRefreshedAt(Date.now())

                        // set selected trade
                        // const highestBid = getHighestBid(responseJson.data)
                        // if (highestBid && responseJson.data.pools) {
                        //     selectOrderbookTrade({
                        //         selectedAt: Date.now(),
                        //         side: OrderbookSide.BID,
                        //         price: highestBid.average_sell_price,
                        //         amountIn: highestBid.amount,
                        //         distribution: highestBid.distribution,
                        //         output: highestBid.output,
                        //         pools: responseJson.data.pools,
                        //     })
                        // }
                        selectOrderbookTrade(selectedTrade ? { ...selectedTrade, trade: undefined, toDisplay: false } : undefined)
                    }

                    // -
                    return { responseJson }
                },
                refetchOnWindowFocus: false,
                refetchInterval: orderBookRefreshIntervalMs,
            },
        ],
    })

    useEffect(() => {
        if (!ApiOrderbookQuery.isFetching || !ApiOrderbookQuery.isLoading) ApiOrderbookQuery.refetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sellToken, buyToken])

    // prepare
    const metrics:
        | {
              showOrderbookPlaceholders: boolean
              orderbook?: AmmAsOrderbook
              highestBid?: AmmTrade
              midPrice: number
              lowestAsk?: AmmTrade
              spreadPercent: number
              totalBaseAmountInPools: number
              totalQuoteAmountInPools: number
              totalBaseTvlUsd: number
              totalQuoteTvlUsd: number
          }
        | {
              showOrderbookPlaceholders: boolean
              orderbook: AmmAsOrderbook
              highestBid: AmmTrade
              midPrice: number
              lowestAsk: AmmTrade
              spreadPercent: number
              totalBaseAmountInPools: number
              totalQuoteAmountInPools: number
              totalBaseTvlUsd: number
              totalQuoteTvlUsd: number
          } = {
        showOrderbookPlaceholders: true,
        highestBid: undefined,
        midPrice: -1,
        lowestAsk: undefined,
        spreadPercent: -1,
        totalBaseAmountInPools: -1,
        totalQuoteAmountInPools: -1,
        totalBaseTvlUsd: -1,
        totalQuoteTvlUsd: -1,
    }

    // ensure sell / buy are defined
    if (sellToken && buyToken) {
        // prepare
        const key = `${sellToken.address}-${buyToken.address}`
        metrics.orderbook = getOrderbook(key)
        metrics.highestBid = getHighestBid(metrics.orderbook)
        metrics.lowestAsk = getLowestAsk(metrics.orderbook)

        // check 1
        if (metrics.highestBid && metrics.lowestAsk) {
            metrics.midPrice = (metrics.highestBid.average_sell_price + 1 / metrics?.lowestAsk.average_sell_price) / 2
            metrics.spreadPercent = (1 / metrics.lowestAsk.average_sell_price - metrics.highestBid.average_sell_price) / metrics.midPrice

            // check 2
            if (metrics.orderbook?.base_lqdty && metrics.orderbook?.quote_lqdty) {
                metrics.totalBaseAmountInPools = metrics.orderbook.base_lqdty.reduce((total, baseAmountInPool) => (total += baseAmountInPool), 0)
                metrics.totalQuoteAmountInPools = metrics.orderbook.quote_lqdty.reduce((total, quoteAmountInPool) => (total += quoteAmountInPool), 0)
                metrics.totalBaseTvlUsd = metrics.totalBaseAmountInPools * metrics.orderbook.base_worth_eth * metrics.orderbook.eth_usd
                metrics.totalQuoteTvlUsd = metrics.totalQuoteAmountInPools * metrics.orderbook.quote_worth_eth * metrics.orderbook.eth_usd
                metrics.showOrderbookPlaceholders = false
            }
        }
    }

    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-10 gap-4">
            {/* left */}
            <div className="col-span-1 md:col-span-6 flex flex-col gap-4 xl:col-span-7">
                {/* metrics */}
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
                                    'skeleton-loading p-1': metrics.showOrderbookPlaceholders,
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
                            <div className={cn('flex gap-1.5 items-center flex-wrap', { 'skeleton-loading p-1': metrics.showOrderbookPlaceholders })}>
                                <TokenImage size={20} token={buyToken} />
                                {metrics.midPrice > 0 && <p className="text-milk font-bold text-base">{formatAmount(metrics.midPrice)}</p>}
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
                            <div className={cn('flex gap-1.5 items-center flex-wrap', { 'skeleton-loading p-1': metrics.showOrderbookPlaceholders })}>
                                <TokenImage size={20} token={buyToken} />
                                {metrics?.lowestAsk?.average_sell_price && (
                                    <p className="text-milk font-bold text-base">{formatAmount(1 / metrics.lowestAsk.average_sell_price)}</p>
                                )}
                            </div>
                        }
                    />

                    {/* spread */}
                    {!metrics.showOrderbookPlaceholders &&
                    sellToken?.symbol &&
                    buyToken?.symbol &&
                    metrics.lowestAsk &&
                    metrics.highestBid &&
                    metrics.midPrice ? (
                        <OrderbookKeyMetric
                            title="Spread"
                            content={
                                <p className="text-milk font-bold text-base">
                                    {numeral(metrics.spreadPercent).format('0,0.[0000]%')}{' '}
                                    <span className="pl-1 text-milk-400 text-xs">
                                        {numeral(metrics.spreadPercent).multiply(10000).format('0,0.[00]')} bps
                                    </span>
                                </p>
                            }
                        />
                    ) : (
                        <OrderbookKeyMetric
                            title="Spread"
                            content={
                                <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-1">
                                    <p className="text-milk-100 font-bold text-sm">-.--%</p>
                                </div>
                            }
                        />
                    )}

                    {/* last block */}
                    {!metrics.showOrderbookPlaceholders && sellToken?.symbol && buyToken?.symbol && metrics.orderbook ? (
                        <OrderbookComponentLayout
                            title={
                                <div className="w-full flex justify-between">
                                    <p className="text-milk-600 text-xs">Last block</p>
                                    <p className="text-milk-600 text-xs">3s</p>
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
                    {!metrics.showOrderbookPlaceholders &&
                    sellToken?.symbol &&
                    buyToken?.symbol &&
                    metrics.totalBaseTvlUsd &&
                    metrics.totalQuoteTvlUsd ? (
                        <OrderbookKeyMetric
                            title="Total TVL"
                            content={
                                <p className="text-milk font-bold text-base">$ {formatAmount(metrics.totalBaseTvlUsd + metrics.totalQuoteTvlUsd)}</p>
                            }
                        />
                    ) : (
                        <OrderbookKeyMetric
                            title="Total TVL"
                            content={
                                <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-1 w-full">
                                    <p className="text-milk-100 font-bold text-sm">$ --- m</p>
                                </div>
                            }
                        />
                    )}
                </div>

                <OrderbookComponentLayout
                    title={
                        <div className="w-full flex justify-between">
                            {/* title */}
                            <p className="text-milk text-base font-bold">Market depth</p>
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
                        </div>
                    }
                    content={<DepthChart />}
                />

                {/* routes */}
                <OrderbookComponentLayout
                    title={<p className="text-milk text-base font-bold mb-2">Routing</p>}
                    content={
                        selectedTrade?.toDisplay ? (
                            <div className="flex gap-4 w-full p-1">
                                {/* from */}
                                <div className="max-w-24 flex items-center border-r border-dashed border-milk-150 pr-4 my-1">
                                    <TokenImage size={40} token={selectedTrade.side === OrderbookSide.BID ? sellToken : buyToken} />
                                </div>

                                {/* token % */}
                                {metrics.orderbook ? (
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

                                        {/* details */}
                                        <div className="flex-grow flex flex-col gap-2">
                                            {/* tokn */}
                                            <div className="flex gap-2 items-start">
                                                <TokenImage size={22} token={selectedTrade.side === OrderbookSide.BID ? buyToken : sellToken} />
                                                <p className="font-semibold text-milk tracking-wide">
                                                    {(selectedTrade.side === OrderbookSide.BID ? buyToken : sellToken)?.symbol}
                                                </p>
                                            </div>

                                            {/* distribution */}
                                            <div className="flex w-full justify-center items-center rounded-xl gap-1 border border-milk-150 flex-col px-3 py-2">
                                                {/* headers */}
                                                <div className="grid grid-cols-10 w-full rounded-xl py-1 px-4 gap-6 items-center text-xs text-milk-200 font-bold">
                                                    {/* <p className="col-span-1 text-xs">#</p> */}
                                                    <p className="col-span-4">Pool</p>
                                                    <p className="col-span-1 font-bold w-14">Base %</p>
                                                    <p className="col-span-2">Base</p>
                                                    <p className="col-span-1 font-bold w-14">Quote %</p>
                                                    <p className="col-span-2">Quote</p>
                                                </div>
                                                {selectedTrade?.trade?.distribution
                                                    // .sort((curr, next) => next - curr)
                                                    .map((percent, percentIndex) => {
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
                                                                    href={`https://etherscan.io/contract/${pool?.address}`}
                                                                    className="col-span-4 flex gap-2 items-center group"
                                                                >
                                                                    <div className="flex justify-center rounded-full p-1 border border-milk-200 bg-milk-200/10">
                                                                        <SvgMapper icon={config.svgId} className="size-3.5" />
                                                                    </div>
                                                                    <p className="text-milk-600">
                                                                        {config.version.toLowerCase()} - {pool?.fee} bps - {pool?.address.slice(0, 5)}
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
                                                                                  .multiply(selectedTrade.amountIn)
                                                                                  .format('0,0.[000]')
                                                                            : '-'}
                                                                    </p>
                                                                    {selectedTrade.trade?.distribution &&
                                                                        selectedTrade.trade.distribution[percentIndex] > 0 && (
                                                                            <p className="text-xs text-milk-400">
                                                                                {
                                                                                    (selectedTrade.side === OrderbookSide.BID ? sellToken : buyToken)
                                                                                        ?.symbol
                                                                                }
                                                                            </p>
                                                                        )}
                                                                </div>

                                                                {/* output */}
                                                                <p className="col-span-1 text-milk-600 w-14">
                                                                    {selectedTrade.trade?.distributed &&
                                                                    selectedTrade.trade.distributed[percentIndex] > 0
                                                                        ? numeral(selectedTrade.trade.distributed[percentIndex])
                                                                              .divide(100)
                                                                              .format('0,0%')
                                                                        : '-'}
                                                                </p>
                                                                <div className="col-span-2 flex gap-1 items-center">
                                                                    <p className="text-milk-600 text-right text-xs">
                                                                        {selectedTrade.trade?.distributed[percentIndex]
                                                                            ? numeral(selectedTrade.trade?.distributed[percentIndex])
                                                                                  .multiply(selectedTrade.trade?.output)
                                                                                  .format('0,0.[000]')
                                                                            : '-'}
                                                                    </p>
                                                                    {selectedTrade.trade?.distributed &&
                                                                        selectedTrade.trade.distributed[percentIndex] > 0 && (
                                                                            <p className="text-xs text-milk-400">
                                                                                {
                                                                                    (selectedTrade.side === OrderbookSide.BID ? buyToken : sellToken)
                                                                                        ?.symbol
                                                                                }
                                                                            </p>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="skeleton-loading w-full h-16" />
                                )}

                                {/* to */}
                                <div className="max-w-24 flex items-center border-l border-dashed border-milk-150 pl-4 my-1">
                                    <TokenImage size={40} token={selectedTrade.side === OrderbookSide.BID ? buyToken : sellToken} />
                                </div>
                            </div>
                        ) : (
                            <div className="skeleton-loading w-full h-16" />
                        )
                    }
                />
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
                            onChange={async (e) => {
                                try {
                                    // lock
                                    const parsedNumber = Number(numeral(e.target.value).value())
                                    if (isNaN(parsedNumber)) return
                                    const newTradeSide = parsedNumber < metrics.midPrice ? OrderbookSide.BID : OrderbookSide.ASK
                                    const newSelectedTrade: SelectedTrade = {
                                        side: newTradeSide,
                                        amountIn: parsedNumber,
                                        selectedAt: Date.now(),

                                        // must be calculated
                                        trade: undefined,
                                        pools: [],

                                        // meta
                                        toDisplay: false,
                                    }

                                    selectOrderbookTrade(newSelectedTrade)
                                    setSellTokenAmountInput(parsedNumber)

                                    // fetch
                                    if (sellToken?.address && buyToken?.address) {
                                        const url = `${APP_ROUTE}/api/local/orderbook?token0=${sellToken?.address}&token1=${buyToken?.address}&pointAmount=${parsedNumber}&pointToken=${sellToken?.address}`
                                        // console.log('----')
                                        console.log(parsedNumber, url)
                                        // console.log('----')
                                        const tradeResponse = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
                                        const tradeResponseJson = (await tradeResponse.json()) as StructuredOutput<AmmAsOrderbook>
                                        // console.log({ tradeResponseJson })
                                        const pair = `${sellToken.address}-${buyToken.address}`
                                        const orderbook = getOrderbook(pair)
                                        if (orderbook && tradeResponseJson.data) {
                                            const newOrderbook = {
                                                ...orderbook,
                                                bids: [...orderbook.bids, ...tradeResponseJson.data.bids],
                                                asks: [...orderbook.asks, ...tradeResponseJson.data.asks],
                                                base_worth_eth: tradeResponseJson.data.base_worth_eth,
                                                quote_worth_eth: tradeResponseJson.data.quote_worth_eth,
                                                block: tradeResponseJson.data.block,
                                            }
                                            // console.log({ newOrderbook })
                                            setApiOrderbook(pair, newOrderbook)
                                            selectOrderbookTrade({
                                                side: newTradeSide,
                                                amountIn: parsedNumber,
                                                selectedAt: Date.now(),

                                                // must be calculated
                                                trade: newOrderbook.bids.find((bid) => bid.amount === parsedNumber),
                                                pools: newOrderbook.pools,

                                                // meta
                                                toDisplay: true,
                                            })
                                        }
                                    }
                                } catch (error) {
                                    toast.error(`Unexepected error while fetching price: ${extractErrorMessage(error)}`, {
                                        style: toastStyle,
                                    })
                                } finally {
                                    // tba
                                }
                            }}
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
                            <p className="text-milk-600 text-xs">
                                ${' '}
                                {getBaseValueInUsd(metrics.orderbook)
                                    ? safeNumeral(selectedTrade.amountIn * (getBaseValueInUsd(metrics.orderbook) as number), '0,0.[00]')
                                    : '-'}
                            </p>
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
                            onClick={() => {
                                // if (!metrics.showOrderbookPlaceholders) switchSelectedTokens()
                                switchSelectedTokens()
                                // do nothing
                            }}
                            className={cn('size-full rounded-lg bg-milk-600/5 flex items-center justify-center group', {
                                // 'cursor-not-allowed': metrics.showOrderbookPlaceholders,
                                // group: !metrics.showOrderbookPlaceholders,
                            })}
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
                                    selectedTrade?.toDisplay,
                                'skeleton-loading ml-auto w-28 h-8 rounded-full text-transparent': !selectedTrade?.toDisplay,
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
                            <p className="text-milk-600 text-xs">
                                ${' '}
                                {buyTokenAmountInput && getQuoteValueInUsd(metrics.orderbook)
                                    ? numeral(buyTokenAmountInput).multiply(getQuoteValueInUsd(metrics.orderbook)).format('0,0.[00]')
                                    : '-'}
                            </p>
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
                                <div className="skeleton-loading w-16 h-4 rounded-full" />
                                {/* todo */}
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
                    <button className="bg-folly flex justify-center p-4 rounded-xl border-milk-150 transition-all duration-300 hover:opacity-90">
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
            <SelectTokenModal />
        </div>
    )
}
