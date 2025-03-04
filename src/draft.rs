use std::str::FromStr;

use tap2::shd;
use tap2::shd::types::EnvConfig;
use tap2::shd::types::Network;
use tycho_client::rpc::HttpRPCClient;
use tycho_client::rpc::RPCClient;
use tycho_core::dto::Chain;
use tycho_core::dto::PaginationParams;
use tycho_core::dto::TokensRequestBody;


#[tokio::main]
async fn main() {

    shd::utils::misc::log::new("draft".to_string());
    dotenv::from_filename(".env").ok();
    let config = EnvConfig::new();
    log::info!("Starting Draft | 🧪 Testing {:?}", config.testing);
    let path = "src/shd/config/networks.json".to_string();
    let networks: Vec<Network> = shd::utils::misc::read(&path);

    match HttpRPCClient::new(&config.tycho_url, Some(&config.tycho_api_key)) {
        Ok(client) => {        
            log::info!("Connected to Tycho");
            for network in networks { 
                log::info!("Network: {:?}", network);
                let chain = match network.name.as_str() {
                    "ethereum" => Chain::Ethereum,
                    "arbitrum" => Chain::Arbitrum,
                    _ => Chain::Ethereum,
                };
                
                let eth = tycho_core::Bytes::from_str(network.eth.as_str()).unwrap();
                let usdc = tycho_core::Bytes::from_str(network.usdc.as_str()).unwrap();
                let trb = TokensRequestBody {
                    token_addresses : Some(vec![eth, usdc]),// Option<Vec<Bytes>>,
                    min_quality : Some(100),// Option<i32>,
                    traded_n_days_ago : Some(1),// Option<u64>,
                    pagination : PaginationParams { page: 0, page_size: 10}, // PaginationParams,
                    chain,// Chain,
                };

                match client
                .get_tokens(
                    &trb
                )
                .await
                {
                    Ok(tokens) => {
                       dbg!(tokens);
                    }
                    
                    Err(e) => {
                        log::error!("Failed to get tokens: {:?}", e);
                    }
                }
            }
        }
        Err(e) => {
            log::error!("Failed to create client: {:?}", e);
            return;
        }
    }
}
