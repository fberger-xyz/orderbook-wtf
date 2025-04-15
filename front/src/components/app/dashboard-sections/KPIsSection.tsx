'use client'

import { IconIds } from '@/enums'
import numeral from 'numeral'
import { useAppStore } from '@/stores/app.store'
import { AppColors, cleanOutput, cn, formatAmount } from '@/utils'
import IconWrapper from '@/components/common/IconWrapper'
import LinkWrapper from '@/components/common/LinkWrapper'
import TokenImage from '../commons/TokenImage'
import { OrderbookComponentLayout, OrderbookKeyMetric } from '../commons/Commons'
import BestSideIcon from '@/components/icons/bestSide.icon'
import { Tooltip } from '@nextui-org/tooltip'
import { CountdownCircleTimer } from 'react-countdown-circle-timer'
import { useApiStore } from '@/stores/api.store'
import { CHAINS_CONFIG } from '@/config/app.config'
import { useState, useRef, useEffect } from 'react'

const lastBlockTooltipContent = () => (
    <div className="rounded-2xl backdrop-blur border border-milk-150 shadow-lg p-3 -mt-1 max-w-80 text-milk text-sm flex">
        <p className="text-wrap">
            Using Tycho Indexer, our backend simulates market depth on every new block (~12s on Ethereum, ~2s on Base). On the frontend, we refresh
            every 12s on Ethereum and 5s on Base to reduce unnecessary requests and stay responsive.
        </p>
    </div>
)

