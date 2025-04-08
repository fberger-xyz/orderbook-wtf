'use client'

import { IconIds, OrderbookSide } from '@/enums'
import numeral from 'numeral'
import { useAppStore } from '@/stores/app.store'
import { AmmPool } from '@/interfaces'
import { cn, getDashboardMetrics, mapProtocolIdToProtocolConfig } from '@/utils'
import { OrderbookComponentLayout } from './Layouts'
import IconWrapper from '@/components/common/IconWrapper'
import LinkWrapper from '@/components/common/LinkWrapper'
import SvgMapper from '@/components/icons/SvgMapper'
import TokenImage from '../TokenImage'

type PoolLiquidity = { base: { amount: number; usd: number }; quote: { amount: number; usd: number } }

export default function RoutingSection(props: { metrics: ReturnType<typeof getDashboardMetrics> }) {
    /**
     * zustand
     */

    const { showMarketDepthSection, showRoutingSection, showLiquidityBreakdownSection, selectedTrade, showSections } = useAppStore()

    /**
     * logic to improve
     */

    const orderbook = props.metrics?.orderbook
    if (!orderbook)
        return (
            <OrderbookComponentLayout
                title={
                    <div className="flex flex-col mb-2">
                        <button
                            onClick={() => showSections(showMarketDepthSection, !showRoutingSection, showLiquidityBreakdownSection)}
                            className="flex gap-1 items-center rounded-lg px-2 hover:bg-milk-100/5 transition-colors duration-300 -ml-1 w-fit"
                        >
                            <p className="text-milk text-base font-semibold">Routing</p>
                            <IconWrapper icon={showRoutingSection ? IconIds.TRIANGLE_UP : IconIds.TRIANGLE_DOWN} className="size-4" />
                        </button>
                        <p className="text-milk-400 text-xs">Using a simplistic solver</p>
                    </div>
                }
                content={<div className="skeleton-loading w-full h-16" />}
            />
        )

    // prepare
    const eth_usd = orderbook.eth_usd
    const base_worth_eth = orderbook.base_worth_eth
    const quote_worth_eth = orderbook.quote_worth_eth
    const { pools, totals } = orderbook?.pools.reduce<{
        pools: {
            poolIndex: number
            details: AmmPool
            config?: ReturnType<typeof mapProtocolIdToProtocolConfig>
            liquidity: PoolLiquidity
        }[]
        totals: PoolLiquidity
    }>(
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

    // compute totals
    for (let poolIndex = 0; poolIndex < pools.length; poolIndex++) {
        totals.base.amount += pools[poolIndex].liquidity.base.amount
        totals.base.usd += pools[poolIndex].liquidity.base.usd
        totals.quote.amount += pools[poolIndex].liquidity.quote.amount
        totals.quote.usd += pools[poolIndex].liquidity.quote.usd
    }

    return (
        <OrderbookComponentLayout
            title={
                <button
                    onClick={() => showSections(showMarketDepthSection, !showRoutingSection, showLiquidityBreakdownSection)}
                    className="flex gap-1 items-center rounded-lg px-2.5 py-1.5 hover:bg-milk-100/5 transition-colors duration-300 -ml-1 w-fit"
                >
                    <p className="text-milk text-base font-semibold">Routing</p>
                    <IconWrapper icon={showRoutingSection ? IconIds.TRIANGLE_UP : IconIds.TRIANGLE_DOWN} className="size-4" />
                </button>
            }
            content={
                showRoutingSection ? (
                    <div className="flex flex-col gap-2">
                        <p className="text-milk-400 text-xs">Using a simplistic solver</p>
                        <div className="flex gap-4 w-full p-1">
                            {/* from */}
                            <div className="max-w-24 flex items-center border-r border-dashed border-milk-150 pr-4 my-1">
                                <TokenImage size={40} token={props.metrics.orderbook?.base} />
                            </div>

                            {/* routes % */}
                            {props.metrics.orderbook ? (
                                <>
                                    {selectedTrade ? (
                                        <>
                                            <div className="flex items-center">
                                                <p className="font-semibold text-milk-400 text-sm">100%</p>
                                                <IconWrapper
                                                    icon={IconIds.CHEVRON_RIGHT}
                                                    className={cn('size-4 text-milk-400', {
                                                        // 'text-aquamarine': selectedTrade.side === OrderbookSide.BID,
                                                        // 'text-folly': selectedTrade.side === OrderbookSide.ASK,
                                                    })}
                                                />
                                            </div>

                                            <div className="flex-grow flex flex-col gap-2">
                                                {/* tokn */}
                                                <div className="flex gap-2 items-start">
                                                    <TokenImage
                                                        size={22}
                                                        token={
                                                            selectedTrade.side === OrderbookSide.BID
                                                                ? props.metrics.orderbook?.quote
                                                                : props.metrics.orderbook?.base
                                                        }
                                                    />
                                                    <p className="font-semibold text-milk tracking-wide">
                                                        {
                                                            (selectedTrade.side === OrderbookSide.BID
                                                                ? props.metrics.orderbook?.quote
                                                                : props.metrics.orderbook?.base
                                                            )?.symbol
                                                        }
                                                    </p>
                                                </div>

                                                {/* distribution */}
                                                <div className="flex w-full justify-center items-center rounded-xl gap-1 border border-milk-150 flex-col px-3 py-2">
                                                    {/* headers */}
                                                    <div className="grid grid-cols-10 w-full rounded-xl py-1 px-4 gap-6 items-center text-xs text-milk-200 font-semibold">
                                                        <p className="col-span-3">Pool</p>
                                                        <p className="col-span-1 font-semibold w-14">Base %</p>
                                                        <p className="col-span-2">Base amount</p>
                                                        <p className="col-span-2">Quote amount</p>
                                                        <p className="col-span-1 font-semibold w-14">Quote %</p>
                                                        <p className="col-span-1 font-semibold w-14">Simulated</p>
                                                    </div>
                                                    {selectedTrade?.trade?.distribution.map((percent, percentIndex) => {
                                                        const pool = props.metrics.orderbook?.pools[percentIndex]
                                                        const protocolName = pool?.protocol_system ?? 'Unknown'
                                                        const config = mapProtocolIdToProtocolConfig(protocolName)
                                                        return (
                                                            <div
                                                                key={`${percent}-${percentIndex}`}
                                                                className="grid grid-cols-10 w-full bg-gray-600/10 hover:bg-gray-600/20 rounded-xl py-1.5 px-4 gap-6 items-center text-xs"
                                                            >
                                                                {/* pool */}
                                                                <LinkWrapper
                                                                    target="_blank"
                                                                    href={`https://etherscan.io/address/${pool?.address}`}
                                                                    className="col-span-3 flex gap-2 items-center group"
                                                                >
                                                                    <div className="flex justify-center rounded-full p-1 border border-milk-200 bg-milk-200/10">
                                                                        <SvgMapper icon={config.svgId} className="size-3.5" />
                                                                    </div>
                                                                    <p className="text-milk-600 truncate">
                                                                        {config?.version ? `${config?.version.toLowerCase()} - ` : ''}
                                                                        {pool?.fee} bps - {pool?.address.slice(0, 5)}
                                                                    </p>
                                                                    <IconWrapper
                                                                        icon={IconIds.OPEN_LINK_IN_NEW_TAB}
                                                                        className="size-4 text-milk-200 group-hover:text-milk"
                                                                    />
                                                                </LinkWrapper>

                                                                {/* input */}
                                                                <p className="col-span-1 text-milk-600 w-14">
                                                                    {selectedTrade.trade?.distribution &&
                                                                    selectedTrade.trade.distribution[percentIndex] > 0
                                                                        ? numeral(selectedTrade.trade.distribution[percentIndex])
                                                                              .divide(100)
                                                                              .format('0,0%')
                                                                        : '-'}
                                                                </p>
                                                                <div className="col-span-2 flex gap-1 items-center">
                                                                    <p className="text-milk-600 text-right text-xs">
                                                                        {selectedTrade.trade?.distribution[percentIndex]
                                                                            ? numeral(selectedTrade.trade?.distribution[percentIndex])
                                                                                  .divide(100)
                                                                                  .multiply(selectedTrade.amountIn)
                                                                                  .format('0,0.[000]')
                                                                            : '-'}
                                                                    </p>
                                                                    {selectedTrade.trade?.distribution &&
                                                                        selectedTrade.trade.distribution[percentIndex] > 0 && (
                                                                            <p className="text-xs text-milk-400">
                                                                                {
                                                                                    (selectedTrade.side === OrderbookSide.BID
                                                                                        ? props.metrics.orderbook?.base
                                                                                        : props.metrics.orderbook?.quote
                                                                                    )?.symbol
                                                                                }
                                                                            </p>
                                                                        )}
                                                                </div>

                                                                {/* output */}
                                                                <div className="col-span-2 flex gap-1 items-center">
                                                                    <p className="text-milk-600 text-right text-xs">
                                                                        {selectedTrade.trade?.distributed[percentIndex]
                                                                            ? numeral(selectedTrade.trade?.distributed[percentIndex])
                                                                                  .divide(100)
                                                                                  .multiply(selectedTrade.trade?.output)
                                                                                  .format('0,0.[000]')
                                                                            : '-'}
                                                                    </p>
                                                                    {selectedTrade.trade?.distributed &&
                                                                        selectedTrade.trade.distributed[percentIndex] > 0 && (
                                                                            <p className="text-xs text-milk-400">
                                                                                {
                                                                                    (selectedTrade.side === OrderbookSide.BID
                                                                                        ? props.metrics.orderbook?.quote
                                                                                        : props.metrics.orderbook?.base
                                                                                    )?.symbol
                                                                                }
                                                                            </p>
                                                                        )}
                                                                </div>
                                                                <p className="col-span-1 text-milk-600 w-14">
                                                                    {selectedTrade.trade?.distributed &&
                                                                    selectedTrade.trade.distributed[percentIndex] > 0
                                                                        ? numeral(selectedTrade.trade.distributed[percentIndex])
                                                                              .divide(100)
                                                                              .format('0,0%')
                                                                        : '-'}
                                                                </p>

                                                                {/* execution */}
                                                                <p className="col-span-1 text-milk-600 w-14 truncate">
                                                                    {selectedTrade.trade?.distribution &&
                                                                    selectedTrade.trade.distribution[percentIndex] > 0 &&
                                                                    selectedTrade.trade?.distributed &&
                                                                    selectedTrade.trade.distributed[percentIndex] > 0
                                                                        ? numeral(
                                                                              selectedTrade.trade?.distributed[percentIndex] *
                                                                                  (selectedTrade.trade?.output / 100),
                                                                          )
                                                                              .divide(
                                                                                  selectedTrade.trade?.distribution[percentIndex] *
                                                                                      (selectedTrade.amountIn / 100),
                                                                              )
                                                                              .format('0,0.[000000]')
                                                                        : '-'}
                                                                </p>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm font-semibold text-milk-200 mx-auto">
                                            Select any positive amount of {props.metrics.orderbook?.base?.symbol} to sell
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className="skeleton-loading w-full h-16" />
                            )}

                            {/* to */}
                            <div className="max-w-24 flex items-center border-l border-dashed border-milk-150 pl-4 my-1">
                                <TokenImage size={40} token={props.metrics.orderbook?.quote} />
                            </div>
                        </div>
                    </div>
                ) : null
            }
        />
    )
}
