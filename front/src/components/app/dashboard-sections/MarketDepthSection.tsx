'use client'

import { IconIds, OrderbookAxisScale, OrderbookOption } from '@/enums'
import { useAppStore } from '@/stores/app.store'
import { cn } from '@/utils'
import { OrderbookComponentLayout } from '../commons/Commons'
import IconWrapper from '@/components/common/IconWrapper'
import DepthChart from '@/components/charts/DepthChart'
import { useRef, useState } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'

type OptionButtonProps = {
    isSelected: boolean
    onClick: () => void
    children: React.ReactNode
}

const OptionButton = ({ isSelected, onClick, children }: OptionButtonProps) => (
    <div
        className={cn('flex items-center gap-2 w-full px-4 py-1.5 rounded-lg transition', {
            'text-white bg-gray-600/20': isSelected,
            'text-milk-400 hover:bg-gray-600/20': !isSelected,
        })}
        onClick={onClick}
    >
        <p className="text-sm mx-auto">{children}</p>
    </div>
)

type ChartOptionProps<T extends OrderbookAxisScale | OrderbookOption> = {
    title: string
    options: T[]
    selectedOption: T
    onSelect: (option: T) => void
    renderOptionLabel?: (option: T) => string
}

const ChartOption = <T extends OrderbookAxisScale | OrderbookOption>({
    title,
    options,
    selectedOption,
    onSelect,
    renderOptionLabel,
}: ChartOptionProps<T>) => (
    <div className="flex flex-col w-full items-start gap-0.5">
        <p className="text-milk-600 text-sm font-semibold">{title}</p>
        <div className="grid grid-cols-2 w-full gap-1">
            {options.map((option, index) => (
                <OptionButton key={`${option}-${index}`} isSelected={selectedOption === option} onClick={() => onSelect(option)}>
                    {renderOptionLabel ? renderOptionLabel(option) : option}
                </OptionButton>
            ))}
        </div>
    </div>
)

export default function MarketDepthSection() {
    const {
        showMarketDepthSection,
        showRoutingSection,
        showLiquidityBreakdownSection,
        showSections,
        yAxisType,
        yAxisLogBase,
        setYAxisType,
        coloredAreas,
        setColoredAreas,
        symbolsInYAxis,
        setSymbolsInYAxis,
    } = useAppStore()

    const [openChartOptions, showChartOptions] = useState(false)
    const chartOptionsDropdown = useRef<HTMLDivElement>(null)
    useClickOutside(chartOptionsDropdown, () => showChartOptions(false))

    const renderYAxisLabel = (type: OrderbookAxisScale) => (type === OrderbookAxisScale.VALUE ? 'Linear' : `Log ${yAxisLogBase}`)

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

                            <div
                                ref={chartOptionsDropdown}
                                className={cn(
                                    'z-20 absolute right-0 mt-2 w-52 rounded-2xl backdrop-blur-lg border border-milk-150 shadow-lg p-3 transition-all origin-top-right flex flex-col gap-5',
                                    {
                                        'scale-100 opacity-100': openChartOptions,
                                        'scale-95 opacity-0 pointer-events-none': !openChartOptions,
                                    },
                                )}
                            >
                                <ChartOption<OrderbookAxisScale>
                                    title="Y Axis scale"
                                    options={[OrderbookAxisScale.VALUE, OrderbookAxisScale.LOG]}
                                    selectedOption={yAxisType}
                                    onSelect={setYAxisType}
                                    renderOptionLabel={renderYAxisLabel}
                                />

                                <ChartOption<OrderbookOption>
                                    title="Colored areas"
                                    options={[OrderbookOption.YES, OrderbookOption.NO]}
                                    selectedOption={coloredAreas}
                                    onSelect={() => setColoredAreas(coloredAreas === OrderbookOption.YES ? OrderbookOption.NO : OrderbookOption.YES)}
                                />

                                <ChartOption<OrderbookOption>
                                    title="Symbols in Y axis labels"
                                    options={[OrderbookOption.YES, OrderbookOption.NO]}
                                    selectedOption={symbolsInYAxis}
                                    onSelect={() =>
                                        setSymbolsInYAxis(symbolsInYAxis === OrderbookOption.YES ? OrderbookOption.NO : OrderbookOption.YES)
                                    }
                                />
                            </div>
                        </button>
                    )}
                </div>
            }
            content={showMarketDepthSection ? <DepthChart /> : null}
        />
    )
}
