import { APP_ROUTE } from '@/config/app.config'
import { AppSupportedChains, SvgIds } from '@/enums'
import { AmmAsOrderbook, DashboardMetrics, Token } from '@/interfaces'
import { defaultHeaders, fetchWithTimeout } from './requests.util'
import { StructuredOutput } from '@/types'
import toast from 'react-hot-toast'
import { extractErrorMessage } from './error.util'
import { toastStyle } from '@/config/toasts.config'

export const getHighestBid = (orderbook?: AmmAsOrderbook) => {
    if (!orderbook) return undefined
    if (!orderbook.bids.length) return undefined
    return orderbook.bids.reduce((max, t) => (t.average_sell_price > max.average_sell_price ? t : max), orderbook.bids[0])
}

export const getLowestAsk = (orderbook?: AmmAsOrderbook) => {
    if (!orderbook) return undefined
    if (!orderbook.asks.length) return undefined
    return orderbook.asks.reduce((min, t) => (1 / t.average_sell_price < 1 / min.average_sell_price ? t : min), orderbook.asks[0])
}

export const getBaseValueInUsd = (orderbook?: AmmAsOrderbook): undefined | number => {
    if (!orderbook) return undefined
    return orderbook.base_worth_eth * orderbook.eth_usd
}

export const getQuoteValueInUsd = (orderbook?: AmmAsOrderbook): undefined | number => {
    if (!orderbook) return undefined
    return orderbook?.quote_worth_eth * orderbook.eth_usd
}

const mapProtocolNameToSvgId = (protocolName: string): undefined | SvgIds => {
    if (!protocolName) return undefined
    let svgId = SvgIds.BALANCERV2
    if (protocolName.includes('balancer')) svgId = SvgIds.BALANCERV2
    if (protocolName.includes('sushi')) svgId = SvgIds.SUSHISWAPV2
    if (protocolName.includes('pancake')) svgId = SvgIds.PANCAKESWAPV2
    if (protocolName.includes('uniswap')) svgId = SvgIds.UNISWAPV2
    if (protocolName.includes('curve')) svgId = SvgIds.CURVE
    return svgId
}

// https://docs.propellerheads.xyz/tycho/for-solvers/supported-protocols
export const mapProtocolIdToProtocolConfig = (protocolId: string) => {
    const config: { id: string; version: string; name: string; svgId?: SvgIds } = {
        id: (protocolId ?? '').toLowerCase(),
        name: '',
        version: '',
        svgId: mapProtocolNameToSvgId(protocolId),
    }
    if (config.id.includes('balancer')) {
        config.name = 'Balancer v2'
        config.version = 'v2'
    } else if (config.id.includes('ekubo')) {
        config.name = 'Ekubo'
        config.version = 'v2'
    } else if (config.id.includes('sushi')) {
        config.name = 'Sushiswap v2'
        config.version = 'v2'
    } else if (config.id.includes('pancake')) {
        if (config.id.includes('2')) {
            config.name = 'PancakeSwap v2'
            config.version = 'v2'
        } else if (config.id.includes('3')) {
            config.name = 'PancakeSwap v3'
            config.version = 'v3'
        }
    } else if (config.id.includes('curve')) {
        config.name = 'Curve'
        config.version = ''
    } else if (config.id.includes('uniswap')) {
        if (config.id.includes('2')) {
            config.name = 'Uniswap v2'
            config.version = 'v2'
        } else if (config.id.includes('3')) {
            config.name = 'Uniswap v3'
            config.version = 'v3'
        } else if (config.id.includes('4')) {
            config.name = 'Uniswap v4'
            config.version = 'v4'
        }
    }
    return config
}

