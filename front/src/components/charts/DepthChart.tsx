'use client'

import * as echarts from 'echarts'
import { ErrorBoundary } from 'react-error-boundary'
import { Suspense, useEffect, useState } from 'react'
import { OrderbookOption, OrderbookSide, SvgIds } from '@/enums'
import EchartWrapper from './EchartWrapper'
import { ChartBackground, CustomFallback, LoadingArea } from './ChartsCommons'
import { useAppStore } from '@/stores/app.store'
import { APP_FONT } from '@/config/app.config'
import { ErrorBoundaryFallback } from '../common/ErrorBoundaryFallback'
import {
    AppColors,
    bestSideSymbol,
    formatAmount,
    formatAmountDependingOnPrice,
    getHighestBid,
    getLowestAsk,
    mapProtocolIdToProtocolConfig,
} from '@/utils'
import { AmmAsOrderbook, EchartOnClickParamsData, SelectedTrade } from '@/interfaces'
import numeral from 'numeral'
import toast from 'react-hot-toast'
import { toastStyle } from '@/config/toasts.config'
import { useApiStore } from '@/stores/api.store'

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
        case SvgIds.UNISWAPV3:
        case SvgIds.UNISWAPV4:
            return '/Uniswap.svg'
        // add more if needed
        default:
            return null
    }
}

