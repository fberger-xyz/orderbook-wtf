use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;

use futures::StreamExt;
use num_bigint::BigUint;
use tap2::shd;
use tap2::shd::data::fmt::SrzEVMPoolState;
use tap2::shd::data::fmt::SrzProtocolComponent;
use tap2::shd::data::fmt::SrzUniswapV2State;
use tap2::shd::data::fmt::SrzUniswapV3State;
use tap2::shd::data::fmt::SrzUniswapV4State;
use tap2::shd::r#static::data::keys;
use tap2::shd::types::AmmType;
use tap2::shd::types::EnvConfig;
use tap2::shd::types::Network;
use tap2::shd::types::SharedTychoStreamState;
use tap2::shd::types::SyncState;
use tap2::shd::types::TychoStreamState;
use tokio::sync::RwLock;
use tycho_client::rpc::HttpRPCClient;
use tycho_client::rpc::RPCClient;
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
    tycho_client::feed::component_tracker::ComponentFilter,
};

use tycho_simulation::protocol::models::ProtocolComponent;

type ChainCore = tycho_core::dto::Chain;
type ChainSimu = tycho_simulation::evm::tycho_models::Chain;

pub fn chain(name: String) -> Option<(ChainCore, ChainSimu)> {
    match name.as_str() {
        "ethereum" => Some((ChainCore::Ethereum, ChainSimu::Ethereum)),
        "arbitrum" => Some((ChainCore::Arbitrum, ChainSimu::Arbitrum)),
        "starknet" => Some((ChainCore::Starknet, ChainSimu::Starknet)),
        "zksync" => Some((ChainCore::ZkSync, ChainSimu::ZkSync)),
        "base" => Some((ChainCore::Base, ChainSimu::Base)),
        _ => None,
    }
}

