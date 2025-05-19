import { cn } from '@/utils'
import { ReactNode } from 'react'

interface FeatureCardProps {
    className?: string
    text: ReactNode
    svg: ReactNode
}

export const FeatureCard = ({ className, text, svg }: FeatureCardProps) => {
    return (
        <div
            className="gap-2 border border-milk-50 rounded-xl relative overflow-hidden w-full backdrop-blur-sm"
            style={{ background: 'rgba(255, 244, 224, 0.02)' }}
        >
            <div className={cn('flex p-8 gap-2 overflow-hidden', className)}>
                {text}
                {svg}
            </div>
        </div>
    )
}