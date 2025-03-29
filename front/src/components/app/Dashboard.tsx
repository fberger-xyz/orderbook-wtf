'use client'

import { IconIds, OrderbookAxisScale } from '@/enums'
import numeral from 'numeral'
import { useAppStore } from '@/stores/app.store'
import { ReactNode, useRef, useState } from 'react'
import IconWrapper from '../common/IconWrapper'
import TokenImage from './TokenImage'
import ChainImage from './ChainImage'
import DepthChart from '../charts/DepthChart'
import { AmmAsOrderbook, AmmTrade, APIResponse, Token } from '@/interfaces'
import SelectTokenModal from './SelectTokenModal'
import { useModal } from 'connectkit'
import { useAccount } from 'wagmi'
import { useClickOutside } from '@/hooks/useClickOutside'
import { cn, formatAmount } from '@/utils'
import { useQueries } from '@tanstack/react-query'
import { useApiStore } from '@/stores/api.store'
import { APP_ROUTE } from '@/config/app.config'
import toast from 'react-hot-toast'
import { toastStyle } from '@/config/toasts.config'

const OrderbookKeyMetric = (props: { title: string; content: ReactNode }) => (
    <OrderbookComponentLayout title={<p className="text-milk-600 text-xs">{props.title}</p>} content={props.content} />
)
const OrderbookComponentLayout = (props: { title: ReactNode; content: ReactNode }) => (
    <div className="flex flex-col w-full border rounded-xl px-4 py-3 border-milk-100 gap-1 bg-gray-600/5">
        {props.title}
        {props.content}
    </div>
)

