use std::collections::HashMap;
use std::collections::HashSet;
use std::str::FromStr;

use alloy::providers::ProviderBuilder;
use alloy_chains::NamedChain;
use futures::StreamExt;
use num_bigint::BigUint;
use tap2::shd;
use tap2::shd::types::EnvConfig;
use tap2::shd::types::Network;
use tycho_client::rpc::HttpRPCClient;
use tycho_client::rpc::RPCClient;
use tycho_core::dto::Chain;
use tycho_core::dto::PaginationParams;
use tycho_core::dto::TokensRequestBody;
use tycho_simulation::evm::protocol::filters::uniswap_v4_pool_with_hook_filter;
use tycho_simulation::evm::protocol::uniswap_v3::state::UniswapV3State;
use tycho_simulation::evm::protocol::uniswap_v4::state::UniswapV4State;
// use tycho_core::Bytes;
// use tycho_simulation::evm::stream::ProtocolStreamBuilder;

use tycho_simulation::models::Token;
use tycho_simulation::{
    evm::{protocol::uniswap_v2::state::UniswapV2State, stream::ProtocolStreamBuilder},
    protocol::models::BlockUpdate,
    tycho_client::feed::component_tracker::ComponentFilter,
};

use tycho_simulation::protocol::models::ProtocolComponent;

use num_traits::cast::ToPrimitive;

fn u3pricing(sqrt_price_x96: BigUint) -> f64 {
    let scale_factor = BigUint::from(2_u128.pow(96));
    // Convert sqrt_price_x96 to float
    let sqrt_price_float = sqrt_price_x96.to_f64().unwrap() / scale_factor.to_f64().unwrap();
    // Square the value to get the final price
    sqrt_price_float * sqrt_price_float
}

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

/**
 * Quote / Simulate
 */
async fn quote(network: Network, chain: Chain, tokens: Vec<Token>, sell_token: String, buy_token: String) {
    let sell_token_address = tycho_core::Bytes::from_str(sell_token.as_str()).expect("Invalid address for sell token");
    let buy_token_address = tycho_core::Bytes::from_str(buy_token.as_str()).expect("Invalid address for buy token");
    let sell_token = tokens.iter().find(|t| t.address.to_string().to_lowercase() == sell_token_address.to_string().to_lowercase()).expect("Sell token not found");
    let buy_token = tokens.iter().find(|t| t.address.to_string().to_lowercase() == buy_token_address.to_string().to_lowercase()).expect("Buy token not found");
    // ! 1 ETH. Iterate on tick spacing !
    let amount_in = BigUint::from((1.0 * 10f64.powi(sell_token.decimals as i32)) as u128);
    let provider = ProviderBuilder::new()
        .with_chain(NamedChain::Mainnet)
        // .wallet(signer.clone())
        .on_http(network.rpc.clone().parse().unwrap());
    // let swap = getwap(message, &mut pairs, amount_in.clone(), sell_token.clone(), buy_token.clone(), &mut amounts_out);
}

