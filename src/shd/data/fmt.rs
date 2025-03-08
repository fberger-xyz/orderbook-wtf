use std::collections::HashMap;

use alloy::primitives::ruint::aliases::U256;
use chrono::NaiveDateTime;
use num_bigint::BigUint;
use serde::{Deserialize, Serialize};
use tycho_simulation::evm::protocol::uniswap_v2::state::UniswapV2State;
use tycho_simulation::evm::protocol::uniswap_v3::state::UniswapV3State;
use tycho_simulation::evm::protocol::uniswap_v4::state::UniswapV4State;
use tycho_simulation::evm::protocol::utils::uniswap::tick_list::{TickInfo, TickList};
use tycho_simulation::evm::tycho_models::Chain;
use tycho_simulation::models::Token;
use tycho_simulation::protocol::models::ProtocolComponent;
use tycho_simulation::tycho_core::Bytes;

/// @notice Format of the data that will be read/stored in the database
/// By default Tycho object are not srz

// =====================================================================================================================================================================================================
// Tycho Tokens
// =====================================================================================================================================================================================================

#[derive(Debug, Clone, Eq, PartialEq, Serialize, Deserialize)]
pub struct SrzToken {
    pub address: String,
    pub decimals: usize,
    pub symbol: String,
    pub gas: String,
}

impl From<Token> for SrzToken {
    fn from(token: Token) -> Self {
        SrzToken {
            address: token.address.to_string(),
            decimals: token.decimals,
            symbol: token.symbol,
            gas: token.gas.to_string(), // Convert BigUint to String
        }
    }
}

impl From<SrzToken> for Token {
    fn from(serialized: SrzToken) -> Self {
        Token {
            address: Bytes::from(serialized.address.into_bytes()), // Convert String to Bytes
            decimals: serialized.decimals,
            symbol: serialized.symbol,
            gas: BigUint::parse_bytes(serialized.gas.as_bytes(), 10).expect("Failed to parse BigUint"), // Convert String back to BigUint
        }
    }
}

// =====================================================================================================================================================================================================
// Tycho Compoment: Convert a ProtocolComponent to a serialized version (and more readable)
// =====================================================================================================================================================================================================

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SrzProtocolComponent {
    pub address: String,
    pub id: String,
    pub tokens: Vec<SrzToken>,
    pub protocol_system: String,
    pub protocol_type_name: String,
    pub chain: Chain,
    pub contract_ids: Vec<String>,
    pub static_attributes: Vec<(String, String)>,
    pub creation_tx: String,
    pub created_at: NaiveDateTime,
}

impl From<ProtocolComponent> for SrzProtocolComponent {
    fn from(pc: ProtocolComponent) -> Self {
        SrzProtocolComponent {
            address: pc.id.to_string().to_lowercase(),
            id: pc.id.to_string().to_lowercase(),
            tokens: pc.tokens.into_iter().map(SrzToken::from).collect(),
            protocol_system: pc.protocol_system,
            protocol_type_name: pc.protocol_type_name,
            chain: pc.chain,
            contract_ids: pc.contract_ids.into_iter().map(|b| b.to_string()).collect(),
            static_attributes: pc.static_attributes.into_iter().map(|(k, v)| (k, v.to_string())).collect(),
            creation_tx: pc.creation_tx.to_string(),
            created_at: pc.created_at,
        }
    }
}

impl From<SrzProtocolComponent> for ProtocolComponent {
    fn from(serialized: SrzProtocolComponent) -> Self {
        ProtocolComponent {
            address: Bytes::from(serialized.address.into_bytes()),
            id: Bytes::from(serialized.id.into_bytes()),
            tokens: serialized.tokens.into_iter().map(Token::from).collect(),
            protocol_system: serialized.protocol_system,
            protocol_type_name: serialized.protocol_type_name,
            chain: serialized.chain,
            contract_ids: serialized.contract_ids.into_iter().map(|s| Bytes::from(s.into_bytes())).collect(),
            static_attributes: serialized.static_attributes.into_iter().map(|(k, v)| (k, Bytes::from(v.into_bytes()))).collect(),
            creation_tx: Bytes::from(serialized.creation_tx.into_bytes()),
            created_at: serialized.created_at,
        }
    }
}

