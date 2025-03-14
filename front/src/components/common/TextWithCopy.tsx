'use client'

import { toastStyle } from '@/config/toasts.config'
import { IconIds } from '@/enums'
import { copyToClipboard } from '@/utils'
import { useState } from 'react'
import toast from 'react-hot-toast'
import IconWrapper from './IconWrapper'
import { Tooltip } from '@nextui-org/tooltip'

export default function TextWithCopy(props: { email: string; aum?: number; pnl?: number }) {
    const [copied, setCopied] = useState(false)
    return (
        <Tooltip
            placement="bottom"
            content={
                <div className="flex items-center rounded-md border border-light-hover bg-very-light-hover px-3 py-0.5 text-default">
                    <p>Copy</p>
                </div>
            }
        >
            <button
                onClick={() => {
                    copyToClipboard(String(props.email))
                    setCopied(true)
                    toast.success(`Email copied`, { style: toastStyle })
                    setTimeout(() => {
                        setCopied(false)
                    }, 1000)
                }}
                className="group flex items-center gap-3 rounded-md bg-light-hover px-3 py-2  font-bold"
            >
                <p>{props.email}</p>
                {copied ? (
                    <IconWrapper icon={IconIds.CHECKMARK} className="size-6 text-primary" />
                ) : (
                    <IconWrapper icon={IconIds.COPY} className="size-6 text-inactive group-hover:text-default" />
                )}
            </button>
        </Tooltip>
    )
}
