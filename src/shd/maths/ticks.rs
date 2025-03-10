use crate::shd::data::fmt::{SrzTickInfo, SrzTickList};

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
    (price0to1, price1to0)
}

/**
 * Derive balance of token0 and token1 from a liquidity value
 */
pub fn derive_balances(liquidity: u128, sqrt_price: u128, sqrt_price_lower: u128, sqrt_price_upper: u128) -> (u128, u128) {
    println!("derive_balances");
    // Ensure that the price range is valid (sqrt_price_lower < sqrt_price_upper)
    assert!(sqrt_price_lower < sqrt_price_upper, "Invalid price range");
    if sqrt_price <= sqrt_price_lower {
        // Current price is below the range: all liquidity is in token0.
        // amount0 = liquidity * (sqrt_price_upper - sqrt_price_lower) / (sqrt_price_lower * sqrt_price_upper)
        let amount0 = liquidity.saturating_mul(sqrt_price_upper - sqrt_price_lower) / (sqrt_price_lower.saturating_mul(sqrt_price_upper));
        (amount0, 0)
    } else if sqrt_price >= sqrt_price_upper {
        // Current price is above the range: all liquidity is in token1.
        // amount1 = liquidity * (sqrt_price_upper - sqrt_price_lower)
        let amount1 = liquidity.saturating_mul(sqrt_price_upper - sqrt_price_lower);
        (0, amount1)
    } else {
        // Current price is within the range: liquidity is split between token0 and token1.
        // amount0 = liquidity * (sqrt_price_upper - sqrt_price) / (sqrt_price * sqrt_price_upper)
        // amount1 = liquidity * (sqrt_price - sqrt_price_lower)
        let amount0 = liquidity.saturating_mul(sqrt_price_upper - sqrt_price) / (sqrt_price.saturating_mul(sqrt_price_upper));
        let amount1 = liquidity.saturating_mul(sqrt_price - sqrt_price_lower);
        (amount0, amount1)
    }
}
/**
 * Find the current tick in a list of ticks
 * The tick value don't necessarily match a tick index, we just search the tick on the good range, based on tick_spacing
 */
pub fn find_current_and_next_tick(list: SrzTickList, target: i32) -> (SrzTickInfo, SrzTickInfo) {
    // sort max by
    let mut dup = list.ticks.clone();
    dup.sort_by(|a, b| a.index.cmp(&b.index));

    println!("Searching for tick {} on a list of {} ticks", target, list.ticks.len());
    let pos = dup.iter().position(|tick| target >= tick.index && target < tick.index + list.tick_spacing as i32).unwrap();
    let current = list.ticks[pos].clone();
    let next = list.ticks.get(pos + 1).cloned().unwrap();
    (current, next)
}

// Lowercase
// 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2 ETH Mainnet
// 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 USDC Mainnet