const getOptions = (
    orderbook: AmmAsOrderbook,
    bids: LineDataPoint[],
    asks: LineDataPoint[],
    yAxisType: 'value' | 'log',
    yAxisLogBase: number,
    coloredAreas: OrderbookOption,
    symbolsInYAxis: OrderbookOption,
    selectedTrade?: SelectedTrade,
): echarts.EChartsOption => {
    return {
        tooltip: {
            trigger: 'axis',
            triggerOn: 'mousemove|click',
            backgroundColor: AppColors.jagger[800],
            borderRadius: 6,
            axisPointer: {
                type: 'line',
                snap: true,
                lineStyle: {
                    color: AppColors.milk.DEFAULT,
                    width: 2,
                    type: 'dotted',
                },
            },
            borderColor: 'transparent',
            textStyle: {
                fontSize: 12,
                color: AppColors.milk.DEFAULT,
            },
            extraCssText: 'backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);',
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
                    `<span style="color:${AppColors.milk[400]}">Price impact: ${numeral(custom?.priceImpact).format('0,0.[00]%')}</span>`,
                    distributionSection,
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
                    backgroundColor: AppColors.jagger[800],
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
                bottom: '3%',
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
                left: '10%',
                right: '10%',
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
                    formatter: (value) =>
                        symbolsInYAxis === OrderbookOption.YES ? `${formatAmount(value)} ${orderbook.base.symbol}` : `${formatAmount(value)}`,
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
                    formatter: (value) =>
                        symbolsInYAxis === OrderbookOption.YES ? `${formatAmount(value)} ${orderbook.quote.symbol}` : `${formatAmount(value)}`,
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
            fontFamily: APP_FONT.style.fontFamily,
        },
        grid: {
            left: '7%',
            right: '7%',
            top: selectedTrade ? '40' : '20',
            bottom: '100',
        },
        series: [
            {
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
                markLine: selectedTrade?.trade
                    ? {
                          symbol: ['circle', 'none'],
                          animation: false,
                          data: [
                              {
                                  symbolSize: 6,
                                  lineStyle: {
                                      color: AppColors.aquamarine,
                                      opacity: 1,
                                  },
                                  xAxis: Number(selectedTrade.xAxis),
                                  label: {
                                      formatter: (bidMarlineParams) => {
                                          return [
                                              `${numeral(selectedTrade.amountIn).format('0.0,[000]')} ${orderbook.base.symbol}`,
                                              `at ${bidMarlineParams.value} ${orderbook.base.symbol}/${orderbook.quote.symbol}`,
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
                // markLine:
                //     selectedTrade?.trade && selectedTrade.side === OrderbookSide.ASK
                //         ? {
                //               symbol: ['circle', 'none'],
                //               animation: false,
                //               data: [
                //                   {
                //                       symbolSize: 6,
                //                       lineStyle: {
                //                           color: AppColors.folly,
                //                           opacity: 1,
                //                       },
                //                       xAxis: selectedTrade.xAxis,
                //                       // xAxis: selectedTrade.trade?.average_sell_price,
                //                       label: {
                //                           formatter: (askMarlineParams) => {
                //                               return [
                //                                   `${numeral(selectedTrade.amountIn).format('0.0,[000]')} ${orderbook.quote.symbol}`,
                //                                   `at ${askMarlineParams.value} ${orderbook.base.symbol}/${orderbook.quote.symbol}`,
                //                                   `= ${selectedTrade.trade?.output ? `${numeral(selectedTrade.trade?.output).format('0,0.[000]')} ${orderbook.base.symbol}` : '...computing'}`,
                //                               ].join('\n')
                //                           },
                //                           color: AppColors.folly,
                //                           show: true,
                //                           position: 'end',
                //                           fontSize: 10,
                //                           opacity: 0.8,
                //                       },
                //                   },
                //               ],
                //           }
                //         : undefined,
            },
        ],
    }
}

export default function DepthChart() {
    const {
        buyToken,
        sellToken,
        storeRefreshedAt,
        yAxisType,
        yAxisLogBase,
        coloredAreas,
        symbolsInYAxis,
        selectedTrade,
        selectOrderbookTrade,
        getAddressPair,
        // switchSelectedTokens,
    } = useAppStore()
    const { apiStoreRefreshedAt, getOrderbook } = useApiStore()
    const [options, setOptions] = useState<null | echarts.EChartsOption>(null)

    useEffect(() => {
        const orderbook = getOrderbook(getAddressPair())
        if (orderbook?.bids && orderbook?.asks) {
            const highestBid = getHighestBid(orderbook)
            const lowestAsk = getLowestAsk(orderbook)
            const bids: LineDataPoint[] = orderbook?.bids
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
                            borderColor: AppColors.jagger[500],
                            color: AppColors.aquamarine,
                            shadowBlur: 15,
                            shadowColor: 'rgba(144, 238, 144, 1)',
                        }
                    }
                    return point
                })
            const asks: LineDataPoint[] = orderbook?.asks
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
                            borderColor: AppColors.jagger[500],
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

            const newOptions = getOptions(orderbook, bids, asks, yAxisType, yAxisLogBase, coloredAreas, symbolsInYAxis, selectedTrade)

            setOptions(newOptions)
        } else {
            setOptions(null)
        }
    }, [apiStoreRefreshedAt, yAxisType, yAxisLogBase, coloredAreas, symbolsInYAxis, selectedTrade])

    const handlePointClick = (params: undefined | { data: EchartOnClickParamsData; dataIndex: number }) => {
        const debug = false
        const fnName = 'handlePointClick'
        if (params?.data) {
            // debug
            if (debug) console.log('---------')
            if (debug) console.log(fnName, 'ok data', params?.data)

            const key = `${sellToken.address}-${buyToken.address}`
            const orderbook = getOrderbook(key)
            if (orderbook) {
                // debug
                if (debug) console.log(fnName, 'ok orderbook')

                // find
                const side = params.data.customData?.side

                // prevent errors
                if (!side) return
                if (side === OrderbookSide.ASK) {
                    toast(`Can't select asks, only bids.`, { style: toastStyle })
                    return
                }

                // debug
                if (debug) console.log(fnName, 'ok side', side)

                const trade =
                    side === OrderbookSide.BID
                        ? orderbook.bids.find((bid) => String(bid.amount) === String(params.data.value[1]))
                        : orderbook.asks.find((ask) => String(ask.amount) === String(params.data.value[1]))

                // prevent errors
                if (!trade) return

                // notify
                toast.success(`New trade selected`, { style: toastStyle })

                // debug
                if (debug) console.log(fnName, 'ok trade', trade)

                // update markline
                selectOrderbookTrade({
                    selectedAt: Date.now(),
                    side: params.data?.customData.side,
                    amountIn: params.data.value[1],
                    pools: orderbook.pools,
                    trade,
                    xAxis: trade.average_sell_price,
                })
            }
        } else {
            if (debug) console.log(fnName, 'missing data in params')
        }
    }

    return (
        <Suspense fallback={<CustomFallback />}>
            <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
                <ChartBackground className="relative h-[400px]">
                    {!storeRefreshedAt ? (
                        <LoadingArea />
                    ) : options && Array.isArray(options.series) && options.series?.length > 0 && options.series[0].data ? (
                        <EchartWrapper
                            options={options}
                            onPointClick={(params) => handlePointClick(params as undefined | { data: EchartOnClickParamsData; dataIndex: number })}
                        />
                    ) : (
                        <LoadingArea />
                    )}
                </ChartBackground>
            </ErrorBoundary>
        </Suspense>
    )
}
