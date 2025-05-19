import { hardcodedTokensList } from '@/data/back-tokens'
import { AppUrls, AppSupportedChains, SvgIds } from '@/enums'
import { InterfaceAppLink } from '@/interfaces'
import { Inter, Inter_Tight } from 'next/font/google'
import { mainnet } from 'wagmi/chains'

export const IS_DEV = process.env.NODE_ENV === 'development'
export const IS_RUNNING_IN_DOCKER = Boolean(process.env.NEXT_PUBLIC_RUNNING_IN_DOCKER)
export const APP_ROUTE = IS_DEV ? AppUrls.NEXT_API_LOCALHOST : AppUrls.NEXT_API_PROD
export const APP_METADATA = {
    SITE_NAME: 'Tycho Orderbook',
    SITE_DOMAIN: AppUrls.NEXT_API_PROD_SHORTER,
    SITE_DESCRIPTION: 'On-chain liquidity in a familiar orderbook interface',
    SITE_URL: AppUrls.NEXT_API_PROD_SHORTER,
}
export const PUBLIC_STREAM_API_URL = IS_RUNNING_IN_DOCKER ? AppUrls.RUST_API_DOCKER : AppUrls.RUST_API_PROD
export const DATE_FORMAT = 'ddd. D MMM. YYYY'
export const TIME_FORMAT = 'hh:mm A'

// pages
export const APP_PAGES: InterfaceAppLink[] = [
    {
        name: 'About',
        path: AppUrls.ABOUT,
    },
    {
        name: 'Orderbook',
        path: AppUrls.ORDERBOOK,
    },
]

// fonts
export const INTER_FONT = Inter({
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
    subsets: ['latin'],
    variable: '--font-inter',
})
export const INTER_TIGHT_FONT = Inter_Tight({
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
    subsets: ['latin'],
    variable: '--font-inter-tight',
})

// chains
export const CHAINS_CONFIG = {
    [AppSupportedChains.ETHEREUM]: {
        id: AppSupportedChains.ETHEREUM,
        svgId: SvgIds.MAINNET,
        name: 'Ethereum',
        apiId: 'ethereum',
        oneInchId: 'ethereum',
        supported: true,
        explorerRoot: 'https://etherscan.io',
        wagmi: mainnet,
        suggestedTokens: [
            { symbol: 'WETH', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' },
            { symbol: 'wstETH', address: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0' },
            { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
            { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
            { symbol: 'DAI', address: '0x6b175474e89094c44da98b954eedeac495271d0f' },
            { symbol: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
        ],
    },
    [AppSupportedChains.UNICHAIN]: {
        id: AppSupportedChains.UNICHAIN,
        svgId: SvgIds.UNICHAIN,
        name: 'Unichain',
        apiId: 'unichain',
        oneInchId: 'unichain',
        supported: true,
        explorerRoot: 'https://unichain.blockscout.com',
        wagmi: { id: 130 },
        suggestedTokens: [
            { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000' },
            { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006' },
            { symbol: 'wstETH', address: '0xc02fe7317d4eb8753a02c35fe019786854a92001' },
            { symbol: 'USDC', address: '0x078d782b760474a361dda0af3839290b0ef57ad6' },
            { symbol: 'UNI', address: '0x7dcc39b4d1c53cb31e1abc0e358b43987fef80f7' },
            { symbol: 'WBTC', address: '0x927b51f251480a681271180da4de28d44ec4afb8' },
        ],
    },
}
export const GANALYTICS_ID = 'QQQJ2W90F6'

// misc
export const DEFAULT_CHAIN_CONFIG = CHAINS_CONFIG[AppSupportedChains.ETHEREUM]
export const DEFAULT_SELL_TOKEN = hardcodedTokensList[AppSupportedChains.ETHEREUM][1]
export const DEFAULT_BUY_TOKEN = hardcodedTokensList[AppSupportedChains.ETHEREUM][0]
