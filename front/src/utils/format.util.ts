import numeral from 'numeral'

export const shortenAddress = (address: string, chars = 4) => {
    if (address.length < chars) return '0xMissing address'
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export const shortenStr = (str: string, max = 20) => {
    if (str.length <= max) return str
    return `${str.slice(0, max - 3).trim()}...`
}

export const formatNumberWithDecimals = (numberAsString: string | number, decimals: number, precision = 1) => {
    try {
        if (!decimals || isNaN(decimals)) return 'error parse bigint'
        return numeral(numberAsString)
            .divide(10 ** decimals)
            .format(`0,0.${Array(precision).fill(0).join('')}a`)
    } catch (error) {
        return JSON.stringify(error)
    }
}

const unknownFormatMap = [
    { limit: 2, format: '0,0.[000000]' },
    { limit: 10, format: '0,0.[00000]' },
    { limit: 100, format: '0,0.[0000]' },
    { limit: 1000, format: '0,0.[000]' },
    { limit: 10000, format: '0,0.[00]' },
    { limit: 1000000, format: '0,0.[0]a' },
    { limit: 1000000000, format: '0,0a' },
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

export const roundToDecimals = (value: number, decimals: number): number => {
    const factor = 10 ** decimals
    return Math.round(value * factor) / factor
}

const usdFormatMap = [
    { limit: 2, format: '0,0.[0000]$' },
    { limit: 10, format: '0,0.[000]$' },
    { limit: 100, format: '0,0.[00]$' },
    { limit: 1000, format: '0,0.[0]$' },
    { limit: 1000000, format: '0,0a$' },
    { limit: 1000000000, format: '0,0a$' },
]
export const formatUsdAmount = (amount: number | string) => {
    try {
        const num = Number(amount)
        if (isNaN(num) || num < 0) return 'n/a'
        const absAmount = Math.abs(num)
        for (const { limit, format } of usdFormatMap) if (absAmount < limit) return numeral(absAmount).format(format)
        return numeral(absAmount).format('0,0.[0]a$')
    } catch {
        return `error ${amount}`
    }
}

export const oldFormatUsdAmount = (amount: number | string) => {
    try {
        const isNegative = Number(amount) < 0
        if (isNegative) return 'n/a'
        const absAmount = Math.abs(Number(amount))
        if (absAmount < 2)
            return `${numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format('0,0.[0000]')}$`
        if (absAmount < 10)
            return `${numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format('0,0.[000]')}$`
        if (absAmount < 100)
            return `${numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format('0,0.[00]')}$`
        if (absAmount < 1000)
            return `${numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format('0,0.[0]')}$`
        if (absAmount < 1000000)
            return `${numeral(absAmount)
                .divide(1000)
                .multiply(isNegative ? -1 : 1)
                .format('0,0')}k$`
        if (absAmount >= 1000000000)
            return `${numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format('0,0.[0]a')}$`
        return `${numeral(absAmount)
            .divide(1000000)
            .multiply(isNegative ? -1 : 1)
            .format('0,0')}m$`
    } catch (error) {
        return `error ${amount}`
    }
}

export const formatYield = (yieldPercent: number | string, precision = 2) => {
    try {
        const isNegative = Number(yieldPercent) < 0
        if (isNegative) return `n/a`
        const absYieldPercent = Math.abs(Number(yieldPercent))
        const numeralFormat = `0,0.${Array(precision).fill('0').join('')}%`
        const formatted = `${numeral(absYieldPercent)
            .multiply(isNegative ? -1 : 1)
            .format(numeralFormat)}`
        if (formatted.toLowerCase().includes('nan')) return `n/a`
        if (formatted === `0.${Array(precision).fill('0').join('')}%`) return `0%`
        return formatted
    } catch (error) {
        return `n/a`
    }
}

export const formatPercent = (percent: number | string) => {
    try {
        const isNegative = Number(percent) < 0
        const abs = Math.abs(Number(percent))
        if (abs > 1) return `>100%`
        const formatted = `${numeral(abs)
            .multiply(isNegative ? -1 : 1)
            .format('0,0%')}`
        if (formatted.toLowerCase().includes('nan')) return `n/a`
        return formatted
    } catch (error) {
        return `n/a`
    }
}

export const safeNumeral = (value: number, format: string): string => {
    try {
        return numeral(value).format(format)
    } catch (error) {
        console.error({ error })
        return 'Error'
    }
}

export const cleanOutput = (output: string | number, defaultOutput = '-'): string => {
    const strOutput = String(output).replaceAll(' ', '')
    if (strOutput === '0') return defaultOutput
    if (strOutput === '0%') return defaultOutput
    if (strOutput === '0m$') return defaultOutput
    if (strOutput === 'NaN') return defaultOutput
    return String(output)
}

export const formatOrDisplayRaw = (rawInput: string | number, format: string): string => {
    return typeof numeral(rawInput).value() === 'number' ? numeral(rawInput).format(format) : String(rawInput)
}
