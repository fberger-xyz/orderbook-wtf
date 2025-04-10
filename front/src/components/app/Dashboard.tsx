'use client'

import { OrderbookSide } from '@/enums'
import { useAppStore } from '@/stores/app.store'
import { AmmAsOrderbook, RustApiPair, StructuredOutput, Token } from '@/interfaces'
import { extractErrorMessage } from '@/utils'
import { useQueries } from '@tanstack/react-query'
import { useApiStore } from '@/stores/api.store'
import { APP_ROUTE } from '@/config/app.config'
import toast from 'react-hot-toast'
import { toastStyle } from '@/config/toasts.config'
import PoolsTVLSection from './dashboard-sections/PoolsTVLSection'
import RoutingSection from './dashboard-sections/RoutingSection'
import MarketDepthSection from './dashboard-sections/MarketDepthSection'
import SwapSection from './dashboard-sections/SwapSection'
import KPIsSection from './dashboard-sections/KPIsSection'

export default function Dashboard() {
    const { sellToken, sellTokenAmountInput, buyToken, currentChainName, setIsLoadingSomeTrade, selectOrderbookTrade, getAddressPair } = useAppStore()

    const { orderBookRefreshIntervalMs, setApiTokens, setApiPairs, setApiOrderbook, setApiStoreRefreshedAt, getOrderbook } = useApiStore()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [ApiTokensQuery, ApiPairsQuery, ApiOrderbookQuery] = useQueries({
        queries: [
            {
                queryKey: ['ApiTokensQuery', currentChainName],
                enabled: true,
                queryFn: async () => {
                    const tokensEndpoint = `${APP_ROUTE}/api/local/tokens?chain=${currentChainName}`
                    const tokensResponse = await fetch(tokensEndpoint, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                    })
                    const tokensResponseJson = (await tokensResponse.json()) as StructuredOutput<Token[]>
                    setApiTokens(tokensResponseJson.data ?? [])
                    return tokensResponseJson.data
                },
                refetchOnWindowFocus: false,
                refetchInterval: 1000 * 60 * 5,
            },
            {
                queryKey: ['ApiPairsQuery', currentChainName],
                enabled: true,
                queryFn: async () => {
                    const pairsEndpoint = `${APP_ROUTE}/api/local/pairs?chain=${currentChainName}`
                    const pairsResponse = await fetch(pairsEndpoint, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                    })
                    const pairsResponseJson = (await pairsResponse.json()) as StructuredOutput<RustApiPair[]>
                    setApiPairs(pairsResponseJson.data ?? [])
                    return pairsResponseJson.data
                },
                refetchOnWindowFocus: false,
                refetchInterval: 1000 * 60 * 5,
            },
            {
                queryKey: ['ApiOrderbookQuery', currentChainName, sellToken.address, buyToken.address],
                enabled: true,
                queryFn: async () => {
                    // -
                    const debug = false

                    // fetch all orderbook
                    const url = `${APP_ROUTE}/api/local/orderbook?chain=${currentChainName}&token0=${sellToken.address}&token1=${buyToken.address}`
                    const orderbookResponse = await fetch(url, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                    })

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
                    if (!orderbookJson.data?.bids || !orderbookJson.data?.asks) {
                        toast.error(`Bad orderbook format`, { style: toastStyle })
                        return orderbookJson
                    }

                    // handle store update
                    if (orderbookJson.data) {
                        setApiOrderbook(getAddressPair(), orderbookJson.data)
                        const mustRefreshSelectingTradeToo = sellTokenAmountInput !== undefined && sellTokenAmountInput > 0
                        if (debug) console.log(`ApiOrderbookQuery: mustRefreshSelectingTradeToo =`, mustRefreshSelectingTradeToo)
                        if (mustRefreshSelectingTradeToo) await simulateTradeAndMergeOrderbook(sellTokenAmountInput)
                        toast.success(`${sellToken.symbol}-${buyToken.symbol} orderbook data updated just now`, { style: toastStyle })
                        setApiStoreRefreshedAt(Date.now())
                    }

                    return orderbookJson
                },
                refetchOnWindowFocus: false,
                refetchInterval: orderBookRefreshIntervalMs - 2000,
            },
        ],
    })

    const simulateTradeAndMergeOrderbook = async (amountIn: number) => {
        const debug = false
        try {
            setIsLoadingSomeTrade(true)

            // prevent errors
            const pair = getAddressPair()
            const orderbook = getOrderbook(pair)
            if (!orderbook) return

            // notify
            // toast(`Refreshing selected trade ...`, { style: toastStyle })

            // fetch trade data
            const url = `${APP_ROUTE}/api/local/orderbook?chain=${currentChainName}&token0=${sellToken.address}&token1=${buyToken.address}&pointAmount=${amountIn}&pointToken=${sellToken.address}`
            const tradeResponse = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })
            const tradeResponseJson = (await tradeResponse.json()) as StructuredOutput<AmmAsOrderbook>
            if (!tradeResponseJson.data) return

            // nb: can only be a bid for now
            const side = OrderbookSide.BID

            // prevent errors
            if (!side) return

            // ease access
            const newTradeEntry = tradeResponseJson.data?.bids.length > 0 ? tradeResponseJson.data.bids[0] : null

            // -
            if (debug) console.log(`Dashboard/simulateTradeAndMergeOrderbook`, { newTradeEntry })

            // prevent errors
            if (!newTradeEntry) return

            // new orderbook
            // nb: make sure we have the same amount of pools
            const newOrderbook = {
                ...tradeResponseJson.data,

                // filter out previous entry for same trade
                bids: [...orderbook.bids.filter((bid) => newTradeEntry.amount !== bid.amount), ...tradeResponseJson.data.bids],
                asks: orderbook.asks,
                pools: orderbook.pools,
            }

            // update state
            setApiOrderbook(pair, newOrderbook)

            // -
            const newSelectedTrade = {
                side: OrderbookSide.BID,
                amountIn,
                selectedAt: Date.now(),
                trade: newTradeEntry,
                pools: newOrderbook.pools,
                xAxis: newTradeEntry.average_sell_price,
            }
            selectOrderbookTrade(newSelectedTrade)

            // notify
            // toast.success(`Simulation`, { style: toastStyle })
        } catch (error) {
            toast.error(`Unexpected error while fetching price: ${extractErrorMessage(error)}`, { style: toastStyle })
        } finally {
            setIsLoadingSomeTrade(false)
        }
    }

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
