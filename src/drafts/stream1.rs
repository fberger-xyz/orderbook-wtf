use std::collections::HashMap;
use std::str::FromStr;

use futures::StreamExt;
use num_bigint::BigUint;
use tap2::shd;
use tap2::shd::r#static::TychoDex;
use tap2::shd::types::EnvConfig;
use tap2::shd::types::Network;
use tycho_client::rpc::HttpRPCClient;
use tycho_client::rpc::RPCClient;
use tycho_core::dto::Chain;
use tycho_core::dto::PaginationParams;
use tycho_core::dto::TokensRequestBody;
// use tycho_core::Bytes;
// use tycho_simulation::evm::stream::ProtocolStreamBuilder;

use tycho_simulation::models::Token;
use tycho_simulation::tycho_client::feed::component_tracker::ComponentFilter;


use num_traits::cast::ToPrimitive;

fn u3pricing(sqrt_price_x96: BigUint) -> f64 {
    let scale_factor = BigUint::from(2_u128.pow(96));
    // Convert sqrt_price_x96 to float
    let sqrt_price_float = sqrt_price_x96.to_f64().unwrap() / scale_factor.to_f64().unwrap();
    // Square the value to get the final price
    sqrt_price_float * sqrt_price_float
}

fn tick_to_prices(tick: i32, decimals_token0: u8, decimals_token1: u8) -> (f64, f64) {
    // Compute the raw price from the tick using Uniswap V3's formula.
    // raw_price = 1.0001^tick
    let raw_price = 1.0001_f64.powi(tick);

    // Adjust for token decimals.
    // For example, if token0 is WETH (18) and token1 is USDC (6), then
    // adjustment = 10^(18 - 6) = 10^12.
    let adjustment = 10_f64.powi((decimals_token0 as i32) - (decimals_token1 as i32));

    // Compute price0to1 as defined:
    // Here, price0to1 = WETH per USDC = 1 / (raw_price * adjustment)
    let price0to1 = 1.0 / (raw_price * adjustment);

    // The reciprocal gives price1to0 = USDC per WETH.
    let price1to0 = 1.0 / price0to1;

    (price0to1, price1to0)
}
/**
 * Stream Tycho
 */