async fn stream(network: Network, tokens: Vec<Token>, config: EnvConfig) {
    let u4 = uniswap_v4_pool_with_hook_filter;
    let balancer = balancer_pool_filter;
    let curve = curve_pool_filter;
    let (_, chain) = chain(network.name.clone()).expect("Invalid chain");
    let filter = ComponentFilter::with_tvl_range(1.0, 100.0);
    let mut hmt = HashMap::new();
    tokens.iter().for_each(|t| {
        hmt.insert(t.address.clone(), t.clone());
    });

    let mut targets = HashMap::new();
    let weth = hmt.get(&Bytes::from_str(network.eth.as_str()).unwrap()).unwrap_or_else(|| panic!("WETH not found on {}", network.name));
    let usdc = hmt.get(&Bytes::from_str(network.usdc.as_str()).unwrap()).unwrap_or_else(|| panic!("USDC not found on {}", network.name));
    // let dai = hmt.get(&Bytes::from_str("0x6b175474e89094c44da98b954eedeac495271d0f").unwrap()).expect("usdt not found");
    // let usdt = hmt.get(&Bytes::from_str("0xdac17f958d2ee523a2206206994597c13d831ec7").unwrap()).expect("USDT not found");
    targets.insert(weth.clone().address, weth.clone());
    targets.insert(usdc.clone().address, usdc.clone());

    let endpoint = network.tycho.trim_start_matches("https://");
    log::info!("Connecting to Tycho at {} on {:?}", endpoint, chain);
    match ProtocolStreamBuilder::new(endpoint, chain)
        .exchange::<UniswapV2State>("uniswap_v2", filter.clone(), None)
        .exchange::<UniswapV3State>("uniswap_v3", filter.clone(), None)
        .exchange::<UniswapV4State>("uniswap_v4", filter.clone(), Some(u4))
        .exchange::<EVMPoolState<PreCachedDB>>("vm:balancer_v2", filter.clone(), Some(balancer))
        .exchange::<EVMPoolState<PreCachedDB>>("vm:curve", filter.clone(), Some(curve))
        .auth_key(Some(config.tycho_api_key.clone()))
        .skip_state_decode_failures(true)
        .set_tokens(hmt.clone())
        .await
        .build()
        .await
    {
        Ok(mut stream) => {
            while let Some(msg) = stream.next().await {
                match msg {
                    Ok(msg) => {
                        log::info!("🔸 Got new msg from ProtocolStreamBuilder at block # {} 🔸", msg.block_number);

                        shd::data::redis::set(keys::stream::status(network.name.clone()).as_str(), SyncState::Syncing as u128).await;
                        shd::data::redis::set(keys::stream::latest(network.name.clone()).as_str(), msg.block_number).await;

                        let updating = !msg.states.is_empty();

                        // The stream created emits BlockUpdate messages which consist of:
                        // - block number- the block this update message refers to
                        // - new_pairs- new components witnessed (either recently created or newly meeting filter criteria)
                        // - removed_pairs- components no longer tracked (either deleted due to a reorg or no longer meeting filter criteria)
                        // - states- the updated ProtocolSimstates for all components modified in this block
                        // The first message received will contain states for all protocol components registered to. Thereafter, further block updates will only contain data for updated or new components.

                        log::info!("Got {} state updates", msg.states.len());
                        log::info!("Got {} new_pairs", msg.new_pairs.len());
                        log::info!("Got {} removed_pairs", msg.removed_pairs.len());

                        match shd::data::redis::get::<SyncState>(keys::stream::status(network.name.clone()).as_str()).await {
                            Some(state) => {
                                log::info!("Sync state: {:?}", state);
                                if msg.new_pairs.is_empty() {
                                    log::info!("No new pairs. Continuing to next message...");
                                    continue;
                                }
                            }
                            None => {
                                log::info!("Sync state not found");
                            }
                        }

                        let mut updates = HashMap::new();
                        if updating {
                            for up in msg.states.iter() {
                                // log::info!("- Updating state for {}", up.0);

                                // ProtoSim
                                let x = up.1.clone_box();

                                let key1 = keys::stream::component(up.0.to_string().to_lowercase());
                                if let Some(cp) = shd::data::redis::get::<SrzProtocolComponent>(key1.as_str()).await {
                                    updates.insert(up.0.clone(), ProtocolComponent::from(cp));
                                }
                                // Get the Redis key for the component
                            }
                        }

                        // Tmp !
                        let mut targets = vec![];
                        let mut pairs: HashMap<String, ProtocolComponent> = HashMap::new();
                        for (id, comp) in msg.new_pairs.iter() {
                            pairs.entry(id.clone()).or_insert_with(|| comp.clone());
                            let t0 = comp.tokens.first().unwrap();
                            let t1 = comp.tokens.get(1).unwrap();
                            if (t0.address == weth.address || t1.address == weth.address) && (t0.address == usdc.address || t1.address == usdc.address) {
                                targets.push(comp.id.to_string().to_lowercase());
                            }
                        }

                        log::info!("--------- States on network: {} --------- ", network.name);
                        for m in targets.clone() {
                            if let Some(proto) = msg.states.get(&m.to_string()) {
                                let comp = msg.new_pairs.get(&m.to_string()).expect("New pair not found");
                                log::info!("Match USDC|ETH at {:?} | Proto: {}", comp.id, comp.protocol_type_name);
                                let stattribute = comp.static_attributes.clone();
                                for (k, v) in stattribute.iter() {
                                    log::info!(" >>> Static Attributes: {}: {:?}", k, v);
                                }
                                let base = comp.tokens.first().unwrap();
                                let quote = comp.tokens.get(1).unwrap();
                                log::info!(" - Base Token : {:?} | Spot Price base/quote = {:?}", base.symbol, proto.spot_price(base, quote));
                                log::info!(" - Quote Token: {:?} | Spot Price quote/base = {:?}", quote.symbol, proto.spot_price(quote, base));
                                match AmmType::from(comp.protocol_type_name.as_str()) {
                                    AmmType::UniswapV2 => {
                                        if let Some(state) = proto.as_any().downcast_ref::<UniswapV2State>() {
                                            // log::info!("Good downcast to UniswapV2State");
                                            log::info!(" - reserve0: {}", state.reserve0.to_string());
                                            log::info!(" - reserve1: {}", state.reserve1.to_string());
                                            // Store the comp in Redis
                                            let pc = SrzProtocolComponent::from(comp.clone());
                                            let key1 = keys::stream::component(comp.id.to_string().to_lowercase());
                                            shd::data::redis::set(key1.as_str(), pc.clone()).await;
                                            // Store the state
                                            let key2 = keys::stream::state(comp.id.to_string().to_lowercase());
                                            let srz = SrzUniswapV2State::from(state.clone());
                                            shd::data::redis::set(key2.as_str(), srz.clone()).await;
                                        } else {
                                            log::info!("Downcast to 'UniswapV2State' failed on proto '{}'", comp.protocol_type_name);
                                        }
                                    }
                                    AmmType::UniswapV3 => {
                                        if let Some(state) = proto.as_any().downcast_ref::<UniswapV3State>() {
                                            // log::info!("Good downcast to UniswapV3State");
                                            log::info!(" - (comp) fee: {:?}", state.fee());
                                            log::info!(" - (comp) spot_sprice: {:?}", state.spot_price(base, quote));

                                            // Store the comp in Redis
                                            let key1 = keys::stream::component(comp.id.to_string().to_lowercase());
                                            let pc = SrzProtocolComponent::from(comp.clone());
                                            shd::data::redis::set(key1.as_str(), pc.clone()).await;
                                            // Store the state
                                            let key2 = keys::stream::state(comp.id.to_string().to_lowercase());
                                            let srz = SrzUniswapV3State::from(state.clone());
                                            shd::data::redis::set(key2.as_str(), srz.clone()).await;

                                            log::info!(" - (srz state) liquidity   : {} ", srz.liquidity);
                                            log::info!(" - (srz state) sqrt_price  : {} ", srz.sqrt_price.to_string());
                                            log::info!(" - (srz state) fee         : {:?} ", srz.fee);
                                            log::info!(" - (srz state) tick        : {} ", srz.tick);
                                            log::info!(" - (srz state) tick_spacing: {} ", srz.ticks.tick_spacing);
                                            log::info!(" - (srz state) ticks len   : {}", srz.ticks.ticks.len());
                                        } else {
                                            log::info!("Downcast to 'UniswapV3State' failed on proto '{}'", comp.protocol_type_name);
                                        }
                                    }
                                    AmmType::UniswapV4 => {
                                        if let Some(state) = proto.as_any().downcast_ref::<UniswapV4State>() {
                                            // log::info!("Good downcast to UniswapV4State");
                                            log::info!(" - fee: {:?}", state.fee());
                                            log::info!(" - spot_sprice: {:?}", state.spot_price(base, quote));

                                            // Store the comp in Redis
                                            let key1 = keys::stream::component(comp.id.to_string().to_lowercase());
                                            let pc = SrzProtocolComponent::from(comp.clone());
                                            shd::data::redis::set(key1.as_str(), pc.clone()).await;
                                            // Store the state
                                            let key2 = keys::stream::state(comp.id.to_string().to_lowercase());
                                            let srz = SrzUniswapV4State::from(state.clone());
                                            shd::data::redis::set(key2.as_str(), srz.clone()).await;
                                            log::info!(" - (srz state) liquidity   : {} ", srz.liquidity);
                                            log::info!(" - (srz state) sqrt_price  : {:?} ", srz.sqrt_price);
                                            log::info!(" - (srz state) fees        : {:?} ", srz.fees);
                                            log::info!(" - (srz state) tick        : {} ", srz.tick);
                                            log::info!(" - (srz state) tick_spacing: {} ", srz.ticks.tick_spacing);
                                            log::info!(" - (srz state) ticks len   : {} ", srz.ticks.ticks.len());
                                        } else {
                                            log::info!("Downcast to 'UniswapV4State' failed on proto '{}'", comp.protocol_type_name);
                                        }
                                    }
                                    AmmType::Balancer | AmmType::Curve => {
                                        if let Some(state) = proto.as_any().downcast_ref::<EVMPoolState<PreCachedDB>>() {
                                            // log::info!("Good downcast to 'EVMPoolState<PreCachedDB>' | Protocol : {}", comp.protocol_type_name);
                                            // log::info!(" - fee: {:?}", state.fee()); //! Not implemented
                                            log::info!(" - spot_sprice: {:?}", state.spot_price(base, quote));
                                            // Store the comp in Redis
                                            let key1 = keys::stream::component(comp.id.to_string().to_lowercase());
                                            let pc = SrzProtocolComponent::from(comp.clone());
                                            shd::data::redis::set(key1.as_str(), pc.clone()).await;
                                            // Store the state
                                            let key2 = keys::stream::state(comp.id.to_string().to_lowercase());

                                            let srz = SrzEVMPoolState {
                                                id: state.id.clone(),
                                                tokens: state.tokens.iter().map(|t| t.to_string().clone()).collect(),
                                                block: state.block.number,
                                                balances: state.balances.iter().map(|(k, v)| (k.to_string(), *v)).collect(),
                                            };
                                            log::info!(" - (srz state) id        : {} ", srz.id);
                                            log::info!(" - (srz state) tokens    : {:?} ", srz.tokens);
                                            log::info!(" - (srz state) block     : {} ", srz.block);
                                            log::info!(" - (srz state) balances  : {:?} ", srz.balances);

                                            shd::data::redis::set(key2.as_str(), srz.clone()).await;
                                        } else {
                                            log::info!("Downcast to 'EVMPoolState<PreCachedDB>' failed on proto '{}'", comp.protocol_type_name);
                                        }
                                    }
                                }

                                let key1 = keys::stream::component(comp.id.to_string().to_lowercase());
                                if let Some(cp) = shd::data::redis::get::<SrzProtocolComponent>(key1.as_str()).await {
                                    log::info!(" - SrzProtocolComponent: {:?}", cp);
                                }
                            }
                            log::info!("\n\n");
                        }
                        shd::data::redis::set(keys::stream::status(network.name.clone()).as_str(), SyncState::Running as u128).await;
                        log::info!("--------- Done for {} --------- ", network.name.clone());
                    }
                    Err(e) => {
                        eprintln!("Error: ProtocolStreamBuilder on {}: {:?}. Continuing.", network.name, e);
                        shd::data::redis::set(keys::stream::status(network.name.clone()).as_str(), SyncState::Error as u128).await;
                        continue;
                    }
                };
            }
        }
        Err(e) => {
            log::error!("Failed to create stream: {:?}", e.to_string());
        }
    }
}

