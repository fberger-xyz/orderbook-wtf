use axum::{
    response::IntoResponse,
    routing::{get, post},
    Extension, Json, Router,
};
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tap2::shd::{
    self,
    types::{EnvConfig, Network, SharedTychoStreamState},
};

#[derive(Serialize, Deserialize)]
struct Data {
    message: String,
}

async fn store(Extension(shared): Extension<SharedTychoStreamState>) -> Json<Data> {
    let data = Data { message: "Hello from API".into() };
    let rstate = shared.read().await;
    log::info!("API Task: states = {:?} with {:?}", rstate.states.keys(), rstate.states.values());
    log::info!("API Task: components = {:?} with {:?}", rstate.components.keys(), rstate.components.values());
    drop(rstate);
    let client = redis::Client::open("redis://0.0.0.0:7777").unwrap();
    let mut con = client.get_async_connection().await.unwrap();
    let _: () = con.set("api:data", serde_json::to_string(&data).unwrap()).await.unwrap();
    Json(data)
}

async fn read(Extension(shared): Extension<SharedTychoStreamState>) -> Json<Data> {
    println!("Reading data from Redis...");
    let rstate = shared.read().await;
    log::info!("API Task: states = {:?} with {:?}", rstate.states.keys(), rstate.states.values());
    log::info!("API Task: components = {:?} with {:?}", rstate.components.keys(), rstate.components.values());
    drop(rstate);
    let client = redis::Client::open("redis://0.0.0.0:7777").unwrap();
    let mut con = client.get_async_connection().await.unwrap();
    // Retrieve stored data; if missing, return a default message
    let data_str: String = con.get("api:data").await.unwrap_or_else(|_| "{}".to_string());
    let data: Data = serde_json::from_str(&data_str).unwrap_or(Data { message: "No data".into() });
    Json(data)
}

#[derive(Serialize, Deserialize)]
pub struct APIVersion {
    pub version: String,
}

// GET / => "Hello, Tycho!"
async fn root() -> impl IntoResponse {
    Json(json!({ "message": "Tycho Stream|API are running" }))
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
async fn status(Extension(_shared): Extension<SharedTychoStreamState>) -> impl IntoResponse {
    // For demonstration, we return a dummy status and block number.
    Json(json!({
        "status": "active",
        "last_block": 123456
    }))
}

pub async fn start(n: Network, shared: SharedTychoStreamState, config: EnvConfig) {
    log::info!("Launching API for '{}' network | 🧪 Testing mode: {:?} | Port: {}", n.name, config.testing, n.port);
    let rstate = shared.read().await;
    log::info!("Testing SharedTychoStreamState read = {:?} with {:?}", rstate.states.keys(), rstate.states.values());
    log::info!(" => rstate.states.keys and rstate.states.values => {:?} with {:?}", rstate.states.keys(), rstate.states.values());
    log::info!(" => rstate.components.keys and rstate.components.values => {:?} with {:?}", rstate.components.keys(), rstate.components.values());
    drop(rstate);
    let app = Router::new()
        .route("/", get(root))
        .route("/version", get(version))
        .route("/network", get(network))
        .route("/read", get(read)) //
        .route("/store", post(store)) //
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
