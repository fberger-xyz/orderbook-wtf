'use client'

import { IconIds } from '@/enums'
import numeral from 'numeral'
import { useAppStore } from '@/stores/app.store'
import { AmmPool } from '@/interfaces'
import { cleanOutput, mapProtocolIdToProtocolConfig } from '@/utils'
import { OrderbookComponentLayout } from '../commons/Commons'
import IconWrapper from '@/components/common/IconWrapper'
import TokenImage from '../commons/TokenImage'
import { useApiStore } from '@/stores/api.store'
import PoolLink from '../commons/LinkToPool'
import PoolUpdate from '../commons/PoolUpdate'

type PoolLiquidity = {
    base: { amount: number; usd: number }
    quote: { amount: number; usd: number }
}

type PoolData = {
    poolIndex: number
    details: AmmPool
    config?: ReturnType<typeof mapProtocolIdToProtocolConfig>
    liquidity: PoolLiquidity
}

type PoolsData = {
    pools: PoolData[]
    totals: PoolLiquidity
}

export default function PoolsTVLSection() {
    const { showMarketDepthSection, showRoutingSection, showLiquidityBreakdownSection, currentChainId, showSections } = useAppStore()
    const { metrics } = useApiStore()

    const orderbook = metrics?.orderbook
    if (!orderbook) {
        return (
            <OrderbookComponentLayout
                title={
                    <button
                        onClick={() => showSections(showMarketDepthSection, showRoutingSection, !showLiquidityBreakdownSection)}
                        className="flex gap-1 items-center rounded-lg px-2.5 py-1.5 hover:bg-milk-100/5 transition-colors duration-300 -ml-1 w-fit"
                    >
                        <p className="text-milk text-base font-semibold">Pools TVL</p>
                        <IconWrapper icon={showLiquidityBreakdownSection ? IconIds.TRIANGLE_UP : IconIds.TRIANGLE_DOWN} className="size-4" />
                    </button>
                }
                content={null}
            />
        )
    }

    if (orderbook?.pools?.length !== orderbook?.base_lqdty?.length || orderbook?.base_lqdty?.length !== orderbook?.quote_lqdty?.length) {
        return (
            <OrderbookComponentLayout
                title={
                    <button
                        onClick={() => showSections(showMarketDepthSection, showRoutingSection, !showLiquidityBreakdownSection)}
                        className="flex gap-1 items-center rounded-lg px-2.5 py-1.5 hover:bg-milk-100/5 transition-colors duration-300 -ml-1 w-fit"
                    >
                        <p className="text-milk text-base font-semibold">Pools TVL</p>
                        <IconWrapper icon={showLiquidityBreakdownSection ? IconIds.TRIANGLE_UP : IconIds.TRIANGLE_DOWN} className="size-4" />
                    </button>
                }
                content={
                    <div className="flex flex-col gap-2">
                        <p className="text-milk-400 text-xs">Breakdown by token</p>
                        <div className="flex flex-col items-center justify-center h-14">
                            <p className="text-orange-400 text-xs">Invalid orderbook format</p>
                            <p className="text-milk-400 text-xs">Ask @xMerso and @fberger_xyz for a fix</p>
                        </div>
                    </div>
                }
            />
        )
    }

    // Prepare data
    const eth_usd = orderbook.eth_usd
    const base_worth_eth = orderbook.base_worth_eth
    const quote_worth_eth = orderbook.quote_worth_eth

    const { pools, totals } = orderbook?.pools.reduce<PoolsData>(
        (acc, curr, currIndex) => {
            let existingPoolIndex = acc.pools.findIndex((entry) => entry.poolIndex === currIndex)
            if (existingPoolIndex < 0) {
                acc.pools.push({
                    poolIndex: currIndex,
                    details: curr,
                    config: mapProtocolIdToProtocolConfig(curr.protocol_type_name),
                    liquidity: { base: { amount: 0, usd: 0 }, quote: { amount: 0, usd: 0 } },
                })
                existingPoolIndex = acc.pools.findIndex((entry) => entry.poolIndex === currIndex)
            }
            acc.pools[existingPoolIndex].liquidity.base.amount += orderbook.base_lqdty[currIndex]
            acc.pools[existingPoolIndex].liquidity.base.usd += orderbook.base_lqdty[currIndex] * base_worth_eth * eth_usd
            acc.pools[existingPoolIndex].liquidity.quote.amount += orderbook.quote_lqdty[currIndex]
            acc.pools[existingPoolIndex].liquidity.quote.usd += orderbook.quote_lqdty[currIndex] * quote_worth_eth * eth_usd
            return acc
        },
        { pools: [], totals: { base: { amount: 0, usd: 0 }, quote: { amount: 0, usd: 0 } } },
    )

    // Compute totals
    pools.forEach((pool) => {
        totals.base.amount += pool.liquidity.base.amount
        totals.base.usd += pool.liquidity.base.usd
        totals.quote.amount += pool.liquidity.quote.amount
        totals.quote.usd += pool.liquidity.quote.usd
    })

    return (
        <OrderbookComponentLayout
            title={
                <button
                    onClick={() => showSections(showMarketDepthSection, showRoutingSection, !showLiquidityBreakdownSection)}
                    className="flex gap-1 items-center rounded-lg px-2.5 py-1.5 hover:bg-milk-100/5 transition-colors duration-300 -ml-1 w-fit"
                >
                    <p className="text-milk text-base font-semibold">Pools TVL</p>
                    <IconWrapper icon={showLiquidityBreakdownSection ? IconIds.TRIANGLE_UP : IconIds.TRIANGLE_DOWN} className="size-5" />
                </button>
            }
            content={
                showLiquidityBreakdownSection ? (
                    <div className="flex flex-col gap-2">
                        <p className="text-milk-400 text-xs">Breakdown by token</p>
                        <div className="w-full overflow-x-scroll">
                            <div className="flex w-full justify-center items-center rounded-xl gap-1 border border-milk-150 flex-col px-3 py-2 min-w-[900px]">
                                {/* Headers */}
                                <div className="grid grid-cols-11 w-full rounded-xl py-1 px-4 gap-5 items-end text-xs text-milk-200">
                                    <p className="col-span-2">Pools</p>
                                    <div className="col-span-1 flex gap-0.5 text-start truncate">
                                        <p>Last updated</p>
                                        {/* <p className="text-xs">(1)</p> */}
                                    </div>

                                    {/* Base token */}
                                    <div className="flex flex-col col-span-3 gap-2">
                                        <div className="flex gap-2 border-b pb-1.5 justify-center items-start border-milk-400 pr-2">
                                            <TokenImage size={14} token={orderbook.base} />
                                            <p className="font-semibold text-milk">{orderbook.base.symbol}</p>
                                        </div>
                                        <div className="grid grid-cols-3 w-full pr-2">
                                            <p className="col-span-1 text-right">Balance</p>
                                            <p className="col-span-1 text-right">k$</p>
                                            <p className="col-span-1 text-right">Total %</p>
                                        </div>
                                    </div>

                                    {/* Quote token */}
                                    <div className="flex flex-col col-span-3 gap-2">
                                        <div className="flex gap-2 border-b pb-1.5 justify-center items-start border-milk-400 pr-2">
                                            <TokenImage size={14} token={orderbook.quote} />
                                            <p className="font-semibold text-milk">{orderbook.quote.symbol}</p>
                                        </div>
                                        <div className="grid grid-cols-3 w-full pr-2">
                                            <p className="col-span-1 text-right">Balance</p>
                                            <p className="col-span-1 text-right">k$</p>
                                            <p className="col-span-1 text-right">Total %</p>
                                        </div>
                                    </div>

                                    {/* TVL */}
                                    <div className="flex flex-col col-span-2 gap-2">
                                        <div className="flex gap-2 border-b pb-1.5 justify-center items-start border-milk-400 pr-2">
                                            {/* <TokenImage size={14} token={orderbook.base} />
                                        <p className="font-semibold text-milk">+</p>
                                        <TokenImage size={14} token={orderbook.quote} /> */}
                                            <p className="font-semibold text-milk">Pool TVL</p>
                                        </div>
                                        <div className="grid grid-cols-2 w-full pr-2">
                                            <p className="col-span-1 text-right">k$</p>
                                            <p className="col-span-1 text-right">Total %</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Pool rows */}
                                {pools
                                    .sort(
                                        (curr, next) =>
                                            next.liquidity.base.usd + next.liquidity.quote.usd - (curr.liquidity.base.usd + curr.liquidity.quote.usd),
                                    )
                                    .map((pool) => (
                                        <div
                                            key={`${pool.poolIndex}`}
                                            className="grid grid-cols-11 w-full bg-gray-600/10 hover:bg-gray-600/20 rounded-xl py-1.5 px-4 gap-5 items-center text-xs"
                                        >
                                            <PoolLink
                                                currentChainId={currentChainId}
                                                pool={pool.details}
                                                config={pool.config}
                                                className="col-span-2"
                                            />

                                            <PoolUpdate lastUpdatedAt={pool.details.last_updated_at} />

                                            {/* Base token */}
                                            <div className="col-span-3 grid grid-cols-3 w-full">
                                                <p className="col-span-1 text-milk-600 text-right">
                                                    {cleanOutput(numeral(pool.liquidity.base.amount).format('0,0'))}
                                                </p>
                                                <p className="col-span-1 text-milk-600 text-right">
                                                    {cleanOutput(`${numeral(pool.liquidity.base.usd).divide(1000).format('0,0')} k$`)}
                                                </p>
                                                <p className="col-span-1 text-milk-600 text-right">
                                                    {cleanOutput(numeral(pool.liquidity.base.amount).divide(totals.base.amount).format('0,0.0%'))}
                                                </p>
                                            </div>

                                            {/* Quote token */}
                                            <div className="col-span-3 grid grid-cols-3 w-full">
                                                <p className="col-span-1 text-milk-600 text-right">
                                                    {cleanOutput(numeral(pool.liquidity.quote.amount).format('0,0'))}
                                                </p>
                                                <p className="col-span-1 text-milk-600 text-right">
                                                    {cleanOutput(`${numeral(pool.liquidity.quote.usd).divide(1000).format('0,0')} k$`)}
                                                </p>
                                                <p className="col-span-1 text-milk-600 text-right">
                                                    {cleanOutput(numeral(pool.liquidity.quote.amount).divide(totals.quote.amount).format('0,0.0%'))}
                                                </p>
                                            </div>

                                            {/* TVL */}
                                            <div className="col-span-2 grid grid-cols-2 w-full">
                                                <p className="col-span-1 text-milk-600 text-right">
                                                    {cleanOutput(
                                                        `${numeral(pool.liquidity.base.usd).add(pool.liquidity.quote.usd).divide(1000).format('0,0')} k$`,
                                                    )}
                                                </p>
                                                <p className="col-span-1 text-milk-600 text-right">
                                                    {cleanOutput(
                                                        numeral(pool.liquidity.base.usd + pool.liquidity.quote.usd)
                                                            .divide(totals.base.usd + totals.quote.usd)
                                                            .format('0,0.0%'),
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                {/* Totals */}
                                <div className="grid grid-cols-11 w-full rounded-xl py-1 px-4 gap-5 items-center text-xs text-milk-200">
                                    <p className="col-span-2">Total</p>
                                    <p className="col-span-1"></p>

                                    {/* Base token */}
                                    <div className="col-span-3 grid grid-cols-3 w-full">
                                        <p className="col-span-1 text-right">
                                            {cleanOutput(`${numeral(totals.base.amount).divide(1000).format('0,0')} k`)}
                                        </p>
                                        <p className="col-span-1 text-right">
                                            {cleanOutput(`${numeral(totals.base.usd).divide(1000).format('0,0')} k$`)}
                                        </p>
                                        <p className="col-span-1 text-right">100%</p>
                                    </div>

                                    {/* Quote token */}
                                    <div className="col-span-3 grid grid-cols-3 w-full">
                                        <p className="col-span-1 text-right">
                                            {cleanOutput(`${numeral(totals.quote.amount).divide(1000).format('0,0')} k`)}
                                        </p>
                                        <p className="col-span-1 text-right">
                                            {cleanOutput(`${numeral(totals.quote.usd).divide(1000).format('0,0')} k$`)}
                                        </p>
                                        <p className="col-span-1 text-right">100%</p>
                                    </div>

                                    {/* TVL */}
                                    <div className="col-span-2 grid grid-cols-2 w-full">
                                        <p className="col-span-1 text-right">
                                            {cleanOutput(
                                                numeral(totals.base.usd + totals.quote.usd)
                                                    .divide(1000)
                                                    .format('0,0'),
                                            )}{' '}
                                            k$
                                        </p>
                                        <p className="col-span-1 text-right">100%</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* {IS_DEV && <pre>{JSON.stringify(orderbook?.pools.length)}</pre>}
                        {IS_DEV && <pre>{JSON.stringify(orderbook?.pools, null, 2)}</pre>} */}
                    </div>
                ) : null
            }
        />
    )
}
