use chrono::{NaiveDateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// A simplified token structure for conversion purposes,
/// now including an address field.
#[derive(Clone, Debug)]
pub struct Token {
    pub address: String,
    pub symbol: String,
}

impl From<SrzToken> for Token {
    fn from(token: SrzToken) -> Self {
        Token {
            address: token.address,
            symbol: token.symbol,
        }
    }
}

/// The blockchain network.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Chain {
    pub name: String,
}

/// The protocol component structure.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SrzProtocolComponent {
    pub address: String,
    pub id: String,
    pub tokens: Vec<SrzToken>,
    pub protocol_system: String,
    pub protocol_type_name: String,
    pub chain: Chain,
    pub contract_ids: Vec<String>,
    pub static_attributes: Vec<(String, String)>,
    pub creation_tx: String,
    pub created_at: NaiveDateTime,
}

/// The token structure.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SrzToken {
    pub address: String,
    pub decimals: usize,
    pub symbol: String,
    pub gas: String,
}

/// For testing we define a new state type that does not use dynamic protosim.
/// Instead, it holds a rates map and provides its own spot_price method.
#[derive(Clone, Debug)]
pub struct TestProtoTychoState {
    pub component: SrzProtocolComponent,
    // The conversion rates: keys are (base_address, quote_address) in lowercase.
    pub rates: HashMap<(String, String), f64>,
}

impl TestProtoTychoState {
    /// A local spot_price function that uses the rates map.
    pub fn spot_price(&self, base: &Token, quote: &Token) -> Result<f64, String> {
        let key = (base.address.to_lowercase(), quote.address.to_lowercase());
        self.rates.get(&key).cloned().ok_or_else(|| "Conversion not supported".into())
    }
}

/// The network definition, with the target token address (ETH / WETH).
#[derive(Default, Clone)]
pub struct Network {
    pub eth: String,
}

