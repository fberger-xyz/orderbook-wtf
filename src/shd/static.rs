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

            // stream:tokens:<network> => array of tokens
            pub fn tokens(network: String) -> String {
                format!("stream:tokens:{}", network.to_lowercase())
            }

            // stream:pairs:<network> => array of pairs
            pub fn pairs(network: String) -> String {
                format!("stream:pairs:{}", network.to_lowercase())
            }

            // stream:component:id => one component
            pub fn component(network: String, id: String) -> String {
                format!("stream:{}:component:{}", network, id.to_lowercase())
            }

            // stream:state:id => one state
            pub fn state(network: String, id: String) -> String {
                format!("stream:{}:state:{}", network, id.to_lowercase())
            }

            // stream:component:<id> => Component (serialized)
            pub fn components(network: String) -> String {
                format!("stream:components:{}", network.to_lowercase())
            }

            // stream:component:<id> => ProtocolState (serialized)
            pub fn states(network: String) -> String {
                format!("stream:state:{}", network.to_lowercase())
            }
        }
    }
}
