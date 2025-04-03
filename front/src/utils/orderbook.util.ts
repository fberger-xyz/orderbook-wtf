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
