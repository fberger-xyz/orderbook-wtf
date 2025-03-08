use std::collections::HashMap;
use std::collections::HashSet;
use std::str::FromStr;

use futures::StreamExt;
use num_bigint::BigUint;
use tap2::shd;
use tap2::shd::types::EnvConfig;
use tap2::shd::types::Network;
use tycho_client::rpc::HttpRPCClient;
use tycho_client::rpc::RPCClient;
use tycho_core::dto::Chain;
use tycho_simulation::evm::protocol::filters::curve_pool_filter;
use tycho_simulation::evm::protocol::filters::uniswap_v4_pool_with_hook_filter;
use tycho_simulation::evm::protocol::uniswap_v3::state::UniswapV3State;
use tycho_simulation::evm::protocol::uniswap_v4::state::UniswapV4State;
// use tycho_core::Bytes;
// use tycho_simulation::evm::stream::ProtocolStreamBuilder;

use tycho_simulation::models::Token;
use tycho_simulation::protocol::state::ProtocolSim;
use tycho_simulation::tycho_core::Bytes;
use tycho_simulation::{
    evm::{
        engine_db::tycho_db::PreCachedDB,
        protocol::{filters::balancer_pool_filter, uniswap_v2::state::UniswapV2State, vm::state::EVMPoolState},
        stream::ProtocolStreamBuilder,
    },
    protocol::models::BlockUpdate,
    tycho_client::feed::component_tracker::ComponentFilter,
};

use tycho_simulation::protocol::models::ProtocolComponent;

use num_traits::cast::ToPrimitive;

// Format token amounts to human-readable values
fn format_token_amount(amount: &BigUint, token: &Token) -> String {
    let decimal_amount = amount.to_f64().unwrap_or(0.0) / 10f64.powi(token.decimals as i32);
    format!("{:.6}", decimal_amount)
}

fn format_price_ratios(amount_in: &BigUint, amount_out: &BigUint, token_in: &Token, token_out: &Token) -> (f64, f64) {
    let decimal_in = amount_in.to_f64().unwrap_or(0.0) / 10f64.powi(token_in.decimals as i32);
    let decimal_out = amount_out.to_f64().unwrap_or(0.0) / 10f64.powi(token_out.decimals as i32);

    if decimal_in > 0.0 && decimal_out > 0.0 {
        let forward = decimal_out / decimal_in;
        let reverse = decimal_in / decimal_out;
        (forward, reverse)
    } else {
        (0.0, 0.0)
    }
}

/**
 * Get swap path
 */
fn bestswap(message: &BlockUpdate, pairs: &mut HashMap<String, ProtocolComponent>, amount_in: BigUint, sell_token: Token, buy_token: Token, amounts_out: &mut HashMap<String, BigUint>) -> Option<shd::types::BestSwap> {
    println!("==================== Received block {:?} ====================", message.block_number);
    for (id, comp) in message.new_pairs.iter() {
        pairs.entry(id.clone()).or_insert_with(|| comp.clone());
    }
    if message.states.is_empty() {
        println!("No pools of interest were updated this block. The best swap is the previous one");
        return None;
    }
    for (id, state) in message.states.iter() {
        if let Some(component) = pairs.get(id) {
            let tokens = &component.tokens;
            if HashSet::from([&sell_token, &buy_token]) == HashSet::from([&tokens[0], &tokens[1]]) {
                let amount_out = state
                    .get_amount_out(amount_in.clone(), &sell_token, &buy_token)
                    .map_err(|e| eprintln!("Error calculating amount out for Pool {:?}: {:?}", id, e))
                    .ok();
                if let Some(amount_out) = amount_out {
                    amounts_out.insert(id.clone(), amount_out.amount);
                }
                // If you would like to save spot prices instead of the amount out, do
                let spot_price = state.spot_price(&tokens[0], &tokens[1]).ok();
                log::info!("Spot price: {:?} on pair: {}", spot_price, component.id);
            }
        }
    }
    if let Some((key, amount_out)) = amounts_out.iter().max_by_key(|(_, value)| value.to_owned()) {
        // println!("The best swap (out of {} possible pools) is:", amounts_out.len());
        // println!("Protocol: {:?}", pairs.get(key).expect("Failed to get best pool").protocol_system);
        // println!("Pool address: {:?}", key);
        let formatted_in = format_token_amount(&amount_in, &sell_token);
        let formatted_out = format_token_amount(amount_out, &buy_token);
        let (forward_price, reverse_price) = format_price_ratios(&amount_in, amount_out, &sell_token, &buy_token);

        log::info!(
            "Swap: {} {} -> {} {} \nPrice: {:.6} {} per {}, {:.6} {} per {}",
            formatted_in,
            sell_token.symbol,
            formatted_out,
            buy_token.symbol,
            forward_price,
            buy_token.symbol,
            sell_token.symbol,
            reverse_price,
            sell_token.symbol,
            buy_token.symbol
        );
        // Some((key.to_string(), amount_out.clone(), formatted_in, formatted_out, forward_price, reverse_price))
        Some(shd::types::BestSwap {
            formatted_in,
            formatted_out,
            forward_price,
            reverse_price,
        })
        // to struct
    } else {
        println!("There aren't pools with the tokens we are looking for");
        None
    }
}

