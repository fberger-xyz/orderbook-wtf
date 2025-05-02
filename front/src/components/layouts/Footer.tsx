'use client'

import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
dayjs.extend(relativeTime)

import { cn } from '@/utils'
import LinkWrapper from '../common/LinkWrapper'
import { AppUrls, IconIds } from '@/enums'
import IconWrapper from '../common/IconWrapper'
import { Tooltip } from '@nextui-org/tooltip'
import IframeWrapper from '../common/IframeWrapper'

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
                <p className="truncate">2024 © PropellerHeads</p>
                <p className="truncate">
                    Alpha Version Notice <span className="opacity-50">deployed on {dayjs.utc(commitDate).format('D MMM. YYYY HH:mm A')} UTC</span>
                </p>
                <LinkWrapper href={AppUrls.VM_UPTIME} target="_blank" className="cursor-alias hover:underline hover:text-aquamarine">
                    <p>API status</p>
                </LinkWrapper>
                <LinkWrapper href={AppUrls.DOCUMENTATION} target="_blank" className="flex items-center gap-1 cursor-alias sm:hidden">
                    <p>Docs</p>
                    <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-4" />
                </LinkWrapper>
            </div>
            <p className="text-wrap truncate">
                Made by
                <Tooltip
                    placement="top"
                    content={
                        <div className="-mb-1 rounded-xl p-3 shadow-lg backdrop-blur">
                            <IframeWrapper src={AppUrls.PROPELLERHEADS_WEBSITE} />
                        </div>
                    }
                >
                    <LinkWrapper
                        href={AppUrls.PROPELLERHEADS_WEBSITE}
                        target="_blank"
                        className="cursor-alias hover:underline hover:text-aquamarine px-1"
                    >
                        PropellerHeads
                    </LinkWrapper>
                </Tooltip>
                ,
                <LinkWrapper href={AppUrls.MERSO_X} target="_blank" className="cursor-alias hover:underline hover:text-aquamarine px-1">
                    @xMerso
                </LinkWrapper>
                and
                <Tooltip
                    placement="top"
                    content={
                        <div className="-mb-1 rounded-xl p-3 shadow-lg backdrop-blur">
                            <IframeWrapper src={AppUrls.FBERGER_WEBSITE} />
                        </div>
                    }
                >
                    <LinkWrapper href={AppUrls.FBERGER_WEBSITE} target="_blank" className="cursor-alias hover:underline hover:text-aquamarine px-1">
                        @fberger_xyz
                    </LinkWrapper>
                </Tooltip>
            </p>
        </div>
    )
}
