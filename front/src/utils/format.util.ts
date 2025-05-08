import numeral from 'numeral'

export const shortenAddress = (address: string, chars = 4) => {
    if (address.length < chars) return '0xMissing address'
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

const unknownFormatMap = [
    { limit: 2, format: '0,0.[000000]' },
    { limit: 10, format: '0,0.[00000]' },
    { limit: 100, format: '0,0.[0000]' },
    { limit: 1000, format: '0,0.[000]' },
    { limit: 10000, format: '0,0.[00]' },
    { limit: 1000000, format: '0,0.[0]a' },
]
export const formatAmount = (amount?: number | string) => {
    try {
        const num = Number(amount)
        if (isNaN(num) || num < 0) return amount
        const absAmount = Math.abs(num)

        // map
        for (const { limit, format } of unknownFormatMap)
            if (absAmount < limit) {
                const output = numeral(absAmount).format(format)
                if (String(output).toLowerCase().includes('nan')) return 'n/a'
                return output
            }

        // else
        const output = numeral(absAmount).format('0,0.[0]a')
        if (String(output).toLowerCase().includes('nan')) return 'n/a'
        return output
    } catch {
        // return `error ${amount}`
        return `Error`
    }
}

const priceFormatMap = [
    { limit: 1000000000, format: '0,0.[000000]' },
    { limit: 1000000, format: '0,0.[00000]' },
    { limit: 10000, format: '0,0.[0000]' },
    { limit: 1000, format: '0,0.[00]' },
    { limit: 100, format: '0,0.[000]' },
    { limit: 10, format: '0,0.[0]a' },
    { limit: 2, format: '0,0a' },
]
export const formatAmountDependingOnPrice = (amount: number | string, usdPrice: number) => {
    try {
        const num = Number(amount)
        if (isNaN(num) || num < 0) return amount
        const absAmount = Math.abs(num)

        // map
        for (const { limit, format } of priceFormatMap)
            if (usdPrice < limit) {
                const output = numeral(absAmount).format(format)
                if (String(output).toLowerCase().includes('nan')) return 'n/a'
                return output
            }

        // else
        const output = numeral(absAmount).format('0,0.[0]a')
        if (String(output).toLowerCase().includes('nan')) return 'n/a'
        return output
    } catch {
        // return `error ${amount}`
        return `Error`
    }
}

// ? really not that useful
export const safeNumeral = (value: number, format: string): string => {
    try {
        return numeral(value).format(format)
    } catch (error) {
        console.error({ error })
        return 'Error'
    }
}

export const cleanOutput = (output: string | number, defaultOutput = '-'): string => {
    const strOutput = String(output).replaceAll('~', '').replaceAll(' ', '')
    if (strOutput === '0') return defaultOutput
    if (strOutput === '0%') return defaultOutput
    if (strOutput === '0m$') return defaultOutput
    if (strOutput === 'NaN') return defaultOutput
    return String(output)
}

export const sanitizeSwapInput = (input: string): string => {
    let sanitized = input.replace(/[^\d.]/g, '')
    const parts = sanitized.split('.')
    const first = parts.shift() ?? ''
    const rest = parts.join('')
    sanitized = first + (parts.length > 0 ? '.' + rest : '')
    if (sanitized.startsWith('0') && !sanitized.startsWith('0.') && sanitized.length > 1) sanitized = sanitized.replace(/^0+/, '')
    if (sanitized.startsWith('.')) sanitized = '0' + sanitized
    return sanitized
}

export const formatInputWithCommas = (input: string): string => {
    // split integer and decimal parts
    const [whole, decimal] = input.split('.')
    const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return decimal !== undefined ? `${formattedWhole}.${decimal}` : formattedWhole
}
