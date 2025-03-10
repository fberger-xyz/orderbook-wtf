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
    data::{
        self,
        fmt::{SrzEVMPoolState, SrzProtocolComponent, SrzUniswapV2State, SrzUniswapV3State, SrzUniswapV4State},
    },
    r#static,
    types::{AmmType, Network, PairQuery, PoolComputeData},
    utils::tokens::get_balance,
};

use crate::shd::maths::odb::ToOrderbook;

/// @notice Reading 'state' from Redis DB while using TychoStreamState state and functions to compute/simulate might create a inconsistency
pub async fn prepare(network: Network, datapools: Vec<PoolComputeData>, tokens: Vec<String>, query: PairQuery) {
    log::info!("Got {} pools to compute for pair: '{}'", datapools.len(), query.tag);
    for pdata in datapools.clone() {
        let srzt0 = pdata.component.tokens.iter().find(|x| x.address.to_lowercase() == tokens[0].clone()).unwrap();
        let srzt1 = pdata.component.tokens.iter().find(|x| x.address.to_lowercase() == tokens[1].clone()).unwrap();
        let srztokens = vec![srzt0.clone(), srzt1.clone()];

        if pdata.component.id.to_lowercase() != "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8" {
            log::info!("Skipping pool: {}", pdata.component.id);
            continue;
        }

        let t0 = Token::from(srzt0.clone());
        let t1 = Token::from(srzt1.clone());

        let provider = ProviderBuilder::new().with_chain(alloy_chains::NamedChain::Mainnet).on_http(network.rpc.clone().parse().unwrap());
        let poolb0 = get_balance(&provider, srzt0.address.to_string(), pdata.component.id.clone()).await;
        let poolb0 = poolb0 / 10u128.pow(t0.decimals as u32);
        let poolb1 = get_balance(&provider, srzt1.address.to_string(), pdata.component.id.clone()).await;
        let poolb1 = poolb1 / 10u128.pow(t1.decimals as u32);
        log::info!("Pool balances: {}-{} => {} and {}", t0.symbol, t1.symbol, poolb0, poolb1);

        let (base, quote) = if query.z0to1 { (t0, t1) } else { (t1, t0) };
        let proto = pdata.protosim.clone();
        let price = proto.spot_price(&base, &quote).unwrap_or_default();
        log::info!("Spot price for {}-{} => {}", base.symbol, quote.symbol, price);
        match AmmType::from(pdata.component.protocol_type_name.clone().as_str()) {
            AmmType::UniswapV2 => match proto.as_any().downcast_ref::<UniswapV2State>() {
                Some(state) => {
                    let state = SrzUniswapV2State::from((state.clone(), pdata.component.id.clone()));
                    let fee = proto.fee();
                    let book = state.clone().orderbook(pdata.component.clone(), srztokens.clone(), query.clone(), fee, price);
                }
                None => {}
            },
            AmmType::UniswapV3 => match proto.as_any().downcast_ref::<UniswapV3State>() {
                Some(state) => {
                    let state = SrzUniswapV3State::from((state.clone(), pdata.component.id.clone()));
                    let fee = proto.fee();
                    let book = state.clone().orderbook(pdata.component.clone(), srztokens.clone(), query.clone(), fee, price);
                }
                None => {}
            },
            AmmType::UniswapV4 => match proto.as_any().downcast_ref::<UniswapV4State>() {
                Some(state) => {
                    let state = SrzUniswapV4State::from((state.clone(), pdata.component.id.clone()));
                    let fee = proto.fee();
                    let book = state.clone().orderbook(pdata.component.clone(), srztokens.clone(), query.clone(), fee, price);
                }
                None => {}
            },
            AmmType::Curve | AmmType::Balancer => match proto.as_any().downcast_ref::<EVMPoolState<PreCachedDB>>() {
                Some(state) => {
                    let state = SrzEVMPoolState::from((state.clone(), pdata.component.id.to_string()));
                    let fee = 0.0; // proto.fee(); // Tycho does not have a fee function implemented for EVMPoolState
                    let book = state.clone().orderbook(pdata.component.clone(), srztokens.clone(), query.clone(), fee, price);
                }
                None => {}
            },
        }
        log::info!("\n");
    }
}
