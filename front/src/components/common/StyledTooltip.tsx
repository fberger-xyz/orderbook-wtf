'use client'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
dayjs.extend(relativeTime)
import { Tooltip } from '@nextui-org/tooltip'
import { ReactNode } from 'react'
import { cn } from '@/utils'

export default function StyledTooltip({
    placement = 'top',
    ...props
}: {
    content: ReactNode
    children: ReactNode
    placement?:
        | 'top'
        | 'bottom'
        | 'right'
        | 'left'
        | 'top-start'
        | 'top-end'
        | 'bottom-start'
        | 'bottom-end'
        | 'left-start'
        | 'left-end'
        | 'right-start'
        | 'right-end'
    disableAnimation?: boolean
    className?: string
}) {
    return (
        <Tooltip
            placement={placement}
            disableAnimation={props.disableAnimation}
            content={
                <div
                    className={cn(
                        'rounded-xl bg-[#FFF4E00A] backdrop-blur-lg border border-milk-200 shadow-lg p-3 -mt-1 text-milk text-sm flex will-change-transform',
                        props.className,
                    )}
                >
                    {props.content}
                </div>
            }
        >
            {props.children}
        </Tooltip>
    )
}
