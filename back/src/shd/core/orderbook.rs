use tycho_simulation::{models::Token, protocol::state::ProtocolSim};

use crate::shd::{
    self,
    data::fmt::{SrzProtocolComponent, SrzToken},
    r#static::maths::ONE_MILLIONTH,
    types::{Network, PairQuery, PairSimulatedOrderbook, ProtoTychoState, TradeResult},
};
use std::{collections::HashMap, time::Instant};

/// @notice Reading 'state' from Redis DB while using TychoStreamState state and functions to compute/simulate might create a inconsistency
pub async fn build(network: Network, balances: HashMap<String, HashMap<String, u128>>, ptss: Vec<ProtoTychoState>, tokens: Vec<SrzToken>, query: PairQuery, utk0_ethworth: f64, utk1_ethworth: f64) -> PairSimulatedOrderbook {
    log::info!("Got {} pools to compute for pair: '{}'", ptss.len(), query.tag);
    let mut pools = Vec::new();
    let mut prices0to1 = vec![];
    let mut prices1to0 = vec![];
    let srzt0 = tokens[0].clone();
    let srzt1 = tokens[1].clone();
    let t0 = Token::from(srzt0.clone());
    let t1 = Token::from(srzt1.clone());
    let (base, quote) = (t0, t1);
    let mut aggt0lqdty = vec![];
    let mut aggt1lqdty = vec![];
    for pdata in ptss.clone() {
        log::info!("- Preparing pool: {} | Type: {}", pdata.component.id, pdata.component.protocol_type_name);
        pools.push(pdata.clone());
        let proto = pdata.protosim.clone();
        let price0to1 = proto.spot_price(&base, &quote).unwrap_or_default();
        let price1to0 = proto.spot_price(&quote, &base).unwrap_or_default();
        prices0to1.push(price0to1);
        prices1to0.push(price1to0);
        log::info!(" - Spot price for {}-{} => price0to1 = {} and price1to0 = {}", base.symbol, quote.symbol, price0to1, price1to0);
        match balances.get(&pdata.component.id.to_lowercase()) {
            Some(cpbs) => {
                let t0b = cpbs.get(&srzt0.address.to_lowercase()).unwrap_or(&0u128);
                aggt0lqdty.push(t0b.clone() as f64 / 10f64.powi(srzt0.decimals as i32));
                let t1b = cpbs.get(&srzt1.address.to_lowercase()).unwrap_or(&0u128);
                aggt1lqdty.push(t1b.clone() as f64 / 10f64.powi(srzt1.decimals as i32));
            }
            None => {}
        }
    }
    let cps: Vec<SrzProtocolComponent> = pools.clone().iter().map(|p| p.component.clone()).collect();
    let aggregated = shd::maths::steps::deepth(cps.clone(), tokens.clone(), balances.clone());
    let avgp0to1 = prices0to1.iter().sum::<f64>() / prices0to1.len() as f64;
    let avgp1to0 = prices1to0.iter().sum::<f64>() / prices1to0.len() as f64; // Ponderation by TVL ?
    log::info!("Average price 0to1: {} | Average price 1to0: {}", avgp0to1, avgp1to0);

    // return PairSimulatedOrderbook {
    //     token0: srzt0.clone(),
    //     token1: srzt1.clone(),
    //     trades0to1: vec![],
    //     trades1to0: vec![],
    //     prices0to1: prices0to1.clone(),
    //     prices1to0: prices1to0.clone(),
    //     pools: vec![],
    // };

    let mut pso = simulate(network.clone(), pools.clone(), tokens, query.clone(), aggregated.clone(), utk0_ethworth, utk1_ethworth).await;
    pso.prices0to1 = prices0to1.clone();
    pso.prices1to0 = prices1to0.clone();
    pso.aggt0lqdty = aggt0lqdty.clone();
    pso.aggt1lqdty = aggt1lqdty.clone();
    log::info!("Optimization done. Returning Simulated Orderbook for pair (base-quote) => '{}-{}'", base.symbol, quote.symbol);
    pso
}

