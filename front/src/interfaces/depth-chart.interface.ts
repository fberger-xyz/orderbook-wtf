// old
export interface OrderbookTrades {
    from: Token
    to: Token
    trades: Trade[]
    pools: Pool[]
}

export interface Pool {
    address: string
    id: string
    tokens: Token[]
    protocol_system: string
    protocol_type_name: string
    chain: string
    contract_ids: unknown[]
    static_attributes: string[][]
    creation_tx: string
    created_at: string
}

export interface Trade {
    input: number
    output: number
    distribution: number[]
    ratio: number
}

export interface Token {
    address: string
    decimals: number
    symbol: string
    gas: string
}

// new
export interface NewOrderbookTrades {
    token0: Token
    token1: Token
    trades0to1: NewTrade[]
    trades1to0: NewTrade[]
    pools: NewPool[]
}

export interface NewPool {
    address: string
    id: string
    tokens: Token[]
    protocol_system: string
    protocol_type_name: string
    contract_ids: string[]
    static_attributes: string[][]
    creation_tx: string
}

export interface NewTrade {
    input: number
    output: number
    distribution: number[]
    gas_costs: number[]
    ratio: number
}
