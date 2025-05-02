'use client'

import { useState } from 'react'

const IframeWrapper: React.FC<{
    src: string
    width?: string
    height?: string
}> = ({ src, width = 'w-[300px] md:w-[600px] lg:w-[800px]', height = 'h-[400px]' }) => {
    const [isLoading, setIsLoading] = useState(true)

    const handleLoad = () => {
        // toast.success('Preview loaded', { style: toastStyle }) // if need be
        setIsLoading(false)
    }

    return (
        <div className={`relative z-10 ${width} ${height}`}>
            {isLoading && (
                <div className="absolute inset-0 z-10 flex animate-pulse items-center justify-center bg-background">
                    <div className="size-10 animate-spin rounded-full border-4 border-secondary border-t-primary" />
                </div>
            )}
            <iframe src={src} className={`absolute left-0 top-0 z-10 rounded-xl border-4 border-background ${width} ${height}`} onLoad={handleLoad} />
        </div>
    )
}

export default IframeWrapper
