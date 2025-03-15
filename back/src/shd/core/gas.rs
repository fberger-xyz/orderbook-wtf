use std::collections::{HashMap, HashSet};

use crate::shd::{
    data::fmt::{SrzProtocolComponent, SrzToken},
    r#static::endpoints::COINGECKO_ETH_USD,
    types::{Network, ProtoTychoState},
};
use alloy::providers::{Provider, ProviderBuilder};
use reqwest;
use serde::Deserialize;
use tycho_simulation::models::Token;

#[derive(Debug, Deserialize)]
struct CoinGeckoResponse {
    pub ethereum: CryptoPrice,
}

#[derive(Debug, Deserialize)]
struct CryptoPrice {
    pub usd: f64,
}

/**
 * Used to retrieve gas price
 */
pub async fn gasprice(provider: String) -> u128 {
    let provider = ProviderBuilder::new().on_http(provider.parse().unwrap());
    provider.get_gas_price().await.unwrap_or_default()
}

/**
 * Used to retrieve eth usd price
 */
pub async fn ethusd() -> f64 {
    match reqwest::get(COINGECKO_ETH_USD).await {
        Ok(response) => match response.json::<CoinGeckoResponse>().await {
            Ok(data) => data.ethereum.usd,
            Err(_) => 0.0,
        },
        Err(_) => 0.0,
    }
}

/**
 * Depth-first search (DFS) is a graph traversal method that explores as far as possible along each branch before backtracking.
 */
pub fn pricing(network: Network, ptss: Vec<ProtoTychoState>, atks: Vec<SrzToken>, input: String) -> Option<(f64, Vec<String>)> {
    let mut graph: HashMap<String, Vec<(String, f64)>> = HashMap::new();
    for x in ptss {
        let addresses: Vec<String> = x.component.tokens.iter().map(|t| t.address.to_lowercase()).collect();
        for token_in in addresses.iter() {
            for token_out in addresses.iter() {
                if token_in != token_out {
                    let base = Token::from(atks.iter().find(|t| t.address.to_lowercase() == token_in.clone()).unwrap().clone());
                    let quote = Token::from(atks.iter().find(|t| t.address.to_lowercase() == token_out.clone()).unwrap().clone());
                    if let Ok(sp) = x.protosim.spot_price(&base, &quote) {
                        graph.entry(token_in.clone()).or_default().push((token_out.clone(), sp));
                    }
                }
            }
        }
    }
    let start = input.to_lowercase();
    let target = network.eth.to_lowercase();
    let unit = 1.0;
    let mut stack = vec![(start.clone(), unit, vec![start.clone()])];
    let mut visited: HashSet<String> = HashSet::new();
    while let Some((current, product, path)) = stack.pop() {
        if current == target {
            return Some((product, path));
        }
        if visited.contains(&current) {
            continue;
        }
        visited.insert(current.clone());
        if let Some(neighbors) = graph.get(&current) {
            for (next, rate) in neighbors {
                let mut new = path.clone();
                new.push(next.clone().to_lowercase());
                stack.push((next.clone().to_lowercase(), product * rate, new));
            }
        }
    }
    None
}
