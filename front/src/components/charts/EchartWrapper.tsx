'use client'

import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import * as ecStat from 'echarts-stat'
import { cn } from '@/utils'

interface InterfaceEchartWrapperProps {
    options: echarts.EChartsOption
    id?: string
    onPointClick?: (params: unknown) => void
    className?: string
}

export default function EchartWrapper(props: InterfaceEchartWrapperProps) {
    const chartRef = useRef<HTMLDivElement>(null)
    const myChart = useRef<echarts.ECharts | null>(null)

    const handleChartResize = () => myChart.current?.resize()
    const toggleToolbox = (show: boolean) => {
        myChart.current?.setOption({
            toolbox: {
                show: show,
            },
        })
    }

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(echarts as any).registerTransform((ecStat as any).transform.regression)

        // only if ref mounted in dom
        if (chartRef?.current) {
            // ensure chart has been initialised
            if (!myChart.current) myChart.current = echarts.init(chartRef.current)
            // myChart.current = echarts.init(chartRef.current, undefined, { renderer: 'svg' })
            window.addEventListener('resize', handleChartResize, { passive: true })

            // handle toolbox
            chartRef.current.addEventListener('mouseenter', () => toggleToolbox(true))
            chartRef.current.addEventListener('mouseleave', () => toggleToolbox(false))

            // preserve grid3D view settings if they exist
            const currentOptions = myChart.current.getOption()

            // @ts-expect-error: poorly typed
            const grid3DOptions = currentOptions?.grid3D ? { grid3D: currentOptions.grid3D } : {}
            // const dataZoomOptions = currentOptions?.dataZoom ? { dataZoom: currentOptions.dataZoom } : {}

            // set option
            // myChart.current.setOption({ ...props.options, ...dataZoomOptions, ...grid3DOptions }, { notMerge: true })
            myChart.current.setOption(
                // @ts-expect-error: poorly typed
                { ...props.options, ...grid3DOptions },
                {
                    // notMerge: true, // the new option object replaces the existing one completely.
                    notMerge: true, // Default - ECharts merges the new options with the existing ones

                    /**
                     * lazyUpdate?: boolean
                        Default: false
                        What it does:
                        - If true, ECharts will not immediately update the chart after setOption is called.
                        - Instead, it waits until the next frame, allowing multiple setOption calls to be batched for better performance.
                        Use case: Useful when you're calling setOption multiple times in a row and want to avoid unnecessary renders.
                     */
                    lazyUpdate: false,

                    /**
                     * Default: false
                        What it does:
                        When true, calling setOption won’t trigger any event dispatch (like rendered, finished, etc.).
                        Use case: Good for silent updates where you don’t want side effects like re-triggering chart-related events.
                     */
                    silent: true,
                },
            )

            // attach click event listener
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            myChart.current.on('click', (params: unknown) => {
                if (props.onPointClick) props.onPointClick(params)
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            // myChart.current.on('dataZoom', (params: unknown) => {
            //     const options = myChart.current?.getOption()
            //     if (options) {
            //         console.log('dataZoom', 'options?.dataZoom', options?.dataZoom)
            //     } else console.log('dataZoom', { params })
            // })
        }

        return () => {
            if (myChart?.current) {
                // cleanup events listeners
                window.removeEventListener('resize', handleChartResize)
                myChart.current.off('click')
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.options])

    return <div ref={chartRef} className={cn('m-0 p-0', props.className)} style={{ width: '100%', height: '100%', zIndex: -1 }}></div>
}
