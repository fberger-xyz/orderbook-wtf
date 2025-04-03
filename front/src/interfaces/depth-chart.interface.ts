import { OrderbookSide } from '@/enums'

export interface Token {
    address: string
    decimals: number
    symbol: string
    gas: string
}

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
    distributed: number[] // in output token
    distribution: number[]
    gas_costs: number[]
    gas_costs_usd: number[]
    average_sell_price: number
    price_impact: number // donné en %
}

export interface OrderbookKeyMetrics {
    best_ask: number
    best_bid: number
    mid: number
    spread: number
    spread_pct: number
}

// ---------
// {
//     "value": [
//         1897.798730270239,
//         2377407.8666922892
//     ],
//     "customData": {
//         "side": "ask",
//         "distribution": [
//             0.14,
//             2.91,
//             2.72,
//             0.73,
//             93.51
//         ],
//         "output": 1252.7186517580585
//     }
// }

export interface EchartOnClickParamsData {
    value: [number, number]
    customData: {
        side: OrderbookSide
        distribution: number[]
        output: number
    }
}

export interface SelectedTrade {
    // known
    side: OrderbookSide
    amountIn: number
    selectedAt: number

    // must be calculated
    trade?: AmmTrade
    pools: AmmPool[]

    // meta
    toDisplay: boolean
}
