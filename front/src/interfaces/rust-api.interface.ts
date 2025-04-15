export interface RustApiLiquidityPool {
    address: string
    id: string
    tokens: RustApiLiquidityPoolToken[]
    protocol_system: string
    protocol_type_name: string
    contract_ids: string[]
    static_attributes: string[][]
    creation_tx: string
    fee: number
}

export interface RustApiLiquidityPoolToken {
    address: string
    decimals: number
    symbol: string
    gas: string
}

// pairs endpoint
export interface RustApiPair {
    base: string
    quote: string
    addrbase: string
    addrquote: string
}
