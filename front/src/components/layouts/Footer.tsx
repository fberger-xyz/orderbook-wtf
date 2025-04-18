'use client'

import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
dayjs.extend(relativeTime)

import { cn } from '@/utils'
import LinkWrapper from '../common/LinkWrapper'
import { AppUrls } from '@/enums'

export default function Footer(props: { className?: string }) {
    const [commitDate, setCommitDate] = useState<null | Date>(null)
    useEffect(() => {
        const timestamp = process.env.NEXT_PUBLIC_COMMIT_TIMESTAMP
        if (timestamp) {
            const date = new Date(parseInt(timestamp, 10) * 1000)
            setCommitDate(date)
        }
    }, [])
    if (!commitDate) return null
    return (
        <div
            className={cn(
                'w-full flex flex-col lg:flex-row lg:justify-between lg:items-end py-6 px-8 text-milk-600/50 font-light text-sm gap-4 lg:gap-0',
                props.className,
            )}
        >
            <div className="flex lg:gap-10 flex-col gap-4 lg:flex-row">
                <p>2024 © PropellerHeads</p>
                <p>
                    Alpha Version Notice <span className="opacity-50">deployed on {dayjs.utc(commitDate).format('D MMM. YYYY HH:mm A')} UTC</span>
                </p>
                <LinkWrapper href={AppUrls.VM_UPTIME} target="_blank" className="cursor-alias hover:underline hover:text-aquamarine">
                    <p>API status</p>
                </LinkWrapper>
            </div>
            <p className="text-wrap">
                Made by
                <LinkWrapper href={AppUrls.PROPELLERHEADS_X} target="_blank" className="cursor-alias hover:underline hover:text-aquamarine pl-1">
                    PropellerHeads
                </LinkWrapper>
                ,
                <LinkWrapper href={AppUrls.MERSO_X} target="_blank" className="cursor-alias hover:underline hover:text-aquamarine px-1">
                    @xMerso
                </LinkWrapper>
                and
                <LinkWrapper href={AppUrls.FBERGER_X} target="_blank" className="cursor-alias hover:underline hover:text-aquamarine px-1">
                    @fberger_xyz
                </LinkWrapper>
            </p>
        </div>
    )
}
