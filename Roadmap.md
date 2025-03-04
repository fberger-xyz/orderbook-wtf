
# Tycho TAP-2

@author Merso // MEV Searcher // Junior Rust 🦀
@contact TG @xMerso
@protocol Tycho
@program [Tycho TAP-2](https://github.com/propeller-heads/tycho-x/blob/main/TAP-2.md)
@date 03/04/25

[MODEL]https://forum.cow.fi/t/grant-application-cow-amm-expansion/2404

**The aim of this note is to present a desired implementation of TAP-2 and to make adjustments, in discussion with the Tycho community.**

The aim of TAP-2 is to build a orderbook interface that unifies liquidity across multiple chains.
It should enable traders to view, simulate and execute trades with pre-calculated liquidity aggregation in real time.
The sub-objectives are to attract more traders onchain (because liquidity will be easier to read and execute) and to encourage greater liquidity onchain by increasing volumes/revenues.
The aim is also to unify the fragmented liquidity between protocols, pools and chains, while saving simulation and execution time, even for thousands of pools.

-------

## Implementation

Here's the plan to achieve it.

1. In-depth understanding of the Tycho SDK. 
    - How Tycho tracks pool states, routing and liquidity changes.
    - Analyse SDK structure and data format.
    - Evaluate data flow, state reading, resource consumption.

2. Main components
    - Stream: retrieves state updates from Tycho [Rust]
    - Orderbook: calculates price, updates orderbook views [Rust]
    - Router: provides optimal execution paths [Rust]
    - Execution: generates tender data for execution [Rust]
    - User Interface: Displays the order book and enables trade execution [Typescript]

3. Development
    - Connect to WSS. Listen liquidity updates
    - Store liquidity and pool liquidity
    - Create and update a Dijkstra graph to calculate the optimal multi-hop path.
    -  

------

## Others

* Side notes

    Fully open-source
    Stack: Rust (back) and Typescript (front)
    Database: Redis or Postgre
    DevOps: Basic Docker Compose in local
    A fast, local, good routing solver would be a plus.

* Configuration

    Tycho URL: "tycho-beta.propellerheads.xyz"
    Tycho API: key: sampletoken
    RPC: Public (or connected wallet)

------

