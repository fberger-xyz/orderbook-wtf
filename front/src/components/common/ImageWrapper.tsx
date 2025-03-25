'use client'

import { cn } from '@/utils'
import Image from 'next/image'
import { useState } from 'react'

export default function ImageWrapper({ src, alt = 'missing alt', size, className }: { src: string; alt?: string; size: number; className?: string }) {
    // handle invalid src
    const [imgError, setImgError] = useState(false)
    if (imgError || !src) return <span className={cn('rounded-full bg-gray-500', className)} style={{ width: size, height: size }} />

    // valid src
    return <Image src={src} alt={alt} width={size} height={size} className={cn('object-cover', className)} onError={() => setImgError(true)} />
}
