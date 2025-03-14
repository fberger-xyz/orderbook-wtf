'use client'

import * as echarts from 'echarts'
import { ErrorBoundary } from 'react-error-boundary'
import { Suspense, useEffect, useState } from 'react'
import { AppThemes } from '@/enums'
import { useTheme } from 'next-themes'
import EchartWrapper from './EchartWrapper'
import { colors } from '@/config/charts.config'
import { ChartBackground, CustomFallback, LoadingArea } from './ChartsCommons'
import { useAppStore } from '@/stores/app.store'
import { DEFAULT_THEME } from '@/config/app.config'
import { ErrorBoundaryFallback } from '../common/ErrorBoundaryFallback'
import { formatAmount, formatUsdAmount } from '@/utils'

const config = {
    // protocols
    uniswapV2: { title: 'Uniswap v2', color: '#fc72ff' },
    uniswapV3: { title: 'Uniswap v3', color: '#fc74fe' },

    // tokens
    eth: { color: '#0073C3' },
    usdc: { color: '#6f72c8' },
}

const uniswapV3LegendIcon =
    'image://data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect width="10" height="10" fill="%236f72c8"/><rect x="10" width="10" height="10" fill="%230073C3"/></svg>'

const generateData = (lowerBound: number, upperBound: number, increment: number) => {
    const data: {
        x: {
            range: number[]
        }
        y: { uniswap_v2: number[]; uniswap_v3: number[]; total: number[] }
    } = {
        x: {
            range: [],
        },
        y: {
            uniswap_v2: [],
            uniswap_v3: [],
            total: [],
        },
    }
    if (increment <= 0) return data
    for (let i = lowerBound; i <= upperBound; i += increment) {
        data.x.range.push(i)
        const uniswap_v2 = 1
        data.y.uniswap_v2.push(uniswap_v2)
        const uniswap_v3 = Number(parseFloat(String(Math.random())).toFixed(2))
        data.y.uniswap_v3.push(uniswap_v3)
        data.y.total.push(uniswap_v2 + uniswap_v3)
    }
    return data
}

const spotPrice = 2100
const bound = 200
const lowerBound = spotPrice - bound
const granularity = 1
const chartData = generateData(lowerBound, spotPrice + bound, granularity)

