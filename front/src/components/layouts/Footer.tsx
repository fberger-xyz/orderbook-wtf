'use client'

import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
dayjs.extend(relativeTime)

import { cn } from '@/utils'

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
        <div className={cn('w-full flex justify-between items-end py-6 px-8 text-milk-600/50 font-light text-sm', props.className)}>
            <div className="flex md:gap-10 flex-col md:flex-row">
                <p>2024 © PropellerHeads</p>
                <p>
                    Alpha Version Notice <span className="opacity-50">{dayjs.utc(commitDate).format('D MMM. YYYY HH:mm A')} UTC</span>
                </p>
            </div>
            <p>Made by PropellerHeads, @xMerso and @fberger_xyz</p>
        </div>
    )
}