/**
 * Stream the entire state from each AMMs, with TychoStreamBuilder.
 */
#[tokio::main]
async fn main() {
    shd::utils::misc::log::new("stream".to_string());
    dotenv::from_filename(".env.prod").ok();
    let config = EnvConfig::new();
    log::info!("Launching Stream | 🧪 Testing {:?}", config.testing);
    let path = "src/shd/config/networks.json".to_string();
    let networks: Vec<Network> = shd::utils::misc::read(&path);
    let networks = networks.iter().filter(|x| x.enabled).cloned().collect::<Vec<Network>>();
    shd::data::redis::ping().await;

    for network in networks.clone() {
        log::info!("Adding network {} to the stream", network.name);
        shd::data::redis::set(keys::stream::status(network.name.clone()).as_str(), SyncState::Launching as u128).await;
        shd::data::redis::set(keys::stream::latest(network.name.clone().to_string()).as_str(), 0).await;
    }

    let stss: SharedTychoStreamState = Arc::new(RwLock::new(TychoStreamState {
        states: HashMap::new(),
        components: HashMap::new(),
    }));

    let server = Arc::clone(&stss);
    tokio::spawn(async move {
        loop {
            {
                let state = server.read().await;
                log::info!("API Task: states = {:?}", state.states.keys());
                log::info!("API Task: components = {:?}", state.components.keys());
            }
            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
        }
    });

    let mut handles = Vec::new();
    for network in networks.clone() {
        let config = config.clone();
        let handle = tokio::spawn(async move {
            loop {
                match HttpRPCClient::new(&network.tycho, Some(&config.tycho_api_key)) {
                    Ok(client) => {
                        let time = std::time::SystemTime::now();
                        let (chain, _) = chain(network.name.clone()).expect("Invalid chain");
                        match client.get_all_tokens(chain, Some(100), Some(1), 3000).await {
                            Ok(result) => {
                                let mut tokens = vec![];
                                for t in result.iter() {
                                    tokens.push(Token {
                                        address: tycho_simulation::tycho_core::Bytes::from_str(t.address.clone().to_string().as_str()).unwrap(),
                                        decimals: t.decimals as usize,
                                        symbol: t.symbol.clone(),
                                        gas: BigUint::ZERO, // !?
                                    });
                                }
                                let elasped = time.elapsed().unwrap().as_millis();
                                log::info!("Took {:?} ms to get {} tokens on {}", elasped, tokens.len(), network.name);
                                // stream(network.clone(), tokens.clone(), config.clone()).await;
                            }
                            Err(e) => {
                                log::error!("Failed to get tokens: {:?}", e.to_string());
                            }
                        }
                    }
                    Err(e) => {
                        log::error!("Failed to create client: {:?}", e.to_string());
                    }
                }
                log::info!("Waiting 5 seconds before looping.");
                tokio::time::sleep(tokio::time::Duration::from_secs(5)).await; // In case of error, wait 5 seconds before retrying
            }
        });
        handles.push(handle);
    }
    futures::future::join_all(handles).await;
    log::info!("Program over");
}
