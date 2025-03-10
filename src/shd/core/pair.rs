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
};

use crate::shd::maths::odb::ToOrderbook;

/// @notice Reading 'state' from Redis DB while using TychoStreamState state and functions to compute/simulate might create a inconsistency
pub fn prepare(network: Network, datapools: Vec<PoolComputeData>, tokens: Vec<String>, query: PairQuery) {
    log::info!("Got {} pools to compute for pair: '{}'", datapools.len(), query.tag);
    for pdata in datapools.clone() {
        let srzt0 = pdata.component.tokens.iter().find(|x| x.address.to_lowercase() == tokens[0].clone()).unwrap();
        let srzt1 = pdata.component.tokens.iter().find(|x| x.address.to_lowercase() == tokens[1].clone()).unwrap();
        let srztks = vec![srzt0.clone(), srzt1.clone()];
        let t0 = Token::from(srzt0.clone());
        let t1 = Token::from(srzt1.clone());
        let (base, quote) = if query.z0to1 { (t0, t1) } else { (t1, t0) };
        let proto = pdata.protosim.clone();
        let price = proto.spot_price(&base, &quote).unwrap_or({
            log::error!("Failed to get spot price for {}-{}", base.symbol, quote.symbol);
            0.0
        });
        log::info!("Spot price for {}-{}: {}", base.symbol, quote.symbol, price);
        match AmmType::from(pdata.component.protocol_type_name.clone().as_str()) {
            AmmType::UniswapV2 => match proto.as_any().downcast_ref::<UniswapV2State>() {
                Some(state) => {
                    log::info!("Spot price for {}-{}: {}", base.symbol, quote.symbol, price);
                    let state = SrzUniswapV2State::from((state.clone(), pdata.component.id.clone()));
                    let fee = proto.fee();
                    let book = state.clone().orderbook(pdata.component.clone(), srztks.clone(), query.clone(), fee, price);
                }
                None => {}
            },
            AmmType::UniswapV3 => match proto.as_any().downcast_ref::<UniswapV3State>() {
                Some(state) => {
                    let state = SrzUniswapV3State::from((state.clone(), pdata.component.id.clone()));
                    let fee = proto.fee();
                    let book = state.clone().orderbook(pdata.component.clone(), srztks.clone(), query.clone(), fee, price);
                }
                None => {}
            },
            AmmType::UniswapV4 => match proto.as_any().downcast_ref::<UniswapV4State>() {
                Some(state) => {
                    let state = SrzUniswapV4State::from((state.clone(), pdata.component.id.clone()));
                    let fee = proto.fee();
                    let book = state.clone().orderbook(pdata.component.clone(), srztks.clone(), query.clone(), fee, price);
                }
                None => {}
            },
            AmmType::Curve | AmmType::Balancer => match proto.as_any().downcast_ref::<EVMPoolState<PreCachedDB>>() {
                Some(state) => {
                    let state = SrzEVMPoolState::from((state.clone(), pdata.component.id.to_string()));
                    let fee = 0.0; // proto.fee(); // Tycho does not have a fee function implemented for EVMPoolState
                    let book = state.clone().orderbook(pdata.component.clone(), srztks.clone(), query.clone(), fee, price);
                }
                None => {}
            },
        }
    }
}
