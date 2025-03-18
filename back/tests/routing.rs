use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet, VecDeque};

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

// First, a function to build the conversion graph and find a conversion path.
pub fn ethpath(cps: Vec<SrzProtocolComponent>, input: String, target: String) -> Option<(Vec<String>, Vec<String>)> {
    // (destination token address, component id that provides this conversion)
    let mut graph: HashMap<String, Vec<(String, String)>> = HashMap::new();
    for comp in cps {
        let comp_id = comp.id.clone();
        let addresses: Vec<String> = comp.tokens.iter().map(|t| t.address.to_lowercase()).collect();
        for token_in in &addresses {
            for token_out in &addresses {
                if token_in != token_out {
                    graph.entry(token_in.clone()).or_default().push((token_out.clone(), comp_id.clone()));
                }
            }
        }
    }
    // For debugging: print the graph
    // e.g., log::info!("Graph: {:?}", graph);

    let start = input.to_lowercase();
    let target = target.to_lowercase();
    // Queue items: (current token, token path, component id path)
    let mut queue: VecDeque<(String, Vec<String>, Vec<String>)> = VecDeque::new();
    queue.push_back((start.clone(), vec![start.clone()], vec![]));
    let mut visited: HashSet<String> = HashSet::new();

    while let Some((current, token_path, comp_path)) = queue.pop_front() {
        if current == target {
            return Some((token_path, comp_path));
        }
        if visited.contains(&current) {
            continue;
        }
        visited.insert(current.clone());
        if let Some(neighbors) = graph.get(&current) {
            for (next, comp_id) in neighbors {
                if token_path.contains(next) {
                    continue;
                }
                let mut new_token_path = token_path.clone();
                new_token_path.push(next.clone());
                let mut new_comp_path = comp_path.clone();
                new_comp_path.push(comp_id.clone());
                queue.push_back((next.clone(), new_token_path, new_comp_path));
            }
        }
    }
    None
}

