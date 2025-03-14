use tycho_simulation::{models::Token, protocol::state::ProtocolSim};

use crate::shd::{
    self,
    data::fmt::{SrzProtocolComponent, SrzToken},
    r#static::maths::ONE_MILLIONTH,
    types::{Network, PairQuery, PairSimuIncrementConfig, PairSimulatedOrderbook, ProtoTychoState, TradeResult},
};
use indicatif::{ProgressBar, ProgressStyle};
use num_bigint::BigUint;
use num_traits::Zero;
use std::{collections::HashMap, time::Instant};

/// @notice Reading 'state' from Redis DB while using TychoStreamState state and functions to compute/simulate might create a inconsistency
pub async fn build(network: Network, balances: HashMap<String, HashMap<String, u128>>, datapools: Vec<ProtoTychoState>, tokens: Vec<SrzToken>, query: PairQuery) -> PairSimulatedOrderbook {
    log::info!("Got {} pools to compute for pair: '{}'", datapools.len(), query.tag);
    let mut pools = Vec::new();
    let mut prices0to1 = vec![];
    let mut prices1to0 = vec![];
    // let mut balance0 = vec![];
    // let mut balance1 = vec![];
    for pdata in datapools.clone() {
        log::info!("Preparing pool: {} | Type: {}", pdata.component.id, pdata.component.protocol_type_name);
        // if pdata.component.protocol_type_name.to_lowercase() == "uniswap_v4_pool" {
        //     // || pdata.component.protocol_type_name.to_lowercase() == "balancer_v2_pool" {
        //     log::info!("Skipping pool {} because it's {}", pdata.component.id, pdata.component.protocol_type_name.to_lowercase());
        //     continue;
        // }
        pools.push(pdata.clone());
        let srzt0 = tokens[0].clone();
        let srzt1 = tokens[1].clone();
        let t0 = Token::from(srzt0.clone());
        let t1 = Token::from(srzt1.clone());
        let (base, quote) = if query.z0to1 { (t0, t1) } else { (t1, t0) };
        let proto = pdata.protosim.clone();
        let price0to1 = proto.spot_price(&base, &quote).unwrap_or_default();
        let price1to0 = proto.spot_price(&base, &quote).unwrap_or_default();
        prices0to1.push(proto.spot_price(&base, &quote).unwrap_or_default());
        prices1to0.push(proto.spot_price(&quote, &base).unwrap_or_default());
        // let poolb0 = fetchbal(&provider, srzt0.address.to_string(), pdata.component.id.clone()).await;
        // let poolb1 = fetchbal(&provider, srzt1.address.to_string(), pdata.component.id.clone()).await;
        log::info!("Spot price for {}-{} => price0to1 = {} and price1to0 = {}", base.symbol, quote.symbol, price0to1, price1to0);
        log::info!("\n");
    }

    let cps: Vec<SrzProtocolComponent> = pools.clone().iter().map(|p| p.component.clone()).collect();
    let aggregated = shd::maths::steps::deepth(cps.clone(), tokens.clone(), balances.clone());
    let avgp0to1 = prices0to1.iter().sum::<f64>() / prices0to1.len() as f64;
    let avgp1to0 = prices1to0.iter().sum::<f64>() / prices1to0.len() as f64; // Ponderation by TVL ?
    log::info!("Average price 0to1: {} | Average price 1to0: {}", avgp0to1, avgp1to0);
    let pso = optimization(network.clone(), pools.clone(), tokens, query.clone(), aggregated.clone(), avgp0to1, avgp1to0).await;
    log::info!("Optimization done for pair: '{}'", query.tag);

    pso
}

/**
 * A very simple gradient-based optimizer that uses fixed iterations (100 max) and
 * moves a fixed fraction (10%) of the allocation from the pool with the lowest marginal
 * return to the one with the highest.
 * All arithmetic is done with BigUint.
 */
