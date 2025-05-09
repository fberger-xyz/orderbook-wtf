'use client'

import { IconIds, OrderbookAxisScale, OrderbookOption } from '@/enums'
import { useAppStore } from '@/stores/app.store'
import { cn } from '@/utils'
import { OrderbookComponentLayout } from '../commons/Commons'
import IconWrapper from '@/components/common/IconWrapper'
import DepthChart from '@/components/charts/DepthChart'
import { useRef, useState } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import StyledTooltip from '@/components/common/StyledTooltip'

// todo find a better semantic to avoid buttons inside a parent button
const OptionButton = ({ isSelected, onClick, children }: { isSelected: boolean; onClick: () => void; children: React.ReactNode }) => (
    <div
        className={cn('flex items-center gap-2 w-full px-4 py-1.5 rounded-lg transition cursor-pointer', {
            'text-white bg-gray-600/20 backdrop-blur': isSelected,
            'text-milk-400 hover:bg-gray-600/20 hover:backdrop-blur': !isSelected,
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
        showSteps,
        setSteps,
        // filterOutSolverInconsistencies,
        // setFilterOutSolverInconsistencies,
        coloredAreas,
        setColoredAreas,
        symbolsInYAxis,
        setSymbolsInYAxis,
    } = useAppStore()

    const [openChartOptions, showChartOptions] = useState(false)
    const chartOptionsDropdown = useRef<HTMLButtonElement>(null)
    useClickOutside(chartOptionsDropdown, () => showChartOptions(false))

    return (
        <OrderbookComponentLayout
            title={
                <div className="w-full flex justify-between">
                    <button
                        // onClick={() => showSections(!showMarketDepthSection, showRoutingSection, showLiquidityBreakdownSection)}
                        // className="flex gap-1 items-center rounded-lg px-2.5 py-1.5 hover:bg-milk-100/5 transition-colors duration-300 -ml-1"
                        className="flex gap-1 items-center rounded-lg py-1.5 -ml-1"
                    >
                        <p className="text-milk text-base font-semibold">Market depth</p>
                        <StyledTooltip
                            placement="bottom"
                            disableAnimation
                            content={
                                <div className="flex flex-col gap-2 max-w-80">
                                    <p className="text-wrap">
                                        This chart shows the onchain liquidity depth by simulating increasingly large swaps, to obtain prices,
                                        slippage and price impact.
                                    </p>
                                    <p className="text-wrap">
                                        Pool logic, gas fees, and liquidity depth determine the final price and vary by swap path, solver performance,
                                        and network.
                                    </p>
                                    <p className="text-wrap">
                                        Why not straight lines and inwards ? Our default solver optimises paths with dynamic criteria, sometimes
                                        causing inconsistent quotes. Also, small swaps suffer more from gas costs.
                                    </p>
                                    <p className="text-wrap">
                                        The default Rust solver uses simple routing, but a custom solver running locally can be used and visualized
                                        with the Tycho Orderbook SDK.
                                    </p>
                                </div>
                            }
                        >
                            <div className="mx-0.5">
                                <IconWrapper icon={IconIds.INFORMATION} className="size-4 text-milk-200 hover:text-milk cursor-pointer" />
                            </div>
                        </StyledTooltip>
                        {/* <IconWrapper icon={showMarketDepthSection ? IconIds.TRIANGLE_UP : IconIds.TRIANGLE_DOWN} className="size-4" /> */}
                    </button>
                    {/* {showMarketDepthSection && ( */}
                    <button ref={chartOptionsDropdown} onClick={() => showChartOptions(!openChartOptions)} className="relative">
                        <div className="flex items-center gap-1 hover:bg-milk-100/5 transition-colors duration-300 rounded-lg px-2.5 py-1.5 cursor-pointer z-50">
                            <IconWrapper icon={IconIds.SETTINGS} className="size-4" />
                        </div>
                        <div
                            className={cn(
                                'absolute right-0 mt-1 w-52 rounded-xl border border-milk-150 shadow-lg p-3 transition-all origin-top-right flex flex-col gap-5 bg-milk-50 backdrop-blur-lg',
                                {
                                    'z-50 opacity-100': openChartOptions,
                                    'opacity-0 pointer-events-none': !openChartOptions,
                                },
                            )}
                        >
                            <ChartOption<OrderbookOption>
                                title="Show steps"
                                options={[OrderbookOption.YES, OrderbookOption.NO]}
                                selectedOption={showSteps}
                                onSelect={() => setSteps(showSteps === OrderbookOption.YES ? OrderbookOption.NO : OrderbookOption.YES)}
                            />
                            {/* <ChartOption<OrderbookOption>
                                title="Filter inconsistencies"
                                options={[OrderbookOption.YES, OrderbookOption.NO]}
                                selectedOption={filterOutSolverInconsistencies}
                                onSelect={() =>
                                    setFilterOutSolverInconsistencies(
                                        filterOutSolverInconsistencies === OrderbookOption.YES ? OrderbookOption.NO : OrderbookOption.YES,
                                    )
                                }
                            /> */}
                            <ChartOption<OrderbookOption>
                                title="Color areas"
                                options={[OrderbookOption.YES, OrderbookOption.NO]}
                                selectedOption={coloredAreas}
                                onSelect={() => setColoredAreas(coloredAreas === OrderbookOption.YES ? OrderbookOption.NO : OrderbookOption.YES)}
                            />
                            <ChartOption<OrderbookOption>
                                title="Show symbols on Y axis"
                                options={[OrderbookOption.YES, OrderbookOption.NO]}
                                selectedOption={symbolsInYAxis}
                                onSelect={() => setSymbolsInYAxis(symbolsInYAxis === OrderbookOption.YES ? OrderbookOption.NO : OrderbookOption.YES)}
                            />
                        </div>
                    </button>
                    {/* )} */}
                </div>
            }
            content={showMarketDepthSection ? <DepthChart /> : null}
        />
    )
}
