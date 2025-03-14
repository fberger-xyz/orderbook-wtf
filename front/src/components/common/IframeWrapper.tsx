'use client'

import { useState } from 'react'

const IframeWrapper: React.FC<{
    src: string
    width?: string
    height?: string
}> = ({ src, width = 'w-full', height = 'h-[300px]' }) => {
    const [isLoading, setIsLoading] = useState(true)

    const handleLoad = () => {
        setIsLoading(false)
    }

    return (
        <div className={`relative ${width} ${height}`}>
            {isLoading && (
                <div className="absolute inset-0 z-10 flex animate-pulse items-center justify-center bg-background">
                    <div className="size-10 animate-spin rounded-full border-4 border-secondary border-t-primary" />
                </div>
            )}
            <iframe
                src={src}
                className={`absolute left-0 top-0 rounded-md border border-inactive hover:border-blue-500 ${width} ${height}`}
                onLoad={handleLoad}
            ></iframe>
        </div>
    )
}

export default IframeWrapper
