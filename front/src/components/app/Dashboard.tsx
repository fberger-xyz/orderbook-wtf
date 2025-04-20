'use client'

import { OrderbookSide } from '@/enums'
import { useAppStore } from '@/stores/app.store'
import { AmmAsOrderbook, StructuredOutput } from '@/interfaces'
import { defaultHeaders, fetchWithTimeout, getHighestBid, mergeOrderbooks, simulateTradeForAmountIn } from '@/utils'
import { useQueries } from '@tanstack/react-query'
import { useApiStore } from '@/stores/api.store'
import { APP_ROUTE, CHAINS_CONFIG } from '@/config/app.config'
import toast from 'react-hot-toast'
import { toastStyle } from '@/config/toasts.config'
import PoolsTVLSection from './dashboard-sections/PoolsTVLSection'
import RoutingSection from './dashboard-sections/RoutingSection'
import MarketDepthSection from './dashboard-sections/MarketDepthSection'
import SwapSection from './dashboard-sections/SwapSection'
import KPIsSection from './dashboard-sections/KPIsSection'

export default function Dashboard() {
    const { sellToken, sellTokenAmountInput, buyToken, currentChainId, setIsRefreshingMarketDepth, selectOrderbookTrade, getAddressPair } =
        useAppStore()

    const { orderBookRefreshIntervalMs, setApiTokens, setApiPairs, setApiOrderbook, setApiStoreRefreshedAt } = useApiStore()

    useQueries({
        queries: [
            {
                queryKey: ['ApiTokensQuery', currentChainId],
                enabled: true,
                queryFn: async () => {
                    const supportedChains = Object.values(CHAINS_CONFIG).filter((chain) => chain.supported)
                    const fetchPromises = supportedChains.map((chain) => {
                        const url = `${APP_ROUTE}/api/tokens?chain=${chain.id}`
                        return fetchWithTimeout(url, { method: 'GET', headers: defaultHeaders })
                    })
                    const fetchResponses = await Promise.all(fetchPromises)
                    const jsonPromises = fetchResponses.map((promise) => promise.json())
                    const tokensPerChain = await Promise.all(jsonPromises)
                    for (let chainIndex = 0; chainIndex < tokensPerChain.length; chainIndex++)
                        if (supportedChains[chainIndex]) setApiTokens(supportedChains[chainIndex].id, tokensPerChain[chainIndex].data ?? [])
                    return tokensPerChain
                },
                refetchOnWindowFocus: false,
                refetchInterval: 1000 * 60 * 5,
            },
            {
                queryKey: ['ApiPairsQuery'],
                enabled: true,
                queryFn: async () => {
                    const supportedChains = Object.values(CHAINS_CONFIG).filter((chain) => chain.supported)
                    const fetchPromises = supportedChains.map((chain) => {
                        const url = `${APP_ROUTE}/api/pairs?chain=${chain.id}`
                        return fetchWithTimeout(url, { method: 'GET', headers: defaultHeaders })
                    })
                    const fetchResponses = await Promise.all(fetchPromises)
                    const jsonPromises = fetchResponses.map((promise) => promise.json())
                    const pairsPerChain = await Promise.all(jsonPromises)
                    for (let chainIndex = 0; chainIndex < pairsPerChain.length; chainIndex++)
                        if (supportedChains[chainIndex]) setApiPairs(supportedChains[chainIndex].id, pairsPerChain[chainIndex].data ?? [])
                    return pairsPerChain
                },
                refetchOnWindowFocus: false,
                refetchInterval: 1000 * 60 * 5,
            },
            {
                queryKey: ['ApiOrderbookQuery', currentChainId, sellToken.address, buyToken.address],
                enabled: true,
                queryFn: async () => {
                    // fetch all orderbook
                    const url = `${APP_ROUTE}/api/orderbook?chain=${CHAINS_CONFIG[currentChainId].apiId}&token0=${sellToken.address}&token1=${buyToken.address}`
                    const orderbookResponse = await fetchWithTimeout(url, { method: 'GET', headers: defaultHeaders })

                    // parse
                    const orderbookJson = (await orderbookResponse.json()) as StructuredOutput<AmmAsOrderbook>

                    // prevent request errors
                    if (orderbookJson.error) {
                        if (orderbookJson.error.includes('pair has 0 associated components'))
                            toast.error(`No pool for pair ${sellToken.symbol}-${buyToken.symbol} > select another pair`, { style: toastStyle })
                        else toast.error(`${orderbookJson.error}`, { style: toastStyle })
                        return orderbookJson
                    }

                    // prevent format errors
                    const newOrderbook = orderbookJson.data
                    if (!newOrderbook) {
                        toast.error(`Empty orderbook. Check API status.`, { style: toastStyle })
                        return orderbookJson
                    }
                    if (!newOrderbook.bids.length) {
                        toast.error(`Bad orderbook format: no bids. Check API status.`, { style: toastStyle })
                        return orderbookJson
                    }
                    if (!newOrderbook.asks.length) {
                        toast.error(`Bad orderbook format: missing asks. Check API status.`, { style: toastStyle })
                        return orderbookJson
                    }
                    if (!newOrderbook.pools.length) {
                        toast.error(`Bad orderbook format: missing pools. Check API status.`, { style: toastStyle })
                        return orderbookJson
                    }

                    try {
                        // state
                        setIsRefreshingMarketDepth(true)

                        // simulate current trade if need be
                        const orderbookWithTrade = await simulateTradeForAmountIn(currentChainId, sellToken, buyToken, sellTokenAmountInput)

                        // merge
                        const nextOrderbook = orderbookJson.data
                        const mergedOrderbook = mergeOrderbooks(nextOrderbook, orderbookWithTrade)

                        // state
                        setApiOrderbook(getAddressPair(), mergedOrderbook)

                        // set current trade as the one we just refreshed
                        const newTradeEntry = orderbookWithTrade && orderbookWithTrade?.bids?.length > 0 ? orderbookWithTrade?.bids[0] : undefined
                        if (newTradeEntry)
                            selectOrderbookTrade({
                                side: OrderbookSide.BID,
                                amountIn: newTradeEntry.amount,
                                selectedAt: Date.now(),
                                trade: newTradeEntry,
                                pools: newOrderbook.pools,
                                xAxis: newTradeEntry.average_sell_price,
                            })
                        else {
                            // or set current trade as the highest bid
                            const highestBid = getHighestBid(newOrderbook)
                            if (highestBid) {
                                selectOrderbookTrade({
                                    side: OrderbookSide.BID,
                                    amountIn: highestBid.amount,
                                    selectedAt: Date.now(),
                                    trade: highestBid,
                                    pools: newOrderbook.pools,
                                    xAxis: highestBid.average_sell_price,
                                })
                            }
                        }
                    } catch (error) {
                    } finally {
                        // trigger an ui refresh
                        setApiStoreRefreshedAt(Date.now())
                        setIsRefreshingMarketDepth(false)
                    }

                    // notify
                    toast.success(`Market depth for ${sellToken.symbol}-${buyToken.symbol} updated just now`, { style: toastStyle })

                    // -
                    return orderbookJson
                },
                refetchOnWindowFocus: false,
                refetchInterval: orderBookRefreshIntervalMs[currentChainId] * 0.85, // small hack to avoid counter to freeze a few secs at 0
            },
        ],
    })

    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-10 gap-4">
            <div className="col-span-1 md:col-span-6 flex flex-col gap-4 xl:col-span-7">
                <KPIsSection />
                <MarketDepthSection />
                <RoutingSection />
                <PoolsTVLSection />
            </div>
            <SwapSection />
        </div>
    )
}
