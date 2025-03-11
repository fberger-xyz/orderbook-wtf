use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

#[derive(Debug, Clone)]
pub struct EnvConfig {
    pub testing: bool,
    pub tycho_url: String,
    pub tycho_api_key: String,
    pub network: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Network {
    pub name: String,
    pub chainid: u64,
    pub eth: String,
    pub usdc: String,
    pub exotic: String,
    pub rpc: String,
    pub exp: String,
    pub enabled: bool,
    pub tycho: String,
    pub port: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoolData {
    pub liquidity: u128,
    pub sqrt_price_x96: u128,
    pub tick: u128,
    pub ticks: Vec<TickData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TickData {
    pub tick: i32,
    pub net_liquidity: u128,
    pub price0to1: f64,
    pub price1to0: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderBookSimu {
    pub pool: String,
    pub simulations: Vec<BestSwap>,
    pub spot_sprice: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BestSwap {
    pub formatted_in: String,
    pub formatted_out: String,
    pub forward_price: f64,
    pub reverse_price: f64,
}

pub enum AmmType {
    UniswapV2,
    UniswapV3,
    UniswapV4,
    Balancer,
    Curve,
}

impl ToString for AmmType {
    fn to_string(&self) -> String {
        match self {
            AmmType::UniswapV2 => "uniswap_v2_pool".to_string(),
            AmmType::UniswapV3 => "uniswap_v3_pool".to_string(),
            AmmType::UniswapV4 => "uniswap_v4_pool".to_string(),
            AmmType::Balancer => "balancer_v2_pool".to_string(),
            AmmType::Curve => "curve".to_string(), // ?
        }
    }
}

impl From<&str> for AmmType {
    fn from(s: &str) -> Self {
        match s {
            "uniswap_v2_pool" => AmmType::UniswapV2,
            "uniswap_v3_pool" => AmmType::UniswapV3,
            "uniswap_v4_pool" => AmmType::UniswapV4,
            "balancer_v2_pool" => AmmType::Balancer,
            "curve" => AmmType::Curve, // ?
            _ => panic!("Unknown AMM type"),
        }
    }
}
use std::{
    collections::HashMap,
    fmt::{self, Display},
    sync::Arc,
};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum SyncState {
    Down = 1,
    Launching = 2,
    Syncing = 3,
    Running = 4,
    Error = 5,
}

impl Display for SyncState {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match *self {
            SyncState::Down => write!(f, "Down"),
            SyncState::Launching => write!(f, "Launching"),
            SyncState::Syncing => write!(f, "Syncing"),
            SyncState::Running => write!(f, "Running"),
            SyncState::Error => write!(f, "Error"),
        }
    }
}

// ======== Shared Data per tasks ========

use tycho_simulation::protocol::{models::ProtocolComponent, state::ProtocolSim};

use super::data::fmt::{SrzProtocolComponent, SrzToken};

pub type SharedTychoStreamState = Arc<RwLock<TychoStreamState>>;

pub struct TychoStreamState {
    // Maps a network name to its ProtocolSim instance.
    pub protosims: HashMap<String, Box<dyn ProtocolSim>>,
    // pub states: HashMap<String, String>,
    // Maps a network name to its new ProtocolComponent.
    // pub components: HashMap<String, ProtocolComponent>,
    pub components: HashMap<String, ProtocolComponent>,
}

pub type ChainCore = tycho_core::dto::Chain;
pub type ChainSimu = tycho_simulation::evm::tycho_models::Chain;

pub fn chain(name: String) -> Option<(ChainCore, ChainSimu)> {
    match name.as_str() {
        "ethereum" => Some((ChainCore::Ethereum, ChainSimu::Ethereum)),
        "arbitrum" => Some((ChainCore::Arbitrum, ChainSimu::Arbitrum)),
        "starknet" => Some((ChainCore::Starknet, ChainSimu::Starknet)),
        "zksync" => Some((ChainCore::ZkSync, ChainSimu::ZkSync)),
        "base" => Some((ChainCore::Base, ChainSimu::Base)),
        _ => None,
    }
}

// ================================================================ API ================================================================

#[derive(Clone, Debug, Deserialize)]
pub struct PairQuery {
    pub tag: String, // Pair uniq identifier: token0-token1
    pub z0to1: bool, // Zero to One as Uniswap expresses it
}

#[derive(Debug, Deserialize)]
pub struct PairResponse {
    pub components: String,   // Must have same size
    pub states: Option<bool>, // Must have same size
}

#[derive(Clone, Debug)]
pub struct PoolComputeData {
    pub component: SrzProtocolComponent,
    pub protosim: Box<dyn ProtocolSim>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairOrderbook {
    pub from: SrzToken,
    pub to: SrzToken,
    pub orderbooks: Vec<Orderbook>,
}

/// Whatever the protocol is, it must comply with this struct
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct Orderbook {
    pub address: String,    // Proto/PooL address
    pub protocol: String,   // Component Protocol name
    pub z0to1: bool,        // Zero to One as Uniswap expresses it
    pub concentrated: bool, // Concentrated liquidity
    pub fee: f64,           // Fee according to ProtoSim
    pub price: f64,         // Price Spot (0 to 1 if z0to1 is true)
    pub reserves: Vec<f64>, // reserves[0], reserves[1]
    pub tick: i32,          // Current tick
    pub spacing: u64,       // Tick spacing
    pub bids: Vec<LiquidityTickAmounts>,
    pub asks: Vec<LiquidityTickAmounts>,
}

#[derive(Debug, Clone)]
pub struct TickDataRange {
    pub tick_lower: i32,
    pub sqrt_price_lower: u128,
    pub tick_upper: i32,
    pub sqrt_price_upper: u128,
}

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct LiquidityTickAmounts {
    pub index: i32,
    pub amount0: f64,
    pub amount1: f64,
    pub p0to1: f64,
    pub p1to0: f64,
}

#[derive(Default, Debug, Clone)]
pub struct SummedLiquidity {
    pub amount0: f64,
    pub amount1: f64,
}
