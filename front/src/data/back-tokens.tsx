import { AppSupportedChains } from '@/enums'
import { Token } from '@/interfaces'

export const hardcodedTokensList: Record<AppSupportedChains, Token[]> = {
    [AppSupportedChains.ETHEREUM]: [
        {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            decimals: 6,
            symbol: 'USDC',
            gas: '40652',
        },
        {
            address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            decimals: 18,
            symbol: 'WETH',
            gas: '29962',
        },
    ],
    [AppSupportedChains.BASE]: [
        {
            address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            decimals: 6,
            symbol: 'USDC',
            gas: '40563',
        },
        {
            address: '0x4200000000000000000000000000000000000006',
            decimals: 18,
            symbol: 'WETH',
            gas: '29701',
        },
    ],
    [AppSupportedChains.UNICHAIN]: [],
    [AppSupportedChains.ARBITRUM]: [],
}
