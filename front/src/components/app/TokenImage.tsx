'use client'

import ImageWrapper from '../common/ImageWrapper'

export default function TokenImage(props: { tokenSymbol: string; size?: number; className?: string }) {
    return (
        <ImageWrapper
            src={`https://raw.githubusercontent.com/bgd-labs/web3-icons/main/icons/full/${props.tokenSymbol.toLowerCase()}.svg`}
            size={props.size ?? 20}
            alt={`Logo of ${props.tokenSymbol}`}
            className={props.className}
        />
    )
}
