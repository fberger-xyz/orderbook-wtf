use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

#[derive(Debug, Clone)]
pub struct EnvConfig {
    pub testing: bool,
    pub tycho_url: String,
    pub tycho_api_key: String,
    pub port: u64,
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

pub type SharedTychoStreamState = Arc<RwLock<TychoStreamState>>;

pub struct TychoStreamState {
    // Maps a network name to its ProtocolSim instance.
    // pub states: HashMap<String, Box<dyn ProtocolSim + Send + Sync>>,
    pub states: HashMap<String, String>,
    // Maps a network name to its new ProtocolComponent.
    // pub components: HashMap<String, ProtocolComponent>,
    pub components: HashMap<String, String>,
}
