import { AppPagePaths, AppThemes, IconIds } from '@/enums'
import { InterfaceAppLink } from '@/interfaces'
import { Inter_Tight } from 'next/font/google'

export const APP_KEYWORD = 'tycho-tap2'
export const APP_METADATA = {
    SITE_NAME: 'Tycho Orderbook 🚧',
    SITE_DOMAIN: `${APP_KEYWORD}.fberger.xyz`,
    SITE_DESCRIPTION:
        'On-chain liquidity in a familiar limit orderbook interface to read (ticks and depth per tick) and write (execute, confirmation) to',
    SITE_URL: `https://${APP_KEYWORD}.fberger.xyz`,
}

export const IS_DEV = process.env.NODE_ENV === 'development'
export const APP_ROUTE = IS_DEV ? 'http://localhost:3000' : APP_METADATA.SITE_URL
export const PUBLIC_STREAM_API_URL = process.env.NEXT_PUBLIC_STREAM_API_URL ? process.env.NEXT_PUBLIC_STREAM_API_URL : 'http://localhost:42001/api'
export const DEBUG = false
export const DATE_FORMAT = 'ddd. D MMM. YYYY'
export const TIME_FORMAT = 'hh:mm A'
export const DEFAULT_THEME = AppThemes.LIGHT

export const APP_THEMES: Partial<Record<AppThemes, { index: number; iconId: IconIds }>> = {
    [AppThemes.LIGHT]: { index: 0, iconId: IconIds.THEME_LIGHT },
    [AppThemes.DARK]: { index: 1, iconId: IconIds.THEME_DARK },
}

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

export const APP_FONT = Inter_Tight({ weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], subsets: ['latin'] })
