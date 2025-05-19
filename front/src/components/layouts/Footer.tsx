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
import IframeWrapper from '../common/IframeWrapper'
import StyledTooltip from '../common/StyledTooltip'

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
                'w-full flex flex-col lg:flex-row lg:justify-between lg:items-end py-6 px-8 text-milk-400 font-light text-sm gap-6 lg:gap-0 h-[68px]',
                props.className,
            )}
        >
            {/* left */}
            <div className="flex lg:gap-8 flex-col gap-6 lg:flex-row">
                <p className="truncate hidden lg:flex">2025 © PropellerHeads</p>
                <StyledTooltip content={<p>Deployed on {dayjs.utc(commitDate).format('D MMM. YYYY HH:mm A')} UTC</p>}>
                    <p className="truncate hover:underline hover:text-aquamarine">Version 1.1</p>
                </StyledTooltip>
            </div>

            {/* center */}
            <div className="flex lg:gap-8 flex-col gap-6 lg:flex-row">
                <LinkWrapper href={AppUrls.VM_UPTIME} target="_blank" className="cursor-alias hover:underline hover:text-aquamarine">
                    <p>API status</p>
                </LinkWrapper>
                <LinkWrapper href={AppUrls.TYCHO_STATUS} target="_blank" className="cursor-alias hover:underline hover:text-aquamarine">
                    <p>Tycho status</p>
                </LinkWrapper>
            </div>

            {/* right */}
            <p className="text-wrap lg:text-right">
                Made by
                <StyledTooltip placement="top" content={<IframeWrapper src={AppUrls.PROPELLERHEADS_WEBSITE} />}>
                    <LinkWrapper
                        href={AppUrls.PROPELLERHEADS_WEBSITE}
                        target="_blank"
                        className="cursor-alias hover:underline hover:text-aquamarine px-1"
                    >
                        Propeller Heads,
                    </LinkWrapper>
                </StyledTooltip>
                <LinkWrapper href={AppUrls.MERSO_X} target="_blank" className="cursor-alias hover:underline hover:text-aquamarine pr-1">
                    @xMerso
                </LinkWrapper>
                and
                <StyledTooltip placement="top" content={<IframeWrapper src={AppUrls.FBERGER_WEBSITE} />}>
                    <LinkWrapper href={AppUrls.FBERGER_WEBSITE} target="_blank" className="cursor-alias hover:underline hover:text-aquamarine px-1">
                        @fberger_xyz
                    </LinkWrapper>
                </StyledTooltip>
            </p>

            <p className="lg:hidden pb-4">2025 © PropellerHeads</p>
        </div>
    )
}
