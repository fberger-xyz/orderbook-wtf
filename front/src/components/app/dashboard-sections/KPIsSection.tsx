'use client'

import { IconIds } from '@/enums'
import numeral from 'numeral'
import { useAppStore } from '@/stores/app.store'
import { AppColors, cn, formatAmount } from '@/utils'
import IconWrapper from '@/components/common/IconWrapper'
import LinkWrapper from '@/components/common/LinkWrapper'
import TokenImage from '../TokenImage'
import { OrderbookComponentLayout, OrderbookKeyMetric } from './Layouts'
import BestSideIcon from '@/components/icons/bestSide.icon'
import { Tooltip } from '@nextui-org/tooltip'
import { CountdownCircleTimer } from 'react-countdown-circle-timer'
import { useEffect, useState } from 'react'
import { useApiStore } from '@/stores/api.store'

export default function KPIsSection() {
    const { sellToken, buyToken } = useAppStore()
    const { orderBookRefreshIntervalMs, apiStoreRefreshedAt, metrics } = useApiStore()
    const [timerKey, setTimerKey] = useState(0)

    useEffect(() => {
        if (apiStoreRefreshedAt > 0) {
            setTimerKey((prev) => prev + 1)
        }
    }, [apiStoreRefreshedAt])

    return (
        <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-2">
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
                            <p className="text-milk font-semibold text-base">{formatAmount(metrics?.highestBid.average_sell_price)}</p>
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
                        {metrics?.midPrice !== undefined && <p className="text-milk font-semibold text-base">{formatAmount(metrics?.midPrice)}</p>}
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
                            <p className="text-milk font-semibold text-base">{formatAmount(1 / metrics?.lowestAsk.average_sell_price)}</p>
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
                            <span className="pl-1 text-milk-400 text-xs">{numeral(metrics?.spreadPercent).multiply(10000).format('0,0')} bps</span>
                        </p>
                    ) : (
                        <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-1">
                            <p className="text-milk-100 font-semibold text-sm">-.--%</p>
                        </div>
                    )
                }
            />

            {metrics?.orderbook?.block !== undefined ? (
                <OrderbookComponentLayout
                    title={
                        <div className="w-full flex justify-between">
                            <p className="text-milk-600 text-xs">Last block</p>
                            <CountdownCircleTimer
                                key={timerKey}
                                isPlaying
                                duration={orderBookRefreshIntervalMs / 1000}
                                initialRemainingTime={
                                    apiStoreRefreshedAt > 0
                                        ? Math.max((orderBookRefreshIntervalMs - (Date.now() - apiStoreRefreshedAt)) / 1000, 0)
                                        : orderBookRefreshIntervalMs / 1000
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
                    }
                    content={
                        <LinkWrapper
                            target="_blank"
                            href={`https://etherscan.io/block/${metrics?.orderbook.block}`}
                            className="flex gap-1 items-center group"
                        >
                            <p className="text-milk font-semibold text-base">{numeral(metrics?.orderbook.block).format('0,0')}</p>
                            <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-4 text-milk-200 group-hover:text-milk" />
                        </LinkWrapper>
                    }
                />
            ) : (
                <OrderbookKeyMetric
                    title="Last block"
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
                                            {numeral(metrics?.totalBaseTvlUsd / (metrics?.totalBaseTvlUsd + metrics?.totalQuoteTvlUsd)).format(
                                                '0,0.%',
                                            )}{' '}
                                        </p>
                                        <TokenImage size={20} token={sellToken} />
                                        <p>
                                            {sellToken?.symbol} and{' '}
                                            {numeral(metrics?.totalQuoteTvlUsd / (metrics?.totalBaseTvlUsd + metrics?.totalQuoteTvlUsd)).format(
                                                '0,0.%',
                                            )}{' '}
                                        </p>
                                        <TokenImage size={20} token={buyToken} />
                                        <p>{buyToken?.symbol}</p>
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
                    metrics?.totalBaseTvlUsd === undefined || metrics?.totalQuoteTvlUsd === undefined ? (
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
