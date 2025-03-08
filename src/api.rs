use axum::{
    routing::{get, post},
    Json, Router,
};
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use tap2::shd::{
    self,
    types::{EnvConfig, Network},
};

#[derive(Serialize, Deserialize)]
struct Data {
    message: String,
}

async fn store() -> Json<Data> {
    let data = Data { message: "Hello from API".into() };
    let client = redis::Client::open("redis://0.0.0.0:7777").unwrap();
    let mut con = client.get_async_connection().await.unwrap();
    let _: () = con.set("api:data", serde_json::to_string(&data).unwrap()).await.unwrap();
    Json(data)
}

async fn read() -> Json<Data> {
    let client = redis::Client::open("redis://0.0.0.0:7777").unwrap();
    let mut con = client.get_async_connection().await.unwrap();
    println!("Reading data from Redis...");
    // Retrieve stored data; if missing, return a default message
    let data_str: String = con.get("api:data").await.unwrap_or_else(|_| "{}".to_string());
    let data: Data = serde_json::from_str(&data_str).unwrap_or(Data { message: "No data".into() });
    Json(data)
}

#[tokio::main]
async fn main() {
    shd::utils::misc::log::new("api".to_string());
    dotenv::from_filename(".env.prod").ok();
    let config = EnvConfig::new();
    log::info!("Launching API | 🧪 Testing {:?}", config.testing);
    let path = "src/shd/config/networks.json".to_string();
    let networks: Vec<Network> = shd::utils::misc::read(&path);
    let networks = networks.iter().filter(|x| x.enabled).cloned().collect::<Vec<Network>>();
    for network in networks.clone() {
        log::info!("Adding network {} to the API", network.name);
    }
    shd::data::redis::ping().await;
    let app = Router::new().route("/store", post(store)).route("/read", get(read));
    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{}", config.port)).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// Front-end consumes the API
// - / => "Hello, world!"
// - Get version of the API (repo commit hash)
// - Get Last Block synced with Tycho
// - Get ALL networks => /networks
// - Get ALL tokens for a network => /networks/:network/tokens
// - Get ALL existing pairs for a network => /networks/:network/pairs
// - Get 1 component for 1 pool => /networks/:network/pool/:pool/component
// - Get ALL components for 1 pair => /networks/:network/pairs/:pair
// - Get ALL state for 1 pair => /networks/:network/pairs/:pair/state

// - A pool is an id, it can be an address "0x1234" or a bytes (uniswap v4) "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019"
// - A pair is "0xToken0-0xToken1" and can have multiple pools