/// pricing_test builds a conversion graph from the given TestProtoTychoState states and uses DFS
/// to find a conversion route from the input token (by its address) to the network's ETH target.
/// It returns the cumulative conversion rate and the route.
pub fn pricing_test(network: Network, ptss: Vec<TestProtoTychoState>, atks: Vec<SrzToken>, input: String) -> Option<(f64, Vec<String>)> {
    let mut graph: HashMap<String, Vec<(String, f64)>> = HashMap::new();
    for state in ptss {
        // Build the list of token addresses (in lowercase) available in the component.
        let addresses: Vec<String> = state.component.tokens.iter().map(|t| t.address.to_lowercase()).collect();
        for token_in in addresses.iter() {
            for token_out in addresses.iter() {
                if token_in != token_out {
                    // Resolve tokens from the global token list by matching addresses.
                    let base = Token::from(atks.iter().find(|t| t.address.to_lowercase() == token_in.clone()).unwrap().clone());
                    let quote = Token::from(atks.iter().find(|t| t.address.to_lowercase() == token_out.clone()).unwrap().clone());
                    if let Ok(sp) = state.spot_price(&base, &quote) {
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
                let mut new_path = path.clone();
                new_path.push(next.clone());
                stack.push((next.clone(), product * rate, new_path));
            }
        }
    }
    None
}

#[cfg(test)]
mod tests {

    

    use super::*;

    #[test]
    fn test_pricing_test_wbtc_to_eth() {
        // Use mainnet addresses:
        // WBTC: 0x2260fac5e5542a773aa44fbcfedf7c193bc2c599
        // USDC: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
        // USDT: 0xdac17f958d2ee523a2206206994597c13d831ec7
        // WETH: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

        let token_wbtc = SrzToken {
            address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599".into(),
            decimals: 8,
            symbol: "wbtc".into(),
            gas: "gas1".into(),
        };
        let token_usdc = SrzToken {
            address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48".into(),
            decimals: 6,
            symbol: "usdc".into(),
            gas: "gas2".into(),
        };
        let token_usdt = SrzToken {
            address: "0xdac17f958d2ee523a2206206994597c13d831ec7".into(),
            decimals: 6,
            symbol: "usdt".into(),
            gas: "gas3".into(),
        };
        let token_weth = SrzToken {
            address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2".into(),
            decimals: 18,
            symbol: "eth".into(),
            gas: "gas4".into(),
        };

        // Global token list.
        let atks = vec![token_wbtc.clone(), token_usdc.clone(), token_usdt.clone(), token_weth.clone()];

        // Prepare mock rates using addresses (all lowercased).
        let mut rates1 = HashMap::new();
        rates1.insert((token_wbtc.address.to_lowercase(), token_usdc.address.to_lowercase()), 20000.0);
        let mut rates2 = HashMap::new();
        rates2.insert((token_usdc.address.to_lowercase(), token_usdt.address.to_lowercase()), 1.0);
        let mut rates3 = HashMap::new();
        rates3.insert((token_usdt.address.to_lowercase(), token_weth.address.to_lowercase()), 0.0003);

        // Create a dummy creation time.
        let now = Utc::now().naive_utc();
        let chain = Chain { name: "ethereum".into() };

        // Component 1: conversion WBTC -> USDC.
        let comp1 = SrzProtocolComponent {
            address: "comp1".into(),
            id: "component1".into(),
            tokens: vec![token_wbtc.clone(), token_usdc.clone()],
            protocol_system: "TestSystem".into(),
            protocol_type_name: "Swap".into(),
            chain: chain.clone(),
            contract_ids: vec![],
            static_attributes: vec![],
            creation_tx: "tx1".into(),
            created_at: now,
        };
        let state1 = TestProtoTychoState { component: comp1, rates: rates1 };

        // Component 2: conversion USDC -> USDT.
        let comp2 = SrzProtocolComponent {
            address: "comp2".into(),
            id: "component2".into(),
            tokens: vec![token_usdc.clone(), token_usdt.clone()],
            protocol_system: "TestSystem".into(),
            protocol_type_name: "Swap".into(),
            chain: chain.clone(),
            contract_ids: vec![],
            static_attributes: vec![],
            creation_tx: "tx2".into(),
            created_at: now,
        };
        let state2 = TestProtoTychoState { component: comp2, rates: rates2 };

        // Component 3: conversion USDT -> WETH.
        let comp3 = SrzProtocolComponent {
            address: "comp3".into(),
            id: "component3".into(),
            tokens: vec![token_usdt.clone(), token_weth.clone()],
            protocol_system: "TestSystem".into(),
            protocol_type_name: "Swap".into(),
            chain: chain.clone(),
            contract_ids: vec![],
            static_attributes: vec![],
            creation_tx: "tx3".into(),
            created_at: now,
        };
        let state3 = TestProtoTychoState { component: comp3, rates: rates3 };

        // Create the network with WETH as the target.
        let mut network = Network::default();
        network.eth = token_weth.address.to_lowercase();

        // Assemble all states.
        let ptss = vec![state1, state2, state3];

        // Input is the starting token address for WBTC.
        let input = token_wbtc.address.to_lowercase();

        // Expected conversion:
        // 1 WBTC -> 20000 USDC; 1 USDC -> 1 USDT; 1 USDT -> 0.0003 WETH.
        // Cumulative: 20000 * 1 * 0.0003 = 6.0 WETH.
        // Expected route: [WBTC address, USDC address, USDT address, WETH address].
        let result = pricing_test(network.clone(), ptss.clone(), atks.clone(), input.clone()).expect("A conversion path must exist");
        let (price, route) = result;
        println!("Price: {}, Route: {:?}", price, route);
        assert!((price - 6.0).abs() < 1e-12, "Expected 6.0 WETH, got {}", price);
        assert_eq!(
            route,
            vec![token_wbtc.address.to_lowercase(), token_usdc.address.to_lowercase(), token_usdt.address.to_lowercase(), token_weth.address.to_lowercase()]
        );

        // #2
        let input = token_usdt.address.to_lowercase();

        // Expected conversion:
        // 1 USDT -> 1/20 000 BTC; 1/20 000 BTC -> 1 USDC; 1 USDC -> 0.0003 WETH.
        // Cumulative: 20000 * 1 * 0.0003 = 6.0 WETH.
        // Expected route: [WBTC address, USDC address, USDT address, WETH address].
        let result = pricing_test(network.clone(), ptss, atks, input).expect("A conversion path must exist");
        let (price, route) = result;
        println!("Price: {}, Route: {:?}", price, route);
        assert!((price - 0.0003).abs() < 1e-12, "Expected 0.0003 WETH, got {}", price);
        assert_eq!(route, vec![token_usdt.address.to_lowercase(), token_weth.address.to_lowercase()]);
    }
}
