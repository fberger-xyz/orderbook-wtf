'use client'

import { bestSideSymbol } from '@/utils'
import { useEffect, useRef, useState } from 'react'

export default function BestSideIcon({ size = 24, color = 'currentColor' }) {
    const pathRef = useRef<SVGPathElement>(null)
    const [viewBox, setViewBox] = useState('0 0 24 24')

    useEffect(() => {
        if (pathRef.current) {
            const box = pathRef.current.getBBox()
            setViewBox(`${box.x} ${box.y} ${box.width} ${box.height}`)
        }
    }, [])

    const d = bestSideSymbol.replace(/^path:\/\//, '')

    return (
        <svg width={size} height={size} viewBox={viewBox} fill={color} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <path d={d} ref={pathRef} />
        </svg>
    )
}
