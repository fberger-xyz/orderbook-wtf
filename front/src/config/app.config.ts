import { AppUrls, AppPagePaths, AppSupportedChains } from '@/enums'
import { InterfaceAppLink } from '@/interfaces'
import { Inter } from 'next/font/google'

export const IS_DEV = process.env.NODE_ENV === 'development'
export const IS_RUNNING_IN_DOCKER = Boolean(process.env.NEXT_PUBLIC_RUNNING_IN_DOCKER)
export const APP_ROUTE = IS_DEV ? AppUrls.NEXT_API_LOCALHOST : AppUrls.NEXT_API_PROD
export const APP_METADATA = {
    SITE_NAME: 'Tycho Orderbook',
    SITE_DOMAIN: AppUrls.NEXT_API_PROD_SHORTER,
    SITE_DESCRIPTION:
        'On-chain liquidity in a familiar limit orderbook interface to read (ticks and depth per tick) and write (execute, confirmation) to',
    SITE_URL: AppUrls.NEXT_API_PROD_SHORTER,
}
export const PUBLIC_STREAM_API_URL = IS_RUNNING_IN_DOCKER ? AppUrls.RUST_API_DOCKER : IS_DEV ? AppUrls.RUST_API_LOCALHOST : AppUrls.RUST_API_PROD
export const DATE_FORMAT = 'ddd. D MMM. YYYY'
export const TIME_FORMAT = 'hh:mm A'
export const APP_PAGES: InterfaceAppLink[] = [
    {
        name: 'Home',
        path: AppPagePaths.HOME,
        public: true,
        tg: false,
        legal: false,
        sublinks: [],
    },
]
export const APP_FONT = Inter({ weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], subsets: ['latin'] })
export const CHAINS_CONFIG = {
    [AppSupportedChains.ETHEREUM]: {
        id: AppSupportedChains.ETHEREUM,
        name: 'Ethereum',
        apiId: 'ethereum',
        oneInchId: 'ethereum',
        supported: true,
        buyToken: undefined, // todo
        sellToken: undefined, // todo
        explorerRoot: 'https://etherscan.io',
    },
    [AppSupportedChains.BASE]: {
        id: AppSupportedChains.BASE,
        name: 'Base',
        apiId: 'base',
        oneInchId: 'base',
        supported: true,
        buyToken: undefined, // todo
        sellToken: undefined, // todo
        explorerRoot: 'https://basescan.org',
    },
    [AppSupportedChains.UNICHAIN]: {
        id: AppSupportedChains.UNICHAIN,
        name: 'Unichain',
        apiId: '', // to be added
        oneInchId: 'Unichain',
        supported: false,
        buyToken: undefined, // todo
        sellToken: undefined, // todo
        explorerRoot: '',
    },
    [AppSupportedChains.ARBITRUM]: {
        id: AppSupportedChains.ARBITRUM,
        name: 'Arbitrum',
        apiId: '', // to be added
        oneInchId: 'arbitrum_2',
        supported: false,
        buyToken: undefined, // todo
        sellToken: undefined, // todo
        explorerRoot: '',
    },
}
