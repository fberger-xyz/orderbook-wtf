// pub async fn load_all_tokens(tycho_url: &str, no_tls: bool, auth_key: Option<&str>, chain: Chain, min_quality: Option<i32>, max_days_since_last_trade: Option<u64>) -> HashMap<Bytes, Token> {
//     log::info!("Loading tokens from Tycho...");
//     let rpc_url = if no_tls { format!("http://{tycho_url}") } else { format!("https://{tycho_url}") };
//     let rpc_client = HttpRPCClient::new(rpc_url.as_str(), auth_key).unwrap();
//     // Chain specific defaults for special case chains. Otherwise defaults to 42 days.
//     let default_min_days = HashMap::from([(Chain::Base, 10_u64)]);
//     rpc_client
//         .get_all_tokens(chain.into(), min_quality.or(Some(100)), max_days_since_last_trade.or(default_min_days.get(&chain).or(Some(&42)).copied()), 3_000)
//         .await
//         .expect("Unable to load tokens")
//         .into_iter()
//         .map(|token| {
//             let token_clone = token.clone();
//             let token_formmated = Token {
//                 address: token.address.clone(),
//                 decimals: token.decimals as usize,
//                 symbol: token.symbol,
//                 gas: BigUint::from(0u32),
//             };
//             (token.address.clone(), token_formmated)
//         })
//         .collect::<HashMap<_, Token>>()
// }

use std::sync::Arc;

use alloy::{providers::RootProvider, transports::http::Http};
use reqwest::Client;

alloy::sol!(
    #[allow(missing_docs)]
    #[sol(rpc)]
    IERC20,
    "src/shd/utils/abis/IERC20.json"
);

pub async fn get_balance_all(provider: &RootProvider<Http<Client>>, token: String, user: String) -> u128 {
    get_balance(provider, token, user).await
}

/**
 * Fetch the balance of an ERC20 token for a given user
 */
pub async fn get_balance(provider: &RootProvider<Http<Client>>, token: String, user: String) -> u128 {
    let client = Arc::new(provider);
    let contract = IERC20::new(token.parse().unwrap(), client);
    
    contract.balanceOf(user.parse().unwrap()).call().await.unwrap().balance.to_string().parse().unwrap()
}
