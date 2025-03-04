# Hub

Tycho is an open-source interface to on-chain liquidity. Tycho
- Indexes DEX protocol state for you with low latency,
- Simulates swaps extremely fast with one interface for all DEXs, and  
- Executes swaps on-chain

Links
- https://www.erc7815.org/
- https://github.com/propeller-heads/tycho-simulation
- https://docs.propellerheads.xyz/tycho/for-solvers/simulation
- https://docs.propellerheads.xyz/tycho/for-solvers/supported-protocols
- https://www.propellerheads.xyz/blog/amm-liquidity-as-an-orderbook

# TAP 2 Review

You can see it [here](https://github.com/propeller-heads/tycho-x/blob/main/TAP-2.md)
The entrypoint is a 1 uniq token pair.
So Balancer USDC-ETH is not the same as Uniswap v3 USDC-ETH, nor v2.


# Misc

There are two types of implementations:
- Native protocols are ported to Rust – for faster simulation.
- VM protocols execute the VM bytecode locally – which is easier to integrate but has slower simulation times than a native implementation.

With limit orders you can draw any arbitrary increasing supply curve.


