use tycho_simulation::{models::Token, protocol::state::ProtocolSim};

use crate::shd::{
    self,
    data::fmt::{SrzProtocolComponent, SrzToken},
    r#static::maths::ONE_MILLIONTH,
    types::{Network, PairQuery, PairSimulatedOrderbook, ProtoTychoState},
};
use std::{collections::HashMap, time::Instant};

/// @notice Reading 'state' from Redis DB while using TychoStreamState state and functions to compute/simulate might create a inconsistency
pub async fn build(network: Network, atks: Vec<SrzToken>, balances: HashMap<String, HashMap<String, u128>>, datapools: Vec<ProtoTychoState>, tokens: Vec<SrzToken>, query: PairQuery) -> PairSimulatedOrderbook {
    log::info!("Got {} pools to compute for pair: '{}'", datapools.len(), query.tag);
    let mut pools = Vec::new();
    let mut prices0to1 = vec![];
    let mut prices1to0 = vec![];
    let srzt0 = tokens[0].clone();
    let srzt1 = tokens[1].clone();
    let t0 = Token::from(srzt0.clone());
    let t1 = Token::from(srzt1.clone());
    let (base, quote) = (t0, t1);
    log::info!("🏷️  Searching a swap-path to price the base token in gas (ETH) | Base: {} | Quote: {})", base.symbol, quote.symbol);
    let t0pricing = shd::core::gas::pricing(network.clone(), datapools.clone(), atks.clone(), base.address.to_string().to_lowercase().clone());
    log::info!("Pricing for {} => {:?}", base.symbol, t0pricing);
    for pdata in datapools.clone() {
        log::info!("Preparing pool: {} | Type: {}", pdata.component.id, pdata.component.protocol_type_name);
        pools.push(pdata.clone());
        let proto = pdata.protosim.clone();
        let price0to1 = proto.spot_price(&base, &quote).unwrap_or_default();
        let price1to0 = proto.spot_price(&quote, &base).unwrap_or_default();
        prices0to1.push(price0to1);
        prices1to0.push(price1to0);
        log::info!("Spot price for {}-{} => price0to1 = {} and price1to0 = {}", base.symbol, quote.symbol, price0to1, price1to0);
    }
    let cps: Vec<SrzProtocolComponent> = pools.clone().iter().map(|p| p.component.clone()).collect();
    let aggregated = shd::maths::steps::deepth(cps.clone(), tokens.clone(), balances.clone());
    let avgp0to1 = prices0to1.iter().sum::<f64>() / prices0to1.len() as f64;
    let avgp1to0 = prices1to0.iter().sum::<f64>() / prices1to0.len() as f64; // Ponderation by TVL ?
    log::info!("Average price 0to1: {} | Average price 1to0: {}", avgp0to1, avgp1to0);
    let mut pso = optimization(network.clone(), pools.clone(), tokens, query.clone(), aggregated.clone()).await;
    pso.prices0to1 = prices0to1.clone();
    pso.prices1to0 = prices1to0.clone();
    log::info!("Optimization done. Returning Simulated Orderbook for pair (base-quote) => '{}-{}'", base.symbol, quote.symbol);

    pso
}

/**
 * Optimizes a trade for a given pair of tokens and a set of pools.
 * The function generates a set of test amounts for ETH and USDC, then runs the optimizer for each amount.
 * The optimizer uses a simple gradient-based approach to move a fixed fraction of the allocation from the pool with the lowest marginal return to the one with the highest.
 * ToDo: AmountIn must now be greater than the component balance, or let's say 50% of it, because it don't make sense to impact more than 50% of the pool, even some % it worsens the price
 * ToDo: Top n pooL most liquid only, remove the too small liquidity pools
 */
