
# Tycho TAP-2

@authors Merso
@contact TG @xMerso
@protocol Tycho
@program [Tycho TAP-2](https://github.com/propeller-heads/tycho-x/blob/main/TAP-2.md)
@date 03/04/25

**The aim of this note is to present a desired implementation of TAP-2 and to adjust it, in discussion with the Tycho team and community.**

The aim of TAP-2 is to build a orderbook interface that unifies liquidity across multiple chains.
It should enable traders to view, simulate and execute trades with pre-calculated liquidity aggregation in real time.
The sub-objectives are to attract more traders onchain (because liquidity will be easier to read and execute) and to encourage greater liquidity onchain by increasing volumes/revenues.
The aim is also to unify the fragmented liquidity between protocols, pools and chains, while saving simulation and execution time.



 
{
    token_from: "",
    token_to: "",
    protocols: [
        {
            name: "u2",
            tick: 199470,
            bids: [], // expressed in token to
            asks: [] // expressed in token from
        }
    ]
}

zeroToOne
oneToZero