pub fn optimizer(
    input: f64, // human–readable input (e.g. 100 meaning 100 ETH)
    pools: &Vec<ProtoTychoState>,
    _balances: &HashMap<String, u128>,
    token_in: SrzToken,
    token_out: SrzToken,
) -> TradeResult {
    // let max_inputs_per_pool: Vec<u128> = pools
    //     .iter()
    //     .map(|p| {
    //         let token = p.component.tokens.iter().find(|t| t.address.to_lowercase() == token_in.address.to_lowercase()).unwrap();
    //         balances.get(&token.address.to_lowercase()).unwrap() * 25 / 100
    //     })
    //     .collect();

    // Convert tokens to tycho-simulation tokens
    let token_in = Token::from(token_in.clone());
    let token_out = Token::from(token_out.clone());
    let inputpow = input * 10f64.powi(token_in.decimals as i32).round(); // ?

    let inputpow = BigUint::from(inputpow as u128);
    let size = pools.len();
    let sizebg = BigUint::from(size as u32);
    let mut allocations: Vec<BigUint> = vec![&inputpow / &sizebg; size]; // Which is naive I guess

    // @notice epsilon is key here. It tells us the marginal benefit of giving a little more to that pool. The smaller epsilon is, the more accurately we capture that local behavior
    let epsilon = &inputpow / BigUint::from(10_000u32); // Choose a fixed epsilon for finite difference. May 1e9 is better, IDK.
    let max_iterations = 100u32; // We'll run a maximum of 100 iterations.
    let tolerance = BigUint::zero(); // Tolerance: if the difference between max and min marginal is zero.
    for iter in 0..max_iterations {
        // Compute marginal returns for each pool as: f(x+epsilon) - f(x).
        let mut marginals: Vec<BigUint> = Vec::with_capacity(size);
        // If the difference between the best and worst marginal return becomes zero (or falls below a tiny tolerance),
        // then the algorithm stops early because it has “converged” on an allocation where no pool can provide a better extra return than any other.
        for (i, pool) in pools.iter().enumerate() {
            let current_alloc = allocations[i].clone();
            // log::info!("Current allocation for pool {}: {} | TokenIn {} TokenOut {}", i, current_alloc, token_in.address, token_out.address.clone());
            let result_got = pool.protosim.get_amount_out(current_alloc.clone(), &token_in, &token_out);
            let amount_got = if result_got.is_err() {
                // log::error!("get_amount_out on pool #{} at {} failed", i, pool.component.id);
                BigUint::ZERO
            } else {
                result_got.unwrap().amount
            };
            let result_esplison_got = pool.protosim.get_amount_out(&current_alloc + &epsilon, &token_in, &token_out);
            let amount_esplison_got = if result_esplison_got.is_err() {
                // log::error!("get_amount_out on pool #{} at {} failed", i, pool.component.id);
                BigUint::ZERO
            } else {
                result_esplison_got.unwrap().amount
            };
            let marginal = if amount_esplison_got > amount_got { &amount_esplison_got - &amount_got } else { BigUint::zero() };
            marginals.push(marginal);
        }
        // Identify pools with maximum and minimum marginals.
        let (max, max_marginal) = marginals.iter().enumerate().max_by(|a, b| a.1.cmp(b.1)).unwrap();
        let (mini, min_marginal) = marginals.iter().enumerate().min_by(|a, b| a.1.cmp(b.1)).unwrap();
        // If difference is zero (or below tolerance), stop.
        if max_marginal.clone() - min_marginal.clone() <= tolerance {
            log::info!("Converged after {} iterations", iter);
            break; // ? If I'm correct in theory it will never converge, unless we take a very small epsilon that would make no difference = convergence
        }
        // Reallocate 10% of the allocation from the pool with the lowest marginal.
        // => Moving a fixed fraction (10%) of the allocation from the worst-performing pool to the best-performing one
        // Too high a percentage might cause the allocation to swing too quickly, overshooting the optimal balance.
        // Too low a percentage would make convergence very slow.
        let fraction = BigUint::from(10u32);
        let adjusted = &allocations[mini] / &fraction;
        allocations[mini] = &allocations[mini] - &adjusted;
        allocations[max] = &allocations[max] + &adjusted;
        // Once the iterations finish, the optimizer:
        // - Computes the total output by summing the outputs from all pools using the final allocations.
        // - Calculates the percentage of the total input that was allocated to each pool.
        // log::info!("Iteration {}: Pool {} marginal = {} , Pool {} marginal = {}, transfer = {}", iter, max, max_marginal, mini, min_marginal, adjusted);
    }

    // ------- Compute total output (raw) and distribution -------
    let mut total_output_raw = BigUint::zero();
    let mut distribution: Vec<f64> = Vec::with_capacity(size);
    for (i, pool) in pools.iter().enumerate() {
        let alloc = allocations[i].clone();
        let result = pool.protosim.get_amount_out(alloc.clone(), &token_in, &token_out).unwrap();
        let output = result.amount;
        let gas = result.gas;
        // log::info!("Pool {} | Input: {} | Output: {} | Gas: {}", i, alloc, output, gas);
        total_output_raw += &output;
        let percent = (alloc.to_string().parse::<f64>().unwrap() * 100.0f64) / inputpow.to_string().parse::<f64>().unwrap(); // Distribution percentage (integer percentage).
        distribution.push((percent * 1000.).round() / 1000.); // Round to 3 decimal places.
    }
    let token_in_multiplier = 10f64.powi(token_in.decimals as i32);
    let token_out_multiplier = 10f64.powi(token_out.decimals as i32);
    let output = total_output_raw.to_string().parse::<f64>().unwrap() / token_out_multiplier; // Convert raw output to human–readable (divide by token_out multiplier).
    let ratio = ((total_output_raw.to_string().parse::<f64>().unwrap() * token_in_multiplier) / inputpow.to_string().parse::<f64>().unwrap()) / token_out_multiplier; // Compute unit price (as integer ratio of raw outputs times token multipliers).
    TradeResult {
        input: input.to_string().parse().unwrap(),
        output: output.to_string().parse().unwrap(),
        distribution: distribution.clone(),
        ratio: ratio.to_string().parse().unwrap(),
    }
}