async fn stream(network: Network, chain: Chain, tokens: Vec<Token>, config: EnvConfig) {
    let threshold = 10_000.0;
    let filter = ComponentFilter::with_tvl_range(threshold, threshold);
    let pairs: HashMap<String, Vec<Token>> = HashMap::new();
    log::info!("Launching stream on {} tokens", tokens.len());

    let mut hmts = HashMap::new();
    for token in tokens.iter() {
        hmts.insert(token.address.clone(), token.clone());
    }

    let chain = tycho_simulation::tycho_core::dto::Chain::Ethereum; // ! Tmp
    let dexes = vec![TychoDex::UniswapV2.to_string(), TychoDex::UniswapV3.to_string()];

    let (_handle, mut receiver) = tycho_simulation::tycho_client::stream::TychoStreamBuilder::new("tycho-beta.propellerheads.xyz", chain)
        .auth_key(Some(config.tycho_api_key))
        .exchange(TychoDex::UniswapV2.to_string().as_str(), ComponentFilter::with_tvl_range(0.0, 100.0)) // OK
        .exchange(TychoDex::UniswapV3.to_string().as_str(), ComponentFilter::with_tvl_range(0.0, 100.0)) // OK
        .build()
        .await
        .expect("Failed to build tycho stream"); // Failed to build tycho stream: BlockSynchronizerError("Not a single synchronizer healthy!")

    let mut hmd = HashMap::new(); // Key is token0:token1

    let mut current = chrono::Utc::now().timestamp_millis();
    while let Some(fm) = receiver.recv().await {
        let state_msgs = fm.state_msgs.len();
        let sync_states = fm.sync_states.len();
        log::info!("Received {} state messages and {} sync states", state_msgs, sync_states);
        for dex in dexes.clone() {
            match fm.state_msgs.get(dex.as_str()) {
                Some(msg) => {
                    log::info!("{}: State message for {} on block {}", network.name, dex, msg.header.number);
                    log::info!(" - States Length : {}", msg.snapshots.get_states().len());
                    for x in msg.snapshots.get_states() {
                        // If we go there, the pool has x.0 had a swap.
                        // log::info!(" - State: {} and component.protocol_type_name = {} ", x.0, x.1.component.protocol_type_name);
                        let state = x.1.clone();
                        let component = state.component.clone();
                        let state: tycho_simulation::tycho_core::dto::ResponseProtocolState = state.state;

                        // ! Filter u3 only
                        if component.protocol_type_name == "uniswap_v3_pool" && component.tokens.len() == 2 {
                            // x pools matching usdc/eth
                            let t0 = component.tokens[0].clone().to_string().to_lowercase();
                            let t1 = component.tokens[1].clone().to_string();
                            let t0match = t0 == network.usdc.to_lowercase();
                            let t1match = t1 == network.eth.to_lowercase();

                            if t0match && t1match {
                                log::info!(" - Found a pair with {} and {}: Address = {}", t0, t1, component.id.to_string());
                                log::info!(
                                    " - Component: Proto : {} | chain {} | tokens0  {}| tokens1  {}",
                                    component.protocol_type_name,
                                    component.chain,
                                    component.tokens[0].to_string(),
                                    component.tokens[1].to_string()
                                );
                                log::info!(
                                    " - Component Static Attributes : fee : {:?} and tick_spacing : {:?}",
                                    component.static_attributes.get("fee"),
                                    component.static_attributes.get("tick_spacing"),
                                );

                                let token0data = tokens.iter().find(|t| t.address.to_string().to_lowercase() == t0.to_string().to_lowercase()).expect("token0data not found");
                                let token1data = tokens.iter().find(|t| t.address.to_string().to_lowercase() == t1.to_string().to_lowercase()).expect("token1data not found");

                                hmd.insert(format!("{}:{}", t0, t1), ".");
                                // let c0 = component.tokens[0];
                                // log::info!(" - Component Balances : {:?} and {:?}", state.balances.get(c0).unwrap_or_default(), state.balances[1]);
                                let attributes = state.attributes.clone();

                                let extracted_liquidity = BigUint::ZERO;
                                let extracted_sqrt_price_x96 = BigUint::ZERO;
                                let extracted_tick = BigUint::ZERO;
                                // let mut bids = vec![];
                                // let mut asks = vec![];

                                let mut pooldata = shd::types::PoolData {
                                    liquidity: 0u128,
                                    sqrt_price_x96: 0u128,
                                    tick: 0u128,
                                    ticks: vec![],
                                };

                                let mut ticks: Vec<shd::types::TickData> = vec![];
                                for a in attributes.clone() {
                                    // log::info!(" - Attribute: {:?} = {:?}", a.0, a.1);
                                    if a.0 == "sqrt_price_x96" {
                                        let sqrt_price_x96 = a.1.clone().to_string();
                                        let sqrt_price_x96 = u128::from_str_radix(sqrt_price_x96.trim_start_matches("0x"), 16).unwrap();
                                        pooldata.sqrt_price_x96 = sqrt_price_x96;
                                        let sqrt_price_x96 = sqrt_price_x96.to_string();
                                        let sqrt_price_x96 = BigUint::from_str(sqrt_price_x96.as_str()).unwrap();
                                    } else if a.0 == "tick" {
                                        // Just "tick"
                                        let tick = a.1.clone().to_string();
                                        let tick = i32::from_str_radix(tick.trim_start_matches("0x"), 16).unwrap();
                                        pooldata.tick = tick as u128;
                                        let tck = BigUint::from_str(tick.to_string().as_str()).unwrap();
                                    } else if a.0 == "liquidity" {
                                        let liquidity = a.1.clone().to_string();
                                        let liquidity = u128::from_str_radix(liquidity.trim_start_matches("0x"), 16).unwrap();
                                        pooldata.liquidity = liquidity;
                                        let liquidity = liquidity.to_string();
                                        let liquidity = BigUint::from_str(liquidity.as_str()).unwrap();
                                    } else {
                                        // It's a "ticks/201550/net-liquidity" format, or "ticks/-887260/net-liquidity"
                                        let parts: Vec<&str> = a.0.split("/").collect();
                                        if parts[0] == "ticks" {
                                            let tick = parts[1].parse::<i32>().unwrap();
                                            let (price0to1, price1to0) = tick_to_prices(tick, token0data.decimals as u8, token1data.decimals as u8);
                                            if parts[2] == "net-liquidity" {
                                                let net_liquidity = a.1.clone().to_string();
                                                let net_liquidity = u128::from_str_radix(net_liquidity.trim_start_matches("0x"), 16).unwrap();
                                                ticks.push(shd::types::TickData { tick, net_liquidity, price0to1, price1to0 });
                                                let net_liquidity = net_liquidity.to_string();
                                                let net_liquidity = BigUint::from_str(net_liquidity.as_str()).unwrap();
                                                // log::info!(" - 🔸 tick: {:?} | net_liquidity: {:?} | tickpriced_true: {} | tickpriced_false: {}", tick, net_liquidity, price0to1, price1to0);
                                            } else {
                                                log::info!(" - Unexpected attribute 2: {:?}", a.0);
                                            }
                                        } else {
                                            log::info!(" - Unexpected attribute 1: {:?}", a.0);
                                        }
                                    }
                                }
                                pooldata.ticks = ticks;
                                log::info!(" - pooldata: liquidity: {:?}", pooldata.liquidity);
                                log::info!(" - pooldata: sqrt_price_x96: {:?}", pooldata.sqrt_price_x96);
                                log::info!(" - pooldata: tick: {:?}", pooldata.tick);
                                log::info!(" - pooldata: ticks size: {:?}", pooldata.ticks.len());
                                // Order ticks
                                pooldata.ticks.sort_by(|a, b| a.tick.cmp(&b.tick));
                                for t in pooldata.ticks.clone() {
                                    log::info!(" - tick: {:?} | net_liquidity: {:?} | price0to1: {} | price1to0: {}", t.tick, t.net_liquidity, t.price0to1, t.price1to0);
                                }

                                let path = format!("misc/logs/{}.json", component.id);
                                let json = serde_json::to_string_pretty(&pooldata).unwrap();
                                let mut file = std::fs::File::create(path).expect("Unable to create file");
                                std::io::Write::write_all(&mut file, json.as_bytes()).expect("Unable to write data");

                                // dbg!(component);
                                // dbg!(state);
                                break;
                            }
                        }
                        // else {
                        // log::info!(" - Unexpected component with {} tokens", component.tokens.len());
                        // }

                        // Debug|Logs
                        // dbg!(component);
                        // dbg!(state);
                        // break;
                    }
                    log::info!(" - Delta > BlockChanges Extractor: {} ", msg.deltas.clone().unwrap().extractor);
                    log::info!(" - Removed_components Hm size : {}", msg.removed_components.len());
                }
                None => {
                    log::info!("{}: No state messages for {}", network.name, dex);
                }
            }
        }
        let now = chrono::Utc::now().timestamp_millis();
        log::info!("Elapsed time: {} ms", now - current);
        current = now;
    }

    // let bpf = balancer_pool_filter;
    // let mut stream = ProtocolStreamBuilder::new("tycho-beta.propellerheads.xyz", chain)
    //     .exchange::<UniswapV2State>("uniswap_v2", filter.clone(), None)
    //     .exchange::<UniswapV3State>("uniswap_v3", filter.clone(), None)
    //     .exchange::<UniswapV4State>("uniswap_v4", filter.clone(), None)
    //     .exchange::<EVMPoolState<PreCachedDB>>("vm:balancer_v2", filter.clone(), Some(bpf))
    //     .auth_key(Some(config.tycho_api_key.clone()))
    //     .set_tokens(hmts.clone())
    //     .await
    //     .build()
    //     .await
    //     .expect("Failed building protocol stream");

    // while let Some(message) = stream.next().await {
    //     let data = message.expect("Could not receive message");
    //     log::info!("{}: Update on header {}", network.name, data.block_number);
    //     log::info!("{}: states : {} new_pairs : {} removed_pairs: {} ", network.name, data.states.len(), data.new_pairs.len(), data.removed_pairs.len());
    // }
}

/**
 * Based a on local network config
 * 1. Get a pair of token on different networks
 * 2. Listen states changes
 */
#[tokio::main]
async fn main() {
    shd::utils::misc::log::new("stream1".to_string());
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
                let exotic = tycho_core::Bytes::from_str(network.exotic.as_str()).unwrap(); // GNO on Ethereum
                let trb = TokensRequestBody {
                    token_addresses: Some(vec![eth, usdc]), // Option<Vec<Bytes>>,
                    // token_addresses: Some(vec![exotic]),                     // Option<Vec<Bytes>>,
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
                        stream(network.clone(), chain, tokens.clone(), config.clone()).await;
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
