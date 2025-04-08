import { IconIds } from '@/enums'
import { cn } from '@/utils'
import IconWrapper from '../common/IconWrapper'
import { ReactNode } from 'react'

export function LoadingArea() {
    return (
        <div className="flex size-full bg-very-light-hover px-2 skeleton-loading items-center justify-center rounded-xl">
            <div className="flex flex-col gap-2">
                <IconWrapper icon={IconIds.LOADING} className="text-inactive mx-auto size-10 text-milk-400" />
            </div>
        </div>
    )
}

export function CustomFallback({ loadingText = 'Loading...' }: { loadingText?: string }) {
    return (
        <div className="flex size-full items-center justify-center">
            <p className="text-orange-400">{loadingText}</p>
        </div>
    )
}

export function ChartBackground(props: { children: ReactNode; className?: string }) {
    return <div className={cn('w-full z-0', props.className)}>{props.children}</div>
}

export function ChartLayout({ ...props }: { title: string; subtitle?: string; chart: ReactNode; className?: string }) {
    return (
        <div className={cn('flex w-full flex-col items-center', props.className)}>
            <p className="mx-auto truncate font-semibold text-primary">{props.title}</p>
            {props.subtitle && <p className={cn('mx-auto truncate pb-0.5 text-inactive text-xs')}>{props.subtitle}</p>}
            {props.chart}
        </div>
    )
}
