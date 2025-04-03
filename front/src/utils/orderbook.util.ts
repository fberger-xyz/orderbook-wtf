import { SvgIds } from '@/enums'
import { AmmAsOrderbook } from '@/interfaces'

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

export const mapProtocolIdToProtocolConfig = (protocolId: string) => {
    const config: { id: string; version: string; name: string; svgId: SvgIds } = {
        id: protocolId,
        name: '',
        version: '',
        svgId: mapProtocolNameToSvgId(protocolId),
    }
    if (protocolId.includes('balancer')) {
        config.name = 'Balance V2'
        config.version = 'V2'
    }
    if (protocolId.includes('sushi')) {
        config.name = 'Sushiswap V2'
        config.version = 'V2'
    }
    if (protocolId.includes('pancake')) {
        config.name = 'PancakeSwap V2'
        config.version = 'V2'
    }
    if (protocolId.includes('curve')) {
        config.name = 'Curve'
        config.version = ''
    }
    if (protocolId.includes('uniswap')) {
        if (protocolId.includes('2')) {
            config.name = 'Uniswap V2'
            config.version = 'V2'
        }
        if (protocolId.includes('3')) {
            config.name = 'Uniswap V3'
            config.version = 'V2'
        }
        if (protocolId.includes('4')) {
            config.name = 'Uniswap V4'
            config.version = 'V2'
        }
    }
    return config
}
