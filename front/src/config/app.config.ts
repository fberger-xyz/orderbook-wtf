import { AppPagePaths } from '@/enums'
import { InterfaceAppLink } from '@/interfaces'
import { Inter } from 'next/font/google'

export const IS_DEV = process.env.NODE_ENV === 'development'
export const APP_ROUTE = IS_DEV ? 'http://localhost:3000' : 'https://www.orderbook.wtf'
export const APP_METADATA = {
    SITE_NAME: 'Tycho Orderbook',
    SITE_DOMAIN: 'https://orderbook.wtf',
    SITE_DESCRIPTION:
        'On-chain liquidity in a familiar limit orderbook interface to read (ticks and depth per tick) and write (execute, confirmation) to',
    SITE_URL: 'https://orderbook.wtf',
}

export const PUBLIC_STREAM_API_URL = IS_DEV ? 'http://localhost:42042/api' : String(process.env.NEXT_PUBLIC_STREAM_API_URL)
export const DEBUG = false
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
