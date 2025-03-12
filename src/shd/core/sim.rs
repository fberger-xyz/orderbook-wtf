use alloy::providers::ProviderBuilder;
use chrono::Duration;
use num_bigint::BigUint;
use num_traits::{One, Pow, Zero};
use std::{cmp, time::Instant};
use tycho_simulation::{
    evm::{
        engine_db::tycho_db::PreCachedDB,
        protocol::{uniswap_v2::state::UniswapV2State, uniswap_v3::state::UniswapV3State, uniswap_v4::state::UniswapV4State, vm::state::EVMPoolState},
    },
    models::Token,
    protocol::state::ProtocolSim,
};

use crate::shd::{
    data::fmt::{SrzProtocolComponent, SrzToken},
    types::{Network, PairQuery, PairSimulatedOrderbook, PoolComputeData, TradeResult},
};

/// Returns the multiplier for a given token as a BigUint.
/// For "weth" (18 decimals) returns 10^18, for "usdc" (6 decimals) returns 10^6.
fn get_multiplier_bg(token: &SrzToken) -> BigUint {
    match token.symbol.to_lowercase().as_str() {
        "weth" => BigUint::from(10u32).pow(18u32),
        "usdc" => BigUint::from(10u32).pow(6u32),
        _ => BigUint::one(),
    }
}

/**
 * A very simple gradient-based optimizer that uses fixed iterations (100 max) and
 * moves a fixed fraction (10%) of the allocation from the pool with the lowest marginal
 * return to the one with the highest.
 * All arithmetic is done with BigUint.
 */
