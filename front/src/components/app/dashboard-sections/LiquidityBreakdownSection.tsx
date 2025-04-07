'use client'

import { IconIds } from '@/enums'
import numeral from 'numeral'
import { useAppStore } from '@/stores/app.store'
import { AmmPool } from '@/interfaces'
import { getDashboardMetrics, mapProtocolIdToProtocolConfig } from '@/utils'
import { OrderbookComponentLayout } from './Layouts'
import IconWrapper from '@/components/common/IconWrapper'
import LinkWrapper from '@/components/common/LinkWrapper'
import SvgMapper from '@/components/icons/SvgMapper'

type PoolLiquidity = { base: { amount: number; usd: number }; quote: { amount: number; usd: number } }

export default function LiquidityBreakdownSection(props: { metrics: ReturnType<typeof getDashboardMetrics> }) {
    /**
     * zustand
     */

    const { showMarketDepthSection, showRoutingSection, showLiquidityBreakdownSection, showSections } = useAppStore()

    /**
     * logic to improve
     */

    if (!props.metrics?.orderbook) return <div className="skeleton-loading w-full h-16" />

    // prepare
    const { pools, totals } = props.metrics.orderbook?.base_lqdty.reduce<{
        pools: {
            poolIndex: number
            details: AmmPool
            config?: ReturnType<typeof mapProtocolIdToProtocolConfig>
            liquidity: PoolLiquidity
        }[]
        totals: PoolLiquidity
    }>(
        (acc, curr, currIndex) => {
            if (!props.metrics.orderbook?.pools[currIndex]) return acc
            let existingPoolIndex = acc.pools.findIndex((entry) => entry.poolIndex === currIndex)
            if (existingPoolIndex < 0) {
                acc.pools.push({
                    poolIndex: currIndex,
                    details: props.metrics.orderbook.pools[currIndex],
                    config: mapProtocolIdToProtocolConfig(props.metrics.orderbook.pools[currIndex].protocol_type_name),
                    liquidity: { base: { amount: 0, usd: 0 }, quote: { amount: 0, usd: 0 } },
                })
                existingPoolIndex = acc.pools.findIndex((entry) => entry.poolIndex === currIndex)
            }
            acc.pools[existingPoolIndex].liquidity.base.amount += curr
            acc.pools[existingPoolIndex].liquidity.base.usd += curr * props.metrics.orderbook.base_worth_eth * props.metrics.orderbook.eth_usd
            acc.pools[existingPoolIndex].liquidity.quote.amount += props.metrics.orderbook.quote_lqdty[currIndex]
            acc.pools[existingPoolIndex].liquidity.quote.usd +=
                props.metrics.orderbook.quote_lqdty[currIndex] * props.metrics.orderbook.quote_worth_eth * props.metrics.orderbook.eth_usd
            return acc
        },
        { pools: [], totals: { base: { amount: 0, usd: 0 }, quote: { amount: 0, usd: 0 } } },
    )

    // compute totals
    for (let poolIndex = 0; poolIndex < pools.length; poolIndex++) {
        totals.base.amount += pools[poolIndex].liquidity.base.amount
        totals.base.usd += pools[poolIndex].liquidity.base.usd
        totals.quote.amount += pools[poolIndex].liquidity.quote.amount
        totals.quote.usd += pools[poolIndex].liquidity.quote.usd
    }

    // compute percents

    return (
        <OrderbookComponentLayout
            title={
                <div className="flex gap-2 items-center mb-2">
                    <p className="text-milk text-base font-bold">Liquidity breakdown</p>
                    <button
                        onClick={() => showSections(showMarketDepthSection, showRoutingSection, !showLiquidityBreakdownSection)}
                        className="flex rounded-full hover:bg-gray-600/30 transition-colors duration-300"
                    >
                        <IconWrapper icon={showLiquidityBreakdownSection ? IconIds.TRIANGLE_UP : IconIds.TRIANGLE_DOWN} className="size-4" />
                    </button>
                </div>
            }
            content={
                showLiquidityBreakdownSection ? (
                    <div className="flex w-full justify-center items-center rounded-xl gap-1 border border-milk-150 flex-col px-3 py-2">
                        {/* 1 headers */}
                        <div className="grid grid-cols-11 w-full rounded-xl py-1 px-4 gap-6 items-center text-xs text-milk-200 font-bold">
                            <p className="col-span-3">Pool</p>

                            {/* base */}
                            <div className="flex flex-col col-span-3 gap-2">
                                <p className="w-full text-center border-milk-150 border-b font-bold pb-1">Base</p>
                                <div className="grid grid-cols-3 w-full">
                                    <p className="col-span-1 text-right">Balance</p>
                                    <p className="col-span-1 text-right">k$</p>
                                    <p className="col-span-1 text-right">%</p>
                                </div>
                            </div>

                            {/* quote */}
                            <div className="flex flex-col col-span-3 gap-2">
                                <p className="w-full text-center border-milk-150 border-b font-bold pb-1">Quote</p>
                                <div className="grid grid-cols-3 w-full">
                                    <p className="col-span-1 text-right">Balance</p>
                                    <p className="col-span-1 text-right">k$</p>
                                    <p className="col-span-1 text-right">%</p>
                                </div>
                            </div>

                            {/* tvl */}
                            <div className="flex flex-col col-span-2 gap-2">
                                <p className="w-full text-center border-milk-150 border-b font-bold pb-1">TVL</p>
                                <div className="grid grid-cols-2 w-full">
                                    <p className="col-span-1 text-right">$</p>
                                    <p className="col-span-1 text-right">%</p>
                                </div>
                            </div>
                        </div>

                        {/* 2 content */}
                        {pools.map((pool) => (
                            <div
                                key={`${pool.poolIndex}`}
                                className="grid grid-cols-11 w-full bg-gray-600/10 hover:bg-gray-600/20 rounded-xl py-1.5 px-4 gap-6 items-center text-xs"
                            >
                                {/* pool */}
                                <LinkWrapper
                                    target="_blank"
                                    href={`https://etherscan.io/contract/${pool?.details.address}`}
                                    className="col-span-3 flex gap-2 items-center group"
                                >
                                    <div className="flex justify-center rounded-full p-1 border border-milk-200 bg-milk-200/10">
                                        <SvgMapper icon={pool.config?.svgId} className="size-3.5" />
                                    </div>
                                    <p className="text-milk-600">
                                        {pool.config?.version.toLowerCase()} - {pool.details.fee} bps - {pool?.details?.address.slice(0, 5)}
                                    </p>
                                    <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-4 text-milk-200 group-hover:text-milk" />
                                </LinkWrapper>

                                {/* base */}
                                <div className="col-span-3 grid grid-cols-3 w-full">
                                    <p className="col-span-1 text-milk-600 text-right">{numeral(pool.liquidity.base.amount).format('0,0a')}</p>
                                    <p className="col-span-1 text-milk-600 text-right">
                                        {numeral(pool.liquidity.base.usd).divide(1000).format('0,0')}k
                                    </p>
                                    <p className="col-span-1 text-milk-600 text-right">
                                        {numeral(pool.liquidity.base.amount).divide(totals.base.amount).format('0,0%')}
                                    </p>
                                </div>

                                {/* quote */}
                                <div className="col-span-3 grid grid-cols-3 w-full">
                                    <p className="col-span-1 text-milk-600 text-right">{numeral(pool.liquidity.quote.amount).format('0,0a')}</p>
                                    <p className="col-span-1 text-milk-600 text-right">
                                        {numeral(pool.liquidity.quote.usd).divide(1000).format('0,0')}k
                                    </p>
                                    <p className="col-span-1 text-milk-600 text-right">
                                        {numeral(pool.liquidity.quote.amount).divide(totals.quote.amount).format('0,0%')}
                                    </p>
                                </div>

                                {/* tvl */}
                                <div className="col-span-2 grid grid-cols-2 w-full">
                                    <p className="col-span-1 text-milk-600 text-right">
                                        {numeral(pool.liquidity.base.usd).add(pool.liquidity.quote.usd).divide(1000).format('0,0')}k
                                    </p>
                                    <p className="col-span-1 text-milk-600 text-right">
                                        {numeral(pool.liquidity.base.usd + pool.liquidity.quote.usd)
                                            .divide(pool.liquidity.base.usd + pool.liquidity.quote.usd)
                                            .format('0,0%')}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* 3 totals */}
                        <div className="grid grid-cols-11 w-full rounded-xl py-1 px-4 gap-6 items-center text-xs text-milk-200 font-bold">
                            <p className="col-span-3">Total</p>

                            {/* base */}
                            <div className="col-span-3 grid grid-cols-3 w-full">
                                <p className="col-span-1">
                                    {numeral(totals.base.amount).format('0,0a')} {props.metrics.orderbook?.base?.symbol}
                                </p>
                                <p className="col-span-1">$ {numeral(totals.base.usd).format('0,0a')}</p>
                                <p className="col-span-1">%</p>
                            </div>

                            {/* quote */}
                            <div className="col-span-3 grid grid-cols-3 w-full">
                                <p className="col-span-1">
                                    {numeral(totals.quote.amount).format('0,0a')} {props.metrics.orderbook?.quote?.symbol}
                                </p>
                                <p className="col-span-1">$ {numeral(totals.quote.usd).format('0,0a')}</p>
                                <p className="col-span-1">%</p>
                            </div>

                            {/* tvl */}
                            <div className="col-span-2 grid grid-cols-2 w-full">
                                <p className="col-span-1">$</p>
                                <p className="col-span-1">%</p>
                            </div>
                        </div>
                    </div>
                ) : null
            }
        />
    )
}
