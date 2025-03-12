use alloy::providers::ProviderBuilder;
use tycho_simulation::{
    evm::{
        engine_db::tycho_db::PreCachedDB,
        protocol::{uniswap_v2::state::UniswapV2State, uniswap_v3::state::UniswapV3State, uniswap_v4::state::UniswapV4State, vm::state::EVMPoolState},
    },
    models::Token,
    protocol::state::ProtocolSim,
};

use crate::shd::{
    core::sim::{self, optimization},
    data::fmt::{SrzEVMPoolState, SrzToken, SrzUniswapV2State, SrzUniswapV3State, SrzUniswapV4State},
    types::{AmmType, Network, PairOrderbook, PairQuery, PairSimulatedOrderbook, PoolComputeData, TradeResult},
    utils::tokens::get_balance,
};

use crate::shd::maths::odb::ToOrderbook;

/// @notice Reading 'state' from Redis DB while using TychoStreamState state and functions to compute/simulate might create a inconsistency
pub async fn liquidity(network: Network, datapools: Vec<PoolComputeData>, tokens: Vec<SrzToken>, query: PairQuery) -> PairOrderbook {
    log::info!("Got {} pools to compute for pair: '{}'", datapools.len(), query.tag);
    let mut odbs = Vec::new();
    for pdata in datapools.clone() {
        log::info!("Preparing pool: {} | Type: {}", pdata.component.id, pdata.component.protocol_type_name);
        let srzt0 = tokens[0].clone();
        let srzt1 = tokens[1].clone();
        let srztokens = vec![srzt0.clone(), srzt1.clone()];
        // if pdata.component.id.to_lowercase() != "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8" {
        //     log::info!("Skipping pool: {}", pdata.component.id);
        //     continue;
        // }

        if pdata.component.protocol_type_name.to_lowercase() == "uniswap_v4_pool" || pdata.component.protocol_type_name.to_lowercase() == "balancer_v2_pool" {
            log::info!("Skipping pool {} because it's {}", pdata.component.id, pdata.component.protocol_type_name.to_lowercase());
            continue;
        }

        let t0 = Token::from(srzt0.clone());
        let t1 = Token::from(srzt1.clone());

        let provider = ProviderBuilder::new().with_chain(alloy_chains::NamedChain::Mainnet).on_http(network.rpc.clone().parse().unwrap());
        let poolb0 = get_balance(&provider, srzt0.address.to_string(), pdata.component.id.clone()).await;
        let poolb0 = poolb0 as f64 / 10f64.powi(t0.decimals as i32);
        let poolb1 = get_balance(&provider, srzt1.address.to_string(), pdata.component.id.clone()).await;
        let poolb1 = poolb1 as f64 / 10f64.powi(t1.decimals as i32);
        log::info!("Pool balances: {}-{} => {} and {}", t0.symbol, t1.symbol, poolb0, poolb1);

        let (base, quote) = if query.z0to1 { (t0, t1) } else { (t1, t0) };
        let proto = pdata.protosim.clone();
        let price = proto.spot_price(&base, &quote).unwrap_or_default();
        log::info!("Spot price for {}-{} => {}", base.symbol, quote.symbol, price);
        match AmmType::from(pdata.component.protocol_type_name.clone().as_str()) {
            AmmType::UniswapV2 => {
                if let Some(state) = proto.as_any().downcast_ref::<UniswapV2State>() {
                    let state = SrzUniswapV2State::from((state.clone(), pdata.component.id.clone()));
                    let fee = proto.fee();
                    let book = state.clone().orderbook(pdata.component.clone(), srztokens.clone(), query.clone(), fee, price, poolb0, poolb1);
                    dbg!("uniswap v2 book", book.clone());
                    odbs.push(book);
                }
            }
            AmmType::UniswapV3 => {
                if let Some(state) = proto.as_any().downcast_ref::<UniswapV3State>() {
                    let state = SrzUniswapV3State::from((state.clone(), pdata.component.id.clone()));
                    let fee = proto.fee();
                    let book = state.clone().orderbook(pdata.component.clone(), srztokens.clone(), query.clone(), fee, price, poolb0, poolb1);
                    odbs.push(book);
                }
            }
            AmmType::UniswapV4 => {
                if let Some(state) = proto.as_any().downcast_ref::<UniswapV4State>() {
                    let state = SrzUniswapV4State::from((state.clone(), pdata.component.id.clone()));
                    let fee = proto.fee();
                    let book = state.clone().orderbook(pdata.component.clone(), srztokens.clone(), query.clone(), fee, price, poolb0, poolb1);
                }
            }
            AmmType::Curve | AmmType::Balancer => {
                if let Some(state) = proto.as_any().downcast_ref::<EVMPoolState<PreCachedDB>>() {
                    let state = SrzEVMPoolState::from((state.clone(), pdata.component.id.to_string()));
                    let fee = 0.0; // proto.fee(); // Tycho does not have a fee function implemented for EVMPoolState
                    let book = state.clone().orderbook(pdata.component.clone(), srztokens.clone(), query.clone(), fee, price, poolb0, poolb1);
                }
            }
        }
        log::info!("\n");
    }

    let output = PairOrderbook {
        from: tokens[0].clone(),
        to: tokens[1].clone(),
        orderbooks: odbs.clone(),
    };
    let path = format!("misc/data/{}.eth-usdc.pair-orderbook.json", network.name);
    crate::shd::utils::misc::save1(output.clone(), path.as_str());
    output
}

/// @notice Reading 'state' from Redis DB while using TychoStreamState state and functions to compute/simulate might create a inconsistency
pub async fn simulate(network: Network, datapools: Vec<PoolComputeData>, tokens: Vec<SrzToken>, query: PairQuery) -> PairSimulatedOrderbook {
    log::info!("Got {} pools to compute for pair: '{}'", datapools.len(), query.tag);
    let mut pools = Vec::new();
    for pdata in datapools.clone() {
        log::info!("Preparing pool: {} | Type: {}", pdata.component.id, pdata.component.protocol_type_name);
        if pdata.component.protocol_type_name.to_lowercase() == "uniswap_v4_pool" || pdata.component.protocol_type_name.to_lowercase() == "balancer_v2_pool" {
            log::info!("Skipping pool {} because it's {}", pdata.component.id, pdata.component.protocol_type_name.to_lowercase());
            continue;
        }
        pools.push(pdata.clone());
        let srzt0 = tokens[0].clone();
        let srzt1 = tokens[1].clone();
        let t0 = Token::from(srzt0.clone());
        let t1 = Token::from(srzt1.clone());
        let (base, quote) = if query.z0to1 { (t0, t1) } else { (t1, t0) };
        let proto = pdata.protosim.clone();
        let price = proto.spot_price(&base, &quote).unwrap_or_default();
        log::info!("Spot price for {}-{} => {}", base.symbol, quote.symbol, price);
        log::info!("\n");
    }
    optimization(network.clone(), pools, tokens, query).await
}
