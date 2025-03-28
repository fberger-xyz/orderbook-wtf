export interface Token {
    address: string
    decimals: number
    symbol: string
    gas: string
}

// old
// export interface AmmAsOrderbook {
//     token0: Token
//     token1: Token
//     prices0to1: number[]
//     prices1to0: number[]
//     trades0to1: AmmTrade[]
//     trades1to0: AmmTrade[]
//     aggt0lqdty: number[]
//     aggt1lqdty: number[]
//     mpd0to1: OrderbookKeyMetrics
//     mpd1to0: OrderbookKeyMetrics
//     pools: AmmPool[]
//     eth_usd: number
// }

export interface AmmAsOrderbook {
    block: number
    timestamp: number

    // tokens
    base: Token // token0
    quote: Token // quote

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

    // ?
    base_worth_eth: number
    quote_worth_eth: number
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
}

export interface AmmTrade {
    amount: number
    output: number
    distribution: number[]
    gas_costs: number[]
    gas_costs_usd: number[]
    average_sell_price: number
}

export interface OrderbookKeyMetrics {
    best_ask: number
    best_bid: number
    mid: number
    spread: number
    spread_pct: number
}
