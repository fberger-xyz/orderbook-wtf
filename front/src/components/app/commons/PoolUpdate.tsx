'use client'

import useTimeAgo from '@/hooks/useTimeAgo'

export default function PoolUpdate(props: { lastUpdatedAt: number }) {
    const timeago = useTimeAgo(props.lastUpdatedAt * 1000)
    return <p className="col-span-1 text-milk-600 truncate">{timeago}</p>
}
