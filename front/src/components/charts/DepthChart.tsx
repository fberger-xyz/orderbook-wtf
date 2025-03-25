'use client'

import * as echarts from 'echarts'
import { ErrorBoundary } from 'react-error-boundary'
import { Suspense, useEffect, useState } from 'react'
import { OrderbookSide } from '@/enums'
import EchartWrapper from './EchartWrapper'
import { ChartBackground, CustomFallback, LoadingArea } from './ChartsCommons'
import { useAppStore } from '@/stores/app.store'
import { APP_FONT } from '@/config/app.config'
import { ErrorBoundaryFallback } from '../common/ErrorBoundaryFallback'
import { AppColors, formatAmount } from '@/utils'
import { AmmAsOrderbook, AmmPool } from '@/interfaces'
import numeral from 'numeral'
import { OrderbookDataPoint } from '@/types'
import toast from 'react-hot-toast'
import { toastStyle } from '@/config/toasts.config'
type LineDataPoint = {
    value: [number, number]
    symbol?: string
    symbolSize?: number
    customData?: {
        side: OrderbookSide
        distribution: number[]
        output: number
    }
    itemStyle?: {
        borderWidth: number
        borderColor: string
        color: string
        shadowBlur: number
        shadowColor: string
    }
    emphasis?: {
        symbolSize?: number
        itemStyle?: {
            borderWidth?: number
            borderColor?: string
            color?: string
            shadowBlur?: number
            shadowColor?: string
        }
    }
}
const getOptions = (
    token0: string,
    token1: string,
    bids: LineDataPoint[],
    asks: LineDataPoint[],
    pools: AmmPool[],
    yAxisType: 'value' | 'log',
    yAxisLogBase: number,
): echarts.EChartsOption => {
    return {
        tooltip: {
            trigger: 'axis',
            triggerOn: 'mousemove|click',
            axisPointer: {
                type: 'line',
                snap: true,
                lineStyle: {
                    color: AppColors.milk[600],
                    width: 2,
                    type: 'dotted',
                },
            },
            textStyle: {
                fontSize: 11,
            },
            formatter: (params) => {
                const [firstSerieDataPoints] = Array.isArray(params) ? params : [params]

                const { value, data } = firstSerieDataPoints
                const [price, input] = value as [number, number]

                const custom = (data as LineDataPoint).customData
                const side = custom?.side
                const distribution = custom?.distribution ?? []
                const output = custom?.output ?? 0

                const distributionLines = distribution.map((percent, percentIndex) => {
                    const protocolName = pools[percentIndex]?.protocol_system ?? 'Unknown'
                    const attributes = pools[percentIndex]?.static_attributes ?? []
                    const hexaPercent = attributes.find((entry) => entry[0].toLowerCase() === 'fee')?.[1] ?? '0'
                    return `- ${numeral(percent / 100).format('#4#0,0%')} in ${protocolName} ${numeral(parseInt(hexaPercent, 16)).divide(100).format('0,0.[0]')}bps`
                })

                return [
                    `<strong>You sell</strong>`,
                    `= ${numeral(input).format('0,0.[0000000]')} ${side === OrderbookSide.BID ? token0 : token1}`,
                    ``,
                    `<strong>Simulated price</strong>`,
                    `= ${numeral(price).format('0,0.[0000000]')} ${token1} for 1 ${token0}`,
                    `= ${numeral(1 / price).format('0,0.[0000000]')} ${token0} for 1 ${token1}`,
                    ``,
                    `<strong>You buy</strong>`,
                    `= ${numeral(output).format('0,0.[0000000]')} ${side === OrderbookSide.BID ? token1 : token0}`,
                    ``,
                    `<strong>Distribution</strong>`,
                    ...distributionLines,
                ]
                    .filter(Boolean)
                    .join('<br/>')
            },
        },
        toolbox: {
            feature: {
                dataZoom: {
                    yAxisIndex: 'none',
                },
                restore: { show: true },
                saveAsImage: { show: true },
                dataView: { show: true, readOnly: false },
            },
            itemSize: 8,
        },
        legend: {
            show: false,
        },
        xAxis: [
            {
                type: 'value',
                position: 'bottom',
                nameLocation: 'middle',
                splitLine: {
                    show: false,
                },
                axisLabel: {
                    margin: 15,
                    hideOverlap: true,
                    showMinLabel: true,
                    showMaxLabel: true,
                    formatter: (value) => `${formatAmount(value)}\n${formatAmount(1 / Number(value))}`,
                    fontSize: 10,
                    color: AppColors.milk[200],
                },
                axisLine: {
                    lineStyle: {
                        color: AppColors.milk[150],
                    },
                },
                axisTick: {
                    show: false,
                },
                min: 'dataMin',
                max: 'dataMax',
            },
        ],
        dataZoom: [
            {
                show: true,
                type: 'slider',
                height: 25,
                bottom: '3%',
                backgroundColor: AppColors.milk[50],
                fillerColor: 'transparent',
                borderColor: AppColors.milk[200],
                labelFormatter: (index: number) => `${formatAmount(index)} ${token1}\n${formatAmount(1 / Number(index))} ${token0}`,
                textStyle: { color: AppColors.milk[200], fontSize: 10 },
                handleLabel: { show: true },
                dataBackground: { lineStyle: { color: 'transparent' }, areaStyle: { color: 'transparent' } },
                selectedDataBackground: { lineStyle: { color: AppColors.milk[200] }, areaStyle: { color: AppColors.milk[50] } },
                brushStyle: { color: 'transparent' }, // unknown
                handleStyle: { color: AppColors.milk[600], borderColor: AppColors.milk[600] }, // small candles on left and right
                moveHandleStyle: { color: AppColors.milk[200] }, // top bar
                emphasis: {
                    handleLabel: { show: true },
                    moveHandleStyle: { color: AppColors.milk[400] }, // top bar
                },
            },
        ],
        yAxis: [
            {
                type: yAxisType,
                logBase: yAxisType === 'log' ? yAxisLogBase : undefined,
                nameTextStyle: {
                    fontWeight: 'bold',
                    fontSize: 14,
                },
                position: 'left',
                nameLocation: 'middle',
                alignTicks: true,
                splitLine: {
                    show: true,
                    lineStyle: { color: AppColors.milk[50], type: 'dashed' },
                },
                axisTick: {
                    show: false,
                },
                axisLabel: {
                    fontSize: 11,
                    show: true,
                    color: AppColors.milk[200],
                    formatter: (value) => formatAmount(value),
                },
                axisLine: {
                    show: false,
                },
                axisPointer: {
                    snap: true,
                },
                min: 'dataMin',
                max: 'dataMax',
            },
            {
                type: yAxisType,
                logBase: yAxisType === 'log' ? yAxisLogBase : undefined,
                nameTextStyle: {
                    fontWeight: 'bold',
                    fontSize: 14,
                },
                position: 'right',
                nameLocation: 'middle',
                alignTicks: true,
                splitLine: {
                    show: true,
                    lineStyle: { color: AppColors.milk[50], type: 'dashed' },
                },
                axisTick: {
                    show: false,
                },
                axisLabel: {
                    fontSize: 11,
                    show: true,
                    color: AppColors.milk[200],
                    formatter: (value) => formatAmount(value),
                },
                axisLine: {
                    show: false,
                },
                axisPointer: {
                    snap: true,
                },
                min: 'dataMin',
                max: 'dataMax',
            },
        ],
        textStyle: {
            color: AppColors.milk[600],
            fontFamily: APP_FONT.style.fontFamily,
        },
        grid: {
            left: '10%',
            right: '10%',
            top: '40',
            bottom: '100',
        },

        series: [
            {
                yAxisIndex: 0,
                name: 'Bids',
                type: 'line',
                data: bids,
                step: 'start',
                lineStyle: { width: 0.5, color: AppColors.aquamarine, opacity: 0.5 },
                symbol: 'circle',
                symbolSize: 4,
                itemStyle: {
                    color: AppColors.aquamarine,
                    borderColor: AppColors.aquamarine,
                    borderWidth: 1,
                },
                emphasis: {
                    itemStyle: { color: AppColors.aquamarine, borderWidth: 4 },
                },
            },
            {
                yAxisIndex: 1,
                name: 'Asks',
                type: 'line',
                data: asks,
                step: 'end',
                lineStyle: { width: 0.5, color: AppColors.folly, opacity: 0.5 },
                symbol: 'circle',
                symbolSize: 4,
                itemStyle: {
                    color: AppColors.folly,
                    borderColor: AppColors.folly,
                    borderWidth: 1,
                },
                emphasis: {
                    itemStyle: { color: AppColors.folly, borderWidth: 4 },
                },
            },
        ],
    }
}