async fn stream(network: Network, tokens: Vec<Token>, config: EnvConfig) {
    log::info!("Tokens loaded count: {}", tokens.len());
    let mut hmt = HashMap::new();
    for t in tokens.clone() {
        hmt.insert(t.address.clone(), t.clone());
    }

    let mut hmtcustom = HashMap::new();
    let weth = hmt.get(&Bytes::from_str("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2").unwrap()).expect("WETH not found");
    // let usdt = hmt.get(&Bytes::from_str("0x6b175474e89094c44da98b954eedeac495271d0f").unwrap()).expect("usdt not found");
    // let usdt = hmt.get(&Bytes::from_str("0xdac17f958d2ee523a2206206994597c13d831ec7").unwrap()).expect("USDT not found");
    let usdc = hmt.get(&Bytes::from_str("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48").unwrap()).expect("USDC not found");
    hmtcustom.insert(weth.clone().address, weth.clone());
    // hmtcustom.insert(usdt.clone().address, usdt.clone());
    hmtcustom.insert(usdc.clone().address, usdc.clone());

    let chain = tycho_simulation::tycho_core::dto::Chain::Ethereum.into();
    // If with_tvl_range is too low => "Failed building protocol stream: BlockSynchronizerError("not all synchronizers on same block!")"
    let mut stream = ProtocolStreamBuilder::new("tycho-beta.propellerheads.xyz", chain)
        .exchange::<UniswapV2State>("uniswap_v2", ComponentFilter::with_tvl_range(1.0, 500.0), None)
        .exchange::<UniswapV3State>("uniswap_v3", ComponentFilter::with_tvl_range(1.0, 500.0), None)
        .exchange::<UniswapV4State>("uniswap_v4", ComponentFilter::with_tvl_range(1.0, 500.0), Some(uniswap_v4_pool_with_hook_filter))
        .exchange::<EVMPoolState<PreCachedDB>>("vm:balancer_v2", ComponentFilter::with_tvl_range(1.0, 50.0), Some(balancer_pool_filter))
        .exchange::<EVMPoolState<PreCachedDB>>("vm:curve", ComponentFilter::with_tvl_range(1.0, 50.0), Some(curve_pool_filter))
        .auth_key(Some(config.tycho_api_key.clone()))
        .skip_state_decode_failures(true)
        .set_tokens(hmtcustom.clone())
        .await
        .build()
        .await
        .expect("Failed building protocol stream");

    while let Some(message_result) = stream.next().await {
        match message_result {
            Ok(message) => {
                // The stream created emits BlockUpdate messages which consist of:
                // - block number- the block this update message refers to
                // - new_pairs- new components witnessed (either recently created or newly meeting filter criteria)
                // - removed_pairs- components no longer tracked (either deleted due to a reorg or no longer meeting filter criteria)
                // - states- the updated ProtocolSimstates for all components modified in this block
                // The first message received will contain states for all protocol components registered to. Thereafter, further block updates will only contain data for updated or new components.

                log::info!("🔸 ProtocolStreamBuilder 🔸");
                let mut pairs: HashMap<String, ProtocolComponent> = HashMap::new();
                log::info!("Got {} states", message.states.len());
                log::info!("Got {} new_pairs", message.new_pairs.len());
                log::info!("Got {} removed_pairs", message.removed_pairs.len());

                if message.new_pairs.is_empty() {
                    log::info!("No new pairs");
                    break; // Tmp only 1st msg
                }

                let mut ethusdc_pairs = vec![];
                // let mut usdt_usdc_pairs = vec![];
                for (id, comp) in message.new_pairs.iter() {
                    pairs.entry(id.clone()).or_insert_with(|| comp.clone());
                    let t0 = comp.tokens.first().unwrap();
                    let t1 = comp.tokens.get(1).unwrap();
                    // log::info!("New pair: Got {} tokens. t0 = {:?} and t1 = {:?}", comp.tokens.len(), t0.symbol, t1.symbol);
                    if (t0.address == weth.address || t1.address == weth.address) && (t0.address == usdc.address || t1.address == usdc.address) {
                        log::info!("Match USDC|ETH pair: {:?}", comp.id);
                        // let (state, protosim) = message.states.iter().find(|s| s.0.to_string().to_lowercase() == comp.id.to_string().to_lowercase()).expect("State not found");
                        ethusdc_pairs.push(comp.id.to_string().to_lowercase());
                    }
                    // else if (t0.address == usdc.address || t1.address == usdc.address) && (t0.address == usdt.address || t1.address == usdt.address) {
                    //     log::info!("Match USDC|USDT pair: {:?}", comp.id);
                    //     usdt_usdc_pairs.push(comp.id.to_string().to_lowercase());
                    // }
                }

                log::info!("--------- States --------- ");

                for m in ethusdc_pairs.clone() {
                    if let Some(proto) = message.states.get(&m.to_string()) {
                        let comp = message.new_pairs.get(&m.to_string()).expect("New pair not found");
                        log::info!("[ETH-USDC] Proto: {}", comp.protocol_type_name);
                        let stattribute = comp.static_attributes.clone();
                        for (k, v) in stattribute.iter() {
                            log::info!(" - Attribute: {}: {:?}", k, v);
                        }
                        let base = comp.tokens.first().unwrap();
                        let quote = comp.tokens.get(1).unwrap();
                        log::info!("- Base Token : {:?} | Spot Price base/quote = {:?}", base.symbol, proto.spot_price(base, quote));
                        log::info!("- Quote Token: {:?} | Spot Price quote/base = {:?}", quote.symbol, proto.spot_price(quote, base));

                        match comp.protocol_type_name.as_str() {
                            "uniswap_v2_pool" => {
                                if let Some(state) = proto.as_any().downcast_ref::<UniswapV2State>() {
                                    log::info!("Good downcast to UniswapV2State");
                                    log::info!(" - reserve0: {}", state.reserve0.to_string());
                                    log::info!(" - reserve1: {}", state.reserve1.to_string());
                                    // log::info!("- Fee: {:?}", proto.fee()); // Not implemented
                                    dbg!("uniswap_v2_pool:", state);
                                } else {
                                    log::info!("Downcast to 'UniswapV2State' failed on proto '{}'", comp.protocol_type_name);
                                }
                            }
                            "uniswap_v3_pool" => {
                                if let Some(state) = proto.as_any().downcast_ref::<UniswapV3State>() {
                                    log::info!("Good downcast to UniswapV3State");
                                    log::info!("liquidity: {:?}", state.fee());
                                    log::info!("sqrt_price: {:?}", state.spot_price(base, quote));
                                    // log::info!("tick: {:?}", state.tick);
                                    dbg!("uniswap_v3_pool:", state);
                                } else {
                                    log::info!("Downcast to 'UniswapV3State' failed on proto '{}'", comp.protocol_type_name);
                                }
                            }
                            "uniswap_v4_pool" => {
                                if let Some(state) = proto.as_any().downcast_ref::<UniswapV4State>() {
                                    log::info!("Good downcast to UniswapV4State");
                                    dbg!("uniswap_v4_pool:", state);
                                } else {
                                    log::info!("Downcast to 'UniswapV4State' failed on proto '{}'", comp.protocol_type_name);
                                }
                            }
                            "balancer_v2_pool" | "curve" => {
                                if let Some(state) = proto.as_any().downcast_ref::<EVMPoolState<PreCachedDB>>() {
                                    log::info!("Good downcast to 'EVMPoolState<PreCachedDB>'");
                                    dbg!("balancer_v2_pool:", state);
                                } else {
                                    log::info!("Downcast to 'EVMPoolState<PreCachedDB>' failed on proto '{}'", comp.protocol_type_name);
                                }
                            }
                            _ => {
                                log::info!(" 🔺🔺🔺 Unknown protocol: {} 🔺🔺🔺", comp.protocol_type_name);
                            }
                        }

                        // log::info!("- Base Token : {:?} | Spot Price base/quote = {:?}", base.symbol, protosim.spot_price(base, quote));
                        // log::info!("- Quote Token: {:?} | Spot Price quote/base = {:?}", quote.symbol, protosim.spot_price(quote, base));
                        // log::info!("- Fee: {:?}", protosim.fee());
                        log::info!(" --- ");
                    }
                }

                // for m in usdt_usdc_pairs.clone() {
                //     match message.states.get(&m.to_string()) {
                //         Some(protosim) => {
                //             let comp = message.new_pairs.get(&m.to_string()).expect("New pair not found");
                //             log::info!("[USDT-USDC] Proto: {}", comp.protocol_type_name);
                //             let stattribute = comp.static_attributes.clone();
                //             for (k, v) in stattribute.iter() {
                //                 log::info!(" - Attribute: {}: {:?}", k, v);
                //             }
                //             let base = comp.tokens.get(0).unwrap();
                //             let quote = comp.tokens.get(1).unwrap();
                //             // log::info!("- Base Token : {:?} | Spot Price base/quote = {:?}", base.symbol, protosim.spot_price(base, quote));
                //             // log::info!("- Quote Token: {:?} | Spot Price quote/base = {:?}", quote.symbol, protosim.spot_price(quote, base));
                //             // log::info!("- Fee: {:?}", protosim.fee());
                //             log::info!(" --- ");
                //         }
                //         None => {}
                //     }
                // }
            }
            Err(e) => {
                eprintln!("Error receiving message: {:?}. Continuing to next message...", e);
                continue;
            }
        };
    }
}

