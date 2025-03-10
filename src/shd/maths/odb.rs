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
    r#static,
    types::{AmmType, Network, PairQuery, PoolComputeData},
};

use crate::shd::types::Orderbook;

use super::ticks::{derive_balances, find_current_and_next_tick};

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
        println!("orderbook-u3");
        let mut o = Orderbook::default();
        o.address = component.id.clone().to_lowercase();
        o.protocol = component.protocol_type_name.clone();
        o.z0to1 = query.z0to1; // ?
        o.concentrated = true;
        o.fee = fee;
        o.price = price;
        // CCT
        let (current, next) = find_current_and_next_tick(self.ticks.clone(), self.tick);
        let sqrt_price = self.sqrt_price.to_string().parse::<u128>().unwrap();
        let sqrt_price_lower = current.sqrt_price.to_string().parse::<u128>().unwrap();
        let sqrt_price_upper = next.sqrt_price.to_string().parse::<u128>().unwrap();
        let (b0, b1) = derive_balances(self.liquidity, sqrt_price, sqrt_price_lower, sqrt_price_upper);
        println!("UniswapV3: {}-{} | {}-{} | {}-{}", self.id, self.liquidity, sqrt_price, sqrt_price_lower, sqrt_price_upper, self.tick);
        println!("UniswapV3: b0: {} | b1: {}", b0, b1);
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
