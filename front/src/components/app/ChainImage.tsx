'use client'

import ImageWrapper from '../common/ImageWrapper'

export default function ChainImage(props: { networkName: string; size?: number; className?: string }) {
    return (
        <ImageWrapper
            src={`https://app.1inch.io/assets/images/network-logos/${props.networkName}.svg`}
            size={props.size ?? 20}
            alt={`Logo of ${props.networkName}`}
            className={props.className}
        />
    )
}
