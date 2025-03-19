import { AppPagePaths, AppThemes, IconIds } from '@/enums'
import { InterfaceAppLink } from '@/interfaces'

export const APP_KEYWORD = 'tycho-tap2'
export const APP_METADATA = {
    SITE_AUTHOR: 'fberger.xyz',
    SITE_NAME: 'tycho-tap2',
    SITE_DOMAIN: `${APP_KEYWORD}.fberger.xyz`,
    SITE_DESCRIPTION: 'Work in progress 🚧',
    SITE_URL: `https://${APP_KEYWORD}.fberger.xyz`,
    SOCIALS: {
        X: 'fberger_xyz',
        TELEGRAM: 'fberger_xyz',
        GITHUB: 'fberger-xyz',
        LINKEDIN: 'francis-berger-a2404094',
    },
    PROFILE_PICTURE: 'https://pbs.twimg.com/profile_images/1876521476062412800/QJGGbg2j_400x400.jpg',
}

export const FBERGER_XYZ_ID = process.env.FBERGER_XYZ_ID
export const IS_DEV = process.env.NODE_ENV === 'development'
export const root = IS_DEV ? 'http://localhost:3000' : APP_METADATA.SITE_URL
export const ngrokInDevOrDomainInProd = IS_DEV ? process.env.NGROK_ENDPOINT : APP_METADATA.SITE_URL
export const PUBLIC_STREAM_API_URL = process.env.NEXT_PUBLIC_STREAM_API_URL ? process.env.NEXT_PUBLIC_STREAM_API_URL : 'http://localhost:42001'
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

export const MIN_SUPPLIED = 500000 // 1000000
