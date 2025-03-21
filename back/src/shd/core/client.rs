use std::str::FromStr;
use std::sync::Arc;

use alloy::providers::RootProvider;
use alloy::transports::http::Http;
use num_bigint::BigUint;
use reqwest::Client;
use tycho_client::rpc::HttpRPCClient;
use tycho_client::rpc::RPCClient;

use tycho_simulation::models::Token;

use crate::shd;
use crate::shd::types::EnvConfig;
use crate::shd::types::Network;
use crate::shd::types::IERC20;

pub async fn get_all_tokens(network: &Network, config: &EnvConfig) -> Option<Vec<Token>> {
    log::info!("Getting all tokens on {}", network.name);
    match HttpRPCClient::new(format!("https://{}", &network.tycho).as_str(), Some(&config.tycho_api_key)) {
        Ok(client) => {
            let time = std::time::SystemTime::now();
            let (chain, _, _) = shd::types::chain(network.name.clone()).expect("Invalid chain");
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

/**
 * Get the balance of the owner for the specified tokens.
 */
pub async fn get_balances(provider: &RootProvider<Http<Client>>, owner: String, tokens: Vec<String>) -> Result<Vec<u128>, String> {
    let mut balances = vec![];
    let client = Arc::new(provider);
    for t in tokens.iter() {
        let contract = IERC20::new(t.parse().unwrap(), client.clone());
        match contract.balanceOf(owner.parse().unwrap()).call().await {
            Ok(res) => {
                let balance = res.balance.to_string().parse::<u128>().unwrap();
                balances.push(balance);
            }
            Err(e) => {
                log::error!("Failed to get balance for {}: {:?}", t, e);
                balances.push(0);
            }
        }
    }
    Ok(balances)
}
