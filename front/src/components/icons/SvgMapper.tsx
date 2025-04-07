import MainnetSVG from './chains/mainnet.icon'
import ArbitrumSVG from './chains/arbitrum.icon'
import BaseSVG from './chains/base.icon'
import PancakeSwapV2SVG from './dexes/PancakeSwapV2.icon'
import SushiswapV2SVG from './dexes/SushiswapV2.icon'
import { SvgIds } from '@/enums'
import Image from 'next/image'
import { cn } from '@/utils'
import { ReactNode } from 'react'

function SvgWrapper(props: { children: ReactNode; className?: string }) {
    return <div className={cn('flex items-center justify-center relative', props.className)}>{props.children}</div>
}

export default function SvgMapper(props: { icon?: SvgIds; className?: string }) {
    // chains
    if (props.icon === SvgIds.MAINNET) return <MainnetSVG className={props.className} />
    if (props.icon === SvgIds.ARBITRUM) return <ArbitrumSVG className={props.className} />
    if (props.icon === SvgIds.BASE) return <BaseSVG className={props.className} />

    // dexes
    if (props.icon === SvgIds.BALANCERV2)
        return (
            <SvgWrapper className={props.className}>
                <Image src={'/Balancer.svg'} alt={SvgIds.BALANCERV2} fill />
            </SvgWrapper>
        )
    if (props.icon === SvgIds.CURVE)
        return (
            <SvgWrapper className={props.className}>
                <Image src={'/Curve.svg'} alt={SvgIds.CURVE} fill />
            </SvgWrapper>
        )
    if (props.icon === SvgIds.PANCAKESWAPV2) return <PancakeSwapV2SVG className={props.className} />
    if (props.icon === SvgIds.SUSHISWAPV2) return <SushiswapV2SVG className={props.className} />
    if (props.icon === SvgIds.UNISWAPV2)
        return (
            <SvgWrapper className={props.className}>
                <Image src={'/Uniswap.svg'} alt={SvgIds.UNISWAPV2} fill />
            </SvgWrapper>
        )
    if (props.icon === SvgIds.UNISWAPV3)
        return (
            <SvgWrapper className={props.className}>
                <Image src={'/Uniswap.svg'} alt={SvgIds.UNISWAPV2} fill />
            </SvgWrapper>
        )
    if (props.icon === SvgIds.UNISWAPV4)
        return (
            <SvgWrapper className={props.className}>
                <Image src={'/Uniswap.svg'} alt={SvgIds.UNISWAPV2} fill />
            </SvgWrapper>
        )

    // fallback
    return <span className={cn('rounded-full bg-gray-500', props.className)} />
}