export default function KPIsSection() {
    const { sellToken, buyToken, currentChainId } = useAppStore()
    const { orderBookRefreshIntervalMs, apiStoreRefreshedAt, metrics } = useApiStore()
    const [blockFlash, setBlockFlash] = useState(false)
    const lastBlockRef = useRef<number | undefined>(undefined)

    useEffect(() => {
        if (metrics?.block !== undefined && metrics.block !== lastBlockRef.current) {
            setBlockFlash(true)
            lastBlockRef.current = metrics.block
            const timeout = setTimeout(() => setBlockFlash(false), 300)
            return () => clearTimeout(timeout)
        }
    }, [apiStoreRefreshedAt])

    return (
        <div className="w-full grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-2">
            <OrderbookComponentLayout
                title={
                    <div className="w-full flex items-center gap-1">
                        <BestSideIcon color={AppColors.aquamarine} size={14} />
                        <p className="text-xs text-aquamarine">Best bid</p>
                    </div>
                }
                content={
                    <div
                        className={cn('flex gap-1.5 items-center flex-wrap', {
                            'skeleton-loading p-1': !metrics || metrics?.highestBid?.average_sell_price === undefined,
                        })}
                    >
                        <TokenImage size={20} token={buyToken} />
                        {metrics?.highestBid?.average_sell_price && (
                            <p className="text-milk font-semibold text-base">
                                {cleanOutput(numeral(metrics?.highestBid?.average_sell_price).format('0,0.[0000]'))}
                            </p>
                        )}
                    </div>
                }
            />

            <OrderbookComponentLayout
                title={
                    <div className="w-full flex items-start gap-1 group">
                        <p className="text-milk-600 text-xs">Mid-price</p>
                    </div>
                }
                content={
                    <div
                        className={cn('flex gap-1.5 items-center flex-wrap', {
                            'skeleton-loading p-1': !metrics || metrics?.midPrice === undefined,
                        })}
                    >
                        <TokenImage size={20} token={buyToken} />
                        {metrics?.midPrice !== undefined && (
                            <p className="text-milk font-semibold text-base">{cleanOutput(numeral(metrics?.midPrice).format('0,0.[0000]'))}</p>
                        )}
                    </div>
                }
            />

            <OrderbookComponentLayout
                title={
                    <div className="w-full flex items-center gap-1">
                        <BestSideIcon color={AppColors.folly} size={14} />
                        <p className="text-xs text-folly">Best ask</p>
                    </div>
                }
                content={
                    <div
                        className={cn('flex gap-1.5 items-center flex-wrap', {
                            'skeleton-loading p-1': !metrics || metrics?.lowestAsk?.average_sell_price === undefined,
                        })}
                    >
                        <TokenImage size={20} token={buyToken} />
                        {metrics?.lowestAsk?.average_sell_price !== undefined && (
                            <p className="text-milk font-semibold text-base">
                                {cleanOutput(numeral(1 / metrics?.lowestAsk.average_sell_price).format('0,0.[0000]'))}
                            </p>
                        )}
                    </div>
                }
            />

            <OrderbookKeyMetric
                title="Spread"
                content={
                    metrics && !isNaN(Number(metrics?.spreadPercent)) ? (
                        <p className="text-milk font-semibold text-base">
                            {numeral(metrics?.spreadPercent).format('0,0.[0000]%')}{' '}
                            <span className="pl-1 text-milk-400 text-xs">
                                {cleanOutput(numeral(metrics.spreadPercent).multiply(10000).format('0,0'))} bp
                                {Math.abs(Number(metrics.spreadPercent)) * 10000 >= 1.5 ? 's' : ''}
                            </span>
                        </p>
                    ) : (
                        <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-1">
                            <p className="text-milk-100 font-semibold text-sm">-.--%</p>
                        </div>
                    )
                }
            />

            {typeof metrics?.block === 'number' && metrics.block > 0 ? (
                <OrderbookComponentLayout
                    title={
                        <Tooltip placement="bottom" content={lastBlockTooltipContent()}>
                            <div className="w-full flex justify-between">
                                <div className="flex gap-1">
                                    <p className="text-milk-600 text-xs">Last block</p>
                                    <IconWrapper icon={IconIds.INFORMATION} className="size-3.5 text-milk-200 group-hover:text-milk cursor-pointer" />
                                </div>
                                <CountdownCircleTimer
                                    key={apiStoreRefreshedAt}
                                    isPlaying
                                    duration={orderBookRefreshIntervalMs[currentChainId] / 1000}
                                    initialRemainingTime={
                                        apiStoreRefreshedAt > 0
                                            ? Math.max((orderBookRefreshIntervalMs[currentChainId] - (Date.now() - apiStoreRefreshedAt)) / 1000, 0)
                                            : orderBookRefreshIntervalMs[currentChainId] / 1000
                                    }
                                    colors={AppColors.folly}
                                    trailColor={AppColors.background}
                                    size={16}
                                    strokeWidth={1.5}
                                    trailStrokeWidth={1.5}
                                >
                                    {({ remainingTime }) => <p className="text-[7px] text-milk-200">{remainingTime}</p>}
                                </CountdownCircleTimer>
                            </div>
                        </Tooltip>
                    }
                    content={
                        <LinkWrapper
                            target="_blank"
                            href={`${CHAINS_CONFIG[currentChainId].explorerRoot}/block/${metrics?.block}`}
                            className="flex gap-1 items-center group cursor-alias"
                        >
                            <p className={cn('text-milk font-semibold text-base', { 'animate-flash': blockFlash })}>
                                {cleanOutput(numeral(metrics?.block).format('0,0'))}
                            </p>
                            <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-4 text-milk-200 group-hover:text-milk" />
                        </LinkWrapper>
                    }
                />
            ) : (
                <OrderbookComponentLayout
                    title={
                        <Tooltip placement="bottom" content={lastBlockTooltipContent()}>
                            <div className="flex gap-1">
                                <p className="text-milk-600 text-xs">Last block</p>
                                <IconWrapper icon={IconIds.INFORMATION} className="size-3.5 text-milk-200 group-hover:text-milk cursor-pointer" />
                            </div>
                        </Tooltip>
                    }
                    content={
                        <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-1">
                            <p className="text-milk-100 font-semibold text-sm">123456789</p>
                        </div>
                    }
                />
            )}

            <OrderbookComponentLayout
                title={
                    <Tooltip
                        placement="top"
                        content={
                            metrics && (
                                <div className="rounded-2xl backdrop-blur border border-milk-150 shadow-lg p-3 -mb-1">
                                    <div className="flex gap-1 text-milk text-sm">
                                        <p>
                                            {cleanOutput(
                                                numeral(metrics?.totalBaseTvlUsd / (metrics?.totalBaseTvlUsd + metrics?.totalQuoteTvlUsd)).format(
                                                    '0,0.%',
                                                ),
                                            )}
                                        </p>
                                        <TokenImage size={20} token={sellToken} />
                                        <p>
                                            {sellToken.symbol} and{' '}
                                            {cleanOutput(
                                                numeral(metrics?.totalQuoteTvlUsd / (metrics?.totalBaseTvlUsd + metrics?.totalQuoteTvlUsd)).format(
                                                    '0,0.%',
                                                ),
                                            )}
                                        </p>
                                        <TokenImage size={20} token={buyToken} />
                                        <p>{buyToken.symbol}</p>
                                    </div>
                                </div>
                            )
                        }
                    >
                        <div className="w-full flex items-start gap-1 group">
                            <p className="text-milk-600 text-xs">Pools TVL</p>
                            <IconWrapper icon={IconIds.INFORMATION} className="size-3.5 text-milk-200 group-hover:text-milk cursor-pointer" />
                        </div>
                    </Tooltip>
                }
                content={
                    !metrics || (metrics?.totalBaseTvlUsd === 0 && metrics?.totalQuoteTvlUsd === 0) ? (
                        <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-1 w-full">
                            <p className="text-milk-100 font-semibold text-sm">$ --- m</p>
                        </div>
                    ) : (
                        <div className="w-full flex items-start gap-1 group">
                            <p className="text-milk font-semibold text-base">
                                $ {formatAmount(metrics?.totalBaseTvlUsd + metrics?.totalQuoteTvlUsd)}
                            </p>
                        </div>
                    )
                }
            />
        </div>
    )
}