async fn stream(network: Network, chain: Chain, tokens: Vec<Token>, config: EnvConfig) {
    println!("Tokens loaded: {}", tokens.len());

    // HashMap<Bytes, Token>
    let mut hmt = HashMap::new();
    for t in tokens.clone() {
        hmt.insert(t.address.clone(), t.clone());
    }

    let chain = tycho_simulation::tycho_core::dto::Chain::Ethereum.into(); // ! Tmp
    let mut protocol_stream = ProtocolStreamBuilder::new("tycho-beta.propellerheads.xyz", chain)
        .exchange::<UniswapV2State>("uniswap_v2", ComponentFilter::with_tvl_range(0.0, 100.0), None)
        .exchange::<UniswapV3State>("uniswap_v3", ComponentFilter::with_tvl_range(0.0, 100.0), None)
        .exchange::<UniswapV4State>("uniswap_v4", ComponentFilter::with_tvl_range(0.0, 100.0), Some(uniswap_v4_pool_with_hook_filter))
        // .exchange::<UniswapV4State>("uniswap_v4", tvl_filter.clone(), Some(uniswap_v4_pool_with_hook_filter))
        .auth_key(Some(config.tycho_api_key.clone()))
        .skip_state_decode_failures(true)
        .set_tokens(hmt.clone())
        .await
        .build()
        .await
        .expect("Failed building protocol stream");

    while let Some(message_result) = protocol_stream.next().await {
        match message_result {
            Ok(message) => {
                log::info!("🔸🔸🔸 Received message");
                let mut pairs: HashMap<String, ProtocolComponent> = HashMap::new();

                // =========================================== BID/ASK CATEGORISATION =========================================

                let size_states = message.states.len();
                log::info!("size_states: {:?}", size_states);
                let size_new_pairs = message.new_pairs.len();
                log::info!("size_new_pairs: {:?}", size_new_pairs);
                let size_removed_pairs = message.removed_pairs.len();
                log::info!("size_removed_pairs: {:?}", size_removed_pairs);

                if size_new_pairs == 0 {
                    break; // Tmp only 1st msg
                }

                for (id, comp) in message.new_pairs.iter() {
                    pairs.entry(id.clone()).or_insert_with(|| comp.clone());
                    if comp.id.to_string().to_lowercase() == "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8" {
                        log::info!("match usdc|eth new pair: {:?}", comp);
                        let (state, protosim) = message.states.iter().find(|s| s.0.to_string().to_lowercase() == comp.id.to_string().to_lowercase()).expect("State not found");
                        log::info!("state: {:?}", state);
                        log::info!("fee: {:?}", protosim.fee());
                        let base = comp.tokens.first().unwrap();
                        log::info!("base: {:?}", base.symbol);
                        let quote = comp.tokens.get(1).unwrap();
                        log::info!("base: {:?}", quote.symbol);
                        log::info!("spot_price: {:?}", protosim.spot_price(base, quote));
                        log::info!("spot_price: {:?}", protosim.spot_price(quote, base));
                    }
                }

                // 2025-03-05T18:05:03.435 [src/drafts/stream2.rs--------------:196] INFO 🔸🔸🔸 Received message
                // 2025-03-05T18:05:03.435 [src/drafts/stream2.rs--------------:203] INFO size_states: 975
                // 2025-03-05T18:05:03.435 [src/drafts/stream2.rs--------------:205] INFO size_new_pairs: 975
                // 2025-03-05T18:05:03.435 [src/drafts/stream2.rs--------------:207] INFO size_removed_pairs: 0
                // 2025-03-05T18:05:03.438 [src/drafts/stream2.rs--------------:212] INFO match usdc|eth new pair: ProtocolComponent { address: Bytes(0x), id: Bytes(0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8), tokens: [Token { address: Bytes(0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48), decimals: 6, symbol: "USDC", gas: 0 }, Token { address: Bytes(0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2), decimals: 18, symbol: "WETH", gas: 0 }], protocol_system: "uniswap_v3", protocol_type_name: "uniswap_v3_pool", chain: Ethereum, contract_ids: [], static_attributes: {"tick_spacing": Bytes(0x3c), "fee": Bytes(0x0bb8), "pool_address": Bytes(0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8)}, creation_tx: Bytes(0x89d75075eaef8c21ab215ae54144ba563b850ee7460f89b2a175fd0e267ed330), created_at: 2021-05-04T23:10:00 }
                // 2025-03-05T18:05:03.439 [src/drafts/stream2.rs--------------:214] INFO state: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8"
                // 2025-03-05T18:05:03.439 [src/drafts/stream2.rs--------------:215] INFO fee: 0.003
                // 2025-03-05T18:05:03.439 [src/drafts/stream2.rs--------------:217] INFO base: "USDC"
                // 2025-03-05T18:05:03.439 [src/drafts/stream2.rs--------------:219] INFO base: "WETH"
                // 2025-03-05T18:05:03.439 [src/drafts/stream2.rs--------------:220] INFO spot_price: Ok(0.0004566088104707517)
                // 2025-03-05T18:05:03.439 [src/drafts/stream2.rs--------------:221] INFO spot_price: Ok(2190.0584856630912)
                // 2025-03-05T18:05:03.449 [src/drafts/stream2.rs--------------:333] INFO

                // ================================================= QUOTING ==================================================
                let mut amounts_out: HashMap<String, BigUint> = HashMap::new();
                let sell_token_address = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2".to_string();
                let buy_token_address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48".to_string();
                let sell_token = tokens.iter().find(|t| t.address.to_string().to_lowercase() == sell_token_address.to_string().to_lowercase()).expect("Sell token not found");
                let buy_token = tokens.iter().find(|t| t.address.to_string().to_lowercase() == buy_token_address.to_string().to_lowercase()).expect("Buy token not found");
                let provider = ProviderBuilder::new()
                    .with_chain(NamedChain::Mainnet)
                    // .wallet(signer.clone())
                    .on_http(network.rpc.clone().parse().unwrap());

                // Quote 0.01 to 10 ETH by step of 0.01

                let mut obs = shd::types::OrderBookSimu {
                    pool: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8".to_string(),
                    simulations: vec![],
                    spot_sprice: 2280.0,
                };

                // let mut bids = vec![];
                // let mut asks = vec![];

                if let Some(state) = message.states.get(&"0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8".to_string()) {
                    log::info!("State found");
                    let new_pair = message.new_pairs.get(&"0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8".to_string()).expect("New pair not found");
                    dbg!(state);
                    dbg!(new_pair);

                    let liquidity: Box<dyn tycho_simulation::protocol::state::ProtocolSim> = state.clone();

                    let time = std::time::SystemTime::now();
                    // let mut bestpool = String::default();
                    // let mut bestprice = 0.;
                    // let mut bestamount = 0.;
                    for i in 1..200 {
                        let amount_in = BigUint::from((i as f64 * 100. * 10f64.powi(sell_token.decimals as i32)) as u128);
                        // let amount_in = BigUint::from((1.0 * 10f64.powi(sell_token.decimals as i32)) as u128); // 1 ETH
                        match bestswap(&message, &mut pairs, amount_in.clone(), sell_token.clone(), buy_token.clone(), &mut amounts_out) {
                            Some(bs) => {
                                // log::info!("Best swap output: {:?}", bs.1);
                                let swap = shd::types::BestSwap {
                                    formatted_in: bs.formatted_in,
                                    formatted_out: bs.formatted_out,
                                    forward_price: bs.forward_price,
                                    reverse_price: bs.reverse_price,
                                };
                                obs.simulations.push(swap);
                                // if bs.1.to_f64().unwrap() > bestprice {
                                //     bestprice = bs.1.to_f64().unwrap();
                                //     bestpool = bs.0;
                                //     bestamount = amount_in.to_f64().unwrap();
                                // }
                            }
                            None => {
                                log::info!("No best swap found");
                            }
                        }
                    }

                    let path = "src/py/simulations-0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8.json".to_string();
                    let json = serde_json::to_string_pretty(&obs).unwrap();
                    let mut file = std::fs::File::create(path).expect("Unable to create file");
                    std::io::Write::write_all(&mut file, json.as_bytes()).expect("Unable to write data");

                    let elasped = time.elapsed().unwrap().as_millis();
                    log::info!("Elapsed time: {:?} ms for 100 computations", elasped);
                    // log::info!("Best pool: {:?}", bestpool);
                    // log::info!("Best price: {:?}", bestprice);
                    // log::info!("Best amount: {:?}", bestamount);
                }
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
    shd::utils::misc::log::new("stream2".to_string());
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
                let _eth = tycho_core::Bytes::from_str(network.eth.as_str()).unwrap();
                let _usdc = tycho_core::Bytes::from_str(network.usdc.as_str()).unwrap();
                let exotic = tycho_core::Bytes::from_str(network.exotic.as_str()).unwrap(); // GNO on Ethereum
                let trb = TokensRequestBody {
                    // token_addresses: Some(vec![eth, usdc]),                  // Option<Vec<Bytes>>,
                    token_addresses: Some(vec![exotic]),                     // Option<Vec<Bytes>>,
                    min_quality: Some(100),                                  // Option<i32>,
                    traded_n_days_ago: Some(42),                             // Option<u64>,
                    pagination: PaginationParams { page: 0, page_size: 10 }, // PaginationParams,
                    chain,                                                   // Chain,
                };
                match client.get_all_tokens(chain, Some(100), Some(42), 3000).await {
                    Ok(result) => {
                        let mut output = vec![];
                        for t in result.iter() {
                            // log::info!("Token: {:?}", t.address);
                            output.push(Token {
                                address: tycho_simulation::tycho_core::Bytes::from_str(t.address.clone().to_string().as_str()).unwrap(),
                                decimals: t.decimals as usize,
                                symbol: t.symbol.clone(),
                                gas: BigUint::ZERO, // WTF
                            });
                        }
                        stream(network.clone(), chain, output.clone(), config.clone()).await;
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

// TAP
