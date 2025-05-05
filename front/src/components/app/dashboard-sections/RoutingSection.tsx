'use client'

import { IconIds, OrderbookSide } from '@/enums'
import numeral from 'numeral'
import { useAppStore } from '@/stores/app.store'
import { AmmPool } from '@/interfaces'
import { cleanOutput, mapProtocolIdToProtocolConfig } from '@/utils'
import { OrderbookComponentLayout } from '../commons/Commons'
import IconWrapper from '@/components/common/IconWrapper'
import TokenImage from '../commons/TokenImage'
import { useApiStore } from '@/stores/api.store'
import PoolLink from '../commons/LinkToPool'

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

const formatAmount = (value: number): string => {
    return numeral(value).format('0,0.[000]')
}

const calculateLiquidity = (
    orderbook: { base_lqdty: number[]; quote_lqdty: number[] },
    currIndex: number,
    base_worth_eth: number,
    quote_worth_eth: number,
    eth_usd: number,
) => {
    return {
        base: {
            amount: orderbook.base_lqdty[currIndex],
            usd: orderbook.base_lqdty[currIndex] * base_worth_eth * eth_usd,
        },
        quote: {
            amount: orderbook.quote_lqdty[currIndex],
            usd: orderbook.quote_lqdty[currIndex] * quote_worth_eth * eth_usd,
        },
    }
}