pub async fn optimization(network: Network, pcsdata: Vec<ProtoTychoState>, tokens: Vec<SrzToken>, query: PairQuery, balances: HashMap<String, u128>) -> PairSimulatedOrderbook {
    let ethusd = shd::core::gas::ethusd().await;
    let gasp = shd::core::gas::gasprice(network.rpc).await;
    let t0 = tokens[0].clone();
    let t1 = tokens[1].clone();
    log::info!("🔎 Optimisation | Network: {} | Got {} pools to optimize for pair: {}-{}", network.name, pcsdata.len(), t0.symbol, t1.symbol);
    let mut pools = Vec::new();
    for pcdata in pcsdata.iter() {
        log::info!("pcdata: {} | Type: {}", pcdata.component.id, pcdata.component.protocol_type_name);
        pools.push(pcdata.component.clone());
        // for x in pcdata.component.tokens.iter() {
        //     log::info!("Token: {} => {}", x.symbol, x.address.to_string());
        // }
    }

    let t0tb = *balances.iter().find(|x| x.0.clone().to_lowercase() == t0.address.to_lowercase()).unwrap().1;
    let t1tb = *balances.iter().find(|x| x.0.clone().to_lowercase() == t1.address.to_lowercase()).unwrap().1;
    let t0tb_one_mn = t0tb as f64 / ONE_MILLIONTH / 10f64.powi(t0.decimals as i32) / 10.; // Divided by 10 again for 1/10 million-th

    // let t0tb_one_tenmn = t0tb_one_mn / 10.; // 10% of the 1 millionth, to start even lower, especially for execution testing
    let t1tb_one_mn = t1tb as f64 / ONE_MILLIONTH / 10f64.powi(t1.decimals as i32) / 10.; // Divided by 10 again for 1/10 million-th

    // let t1tb_one_tenmn = t1tb_one_mn / 10.; // 10% of the 1 millionth, to start even lower, especially for execution testing
    log::info!(
        "Aggregated onchain liquidity balance for {} is {} (for 1 millionth => {})",
        t0.symbol,
        t0tb as f64 / 10f64.powi(t0.decimals as i32),
        t0tb_one_mn
    );
    log::info!(
        "Aggregated onchain liquidity balance for {} is {} (for 1 millionth => {})",
        t1.symbol,
        t1tb as f64 / 10f64.powi(t1.decimals as i32),
        t1tb_one_mn
    );

    // let segments0to1 = shd::maths::steps::gsegments(t0tb_one_mn);
    // let steps0to1 = shd::maths::steps::gsteps(PairSimuIncrementConfig { segments: segments0to1.clone() }.segments);

    let mut trades0to1 = Vec::new();
    {
        let expsteps0to1 = shd::maths::steps::generate_exponential_points(25, 1., 250_000.);
        let steps0to1 = expsteps0to1.iter().map(|x| x * t0tb_one_mn).collect::<Vec<f64>>();
        // let total_steps = steps0to1.len() as u64;
        // let pb = ProgressBar::new(total_steps);
        // pb.set_style(
        //     ProgressStyle::default_bar()
        //         .template("{spinner:.green} [{elapsed_precise}] [{bar:40.green/white}] {pos}/{len} ({eta})")
        //         .unwrap()
        //         .progress_chars("#>-"),
        // );
        for (x, amount) in steps0to1.iter().enumerate() {
            let start = Instant::now();
            let result = shd::maths::opti::optimizer(*amount, &pcsdata, &balances, ethusd, t0.clone(), t1.clone());
            let elapsed = start.elapsed();
            let total_gas_cost = result.gas_costs.iter().sum::<u128>();
            let total_gas_cost = (total_gas_cost * gasp) as f64 * ethusd / 1e18f64;
            log::info!(
                " - #{x} | Input: {} {:.4}, Output: {} {:.4} at price1to0: {:.7} | Distribution: {:?} | Total Gas cost: {:.8} $ | Took: {:?}",
                result.input,
                t0.symbol,
                result.output,
                t1.symbol,
                result.ratio,
                result.distribution,
                total_gas_cost,
                elapsed
            );
            // pb.inc(1); // Update the progress bar on each iteration.
            trades0to1.push(result);
        }
    }

    log::info!("🔄  Switching to 1to0");
    // let segments1to0 = shd::maths::steps::gsegments(t1tb_one_mn);
    // let steps1to0 = shd::maths::steps::gsteps(PairSimuIncrementConfig { segments: segments1to0.clone() }.segments);

    let mut trades1to0 = Vec::new();
    {
        let expsteps0to1 = shd::maths::steps::generate_exponential_points(25, 1., 200_000.);
        let steps1to0 = expsteps0to1.iter().map(|x| x * t1tb_one_mn).collect::<Vec<f64>>();

        for (x, amount) in steps1to0.iter().enumerate() {
            let start = Instant::now();
            let result = shd::maths::opti::optimizer(*amount, &pcsdata, &balances, ethusd, t1.clone(), t0.clone());
            let elapsed = start.elapsed();
            let total_gas_cost = result.gas_costs.iter().sum::<u128>();
            let total_gas_cost = (total_gas_cost * gasp) as f64 * ethusd / 1e18f64;
            log::info!(
                " - #{x} | Input: {} {:.4}, Output: {} {:.4} at price0to1: {:.7} | Distribution: {:?} | Total Gas cost: {:.8} $ | Took: {:?}",
                result.input,
                t1.symbol,
                result.output,
                t0.symbol,
                result.ratio,
                result.distribution,
                total_gas_cost,
                elapsed
            );
            trades1to0.push(result);
        }
    }

    PairSimulatedOrderbook {
        token0: tokens[0].clone(),
        token1: tokens[1].clone(),
        trades0to1: trades0to1.clone(),
        trades1to0: trades1to0.clone(),
        prices0to1: vec![],
        prices1to0: vec![],
        pools: pools.clone(),
    }
}
