import { AppUrls, AppPagePaths, AppSupportedChains, SvgIds } from '@/enums'
import { InterfaceAppLink } from '@/interfaces'
import { Inter } from 'next/font/google'
import { mainnet, base } from 'wagmi/chains'

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
        svgId: SvgIds.MAINNET,
        name: 'Ethereum',
        apiId: 'ethereum',
        oneInchId: 'ethereum',
        supported: true,
        explorerRoot: 'https://etherscan.io',
        wagmi: mainnet,
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
    },
    [AppSupportedChains.BASE]: {
        id: AppSupportedChains.BASE,
        svgId: SvgIds.BASE,
        name: 'Base',
        apiId: 'base',
        oneInchId: 'base',
        supported: false,
        explorerRoot: 'https://basescan.org',
        wagmi: base,
    },
    [AppSupportedChains.ARBITRUM]: {
        id: AppSupportedChains.ARBITRUM,
        svgId: SvgIds.ARBITRUM,
        name: 'Arbitrum',
        apiId: '', // to be added
        oneInchId: 'arbitrum_2',
        supported: false,
        explorerRoot: '',
        wagmi: undefined,
    },
}
