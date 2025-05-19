import IconWrapper from '@/components/common/IconWrapper'
import LinkWrapper from '@/components/common/LinkWrapper'
import PageWrapper from '@/components/common/PageWrapper'
import { FeatureCard } from '@/components/about/FeatureCard'
import { FeatureSection } from '@/components/about/FeatureSection'
import { LinksSection } from '@/components/about/LinksSection'
import { AppUrls, IconIds } from '@/enums'
import Image from 'next/image'

export default function Page() {
    return (
        <PageWrapper className="mt-28 lg:mt-16">
            <div className="flex flex-col w-full gap-24 items-center">
                {/* tagline section */}
                <div className="flex max-w-[518px] flex-col gap-6 items-center">
                    <p className="text-[64px] leading-none font-bold text-center font-inter-tight">Explore DEXs in orderbook format</p>
                    <p className="text-center max-w-[648px] font-light px-10">
                        Orderbook.wtf aggregates simulated trades over all DEX pools so you can see the shape of all liquidity in one orderbook.
                    </p>
                    <div className="flex gap-2">
                        <LinkWrapper
                            href={AppUrls.ORDERBOOK}
                            className="bg-folly px-4 py-2.5 rounded-xl opacity-90 hover:opacity-100 transition-all duration-300 ease-in-out w-fit flex gap-2 items-center"
                        >
                            <p className="text-milk truncate">See DEXs as an orderbook</p>
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

                {/* main content section */}
                <div className="flex flex-col sm:px-8 gap-28 items-center mx-auto max-w-[1100px]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
                        <FeatureCard
                            className="h-[387px] flex-col lg:flex-row"
                            text={
                                <div className="flex gap-2 flex-col z-50">
                                    <p className="text-sm text-aquamarine">Orderbook</p>
                                    <p className="font-light text-lg lg:max-w-[200px]">
                                        On-chain liquidity visualized as discrete price-volume points, simulating real limit orders.
                                    </p>
                                </div>
                            }
                            svg={
                                <>
                                    <div className="hidden lg:flex absolute top-8 right-0">
                                        <Image src={'about-orderbook.svg'} alt={'orderbook'} width={220} height={415} />
                                    </div>
                                    <div className="lg:hidden absolute top-40 right-0">
                                        <Image src={'about-orderbook.svg'} alt={'orderbook'} width={300} height={800} />
                                    </div>
                                </>
                            }
                        />

                        <FeatureCard
                            className="flex-col h-[387px]"
                            text={
                                <div className="flex gap-2 flex-col z-50">
                                    <p className="text-sm text-aquamarine">Depth</p>
                                    <p className="font-light text-lg">Aggregated buy/sell levels, reconstructed into a CEX-style chart.</p>
                                </div>
                            }
                            svg={
                                <div className="absolute left-8 bottom-8">
                                    <Image src={'about-depth.svg'} alt={'depth'} width={515} height={157} />
                                </div>
                            }
                        />

                        <FeatureCard
                            className="flex-col h-[275px]"
                            text={
                                <div className="flex gap-2 flex-col z-50">
                                    <p className="text-sm text-aquamarine">Routing</p>
                                    <p className="font-light text-lg">
                                        See how trades are split for best execution: pools used, amounts, and pathing.
                                    </p>
                                </div>
                            }
                            svg={
                                <div className="absolute left-8 bottom-0">
                                    <Image src={'about-routing.svg'} alt={'routing'} width={437} height={182} />
                                </div>
                            }
                        />

                        <FeatureCard
                            className="flex-col h-[275px]"
                            text={
                                <div className="flex gap-2 flex-col z-50">
                                    <p className="text-sm text-aquamarine">Liquidity</p>
                                    <p className="font-light text-lg">Explore TVL by pool, track where liquidity comes from and how it evolves.</p>
                                </div>
                            }
                            svg={
                                <div className="absolute left-8 bottom-0">
                                    <Image src={'about-liquidity.svg'} alt={'liquidity'} width={683} height={141} />
                                </div>
                            }
                        />
                    </div>

                    <FeatureSection />
                    <LinksSection />
                </div>
            </div>
        </PageWrapper>
    )
}