pub fn quote(ptss: Vec<TestProtoTychoState>, atks: Vec<SrzToken>, path: Vec<String>) -> Option<(f64, Vec<String>)> {
    if path.len() < 2 {
        return None;
    }

    let mut cumulative_price = 1.0;
    // For each consecutive pair in the path...
    for window in path.windows(2) {
        let token_in = window[0].to_lowercase();
        let token_out = window[1].to_lowercase();
        log::info!("Calculating conversion from {} to {}", token_in, token_out);
        // Find a protocol state that can convert token_in to token_out.
        let mut found = false;
        for state in &ptss {
            // Extract the component's token addresses.
            let comp_tokens: Vec<String> = state.component.tokens.iter().map(|t| t.address.to_lowercase()).collect();
            if comp_tokens.contains(&token_in) && comp_tokens.contains(&token_out) {
                // Resolve the tokens from the global list.
                let base = Token::from(atks.iter().find(|t| t.address.to_lowercase() == token_in).unwrap().clone());
                let quote = Token::from(atks.iter().find(|t| t.address.to_lowercase() == token_out).unwrap().clone());
                match state.spot_price(&base, &quote) {
                    Ok(rate) => {
                        log::info!("Found rate {} for {} -> {}", rate, token_in, token_out);
                        cumulative_price *= rate;
                        found = true;
                        break;
                    }
                    Err(e) => {
                        log::info!("State cannot convert {} -> {}: {}", token_in, token_out, e);
                    }
                }
            }
        }
        if !found {
            log::info!("No conversion state found for {} -> {}", token_in, token_out);
            return None;
        }
    }
    Some((cumulative_price, path))
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use std::collections::HashMap;

    // Helper to create a token.
    fn token(address: &str, symbol: &str, decimals: usize) -> SrzToken {
        SrzToken {
            address: address.to_string(),
            decimals,
            symbol: symbol.to_string(),
            gas: "gas".to_string(),
        }
    }

    #[test]
    fn test_ethpath_and_quote_unit_wbtc_to_eth() {
        // Use mainnet addresses:
        // WBTC: 0x2260fac5e5542a773aa44fbcfedf7c193bc2c599
        // USDC: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
        // USDT: 0xdac17f958d2ee523a2206206994597c13d831ec7
        // WETH: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

        let token_wbtc = token("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", "wbtc", 8);
        let token_usdc = token("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "usdc", 6);
        let token_usdt = token("0xdac17f958d2ee523a2206206994597c13d831ec7", "usdt", 6);
        let token_weth = token("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "eth", 18);

        // Global token list.
        let atks = vec![token_wbtc.clone(), token_usdc.clone(), token_usdt.clone(), token_weth.clone()];

        // Prepare mock rates (keys are lowercased addresses).
        let mut rates1 = HashMap::new();
        rates1.insert((token_wbtc.address.to_lowercase(), token_usdc.address.to_lowercase()), 20000.0);
        let mut rates2 = HashMap::new();
        rates2.insert((token_usdc.address.to_lowercase(), token_usdt.address.to_lowercase()), 1.0);
        let mut rates3 = HashMap::new();
        rates3.insert((token_usdt.address.to_lowercase(), token_weth.address.to_lowercase()), 0.0003);

        // Create a dummy creation time.
        let now = Utc::now().naive_utc();
        let chain = Chain { name: "ethereum".to_string() };

        // Build protocol components for each conversion pool.
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

        // Assemble all protocol components (for path-finding) into a vector.
        let cps = vec![state1.component.clone(), state2.component.clone(), state3.component.clone()];
        // Also, assemble all protocol states for quoting.
        let ptss = vec![state1, state2, state3];

        // Create the network with WETH as the target.
        let mut network = Network::default();
        network.eth = token_weth.address.to_lowercase();

        // First, find a conversion path from WBTC to WETH.
        let input = token_wbtc.address.to_lowercase();
        let ethpath = ethpath(cps, input.clone(), network.eth.clone());
        assert!(ethpath.is_some(), "Expected a conversion path from WBTC to WETH");
        let ethpath = ethpath.unwrap();
        let path = ethpath.0;
        let comp_path = ethpath.1;
        println!("Found conversion path: {:?}", path);
        println!("Found comp_path path: {:?}", comp_path);
        // Expected path: [WBTC, USDC, USDT, WETH]
        assert_eq!(
            path,
            vec![token_wbtc.address.to_lowercase(), token_usdc.address.to_lowercase(), token_usdt.address.to_lowercase(), token_weth.address.to_lowercase()]
        );

        // Next, compute the cumulative conversion rate for 1 WBTC along the found path.
        let result: Option<(f64, Vec<String>)> = quote(ptss, atks, path.clone());
        assert!(result.is_some(), "Expected to compute a conversion price along the path");
        let (price, route) = result.unwrap();
        println!("Cumulative conversion price: {}, route: {:?}", price, route);
        // Expected: 20000 * 1 * 0.0003 = 6.0 WETH per WBTC.
        assert!((price - 6.0).abs() < 1e-12, "Expected 6.0 WETH, got {}", price);
        assert_eq!(route, path);
    }

    #[test]
    fn test_ethpath_and_quote_unit_usdt_to_eth() {
        // This test checks a direct conversion from USDT to WETH.
        // Use mainnet addresses (same as above).
        let token_wbtc = token("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", "wbtc", 8);
        let token_usdc = token("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "usdc", 6);
        let token_usdt = token("0xdac17f958d2ee523a2206206994597c13d831ec7", "usdt", 6);
        let token_weth = token("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "eth", 18);

        let atks = vec![token_wbtc.clone(), token_usdc.clone(), token_usdt.clone(), token_weth.clone()];

        // For this test, we only need the component that converts USDT -> WETH.
        let mut rates_usdt_weth = HashMap::new();
        rates_usdt_weth.insert((token_usdt.address.to_lowercase(), token_weth.address.to_lowercase()), 0.0003);

        let now = Utc::now().naive_utc();
        let chain = Chain { name: "ethereum".to_string() };

        let comp_usdt_weth = SrzProtocolComponent {
            address: "comp_usdt_weth".into(),
            id: "component_usdt".into(),
            tokens: vec![token_usdt.clone(), token_weth.clone()],
            protocol_system: "TestSystem".into(),
            protocol_type_name: "Swap".into(),
            chain: chain.clone(),
            contract_ids: vec![],
            static_attributes: vec![],
            creation_tx: "tx_usdt".into(),
            created_at: now,
        };
        let state_usdt = TestProtoTychoState {
            component: comp_usdt_weth,
            rates: rates_usdt_weth,
        };

        // For path-finding, we need a vector of components.
        let cps = vec![state_usdt.component.clone()];
        // And for quoting, the vector of protocol states.
        let ptss = vec![state_usdt];

        let mut network = Network::default();
        network.eth = token_weth.address.to_lowercase();

        // Find a conversion path from USDT to WETH.
        let input = token_usdt.address.to_lowercase();
        let ethpath = ethpath(cps, input.clone(), network.eth.clone());
        assert!(ethpath.is_some(), "Expected a conversion path from WBTC to WETH");
        let ethpath = ethpath.unwrap();
        let path = ethpath.0;
        let comp_path = ethpath.1;
        println!("Found conversion path: {:?}", path);
        println!("Found comp_path path: {:?}", comp_path);
        // Expected path: [WBTC, USDC, USDT, WETH]        // Expected path: [USDT, WETH]
        assert_eq!(path, vec![token_usdt.address.to_lowercase(), token_weth.address.to_lowercase()]);

        // Compute the cumulative conversion rate along that path.
        let result = quote(ptss, atks, path.clone());
        assert!(result.is_some(), "Expected a conversion price for USDT->WETH");
        let (price, route) = result.unwrap();
        println!("Cumulative conversion price (USDT->WETH): {}, route: {:?}", price, route);
        // Expected rate: 0.0003
        assert!((price - 0.0003).abs() < 1e-12, "Expected 0.0003 WETH, got {}", price);
        assert_eq!(route, path);
    }
}
