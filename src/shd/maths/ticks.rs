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
