# Notes

Tycho is an open-source interface to on-chain liquidity. Tycho
- Indexes DEX protocol state for you with low latency,
- Simulates swaps extremely fast with one interface for all DEXs, and  
- Executes swaps on-chain

### Links

- https://www.erc7815.org/
- https://github.com/propeller-heads/tycho-simulation
- https://docs.propellerheads.xyz/tycho/for-solvers/simulation
- https://docs.propellerheads.xyz/tycho/for-solvers/supported-protocols
- https://www.propellerheads.xyz/blog/amm-liquidity-as-an-orderbook
- https://www.rareskills.io/post/uniswap-v3-concentrated-liquidity
- https://www.lvr.wtf/category
- https://www.rareskills.io/post/uniswap-v3-ticks

### Keep in mind

There are two types of implementations:
- Native protocols are ported to Rust – for faster simulation.
- VM protocols execute the VM bytecode locally – which is easier to integrate but has slower simulation times than a native implementation.


Lower tick spacing allows finer price management, but leads to more on-chain transactions fees
Higher tick spacing means that liquidity is used in wider intervals, reducing the cost of gas.
A highly volatile asset requires a wider tick spacing (e.g. 200) to avoid too frequent liquidity adjustments.
A stablecoin requires a lower tick spacing (e.g. 1) to allow more precise arbitrage.
Tick spacing = 1 for 1 bps pools, 10 for 5 bps, 60 for 30 bps and 200 for 100 bps
The tick closest to the current sqrt price represents the active liquidity range.
When price moves across a tick, the liquidity at that tick is either added or removed from the active liquidity.

You can view tick/fees stuff when creating a pool.
[Here](https://app.uniswap.org/positions/create/v3?currencyA=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&currencyB=0xdAC17F958D2ee523a2206206994597C13D831ec7&chain=ethereum) for example

UniswapV3State {
    liquidity: 7604754235727710538,
    sqrt_price: 1664747471972170483223414323336827,
    fee: Medium,
    tick: 199066,
    ticks: TickList {
        tick_spacing: 60,
        [...]
        TickInfo {
            index: 199020,
            net_liquidity: -76233701736333,
            sqrt_price: 1660840414613703419255027962631956,
        },
        // In this range is the spot price of the pool

        TickInfo {
            index: 199080,
            net_liquidity: 158548481117613,
            sqrt_price: 1665830167260914083394296520001936,
        },
        TickInfo {
            index: 199140,
            net_liquidity: -1955624850397014467,
            sqrt_price: 1670834910891762472170837580010842,
        },
        TickInfo {
            index: 199200,
            net_liquidity: -1840590113610899,
            sqrt_price: 1675854690544471182080396908980501,
        }
        [...]
    }
}


Let's take the ETH-USDC pair
Assuming we find 5 pools on Uniswap v3
The liquidity is the aggregated value


the ProtocolComponent struct is the only way to specify a swap route, so every Substream integration must use it. However, a "component" doesn’t necessarily mean a pool - it can be anything that allows users to swap one token for another.  