export default function DepthChart(props: { orderbook: AmmAsOrderbook }) {
    const { buyToken, sellToken, storeRefreshedAt, yAxisType, yAxisLogBase, selectOrderbookDataPoint } = useAppStore()
    const [options, setOptions] = useState<echarts.EChartsOption>(
        getOptions(props.orderbook.token0.symbol, props.orderbook.token1.symbol, [], [], props.orderbook.pools, yAxisType, yAxisLogBase),
    )

    // load/refresh chart
    useEffect(() => {
        const highestBid = props.orderbook?.trades0to1.reduce((max, t) => (t.ratio > max.ratio ? t : max), props.orderbook.trades0to1[0])
        const lowestAsk = props.orderbook?.trades1to0.reduce((min, t) => (1 / t.ratio < 1 / min.ratio ? t : min), props.orderbook.trades1to0[0])

        const bids: LineDataPoint[] = props.orderbook?.trades0to1
            .filter((trade, tradeIndex, trades) => trades.findIndex((_trade) => _trade.amount === trade.amount) === tradeIndex)
            .sort((curr, next) => curr.ratio - next.ratio)
            .map((trade) => {
                const point: LineDataPoint = {
                    value: [trade.ratio, trade.amount],
                    customData: {
                        side: OrderbookSide.BID,
                        distribution: trade.distribution,
                        output: trade.ratio * trade.amount,
                    },
                }
                if (trade === highestBid) {
                    point.symbol = 'diamond'
                    // point.symbol =
                    //     'path://M30.9,53.2C16.8,53.2,5.3,41.7,5.3,27.6S16.8,2,30.9,2C45,2,56.4,13.5,56.4,27.6S45,53.2,30.9,53.2z M30.9,3.5C17.6,3.5,6.8,14.4,6.8,27.6c0,13.3,10.8,24.1,24.101,24.1C44.2,51.7,55,40.9,55,27.6C54.9,14.4,44.1,3.5,30.9,3.5z M36.9,35.8c0,0.601-0.4,1-0.9,1h-1.3c-0.5,0-0.9-0.399-0.9-1V19.5c0-0.6,0.4-1,0.9-1H36c0.5,0,0.9,0.4,0.9,1V35.8z M27.8,35.8 c0,0.601-0.4,1-0.9,1h-1.3c-0.5,0-0.9-0.399-0.9-1V19.5c0-0.6,0.4-1,0.9-1H27c0.5,0,0.9,0.4,0.9,1L27.8,35.8L27.8,35.8z'
                    point.symbolSize = 14
                    point.itemStyle = {
                        borderWidth: 1,
                        borderColor: AppColors.background,
                        color: AppColors.aquamarine,
                        shadowBlur: 15, // the intensity of the glow
                        shadowColor: AppColors.aquamarine,
                    }
                    point.emphasis = {
                        symbolSize: 15,
                        itemStyle: {
                            shadowBlur: 30,
                            borderWidth: 0.5,
                            shadowColor: 'rgba(255, 0, 128, 1)', // hot pink
                        },
                    }
                }
                return point
            })

        const asks: LineDataPoint[] = props.orderbook?.trades1to0
            .filter((trade, tradeIndex, trades) => trades.findIndex((_trade) => _trade.amount === trade.amount) === tradeIndex)
            .sort((curr, next) => Number(curr.ratio) - Number(next.ratio))
            .map((trade) => {
                const price = 1 / trade.ratio
                const point: LineDataPoint = {
                    value: [price, trade.amount],
                    customData: {
                        side: OrderbookSide.ASK,
                        distribution: trade.distribution,
                        output: trade.ratio * trade.amount,
                    },
                }
                if (trade === lowestAsk) {
                    point.symbol = 'diamond'
                    point.symbolSize = 14
                    point.itemStyle = {
                        borderWidth: 1,
                        borderColor: AppColors.background,
                        color: AppColors.folly,
                        shadowBlur: 15, // the intensity of the glow
                        shadowColor: 'rgba(255, 0, 128, 1)', // hot pink
                    }
                    point.emphasis = {
                        symbolSize: 15,
                        itemStyle: {
                            shadowBlur: 30,
                            shadowColor: 'rgba(255, 0, 128, 1)', // hot pink

                            borderWidth: 0.5,
                        },
                    }
                }
                return point
            })

        // options
        const newOptions = getOptions(
            props.orderbook.token0.symbol,
            props.orderbook.token1.symbol,
            bids,
            asks,
            props.orderbook.pools,
            yAxisType,
            yAxisLogBase,
        )

        // update
        setOptions(newOptions)

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buyToken, sellToken, storeRefreshedAt, yAxisType, yAxisLogBase])

    // methods
    const handlePointClick = (params: { value: undefined | OrderbookDataPoint }) => {
        if (params.value && Array.isArray(params.value))
            selectOrderbookDataPoint({ datapoint: params.value, bidsPools: props.orderbook.pools, asksPools: props.orderbook.pools })
    }

    return (
        <Suspense fallback={<CustomFallback />}>
            <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
                <ChartBackground className="relative h-[450px]">
                    {!storeRefreshedAt ? (
                        <LoadingArea message="Loading your assets" />
                    ) : Array.isArray(options.series) && options.series?.length > 0 && options.series[0].data ? (
                        <EchartWrapper
                            options={options}
                            onPointClick={(params) => {
                                toast.success(`Trade selected`, { style: toastStyle })
                                handlePointClick(params as { value: undefined | OrderbookDataPoint })
                            }}
                        />
                    ) : (
                        <LoadingArea message="Contact support" />
                    )}
                </ChartBackground>
            </ErrorBoundary>
        </Suspense>
    )
}
