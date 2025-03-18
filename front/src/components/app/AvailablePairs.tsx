'use client'

import { useQueries } from '@tanstack/react-query'
import { root } from '@/config/app.config'
import Pair from './Pair'
import { APIResponse, Token } from '@/interfaces'
import { useAppStore } from '@/stores/app.store'

export default function AvailablePairs() {
    const { setAvailableTokens } = useAppStore()
    const [pairsQuery] = useQueries({
        queries: [
            {
                queryKey: ['AvailablePairsQuery'],
                enabled: true,
                queryFn: async () => {
                    const [tokensResponse] = await Promise.all([
                        fetch(`${root}/api/local/tokens`, { method: 'GET', headers: { 'Content-Type': 'application/json' } }),
                    ])
                    const [tokensResponseJson] = (await Promise.all([tokensResponse.json()])) as [APIResponse<Token[]>]
                    if (tokensResponseJson?.data) setAvailableTokens(tokensResponseJson.data)
                    return { tokensResponseJson }
                },
                refetchOnWindowFocus: false,
                refetchInterval: 1000 * 10,
            },
        ],
    })

    return (
        <div className="flex flex-col gap-3 w-full">
            <p className="font-bold mx-auto">Available pairs</p>
            {(pairsQuery.data?.tokensResponseJson?.data ?? []).map((pair, pairIndex) => (
                <Pair key={`${pair}-${pairIndex}`} pair={pair.symbol} />
            ))}
        </div>
    )
}
