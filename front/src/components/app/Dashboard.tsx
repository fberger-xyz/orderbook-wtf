'use client'

import { OrderbookSide } from '@/enums'
import { useAppStore } from '@/stores/app.store'
import { useState } from 'react'
import { AmmAsOrderbook, DashboardMetrics, StructuredOutput, Token } from '@/interfaces'
import { extractErrorMessage, getDashboardMetrics } from '@/utils'
import { useQueries } from '@tanstack/react-query'
import { useApiStore } from '@/stores/api.store'
import { APP_ROUTE } from '@/config/app.config'
import toast from 'react-hot-toast'
import { toastStyle } from '@/config/toasts.config'
import LiquidityBreakdownSection from './dashboard-sections/LiquidityBreakdownSection'
import RoutingSection from './dashboard-sections/RoutingSection'
import MarketDepthSection from './dashboard-sections/MarketDepthSection'
import SwapSection from './dashboard-sections/SwapSection'
import KPIsSection from './dashboard-sections/KPIsSection'

export default function Dashboard() {
    const { sellToken, sellTokenAmountInput, buyToken, setIsLoadingSomeTrade, selectOrderbookTrade, getAddressPair } = useAppStore()

    const { orderBookRefreshIntervalMs, setApiTokens, setApiOrderbook, setApiStoreRefreshedAt, getOrderbook } = useApiStore()

    const [metrics, setMetrics] = useState<DashboardMetrics>(getDashboardMetrics(undefined, undefined, undefined))

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [ApiTokensQuery, ApiOrderbookQuery] = useQueries({
        queries: [
            {
                queryKey: ['ApiTokensQuery'],
                enabled: true,
                queryFn: async () => {
                    const tokensEndpoint = `${APP_ROUTE}/api/local/tokens`
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
                queryKey: ['ApiOrderbookQuery', sellToken?.address, buyToken?.address],
                enabled: true,
                queryFn: async () => {
                    if (!sellToken?.address || !buyToken?.address) return null

                    const url = `${APP_ROUTE}/api/local/orderbook?token0=${sellToken.address}&token1=${buyToken.address}`
                    const orderbookResponse = await fetch(url, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                    })
                    const orderbookJson = (await orderbookResponse.json()) as StructuredOutput<AmmAsOrderbook>

                    if (orderbookJson.error) {
                        if (orderbookJson.error.includes('pair has 0 associated components')) {
                            toast.error(`No pool for pair ${sellToken.symbol}-${buyToken.symbol} > select another pair`, { style: toastStyle })
                        } else {
                            toast.error(`${orderbookJson.error}`, { style: toastStyle })
                        }
                    } else if (!orderbookJson.data?.bids || !orderbookJson.data?.asks) {
                        toast.error(`Bad orderbook format`, { style: toastStyle })
                    } else if (orderbookJson.data) {
                        setApiOrderbook(getAddressPair(), orderbookJson.data)
                        toast.success(`${sellToken.symbol}-${buyToken.symbol} orderbook data updated just now`, { style: toastStyle })
                        const orderbook = getOrderbook(getAddressPair())
                        setMetrics(getDashboardMetrics(orderbook, sellToken, buyToken))
                        setApiStoreRefreshedAt(Date.now())
                        if (sellTokenAmountInput) {
                            await simulateTradeAndMergeOrderbook(sellTokenAmountInput)
                        }
                    }

                    return orderbookJson
                },
                refetchOnWindowFocus: false,
                refetchInterval: orderBookRefreshIntervalMs,
            },
        ],
    })

    const simulateTradeAndMergeOrderbook = async (amountIn: number) => {
        try {
            setIsLoadingSomeTrade(true)

            const url = `${APP_ROUTE}/api/local/orderbook?token0=${sellToken?.address}&token1=${buyToken?.address}&pointAmount=${amountIn}&pointToken=${sellToken?.address}`
            const tradeResponse = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })
            const tradeResponseJson = (await tradeResponse.json()) as StructuredOutput<AmmAsOrderbook>

            const pair = getAddressPair()
            const orderbook = getOrderbook(pair)

            if (!tradeResponseJson.data || !orderbook) return

            const newOrderbook = {
                ...orderbook,
                bids: [...orderbook.bids, ...tradeResponseJson.data.bids],
                asks: [...orderbook.asks, ...tradeResponseJson.data.asks],
                base_worth_eth: tradeResponseJson.data.base_worth_eth,
                quote_worth_eth: tradeResponseJson.data.quote_worth_eth,
                block: tradeResponseJson.data.block,
            }

            setApiOrderbook(pair, newOrderbook)

            const newSelectedTrade = {
                side: OrderbookSide.BID,
                amountIn,
                selectedAt: Date.now(),
                trade: newOrderbook.bids.find((bid) => bid.amount === amountIn),
                pools: newOrderbook.pools,
                toDisplay: true,
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
                <KPIsSection metrics={metrics} />
                <MarketDepthSection />
                <RoutingSection metrics={metrics} />
                <LiquidityBreakdownSection metrics={metrics} />
            </div>
            <SwapSection metrics={metrics} />
        </div>
    )
}
