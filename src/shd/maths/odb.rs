use tycho_simulation::{
    evm::{
        engine_db::tycho_db::PreCachedDB,
        protocol::{uniswap_v2::state::UniswapV2State, uniswap_v3::state::UniswapV3State, uniswap_v4::state::UniswapV4State, vm::state::EVMPoolState},
    },
    protocol::state::ProtocolSim,
};

use crate::shd::{
    data::{
        self,
        fmt::{SrzEVMPoolState, SrzProtocolComponent, SrzToken, SrzUniswapV2State, SrzUniswapV3State, SrzUniswapV4State},
    },
    maths::{self},
    r#static,
    types::{AmmType, LiquidityTickDelta, Network, PairQuery, PoolComputeData, SummedLiquidity},
};

use crate::shd::types::Orderbook;

use super::ticks::find_current_tick;

pub trait ToOrderbook {
    fn orderbook(&self, component: SrzProtocolComponent, tks: Vec<SrzToken>, query: PairQuery, fee: f64, price: f64) -> Orderbook;
}

// ============================================== NOT CONCENTRATED ==============================================================

impl ToOrderbook for SrzUniswapV2State {
    fn orderbook(&self, component: SrzProtocolComponent, _tks: Vec<SrzToken>, query: PairQuery, fee: f64, price: f64) -> Orderbook {
        let mut o = Orderbook::default();
        o.address = component.id.clone().to_lowercase();
        o.protocol = component.protocol_type_name.clone();
        o.z0to1 = query.z0to1; // ?
        o.concentrated = false;
        o.fee = fee;
        o.price = price;
        o.reserves = vec![self.reserve0.clone() as u128, self.reserve1.clone() as u128];
        o.bids = vec![];
        o.asks = vec![];
        o
    }
}

impl ToOrderbook for SrzEVMPoolState {
    fn orderbook(&self, component: SrzProtocolComponent, tks: Vec<SrzToken>, query: PairQuery, fee: f64, price: f64) -> Orderbook {
        let mut o = Orderbook::default();
        let t0 = tks.get(0).unwrap();
        let t1 = tks.get(1).unwrap();
        let b0 = self.balances.get(t0.address.to_lowercase().as_str()).unwrap().to_string().parse::<u128>().unwrap();
        let b1 = self.balances.get(t1.address.to_lowercase().as_str()).unwrap().to_string().parse::<u128>().unwrap();
        o.address = component.id.clone().to_lowercase();
        o.protocol = component.protocol_type_name.clone();
        o.z0to1 = query.z0to1; // ?
        o.concentrated = false;
        o.fee = fee;
        o.price = price;
        o.reserves = vec![b0, b1];
        o.bids = vec![];
        o.asks = vec![];
        o
    }
}

// ============================================== CONCENTRATED ==================================================================

