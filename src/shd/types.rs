use serde::{Deserialize, Serialize};

#[derive(Debug, Clone)]
pub struct EnvConfig {
    pub testing: bool,
    pub tycho_url: String,
    pub tycho_api_key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Network {
    pub name: String,
    pub chainid: u64,
    pub eth: String,
    pub usdc: String,
    pub rpc: String,
    pub exp: String,
}
