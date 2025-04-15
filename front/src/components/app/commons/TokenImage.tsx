'use client'

import { Token } from '@/interfaces'
import ImageWrapper from '../../common/ImageWrapper'

export default function TokenImage(props: { token?: Token; className?: string; size?: number }) {
    if (!props.token) return <span className="animate-pulse rounded-full bg-milk-150" style={{ width: props.size, height: props.size }} />
    return (
        <ImageWrapper
            src={`https://raw.githubusercontent.com/bgd-labs/web3-icons/main/icons/full/${props.token.symbol.toLowerCase() ?? ''}.svg`}
            size={props.size ?? 20}
            alt={`Logo of ${props.token.symbol.toLowerCase() ?? 'unknown'}`}
            className={props.className}
        />
    )
}
