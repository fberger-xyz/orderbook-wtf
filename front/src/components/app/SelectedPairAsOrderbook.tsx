'use client'

import { useQueries } from '@tanstack/react-query'
import { APP_ROUTE } from '@/config/app.config'
import { AmmAsOrderbook, APIResponse } from '@/interfaces'
import { useAppStore } from '@/stores/app.store'
import { ChartLayout } from '../charts/ChartsCommons'
import DepthChart from '../charts/DepthChart'

export default function SelectedPairAsOrderbook() {
    const { selectedPair, loadedOrderbooks, sellToken, buyToken, saveLoadedOrderbook } = useAppStore()
    const [selectedPairAsOrderbookQuery] = useQueries({
        queries: [
            {
                queryKey: ['selectedPairAsOrderbookQuery', selectedPair],
                enabled: true,
                queryFn: async () => {
                    // if (!selectedPair) return null
                    if (!sellToken?.address || !buyToken?.address) return null
                    const [response] = await Promise.all([
                        fetch(`${APP_ROUTE}/api/local/orderbook?token0=${sellToken.address}&token1=${buyToken.address}`, {
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json' },
                        }),
                    ])
                    const [responseJson] = (await Promise.all([response.json()])) as [APIResponse<AmmAsOrderbook>]
                    console.log({ responseJson })
                    const pair = `${sellToken.address}-${buyToken.address}`
                    saveLoadedOrderbook(pair, responseJson.data)
                    return { responseJson }
                },
                refetchOnWindowFocus: false,
                refetchInterval: 1000 * 20,
            },
        ],
    })

    return (
        <div className="flex flex-col gap-3 size-full">
            {/* <p className="font-bold mx-auto">Orderbook</p> */}
            {!sellToken?.address || !buyToken?.address ? (
                <div className="size-full rounded-xl skeleton-loading flex items-center justify-center">
                    <p>Select a pair first</p>
                </div>
            ) : !loadedOrderbooks[`${sellToken.address}-${buyToken.address}`] &&
              (selectedPairAsOrderbookQuery.isLoading || selectedPairAsOrderbookQuery.isFetching || selectedPairAsOrderbookQuery.isRefetching) ? (
                <div className="size-full rounded-xl skeleton-loading flex items-center justify-center">
                    <p>Loading orderbook...</p>
                </div>
            ) : !loadedOrderbooks[`${sellToken.address}-${buyToken.address}`] ? (
                <div className="size-full rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <p>No orderbook found for this pair</p>
                </div>
            ) : (
                <ChartLayout
                    title={`Ethereum ${sellToken.symbol}/${buyToken.symbol} - market depth`}
                    // subtitle={`Work in progress 🚧`}
                    chart={<DepthChart orderbook={loadedOrderbooks[`${sellToken.address}-${buyToken.address}`] as AmmAsOrderbook} />}
                />
            )}
        </div>
    )
}
