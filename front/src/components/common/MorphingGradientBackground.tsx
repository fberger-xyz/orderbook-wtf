'use client'

import React, { type ReactNode, useEffect, useLayoutEffect, useState } from 'react'
import { cn } from '@/utils'

interface MorphingGradientBackgroundProps {
    children: ReactNode
    className?: string
}

const styles = {
    gradientOrb: 'rounded-full will-change-transform animate-pulse-slow blur-[120px] sm:blur-[160px] size-72 sm:size-96',
    floatingOrb: 'rounded-full will-change-transform animate-float blur-[60px] sm:blur-[80px] size-32 sm:size-40',
} as const

const gradients = [
    'radial-gradient(at 40% 20%, hsla(210, 45%, 65%, 0.18) 0px, transparent 50%)',
    'radial-gradient(at 80% 0%, hsla(225, 40%, 55%, 0.16) 0px, transparent 50%)',
    'radial-gradient(at 0% 50%, hsla(220, 50%, 40%, 0.18) 0px, transparent 50%)',
    'radial-gradient(at 80% 50%, hsla(215, 40%, 30%, 0.16) 0px, transparent 50%)',
    'radial-gradient(at 0% 100%, hsla(220, 35%, 40%, 0.18) 0px, transparent 50%)',
    'radial-gradient(at 80% 100%, hsla(215, 40%, 35%, 0.16) 0px, transparent 50%)',
    'radial-gradient(at 0% 0%, hsla(210, 40%, 45%, 0.18) 0px, transparent 50%)',
].join(',')

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function MorphingGradientBackground({ children, className }: MorphingGradientBackgroundProps): React.ReactElement<unknown> {
    const [shouldAnimate, setShouldAnimate] = useState(false)
    const [isClient, setIsClient] = useState(false)
    useEffect(() => {
        setIsClient(true)
    }, [])
    useIsomorphicLayoutEffect(() => {
        if (typeof window !== 'undefined') {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            const isLowPerfDevice =
                typeof navigator !== 'undefined' && (navigator.hardwareConcurrency <= 4 || !matchMedia('(min-width: 768px)').matches)
            setShouldAnimate(!prefersReducedMotion && !isLowPerfDevice)
        }
    }, [])
    return (
        <main className={cn('relative flex min-h-screen w-screen flex-col bg-white dark:bg-black', className)}>
            <div
                className={cn(
                    'absolute inset-0 blur-3xl transition-opacity duration-500 will-change-[background-position] opacity-50 dark:opacity-60',
                    isClient && shouldAnimate && 'animate-gradient-morph',
                )}
                style={{
                    backgroundImage: gradients,
                    backgroundSize: '150% 150%',
                    transform: 'translate3d(0,0,0)',
                }}
            />
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {isClient && shouldAnimate && (
                    <>
                        <div
                            className={cn(styles.gradientOrb, '-left-10 -top-10 bg-blue-200/10 dark:bg-[hsl(215,45%,65%)]/15')}
                            style={{ transform: 'translate3d(0,0,0)' }}
                        />
                        <div
                            className={cn(styles.gradientOrb, '-bottom-10 -right-10 bg-blue-300/10 dark:bg-[hsl(225,40%,55%)]/15')}
                            style={{ transform: 'translate3d(0,0,0)' }}
                        />
                        <div
                            className={cn(styles.floatingOrb, 'left-1/4 top-1/4 bg-blue-400/10 dark:bg-[hsl(220,45%,45%)]/15')}
                            style={{ transform: 'translate3d(0,0,0)' }}
                        />
                        <div
                            className={cn(styles.floatingOrb, 'bottom-1/4 right-1/4 bg-blue-500/10 delay-1000 dark:bg-[hsl(215,35%,35%)]/15')}
                            style={{ transform: 'translate3d(0,0,0)' }}
                        />
                    </>
                )}
            </div>
            <div className="relative z-10 flex h-fit w-full flex-col">{children}</div>
        </main>
    )
}
