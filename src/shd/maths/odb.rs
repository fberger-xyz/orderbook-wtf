
use crate::shd::{
    data::{
        fmt::{SrzEVMPoolState, SrzProtocolComponent, SrzToken, SrzUniswapV2State, SrzUniswapV3State, SrzUniswapV4State},
    },
    maths::{self},
    types::PairQuery,
};

use crate::shd::types::Orderbook;

pub trait ToOrderbook {
    fn orderbook(&self, component: SrzProtocolComponent, tks: Vec<SrzToken>, query: PairQuery, fee: f64, price: f64, poolb0: f64, poolb1: f64) -> Orderbook;
}

// ============================================== NOT CONCENTRATED ==============================================================

impl ToOrderbook for SrzUniswapV2State {
    fn orderbook(&self, component: SrzProtocolComponent, tks: Vec<SrzToken>, query: PairQuery, fee: f64, price: f64, poolb0: f64, poolb1: f64) -> Orderbook {
        Orderbook {
            address: component.id.clone().to_lowercase(),
            protocol: component.protocol_type_name.clone(),
            z0to1: query.z0to1,
            concentrated: false,
            fee,
            price,
            reserves: vec![poolb0, poolb1],
            bids: vec![],
            asks: vec![],
            tick: 0,
            spacing: 0,
        }
    }
}

impl ToOrderbook for SrzEVMPoolState {
    fn orderbook(&self, component: SrzProtocolComponent, tks: Vec<SrzToken>, query: PairQuery, fee: f64, price: f64, poolb0: f64, poolb1: f64) -> Orderbook {
        Orderbook {
            address: component.id.clone().to_lowercase(),
            protocol: component.protocol_type_name.clone(),
            z0to1: query.z0to1,
            concentrated: false,
            fee,
            price,
            reserves: vec![poolb0, poolb1],
            bids: vec![],
            asks: vec![],
            tick: 0,
            spacing: 0,
        }
    }
}

// ============================================== CONCENTRATED ==================================================================

impl ToOrderbook for SrzUniswapV3State {
    fn orderbook(&self, component: SrzProtocolComponent, tks: Vec<SrzToken>, query: PairQuery, fee: f64, price: f64, poolb0: f64, poolb1: f64) -> Orderbook {
        // CCT
        let spacing = self.ticks.tick_spacing as i32;
        maths::ticks::ticks_liquidity(self.liquidity as i128, self.tick, spacing, &self.ticks.clone(), tks[0].clone(), tks[1].clone());
        let tick_data_range = maths::ticks::compute_tick_data(self.tick, self.ticks.tick_spacing as i32);
        // let (p0to1, p1to0) = maths::ticks::tick_to_prices(tick_data_range.tick_lower, tks[0].decimals as u8, tks[1].decimals as u8);
        let (p0to1, p1to0) = maths::ticks::tick_to_prices(self.tick, tks[0].decimals as u8, tks[1].decimals as u8);
        // let (p0to1, p1to0) = maths::ticks::tick_to_prices(tick_data_range.tick_upper, tks[0].decimals as u8, tks[1].decimals as u8);
        log::info!("SrzUniswapV3State: Analysing current tick ...");
        let current_tick_amounts = maths::ticks::derive(
            self.liquidity as i128,
            self.sqrt_price.to_string().parse::<f64>().unwrap(), // At current tick, not the boundaries !
            tick_data_range.tick_lower,
            tick_data_range.tick_upper,
            tks[0].clone(),
            tks[1].clone(),
            true,
        );
        dbg!(current_tick_amounts.clone());
        log::info!("SrzUniswapV3State: Analysing each tick individually ...");
        let mut ticks_list = self.ticks.clone();
        ticks_list.ticks.sort_by(|a, b| a.index.cmp(&b.index));
        let ticks_amounts = maths::ticks::ticks_liquidity(self.liquidity as i128, self.tick, spacing, &ticks_list.clone(), tks[0].clone(), tks[1].clone());
        let (mut bids, asks) = maths::ticks::filter_and_classify_ticks(ticks_amounts, self.tick, tick_data_range.tick_lower, p0to1, p1to0);
        bids.push(current_tick_amounts.clone());
        // Logs bids/asks
        // for bid in bids {
        //     log::info!("Bid: tick#{} => {} {} | {} {} | p0to1 {} and p1to0 {}", bid.index, bid.amount0, tks[0].symbol, bid.amount1, tks[1].symbol, bid.p0to1, bid.p1to0);
        // }
        // for ask in asks {
        //     log::info!("Ask: tick#{} => {} {} | {} {} | p0to1 {} and p1to0 {}", ask.index, ask.amount0, tks[0].symbol, ask.amount1, tks[1].symbol, ask.p0to1, ask.p1to0);
        // }
        Orderbook {
            address: component.id.clone().to_lowercase(),
            protocol: component.protocol_type_name.clone(),
            z0to1: query.z0to1,
            concentrated: true,
            fee,
            price,
            reserves: vec![poolb0, poolb1],
            bids: bids.clone(),
            asks: asks.clone(),
            tick: self.tick,
            spacing: self.ticks.tick_spacing as u64,
        }
    }
}

impl ToOrderbook for SrzUniswapV4State {
    fn orderbook(&self, component: SrzProtocolComponent, tks: Vec<SrzToken>, query: PairQuery, fee: f64, price: f64, poolb0: f64, poolb1: f64) -> Orderbook {
        Orderbook {
            address: component.id.clone().to_lowercase(),
            protocol: component.protocol_type_name.clone(),
            z0to1: query.z0to1,
            concentrated: true,
            fee,
            price,
            reserves: vec![poolb0, poolb1],
            bids: vec![], //bids.clone(),
            asks: vec![], //asks.clone(),
            tick: self.tick,
            spacing: self.ticks.tick_spacing as u64,
        }
    }
}
