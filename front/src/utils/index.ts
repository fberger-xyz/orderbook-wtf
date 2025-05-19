export * from './cn.util'
export * from './error.util'
export * from './date.util'
export * from './format.util'
export * from './requests.util'
export * from './cn.util'
export * from './error.util'
export * from './date.util'
export * from './format.util'
export * from './requests.util'
export * from './theme.util'
export * from './viem.util'
export * from './orderbook.util'

// misc
export const copyToClipboard = (value: string) => {
    try {
        navigator.clipboard.writeText(value)
    } catch (error) {
        console.log(error)
    }
}
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
export const uniquePredicate = (value: unknown, index: number, array: unknown[]) => array.indexOf(value) === index
export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
export const isCurrentPath = (pathname: string, pagePath: string) => (pagePath === '/' ? pathname === pagePath : pathname.startsWith(pagePath))
