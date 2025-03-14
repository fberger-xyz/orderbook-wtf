use axum::{
    extract::{Path, Query},
    response::IntoResponse,
    routing::get,
    Extension, Json, Router,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use tap2::shd::{
    self,
    data::fmt::{SrzEVMPoolState, SrzProtocolComponent, SrzToken, SrzUniswapV2State, SrzUniswapV3State, SrzUniswapV4State},
    types::{AmmType, EnvConfig, Network, PairQuery, ProtoTychoState, SharedTychoStreamState},
};

use utoipa::ToSchema;

// #[utoipa::path(
//     get,
//     path = "/version",
//     responses(
//         (status = 200, description = "Get API version", body = APIVersion)
//     )
// )]
#[derive(Serialize, Deserialize, ToSchema)]
pub struct APIVersion {
    pub version: String,
}

// GET / => "Hello, Tycho!"
async fn root() -> impl IntoResponse {
    Json(json!({ "data": "Tycho Stream running" }))
}

// GET /version => Get version of the API (for example, a commit hash)
async fn version() -> impl IntoResponse {
    log::info!("👾 API: GET /version");
    Json(APIVersion { version: "0.1.0".into() })
}

// GET /network => Get network object and its configuration
async fn network(Extension(network): Extension<Network>) -> impl IntoResponse {
    log::info!("👾 API: GET /network on {} network", network.name);
    Json(network)
}

// GET /status => Get network status + last block synced
async fn status(Extension(network): Extension<Network>) -> impl IntoResponse {
    log::info!("👾 API: GET /status on {} network", network.name);
    let key1 = shd::r#static::data::keys::stream::status(network.name.clone());
    let key2 = shd::r#static::data::keys::stream::latest(network.name.clone());
    let status = shd::data::redis::get::<u128>(key1.as_str()).await;
    let latest = shd::data::redis::get::<u64>(key2.as_str()).await;
    match (status, latest) {
        (Some(status), Some(latest)) => Json(json!({ "status": status.to_string(), "latest": latest.to_string() })),
        _ => Json(json!({ "status": "unknown", "latest": "0" })),
    }
}

async fn _tokens(network: Network) -> Option<Vec<SrzToken>> {
    let key = shd::r#static::data::keys::stream::tokens(network.name.clone());
    shd::data::redis::get::<Vec<SrzToken>>(key.as_str()).await
}

// GET /network => Get network object and its configuration
async fn tokens(Extension(network): Extension<Network>) -> impl IntoResponse {
    log::info!("👾 API: GET /tokens on {} network", network.name);
    match _tokens(network.clone()).await {
        Some(tokens) => Json(json!({ "tokens": tokens })),
        _ => Json(json!({ "tokens": [] })),
    }
}

// GET /pairs => Get all existing pairs in the database (as a vector of strings like "0xToken0-0xToken1")
async fn pairs(Extension(network): Extension<Network>) -> impl IntoResponse {
    log::info!("👾 API: GET /pairs on {} network", network.name);
    let key = shd::r#static::data::keys::stream::pairs(network.name.clone());
    match shd::data::redis::get::<Vec<String>>(key.as_str()).await {
        Some(pairs) => Json(json!({ "pairs": pairs })),
        _ => Json(json!({ "pairs": [] })),
    }
}

async fn _components(network: Network) -> Option<Vec<SrzProtocolComponent>> {
    let key = shd::r#static::data::keys::stream::components(network.name.clone());
    shd::data::redis::get::<Vec<SrzProtocolComponent>>(key.as_str()).await
}

// GET /components => Get all existing components
async fn components(Extension(network): Extension<Network>) -> impl IntoResponse {
    log::info!("👾 API: GET /components on {} network", network.name);
    match _components(network).await {
        Some(cps) => Json(json!({ "components": cps })),
        _ => Json(json!({ "components": [] })),
    }
}

async fn _pool(network: Network, id: String) -> Json<serde_json::Value> {
    let key = shd::r#static::data::keys::stream::component(network.name.clone(), id.clone());
    match shd::data::redis::get::<SrzProtocolComponent>(key.as_str()).await {
        Some(comp) => {
            let key = shd::r#static::data::keys::stream::state(network.name.clone(), id.clone());
            match AmmType::from(comp.protocol_type_name.as_str()) {
                AmmType::UniswapV2 => match shd::data::redis::get::<SrzUniswapV2State>(key.as_str()).await {
                    Some(state) => Json(json!({ "component": comp, "state": state })),
                    _ => Json(json!({ "component": comp, "state": {} })),
                },
                AmmType::UniswapV3 => match shd::data::redis::get::<SrzUniswapV3State>(key.as_str()).await {
                    Some(state) => Json(json!({ "component": comp, "state": state })),
                    _ => Json(json!({ "component": comp, "state": {} })),
                },
                AmmType::UniswapV4 => match shd::data::redis::get::<SrzUniswapV4State>(key.as_str()).await {
                    Some(state) => Json(json!({ "component": comp, "state": state })),
                    _ => Json(json!({ "component": comp, "state": {} })),
                },
                AmmType::Balancer => match shd::data::redis::get::<SrzEVMPoolState>(key.as_str()).await {
                    Some(state) => Json(json!({ "component": comp, "state": state })),
                    _ => Json(json!({ "component": comp, "state": {} })),
                },
                AmmType::Curve => match shd::data::redis::get::<SrzEVMPoolState>(key.as_str()).await {
                    Some(state) => Json(json!({ "component": comp, "state": state })),
                    _ => Json(json!({ "component": comp, "state": {} })),
                },
            }
        }
        None => Json(json!({ "component": {}, "state": {}})),
    }
}

// GET /component/{id} => Get the component for the given pool (by id)
async fn pool(Extension(network): Extension<Network>, Path(id): Path<String>) -> impl IntoResponse {
    log::info!("👾 API: GET /pool on {} network", network.name);
    _pool(network, id).await
}

// Check if a component has the desired tokens
pub fn matchcp(cptks: Vec<SrzToken>, tokens: Vec<SrzToken>) -> bool {
    for x in cptks.clone() {
        if alloy::primitives::Address::default().to_string() == x.address {
            log::info!("🔺 Component {} has a token with an empty address", x.address);
            return false;
        }
    }
    for x in tokens.clone() {
        if alloy::primitives::Address::default().to_string() == x.address {
            log::info!("🔺 Component {} has a token with an empty address", x.address);
            return false;
        }
    }
    // if cptks.len() != 2 {
    //     log::error!("Component {} has {} tokens instead of 2. Component with >2 tokens are not handled yet.", cp.id, cptks.len());
    //     return false;
    // }
    tokens.iter().all(|token| cptks.iter().any(|cptk| cptk.address.eq_ignore_ascii_case(&token.address)))
}

// GET /orderbook/{0xt0-0xt1} => Get all component & state for a given pair of token, and simulate the orderbook
async fn orderbook(Extension(shtss): Extension<SharedTychoStreamState>, Extension(network): Extension<Network>, Query(params): Query<PairQuery>) -> impl IntoResponse {
    log::info!("👾 API: Querying orderbook endpoint: {:?}", params.tag);
    match (_tokens(network.clone()).await, _components(network.clone()).await) {
        (Some(atks), Some(cps)) => {
            let target = params.tag.clone();
            let tokens = target.split("-").map(|x| x.to_string().to_lowercase()).collect::<Vec<String>>();
            let srzt0 = atks.iter().find(|x| x.address.to_lowercase() == tokens[0].clone()).unwrap();
            let srzt1 = atks.iter().find(|x| x.address.to_lowercase() == tokens[1].clone()).unwrap();
            let tokens = vec![srzt0.clone(), srzt1.clone()];
            let mtx = shtss.read().await;
            let balances = mtx.balances.clone();
            drop(mtx);
            if tokens.len() == 2 {
                let mut ptss: Vec<ProtoTychoState> = vec![];
                for cp in cps.clone() {
                    let cptks = cp.tokens.clone();
                    if matchcp(cptks.clone(), tokens.clone()) {
                        let mtx = shtss.read().await;
                        let protosim = mtx.protosims.get(&cp.id.to_lowercase()).unwrap().clone();
                        drop(mtx);
                        ptss.push(ProtoTychoState { component: cp, protosim });
                    }
                }
                if ptss.is_empty() {
                    return Json(json!({ "orderbook": {} }));
                }
                // shd::core::pair::prepare(network.clone(), ptss.clone(), tokens.clone(), params.clone()).await;
                let result = shd::core::orderbook::build(network.clone(), atks.clone(), balances.clone(), ptss.clone(), tokens.clone(), params.clone()).await;
                let path = format!("misc/data-front/odb.{}.{}.json", network.name, params.tag);
                crate::shd::utils::misc::save1(result.clone(), path.as_str());
                Json(json!({ "orderbook": result.clone() }))
            } else {
                log::error!("Query param Tag must contain only 2 tokens separated by a dash '-'");
                Json(json!({ "orderbook": "Query param Tag must contain only 2 tokens separated by a dash '-'." }))
            }
        }
        _ => {
            log::error!("Couldn't not read internal components");
            Json(json!({ "orderbook": "Couldn't not read internal components" }))
        }
    }
}

// GET /liquidity/{0xt0-0xt1} => Get all component & state (= /pool) for a given pair of token, and organize the liquidity across n pools of n AMMs
async fn liquidity(Extension(shtss): Extension<SharedTychoStreamState>, Extension(network): Extension<Network>, Query(params): Query<PairQuery>) -> impl IntoResponse {
    log::info!("👾 API: Querying liquidity endpoint: {:?}", params.tag);
    match (_tokens(network.clone()).await, _components(network.clone()).await) {
        (Some(atks), Some(cps)) => {
            let target = params.tag.clone();
            let tokens = target.split("-").map(|x| x.to_string().to_lowercase()).collect::<Vec<String>>();
            let srzt0 = atks.iter().find(|x| x.address.to_lowercase() == tokens[0].clone()).unwrap();
            let srzt1 = atks.iter().find(|x| x.address.to_lowercase() == tokens[1].clone()).unwrap();
            let tokens = vec![srzt0.clone(), srzt1.clone()];
            if tokens.len() == 2 {
                let mtx = shtss.read().await;
                let _balances = mtx.balances.clone();
                drop(mtx);
                let mut datapools: Vec<ProtoTychoState> = vec![];
                for cp in cps.clone() {
                    let cptks = cp.tokens.clone();
                    if cptks.len() != 2 {
                        log::info!("Component {} has {} tokens instead of 2. Component with >2 tokens are not handled yet.", cp.id, cptks.len());
                    } else if cptks[0].address.to_lowercase() == tokens[0].address.to_lowercase() && cptks[1].address.to_lowercase() == tokens[1].address.to_lowercase() {
                        let mtx = shtss.read().await;
                        let protosim = mtx.protosims.get(&cp.id.to_lowercase()).unwrap().clone();
                        drop(mtx);
                        datapools.push(ProtoTychoState { component: cp, protosim });
                    }
                }
                shd::core::liquidity::build(network.clone(), datapools.clone(), tokens.clone(), params.clone()).await;
                Json(json!({ "liquidity": [] })) // !
            } else {
                log::error!("Query param Tag must contain only 2 tokens separated by a dash '-'");
                Json(json!({ "liquidity": "Query param Tag must contain only 2 tokens separated by a dash '-'." }))
            }
        }
        _ => {
            log::error!("Couldn't not read internal components");
            Json(json!({ "liquidity": "Couldn't not read internal components" }))
        }
    }
}

pub async fn start(n: Network, shared: SharedTychoStreamState, config: EnvConfig) {
    log::info!("👾 Launching API for '{}' network | 🧪 Testing mode: {:?} | Port: {}", n.name, config.testing, n.port);
    let rstate = shared.read().await;
    log::info!("Testing SharedTychoStreamState read = {:?} with {:?}", rstate.protosims.keys(), rstate.protosims.values());
    log::info!(" => rstate.states.keys and rstate.states.values => {:?} with {:?}", rstate.protosims.keys(), rstate.protosims.values());
    log::info!(" => rstate.components.keys and rstate.components.values => {:?} with {:?}", rstate.components.keys(), rstate.components.values());
    log::info!(" => rstate.balances.keys and rstate.balances.values => {:?} with {:?}", rstate.balances.keys(), rstate.balances.values());
    drop(rstate);
    let app = Router::new()
        .route("/", get(root))
        .route("/version", get(version))
        .route("/network", get(network))
        .route("/status", get(status))
        .route("/tokens", get(tokens))
        .route("/pairs", get(pairs))
        .route("/components", get(components))
        .route("/pool/{id}", get(pool))
        .route("/orderbook", get(orderbook))
        .route("/liquidity", get(liquidity))
        .layer(Extension(n.clone()))
        .layer(Extension(shared.clone())); // Shared state
                                           // shd::utils::misc::log::logtest();
    match tokio::net::TcpListener::bind(format!("0.0.0.0:{}", n.port)).await {
        Ok(listener) => match axum::serve(listener, app).await {
            Ok(_) => {
                log::info!("(Logs never displayed in theory): API for '{}' network is running on port {}", n.name, n.port);
            }
            Err(e) => {
                log::error!("Failed to start API for '{}' network: {}", n.name, e);
            }
        },
        Err(e) => {
            log::error!("Failed to bind to port {}: {}", n.port, e);
        }
    }
}

// ================================== API Endpoints ==================================
// A pool has an idea and can be an address "0x1234" or a bytes (uniswap v4) "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019"
// A pair is "0xToken0-0xToken1" and can have multiple liquidity pool attached to it
// - / => "Hello, Tycho!"
// - /version => Get version of the API 📕
// - /network => Get network object, its configuration 📕
// - /status => Get network status + last block synced 📕
// - /tokens => Get all tokens of the network 📕
// - /pairs => Get all existing pairs in database (vector of strings of token0-token1) + optional FILTER on address 📕
// - /component/:id => Get the component the given pool  📍
// - /state/:id => Get the component the given pool 📍
// - /components/:pair => Get ALL components for 1 pair 📍

#[cfg(test)]
mod tests {
    use super::*;
    // Assuming alloy::primitives::Address is accessible,
    // here we use its default address to simulate an empty address.
    // For this example, let's assume that Address::default().to_string() returns "0x0000000000000000000000000000000000000000".

    // Helper function to create a token.
    fn token(address: &str, symbol: &str) -> SrzToken {
        SrzToken {
            address: address.to_string(),
            decimals: 18,
            symbol: symbol.to_string(),
            gas: "gas".to_string(),
        }
    }

    #[test]
    fn test_matchcp_all_match() {
        // Component tokens contain two tokens
        let comp_tokens = vec![token("0xABC", "token1"), token("0xDEF", "token2")];
        // Query asks for token1 (using different case in address)
        let query_tokens = vec![token("0xabc", "token1")];
        assert!(matchcp(comp_tokens, query_tokens));
    }

    #[test]
    fn test_matchcp_empty_address_in_component() {
        // Use the default empty address (as provided by alloy)
        let default_addr = alloy::primitives::Address::default().to_string();
        let comp_tokens = vec![token(&default_addr, "token1"), token("0xDEF", "token2")];
        let query_tokens = vec![token("0xDEF", "token2")];
        // Should return false because one component token has an empty address.
        assert!(!matchcp(comp_tokens, query_tokens));
    }

    #[test]
    fn test_matchcp_empty_address_in_query() {
        let default_addr = alloy::primitives::Address::default().to_string();
        let comp_tokens = vec![token("0xABC", "token1")];
        let query_tokens = vec![token(&default_addr, "token1")];
        // Should return false because the query token has an empty address.
        assert!(!matchcp(comp_tokens, query_tokens));
    }

    #[test]
    fn test_matchcp_no_match() {
        let comp_tokens = vec![token("0xABC", "token1")];
        let query_tokens = vec![token("0xDEF", "token2")];
        // Should return false because the query token is not found among the component tokens.
        assert!(!matchcp(comp_tokens, query_tokens));
    }
}