impl ToOrderbook for SrzUniswapV3State {
    fn orderbook(&self, component: SrzProtocolComponent, tks: Vec<SrzToken>, query: PairQuery, fee: f64, price: f64) -> Orderbook {
        let mut o = Orderbook::default();
        o.address = component.id.clone().to_lowercase();
        o.protocol = component.protocol_type_name.clone();
        o.z0to1 = query.z0to1; // ?
        o.concentrated = true;
        o.fee = fee;
        o.price = price;
        // CCT
        let spacing = self.ticks.tick_spacing as i32;
        let tick_data_range = maths::ticks::compute_tick_data(self.tick, self.ticks.tick_spacing as i32);
        log::info!("tick_data_range: {:?}", tick_data_range);
        let (p0to1, p1to0) = maths::ticks::tick_to_prices(tick_data_range.tick_lower, tks[0].decimals as u8, tks[1].decimals as u8);
        let (p0to1, p1to0) = maths::ticks::tick_to_prices(self.tick, tks[0].decimals as u8, tks[1].decimals as u8);
        let (p0to1, p1to0) = maths::ticks::tick_to_prices(tick_data_range.tick_upper, tks[0].decimals as u8, tks[1].decimals as u8);

        // Keep, for current active tick.
        log::info!("Analysing current tick ...");
        let delta = maths::ticks::get_token_amounts(
            self.liquidity as i128,
            self.sqrt_price.to_string().parse::<f64>().unwrap(), // At current tick, not the boundaries !
            tick_data_range.tick_lower,
            tick_data_range.tick_upper,
            tks[0].clone(),
            tks[1].clone(),
        );

        log::info!("PooL: {} => current_tick: {:?}", o.address, delta);

        log::info!("Analysing each tick individually ...");

        let mut aggdelta = vec![];

        let mut sorted_ticks = self.ticks.ticks.clone();
        sorted_ticks.sort_by(|a, b| a.index.cmp(&b.index));
        for t in sorted_ticks.clone() {
            let tdr = maths::ticks::compute_tick_data(t.index, spacing);
            if tdr.tick_upper == 0 || tdr.tick_lower == 0 || tdr.tick_lower >= 887160 || tdr.tick_lower <= -887160 {
                log::info!("Skipping tick: {}", tdr.tick_lower);
                continue;
            }
            let d1 = self.tick - t.index;
            let d2 = t.index - self.tick;
            if d1.abs() < (5 * spacing) && d2.abs() < (5 * spacing) {
                let liq = maths::ticks::compute_cumulative_liquidity(self.liquidity as i128, self.tick, t.index, &self.ticks.clone());
                let delta = maths::ticks::get_token_amounts(
                    // t.net_liquidity,
                    liq,
                    self.sqrt_price.to_string().parse::<f64>().unwrap(), //t.sqrt_price.to_string().parse::<f64>().unwrap(),
                    tdr.tick_lower,
                    tdr.tick_upper,
                    tks[0].clone(),
                    tks[1].clone(),
                );
                aggdelta.push(delta.clone());
            }
        }

        // remove first and last
        // aggdelta.remove(0);
        // aggdelta.pop();
        // top1 tick
        let mut top_amount0 = LiquidityTickDelta::default();
        let mut top_amount1 = LiquidityTickDelta::default();

        for d in aggdelta.iter() {
            let tick = d.index;
            if d.amount0 > top_amount0.amount0 {
                top_amount0.amount0 = d.amount0;
                top_amount0.amount1 = d.amount1;
                top_amount0.index = tick;
            }
            if d.amount1 > top_amount1.amount1 {
                top_amount1.amount0 = d.amount0;
                top_amount1.amount1 = d.amount1;
                top_amount1.index = tick;
            }
        }
        log::info!("PooL: {} => top_amount0: {:?}", o.address, top_amount0);
        log::info!("PooL: {} => top_amount1: {:?}", o.address, top_amount1);

        let mut summed = SummedLiquidity::default();
        summed.amount0 = aggdelta.iter().map(|x| if x.amount0 > 0. { x.amount0 } else { 0. }).sum();
        summed.amount1 = aggdelta.iter().map(|x| if x.amount1 > 0. { x.amount1 } else { 0. }).sum();
        log::info!("Summed liquidity: {:?}", summed);

        // for t in self.ticks.ticks {
        //     let tdr = maths::ticks::compute_tick_data(t.index, spacing);
        // }

        // let (current, next) = find_current_and_next_tick(self.ticks.clone(), self.tick);
        // let sqrt_price = self.sqrt_price.to_string().parse::<u128>().unwrap();
        // let sqrt_price_lower = current.sqrt_price.to_string().parse::<u128>().unwrap();
        // let sqrt_price_upper = next.sqrt_price.to_string().parse::<u128>().unwrap();
        // let (b0, b1) = derive_balances(self.liquidity, sqrt_price, sqrt_price_lower, sqrt_price_upper);
        // println!("UniswapV3: {}-{} | {}-{} | {}-{}", self.id, self.liquidity, sqrt_price, sqrt_price_lower, sqrt_price_upper, self.tick);
        // println!("UniswapV3: b0: {} | b1: {}", b0, b1);
        o.reserves = vec![0, 0]; // self.reserve0.clone() as u128, self.reserve1.clone() as u128]; // ? Or use balanceOf
        o.bids = vec![];
        o.asks = vec![];
        o
    }
}

impl ToOrderbook for SrzUniswapV4State {
    fn orderbook(&self, component: SrzProtocolComponent, tks: Vec<SrzToken>, query: PairQuery, fee: f64, price: f64) -> Orderbook {
        let mut o = Orderbook::default();
        o.address = component.id.clone().to_lowercase();
        o.protocol = component.protocol_type_name.clone();
        o.concentrated = true;
        o.z0to1 = query.z0to1; // ?
        o.fee = fee;
        o.price = price;
        // CCT
        o.reserves = vec![0, 0]; // self.reserve0.clone() as u128, self.reserve1.clone() as u128]; // ? Or use balanceOf
        o.bids = vec![];
        o.asks = vec![];
        o
    }
}