const getOptions = (resolvedTheme: AppThemes, token0: string, token1: string): echarts.EChartsOption => {
    return {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow',
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
        },
        legend: {
            top: 20,
            textStyle: {
                color: colors.text[resolvedTheme],
            },
            data: [
                { name: config.uniswapV2.title, itemStyle: { color: config.uniswapV2.color } },
                { name: config.uniswapV3.title, icon: uniswapV3LegendIcon },
            ],
        },
        xAxis: [
            {
                type: 'category',
                boundaryGap: true,
                data: chartData.x.range,
                splitLine: {
                    show: false,
                },
                axisLabel: {
                    margin: 15,
                    hideOverlap: true,
                    showMinLabel: true,
                    showMaxLabel: true,
                    interval: 10, // spacing
                    formatter: (value: string) => formatAmount(value),
                },
                axisLine: {
                    lineStyle: {
                        color: colors.line[resolvedTheme],
                    },
                },
            },
            {
                position: 'bottom', // second x-axis
                offset: 15, // moves it slightly below the main x-axis
                type: 'category',
                boundaryGap: true,
                data: chartData.x.range,
                axisLabel: {
                    margin: 15,
                    hideOverlap: true,
                    showMinLabel: true,
                    showMaxLabel: true,
                    interval: 10, // spacing
                    formatter: (value: string) => formatAmount(1 / Number(value)),
                },
                axisLine: {
                    lineStyle: {
                        color: colors.line[resolvedTheme],
                    },
                },
            },
        ],
        dataZoom: [
            {
                show: true,
                type: 'slider',
                height: 30,
                bottom: '4%',
                startValue: spotPrice - lowerBound - 40,
                endValue: spotPrice - lowerBound + 40,
                fillerColor: 'transparent',
                backgroundColor: 'transparent',
                borderColor: colors.line[resolvedTheme],
                labelFormatter: (index: number) =>
                    `1 ${token0} = ${formatAmount(chartData.x.range[index])} ${token1}\n1 ${token1} = ${formatAmount(1 / Number(chartData.x.range[index]))} ${token0}`,
                textStyle: { color: colors.text[resolvedTheme], fontSize: 11 },
                handleLabel: {
                    show: true,
                },
                dataBackground: {
                    lineStyle: { color: colors.line[resolvedTheme] },
                    areaStyle: { color: 'transparent' },
                },
            },
        ],
        yAxis: [
            {
                type: 'value',
                name: `LPs bids`,
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
                    formatter: (value) => formatUsdAmount(value),
                },
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: colors.line[resolvedTheme],
                    },
                },
                min: 0,
                max: 3,
            },
            {
                type: 'value',
                name: `LPs asks`,
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
                    formatter: (value) => formatUsdAmount(value),
                },
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: colors.line[resolvedTheme],
                    },
                },
                min: 0,
                max: 3,
            },
        ],
        textStyle: {
            color: colors.text[resolvedTheme],
        },
        grid: {
            left: '15%',
            right: '15%',
            top: '80',
            bottom: '120',
        },
        series: [
            {
                yAxisIndex: 0,
                name: 'Total liquidity',
                type: 'line',
                data: chartData.y.total,
                showSymbol: false,
                lineStyle: { width: 1, color: colors.line[resolvedTheme] },
                itemStyle: { opacity: 0 },

                // spot price
                markLine: {
                    animation: true,
                    symbol: 'none',
                    data: [
                        {
                            xAxis: Math.round(spotPrice - lowerBound),
                            lineStyle: { color: colors.text[resolvedTheme], opacity: 0.5 },
                            label: {
                                show: true,
                                color: colors.text[resolvedTheme],
                                formatter: () => `1 ${token0} = ${formatAmount(spotPrice)} ${token1}`,
                                fontSize: 10,
                                opacity: 1,
                            },
                        },
                    ],
                },

                // mark area
                markArea: {
                    data: [
                        [
                            {
                                xAxis: 0,
                                label: {
                                    show: true,
                                    position: 'insideTop',
                                    fontSize: 12,
                                    fontWeight: 'bold',
                                    color: colors.text[resolvedTheme],
                                    formatter: () => `LPs bids in ${token1}`,
                                },
                                itemStyle: {
                                    color: 'green',
                                    opacity: 0.05,
                                },
                            },
                            { xAxis: Math.round(spotPrice - lowerBound) },
                        ],
                        [
                            {
                                xAxis: Math.round(spotPrice - lowerBound),
                                label: {
                                    show: true,
                                    position: 'insideTop',
                                    fontSize: 12,
                                    fontWeight: 'bold',
                                    color: colors.text[resolvedTheme],
                                    formatter: () => `LPs asks in ${token0}`,
                                },
                                itemStyle: {
                                    color: 'red',
                                    opacity: 0.05,
                                },
                            },
                            { xAxis: chartData.x.range[chartData.x.range.length - 1] },
                        ],
                    ],
                },
            },
            {
                yAxisIndex: 0,
                name: config.uniswapV2.title,
                type: 'bar',
                stack: 'Liquidity',
                data: chartData.y.uniswap_v2,
                barWidth: '60%',
                itemStyle: {
                    color: config.uniswapV2.color,
                    borderRadius: 6,
                    // borderColor: config.uniswapV2.color,
                    // borderWidth: 0.4,
                    // borderType: 'solid', // options: 'solid', 'dashed', 'dotted'
                },
            },
            {
                yAxisIndex: 0,
                name: config.uniswapV3.title,
                type: 'bar',
                barWidth: '50%',
                stack: 'Liquidity',
                data: chartData.y.uniswap_v3,
                itemStyle: {
                    color: (params) => {
                        let percentage = 0.5
                        if (chartData.x.range[params.dataIndex] > spotPrice) percentage = 0
                        if (chartData.x.range[params.dataIndex] < spotPrice) percentage = 1
                        return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: config.usdc.color },
                            { offset: percentage, color: config.usdc.color },
                            { offset: percentage, color: config.eth.color },
                            { offset: 1, color: config.eth.color },
                        ])
                    },
                    borderRadius: 6,
                    // borderColor: config.uniswapV3.color,
                    // borderWidth: 0.4,
                    // borderType: 'solid',
                },
            },
        ],
    }
}

export default function ActiveLiquidityChart(props: { token0: string; token1: string; zeroToOne: boolean }) {
    const { resolvedTheme } = useTheme()
    const { storeRefreshedAt } = useAppStore()
    const [options, setOptions] = useState<echarts.EChartsOption>(
        getOptions((resolvedTheme ?? DEFAULT_THEME) as AppThemes, props.token0, props.token1),
    )

    /**
     * methods
     */

    useEffect(() => {
        // prepare
        const theme = (resolvedTheme ?? DEFAULT_THEME) as AppThemes
        const newOptions = getOptions(theme, props.token0, props.token1)

        // update
        setOptions(newOptions)
    }, [storeRefreshedAt, resolvedTheme])

    return (
        <Suspense fallback={<CustomFallback />}>
            <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
                <ChartBackground className="relative h-[600px]">
                    {!storeRefreshedAt ? (
                        <LoadingArea message="Loading your assets" />
                    ) : Array.isArray(options.series) && options.series?.length > 0 && options.series[0].data ? (
                        <EchartWrapper options={options} className="px-4" />
                    ) : (
                        <LoadingArea message="Contact support" />
                    )}
                    <p>todo</p>
                    <p>mettre la somme de liquidité sur le range de prix</p>
                </ChartBackground>
            </ErrorBoundary>
        </Suspense>
    )
}
