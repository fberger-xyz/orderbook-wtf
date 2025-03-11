// fn main() {
//     // Example reserves (u128) and decimals for each token
//     let reserve0: u128 = 1_000_000_000_000; // e.g., token0 reserve
//     let reserve1: u128 = 500_000_000_000;   // e.g., token1 reserve

//     let decimals0: u32 = 18; // token0 decimals
//     let decimals1: u32 = 6;  // token1 decimals

//     // Convert u128 to f64 for arithmetic (note: this can lose precision if numbers are very large)
//     let r0 = reserve0 as f64;
//     let r1 = reserve1 as f64;

//     // Calculate multipliers for decimals
//     let multiplier0 = 10f64.powi(decimals0 as i32);
//     let multiplier1 = 10f64.powi(decimals1 as i32);

//     // Compute prices
//     let price0_to_1 = (r1 * multiplier0) / (r0 * multiplier1);
//     let price1_to_0 = (r0 * multiplier1) / (r1 * multiplier0);

//     println!("Price of token0 in terms of token1: {}", price0_to_1);
//     println!("Price of token1 in terms of token0: {}", price1_to_0);
// }
