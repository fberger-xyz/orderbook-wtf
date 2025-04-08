'use client'

import { IconIds, OrderbookAxisScale, OrderbookOption } from '@/enums'
import { useAppStore } from '@/stores/app.store'
import { cn } from '@/utils'
import { OrderbookComponentLayout } from './Layouts'
import IconWrapper from '@/components/common/IconWrapper'
import DepthChart from '@/components/charts/DepthChart'
import { useRef, useState } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'

export default function MarketDepthSection() {
    /**
     * zustand
     */

    const {
        /**
         * ui
         */

        showMarketDepthSection,
        showRoutingSection,
        showLiquidityBreakdownSection,
        showSections,

        /**
         * orderbook
         */

        // data
        // loadedOrderbooks,
        // saveLoadedOrderbook,

        // chart
        yAxisType,
        yAxisLogBase,
        setYAxisType,
        // setYAxisLogBase,
        coloredAreas,
        setColoredAreas,
        symbolsInYAxis,
        setSymbolsInYAxis,
    } = useAppStore()

    const [openChartOptions, showChartOptions] = useState(false)
    const chartOptionsDropdown = useRef<HTMLDivElement>(null)
    useClickOutside(chartOptionsDropdown, () => showChartOptions(false))

    /**
     * logic to improve
     */

    return (
        <OrderbookComponentLayout
            title={
                <div className="w-full flex justify-between">
                    <button
                        onClick={() => showSections(!showMarketDepthSection, showRoutingSection, showLiquidityBreakdownSection)}
                        className="flex gap-1 items-center rounded-lg px-2.5 py-1.5 hover:bg-milk-100/5 transition-colors duration-300 -ml-1"
                    >
                        <p className="text-milk text-base font-semibold">Market depth</p>
                        <IconWrapper icon={showMarketDepthSection ? IconIds.TRIANGLE_UP : IconIds.TRIANGLE_DOWN} className="size-4" />
                    </button>
                    {showMarketDepthSection && (
                        <button onClick={() => showChartOptions(!openChartOptions)} className="relative">
                            <div className="flex items-center gap-1 hover:bg-milk-100/5 transition-colors duration-300 rounded-lg px-2.5 py-1.5">
                                <p className="text-milk text-sm">Settings</p>
                                <IconWrapper icon={IconIds.TRIANGLE_DOWN} className="size-4" />
                            </div>

                            {/* options dropdown */}
                            {/* todo make it open left aligned */}
                            <div
                                ref={chartOptionsDropdown}
                                className={cn(
                                    // `z-20 absolute mt-2 w-52 rounded-2xl backdrop-blur-lg border border-milk-150 shadow-lg p-3 transition-all origin-top-left flex flex-col gap-5`,
                                    `z-20 absolute right-0 mt-2 w-52 rounded-2xl backdrop-blur-lg border border-milk-150 shadow-lg p-3 transition-all origin-top-right flex flex-col gap-5`,
                                    {
                                        'scale-100 opacity-100': openChartOptions,
                                        'scale-95 opacity-0 pointer-events-none': !openChartOptions,
                                    },
                                )}
                            >
                                {/* option */}
                                <div className="flex flex-col w-full items-start gap-0.5">
                                    <p className="text-milk-600 text-sm font-semibold">Y Axis scale</p>
                                    <div className="grid grid-cols-2 w-full gap-1">
                                        {[OrderbookAxisScale.VALUE, OrderbookAxisScale.LOG].map((type, typeIndex) => (
                                            <div
                                                key={`${type}-${typeIndex}`}
                                                className={cn('flex items-center gap-2 w-full px-4 py-1.5 rounded-lg transition', {
                                                    'text-white bg-gray-600/20': yAxisType === type,
                                                    'text-milk-400 hover:bg-gray-600/20': yAxisType !== type,
                                                })}
                                                onClick={() => setYAxisType(type)}
                                            >
                                                <p className="text-sm mx-auto">
                                                    {type === OrderbookAxisScale.VALUE ? 'Linear' : `Log ${yAxisLogBase}`}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* option */}
                                <div className="flex flex-col w-full items-start gap-0.5">
                                    <p className="text-milk-600 text-sm font-semibold">Colored areas</p>
                                    <div className="grid grid-cols-2 w-full gap-1">
                                        {[OrderbookOption.YES, OrderbookOption.NO].map((option, optionIndex) => (
                                            <div
                                                key={`${option}-${optionIndex}`}
                                                className={cn('flex items-center gap-2 w-full px-4 py-1.5 rounded-lg transition', {
                                                    'text-white bg-gray-600/20': coloredAreas === option,
                                                    'text-milk-400 hover:bg-gray-600/20': coloredAreas !== option,
                                                })}
                                                onClick={() =>
                                                    setColoredAreas(coloredAreas === OrderbookOption.YES ? OrderbookOption.NO : OrderbookOption.YES)
                                                }
                                            >
                                                <p className="text-sm mx-auto">{option}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* titles */}
                                <div className="flex flex-col w-full items-start gap-0.5">
                                    <p className="text-milk-600 text-sm font-semibold">Symbols in Y axis labels</p>
                                    <div className="grid grid-cols-2 w-full gap-1">
                                        {[OrderbookOption.YES, OrderbookOption.NO].map((option, optionIndex) => (
                                            <div
                                                key={`${option}-${optionIndex}`}
                                                className={cn('flex items-center gap-2 w-full px-4 py-1.5 rounded-lg transition', {
                                                    'text-white bg-gray-600/20': symbolsInYAxis === option,
                                                    'text-milk-400 hover:bg-gray-600/20': symbolsInYAxis !== option,
                                                })}
                                                onClick={() =>
                                                    setSymbolsInYAxis(
                                                        symbolsInYAxis === OrderbookOption.YES ? OrderbookOption.NO : OrderbookOption.YES,
                                                    )
                                                }
                                            >
                                                <p className="text-sm mx-auto">{option}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </button>
                    )}
                </div>
            }
            content={showMarketDepthSection ? <DepthChart /> : null}
        />
    )
}