export const getDashboardMetrics = (orderbook: undefined | AmmAsOrderbook) => {
    const metrics: DashboardMetrics = {
        timestamp: 0,
        block: 0,
        highestBid: undefined,
        midPrice: undefined,
        lowestAsk: undefined,
        spread: undefined,
        spreadPercent: undefined,
        precomputedMetrics: undefined,
        totalBaseAmountInPools: 0,
        totalQuoteAmountInPools: 0,
        totalBaseTvlUsd: 0,
        totalQuoteTvlUsd: 0,

        // all
        orderbook: undefined,
    }

    if (!orderbook) return metrics
    metrics.timestamp = orderbook.timestamp
    metrics.block = orderbook.block
    metrics.orderbook = orderbook
    metrics.highestBid = getHighestBid(orderbook)
    metrics.lowestAsk = getLowestAsk(orderbook)

    if (metrics.highestBid && metrics.lowestAsk) {
        // mid
        metrics.midPrice = (metrics.highestBid.average_sell_price + 1 / metrics.lowestAsk.average_sell_price) / 2

        // spread
        metrics.spread = 1 / metrics.lowestAsk.average_sell_price - metrics.highestBid.average_sell_price
        metrics.spreadPercent = metrics.spread / metrics.midPrice
        metrics.precomputedMetrics = orderbook.mpd_base_to_quote

        // quote TVL and base TVL
        if (orderbook?.base_lqdty && orderbook?.quote_lqdty) {
            metrics.totalBaseAmountInPools = orderbook.base_lqdty.reduce((total, baseAmountInPool) => (total += baseAmountInPool), 0)
            metrics.totalQuoteAmountInPools = orderbook.quote_lqdty.reduce((total, quoteAmountInPool) => (total += quoteAmountInPool), 0)
            metrics.totalBaseTvlUsd = metrics.totalBaseAmountInPools * orderbook.base_worth_eth * orderbook.eth_usd
            metrics.totalQuoteTvlUsd = metrics.totalQuoteAmountInPools * orderbook.quote_worth_eth * orderbook.eth_usd
        }
    }

    return metrics
}

export const bestSideSymbol =
    'path://M21.9583 31.4167H19.75C19.2917 31.4167 18.8993 31.2535 18.5729 30.9271C18.2465 30.6007 18.0833 30.2083 18.0833 29.75V27.5417L16.4792 25.9167C16.3264 25.75 16.2083 25.566 16.125 25.3646C16.0417 25.1632 16 24.9583 16 24.75C16 24.5417 16.0417 24.3368 16.125 24.1354C16.2083 23.934 16.3264 23.75 16.4792 23.5833L18.0833 21.9583V19.75C18.0833 19.2917 18.2465 18.8993 18.5729 18.5729C18.8993 18.2465 19.2917 18.0833 19.75 18.0833H21.9583L23.5833 16.4792C23.75 16.3264 23.934 16.2083 24.1354 16.125C24.3368 16.0417 24.5417 16 24.75 16C24.9583 16 25.1632 16.0417 25.3646 16.125C25.566 16.2083 25.75 16.3264 25.9167 16.4792L27.5417 18.0833H29.75C30.2083 18.0833 30.6007 18.2465 30.9271 18.5729C31.2535 18.8993 31.4167 19.2917 31.4167 19.75V21.9583L33.0208 23.5833C33.1736 23.75 33.2917 23.934 33.375 24.1354C33.4583 24.3368 33.5 24.5417 33.5 24.75C33.5 24.9583 33.4583 25.1632 33.375 25.3646C33.2917 25.566 33.1736 25.75 33.0208 25.9167L31.4167 27.5417V29.75C31.4167 30.2083 31.2535 30.6007 30.9271 30.9271C30.6007 31.2535 30.2083 31.4167 29.75 31.4167H27.5417L25.9167 33.0208C25.75 33.1736 25.566 33.2917 25.3646 33.375C25.1632 33.4583 24.9583 33.5 24.75 33.5C24.5417 33.5 24.3368 33.4583 24.1354 33.375C23.934 33.2917 23.75 33.1736 23.5833 33.0208L21.9583 31.4167Z'

export const simulateTradeForAmountIn = async (currentChainId: AppSupportedChains, sellToken: Token, buyToken: Token, pointAmount: number) => {
    try {
        // basic check
        if (pointAmount === undefined || pointAmount <= 0) return

        // fetch and return
        const url = `${APP_ROUTE}/api/orderbook?chain=${currentChainId}&token0=${sellToken.address}&token1=${buyToken.address}&pointAmount=${pointAmount}&pointToken=${sellToken.address}`
        const tradeResponse = await fetchWithTimeout(url, { method: 'GET', headers: defaultHeaders })
        const tradeResponseJson = (await tradeResponse.json()) as StructuredOutput<AmmAsOrderbook>
        return tradeResponseJson.data
    } catch (error) {
        toast.error(`Unexpected error while simulating trade: ${extractErrorMessage(error)}`, { style: toastStyle })
        return
    }
}

export const mergeOrderbooks = (current?: AmmAsOrderbook, next?: AmmAsOrderbook) => {
    if (!next) return current
    if (!current) return next
    return {
        ...current,
        pools: next.pools,

        // filter out previous refresh entries
        bids: [...current.bids.filter((currentBid) => !next.bids.some((nextBid) => nextBid.amount === currentBid.amount)), ...next.bids],
        asks: [...current.asks.filter((currentAsk) => !next.asks.some((nextAsk) => nextAsk.amount === currentAsk.amount)), ...next.asks],
        timestamp: Math.max(current.timestamp, next.timestamp),
        block: Math.max(current.block, next.block),
    }
}
