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

export const formatAmount = (amount: number | string) => {
    try {
        const isNegative = Number(amount) < 0
        const absAmount = Math.abs(Number(amount))
        if (absAmount < 1)
            return `${numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format('0,0.[00000]')}`
        if (absAmount < 1000)
            return `${numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format('0,0')}`
        if (absAmount < 10000)
            return `${numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format('0,0.[00]a')}`
        return `${numeral(absAmount)
            .multiply(isNegative ? -1 : 1)
            .format('0,0.[0]a')}`
    } catch (error) {
        return `error ${amount}`
    }
}

const formatMap = [
    { limit: 2, format: '0,0.[0000]$' },
    { limit: 10, format: '0,0.[000]$' },
    { limit: 100, format: '0,0.[00]$' },
    { limit: 1000, format: '0,0.[0]$' },
    { limit: 1000000, format: '0,0k$' },
    { limit: 1000000000, format: '0,0m$' },
]
export const formatUsdAmount = (amount: number | string) => {
    try {
        const num = Number(amount)
        if (isNaN(num) || num < 0) return 'n/a'
        const absAmount = Math.abs(num)
        for (const { limit, format } of formatMap) if (absAmount < limit) return numeral(absAmount).format(format)
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
