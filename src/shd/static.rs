pub enum TychoDex {
    UniswapV2,
    UniswapV3,
}

impl ToString for TychoDex {
    fn to_string(&self) -> String {
        match self {
            TychoDex::UniswapV2 => "uniswap_v2".to_string(),
            TychoDex::UniswapV3 => "uniswap_v3".to_string(),
        }
    }
}

pub mod endpoints {
    pub static REDIS_LOCAL: &str = "127.0.0.1:7777";
}

pub mod data {

    // ! ALL LOWERCASE

    pub mod keys {

        pub mod stream {

            // stream:status:<network> => SyncState
            pub fn status(network: String) -> String {
                format!("stream:status:{}", network.to_lowercase())
            }

            // stream:latest:<network> => u64
            pub fn latest(network: String) -> String {
                format!("stream:latest:{}", network.to_lowercase())
            }

            pub fn tokens(network: String) -> String {
                format!("stream:tokens:{}", network.to_lowercase())
            }

            // stream:component:<id> => Component (serialized)
            pub fn component(id: String) -> String {
                format!("stream:component:{}", id.to_lowercase())
            }

            // stream:component:<id> => ProtocolState (serialized)
            pub fn state(id: String) -> String {
                format!("stream:state:{}", id.to_lowercase())
            }

            // stream:components:<token0-token1> => array of components
            // A dash between the addresses, a dash '-' ! And Token0 < Token1
            pub fn components(token0: &String, token1: String) -> String {
                format!("stream:components:{}-{}", token0.to_lowercase(), token1.to_lowercase())
            }
        }
    }
}