export default function RoutingSection() {
    const { showMarketDepthSection, showRoutingSection, showLiquidityBreakdownSection, selectedTrade, currentChainId, showSections } = useAppStore()
    const { metrics } = useApiStore()

    const orderbook = metrics?.orderbook
    if (!orderbook) {
        return (
            <OrderbookComponentLayout
                title={
                    <div className="flex flex-col">
                        <button
                            onClick={() => showSections(showMarketDepthSection, !showRoutingSection, showLiquidityBreakdownSection)}
                            className="flex gap-1 items-center rounded-lg px-2.5 py-1.5 hover:bg-milk-100/5 transition-colors duration-300 -ml-1 w-fit"
                        >
                            <p className="text-milk text-base font-semibold">Routing</p>
                            <IconWrapper icon={showRoutingSection ? IconIds.TRIANGLE_UP : IconIds.TRIANGLE_DOWN} className="size-4" />
                        </button>
                    </div>
                }
                content={null}
            />
        )
    }

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
                    liquidity: calculateLiquidity(orderbook, currIndex, base_worth_eth, quote_worth_eth, eth_usd),
                })
                existingPoolIndex = acc.pools.findIndex((entry) => entry.poolIndex === currIndex)
            } else {
                const liquidity = calculateLiquidity(orderbook, currIndex, base_worth_eth, quote_worth_eth, eth_usd)
                acc.pools[existingPoolIndex].liquidity.base.amount += liquidity.base.amount
                acc.pools[existingPoolIndex].liquidity.base.usd += liquidity.base.usd
                acc.pools[existingPoolIndex].liquidity.quote.amount += liquidity.quote.amount
                acc.pools[existingPoolIndex].liquidity.quote.usd += liquidity.quote.usd
            }
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
                    onClick={() => showSections(showMarketDepthSection, !showRoutingSection, showLiquidityBreakdownSection)}
                    className="flex gap-1 items-center rounded-lg px-2.5 py-1.5 hover:bg-milk-100/5 transition-colors duration-300 -ml-1 w-fit"
                >
                    <p className="text-milk text-base font-semibold">Routing</p>
                    <IconWrapper icon={showRoutingSection ? IconIds.TRIANGLE_UP : IconIds.TRIANGLE_DOWN} className="size-5" />
                </button>
            }
            content={
                showRoutingSection ? (
                    <div className="flex flex-col gap-2">
                        <p className="text-milk-400 text-xs">Using a simplistic solver</p>
                        <div className="flex gap-4 w-full p-1">
                            {/* From token */}
                            <div className="min-w-16 flex items-center border-r border-dashed border-milk-150 pr-4 my-1">
                                <TokenImage size={40} token={orderbook.base} />
                            </div>

                            {/* Routes */}
                            {orderbook ? (
                                <>
                                    {selectedTrade?.trade ? (
                                        <>
                                            <div className="flex items-center">
                                                <p className="font-semibold text-milk-400 text-sm">100%</p>
                                                <IconWrapper icon={IconIds.CHEVRON_RIGHT} className="size-4 text-milk-400" />
                                            </div>

                                            <div className="flex-grow flex flex-col gap-2 overflow-x-scroll">
                                                {/* Target token */}
                                                <div className="flex gap-2 items-start">
                                                    <TokenImage
                                                        size={22}
                                                        token={selectedTrade.side === OrderbookSide.BID ? orderbook.quote : orderbook.base}
                                                    />
                                                    <p className="font-semibold text-milk tracking-wide">
                                                        {(selectedTrade.side === OrderbookSide.BID ? orderbook.quote : orderbook.base)?.symbol}
                                                    </p>
                                                </div>

                                                {/* Distribution table */}
                                                <div className="min-w-[800px] flex justify-center items-center rounded-xl gap-1 border border-milk-150 flex-col px-3 py-2">
                                                    {/* Headers */}
                                                    <div className="w-full grid grid-cols-11 rounded-xl py-1 px-4 gap-6 items-center text-xs text-milk-200">
                                                        <p className="col-span-3">Pool</p>
                                                        <p className="col-span-1 w-14">In %</p>
                                                        <p className="col-span-2">Amount in</p>
                                                        <p className="col-span-2">Amount out</p>
                                                        <p className="col-span-1 w-14">Out %</p>
                                                        <p className="col-span-2 w-14">Price</p>
                                                    </div>

                                                    {/* Pool rows */}
                                                    {selectedTrade?.trade.distribution.map((percent, percentIndex) => {
                                                        const pool = orderbook.pools[percentIndex]
                                                        const protocolName = pool?.protocol_system
                                                        const config = mapProtocolIdToProtocolConfig(protocolName)
                                                        if (!selectedTrade?.trade?.distribution[percentIndex]) return null
                                                        return (
                                                            <div
                                                                key={`${percent}-${percentIndex}`}
                                                                className="grid grid-cols-11 w-full bg-gray-600/10 hover:bg-gray-600/20 rounded-xl py-1.5 px-4 gap-6 items-center text-xs"
                                                            >
                                                                <PoolLink
                                                                    currentChainId={currentChainId}
                                                                    pool={pool}
                                                                    config={config}
                                                                    className="col-span-3"
                                                                />

                                                                {/* Input distribution */}
                                                                <p className="col-span-1 text-milk-600 w-14">
                                                                    {cleanOutput(
                                                                        numeral(selectedTrade?.trade.distribution[percentIndex])
                                                                            .divide(100)
                                                                            .format('0,0.0%'),
                                                                    )}
                                                                </p>

                                                                {/* Base amount */}
                                                                <div className="col-span-2 flex gap-1 items-center">
                                                                    <p className="text-milk-600 text-right text-xs">
                                                                        {selectedTrade?.trade.distribution[percentIndex]
                                                                            ? formatAmount(
                                                                                  (selectedTrade?.trade.distribution[percentIndex] *
                                                                                      selectedTrade.amountIn) /
                                                                                      100,
                                                                              )
                                                                            : '-'}
                                                                    </p>
                                                                    {selectedTrade?.trade.distribution[percentIndex] > 0 && (
                                                                        <p className="text-xs text-milk-400">
                                                                            {
                                                                                (selectedTrade.side === OrderbookSide.BID
                                                                                    ? orderbook.base
                                                                                    : orderbook.quote
                                                                                )?.symbol
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* Quote amount */}
                                                                <div className="col-span-2 flex gap-1 items-center">
                                                                    <p className="text-milk-600 text-right text-xs">
                                                                        {selectedTrade?.trade?.distributed[percentIndex]
                                                                            ? formatAmount(
                                                                                  (selectedTrade?.trade?.distributed[percentIndex] *
                                                                                      selectedTrade?.trade?.output) /
                                                                                      100,
                                                                              )
                                                                            : '-'}
                                                                    </p>
                                                                    {selectedTrade?.trade?.distributed[percentIndex] > 0 && (
                                                                        <p className="text-xs text-milk-400">
                                                                            {
                                                                                (selectedTrade.side === OrderbookSide.BID
                                                                                    ? orderbook.quote
                                                                                    : orderbook.base
                                                                                )?.symbol
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* Output distribution */}
                                                                <p className="col-span-1 text-milk-600 w-14">
                                                                    {cleanOutput(
                                                                        numeral(selectedTrade?.trade?.distributed[percentIndex])
                                                                            .divide(100)
                                                                            .format('0,0.0%'),
                                                                    )}
                                                                </p>

                                                                {/* Execution price */}
                                                                <p className="col-span-2 text-milk-600 w-14 truncate">
                                                                    {selectedTrade?.trade?.distribution[percentIndex] > 0 &&
                                                                    selectedTrade?.trade?.distributed[percentIndex] > 0
                                                                        ? formatAmount(
                                                                              (selectedTrade?.trade?.distributed[percentIndex] *
                                                                                  selectedTrade?.trade?.output) /
                                                                                  100 /
                                                                                  ((selectedTrade?.trade?.distribution[percentIndex] *
                                                                                      selectedTrade.amountIn) /
                                                                                      100),
                                                                          )
                                                                        : '-'}
                                                                </p>
                                                            </div>
                                                        )
                                                    })}

                                                    {/* Totals */}
                                                    <div className="w-full grid grid-cols-11 rounded-xl py-1 px-4 gap-6 items-center text-xs text-milk-200">
                                                        <p className="col-span-3">Total</p>
                                                        <p className="col-span-1">{cleanOutput(numeral(1).format('0,0%'))}</p>
                                                        <p className="col-span-2">{formatAmount(selectedTrade.amountIn)}</p>
                                                        <p className="col-span-2">{formatAmount(selectedTrade?.trade.output)}</p>
                                                        <p className="col-span-1">{cleanOutput(numeral(1).format('0,0%'))}</p>
                                                        <p className="col-span-2"></p>
                                                    </div>

                                                    {/* Debug */}
                                                    {/* {IS_DEV && <pre>{JSON.stringify(selectedTrade?.pools.length, null, 2)}</pre>}
                                                    {IS_DEV && <pre>{JSON.stringify(selectedTrade?.pools, null, 2)}</pre>} */}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm font-semibold text-milk-200 mx-auto">
                                            Select any positive amount of {orderbook.base?.symbol} to sell
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className="skeleton-loading w-full h-16" />
                            )}

                            {/* To token */}
                            <div className="min-w-16 flex items-center border-l border-dashed border-milk-150 pl-4 my-1">
                                <TokenImage size={40} token={orderbook.quote} />
                            </div>
                        </div>
                    </div>
                ) : null
            }
        />
    )
}
