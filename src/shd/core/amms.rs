// Get u4 pools balances
// v4 => (https://github.com/Uniswap/v4-periphery/blob/main/src/interfaces/IStateView.sol)
// https://etherscan.io/address/0x7ffe42c4a5deea5b0fec41c94c136cf115597227#readContract

// PooL ID: 0xe018f09af38956affdfeab72c2cefbcd4e6fee44d09df7525ec9dba3e51356a5
// https://soliditydeveloper.com/uniswap4

// Get balancer pools balances
// https://etherscan.io/address/0xba12222222228d8ba445958a75a0704d566bf2c8#readContract

use std::sync::Arc;

use alloy::{dyn_abi::abi::token, providers::RootProvider, transports::http::Http};
use reqwest::Client;

use crate::shd::data::fmt::SrzProtocolComponent;

alloy::sol!(
    #[allow(missing_docs)]
    #[sol(rpc)]
    IERC20,
    "src/shd/utils/abis/IERC20.json"
);

/**
 * Fetch the total avalable liquidity balance of component's tokens, depending the pool type
 * Divided by 10^decimals to get the real balance
 */
pub async fn component_liquidity(provider: &RootProvider<Http<Client>>, cp: SrzProtocolComponent) -> Vec<f64> {
    let client = Arc::new(provider);
    let mut balances = cp.tokens.iter().map(|_t| 0.).collect::<Vec<f64>>();
    match cp.protocol_type_name.as_str() {
        "uniswap_v2_pool" | "uniswap_v3_pool" => {
            for (i, t) in cp.tokens.iter().enumerate() {
                let contract = IERC20::new(t.address.parse().unwrap(), client.clone());
                let balance = contract.balanceOf(cp.address.parse().unwrap()).call().await.unwrap().balance.to_string().parse::<u128>().unwrap();
                let balance = balance as f64 / 10u128.pow(t.decimals as u32) as f64;
                balances[i] = balance;
            }
        }
        "uniswap_v4_pool" => {}
        "balancer_v2_pool" => {}
        "curve" => {}
        _ => {
            log::info!("Unknown protocol type: {}", cp.protocol_type_name);
        }
    }
    balances
}
