'use client'

import { IconIds } from '@/enums'
import numeral from 'numeral'
import { useAppStore } from '@/stores/app.store'
import { cn, formatAmount, getDashboardMetrics } from '@/utils'
import IconWrapper from '@/components/common/IconWrapper'
import LinkWrapper from '@/components/common/LinkWrapper'
import TokenImage from '../TokenImage'
import { OrderbookComponentLayout, OrderbookKeyMetric } from './Layouts'

export default function KPIsSection(props: { metrics: ReturnType<typeof getDashboardMetrics> }) {
    /**
     * zustand
     */

    const { sellToken, buyToken } = useAppStore()

    return (
        <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-2">
            {/* bid */}
            <OrderbookComponentLayout
                title={
                    <div className="w-full flex items-start gap-1 group">
                        <p className="text-milk-600 text-xs">Best bid</p>
                        <IconWrapper icon={IconIds.INFORMATION} className="size-3.5 text-milk-200 group-hover:text-milk cursor-pointer" />
                    </div>
                }
                content={
                    <div
                        className={cn('flex gap-1.5 items-center flex-wrap', {
                            'skeleton-loading p-1': !props.metrics.highestBid?.average_sell_price,
                        })}
                    >
                        <TokenImage size={20} token={buyToken} />
                        {props.metrics.highestBid?.average_sell_price && (
                            <p className="text-milk font-bold text-base">{formatAmount(props.metrics.highestBid.average_sell_price)}</p>
                        )}
                    </div>
                }
            />

            {/* mid price */}
            <OrderbookComponentLayout
                title={
                    <div className="w-full flex items-start gap-1 group">
                        <p className="text-milk-600 text-xs">Mid-price</p>
                        <IconWrapper icon={IconIds.INFORMATION} className="size-3.5 text-milk-200 group-hover:text-milk cursor-pointer" />
                    </div>
                }
                content={
                    <div className={cn('flex gap-1.5 items-center flex-wrap', { 'skeleton-loading p-1': props.metrics.midPrice === undefined })}>
                        <TokenImage size={20} token={buyToken} />
                        {props.metrics.midPrice !== undefined ? (
                            <p className="text-milk font-bold text-base">{formatAmount(props.metrics.midPrice)}</p>
                        ) : null}
                    </div>
                }
            />

            {/* ask */}
            <OrderbookComponentLayout
                title={
                    <div className="w-full flex items-start gap-1 group">
                        <p className="text-milk-600 text-xs">Best ask</p>
                        <IconWrapper icon={IconIds.INFORMATION} className="size-3.5 text-milk-200 group-hover:text-milk cursor-pointer" />
                    </div>
                }
                content={
                    <div
                        className={cn('flex gap-1.5 items-center flex-wrap', {
                            'skeleton-loading p-1': props.metrics?.lowestAsk?.average_sell_price === undefined,
                        })}
                    >
                        <TokenImage size={20} token={buyToken} />
                        {props.metrics?.lowestAsk?.average_sell_price !== undefined ? (
                            <p className="text-milk font-bold text-base">{formatAmount(1 / props.metrics.lowestAsk.average_sell_price)}</p>
                        ) : null}
                    </div>
                }
            />

            {/* spread */}
            <OrderbookKeyMetric
                title="Spread"
                content={
                    !isNaN(Number(props.metrics.spreadPercent)) ? (
                        <p className="text-milk font-bold text-base">
                            {numeral(props.metrics.spreadPercent).format('0,0.[0000]%')}{' '}
                            <span className="pl-1 text-milk-400 text-xs">
                                {numeral(props.metrics.spreadPercent).multiply(10000).format('0,0')} bps
                            </span>
                        </p>
                    ) : (
                        <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-1">
                            <p className="text-milk-100 font-bold text-sm">-.--%</p>
                        </div>
                    )
                }
            />

            {/* last block */}
            {props.metrics.orderbook?.block !== undefined ? (
                <OrderbookComponentLayout
                    title={
                        <div className="w-full flex justify-between">
                            <p className="text-milk-600 text-xs">Last block</p>
                            <p className="text-milk-600 text-xs">-s</p>
                        </div>
                    }
                    content={
                        <LinkWrapper
                            target="_blank"
                            href={`https://etherscan.io/block/${props.metrics.orderbook.block}`}
                            className="flex gap-1 items-center group"
                        >
                            <p className="text-milk font-bold text-base">{numeral(props.metrics.orderbook.block).format('0,0')}</p>
                            <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-4 text-milk-200 group-hover:text-milk" />
                        </LinkWrapper>
                    }
                />
            ) : (
                <OrderbookKeyMetric
                    title="Last block"
                    content={
                        <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-1">
                            <p className="text-milk-100 font-bold text-sm">123456789</p>
                        </div>
                    }
                />
            )}

            {/* TVL */}
            <OrderbookKeyMetric
                title="Pools TVL"
                content={
                    props.metrics.totalBaseTvlUsd === undefined || props.metrics.totalQuoteTvlUsd === undefined ? (
                        <div className="flex gap-1.5 items-center flex-wrap skeleton-loading p-1 w-full">
                            <p className="text-milk-100 font-bold text-sm">$ --- m</p>
                        </div>
                    ) : (
                        <div className="flex gap-2 items-baseline">
                            <p className="text-milk font-bold text-base">
                                $ {formatAmount(props.metrics.totalBaseTvlUsd + props.metrics.totalQuoteTvlUsd)}
                            </p>
                            {/* <p className="text-milk-150 font-bold text-sm">
                                        $ {formatAmount(props.metrics.totalBaseTvlUsd)} of {sellToken?.symbol}
                                    </p> */}
                            <p className="text-milk-200 font-bold text-sm">
                                {numeral(props.metrics.totalBaseTvlUsd / (props.metrics.totalBaseTvlUsd + props.metrics.totalQuoteTvlUsd)).format(
                                    '0,0.%',
                                )}{' '}
                                {sellToken?.symbol} and{' '}
                                {numeral(props.metrics.totalQuoteTvlUsd / (props.metrics.totalBaseTvlUsd + props.metrics.totalQuoteTvlUsd)).format(
                                    '0,0.%',
                                )}{' '}
                                {buyToken?.symbol}
                            </p>
                        </div>
                    )
                }
            />
        </div>
    )
}
