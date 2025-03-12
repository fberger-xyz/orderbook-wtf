use tycho_simulation::{
    models::Token,
    protocol::state::ProtocolSim,
};

use crate::shd::{
    core::sim::optimization,
    data::fmt::SrzToken,
    types::{Network, PairQuery, PairSimulatedOrderbook, ProtoTychoState},
};


/// @notice Reading 'state' from Redis DB while using TychoStreamState state and functions to compute/simulate might create a inconsistency
pub async fn build(network: Network, datapools: Vec<ProtoTychoState>, tokens: Vec<SrzToken>, query: PairQuery) -> PairSimulatedOrderbook {
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
