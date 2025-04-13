'use client'

import { IconIds, OrderbookSide } from '@/enums'
import numeral from 'numeral'
import { useAppStore } from '@/stores/app.store'
import { AmmPool } from '@/interfaces'
import { mapProtocolIdToProtocolConfig } from '@/utils'
import { OrderbookComponentLayout } from './Layouts'
import IconWrapper from '@/components/common/IconWrapper'
import LinkWrapper from '@/components/common/LinkWrapper'
import SvgMapper from '@/components/icons/SvgMapper'
import TokenImage from '../TokenImage'
import { useApiStore } from '@/stores/api.store'
import { IS_DEV } from '@/config/app.config'

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

type PoolLinkProps = {
    pool: AmmPool | undefined
    config?: ReturnType<typeof mapProtocolIdToProtocolConfig>
}

const PoolLink = ({ pool, config }: PoolLinkProps) => {
    if (!pool)
        return (
            <div className="col-span-3 flex gap-2 items-center group">
                <pre>{JSON.stringify({ pool, config }, null, 2)}</pre>
            </div>
        )

    return (
        <LinkWrapper target="_blank" href={`https://etherscan.io/address/${pool.address}`} className="col-span-3 flex gap-2 items-center group">
            <div className="flex justify-center rounded-full p-1 border border-milk-200 bg-milk-200/10">
                <SvgMapper icon={config?.svgId} className="size-3.5" />
            </div>
            <p className="text-milk-600 truncate group-hover:underline">
                {config?.version ? `${config?.version?.toLowerCase()} - ` : ''}
                {pool.fee} bps - {pool.address.slice(0, 5)}
            </p>
            <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-4 text-milk-200 group-hover:text-milk" />
        </LinkWrapper>
    )
}

const formatAmount = (value: number): string => {
    return numeral(value).format('0,0.[000]')
}

const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`
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
    const { showMarketDepthSection, showRoutingSection, showLiquidityBreakdownSection, selectedTrade, showSections } = useAppStore()
    const { metrics } = useApiStore()

    const orderbook = metrics?.orderbook
    if (!orderbook) {
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
                    <IconWrapper icon={showRoutingSection ? IconIds.TRIANGLE_UP : IconIds.TRIANGLE_DOWN} className="size-4" />
                </button>
            }
            content={
                showRoutingSection ? (
                    <div className="flex flex-col gap-2">
                        <p className="text-milk-400 text-xs">Using a simplistic solver</p>
                        <div className="flex gap-4 w-full p-1">
                            {/* From token */}
                            <div className="max-w-24 flex items-center border-r border-dashed border-milk-150 pr-4 my-1">
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

                                            <div className="flex-grow flex flex-col gap-2">
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
                                                <div className="flex w-full justify-center items-center rounded-xl gap-1 border border-milk-150 flex-col px-3 py-2">
                                                    {/* Headers */}
                                                    <div className="grid grid-cols-11 w-full rounded-xl py-1 px-4 gap-6 items-center text-xs text-milk-200">
                                                        <p className="col-span-3">Pool</p>
                                                        <p className="col-span-1 w-14">In %</p>
                                                        <p className="col-span-2">Amount in</p>
                                                        <p className="col-span-2">Amount out</p>
                                                        <p className="col-span-1 w-14">Out %</p>
                                                        <p className="col-span-2 w-14">Price</p>
                                                    </div>

                                                    {/* Pool rows */}
                                                    {(() => {
                                                        const trade = selectedTrade.trade
                                                        return trade.distribution.map((percent, percentIndex) => {
                                                            const pool = orderbook.pools[percentIndex]
                                                            const protocolName = pool?.protocol_system
                                                            const config = mapProtocolIdToProtocolConfig(protocolName)
                                                            return (
                                                                <div
                                                                    key={`${percent}-${percentIndex}`}
                                                                    className="grid grid-cols-11 w-full bg-gray-600/10 hover:bg-gray-600/20 rounded-xl py-1.5 px-4 gap-6 items-center text-xs"
                                                                >
                                                                    <PoolLink pool={pool} config={config} />

                                                                    {/* Input distribution */}
                                                                    <p className="col-span-1 text-milk-600 w-14">
                                                                        {trade.distribution[percentIndex] > 0
                                                                            ? formatPercentage(trade.distribution[percentIndex])
                                                                            : '-'}
                                                                    </p>

                                                                    {/* Base amount */}
                                                                    <div className="col-span-2 flex gap-1 items-center">
                                                                        <p className="text-milk-600 text-right text-xs">
                                                                            {trade.distribution[percentIndex]
                                                                                ? formatAmount(
                                                                                      (trade.distribution[percentIndex] * selectedTrade.amountIn) /
                                                                                          100,
                                                                                  )
                                                                                : '-'}
                                                                        </p>
                                                                        {trade.distribution[percentIndex] > 0 && (
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
                                                                            {trade.distributed[percentIndex]
                                                                                ? formatAmount((trade.distributed[percentIndex] * trade.output) / 100)
                                                                                : '-'}
                                                                        </p>
                                                                        {trade.distributed[percentIndex] > 0 && (
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
                                                                        {trade.distributed[percentIndex] > 0
                                                                            ? formatPercentage(trade.distributed[percentIndex])
                                                                            : '-'}
                                                                    </p>

                                                                    {/* Execution price */}
                                                                    <p className="col-span-2 text-milk-600 w-14 truncate">
                                                                        {trade.distribution[percentIndex] > 0 && trade.distributed[percentIndex] > 0
                                                                            ? formatAmount(
                                                                                  (trade.distributed[percentIndex] * trade.output) /
                                                                                      100 /
                                                                                      ((trade.distribution[percentIndex] * selectedTrade.amountIn) /
                                                                                          100),
                                                                              )
                                                                            : '-'}
                                                                    </p>
                                                                </div>
                                                            )
                                                        })
                                                    })()}

                                                    {/* Totals */}
                                                    <div className="grid grid-cols-11 w-full rounded-xl py-1 px-4 gap-6 items-center text-xs text-milk-200">
                                                        <p className="col-span-3">Total</p>
                                                        <p className="col-span-1">{formatPercentage(100)}</p>
                                                        <p className="col-span-2">{formatAmount(selectedTrade.amountIn)}</p>
                                                        <p className="col-span-2">{formatAmount(selectedTrade.trade.output)}</p>
                                                        <p className="col-span-1">{formatPercentage(100)}</p>
                                                        <p className="col-span-2"></p>
                                                    </div>

                                                    {/* Debug */}
                                                    {IS_DEV && <pre>{JSON.stringify(selectedTrade?.pools.length, null, 2)}</pre>}
                                                    {IS_DEV && <pre>{JSON.stringify(selectedTrade?.pools, null, 2)}</pre>}
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
                            <div className="max-w-24 flex items-center border-l border-dashed border-milk-150 pl-4 my-1">
                                <TokenImage size={40} token={orderbook.quote} />
                            </div>
                        </div>
                    </div>
                ) : null
            }
        />
    )
}
