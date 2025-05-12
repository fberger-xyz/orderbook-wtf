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
        {
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            decimals: 6,
            symbol: 'USDT',
            gas: '0',
        },
        {
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            decimals: 18,
            symbol: 'DAI',
            gas: '0',
        },
    ],
    [AppSupportedChains.UNICHAIN]: [
        {
            address: '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
            decimals: 6,
            symbol: 'USDC',
            gas: '40563', // todo: find correct values or remove if useless
        },
        {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18,
            symbol: 'ETH',
            gas: '29701', // todo: find correct values or remove if useless
        },
        {
            address: '0x20cab320a855b39f724131c69424240519573f81',
            decimals: 18,
            symbol: 'DAI',
            gas: '29880',
        },
        {
            address: '0x8f187aa05619a017077f5308904739877ce9ea21',
            decimals: 18,
            symbol: 'UNI',
            gas: '29880',
        },
    ],
}
