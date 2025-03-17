'use client'

import { useQueries } from '@tanstack/react-query'
import { root } from '@/config/app.config'
import { AmmAsOrderbook, APIResponse } from '@/interfaces'
import { useAppStore } from '@/stores/app.store'
import { ChartLayout } from '../charts/ChartsCommons'
import DepthChart from '../charts/DepthChart'

export default function SelectedPairAsOrderbook() {
    const { selectedPair, loadedOrderbooks, saveLoadedOrderbook } = useAppStore()
    const [selectedPairAsOrderbookQuery] = useQueries({
        queries: [
            {
                queryKey: ['selectedPairAsOrderbookQuery', selectedPair],
                enabled: true,
                queryFn: async () => {
                    if (!selectedPair) return null
                    const [response] = await Promise.all([
                        fetch(`${root}/api/orderbook?fileName=${selectedPair}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } }),
                    ])
                    const [responseJson] = (await Promise.all([response.json()])) as [APIResponse<AmmAsOrderbook>]
                    console.log({ responseJson })
                    saveLoadedOrderbook(selectedPair, responseJson.data)
                    return { responseJson }
                },
                refetchOnWindowFocus: false,
                refetchInterval: 1000 * 10,
            },
        ],
    })

    return (
        <div className="flex flex-col gap-3 size-full">
            <p className="font-bold mx-auto">Orderbook</p>
            {selectedPairAsOrderbookQuery.isLoading || selectedPairAsOrderbookQuery.isFetching || selectedPairAsOrderbookQuery.isRefetching ? (
                <div className="size-full rounded-xl skeleton-loading flex items-center justify-center">
                    <p>Loading orderbook...</p>
                </div>
            ) : !selectedPair ? (
                <div className="size-full rounded-xl skeleton-loading flex items-center justify-center">
                    <p>Select a pair first</p>
                </div>
            ) : !loadedOrderbooks[selectedPair] ? (
                <div className="size-full rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <p>No orderbook found for this pair</p>
                </div>
            ) : (
                <ChartLayout
                    title={`Ethereum ${loadedOrderbooks[selectedPair]?.token0.symbol}/${loadedOrderbooks[selectedPair]?.token1.symbol} - market depth`}
                    subtitle={`Work in progress 🚧`}
                    chart={<DepthChart orderbook={loadedOrderbooks[selectedPair] as AmmAsOrderbook} />}
                />
            )}
        </div>
    )
}
