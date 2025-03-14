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
