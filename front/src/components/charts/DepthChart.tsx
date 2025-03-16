'use client'

import * as echarts from 'echarts'
import { ErrorBoundary } from 'react-error-boundary'
import { Suspense, useEffect, useState } from 'react'
import { AppThemes, OrderbookSide } from '@/enums'
import { useTheme } from 'next-themes'
import EchartWrapper from './EchartWrapper'
import { colors } from '@/config/charts.config'
import { ChartBackground, CustomFallback, LoadingArea } from './ChartsCommons'
import { useAppStore } from '@/stores/app.store'
import { DEFAULT_THEME } from '@/config/app.config'
import { ErrorBoundaryFallback } from '../common/ErrorBoundaryFallback'
import { formatAmount } from '@/utils'
import { NewOrderbookTrades, NewPool } from '@/interfaces'
import numeral from 'numeral'
import { OrderbookDataPoint } from '@/types'
import Button from '../common/Button'

const serie1Name = 'Market Depth'

const getOptions = (
    resolvedTheme: AppThemes,
    token0: string,
    token1: string,
    bids: OrderbookDataPoint[],
    asks: OrderbookDataPoint[],
    pools: NewPool[],
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
                    color: colors.line[resolvedTheme],
                    width: 2,
                    type: 'dotted',
                },
            },
            textStyle: {
                fontSize: 11,
            },
            formatter: (params) => {
                // ensure params is an array
                const [firstSerieDataPoints] = Array.isArray(params) ? params : [params]
                const [price, tradersInput, side, distribution] = firstSerieDataPoints.data as OrderbookDataPoint
                const tradersOutput = side === OrderbookSide.ASK ? tradersInput / price : tradersInput * price
                const distributionLines = distribution.map((percent, percentIndex) => {
                    const protocolName = pools[percentIndex].protocol_system
                    const attributes = pools[percentIndex].static_attributes
                    const hexaPercent = attributes.find((entry) => entry[0].toLowerCase() === 'fee')?.[1] ?? '0'
                    // https://github.com/adamwdraper/Numeral-js/issues/123
                    return `- ${numeral(percent / 100).format('#4#0,0%')} in ${protocolName} ${numeral(parseInt(hexaPercent, 16)).divide(100).format('0,0.[0]')}bps`
                })
                return [
                    `<strong>Trader's input</strong>`,
                    `= ${numeral(tradersInput).format('0,0.[0000000]')} ${side === OrderbookSide.ASK ? token0 : token1}`,
                    ``,
                    `<strong>Simulated price</strong>`,
                    `= ${numeral(price).format('0,0.[0000000]')} ${token0} for 1 ${token1}`,
                    `= ${numeral(1 / price).format('0,0.[0000000]')} ${token1} for 1 ${token0}`,
                    ``,
                    `<strong>Trader's output</strong>`,
                    `= ${numeral(tradersOutput).format('0,0.[0000000]')} ${side === OrderbookSide.ASK ? token1 : token0}`,
                    ``,
                    `<strong>Distribution</strong>`,
                    ...distributionLines,
                ]
                    .filter((line) => !!line)
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
            itemSize: 10,
        },
        legend: {
            top: 20,
            textStyle: {
                color: colors.text[resolvedTheme],
            },
            data: [{ name: serie1Name }],
        },
        xAxis: [
            {
                type: 'value',
                position: 'bottom',
                name: `Simulation price`,
                nameLocation: 'middle',
                nameGap: 50,
                nameTextStyle: {
                    fontWeight: 'bold',
                    fontSize: 14,
                },
                splitLine: {
                    show: false,
                },
                axisLabel: {
                    margin: 15,
                    hideOverlap: true,
                    showMinLabel: true,
                    showMaxLabel: true,
                    formatter: (value) => `${formatAmount(value)}\n${formatAmount(1 / Number(value))}`,
                },
                axisLine: {
                    lineStyle: {
                        color: colors.line[resolvedTheme],
                    },
                },
                // min: Math.min(...bids.map((trade) => trade[0])),
                // max: Math.max(...asks.map((trade) => trade[0])),
                min: 'dataMin',
                max: 'dataMax',
            },
        ],
        dataZoom: [
            {
                show: true,
                type: 'slider',
                height: 30,
                bottom: '3%',
                // todo improve this
                // startValue: bids.length > 145 ? bids[bids.length - 145][0] : undefined,
                // endValue: asks.length > 145 ? asks[145][0] : undefined,
                fillerColor: 'transparent',
                backgroundColor: 'transparent',
                borderColor: colors.line[resolvedTheme],
                labelFormatter: (index: number) => `${formatAmount(index)} ${token0}\n${formatAmount(1 / Number(index))} ${token1}`,
                textStyle: { color: colors.text[resolvedTheme], fontSize: 11 },
                handleLabel: { show: true },
                dataBackground: { lineStyle: { color: colors.line[resolvedTheme] }, areaStyle: { color: 'transparent' } },
            },
        ],
        yAxis: [
            {
                // type: 'log',
                // logBase: 10,
                // type: 'value',
                type: yAxisType,
                logBase: yAxisType === 'log' ? yAxisLogBase : undefined,
                name: `Trader's input in ${token1}`,
                nameTextStyle: {
                    fontWeight: 'bold',
                    fontSize: 14,
                },
                position: 'left',
                nameLocation: 'middle',
                nameGap: 50,
                alignTicks: true,
                splitLine: {
                    show: false,
                },
                axisTick: {
                    show: true,
                    lineStyle: {
                        color: colors.line[resolvedTheme],
                    },
                },
                axisLabel: {
                    show: true,
                    color: colors.text[resolvedTheme],
                    formatter: (value) => formatAmount(value),
                },
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: colors.line[resolvedTheme],
                    },
                },
                axisPointer: {
                    snap: true,
                },
                // min: 0,
                min: 'dataMin',
                max: 'dataMax',
            },
            {
                // type: 'log',
                // logBase: 10,
                // type: 'value',
                type: yAxisType,
                logBase: yAxisType === 'log' ? yAxisLogBase : undefined,
                name: `Trader's input in ${token0}`,
                nameTextStyle: {
                    fontWeight: 'bold',
                    fontSize: 14,
                },
                position: 'right',
                nameLocation: 'middle',
                nameGap: 50,
                alignTicks: true,
                splitLine: {
                    show: false,
                },
                axisTick: {
                    show: true,
                    lineStyle: {
                        color: colors.line[resolvedTheme],
                    },
                },
                axisLabel: {
                    show: true,
                    color: colors.text[resolvedTheme],
                    formatter: (value) => formatAmount(value),
                },
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: colors.line[resolvedTheme],
                    },
                },
                axisPointer: {
                    snap: true,
                },
                // min: 0,
                min: 'dataMin',
                max: 'dataMax',
            },
        ],
        textStyle: {
            color: colors.text[resolvedTheme],
        },
        grid: {
            left: '10%',
            right: '10%',
            top: '80',
            bottom: '120',
        },
        // @ts-expect-error: poorly typed
        series: [
            {
                yAxisIndex: 0,
                name: 'Bids',
                type: 'line',
                data: bids,
                step: 'end',
                lineStyle: { width: 1.5, color: colors.line[resolvedTheme] },
                symbol: 'circle',
                symbolSize: 4,
                itemStyle: {
                    color: 'green', // Green for bids
                    borderColor: '#0f0',
                    borderWidth: 1,
                },
                emphasis: {
                    itemStyle: { color: 'green', borderWidth: 4 },
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(150, 150, 150, 0.5)' }, // light gray at the top
                        { offset: 1, color: 'rgba(150, 150, 150, 0.0)' }, // transparent at the bottom
                    ]),
                },

                // best bid
                markLine: {
                    animation: false,
                    symbol: 'none',
                    data: bids.length
                        ? [
                              {
                                  xAxis: bids[bids.length - 1][0],
                                  lineStyle: { color: 'green', opacity: 0.5 },
                                  label: {
                                      show: true,
                                      color: 'green',
                                      formatter: (params) => `Best bid = ${params.value} ${token0} for 1 ${token1}`,
                                      // https://echarts.apache.org/en/option.html#series-bar.markLine.data.0.label.position
                                      position: 'insideMiddleTop',
                                      fontSize: 10,
                                      opacity: 1,
                                  },
                              },
                          ]
                        : undefined,
                },

                // bids area
                markArea: {
                    data: bids.length
                        ? [
                              [
                                  {
                                      xAxis: bids[0][0],
                                      label: {
                                          show: true,
                                          // https://echarts.apache.org/en/option.html#series-bar.markArea.data.0.label.position
                                          position: 'top',
                                          fontSize: 10,
                                          color: colors.text[resolvedTheme],
                                          formatter: () => `Bids = LPs' ${token0}\nfor traders to swap ${token1} > ${token0}`,
                                      },
                                      itemStyle: {
                                          color: 'green',
                                          opacity: 0.05,
                                      },
                                  },
                                  { xAxis: bids[bids.length - 1][0] },
                              ],
                          ]
                        : undefined,
                },
            },
            {
                yAxisIndex: 1,
                name: 'Asks',
                type: 'line',
                data: asks,
                step: 'end',
                lineStyle: { width: 1.5, color: colors.line[resolvedTheme] },
                symbol: 'circle',
                symbolSize: 4,
                itemStyle: {
                    color: 'red', // Red for asks
                    borderColor: '#f00',
                    borderWidth: 1,
                },
                emphasis: {
                    itemStyle: { color: 'red', borderWidth: 4 },
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(150, 150, 150, 0.5)' }, // light gray at the top
                        { offset: 1, color: 'rgba(150, 150, 150, 0.0)' }, // transparent at the bottom
                    ]),
                },

                // best ask
                markLine: {
                    animation: false,
                    symbol: 'none',
                    data: asks.length
                        ? [
                              {
                                  xAxis: asks[0][0],
                                  lineStyle: { color: 'red', opacity: 0.5 },
                                  label: {
                                      show: true,
                                      color: 'red',
                                      formatter: (params) => `Best ask = 1 ${token1} for ${params.value} ${token0}`,
                                      position: 'insideMiddleBottom',
                                      fontSize: 10,
                                      opacity: 1,
                                  },
                              },
                          ]
                        : undefined,
                },

                // asks area
                markArea: {
                    data: asks.length
                        ? [
                              [
                                  {
                                      xAxis: asks[0][0],
                                      label: {
                                          show: true,
                                          position: 'top',
                                          fontSize: 10,
                                          color: colors.text[resolvedTheme],
                                          formatter: () => `Asks = LPs' ${token1}\nfor traders to swap ${token0} > ${token1}`,
                                      },
                                      itemStyle: {
                                          color: 'red',
                                          opacity: 0.05,
                                      },
                                  },
                                  { xAxis: asks[asks.length - 1][0] },
                              ],
                          ]
                        : undefined,
                },
            },
        ],
    }
}

