import { OrderbookSide } from '@/enums'

/**
 * orderbook
 */

export interface Token {
    address: string
    decimals: number
    symbol: string
    gas: string
}

export interface AmmAsOrderbook {
    tag: string // ?
    block: number
    timestamp: number

    // tokens
    base: Token
    quote: Token

    // prices
    prices_base_to_quote: number[]
    prices_quote_to_base: number[]
    eth_usd: number

    // trades
    bids: AmmTrade[]
    asks: AmmTrade[]
    pools: AmmPool[]

    // liquidity ?
    base_lqdty: number[]
    quote_lqdty: number[]

    // mdp ?
    mpd_base_to_quote: OrderbookKeyMetrics
    mpd_quote_to_base: OrderbookKeyMetrics

    // ? usage to find
    base_worth_eth: number
    quote_worth_eth: number
    aggregated_balance_base_worth_usd: number
    aggregated_balance_quote_worth_usd: number
}

export interface AmmPool {
    address: string
    id: string
    tokens: Token[]
    protocol_system: string
    protocol_type_name: string
    contract_ids: string[]
    static_attributes: string[][]
    creation_tx: string
    fee: number
    last_updated_at: number
}

export interface AmmTrade {
    amount: number
    output: number
    distributed: number[] // in output token
    distribution: number[]
    gas_costs: number[]
    gas_costs_usd: number[]
    average_sell_price: number
    price_impact: number // given in %
}

export interface OrderbookKeyMetrics {
    best_ask: number
    best_bid: number
    mid: number
    spread: number
    spread_pct: number

    // ?
    received: number // ?
    distribution: number[] // ?
}

/**
 * chart
 */

export interface EchartOnClickParamsData {
    value: [number, number]
    customData: {
        side: OrderbookSide
        distribution: number[]
        output: number
    }
}

/**
 * swap
 */

export interface SelectedTrade {
    // known
    side: OrderbookSide
    amountIn: number
    selectedAt: number
    xAxis: number

    // must be calculated
    trade?: AmmTrade
    pools: AmmPool[]
}

/**
 * dashboard
 */

export interface DashboardMetrics {
    timestamp: number
    block: number
    highestBid?: AmmTrade
    midPrice?: number
    lowestAsk?: AmmTrade
    spread?: number
    spreadPercent?: number
    precomputedMetrics?: OrderbookKeyMetrics
    totalBaseAmountInPools: number
    totalQuoteAmountInPools: number
    totalBaseTvlUsd: number
    totalQuoteTvlUsd: number
    orderbook?: AmmAsOrderbook
}
