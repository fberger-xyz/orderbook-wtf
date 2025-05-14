import IconWrapper from '@/components/common/IconWrapper'
import LinkWrapper from '@/components/common/LinkWrapper'
import PageWrapper from '@/components/common/PageWrapper'
import { SvgWrapper } from '@/components/icons/SvgMapper'
import { AppUrls, IconIds } from '@/enums'
import { cn } from '@/utils'
import Image from 'next/image'
import { ReactNode } from 'react'

const FeatureCard = (props: { className?: string; text: ReactNode; svg: ReactNode }) => {
    return (
        <div className="gap-2 border border-milk-100 rounded-xl relative w-full overflow-hidden">
            <div className={cn('flex p-8 gap-2 w-full overflow-hidden h-[328px]', props.className)}>
                {props.text}
                {props.svg}
            </div>
            <div
                className="absolute bottom-0 size-[2000px] backdrop-blur -left-[800px] -top-[100px]"
                style={{
                    zIndex: -1,
                    background: 'linear-gradient(to right, rgba(255, 209, 27, 0.01), rgba(255, 0, 79, 0.04))',
                }}
            />
        </div>
    )
}

export default function Page() {
    return (
        <PageWrapper className="mt-14">
            <div className="flex flex-col w-full gap-24 items-center">
                {/* tagline */}
                <div className="flex max-w-[824px] flex-col gap-6 items-center">
                    <p className="text-6xl font-bold text-center">See and trade on DEXs in orderbook format</p>
                    <p className="text-center max-w-[648px] font-light">
                        Orderbook.wtf aggregates simulated trades over all DEX pools so you can see the shape of all liquidity in one orderbook.
                    </p>
                    <div className="flex gap-2">
                        <LinkWrapper
                            href={AppUrls.ORDERBOOK}
                            className="bg-folly px-4 py-2.5 rounded-xl opacity-90 hover:opacity-100 transition-all duration-300 ease-in-out w-fit flex gap-2 items-center"
                        >
                            <p className="text-milk">See DEXs as an orderbook</p>
                            <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-4" />
                        </LinkWrapper>
                        <LinkWrapper
                            href={AppUrls.DOCUMENTATION}
                            target="_blank"
                            className="flex items-center gap-2 px-4 py-2.5 cursor-alias w-max bg-milk-100/5 hover:bg-milk-100/10 transition-colors duration-300 rounded-xl"
                        >
                            <p className="text-milk text-sm truncate">Docs</p>
                            <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-4" />
                        </LinkWrapper>
                    </div>
                </div>

                {/* cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 w-full gap-7 max-w-screen-xl sm:px-8">
                    {/* 1 */}
                    <FeatureCard
                        text={
                            <div className="flex gap-2 flex-col z-50">
                                <p className="font-bold text-lg">Orderbook</p>
                                <p className="font-light text-milk-400 text-sm max-w-[278px]">
                                    On-chain liquidity visualized as discrete price-volume points, simulating real limit orders.
                                </p>
                            </div>
                        }
                        svg={
                            <div className="w-[270px] absolute top-4 -right-4 rounded-xl p-2">
                                <SvgWrapper className="w-[270px] h-80">
                                    <Image src={'about-orderbook.svg'} alt={'orderbook'} fill className="rounded-xl" />
                                </SvgWrapper>
                            </div>
                        }
                    />

                    {/* 2 */}
                    <FeatureCard
                        className="flex-col"
                        text={
                            <div className="flex gap-2 flex-col z-50">
                                <p className="font-bold text-lg">Depth</p>
                                <p className="font-light text-milk-400 text-sm">Aggregated buy/sell levels, reconstructed into a CEX-style chart.</p>
                            </div>
                        }
                        svg={
                            <div className="rounded-xl flex p-1 bg-background/50 mt-6">
                                <SvgWrapper className="w-[576px] h-[215px]">
                                    <Image src={'about-depth.svg'} alt={'depth'} fill className="rounded-xl" />
                                </SvgWrapper>
                            </div>
                        }
                    />

                    {/* 3 */}
                    <FeatureCard
                        className="flex-col"
                        text={
                            <div className="flex gap-2 flex-col z-50">
                                <p className="font-bold text-lg">Routing</p>
                                <p className="font-light text-milk-400 text-sm">
                                    See how trades are split for best execution: pools used, amounts, and pathing.
                                </p>
                            </div>
                        }
                        svg={
                            <div className="rounded-xl flex p-1 bg-background/50">
                                <SvgWrapper className="w-[586px] h-[148px]">
                                    <Image src={'about-routing.svg'} alt={'routing'} fill className="rounded-xl" />
                                </SvgWrapper>
                            </div>
                        }
                    />

                    {/* 4 */}
                    <FeatureCard
                        className="flex-col"
                        text={
                            <div className="flex gap-2 flex-col z-50">
                                <p className="font-bold text-lg">Liquidity</p>
                                <p className="font-light text-milk-400 text-sm">
                                    Explore TVL by pool, track where liquidity comes from and how it evolves.
                                </p>
                            </div>
                        }
                        svg={
                            <div className="rounded-xl flex p-1 bg-background/50 w-[1000px] mt-10">
                                <SvgWrapper className="w-[600px] h-[190px]">
                                    <Image src={'about-liquidity.svg'} alt={'liquidity'} fill className="rounded-xl" />
                                </SvgWrapper>
                            </div>
                        }
                    />
                </div>

                {/* bottom */}
                <div className="flex flex-col gap-4 items-center pb-20">
                    <p className="text-4xl font-bold text-center">Run locally</p>
                    <p className="text-center">How to locally run the frontend + backend</p>
                    <LinkWrapper
                        href={AppUrls.DOCUMENTATION}
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2.5 cursor-alias w-max bg-milk-100/5 hover:bg-milk-100/10 transition-colors duration-300 rounded-xl"
                    >
                        <p className="text-milk text-sm truncate">Docs</p>
                        <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-4" />
                    </LinkWrapper>
                </div>
            </div>
        </PageWrapper>
    )
}
