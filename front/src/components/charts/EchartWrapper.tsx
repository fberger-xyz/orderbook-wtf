'use client'

import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import * as ecStat from 'echarts-stat'
import { cn } from '@/utils'

interface InterfaceEchartWrapperProps {
    options: echarts.EChartsOption
    id?: string
    onPointClick?: (params: unknown) => void
    onDataZoomChange?: (start: number, end: number) => void
    className?: string
}

export default function EchartWrapper(props: InterfaceEchartWrapperProps) {
    const chartRef = useRef<HTMLDivElement>(null)
    const myChart = useRef<echarts.ECharts | null>(null)

    const handleChartResize = () => myChart.current?.resize()

    // ! causes a rerender that prevents datazoom cache
    // const toggleToolbox = (show: boolean) => {
    //     myChart.current?.setOption({
    //         toolbox: {
    //             show: show,
    //         },
    //     })
    // }

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(echarts as any).registerTransform((ecStat as any).transform.regression)

        // only if ref mounted in dom
        if (chartRef?.current) {
            // ensure chart has been initialised
            if (!myChart.current) myChart.current = echarts.init(chartRef.current)
            window.addEventListener('resize', handleChartResize, { passive: true })

            // handle toolbox
            // ! causes a rerender that prevents datazoom cache
            // chartRef.current.addEventListener('mouseenter', () => toggleToolbox(true))
            // chartRef.current.addEventListener('mouseleave', () => toggleToolbox(false))

            // set option
            myChart.current.setOption(
                // @ts-expect-error: poorly typed
                props.options,
                {
                    // notMerge: false, // false = the new option object replaces the existing one completely.
                    notMerge: true, // true, default = ECharts merges the new options with the existing ones.

                    /**
                     * lazyUpdate?: boolean
                        Default: false
                        What it does:
                        - If true, ECharts will not immediately update the chart after setOption is called.
                        - Instead, it waits until the next frame, allowing multiple setOption calls to be batched for better performance.
                        Use case: Useful when you're calling setOption multiple times in a row and want to avoid unnecessary renders.
                     */
                    lazyUpdate: true,

                    /**
                     * Default: false
                        What it does:
                        When true, calling setOption won’t trigger any event dispatch (like rendered, finished, etc.).
                        Use case: Good for silent updates where you don’t want side effects like re-triggering chart-related events.
                     */
                    silent: false,
                },
            )

            // attach click event listener
            myChart.current.on('click', (params: unknown) => {
                if (props.onPointClick) props.onPointClick(params)
            })

            // attach dataZoom event listener
            myChart.current.on('dataZoom', () => {
                const option = myChart.current?.getOption()
                const zoom = option?.dataZoom?.[0]
                const xAxisArray = option?.xAxis as echarts.EChartOption.XAxis[] | undefined

                let startValue = zoom?.startValue
                let endValue = zoom?.endValue

                if ((startValue === undefined || endValue === undefined) && xAxisArray && Array.isArray(xAxisArray)) {
                    const xAxis = xAxisArray[0]
                    const min = typeof xAxis.min === 'number' ? xAxis.min : 0
                    const max = typeof xAxis.max === 'number' ? xAxis.max : 1
                    const startPercent = zoom?.start ?? 0
                    const endPercent = zoom?.end ?? 100

                    startValue = min + (max - min) * (startPercent / 100)
                    endValue = min + (max - min) * (endPercent / 100)
                }

                if (props.onDataZoomChange && typeof startValue === 'number' && typeof endValue === 'number') {
                    props.onDataZoomChange(startValue, endValue)
                }
            })
        }

        return () => {
            if (myChart?.current) {
                // cleanup events listeners
                window.removeEventListener('resize', handleChartResize)
                myChart.current.off('click')
                myChart.current.off('dataZoom')
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.options])

    return <div ref={chartRef} className={cn('m-0 p-0', props.className)} style={{ width: '100%', height: '100%' }}></div>
}
