'use client'

import { IconIds } from '@/enums'
import { cn } from '@/utils'
import { useState } from 'react'
import IconWrapper from './IconWrapper'

interface InterfaceButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    text: string
    icons?: {
        left?: IconIds
        right?: IconIds
    }
    disabled?: boolean
    focused?: boolean
    onClickFn?: () => void
}

export default function Button(props: InterfaceButtonProps) {
    const [loading, setLoading] = useState(false)
    const handleClick = async () => {
        setLoading(() => true)
        try {
            if (props.onClickFn) await props.onClickFn()
            else await new Promise((resolve) => setTimeout(resolve, 2000)) // feint
        } catch (error) {
            // Silently handle errors to prevent UI disruption
        } finally {
            setLoading(() => false)
        }
    }

    return (
        <button
            className={cn(
                `flex items-center justify-center gap-2.5 rounded-md border border-transparent bg-light-hover px-3 py-1.5 w-fit`,
                {
                    'cursor-wait': loading,
                    'cursor-not-allowed text-inactive': props.disabled,
                    'hover:border-primary hover:text-primary': !props.disabled,
                    'border-primary text-primary': props.focused,
                },
                props.className,
            )}
            onClick={handleClick}
            disabled={loading || props.disabled}
        >
            {props.icons?.left && <IconWrapper icon={props.icons.left} className="my-0.5 size-3.5" />}
            {props.text && <p className="truncate">{`${props.text}${loading ? '...' : ''}`}</p>}
            {props.icons?.right && <IconWrapper icon={props.icons.right} className="my-0.5 size-3.5" />}
        </button>
    )
}
