'use client'

import { useQueries } from '@tanstack/react-query'
import { root } from '@/config/app.config'
import Pair from './Pair'
import { APIResponse } from '@/interfaces'

export default function AvailablePairs() {
    const [pairsQuery] = useQueries({
        queries: [
            {
                queryKey: ['AvailablePairsQuery'],
                enabled: true,
                queryFn: async () => {
                    const [pairsResponse] = await Promise.all([
                        fetch(`${root}/api/pairs`, { method: 'GET', headers: { 'Content-Type': 'application/json' } }),
                    ])
                    const [pairsJson] = (await Promise.all([pairsResponse.json()])) as [APIResponse<string[]>]
                    console.log({ pairsJson })
                    return { pairsJson }
                },
                refetchOnWindowFocus: false,
                refetchInterval: 1000 * 10,
            },
        ],
    })

    return (
        <div className="flex flex-col gap-3 w-full">
            <p className="font-bold mx-auto">Available pairs</p>
            {pairsQuery.data?.pairsJson?.data
                ?.filter((pair) => !pair.includes('before'))
                .map((pair, pairIndex) => <Pair key={`${pair}-${pairIndex}`} pair={pair} />)}
        </div>
    )
}
