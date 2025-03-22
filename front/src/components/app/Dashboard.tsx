'use client'

// import AvailablePairs from './AvailablePairs'
import SelectedPairAsOrderbook from './SelectedPairAsOrderbook'
import SelectedTrade from './SelectedTrade'
import { useQueries } from '@tanstack/react-query'
import { root } from '@/config/app.config'
import { APIResponse, Token } from '@/interfaces'
import { useAppStore } from '@/stores/app.store'

/**
 * take inspiration from
 * - https://app.uniswap.org/explore/pools/ethereum/0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640
 * - https://app.spectra.finance/pools/eth:0xad6cd1aceb6e919e4c4918503c22a3f531cf8276
 */

export default function Dashboard() {
    const { setAvailableTokens } = useAppStore()
    useQueries({
        queries: [
            {
                queryKey: ['AvailableTokensQuery'],
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
                refetchInterval: 1000 * 60 * 5,
            },
        ],
    })

    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-10 gap-6">
            <div className="col-span-1 md:col-span-7">
                <SelectedPairAsOrderbook />
            </div>
            <div className="col-span-1 md:col-span-3">
                <SelectedTrade />
            </div>
        </div>
    )
}
