use std::collections::HashMap;

use num_bigint::BigUint;

use crate::shd::{
    data::fmt::{SrzProtocolComponent, SrzToken},
    r#static::maths::ONE_PERCENT_IN_MN,
    types::{IncrementationSegment, PairSimuIncrementConfig},
};

pub struct OnChainLiquidity {
    pub tokens: Vec<String>,
    pub total: Vec<u128>,
    pub splits: Vec<(String, f64)>, // Component ID -> % of total
}

/**
 * Sum the total liquidity of a pair of tokens.
 * @dev components Every similar components (= matching a pair)
 */
pub fn deepth(components: Vec<SrzProtocolComponent>, targets: Vec<SrzToken>, data: HashMap<String, HashMap<String, u128>>) -> HashMap<String, u128> {
    let mut cumulated = HashMap::new();
    targets.iter().for_each(|t| {
        cumulated.insert(t.clone().address.to_lowercase(), 0);
    });
    // Every component containing 'tokens'
    for cp in components.clone().iter() {
        if let Some(balances) = data.get(&cp.id) {
            for tk in targets.iter() {
                if let Some(balance) = balances.get(tk.address.to_lowercase().as_str()) {
                    log::info!("Component {} has {} of token {}", cp.id, balance, tk.symbol);
                    let c = cumulated.get(tk.address.to_lowercase().as_str()).unwrap();
                    let new = c + balance;
                    cumulated.insert(tk.clone().address, new);
                }
            }
        }
    }
    cumulated
}

/**
 * Generates a vector of f64 steps from a vector of IncrementationSegment.
 */
pub fn gsteps(segments: Vec<IncrementationSegment>) -> Vec<f64> {
    let mut result: Vec<f64> = Vec::new();
    for seg in segments {
        let mut x = seg.start;
        if result.last().is_none_or(|&last| (x - last).abs() > f64::EPSILON) {
            result.push(x);
        }
        while x < seg.end {
            x += seg.step;
            if x > seg.end {
                x = seg.end;
            }
            if result.last().is_none_or(|&last| x > last) {
                result.push(x);
            }
        }
    }
    result
}

// Generate simulation input amounts for token0 and token1.
// The bigger is the amountIn, the longer the optimization will take.
// (1 bps = 100/1_000_000 = 100 millionths)
// From 0.001% to 0.1% (10 bps) in 50 points = (10 bp = 1000 millionths)
// From 0.1% to 1% (90 bps) in 50 points = 1 point per 2 bps
// From 1% to 5% (400 bps) in 50 points = 1 point per 8 bps
// From 5% to 25% (2000 bps) in 50 points = 1 point per 40 bps

// IncrementationSegment { start: 1., end: 100., step: 1. },         // Step is 20 millionths
// IncrementationSegment { start: 1., end: 100., step: 1. },         // Step is 200 millionths
// IncrementationSegment { start: 101., end: 1000., step: 50. },     // Step is 800 millionths
// IncrementationSegment { start: 1001., end: 10_000., step: 250. }, // Step is 4000 millionths

/// @notice tb_one_mn = one_millionth_of_total_balance
pub fn gsegments(tb_one_mn: f64) -> Vec<IncrementationSegment> {
    let mut segments = vec![];
    let s1 = IncrementationSegment {
        start: tb_one_mn * 1.,
        end: tb_one_mn * 1000.,
        step: tb_one_mn * 20.,
    }; // Step is 20 millionths for 50 steps
    let s2 = IncrementationSegment {
        start: tb_one_mn * 1000.,
        end: tb_one_mn * ONE_PERCENT_IN_MN,
        step: tb_one_mn * 200.,
    };
    let s3 = IncrementationSegment {
        start: tb_one_mn * ONE_PERCENT_IN_MN,
        end: tb_one_mn * (5. * ONE_PERCENT_IN_MN),
        step: tb_one_mn * 1600.,
    };
    segments.push(s1);
    segments.push(s2);
    // segments.push(s3);
    segments
}

/// Generates token pair steps using the provided configuration.
/// Returns a tuple containing:
///   - A vector with the test steps for token0.
///   - A vector with the corresponding test steps for token1 (each scaled by price0to1).
pub fn _generate(config: PairSimuIncrementConfig) -> (Vec<f64>, Vec<f64>) {
    let t0steps = gsteps(config.segments);
    let t1steps = t0steps.iter().map(|&x| x * 1.).collect(); // Multiply or divide ?
    (t0steps, t1steps)
}

/// Converts a slice of f64 steps into a vector of u128 values after applying token decimals.
/// Each step is multiplied by 10^(decimals) and rounded before converting to u128.
pub fn steps_to_u128(steps: Vec<f64>, decimals: u32) -> Vec<u128> {
    let factor = 10u128.pow(decimals);
    steps.iter().map(|&x| (x * (factor as f64)).round() as u128).collect()
}

pub fn steps_to_bg(steps: Vec<f64>, decimals: u32) -> Vec<BigUint> {
    let factor = 10u128.pow(decimals);
    steps
        .iter()
        .map(|&x| {
            let value = (x * (factor as f64)).round() as u128;
            BigUint::from(value)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use crate::shd::types::IncrementationSegment;

    use super::*;

    #[test]
    fn test_steps_strictly_increasing() {
        let segments = vec![
            IncrementationSegment { start: 1.0, end: 10.0, step: 1.0 },
            // Adjacent segment starting exactly where the previous ended.
            IncrementationSegment { start: 10.0, end: 20.0, step: 2.0 },
        ];
        let generated = gsteps(segments);
        for pair in generated.windows(2) {
            assert!(pair[0] < pair[1], "Steps are not strictly increasing: {} vs {}", pair[0], pair[1]);
        }
    }

    #[test]
    fn test_generate_token_pair_steps_ratio() {
        let segments = vec![IncrementationSegment { start: 1.0, end: 50.0, step: 5.0 }];
        let config = PairSimuIncrementConfig { segments };
        let (t0, t1) = _generate(config);
        for (a, b) in t0.iter().zip(t1.iter()) {
            assert!((b - a).abs() < f64::EPSILON, "For token0 {} expected token1 {} but got {}", a, a, b);
        }
    }

    #[test]
    fn test_convert_steps_to_u128() {
        let steps = vec![1.0, 2.5, 3.0];
        let decimals = 6;
        let result = steps_to_u128(steps.clone(), decimals);
        let factor = 10u128.pow(decimals);
        let expected: Vec<u128> = steps.iter().map(|&s| (s * (factor as f64)).round() as u128).collect();
        assert_eq!(result, expected);
    }

    #[test]
    fn test_convert_steps_to_biguint() {
        let steps = vec![1.0, 2.5, 3.0];
        let decimals = 6;
        let result_biguint = steps_to_bg(steps.clone(), decimals);
        let factor = 10u128.pow(decimals);
        let expected: Vec<BigUint> = steps.iter().map(|&s| BigUint::from((s * (factor as f64)).round() as u128)).collect();
        assert_eq!(result_biguint, expected);
    }

    #[test]
    fn test_custom() {
        let segments = vec![
            IncrementationSegment { start: 1., end: 100., step: 1. },
            IncrementationSegment { start: 101., end: 1000., step: 50. },
            IncrementationSegment { start: 1001., end: 10_000., step: 250. },
        ];
        let config = PairSimuIncrementConfig { segments };
        let (steps0to1, steps1to0) = _generate(config);
        for t in steps0to1.iter() {
            println!("t0: Generated step: {}", t);
        }
        for t in steps1to0.iter() {
            println!("t1: Generated step: {}", t);
        }
    }
}