// =====================================================================================================================================================================================================
// Convert a part of a protocol State to a serialized version (and more readable)
// Not reversible, because the state is not fully serialized (it contains a lot of data)
// =====================================================================================================================================================================================================

// =======> Uniswap v2 <=======

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct SrzUniswapV2State {
    pub id: String,
    pub reserve0: u128,
    pub reserve1: u128,
}

impl From<(UniswapV2State, String)> for SrzUniswapV2State {
    fn from((state, id): (UniswapV2State, String)) -> Self {
        SrzUniswapV2State {
            id,
            reserve0: state.reserve0.to_string().parse().expect("UniswapV2State: Failed to parse u128"),
            reserve1: state.reserve1.to_string().parse().expect("UniswapV2State: Failed to parse u128"),
        }
    }
}

// =======> Uniswap v3 <=======

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SrzUniswapV3State {
    pub id: String,
    pub liquidity: u128,
    pub sqrt_price: U256,
    pub fee: i32,
    pub tick: i32,
    pub ticks: SrzTickList,
}

impl From<(UniswapV3State, String)> for SrzUniswapV3State {
    fn from((state, id): (UniswapV3State, String)) -> Self {
        SrzUniswapV3State {
            id,
            liquidity: state.liquidity.to_string().parse().expect("UniswapV3State: Failed to parse u128"),
            sqrt_price: state.sqrt_price,
            fee: state.fee as i32,
            tick: state.tick,
            ticks: SrzTickList::from(state.ticks),
        }
    }
}

// =======> Uniswap v4 <========

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SrzUniswapV4State {
    pub id: String,
    pub liquidity: u128,
    pub sqrt_price: U256,
    pub fees: SrzUniswapV4Fees,
    pub tick: i32,
    pub ticks: SrzTickList,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SrzUniswapV4Fees {
    pub zero_for_one: u32, // Protocol fees in the zero for one direction
    pub one_for_zero: u32, // Protocol fees in the one for zero direction
    pub lp_fee: u32,       // Liquidity providers fees
}

impl From<(UniswapV4State, String)> for SrzUniswapV4State {
    fn from((state, id): (UniswapV4State, String)) -> Self {
        SrzUniswapV4State {
            id,
            liquidity: state.liquidity.to_string().parse().expect("UniswapV4State: Failed to parse u128"),
            sqrt_price: state.sqrt_price,
            fees: SrzUniswapV4Fees {
                zero_for_one: state.fees.zero_for_one,
                one_for_zero: state.fees.one_for_zero,
                lp_fee: state.fees.lp_fee,
            },
            tick: state.tick,
            ticks: SrzTickList::from(state.ticks),
        }
    }
}

// =======> Uniswap v3/v4 <=======

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SrzTickList {
    pub tick_spacing: u16,
    pub ticks: Vec<SrzTickInfo>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
pub struct SrzTickInfo {
    pub index: i32,
    pub net_liquidity: i128,
    pub sqrt_price: U256,
}

impl From<TickInfo> for SrzTickInfo {
    fn from(t: TickInfo) -> Self {
        SrzTickInfo {
            index: t.index,
            net_liquidity: t.net_liquidity.to_string().parse().expect("TickInfo: Failed to parse i128"),
            sqrt_price: t.sqrt_price,
        }
    }
}

impl From<TickList> for SrzTickList {
    fn from(ticks: TickList) -> Self {
        SrzTickList {
            tick_spacing: ticks.tick_spacing,
            ticks: ticks.ticks.into_iter().map(SrzTickInfo::from).collect(),
        }
    }
}

// =======> EVMPoolState <========

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SrzEVMPoolState {
    pub id: String,
    pub tokens: Vec<String>,
    pub block: u64,
    pub balances: HashMap<String, U256>,
    // pub capabilities: HashSet<U256>,
}

// From EVMPoolState to SrzEVMPoolState done manually.
