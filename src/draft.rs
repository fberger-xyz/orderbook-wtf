use std::collections::HashMap;
use std::hash::Hash;
use std::str::FromStr;

use futures::StreamExt;
use num_bigint::BigUint;
use tap2::shd;
use tap2::shd::types::EnvConfig;
use tap2::shd::types::Network;
use tap2::shd::utils::misc::log::new;
use tycho_client::rpc::HttpRPCClient;
use tycho_client::rpc::RPCClient;
use tycho_core::dto::Chain;
use tycho_core::dto::PaginationParams;
use tycho_core::dto::ResponseToken;
use tycho_core::dto::TokensRequestBody;
use tycho_core::dto::TokensRequestResponse;
use tycho_simulation::evm::protocol::uniswap_v3::state::UniswapV3State;
use tycho_simulation::evm::protocol::uniswap_v4::state::UniswapV4State;
// use tycho_core::Bytes;
// use tycho_simulation::evm::stream::ProtocolStreamBuilder;
use tycho_simulation::models::Token;

use tycho_simulation::{
    evm::{
        engine_db::tycho_db::PreCachedDB,
        protocol::{filters::balancer_pool_filter, uniswap_v2::state::UniswapV2State, vm::state::EVMPoolState},
        stream::ProtocolStreamBuilder,
    },
    protocol::models::BlockUpdate,
    tycho_client::feed::component_tracker::ComponentFilter,
    utils::load_all_tokens,
};

/**
 * Compute the spot price and amount out for a given pool
 */
fn compute(message: BlockUpdate, pairs: &mut HashMap<String, Vec<Token>>) {
    println!("==================== Received block {:?} ====================", message.block_number);
    for (id, comp) in message.new_pairs.iter() {
        pairs.entry(id.clone()).or_insert_with(|| comp.tokens.clone());
    }
    if message.states.is_empty() {
        println!("No pools were updated this block");
        return;
    }
    println!("Using only pools that were updated this block...");
    for (id, state) in message.states.iter().take(10) {
        if let Some(tokens) = pairs.get(id) {
            let formatted_token_str = format!("{:}/{:}", &tokens[0].symbol, &tokens[1].symbol);
            println!("Calculations for pool {:?} with tokens {:?}", id, formatted_token_str);
            state
                .spot_price(&tokens[0], &tokens[1])
                .map(|price| println!("Spot price {:?}: {:?}", formatted_token_str, price))
                .map_err(|e| eprintln!("Error calculating spot price for Pool {:?}: {:?}", id, e))
                .ok();
            let amount_in = BigUint::from(1u32) * BigUint::from(10u32).pow(tokens[0].decimals as u32);
            state
                .get_amount_out(amount_in, &tokens[0], &tokens[1])
                .map(|result| println!("Amount out for trading 1 {:?} -> {:?}: {:?} (takes {:?} gas)", &tokens[0].symbol, &tokens[1].symbol, result.amount, result.gas))
                .map_err(|e| eprintln!("Error calculating amount out for Pool {:?}: {:?}", id, e))
                .ok();
        }
    }
}

async fn launch(network: Network, chain: Chain, tokens: Vec<Token>, config: EnvConfig) {
    let threshold = 10_000.0;
    let filter = ComponentFilter::with_tvl_range(threshold, threshold);
    let mut pairs: HashMap<String, Vec<Token>> = HashMap::new();
    let chain = tycho_simulation::tycho_core::dto::Chain::Ethereum.into();
    log::info!("Launching stream on {} tokens", tokens.len());

    let mut hmts = HashMap::new();
    for token in tokens.iter() {
        hmts.insert(token.address.clone(), token.clone());
    }
    let bpf = balancer_pool_filter;
    let mut stream = ProtocolStreamBuilder::new("tycho-beta.propellerheads.xyz", chain)
        .exchange::<UniswapV2State>("uniswap_v2", filter.clone(), None)
        .exchange::<UniswapV3State>("uniswap_v3", filter.clone(), None)
        .exchange::<UniswapV4State>("uniswap_v4", filter.clone(), None)
        .exchange::<EVMPoolState<PreCachedDB>>("vm:balancer_v2", filter.clone(), Some(bpf))
        .auth_key(Some(config.tycho_api_key.clone()))
        .set_tokens(hmts.clone())
        .await
        .build()
        .await
        .expect("Failed building protocol stream");

    while let Some(message) = stream.next().await {
        let data = message.expect("Could not receive message");
        log::info!("{}: Update on header {}", network.name, data.block_number);
        log::info!("{}: states : {} new_pairs : {} removed_pairs: {} ", network.name, data.states.len(), data.new_pairs.len(), data.removed_pairs.len());
    }
}

/**
 * Based a on local network config
 * 1. Get a pair of token on different networks
 * 2. Listen states changes
 */
#[tokio::main]
async fn main() {
    shd::utils::misc::log::new("draft".to_string());
    dotenv::from_filename(".env").ok();
    let config = EnvConfig::new();
    log::info!("Starting Draft | 🧪 Testing {:?}", config.testing);
    let path = "src/shd/config/networks.json".to_string();
    let networks: Vec<Network> = shd::utils::misc::read(&path);

    match HttpRPCClient::new(&config.tycho_url, Some(&config.tycho_api_key)) {
        Ok(client) => {
            log::info!("Connected to Tycho");
            for network in networks {
                if network.name != "ethereum" {
                    continue;
                }
                log::info!("Network: {:?}", network.name);
                let chain = match network.name.as_str() {
                    "ethereum" => Chain::Ethereum,
                    "arbitrum" => Chain::Arbitrum,
                    "base" => Chain::Base,
                    _ => {
                        log::error!("Invalid chain: {:?}", network.name);
                        return;
                    }
                };
                let eth = tycho_core::Bytes::from_str(network.eth.as_str()).unwrap();
                let usdc = tycho_core::Bytes::from_str(network.usdc.as_str()).unwrap();
                let trb = TokensRequestBody {
                    token_addresses: Some(vec![eth, usdc]),                  // Option<Vec<Bytes>>,
                    min_quality: Some(100),                                  // Option<i32>,
                    traded_n_days_ago: Some(42),                             // Option<u64>,
                    pagination: PaginationParams { page: 0, page_size: 10 }, // PaginationParams,
                    chain,                                                   // Chain,
                };
                match client.get_tokens(&trb).await {
                    Ok(result) => {
                        let mut tokens = vec![];
                        for t in result.tokens.iter() {
                            log::info!("Token: {:?}", t.address);
                            tokens.push(Token {
                                address: tycho_simulation::tycho_core::Bytes::from_str(t.address.clone().to_string().as_str()).unwrap(),
                                decimals: t.decimals as usize,
                                symbol: t.symbol.clone(),
                                gas: BigUint::ZERO, // WTF
                            });
                        }
                        launch(network.clone(), chain, tokens.clone(), config.clone()).await;
                    }
                    Err(e) => {
                        log::error!("Failed to get tokens: {:?}", e.to_string());
                    }
                }
                log::info!("\n\n");
            }
        }
        Err(e) => {
            log::error!("Failed to create client: {:?}", e.to_string());
            return;
        }
    }
}
