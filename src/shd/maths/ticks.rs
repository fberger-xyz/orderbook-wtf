use crate::shd::{
    data::fmt::{SrzTickInfo, SrzTickList, SrzToken},
    r#static::maths::UNISWAP_Q96,
    types::{LiquidityTickDelta, TickDataRange},
};

// The allowed tick indexes range from -887,272 to 887,272
// If the tick index is negative, this corresponds to a price less than 1, since  will be less than 1 if is negative.
// If then the price is 1 (meaning the assets have equal value) because any value raised to 0 is 1.
// If is greater than or equal to 1, then the price will be greater than one.
// The value 1.0001 was chosen because “This has the desirable property of each tick being a .01% (1 basis point) price movement away from each of its neighboring ticks.”
// The “current tick” is the current price rounded down to the nearest tick. If the price increases and crosses a tick, then the tick that was just crossed becomes the current tick. “Crossed” doesn’t require that the priced “passed over” the tick.
// If the price stops on the tick, the tick is considered crossed.

// How decimals affect price
// The tick can be negative due to the difference in decimal places, as ETH has 18 decimals while USDC has only 6 decimals.

// Assuming ETH is worth $1000, the smallest unit of ETH is worth (or ), while the smallest unit of USDC is worth
// So, although we assume that 1 ETH is “worth” more than 1 USDC, considering its smallest unit, 1 smallest unit of USDC is worth more than 1 smallest unit of ETH.

// pub fn compute_tick_data(tick: i32, tick_spacing: i32) -> TickDataRange {
//     let delta = tick % tick_spacing;
//     let below = tick - delta;
//     let above = below + tick_spacing;
//     let sqrt_price_lower = 1.0001_f64.powi(below);
//     let sqrt_price_upper = 1.0001_f64.powi(above);
//     TickDataRange {
//         tick_lower: below,
//         sqrt_price_lower: sqrt_price_lower as u128,
//         tick_upper: above,
//         sqrt_price_upper: sqrt_price_upper as u128,
//     }
// }

pub fn compute_tick_data(tick: i32, tick_spacing: i32) -> TickDataRange {
    // Ensure a nonnegative remainder (works correctly for negative ticks, too)
    let delta = tick.rem_euclid(tick_spacing);
    let below = tick - delta;
    let above = below + tick_spacing;
    // Compute the square-root ratios as 1.0001^(tick/2)
    let sqrt_price_lower_f = 1.0001_f64.powf(below as f64 / 2.0);
    let sqrt_price_upper_f = 1.0001_f64.powf(above as f64 / 2.0);
    // Convert to Q64.96 fixed‑point format:
    let sqrt_price_lower = (sqrt_price_lower_f * (UNISWAP_Q96 as f64)).round() as u128;
    let sqrt_price_upper = (sqrt_price_upper_f * (UNISWAP_Q96 as f64)).round() as u128;
    TickDataRange {
        tick_lower: below,
        sqrt_price_lower,
        tick_upper: above,
        sqrt_price_upper,
    }
}

/**
 * Convert a tick to prices.
 */
pub fn tick_to_prices(tick: i32, decimals_token0: u8, decimals_token1: u8) -> (f64, f64) {
    // Compute the raw price from the tick using Uniswap V3's formula.
    let raw_price = 1.0001_f64.powi(tick);
    // Adjust for token decimals.
    // For example, if token0 is WETH (18) and token1 is USDC (6), then djustment = 10^(18 - 6) = 10^12.
    let adjustment = 10_f64.powi((decimals_token0 as i32) - (decimals_token1 as i32));
    // Compute price0to1 as defined:
    let price0to1 = 1.0 / (raw_price * adjustment);
    // The reciprocal gives price1to0
    let price1to0 = 1.0 / price0to1;
    // log::info!("tick_to_prices: computing prices at tick: {} => p0to1 = {} and p1to0 {}", tick, price0to1, price1to0);
    (price0to1, price1to0)
}

/**
 * Find the current tick in a list of ticks
 * The tick value don't necessarily match a tick index, we just search the tick on the good range, based on tick_spacing
 */

pub fn find_current_tick(list: SrzTickList, target: i32) -> Option<SrzTickInfo> {
    list.ticks.iter().find(|tick| target >= tick.index && target < tick.index + list.tick_spacing as i32).cloned()
}

// pub fn find_current_and_next_tick(list: SrzTickList, target: i32) -> (SrzTickInfo, SrzTickInfo) {
//     // sort max by
//     let mut dup = list.ticks.clone();
//     dup.sort_by(|a, b| a.index.cmp(&b.index));

//     println!("Searching for tick {} on a list of {} ticks", target, list.ticks.len());
//     let pos = dup.iter().position(|tick| target >= tick.index && target < tick.index + list.tick_spacing as i32).unwrap();
//     let current = list.ticks[pos].clone();
//     let next = list.ticks.get(pos + 1).cloned().unwrap();
//     (current, next)
// }