/**
 * Optimizes a trade for a given pair of tokens and a set of pools.
 * The function generates a set of test amounts for ETH and USDC, then runs the optimizer for each amount.
 * The optimizer uses a simple gradient-based approach to move a fixed fraction of the allocation from the pool with the lowest marginal return to the one with the highest.
 * ToDo: AmountIn must not be greater than the component balance, or let's say 50% of it, because it don't make sense to impact more than 50% of the pool, even some % it worsens the price
 * ToDo: Top n pooL most liquid only, remove the too small liquidity pools
 */
pub async fn simulate(network: Network, pcsdata: Vec<ProtoTychoState>, tokens: Vec<SrzToken>, query: PairQuery, balances: HashMap<String, u128>, utk0_ethworth: f64, utk1_ethworth: f64) -> PairSimulatedOrderbook {
    let ethusd = shd::core::gas::ethusd().await;
    let gasp = shd::core::gas::gasprice(network.rpc).await;
    let t0 = tokens[0].clone();
    let t1 = tokens[1].clone();
    log::info!(
        "🔎 Optimisation | Network: {} | ETH is worth {} in USD | Got {} pools to optimize for pair: {}-{}",
        network.name,
        ethusd,
        pcsdata.len(),
        t0.symbol,
        t1.symbol
    );
    let mut pools = Vec::new();
    for pcdata in pcsdata.iter() {
        log::info!("pcdata: {} | Type: {}", pcdata.component.id, pcdata.component.protocol_type_name);
        pools.push(pcdata.component.clone());
    }
    let trades0to1 = optimize(&balances, &pcsdata, ethusd, gasp, &t0, &t1);
    log::info!("🔄  Switching to 1to0");
    let trades1to0 = optimize(&balances, &pcsdata, ethusd, gasp, &t1, &t0);
    PairSimulatedOrderbook {
        token0: tokens[0].clone(),
        token1: tokens[1].clone(),
        trades0to1: trades0to1.clone(),
        trades1to0: trades1to0.clone(),
        prices0to1: vec![], // Set later
        prices1to0: vec![], // Set later
        aggt0lqdty: vec![], // Set later
        aggt1lqdty: vec![], // Set later
        pools: pools.clone(),
    }
}

pub fn optimize(balances: &HashMap<String, u128>, pcs: &Vec<ProtoTychoState>, ethusd: f64, gasp: u128, token_from: &SrzToken, token_to: &SrzToken) -> Vec<TradeResult> {
    let mut trades = Vec::new();
    let tokb = *balances.iter().find(|x| x.0.to_lowercase() == token_from.address.to_lowercase()).unwrap().1;
    let start = tokb as f64 / ONE_MILLIONTH / 10f64.powi(token_from.decimals as i32) / 10.;
    log::info!(
        "Agg onchain liquidity balance for {} is {} (for 1 millionth => {})",
        token_from.symbol,
        tokb,
        tokb as f64 / 10f64.powi(token_from.decimals as i32)
    );
    let steps = shd::maths::steps::exponential(
        shd::r#static::maths::simu::COUNT,
        shd::r#static::maths::simu::START_MULTIPLIER,
        shd::r#static::maths::simu::END_MULTIPLIER,
        shd::r#static::maths::simu::MIN_EXP_DELTA,
    );
    let steps = steps.iter().map(|x| x * start).collect::<Vec<f64>>();
    for (x, amount) in steps.iter().enumerate() {
        let start = Instant::now();
        let result = shd::maths::opti::optimizer(*amount, pcs, token_from.clone(), token_to.clone());
        let elapsed = start.elapsed();
        let total_gas_cost = result.gas_costs.iter().sum::<u128>();
        let total_gas_cost = (total_gas_cost * gasp) as f64 * ethusd / 1e18f64;
        log::info!(
            " - #{x} | Input: {} {}, Output: {} {} at price {} | Distribution: {:?} | Total Gas cost: {:.8} $ | Took: {:?}",
            result.input,
            token_from.symbol,
            result.output,
            token_to.symbol,
            result.ratio,
            result.distribution,
            total_gas_cost,
            elapsed
        );
        trades.push(result);
    }
    trades
}
