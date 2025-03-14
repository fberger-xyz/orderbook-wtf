use std::str::FromStr;

use num_bigint::BigUint;
use tycho_client::rpc::HttpRPCClient;
use tycho_client::rpc::RPCClient;

use tycho_simulation::models::Token;

use crate::shd;
use crate::shd::types::EnvConfig;
use crate::shd::types::Network;

pub async fn get_all_tokens(network: &Network, config: &EnvConfig) -> Option<Vec<Token>> {
    log::info!("Getting all tokens on {}", network.name);
    match HttpRPCClient::new(&network.tycho, Some(&config.tycho_api_key)) {
        Ok(client) => {
            let time = std::time::SystemTime::now();
            let (chain, _) = shd::types::chain(network.name.clone()).expect("Invalid chain");
            match client.get_all_tokens(chain, Some(100), Some(1), 3000).await {
                Ok(result) => {
                    let mut tokens = vec![];
                    for t in result.iter() {
                        let g = t.gas.first().unwrap_or(&Some(0u64)).unwrap_or_default();
                        tokens.push(Token {
                            address: tycho_simulation::tycho_core::Bytes::from_str(t.address.clone().to_string().as_str()).unwrap(),
                            decimals: t.decimals as usize,
                            symbol: t.symbol.clone(),
                            gas: BigUint::from(g),
                        });
                    }
                    let elasped = time.elapsed().unwrap().as_millis();
                    log::info!("Took {:?} ms to get {} tokens on {}. Saving on Redis", elasped, tokens.len(), network.name);
                    Some(tokens)
                }
                Err(e) => {
                    log::error!("Failed to get tokens: {:?}", e.to_string());
                    None
                }
            }
        }
        Err(e) => {
            log::error!("Failed to create client: {:?}", e.to_string());
            None
        }
    }
}
