'use client'

import { AppSupportedChains, OrderbookSide } from '@/enums'
import { useAppStore } from '@/stores/app.store'
import { AmmAsOrderbook, RustApiPair, StructuredOutput, Token } from '@/interfaces'
import { extractErrorMessage, fetchWithTimeout } from '@/utils'
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

const headers = { 'Content-Type': 'application/json' }

export default function Dashboard() {
    const { sellToken, sellTokenAmountInput, buyToken, currentChainId, setIsLoadingSomeTrade, selectOrderbookTrade, getAddressPair } = useAppStore()

    const { orderBookRefreshIntervalMs, setApiTokens, setApiPairs, setApiOrderbook, setApiStoreRefreshedAt, getOrderbook } = useApiStore()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [ApiTokensQuery, ApiPairsQuery, ApiOrderbookQuery] = useQueries({
        queries: [
            {
                queryKey: ['ApiTokensQuery', currentChainId],
                enabled: true,
                // todo promise.all
                queryFn: async () => {
                    // mainnet
                    const mainnetTokensEndpoint = `${APP_ROUTE}/api/tokens?chain=${CHAINS_CONFIG[AppSupportedChains.ETHEREUM].apiId}`
                    const mainnetTokensResponse = await fetchWithTimeout(mainnetTokensEndpoint, { method: 'GET', headers })
                    const mainnetTokensResponseJson = (await mainnetTokensResponse.json()) as StructuredOutput<Token[]>
                    setApiTokens(AppSupportedChains.ETHEREUM, mainnetTokensResponseJson.data ?? [])

                    // base
                    const baseTokensEndpoint = `${APP_ROUTE}/api/tokens?chain=${CHAINS_CONFIG[AppSupportedChains.BASE].apiId}`
                    const baseTokensResponse = await fetchWithTimeout(baseTokensEndpoint, { method: 'GET', headers })
                    const baseTokensResponseJson = (await baseTokensResponse.json()) as StructuredOutput<Token[]>
                    setApiTokens(AppSupportedChains.BASE, baseTokensResponseJson.data ?? [])

                    // unichain
                    const unichainTokensEndpoint = `${APP_ROUTE}/api/tokens?chain=${CHAINS_CONFIG[AppSupportedChains.UNICHAIN].apiId}`
                    const unichainTokensResponse = await fetchWithTimeout(unichainTokensEndpoint, { method: 'GET', headers })
                    const unichainTokensResponseJson = (await unichainTokensResponse.json()) as StructuredOutput<Token[]>
                    setApiTokens(AppSupportedChains.UNICHAIN, unichainTokensResponseJson.data ?? [])

                    // all
                    return [mainnetTokensResponseJson.data, baseTokensResponseJson.data, unichainTokensResponseJson.data]
                },
                refetchOnWindowFocus: false,
                refetchInterval: 1000 * 60 * 5,
            },
            {
                queryKey: ['ApiPairsQuery'],
                enabled: true,
                queryFn: async () => {
                    // mainnet
                    const mainnetPairsUrl = `${APP_ROUTE}/api/pairs?chain=${CHAINS_CONFIG[AppSupportedChains.ETHEREUM].apiId}`
                    const mainnetPairsResponse = await fetchWithTimeout(mainnetPairsUrl, { method: 'GET', headers })
                    const mainnetPairsResponseJson = (await mainnetPairsResponse.json()) as StructuredOutput<RustApiPair[]>
                    setApiPairs(AppSupportedChains.ETHEREUM, mainnetPairsResponseJson.data ?? [])

                    // base
                    const basePairsUrl = `${APP_ROUTE}/api/pairs?chain=${CHAINS_CONFIG[AppSupportedChains.BASE].apiId}`
                    const basePairsResponse = await fetchWithTimeout(basePairsUrl, { method: 'GET', headers })
                    const basePairsResponseJson = (await basePairsResponse.json()) as StructuredOutput<RustApiPair[]>
                    setApiPairs(AppSupportedChains.BASE, basePairsResponseJson.data ?? [])

                    // unichain
                    const unichainPairsUrl = `${APP_ROUTE}/api/pairs?chain=${CHAINS_CONFIG[AppSupportedChains.UNICHAIN].apiId}`
                    const unichainPairsResponse = await fetchWithTimeout(unichainPairsUrl, { method: 'GET', headers })
                    const unichainPairsResponseJson = (await unichainPairsResponse.json()) as StructuredOutput<RustApiPair[]>
                    setApiPairs(AppSupportedChains.UNICHAIN, unichainPairsResponseJson.data ?? [])

                    // all
                    return [mainnetPairsResponseJson.data, basePairsResponseJson.data, unichainPairsResponseJson.data]
                },
                refetchOnWindowFocus: false,
                refetchInterval: 1000 * 60 * 5,
            },
            {
                queryKey: ['ApiOrderbookQuery', currentChainId, sellToken.address, buyToken.address],
                enabled: true,
                queryFn: async () => {
                    // -
                    const debug = false

                    // fetch all orderbook
                    const url = `${APP_ROUTE}/api/orderbook?chain=${CHAINS_CONFIG[currentChainId].apiId}&token0=${sellToken.address}&token1=${buyToken.address}`
                    const orderbookResponse = await fetchWithTimeout(url, { method: 'GET', headers })

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

                    // -
                    if (orderbookJson.data) {
                        setApiOrderbook(getAddressPair(), orderbookJson.data)
                        const mustRefreshSelectingTradeToo = sellTokenAmountInput !== undefined && sellTokenAmountInput > 0
                        if (debug) console.log(`ApiOrderbookQuery: mustRefreshSelectingTradeToo =`, mustRefreshSelectingTradeToo)
                        if (mustRefreshSelectingTradeToo) await simulateTradeAndMergeOrderbook(sellTokenAmountInput)
                        setApiStoreRefreshedAt(Date.now())
                        toast.success(`Market depth for ${sellToken.symbol}-${buyToken.symbol} updated just now`, { style: toastStyle })
                    }

                    return orderbookJson
                },
                refetchOnWindowFocus: false,
                refetchInterval: orderBookRefreshIntervalMs[currentChainId] * 0.9, // small hack to avoid counter to stop at 0
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

            // fetch trade data
            const url = `${APP_ROUTE}/api/orderbook?chain=${currentChainId}&token0=${sellToken.address}&token1=${buyToken.address}&pointAmount=${amountIn}&pointToken=${sellToken.address}`
            const tradeResponse = await fetchWithTimeout(url, { method: 'GET', headers })
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
            // todo: make sure we have the same amount of pools
            const newOrderbook = {
                ...tradeResponseJson.data,

                // filter out previous entry for same trade
                bids: [...orderbook.bids.filter((bid) => newTradeEntry.amount !== bid.amount), ...tradeResponseJson.data.bids],
                asks: orderbook.asks,
                pools: orderbook.pools,
                timestamp: Math.max(tradeResponseJson.data.timestamp, orderbook.timestamp),
                block: Math.max(tradeResponseJson.data.block, orderbook.block),
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
            {/* {IS_DEV && <pre>{JSON.stringify(metrics, null, 2)}</pre>} */}
        </div>
    )
}
