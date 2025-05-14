'use client'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import { Tooltip } from '@nextui-org/tooltip'
import { ReactNode } from 'react'
import { cn } from '@/utils'

dayjs.extend(utc)
dayjs.extend(relativeTime)

type TooltipPlacement =
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

interface StyledTooltipProps {
    content: ReactNode
    children: ReactNode
    placement?: TooltipPlacement
    disableAnimation?: boolean
    className?: string
    delay?: number
    closeDelay?: number
    showArrow?: boolean
    isDisabled?: boolean
}

export default function StyledTooltip({
    content,
    children,
    placement = 'top',
    disableAnimation = false,
    className,
    delay = 0,
    closeDelay = 0,
    showArrow = true,
    isDisabled = false,
}: StyledTooltipProps) {
    return (
        <Tooltip
            placement={placement}
            disableAnimation={disableAnimation}
            delay={delay}
            closeDelay={closeDelay}
            showArrow={showArrow}
            isDisabled={isDisabled}
            content={
                <div
                    className={cn(
                        'z-[9999] rounded-xl bg-[#FFF4E00A] backdrop-blur-lg border border-milk-200 shadow-lg p-3 -mt-1 text-milk text-sm flex will-change-transform',
                        className,
                    )}
                    role="tooltip"
                >
                    {content}
                </div>
            }
        >
            {children}
        </Tooltip>
    )
}
