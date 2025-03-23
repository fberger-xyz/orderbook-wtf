import resolveConfig from 'tailwindcss/resolveConfig'
import type { Config } from 'tailwindcss'
import tailwindConfig from '../../tailwind.config'
import { DefaultColors } from 'tailwindcss/types/generated/colors'

const fullConfig = resolveConfig(tailwindConfig as Config)

export const AppColors = fullConfig.theme.colors as DefaultColors & {
    background: '#190A35'
    jagger: {
        DEFAULT: '#380a53ff'
        800: '#380a53cc'
        500: '#380a538f'
    }
    folly: '#ff3366ff' // button with focus and asks
    aquamarine: '#00ffbbff' // bids
    milk: {
        DEFAULT: '#fff4e0ff' // section's title, symbols, balances
        600: '#fff4e0a3' // title like Mid-price 1WETH
        400: '#fff4e066' // chart axis and labels
        200: '#fff4e033' // datazoom
        150: '#fff4e01a' // border of routing
        100: '#fff4e012' // borders, also background of inactive buttons
        50: '#fff4e005' // borders too ?
    }
}
