import { SvgIds } from '@/enums'
import { AmmAsOrderbook, DashboardMetrics, Token } from '@/interfaces'

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

const mapProtocolNameToSvgId = (protocolName: string): SvgIds => {
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
    const config: { id: string; version: string; name: string; svgId: SvgIds } = {
        id: protocolId.toLowerCase(),
        name: '',
        version: '',
        svgId: mapProtocolNameToSvgId(protocolId),
    }
    if (config.id.includes('balancer')) {
        config.name = 'Balance V2'
        config.version = 'V2'
    } else if (config.id.includes('ekubo')) {
        config.name = 'Ekubo'
        config.version = 'V2'
    } else if (config.id.includes('sushi')) {
        config.name = 'Sushiswap V2'
        config.version = 'V2'
    } else if (config.id.includes('pancake')) {
        if (config.id.includes('2')) {
            config.name = 'PancakeSwap V2'
            config.version = 'V2'
        } else if (config.id.includes('3')) {
            config.name = 'PancakeSwap V3'
            config.version = 'V3'
        }
    } else if (config.id.includes('curve')) {
        config.name = 'Curve'
        config.version = ''
    } else if (config.id.includes('uniswap')) {
        if (config.id.includes('2')) {
            config.name = 'Uniswap V2'
            config.version = 'V2'
        } else if (config.id.includes('3')) {
            config.name = 'Uniswap V3'
            config.version = 'V3'
        } else if (config.id.includes('4')) {
            config.name = 'Uniswap V4'
            config.version = 'V4'
        }
    }
    return config
}

export const getDashboardMetrics = (orderbook: undefined | AmmAsOrderbook, sellToken: Token | undefined, buyToken: Token | undefined) => {
    const metrics: DashboardMetrics = {
        orderbook: undefined,
        highestBid: undefined,
        midPrice: undefined,
        lowestAsk: undefined,
        spreadPercent: undefined,
        totalBaseAmountInPools: undefined,
        totalQuoteAmountInPools: undefined,
        totalBaseTvlUsd: undefined,
        totalQuoteTvlUsd: undefined,
    }

    if (!orderbook) return metrics
    metrics.orderbook = orderbook
    if (sellToken && buyToken) {
        metrics.highestBid = getHighestBid(orderbook)
        metrics.lowestAsk = getLowestAsk(orderbook)

        if (metrics.highestBid && metrics.lowestAsk) {
            metrics.midPrice = (metrics.highestBid.average_sell_price + 1 / metrics.lowestAsk.average_sell_price) / 2
            metrics.spreadPercent = (1 / metrics.lowestAsk.average_sell_price - metrics.highestBid.average_sell_price) / metrics.midPrice

            if (orderbook?.base_lqdty && orderbook?.quote_lqdty) {
                metrics.totalBaseAmountInPools = orderbook.base_lqdty.reduce(
                    (total: number, baseAmountInPool: number) => (total += baseAmountInPool),
                    0,
                )
                metrics.totalQuoteAmountInPools = orderbook.quote_lqdty.reduce(
                    (total: number, quoteAmountInPool: number) => (total += quoteAmountInPool),
                    0,
                )
                metrics.totalBaseTvlUsd = metrics.totalBaseAmountInPools * orderbook.base_worth_eth * orderbook.eth_usd
                metrics.totalQuoteTvlUsd = metrics.totalQuoteAmountInPools * orderbook.quote_worth_eth * orderbook.eth_usd
            }
        }
    }

    return metrics
}
