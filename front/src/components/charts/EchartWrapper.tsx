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
            const dataZoomOptions = currentOptions?.dataZoom ? { grid3D: currentOptions.dataZoom } : {}

            // set option
            // @ts-expect-error: poorly typed
            myChart.current.setOption({ ...props.options, ...dataZoomOptions, ...grid3DOptions }, { notMerge: true })

            // attach click event listener
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            myChart.current.on('click', (params: unknown) => {
                if (props.onPointClick) props.onPointClick(params)
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            myChart.current.on('dataZoom', (params: unknown) => {
                const options = myChart.current?.getOption()
                if (options) {
                    console.log('dataZoom', 'options?.dataZoom', options?.dataZoom)
                } else console.log('dataZoom', { params })
            })
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
