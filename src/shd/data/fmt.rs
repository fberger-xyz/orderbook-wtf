use alloy::primitives::ruint::aliases::U256;
use chrono::NaiveDateTime;
use num_bigint::BigUint;
use serde::{Deserialize, Serialize};
use tycho_simulation::evm::protocol::uniswap_v2::state::UniswapV2State;
use tycho_simulation::evm::protocol::uniswap_v3::enums::FeeAmount;
use tycho_simulation::evm::protocol::uniswap_v3::state::UniswapV3State;
use tycho_simulation::evm::protocol::utils::uniswap::tick_list::{TickInfo, TickList};
use tycho_simulation::evm::tycho_models::Chain;
use tycho_simulation::models::Token;
use tycho_simulation::protocol::models::ProtocolComponent;
use tycho_simulation::tycho_core::Bytes;

/// @notice Format of the data that will be read/stored in the database
/// By default Tycho object are not serializable

// =====================================================================================================================================================================================================
// Tycho Tokens
// =====================================================================================================================================================================================================

#[derive(Debug, Clone, Eq, PartialEq, Serialize, Deserialize)]
pub struct SerializableToken {
    pub address: String,
    pub decimals: usize,
    pub symbol: String,
    pub gas: String,
}

impl From<Token> for SerializableToken {
    fn from(token: Token) -> Self {
        SerializableToken {
            address: token.address.to_string(),
            decimals: token.decimals,
            symbol: token.symbol,
            gas: token.gas.to_string(), // Convert BigUint to String
        }
    }
}

impl From<SerializableToken> for Token {
    fn from(serialized: SerializableToken) -> Self {
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
pub struct SerializableProtocolComponent {
    pub address: String,
    pub id: String,
    pub tokens: Vec<SerializableToken>,
    pub protocol_system: String,
    pub protocol_type_name: String,
    pub chain: Chain,
    pub contract_ids: Vec<String>,
    pub static_attributes: Vec<(String, String)>,
    pub creation_tx: String,
    pub created_at: NaiveDateTime,
}

impl From<ProtocolComponent> for SerializableProtocolComponent {
    fn from(pc: ProtocolComponent) -> Self {
        SerializableProtocolComponent {
            address: pc.id.to_string(),
            id: pc.id.to_string(),
            tokens: pc.tokens.into_iter().map(SerializableToken::from).collect(),
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

impl From<SerializableProtocolComponent> for ProtocolComponent {
    fn from(serialized: SerializableProtocolComponent) -> Self {
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
pub struct SerializableUniswapV2State {
    pub reserve0: u128,
    pub reserve1: u128,
}

impl From<UniswapV2State> for SerializableUniswapV2State {
    fn from(state: UniswapV2State) -> Self {
        SerializableUniswapV2State {
            reserve0: state.reserve0.to_string().parse().expect("UniswapV2State: Failed to parse u128"),
            reserve1: state.reserve1.to_string().parse().expect("UniswapV2State: Failed to parse u128"),
        }
    }
}

// =======> Uniswap v3 <=======

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SerializableUniswapV3State {
    pub liquidity: u128,
    pub sqrt_price: U256,
    pub fee: i32,
    pub tick: i32,
    pub ticks: SerializableTickList,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SerializableTickList {
    pub tick_spacing: u16,
    pub ticks: Vec<SerializableTickInfo>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
pub struct SerializableTickInfo {
    pub index: i32,
    pub net_liquidity: i128,
    pub sqrt_price: U256,
}

impl From<TickInfo> for SerializableTickInfo {
    fn from(t: TickInfo) -> Self {
        SerializableTickInfo {
            index: t.index,
            net_liquidity: t.net_liquidity.to_string().parse().expect("TickInfo: Failed to parse i128"),
            sqrt_price: t.sqrt_price,
        }
    }
}

impl From<TickList> for SerializableTickList {
    fn from(ticks: TickList) -> Self {
        SerializableTickList {
            tick_spacing: ticks.tick_spacing,
            ticks: ticks.ticks.into_iter().map(SerializableTickInfo::from).collect(),
        }
    }
}

impl From<UniswapV3State> for SerializableUniswapV3State {
    fn from(state: UniswapV3State) -> Self {
        SerializableUniswapV3State {
            liquidity: state.liquidity.to_string().parse().expect("UniswapV3State: Failed to parse u128"),
            sqrt_price: state.sqrt_price,
            fee: state.fee as i32,
            tick: state.tick,
            ticks: SerializableTickList::from(state.ticks),
        }
    }
}

// =======> Uniswap v4 <=======
