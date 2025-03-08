use axum::{extract::Path, response::IntoResponse, routing::get, Extension, Json, Router};
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tap2::shd::{
    self,
    data::fmt::{SrzEVMPoolState, SrzProtocolComponent, SrzToken, SrzUniswapV2State, SrzUniswapV3State, SrzUniswapV4State},
    types::{AmmType, EnvConfig, Network, SharedTychoStreamState},
};

#[derive(Serialize, Deserialize)]
pub struct APIVersion {
    pub version: String,
}

// GET / => "Hello, Tycho!"
async fn root() -> impl IntoResponse {
    Json(json!({ "data": "Tycho Stream running" }))
}

// GET /version => Get version of the API (for example, a commit hash)
async fn version() -> impl IntoResponse {
    Json(APIVersion { version: "0.1.0".into() })
}

// GET /network => Get network object and its configuration
async fn network(Extension(network): Extension<Network>) -> impl IntoResponse {
    Json(network)
}

// GET /status => Get network status + last block synced
async fn status(Extension(network): Extension<Network>) -> impl IntoResponse {
    let key1 = shd::r#static::data::keys::stream::status(network.name.clone());
    let key2 = shd::r#static::data::keys::stream::latest(network.name.clone());
    let status = shd::data::redis::get::<u128>(key1.as_str()).await;
    let latest = shd::data::redis::get::<u64>(key2.as_str()).await;
    match (status, latest) {
        (Some(status), Some(latest)) => Json(json!({ "status": status.to_string(), "latest": latest.to_string() })),
        _ => Json(json!({ "status": "unknown", "latest": "0" })),
    }
}

// GET /network => Get network object and its configuration
async fn tokens(Extension(network): Extension<Network>) -> impl IntoResponse {
    let key = shd::r#static::data::keys::stream::tokens(network.name.clone());
    match shd::data::redis::get::<Vec<SrzToken>>(key.as_str()).await {
        Some(tokens) => Json(json!({ "tokens": tokens })),
        _ => Json(json!({ "tokens": [] })),
    }
}

// GET /pairs => Get all existing pairs in the database (as a vector of strings like "0xToken0-0xToken1")
async fn pairs(Extension(network): Extension<Network>) -> impl IntoResponse {
    let key = shd::r#static::data::keys::stream::pairs(network.name.clone());
    match shd::data::redis::get::<Vec<String>>(key.as_str()).await {
        Some(pairs) => Json(json!({ "pairs": pairs })),
        _ => Json(json!({ "pairs": [] })),
    }
}

// GET /pairs => Get all existing pairs in the database (as a vector of strings like "0xToken0-0xToken1")
async fn components(Extension(network): Extension<Network>) -> impl IntoResponse {
    let key = shd::r#static::data::keys::stream::components(network.name.clone());
    match shd::data::redis::get::<Vec<SrzProtocolComponent>>(key.as_str()).await {
        Some(cps) => Json(json!({ "components": cps })),
        _ => Json(json!({ "components": [] })),
    }
}

// GET /simulate =>
async fn simulate(Extension(shtss): Extension<SharedTychoStreamState>, Extension(network): Extension<Network>) -> impl IntoResponse {
    log::info!("Simulating on network {}", network.name);
}

// GET /component/{id} => Get the component for the given pool (by id)
async fn pool(Extension(network): Extension<Network>, Path(id): Path<String>) -> impl IntoResponse {
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

pub async fn start(n: Network, shared: SharedTychoStreamState, config: EnvConfig) {
    log::info!("👾 Launching API for '{}' network | 🧪 Testing mode: {:?} | Port: {}", n.name, config.testing, n.port);
    let rstate = shared.read().await;
    log::info!("Testing SharedTychoStreamState read = {:?} with {:?}", rstate.states.keys(), rstate.states.values());
    log::info!(" => rstate.states.keys and rstate.states.values => {:?} with {:?}", rstate.states.keys(), rstate.states.values());
    log::info!(" => rstate.components.keys and rstate.components.values => {:?} with {:?}", rstate.components.keys(), rstate.components.values());
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
        .route("/simulate", get(simulate))
        .layer(Extension(n.clone()))
        .layer(Extension(shared.clone())); // Shared state

    match tokio::net::TcpListener::bind(format!("127.0.0.1:{}", n.port)).await {
        Ok(listener) => match axum::serve(listener, app).await {
            Ok(_) => {
                log::info!("API for '{}' network is running on port {}", n.name, n.port);
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