/**
 * Based a on local network config
 * 1. Get a pair of token on different networks
 * 2. Listen states changes
 */
#[tokio::main]
async fn main() {
    shd::utils::misc::log::new("agglqdty".to_string());
    dotenv::from_filename(".env").ok();
    let config = EnvConfig::new();
    log::info!("Starting Draft | 🧪 Testing {:?}", config.testing);
    let path = "src/shd/config/networks.json".to_string();
    let networks: Vec<Network> = shd::utils::misc::read(&path);

    match HttpRPCClient::new(&config.tycho_url, Some(&config.tycho_api_key)) {
        Ok(client) => {
            log::info!("Connected to Tycho");
            for network in networks {
                let chain = match network.name.as_str() {
                    "ethereum" => Chain::Ethereum,
                    "arbitrum" => Chain::Arbitrum,
                    "base" => Chain::Base,
                    _ => {
                        log::error!("Invalid chain: {:?}", network.name);
                        return;
                    }
                };
                if network.name == "ethereum" {
                    log::info!("Network: {:?}", network.name);
                    let eth = tycho_core::Bytes::from_str(network.eth.as_str()).unwrap();
                    let usdc = tycho_core::Bytes::from_str(network.usdc.as_str()).unwrap();
                    match client.get_all_tokens(chain, Some(100), Some(1), 3000).await {
                        Ok(result) => {
                            let mut output = vec![];
                            for t in result.iter() {
                                output.push(Token {
                                    address: tycho_simulation::tycho_core::Bytes::from_str(t.address.clone().to_string().as_str()).unwrap(),
                                    decimals: t.decimals as usize,
                                    symbol: t.symbol.clone(),
                                    gas: BigUint::ZERO, // WTF
                                });
                            }
                            stream(network.clone(), output.clone(), config.clone()).await;
                        }
                        Err(e) => {
                            log::error!("Failed to get tokens: {:?}", e.to_string());
                        }
                    }
                    log::info!("\n\n");
                }
            }
        }
        Err(e) => {
            log::error!("Failed to create client: {:?}", e.to_string());
            return;
        }
    }
}