/**
 * Optimizes a trade for a given pair of tokens and a set of pools.
 * The function generates a set of test amounts for ETH and USDC, then runs the optimizer for each amount.
 * The optimizer uses a simple gradient-based approach to move a fixed fraction of the allocation from the pool with the lowest marginal return to the one with the highest.
 * ToDo: AmountIn must now be greater than the component balance, or let's say 50% of it, because it don't make sense to impact more than 50% of the pool, even some % it worsens the price
 * ToDo: Top n pooL most liquid only, remove the too small liquidity pools
 */
pub async fn optimization(network: Network, pcsdata: Vec<ProtoTychoState>, tokens: Vec<SrzToken>, query: PairQuery, balances: HashMap<String, u128>, price0to1: f64, price1to0: f64) -> PairSimulatedOrderbook {
    log::info!("Network: {} | Got {} pools to optimize for pair: '{}'", network.name, pcsdata.len(), query.tag);
    let t0 = tokens[0].clone();
    let t1 = tokens[1].clone();
    let mut pools = Vec::new();
    for pcdata in pcsdata.iter() {
        log::info!("pcdata: {} | Type: {}", pcdata.component.id, pcdata.component.protocol_type_name);
        pools.push(pcdata.component.clone());
        for x in pcdata.component.tokens.iter() {
            log::info!("Token: {} => {}", x.symbol, x.address.to_string());
        }
    }

    let t0tb = *balances.iter().find(|x| x.0.clone().to_lowercase() == t0.address.to_lowercase()).unwrap().1;
    let t1tb = *balances.iter().find(|x| x.0.clone().to_lowercase() == t1.address.to_lowercase()).unwrap().1;
    let t0tb_one_mn = t0tb as f64 / ONE_MILLIONTH / 10f64.powi(t0.decimals as i32);
    let t1tb_one_mn = t1tb as f64 / ONE_MILLIONTH / 10f64.powi(t1.decimals as i32);
    log::info!(
        "Aggregated onchain liquidity balance for {} is {} (for 1 millionth => {})",
        t0.address,
        t0tb as f64 / 10f64.powi(t0.decimals as i32),
        t0tb_one_mn
    );
    log::info!(
        "Aggregated onchain liquidity balance for {} is {} (for 1 millionth => {})",
        t1.address,
        t1tb as f64 / 10f64.powi(t1.decimals as i32),
        t1tb_one_mn
    );

    let segments0to1 = shd::maths::steps::gsegments(t0tb_one_mn);
    let steps0to1 = shd::maths::steps::gsteps(PairSimuIncrementConfig { segments: segments0to1.clone() }.segments);
    let mut trades0to1 = Vec::new();
    {
        let total_steps = steps0to1.len() as u64;
        let pb = ProgressBar::new(total_steps);
        pb.set_style(
            ProgressStyle::default_bar()
                .template("{spinner:.green} [{elapsed_precise}] [{bar:40.green/white}] {pos}/{len} ({eta})")
                .unwrap()
                .progress_chars("#>-"),
        );
        for amount in steps0to1.iter() {
            let start = Instant::now();
            let result = optimizer(*amount, &pcsdata, &balances, t0.clone(), t1.clone());
            let elapsed = start.elapsed();
            log::info!(
                "Input: {} {}, Output: {} {} at price1to0: {} | Distribution: {:?}, Time: {:?}",
                result.input,
                t0.symbol,
                result.output,
                t1.symbol,
                result.ratio,
                result.distribution,
                elapsed
            );
            pb.inc(1); // Update the progress bar on each iteration.
            trades0to1.push(result);
        }
    }

    log::info!("🔄  Switching to 1to0");
    let segments1to0 = shd::maths::steps::gsegments(t1tb_one_mn);
    let steps1to0 = shd::maths::steps::gsteps(PairSimuIncrementConfig { segments: segments1to0.clone() }.segments);

    let mut trades1to0 = Vec::new();
    {
        let total_steps = steps0to1.len() as u64;
        let pb = ProgressBar::new(total_steps);
        pb.set_style(
            ProgressStyle::default_bar()
                .template("{spinner:.green} [{elapsed_precise}] [{bar:40.green/white}] {pos}/{len} ({eta})")
                .unwrap()
                .progress_chars("#>-"),
        );

        for amount in steps1to0.iter() {
            let start = Instant::now();
            let result = optimizer(*amount, &pcsdata, &balances, t1.clone(), t0.clone());
            let elapsed = start.elapsed();
            log::info!(
                "Input: {} {}, Output: {} {} at price0to1: {} | Distribution: {:?}, Time: {:?}",
                result.input,
                t1.symbol,
                result.output,
                t0.symbol,
                result.ratio,
                result.distribution,
                elapsed
            );
            pb.inc(1); // Update the progress bar on each iteration.

            trades1to0.push(result);
        }
    }

    PairSimulatedOrderbook {
        from: tokens[0].clone(),
        to: tokens[1].clone(),
        trades0to1: trades0to1.clone(),
        trades1to0: trades1to0.clone(),
        pools: pools.clone(),
    }
}
