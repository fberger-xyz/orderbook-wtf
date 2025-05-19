'use client'

import * as echarts from 'echarts'
import { ErrorBoundary } from 'react-error-boundary'
import { Suspense, useEffect, useRef, useState } from 'react'
import { OrderbookOption, OrderbookSide, SvgIds } from '@/enums'
import EchartWrapper from './EchartWrapper'
import { ChartBackground, CustomFallback, LoadingArea } from './ChartsCommons'
import { useAppStore } from '@/stores/app.store'
import { INTER_FONT } from '@/config/app.config'
import { ErrorBoundaryFallback } from '../common/ErrorBoundaryFallback'
import {
    AppColors,
    bestSideSymbol,
    cleanOutput,
    formatAmount,
    formatAmountDependingOnPrice,
    getHighestBid,
    getLowestAsk,
    mapProtocolIdToProtocolConfig,
} from '@/utils'
import { AmmAsOrderbook, AmmTrade, EchartOnClickParamsData, SelectedTrade } from '@/interfaces'
import numeral from 'numeral'
import toast from 'react-hot-toast'
import { toastStyle } from '@/config/toasts.config'
import { useApiStore } from '@/stores/api.store'
import dayjs from 'dayjs'

type LineDataPoint = {
    value: [number, number]
    symbol?: string
    symbolSize?: number
    customData?: {
        side: OrderbookSide
        distribution: number[]
        output: number
        priceImpact: number
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

const mapSvgIdToImagePath = (svgId?: SvgIds): string | null => {
    switch (svgId) {
        case SvgIds.BALANCERV2:
            return '/Balancer.svg'
        case SvgIds.CURVE:
            return '/Curve.svg'
        case SvgIds.UNISWAPV2:
            return '/Uniswap.svg'
        case SvgIds.UNISWAPV3:
            return '/Uniswap.svg'
        case SvgIds.UNISWAPV4:
            return '/Uniswap.svg'
        case SvgIds.PANCAKESWAPV2:
            return '/PancakeSwap.svg'
        case SvgIds.CURVE:
            return '/Curve.svg'
        case SvgIds.SUSHISWAPV2:
            return '/Sushiswap.svg'
        default:
            return null
    }
}

const getOptions = (
    orderbook: AmmAsOrderbook,
    bids: LineDataPoint[],
    asks: LineDataPoint[],
    showSteps: OrderbookOption,
    yAxisType: 'value' | 'log',
    yAxisLogBase: number,
    coloredAreas: OrderbookOption,
    symbolsInYAxis: OrderbookOption,
    selectedTrade?: SelectedTrade,
    hoveredOrderbookTrade?: AmmTrade,
): echarts.EChartsOption => {
    return {
        tooltip: {
            trigger: 'axis',
            appendToBody: true,
            triggerOn: 'mousemove|click',
            backgroundColor: '#FFF4E005',
            borderRadius: 12,
            axisPointer: {
                type: 'line',
                snap: true,
                lineStyle: {
                    color: AppColors.milk.DEFAULT,
                    width: 2,
                    type: 'dotted',
                },
            },
            borderColor: AppColors.milk[200],
            textStyle: {
                fontSize: 12,
                color: AppColors.milk.DEFAULT,
            },
            extraCssText: 'backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding:12px;',
            formatter: (params) => {
                // cast
                const [firstSerieDataPoints] = Array.isArray(params) ? params : [params]

                // prepare
                const { value, data } = firstSerieDataPoints
                const [price, input] = value as [number, number]
                const custom = (data as LineDataPoint).customData
                const sellTokenSymbol = custom?.side === OrderbookSide.BID ? orderbook.base.symbol : orderbook.quote.symbol
                const buyTokenSymbol = custom?.side === OrderbookSide.BID ? orderbook.quote.symbol : orderbook.base.symbol
                const distribution = custom?.distribution ?? []
                const output = custom?.output ?? 0

                // map distrib
                const distributionLines = distribution
                    .map((percent, percentIndex) => {
                        const pool = orderbook.pools[percentIndex]
                        if (!pool) return null
                        const config = mapProtocolIdToProtocolConfig(pool.protocol_type_name)
                        const iconPath = mapSvgIdToImagePath(config.svgId)
                        const iconOrProtocolName = iconPath
                            ? `<div style="
                                display:flex;
                                justify-content:center;
                                align-items:center;
                                padding:2px;
                                border-radius:9999px;
                                border:1px solid ${AppColors.milk[200]};
                                background-color:rgba(255,255,255,0.1);
                            ">
                                <img src="${iconPath}" width="11" height="11" style="display:block;" />
                            </div>`
                            : `<span>${config.name}</span>`

                        const versionAndBps = iconPath
                            ? `<span>${config.version} ${pool.fee} bp${pool.fee >= 2 ? 's' : ''}</span>`
                            : `<span>${pool.fee} bp${pool.fee >= 2 ? 's' : ''}</span>`

                        return {
                            percent,
                            // > 0.5 = 1 because of rounding
                            htmlContent: `<div style="display:flex; align-items:center; gap:5px; color:${percent > 0.5 ? AppColors.milk[600] : AppColors.milk[200]}">
                                <span>- ${numeral(percent).format('0,0')}% </span>
                                ${iconOrProtocolName}
                                ${versionAndBps}
                            </div>`,
                        }
                    })
                    .filter((line) => !!line)

                const distributionSection = [
                    `<br/><strong>Routing</strong> <span style="color:${AppColors.milk[200]}"></span>`,
                    `<div style="display:flex; flex-direction:column; gap:0">`,
                    ...distributionLines.sort((curr, next) => next.percent - curr.percent).map((curr) => curr.htmlContent),
                    `</div>`,
                ].join('')

                return [
                    `<strong>You sell</strong> <span style="color:${AppColors.milk[200]}">see Y axis</span>`,
                    `<span style="color:${AppColors.milk[600]}">${formatAmountDependingOnPrice(input, price)} ${sellTokenSymbol}</span>`,
                    `<br/><strong>At price</strong> <span style="color:${AppColors.milk[200]}">see X axis</span>`,
                    `<span style="color:${AppColors.milk[600]}">1 ${orderbook.base.symbol} = ${numeral(price).format('0,0.[00000]')} ${orderbook.quote.symbol}</span>`,
                    `<span style="color:${AppColors.milk[600]}">1 ${orderbook.quote.symbol} = ${numeral(1 / price).format('0,0.[00000]')} ${orderbook.base.symbol}</span>`,
                    `<br/><strong>You buy</strong>`,
                    `<span style="color:${AppColors.milk[600]}">${formatAmountDependingOnPrice(output, price)} ${buyTokenSymbol}</span>`,
                    `<span style="color:${AppColors.milk[400]}">Price impact: ${cleanOutput(numeral(custom?.priceImpact).format('0,0.[00]%'), 'none')}</span>`,
                    distributionSection,
                    `<span style="color:${AppColors.milk[400]}">Simulated at ${dayjs.utc(orderbook.timestamp * 1000).format('HH:mm:ss A')} UTC</span>`,
                ].join('<br/>')
            },
        },
        toolbox: {
            top: -5,
            show: false,
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
        xAxis: {
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
            // min: (value) => Math.min(value.min, Number(selectedTrade?.xAxis ?? Infinity)) * 0.98,
            // max: (value) => Math.max(value.max, Number(selectedTrade?.xAxis ?? -Infinity)) * 1.02,
            axisPointer: {
                show: true,
                label: {
                    show: true,
                    margin: 10,
                    padding: [6, 10],
                    fontSize: 11,
                    borderRadius: 4,
                    formatter: (param) => {
                        const value = Number(param.value)
                        return [
                            `1 ${orderbook.base.symbol} = ${formatAmount(value)} ${orderbook.quote.symbol}`,
                            `1 ${orderbook.quote.symbol} = ${formatAmount(1 / value)} ${orderbook.base.symbol}`,
                        ].join('\n')
                    },
                    backgroundColor: '#FFF4E005',
                    color: AppColors.milk.DEFAULT,
                    borderColor: 'transparent',
                },
            },
        },
        dataZoom: [
            {
                xAxisIndex: 0,
                show: true,
                type: 'slider',
                height: 25,
                bottom: 30,
                backgroundColor: AppColors.milk[50],
                fillerColor: 'transparent',
                borderColor: AppColors.milk[200],
                labelFormatter: (basePriceInQuote: number) =>
                    `${formatAmount(basePriceInQuote)} ${orderbook.quote.symbol}\n${formatAmount(1 / Number(basePriceInQuote))} ${orderbook.base.symbol}`,
                textStyle: { color: AppColors.milk[200], fontSize: 10 },
                handleLabel: { show: true },
                dataBackground: { lineStyle: { color: 'transparent' }, areaStyle: { color: 'transparent' } },
                selectedDataBackground: { lineStyle: { color: AppColors.milk[200] }, areaStyle: { color: AppColors.milk[50] } },
                brushStyle: { color: 'transparent' },
                handleStyle: { color: AppColors.milk[600], borderColor: AppColors.milk[600] },
                moveHandleStyle: { color: AppColors.milk[200] },
                emphasis: {
                    handleLabel: { show: true },
                    moveHandleStyle: { color: AppColors.milk[400] },
                },
                rangeMode: ['value', 'value'],
                left: 90,
                right: 90,
            },
            {
                xAxisIndex: 0,
                type: 'inside',
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
                    formatter: (value) => {
                        if (value > 1000) value = Math.round(value)
                        if (symbolsInYAxis === OrderbookOption.YES) return `${formatAmount(value)} ${orderbook.base.symbol}`
                        return `${formatAmount(value)}`
                    },
                },
                axisLine: {
                    show: false,
                },
                axisPointer: {
                    snap: true,
                },
                min: 0,
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
                    formatter: (value) => {
                        if (value > 1000) value = Math.round(value)
                        if (symbolsInYAxis === OrderbookOption.YES) return `${formatAmount(value)} ${orderbook.quote.symbol}`
                        return `${formatAmount(value)}`
                    },
                },
                axisLine: {
                    show: false,
                },
                axisPointer: {
                    snap: true,
                },
                min: 0,
                max: 'dataMax',
            },
        ],
        textStyle: {
            color: AppColors.milk[600],
            fontFamily: INTER_FONT.style.fontFamily,
        },
        grid: {
            left: symbolsInYAxis === OrderbookOption.YES ? 85 : 45,
            right: symbolsInYAxis === OrderbookOption.YES ? 85 : 45,
            top: selectedTrade ? '40' : '20',
            bottom: 110,
        },
        series: [
            {
                step: showSteps === OrderbookOption.YES ? 'end' : undefined,
                yAxisIndex: 0,
                name: 'Bids',
                type: 'line',
                data: bids,
                smooth: true,
                lineStyle: { width: 0.5, color: AppColors.aquamarine, opacity: 0.5 },
                symbol: 'circle',
                symbolSize: 8,
                itemStyle: {
                    color: AppColors.background,
                    borderColor: AppColors.aquamarine,
                    borderWidth: 2,
                },
                emphasis: {
                    itemStyle: { color: AppColors.aquamarine, borderColor: AppColors.aquamarine, borderWidth: 4 },
                },
                areaStyle:
                    coloredAreas === OrderbookOption.NO
                        ? undefined
                        : {
                              opacity: 0.4,
                              color: {
                                  type: 'linear',
                                  x: 0,
                                  y: 0,
                                  x2: 0,
                                  y2: 1,
                                  colorStops: [
                                      { offset: 0, color: AppColors.aquamarine },
                                      { offset: 1, color: 'transparent' },
                                  ],
                              },
                          },
                markLine: hoveredOrderbookTrade
                    ? {
                          symbol: ['circle', 'none'],
                          animation: false,
                          data: [
                              {
                                  name: 'Hovered orderbook trade',
                                  symbolSize: 6,
                                  lineStyle: {
                                      color: AppColors.aquamarine,
                                      opacity: 1,
                                  },
                                  xAxis: Math.max(0, Number(hoveredOrderbookTrade.average_sell_price)),
                                  label: {
                                      formatter: (bidMarklineParams) => {
                                          return [
                                              `${numeral(hoveredOrderbookTrade.amount).format('0.0,[000]')} ${orderbook.base.symbol}`,
                                              `at ${bidMarklineParams.value} ${orderbook.base.symbol}/${orderbook.quote.symbol}`,
                                              `= ${hoveredOrderbookTrade.output ? `${numeral(hoveredOrderbookTrade.output).format('0,0.[000]')} ${orderbook.quote.symbol}` : '...computing'}`,
                                          ].join('\n')
                                      },
                                      color: AppColors.aquamarine,
                                      show: true,
                                      position: 'end',
                                      fontSize: 10,
                                      opacity: 0.8,
                                  },
                              },
                          ],
                      }
                    : selectedTrade?.trade && selectedTrade.trade?.output && Number(selectedTrade.xAxis) > 0
                      ? {
                            symbol: ['circle', 'none'],
                            animation: false,
                            data: [
                                {
                                    name: 'Best bid',
                                    symbolSize: 6,
                                    lineStyle: {
                                        color: AppColors.aquamarine,
                                        opacity: 1,
                                    },
                                    xAxis: Math.max(0, Number(selectedTrade.xAxis)),
                                    label: {
                                        formatter: (bidMarklineParams) => {
                                            //   console.log({ bidMarklineParams })
                                            return [
                                                `${numeral(selectedTrade.amountIn).format('0.0,[000]')} ${orderbook.base.symbol}`,
                                                `at ${bidMarklineParams.value} ${orderbook.base.symbol}/${orderbook.quote.symbol}`,
                                                `= ${selectedTrade.trade?.output ? `${numeral(selectedTrade.trade.output).format('0,0.[000]')} ${orderbook.quote.symbol}` : '...computing'}`,
                                            ].join('\n')
                                        },
                                        color: AppColors.aquamarine,
                                        show: true,
                                        position: 'end',
                                        fontSize: 10,
                                        opacity: 0.8,
                                    },
                                },
                            ],
                        }
                      : undefined,
            },
            {
                step: showSteps === OrderbookOption.YES ? 'end' : undefined,
                yAxisIndex: 1,
                name: 'Asks',
                type: 'line',
                data: asks,
                smooth: true,
                lineStyle: { width: 0.5, color: AppColors.folly, opacity: 0.5 },
                symbol: 'circle',
                symbolSize: 8,
                itemStyle: {
                    color: AppColors.background,
                    borderColor: AppColors.folly,
                    borderWidth: 2,
                },
                emphasis: {
                    itemStyle: { color: AppColors.folly, borderColor: AppColors.folly, borderWidth: 4 },
                },
                areaStyle:
                    coloredAreas === OrderbookOption.NO
                        ? undefined
                        : {
                              opacity: 0.3,
                              color: {
                                  type: 'linear',
                                  x: 0,
                                  y: 0,
                                  x2: 0,
                                  y2: 1,
                                  colorStops: [
                                      { offset: 0, color: AppColors.folly },
                                      { offset: 1, color: 'transparent' },
                                  ],
                              },
                          },
                markLine: hoveredOrderbookTrade
                    ? {
                          symbol: ['circle', 'none'],
                          animation: false,
                          data: [
                              {
                                  name: 'Hovered orderbook trade',
                                  symbolSize: 6,
                                  lineStyle: {
                                      color: AppColors.folly,
                                      opacity: 1,
                                  },
                                  xAxis: Math.max(0, Number(1 / hoveredOrderbookTrade.average_sell_price)),
                                  label: {
                                      formatter: (askMarklineParams) => {
                                          return [
                                              `${numeral(hoveredOrderbookTrade.amount).format('0.0,[000]')} ${orderbook.quote.symbol}`,
                                              `at ${askMarklineParams.value} ${orderbook.quote.symbol}/${orderbook.quote.symbol}`,
                                              `= ${hoveredOrderbookTrade.output ? `${numeral(hoveredOrderbookTrade.output).format('0,0.[000]')} ${orderbook.base.symbol}` : '...computing'}`,
                                          ].join('\n')
                                      },
                                      color: AppColors.folly,
                                      show: true,
                                      position: 'end',
                                      fontSize: 10,
                                      opacity: 0.8,
                                  },
                              },
                          ],
                      }
                    : undefined,
            },
        ],
    }
}

export default function DepthChart() {
    const {
        currentChainId,
        buyToken,
        sellToken,
        storeRefreshedAt,
        showSteps,
        filterOutSolverInconsistencies,
        yAxisType,
        yAxisLogBase,
        coloredAreas,
        symbolsInYAxis,
        selectedTrade,
        hoveredOrderbookTrade,
        selectTrade,
        getAddressPair,
        setSellTokenAmountInputRaw,
        setSellTokenAmountInput,
    } = useAppStore()
    const { apiStoreRefreshedAt, metrics, actions } = useApiStore()
    const [options, setOptions] = useState<null | echarts.EChartsOption>(null)
    const lastDataZoom = useRef<[number, number] | null>(null)

    useEffect(() => {
        // prevent further computations
        if (!metrics) return setOptions(null)

        // get possibly undefined orderbook
        const orderbook = actions.getOrderbook(getAddressPair())
        if (orderbook?.bids && orderbook?.asks) {
            const highestBid = getHighestBid(orderbook)
            const lowestAsk = getLowestAsk(orderbook)
            let bids: LineDataPoint[] = orderbook?.bids
                .filter((trade, tradeIndex, trades) => trades.findIndex((_trade) => _trade.amount === trade.amount) === tradeIndex)
                .sort((curr, next) => curr.average_sell_price * curr.amount - next.average_sell_price * next.amount)
                .map((trade) => {
                    const point: LineDataPoint = {
                        value: [trade.average_sell_price, trade.amount],
                        customData: {
                            side: OrderbookSide.BID,
                            distribution: trade.distribution,
                            output: trade.average_sell_price * trade.amount,
                            priceImpact: trade.price_impact,
                        },
                        emphasis: {
                            symbolSize: 30,
                            itemStyle: {
                                shadowBlur: 10,
                                borderWidth: 0.5,
                                shadowColor: 'rgba(144, 238, 144, 1)',
                            },
                        },
                    }
                    if (trade === highestBid) {
                        point.symbol = bestSideSymbol
                        point.symbolSize = 20
                        point.itemStyle = {
                            borderWidth: 1,
                            borderColor: '#FFF4E005',
                            color: AppColors.aquamarine,
                            shadowBlur: 15,
                            shadowColor: 'rgba(144, 238, 144, 1)',
                        }
                    }
                    return point
                })

            let asks: LineDataPoint[] = orderbook?.asks
                .filter((trade, tradeIndex, trades) => trades.findIndex((_trade) => _trade.amount === trade.amount) === tradeIndex)
                .sort((curr, next) => curr.average_sell_price * curr.amount - next.average_sell_price * next.amount)

                .map((trade) => {
                    const point: LineDataPoint = {
                        value: [1 / trade.average_sell_price, trade.amount],
                        customData: {
                            side: OrderbookSide.ASK,
                            distribution: trade.distribution,
                            output: trade.average_sell_price * trade.amount,
                            priceImpact: trade.price_impact,
                        },
                    }
                    if (trade === lowestAsk) {
                        point.symbol = bestSideSymbol
                        point.symbolSize = 20
                        point.itemStyle = {
                            borderWidth: 1,
                            borderColor: '#FFF4E005',
                            color: AppColors.folly,
                            shadowBlur: 15,
                            shadowColor: 'rgba(255, 0, 128, 1)',
                        }
                        point.emphasis = {
                            symbolSize: 30,
                            itemStyle: {
                                shadowBlur: 10,
                                shadowColor: 'rgba(255, 0, 128, 1)',
                                borderWidth: 0.5,
                            },
                        }
                    }
                    return point
                })

            // filter out inconsistencies
            if (filterOutSolverInconsistencies === OrderbookOption.YES) {
                bids = bids.filter((curr, currIndex, all) => (currIndex + 1 < all.length ? curr.value[0] > all[currIndex + 1].value[0] : true))
                asks = asks.filter((curr, currIndex, all) => (currIndex + 1 < all.length ? curr.value[0] < all[currIndex + 1].value[0] : true))
            }

            const newOptions = getOptions(
                orderbook,
                bids,
                asks,
                showSteps,
                yAxisType,
                yAxisLogBase,
                coloredAreas,
                symbolsInYAxis,
                selectedTrade,
                hoveredOrderbookTrade,
            )

            // capture the previous zoom
            if (lastDataZoom.current && newOptions?.dataZoom && Array.isArray(newOptions.dataZoom)) {
                newOptions.dataZoom[0].startValue = lastDataZoom.current[0]
                newOptions.dataZoom[0].endValue = lastDataZoom.current[1]
            }

            // update
            setOptions(newOptions)
        } else setOptions(null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        currentChainId,
        metrics,
        apiStoreRefreshedAt,
        showSteps,
        filterOutSolverInconsistencies,
        yAxisType,
        yAxisLogBase,
        coloredAreas,
        symbolsInYAxis,
        selectedTrade,
        hoveredOrderbookTrade,
    ])

    const handlePointClick = (params: undefined | { data: EchartOnClickParamsData; dataIndex: number }) => {
        if (!params?.data) return

        const key = `${sellToken.address}-${buyToken.address}`
        const orderbook = actions.getOrderbook(key)
        if (!orderbook) return

        const side = params.data.customData?.side
        if (!side || side === OrderbookSide.ASK) {
            if (side === OrderbookSide.ASK) {
                toast(`Can't select asks, only bids.`, { style: toastStyle })
            }
            return
        }

        const trade = orderbook.bids.find((bid) => String(bid.amount) === String(params.data.value[1]))
        if (!trade) return

        toast.success(`New ${side} trade selected`, { style: toastStyle })

        selectTrade({
            selectedAt: Date.now(),
            side: params.data.customData.side,
            amountIn: params.data.value[1],
            pools: orderbook.pools,
            trade,
            xAxis: trade.average_sell_price,
        })
        setSellTokenAmountInputRaw(params.data.value[1])
        setSellTokenAmountInput(params.data.value[1])
    }

    return (
        <Suspense fallback={<CustomFallback />}>
            <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
                <ChartBackground className="relative h-[450px]">
                    {!storeRefreshedAt ? (
                        <LoadingArea />
                    ) : options && Array.isArray(options.series) && options.series?.length > 0 && options.series[0].data ? (
                        <>
                            <p className="text-milk-400 text-xs">Click any green bid dot to autofill the swap panel</p>
                            <EchartWrapper
                                options={options}
                                onPointClick={(params) =>
                                    handlePointClick(params as undefined | { data: EchartOnClickParamsData; dataIndex: number })
                                }
                                onDataZoomChange={(start, end) => {
                                    lastDataZoom.current = [start, end]
                                }}
                            />
                        </>
                    ) : (
                        <LoadingArea />
                    )}
                </ChartBackground>
            </ErrorBoundary>
        </Suspense>
    )
}