export default function Dashboard() {
    const account = useAccount()
    const { setOpen } = useModal()
    const {
        sellToken,
        // sellTokenAmountInput,
        buyToken,
        // buyTokenAmountInput,
        yAxisType,
        yAxisLogBase,
        switchSelectedTokens,
        setShowSelectTokenModal,
        setSelectTokenModalFor,
        setSellTokenAmountInput,
        setBuyTokenAmountInput,
        setYAxisType,
    } = useAppStore()
    const { orderBookRefreshIntervalMs, setApiTokens, setApiOrderbook, setApiStoreRefreshedAt, getOrderbook } = useApiStore()
    const [openChartOptions, showChartOptions] = useState(false)
    const chartOptionsDropdown = useRef<HTMLDivElement>(null)
    useClickOutside(chartOptionsDropdown, () => showChartOptions(false))

    // load data from rust api
    useQueries({
        queries: [
            {
                queryKey: ['ApiTokensQuery'],
                enabled: true,
                queryFn: async () => {
                    // fetch
                    const [tokensResponse] = await Promise.all([
                        fetch(`${APP_ROUTE}/api/local/tokens`, { method: 'GET', headers: { 'Content-Type': 'application/json' } }),
                    ])

                    // parse
                    const [tokensResponseJson] = (await Promise.all([tokensResponse.json()])) as [APIResponse<Token[]>]

                    // store
                    if (tokensResponseJson?.data) {
                        setApiTokens(tokensResponseJson.data)
                        toast.success(`Tokens list loaded`, { style: toastStyle })
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
                    const url = `${APP_ROUTE}/api/local/orderbook?token0=${sellToken.address}&token1=${buyToken.address}`
                    const [response] = await Promise.all([fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })])
                    const [responseJson] = (await Promise.all([response.json()])) as [APIResponse<AmmAsOrderbook>]
                    const pair = `${sellToken.address}-${buyToken.address}`
                    if (responseJson.data) {
                        setApiOrderbook(pair, responseJson.data)
                        toast.success(`Orderbook loaded for ${sellToken.symbol}-${buyToken.symbol}`, { style: toastStyle })
                        setApiStoreRefreshedAt(Date.now())
                        // todo set current trade as best bid
                    }
                    return { responseJson }
                },
                refetchOnWindowFocus: false,
                refetchInterval: orderBookRefreshIntervalMs,
            },
        ],
    })

    // prepare
    const metrics:
        | {
              showOrderbookPlaceholders: boolean
              orderbook?: AmmAsOrderbook
              highestBid?: AmmTrade
              lowestAsk?: AmmTrade
              midPrice: number
              totalBaseAmountInPools: number
              totalQuoteAmountInPools: number
              totalBaseTvlUsd: number
              totalQuoteTvlUsd: number
          }
        | {
              showOrderbookPlaceholders: boolean
              orderbook: AmmAsOrderbook
              highestBid: AmmTrade
              lowestAsk: AmmTrade
              midPrice: number
              totalBaseAmountInPools: number
              totalQuoteAmountInPools: number
              totalBaseTvlUsd: number
              totalQuoteTvlUsd: number
          } = {
        showOrderbookPlaceholders: true,
        highestBid: undefined,
        lowestAsk: undefined,
        midPrice: -1,
        totalBaseAmountInPools: -1,
        totalQuoteAmountInPools: -1,
        totalBaseTvlUsd: -1,
        totalQuoteTvlUsd: -1,
    }

    // ensure sell / buy are defined
    if (sellToken && buyToken) {
        const key = `${sellToken.address}-${buyToken.address}`

        // ensure orderbook is loaded
        metrics.orderbook = getOrderbook(key)
        if (metrics.orderbook?.bids && metrics.orderbook?.asks && metrics.orderbook?.base_lqdty && metrics.orderbook?.quote_lqdty) {
            metrics.highestBid = metrics.orderbook.bids.reduce(
                (max, t) => (t.average_sell_price > max.average_sell_price ? t : max),
                metrics.orderbook.bids[0],
            )
            metrics.lowestAsk = metrics.orderbook.asks.reduce(
                (min, t) => (t.average_sell_price > min.average_sell_price ? t : min),
                metrics.orderbook.asks[0],
            )
            metrics.midPrice = (metrics.highestBid.average_sell_price + 1 / metrics.lowestAsk.average_sell_price) / 2
            metrics.totalBaseAmountInPools = metrics.orderbook.base_lqdty.reduce((total, baseAmountInPool) => (total += baseAmountInPool), 0)
            metrics.totalQuoteAmountInPools = metrics.orderbook.quote_lqdty.reduce((total, quoteAmountInPool) => (total += quoteAmountInPool), 0)
            metrics.totalBaseTvlUsd = metrics.totalBaseAmountInPools * metrics.orderbook.base_worth_eth * metrics.orderbook.eth_usd
            metrics.totalQuoteTvlUsd = metrics.totalQuoteAmountInPools * metrics.orderbook.quote_worth_eth * metrics.orderbook.eth_usd

            // -
            metrics.showOrderbookPlaceholders = false
        }
    }

    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-11 gap-4">
            {/* left */}
            <div className="col-span-1 md:col-span-7 flex flex-col gap-4">
                {/* metrics */}
                <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-2">
                    {/* bid */}
                    {!metrics.showOrderbookPlaceholders && sellToken?.symbol && buyToken?.symbol && metrics.highestBid ? (
                        <OrderbookKeyMetric
                            title={`Best bid 1 ${sellToken.symbol}`}
                            content={
                                <div className="flex gap-1.5 items-center flex-wrap">
                                    <TokenImage size={20} token={buyToken} />
                                    <p className="text-milk font-bold text-base">{formatAmount(metrics.highestBid.average_sell_price)}</p>
                                </div>
                            }
                        />
                    ) : (
                        <OrderbookKeyMetric
                            title="Best bid"
                            content={
                                <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-2">
                                    <span className="animate-pulse rounded-full bg-milk-150" style={{ width: 20, height: 20 }} />
                                </div>
                            }
                        />
                    )}

                    {/* mid price */}
                    {!metrics.showOrderbookPlaceholders && sellToken?.symbol && buyToken?.symbol && metrics.midPrice ? (
                        <OrderbookKeyMetric
                            title={`Mid-price 1 ${sellToken.symbol}`}
                            content={
                                <div className="flex gap-1.5 items-center flex-wrap">
                                    <TokenImage size={20} token={buyToken} />
                                    <p className="text-milk font-bold text-base">{formatAmount(metrics.midPrice)}</p>
                                </div>
                            }
                        />
                    ) : (
                        <OrderbookKeyMetric
                            title="Mid-price"
                            content={
                                <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-2">
                                    <span className="animate-pulse rounded-full bg-milk-150" style={{ width: 20, height: 20 }} />
                                </div>
                            }
                        />
                    )}

                    {/* ask */}
                    {!metrics.showOrderbookPlaceholders && sellToken?.symbol && buyToken?.symbol && metrics.lowestAsk ? (
                        <OrderbookKeyMetric
                            // title="Best ask"
                            title={`Best ask 1 ${sellToken.symbol}`}
                            content={
                                <div className="flex gap-1.5 items-center flex-wrap">
                                    <TokenImage size={20} token={buyToken} />
                                    <p className="text-milk font-bold text-base">{formatAmount(1 / metrics.lowestAsk.average_sell_price)}</p>
                                </div>
                            }
                        />
                    ) : (
                        <OrderbookKeyMetric
                            title="Best ask"
                            content={
                                <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-2">
                                    <span className="animate-pulse rounded-full bg-milk-150" style={{ width: 20, height: 20 }} />
                                </div>
                            }
                        />
                    )}

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
                                    {numeral(
                                        (1 / metrics.lowestAsk.average_sell_price - metrics.highestBid.average_sell_price) / metrics.midPrice,
                                    ).format('0,0.[0000]%')}
                                </p>
                            }
                        />
                    ) : (
                        <OrderbookKeyMetric
                            title="Spread"
                            content={
                                <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-1">
                                    <p className="text-milk-100 font-bold text-base">0.00%</p>
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
                            content={<p className="text-milk font-bold text-base">{metrics.orderbook.block}</p>}
                        />
                    ) : (
                        <OrderbookKeyMetric
                            title="Last block"
                            content={
                                <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-1">
                                    <p className="text-milk-100 font-bold text-base">123456789</p>
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
                                <p className="text-milk font-bold text-base">${formatAmount(metrics.totalBaseTvlUsd + metrics.totalQuoteTvlUsd)}</p>
                            }
                        />
                    ) : (
                        <OrderbookKeyMetric
                            title="Total TVL"
                            content={
                                <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-1">
                                    <p className="text-milk-100 font-bold text-base">$100m</p>
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
                                    <p className="text-milk text-sm">{yAxisType === 'value' ? 'Linear' : `Log ${yAxisLogBase}`}</p>
                                    <IconWrapper icon={IconIds.TRIANGLE_DOWN} className="size-4" />
                                </div>

                                {/* options dropdown */}
                                <div
                                    ref={chartOptionsDropdown}
                                    className={cn(
                                        `z-20 absolute mt-2 w-52 rounded-2xl backdrop-blur-lg border border-milk-150 shadow-lg p-2.5 transition-all origin-top-left`,
                                        {
                                            'scale-100 opacity-100': openChartOptions,
                                            'scale-95 opacity-0 pointer-events-none': !openChartOptions,
                                        },
                                    )}
                                >
                                    {[OrderbookAxisScale.VALUE, OrderbookAxisScale.LOG].map((type, typeIndex) => (
                                        <div
                                            key={`${type}-${typeIndex}`}
                                            className={cn('flex items-center gap-2 w-full px-4 py-2 rounded-lg transition mt-1', {
                                                'text-white bg-gray-600/20': yAxisType === type,
                                                'text-milk-600 hover:bg-gray-600/20': yAxisType !== type,
                                            })}
                                            onClick={() => setYAxisType(type)}
                                        >
                                            <p className="text-sm">{type === 'value' ? 'Linear' : `Log ${yAxisLogBase}`}</p>
                                        </div>
                                    ))}
                                </div>
                            </button>
                        </div>
                    }
                    content={<DepthChart />}
                />

                {/* routes */}
                <OrderbookComponentLayout title={<p className="text-milk text-base font-bold">Routing</p>} content={undefined} />
            </div>

            {/* right */}
            <div className="col-span-1 md:col-span-4 flex flex-col gap-0.5">
                {/* sell */}
                <div className="bg-milk-600/5 flex flex-col gap-1 p-4 rounded-xl border-milk-150 w-full">
                    <div className="flex justify-between">
                        <p className="text-milk-600 text-xs">Sell</p>
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
                    <div className="flex justify-between gap-3">
                        <button
                            onClick={() => {
                                setSelectTokenModalFor('sell')
                                setShowSelectTokenModal(true)
                            }}
                            className="flex rounded-full bg-gray-600/30 transition-colors duration-300 hover:bg-gray-600/50 items-center gap-1.5 pl-1.5 pr-2 py-1.5 min-w-fit"
                        >
                            {sellToken ? (
                                <TokenImage size={24} token={sellToken} />
                            ) : (
                                <span className="animate-pulse rounded-full bg-milk-150" style={{ width: 24, height: 24 }} />
                            )}
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
                            value={numeral(metrics?.highestBid?.amount ?? 0).format('0,0.[00000]')}
                            onChange={(e) => {
                                const parsedNumber = Number(numeral(e.target.value ?? 0).value())
                                if (isNaN(parsedNumber)) return
                                setSellTokenAmountInput(parsedNumber)
                            }}
                        />
                    </div>
                    {metrics.highestBid && metrics.orderbook ? (
                        <div className="mt-2 flex justify-between items-center">
                            <div className="flex justify-between gap-1 items-center">
                                <IconWrapper icon={IconIds.WALLET} className="size-4 text-milk-400" />
                                <p className="text-milk-600 text-xs">{account.isConnected ? 'todo' : '-'}</p>
                            </div>
                            <p className="text-milk-600 text-xs">
                                ${' '}
                                {numeral(metrics.highestBid.amount * metrics.orderbook.eth_usd * metrics.orderbook.base_worth_eth).format('0,0.[00]')}
                            </p>
                        </div>
                    ) : (
                        <div className="mt-2 flex justify-between items-center">
                            <div className="flex justify-between gap-1 items-center">
                                <IconWrapper icon={IconIds.WALLET} className="size-4 text-milk-400" />
                                <p className="text-milk-600 text-xs">{account.isConnected ? 'todo' : '-'}</p>
                            </div>
                            <p className="text-milk-600 text-xs">$todo</p>
                        </div>
                    )}
                </div>

                {/* arrow */}
                <div className="h-0 w-full flex justify-center items-center z-10">
                    <div className="size-[44px] rounded-xl bg-background p-1">
                        <button
                            onClick={() => {
                                if (!metrics.showOrderbookPlaceholders) switchSelectedTokens()
                                // do nothing
                            }}
                            className={cn('size-full rounded-lg bg-milk-600/5 flex items-center justify-center', {
                                'cursor-not-allowed': metrics.showOrderbookPlaceholders,
                                group: !metrics.showOrderbookPlaceholders,
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
                            {buyToken ? (
                                <TokenImage size={24} token={buyToken} />
                            ) : (
                                <span className="animate-pulse rounded-full bg-milk-150" style={{ width: 24, height: 24 }} />
                            )}
                            {buyToken ? (
                                <p className="font-semibold tracking-wide">{buyToken.symbol}</p>
                            ) : (
                                <div className="skeleton-loading flex w-16 h-6 items-center justify-center rounded-full" />
                            )}
                            <IconWrapper icon={IconIds.TRIANGLE_DOWN} className="size-4" />
                        </button>
                        <input
                            type="text"
                            className="text-xl font-bold text-right border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none bg-transparent w-40"
                            value={numeral(metrics?.highestBid?.output ?? 0).format('0,0.[00000]')}
                            onChange={(e) => {
                                const parsedNumber = Number(numeral(e.target.value ?? 0).value())
                                if (isNaN(parsedNumber)) return
                                setBuyTokenAmountInput(parsedNumber)
                            }}
                        />
                    </div>

                    {metrics.highestBid && metrics.orderbook ? (
                        <div className="flex justify-between items-center">
                            <div className="flex justify-between gap-1 items-center">
                                <IconWrapper icon={IconIds.WALLET} className="size-4 text-milk-400" />
                                <p className="text-milk-600 text-xs">{account.isConnected ? 'todo' : '-'}</p>
                            </div>
                            <p className="text-milk-600 text-xs">
                                ${' '}
                                {numeral(metrics.highestBid.output * metrics.orderbook.eth_usd * metrics.orderbook.quote_worth_eth).format(
                                    '0,0.[00]',
                                )}
                            </p>
                        </div>
                    ) : (
                        <div className="mt-2 flex justify-between items-center">
                            <div className="flex justify-between gap-1 items-center">
                                <IconWrapper icon={IconIds.WALLET} className="size-4 text-milk-400" />
                                <p className="text-milk-600 text-xs">{account.isConnected ? 'todo' : '-'}</p>
                            </div>
                            <p className="text-milk-600 text-xs">$todo</p>
                        </div>
                    )}
                </div>

                {/* separator */}
                <div className="h-0 w-full" />

                {/* fees */}
                <div className="bg-milk-600/5 flex justify-between p-4 rounded-xl border-milk-150 text-xs">
                    <p className="text-milk-600 truncate">
                        {sellToken && buyToken && metrics.highestBid && metrics.orderbook
                            ? `1 ${sellToken.symbol} = ${formatAmount((1 / metrics.highestBid.amount) * metrics.highestBid.output)} ${buyToken.symbol}
                            ($ ${formatAmount(
                                (1 / metrics.highestBid.amount) *
                                    metrics.highestBid.output *
                                    metrics.orderbook.eth_usd *
                                    metrics.orderbook.quote_worth_eth,
                            )}
                            )`
                            : sellToken && buyToken
                              ? `1 ${sellToken.symbol} = [...] ${buyToken.symbol}`
                              : `[...]`}
                    </p>
                    <div className="flex gap-1.5 items-center">
                        <IconWrapper icon={IconIds.GAS} className="size-4 text-milk-600" />
                        <ChainImage networkName="ethereum" className="size-4" />
                        <p className="text-milk-600">
                            ${' '}
                            {metrics.highestBid?.gas_costs_usd
                                ? formatAmount(metrics.highestBid.gas_costs_usd.reduce((cost, curr) => (cost += curr), 0))
                                : '-'}
                        </p>
                        {/* <p className="text-milk-600">$ {JSON.stringify(highestBid.gas_costs_usd)}</p> */}
                        <IconWrapper icon={IconIds.TRIANGLE_DOWN} className="size-4" />
                    </div>
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