/// Computes the tick corresponding to a given sqrtPriceX96.
/// The tick is calculated by:
///     tick = floor( ln((sqrtPriceX96 / Q96)^2) / ln(1.0001) )
///
/// Here, sqrt_price_x96 is passed as an f64.
/// Returns the tick corresponding to a given sqrtPriceX96 (in Q64.96 fixed‑point).
/// tick = floor( ln((sqrtPriceX96 / Q96)^2) / ln(1.0001) )
fn get_tick_at_sqrt_price(sqrt_price_x96: u128) -> i32 {
    let sqrt_price = sqrt_price_x96 as f64 / UNISWAP_Q96 as f64;
    let tick = ((sqrt_price * sqrt_price).ln() / 1.0001_f64.ln()).floor();
    tick as i32
}
/// Computes the cumulative liquidity at a given target tick, starting from the active liquidity at the current tick.
///
/// # Arguments
/// - `active_liquidity`: The liquidity currently active at the pool’s current tick.
/// - `current_tick`: The current tick (the tick in which the price currently lies).
/// - `target_tick`: The tick at which you want to know the liquidity.
/// - `tick_list`: A list of ticks (with their net liquidity delta) for the pool.
///
/// # Returns
/// The liquidity that would be active if the price moved to `target_tick`.
pub fn compute_cumulative_liquidity(active_liquidity: i128, current_tick: i32, target_tick: i32, tick_list: &SrzTickList) -> i128 {
    let mut liquidity = active_liquidity;

    if target_tick > current_tick {
        // When moving upward (price increasing): add the net liquidity from ticks above current_tick
        for tick_info in tick_list.ticks.iter() {
            if tick_info.index > current_tick && tick_info.index <= target_tick {
                liquidity += tick_info.net_liquidity;
            }
        }
    } else if target_tick < current_tick {
        // When moving downward (price decreasing): subtract the net liquidity from ticks below current_tick
        // (Alternatively, add the negative net liquidity values.)
        for tick_info in tick_list.ticks.iter() {
            if tick_info.index <= current_tick && tick_info.index > target_tick {
                liquidity -= tick_info.net_liquidity;
            }
        }
    }
    // If target_tick == current_tick, liquidity remains the active liquidity.
    // log::info!(" > tick # {:<7} | Cumulative liquidity at tick # {:<7} = {:<15}", current_tick, target_tick, liquidity);
    liquidity
}
/// Computes the amounts of token0 and token1 given:
/// - `liquidity`: The pool liquidity (which can be negative, representing removed liquidity).
/// - `sqrt_price_x96`: The current square-root price scaled by Q96, provided as an f64.
/// - `tick_low` and `tick_high`: The lower and upper tick bounds defining the price range.
/// - `t0` and `t1`: Token metadata (symbol and decimals).
///
/// The math follows:
///  - If the current tick is below tick_low: all liquidity is considered as token0.
///    amount0 = floor(liquidity * ((sqrtRatioB - sqrtRatioA) / (sqrtRatioA * sqrtRatioB)))
///  - If the current tick is above or equal tick_high: all liquidity is in token1.
///    amount1 = floor(liquidity * (sqrtRatioB - sqrtRatioA))
///  - Otherwise (current tick in range), liquidity is split:
///    amount0 = floor(liquidity * ((sqrtRatioB - sqrtPrice) / (sqrtPrice * sqrtRatioB)))
///    amount1 = floor(liquidity * (sqrtPrice - sqrtRatioA))
///
/// Negative liquidity (and thus negative amounts) indicate removed liquidity.
/// Computes token amounts (in human-readable units) from liquidity given the current √price and tick range.
///
/// **Important:** Use the actual current sqrt_price_x96 (from pool state), not one computed from a tick boundary.
pub fn get_token_amounts(
    liquidity: i128,
    sqrt_price_x96: f64, // current √price in Q64.96, as f64 (from pool state)
    tick_low: i32,
    tick_high: i32,
    t0: SrzToken,
    t1: SrzToken,
) -> LiquidityTickDelta {
    // Log input for debugging.
    println!(
        "[INPUT] tick_low: {} liquidity: {} sqrt_price_x96: {} tick_low: {} tick_high: {}",
        tick_low, liquidity, sqrt_price_x96, tick_low, tick_high
    );

    // Compute sqrt ratios at the boundaries.
    // Uniswap V3 defines: sqrtRatio = 1.0001^(tick/2)
    let sqrt_ratio_a = 1.0001_f64.powf(tick_low as f64 / 2.0);
    let sqrt_ratio_b = 1.0001_f64.powf(tick_high as f64 / 2.0);

    // Determine the current tick from the actual pool sqrt price.
    let current_tick = get_tick_at_sqrt_price((sqrt_price_x96 * (UNISWAP_Q96 as f64)) as u128);
    // Convert the current sqrt price to a fraction (divide by Q96).
    let sqrt_price = sqrt_price_x96 / (UNISWAP_Q96 as f64);

    let (mut amount0, mut amount1) = (0_f64, 0_f64);
    if current_tick < tick_low {
        // Price is below the range: all liquidity is token0.
        amount0 = (liquidity as f64 * ((sqrt_ratio_b - sqrt_ratio_a) / (sqrt_ratio_a * sqrt_ratio_b))).floor();
    } else if current_tick >= tick_high {
        // Price is above the range: all liquidity is token1.
        amount1 = (liquidity as f64 * (sqrt_ratio_b - sqrt_ratio_a)).floor();
    } else {
        // Price is within the range: liquidity is split.
        amount0 = (liquidity as f64 * ((sqrt_ratio_b - sqrt_price) / (sqrt_price * sqrt_ratio_b))).floor();
        amount1 = (liquidity as f64 * (sqrt_price - sqrt_ratio_a)).floor();
    }

    // Convert amounts from smallest units to human-readable values.
    let amount0_human = amount0 / 10_f64.powi(t0.decimals as i32);
    let amount1_human = amount1 / 10_f64.powi(t1.decimals as i32);

    println!(
        "[OUTPUT] current_tick: {} liquidity: {} | {}: {:.6} | {}: {:.6}",
        current_tick, liquidity, t0.symbol, amount0_human, t1.symbol, amount1_human
    );

    LiquidityTickDelta {
        index: tick_low,
        amount0: amount0_human,
        amount1: amount1_human,
    }
}
