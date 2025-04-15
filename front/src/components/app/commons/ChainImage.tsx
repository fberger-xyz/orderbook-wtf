'use client'

import ImageWrapper from '../../common/ImageWrapper'

export default function ChainImage(props: { oneInchId: string; size?: number; className?: string }) {
    return (
        <ImageWrapper
            src={`https://app.1inch.io/assets/images/network-logos/${props.oneInchId}.svg`}
            size={props.size ?? 20}
            alt={`Logo of ${props.oneInchId}`}
            className={props.className}
        />
    )
}
