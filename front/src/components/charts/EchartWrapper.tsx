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

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(echarts as any).registerTransform((ecStat as any).transform.regression)

        // only if ref mounted in dom
        if (chartRef?.current) {
            // ensure chart has been initialised
            // if (!myChart.current) myChart.current = echarts.init(chartRef.current)
            myChart.current = echarts.init(chartRef.current, undefined, { renderer: 'svg' })
            window.addEventListener('resize', handleChartResize, { passive: true })

            // preserve grid3D view settings if they exist
            const currentOptions = myChart.current.getOption()

            // @ts-expect-error: poorly typed
            const grid3DOptions = currentOptions?.grid3D ? { grid3D: currentOptions.grid3D } : {}

            // set option
            // @ts-expect-error: poorly typed
            myChart.current.setOption({ ...props.options, ...grid3DOptions }, { notMerge: true })

            // attach click event listener
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            myChart.current.on('click', (params: unknown) => {
                if (props.onPointClick) props.onPointClick(params)
            })
        }

        return () => {
            if (myChart?.current) {
                // cleanup events listeners
                window.removeEventListener('resize', handleChartResize)
                myChart.current.off('click')
            }
        }
    }, [props.options])

    return <div ref={chartRef} className={cn('m-0 p-0', props.className)} style={{ width: '100%', height: '100%', zIndex: -1 }}></div>
}