export default function DepthChart(props: { orderbook: NewOrderbookTrades }) {
    const { resolvedTheme } = useTheme()
    const { storeRefreshedAt, yAxisType, yAxisLogBase, setYAxisType, selectOrderbookDataPoint } = useAppStore()
    const [options, setOptions] = useState<echarts.EChartsOption>(
        getOptions((resolvedTheme ?? DEFAULT_THEME) as AppThemes, '', '', [], [], props.orderbook.pools, yAxisType, yAxisLogBase),
    )

    // load/refresh chart
    useEffect(() => {
        // prepare
        const theme = (resolvedTheme ?? DEFAULT_THEME) as AppThemes

        // asks
        const asks = props.orderbook.trades0to1
            .filter((curr) => !isNaN(curr.ratio * curr.input))
            .filter((trade, tradeIndex, trades) => trades.findIndex((_trade) => _trade.input === trade.input) === tradeIndex)
            .map((trade) => [trade.ratio, trade.input, OrderbookSide.ASK, trade.distribution] as OrderbookDataPoint)
            .sort((curr, next) => Number(curr[0]) - Number(next[0]))

        // bids
        const bids = props.orderbook.trades1to0
            .filter((curr) => !isNaN(curr.ratio * curr.input))
            .filter((trade, tradeIndex, trades) => trades.findIndex((_trade) => _trade.input === trade.input) === tradeIndex)
            .map((trade) => [1 / trade.ratio, trade.input, OrderbookSide.BID, trade.distribution] as OrderbookDataPoint)
            .sort((curr, next) => Number(curr[0]) - Number(next[0]))

        // options
        const newOptions = getOptions(theme, props.orderbook.from.symbol, props.orderbook.to.symbol, bids, asks, props.orderbook.pools, yAxisType, yAxisLogBase)

        // update
        setOptions(newOptions)
    }, [storeRefreshedAt, yAxisType, yAxisLogBase, resolvedTheme])

    // methods
    const handlePointClick = (params: { value: undefined | OrderbookDataPoint }) => {
        if (params.value && Array.isArray(params.value))
            selectOrderbookDataPoint({ datapoint: params.value, bidsPools: props.orderbook.pools, asksPools: props.orderbook.pools })
    }

    return (
        <Suspense fallback={<CustomFallback />}>
            <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
                <ChartBackground className="relative h-[500px]">
                    {!storeRefreshedAt ? (
                        <LoadingArea message="Loading your assets" />
                    ) : Array.isArray(options.series) && options.series?.length > 0 && options.series[0].data ? (
                        <EchartWrapper
                            options={options}
                            onPointClick={(params) => handlePointClick(params as { value: undefined | OrderbookDataPoint })}
                        />
                    ) : (
                        <LoadingArea message="Contact support" />
                    )}
                </ChartBackground>
            </ErrorBoundary>
            <div className="w-full flex flex-col items-start mt-5 text-sm">
                <div className="flex gap-4 items-center">
                <Button text={`yAxisType=${yAxisType}`} onClickFn={() => setYAxisType(yAxisType === 'log' ? 'value' : 'log')} />
                    {yAxisType === 'log' && <p>log base={yAxisLogBase}</p> }
                </div>
            </div>
        </Suspense>
    )
}