pub fn optimize(
    total_input: BigUint, // human–readable input (e.g. 100 meaning 100 ETH)
    pools: &Vec<PoolComputeData>,
    token_in: SrzToken,
    token_out: SrzToken,
) -> TradeResult {
    // Convert tokens to simulation tokens.
    let sim_token_in = Token::from(token_in.clone());
    let sim_token_out = Token::from(token_out.clone());
    let token_in_multiplier = get_multiplier_bg(&token_in);
    let token_out_multiplier = get_multiplier_bg(&token_out);
    // log::info!("Token in multiplier: {}, Token out multiplier: {}", token_in_multiplier, token_out_multiplier);
    let inputraw = &total_input * &token_in_multiplier;
    let size = pools.len();
    let sizebg = BigUint::from(size as u32);
    let mut allocations: Vec<BigUint> = vec![&inputraw / &sizebg; size]; // Which is naive I guess

    // @notice epsilon is key here. It tells us the marginal benefit of giving a little more to that pool. The smaller epsilon is, the more accurately we capture that local behavior
    let epsilon = &inputraw / BigUint::from(10_000u32); // Choose a fixed epsilon for finite difference. May 1e9 is better, IDK.
    let max_iterations = 100u32; // We'll run a maximum of 100 iterations.
    let tolerance = BigUint::zero(); // Tolerance: if the difference between max and min marginal is zero.
    for iter in 0..max_iterations {
        // Compute marginal returns for each pool as: f(x+epsilon) - f(x).
        let mut marginals: Vec<BigUint> = Vec::with_capacity(size);
        // If the difference between the best and worst marginal return becomes zero (or falls below a tiny tolerance),
        // then the algorithm stops early because it has “converged” on an allocation where no pool can provide a better extra return than any other.
        for (i, pool) in pools.iter().enumerate() {
            let current_alloc = allocations[i].clone();
            let got = pool.protosim.get_amount_out(current_alloc.clone(), &sim_token_in, &sim_token_out).unwrap().amount;
            let espgot = pool.protosim.get_amount_out(&current_alloc + &epsilon, &sim_token_in, &sim_token_out).unwrap().amount;
            let marginal = if espgot > got { &espgot - &got } else { BigUint::zero() };
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
    // Compute total output (raw) and distribution.
    let mut total_output_raw = BigUint::zero();
    let mut distribution: Vec<BigUint> = Vec::with_capacity(size);
    for (i, pool) in pools.iter().enumerate() {
        let alloc = allocations[i].clone();
        let output = pool.protosim.get_amount_out(alloc.clone(), &sim_token_in, &sim_token_out).unwrap().amount;
        total_output_raw += &output;
        let percent = (&alloc * BigUint::from(100u32)) / &inputraw; // Distribution percentage (integer percentage).
        distribution.push(percent);
    }
    let output = &total_output_raw / &token_out_multiplier; // Convert raw output to human–readable (divide by token_out multiplier).
    let ratio = ((&total_output_raw * &token_in_multiplier) / &inputraw) / &token_out_multiplier; // Compute unit price (as integer ratio of raw outputs times token multipliers).
    TradeResult {
        input: total_input.to_string().parse().unwrap(),
        output: output.to_string().parse().unwrap(),
        distribution: distribution.iter().map(|x| x.to_string().parse().unwrap()).collect(),
        ratio: ratio.to_string().parse().unwrap(),
    }
}

/**
 * Optimizes a trade for a given pair of tokens and a set of pools.
 * The function generates a set of test amounts for ETH and USDC, then runs the optimizer for each amount.
 * The optimizer uses a simple gradient-based approach to move a fixed fraction of the allocation from the pool with the lowest marginal return to the one with the highest.
 */
pub async fn optimization(network: Network, pcsdata: Vec<PoolComputeData>, tokens: Vec<SrzToken>, query: PairQuery) -> PairSimulatedOrderbook {
    log::info!("Network: {} | Got {} pools to optimize for pair: '{}'", network.name, pcsdata.len(), query.tag);
    let usdc = tokens[0].clone();
    let weth = tokens[1].clone();
    let mut pools = Vec::new();
    for pcdata in pcsdata.iter() {
        log::info!("pcdata: {} | Type: {}", pcdata.component.id, pcdata.component.protocol_type_name);
        pools.push(SrzProtocolComponent::from(pcdata.component.clone()));
    }
    // Generate test amounts for ETH (human–readable) based on our three segments. Alternatively, for USDC you could use generate_usdc_steps()
    let increments = generate_eth_steps();
    let mut results = Vec::new();
    for amount in increments.iter() {
        let start = Instant::now();
        let result = optimize(amount.clone(), &pcsdata, weth.clone(), usdc.clone());
        let elapsed = start.elapsed();
        log::info!(
            "Input: {} ETH, Output: {} USDC, Unit Price: {} USDC/ETH, Distribution: {:?}, Time: {:?}",
            result.input,
            result.output,
            result.ratio,
            result.distribution,
            elapsed
        );
        results.push(result);
    }
    let res = PairSimulatedOrderbook {
        from: tokens[0].clone(),
        to: tokens[1].clone(),
        trades: results.clone(),
        pools: pools.clone(),
    };

    res
}

/**
 * Generates a set of test amounts for ETH.
 * The amounts are chosen to cover three segments:
 * 1. 1 to 100 by 5.
 * 2. 100 to 1000 by 25.
 * 3. 1000 to 25000 by 500.
 */
fn generate_eth_steps() -> Vec<BigUint> {
    let mut steps = Vec::new();
    // First segment: 1 to 100 by 5.
    let step1 = BigUint::from(1u32);
    let mut x = BigUint::from(1u32);
    while &x < &BigUint::from(100u32) {
        steps.push(x.clone());
        x = &x + &step1;
    }
    steps.push(BigUint::from(100u32));
    // Second segment: 100 to 1000 by 25.
    let step2 = BigUint::from(25u32);
    let mut x = BigUint::from(100u32);
    while &x < &BigUint::from(1000u32) {
        steps.push(x.clone());
        x = &x + &step2;
    }
    steps.push(BigUint::from(1000u32));
    // Third segment: 1000 to 25000 by 500.
    let step3 = BigUint::from(1000u32);
    let mut x = BigUint::from(1000u32);
    while &x < &BigUint::from(25000u32) {
        steps.push(x.clone());
        x = &x + &step3;
    }
    steps.push(BigUint::from(10000u32));

    steps
}

/**
 * Generates a set of test amounts for USDC.
 * By multiplying each ETH step by 2000 (since 1 ETH = 2000 USDC).
 */
fn generate_usdc_steps() -> Vec<BigUint> {
    generate_eth_steps().into_iter().map(|eth_amount| eth_amount * BigUint::from(2000u32)).collect()
}
