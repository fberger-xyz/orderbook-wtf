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
    // [AppSupportedChains.BASE]: [
    //     {
    //         address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    //         decimals: 6,
    //         symbol: 'USDC',
    //         gas: '40563',
    //     },
    //     {
    //         address: '0x4200000000000000000000000000000000000006',
    //         decimals: 18,
    //         symbol: 'WETH',
    //         gas: '29701',
    //     },
    // ],
    [AppSupportedChains.UNICHAIN]: [
        {
            address: '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
            decimals: 6,
            symbol: 'USDC',
            gas: '40563', // todo: find correct values or remove if useless
        },
        {
            // address: '0x4200000000000000000000000000000000000006',
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18,
            // symbol: 'WETH',
            symbol: 'ETH',
            gas: '29701', // todo: find correct values or remove if useless
        },
    ],
    // [AppSupportedChains.ARBITRUM]: [],
}
