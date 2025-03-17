export interface Token {
    address: string
    decimals: number
    symbol: string
    gas: string
}

// new
export interface AmmAsOrderbook {
    token0: Token
    token1: Token
    spot: number[]
    trades0to1: AmmTrade[]
    trades1to0: AmmTrade[]
    pools: AmmPool[]
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
}

export interface AmmTrade {
    input: number
    output: number
    distribution: number[]
    gas_costs: number[]
    ratio: number
}
