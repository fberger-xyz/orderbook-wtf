import IconWrapper from '@/components/common/IconWrapper'
import LinkWrapper from '@/components/common/LinkWrapper'
import PageWrapper from '@/components/common/PageWrapper'
import { AppUrls, IconIds } from '@/enums'
import { cn } from '@/utils'
import Image from 'next/image'
import { ReactNode } from 'react'

const FeatureCard = (props: { className?: string; text: ReactNode; svg: ReactNode }) => {
    return (
        <div
            className="gap-2 border border-milk-50 rounded-xl relative overflow-hidden w-full backdrop-blur-sm"
            style={{ background: 'rgba(255, 244, 224, 0.02)' }}
        >
            <div className={cn('flex p-8 gap-2 overflow-hidden', props.className)}>
                {props.text}
                {props.svg}
            </div>
            {/* <div
                className="absolute bottom-0 size-[2000px] backdrop-blur -left-[800px] -top-[100px]"
                style={{
                    zIndex: -1,
                    background: 'linear-gradient(to right, rgba(255, 209, 27, 0.01), rgba(255, 0, 79, 0.04))',
                }}
            /> */}
        </div>
    )
}

export default function Page() {
    return (
        <PageWrapper className="mt-28 lg:mt-16">
            <div className="flex flex-col w-full gap-24 items-center">
                {/* tagline */}
                <div className="flex max-w-[518px] flex-col gap-6 items-center">
                    <p className="text-6xl font-bold text-center">Explore DEXs in orderbook format</p>
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

                {/* cards */}
                <div className="flex flex-col sm:px-8 gap-28 items-center mx-auto max-w-[1100px]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
                        {/* 1 */}
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
                                    <div className="hidden lg:absolute top-8 right-0">
                                        <Image src={'about-orderbook.svg'} alt={'orderbook'} width={220} height={415} />
                                    </div>
                                    <div className="lg:hidden absolute top-40 right-0">
                                        <Image src={'about-orderbook.svg'} alt={'orderbook'} width={300} height={800} />
                                    </div>
                                </>
                            }
                        />

                        {/* 2 */}
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

                        {/* 3 */}
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

                        {/* 4 */}
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

                    {/* features */}
                    <div className="flex flex-col max-w-screen w-full items-start gap-4">
                        <p className="text-sm text-aquamarine">Features</p>
                        <p className="text-4xl font-bold max-w-[588px] text-left">Everything Tycho Orderbook brings to your stack</p>
                        <div className="grid grid-cols-1 lg:grid-cols-3 w-full gap-4 mt-10">
                            {/* 1 */}
                            <div className="flex flex-col p-6 transition-colors duration-300 rounded-xl gap-12 w-full bg-[#FFF4E005] border border-milk-50">
                                <Image
                                    src={'./about-features-shape.svg'}
                                    alt={'features-shape'}
                                    width={377}
                                    height={271}
                                    className="w-full mx-auto"
                                />
                                <div className="flex flex-col gap-3">
                                    <p className="text-lg">See the real shape of onchain liquidity</p>
                                    <p className="text-milk-400 text-base font-light">
                                        The Tycho Orderbook SDK runs a solver to simulate hundreds of trades every block over all DEX pools. It then
                                        aggregates the results into one orderbook, that combines the liquidity from all DEX pools and shows you the
                                        true shape of available liquidity.
                                    </p>
                                </div>
                            </div>

                            {/* 2 */}
                            <div className="flex flex-col p-6 transition-colors duration-300 rounded-xl gap-12 w-full bg-[#FFF4E005] border border-milk-50">
                                <Image
                                    src={'./about-features-trade.svg'}
                                    alt={'features-trade'}
                                    width={377}
                                    height={271}
                                    className="mx-auto w-full"
                                />
                                <div className="flex flex-col gap-3">
                                    <p className="text-lg">Trade over DEXs like an orderbook</p>
                                    <p className="text-milk-400 text-base font-light">
                                        Not just a visual. Each point on the orderbook is a route and call data for the best split trade over DEXs
                                        pools at this trade amount. Execute each point directly onchain.
                                    </p>
                                </div>
                            </div>

                            {/* 3 */}
                            <div className="flex flex-col p-6 transition-colors duration-300 rounded-xl gap-12 w-full bg-[#FFF4E005] border border-milk-50">
                                <Image
                                    src={'./about-features-strategies.svg'}
                                    alt={'features-strategies'}
                                    width={230}
                                    height={204}
                                    className="mx-auto sizewfull"
                                />
                                <div className="flex flex-col gap-3">
                                    <p className="text-lg">Run CeFi strategies on DeFi</p>
                                    <p className="text-milk-400 text-base font-light">
                                        If your backend is setup for orderbooks, you can now trade onchain like on any orderbook. Simply run the Tycho
                                        Orderbook SDK locally, stream yourself the onchain orderbook, and execute trades.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* links */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 w-full gap-4 pb-28">
                        <LinkWrapper
                            href={AppUrls.ORDERBOOK}
                            target="_self"
                            className="flex flex-col justify-between p-6 cursor-pointer bg-folly/95 hover:bg-folly/100 transition-colors duration-300 rounded-xl h-[156px]"
                        >
                            <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-6" />
                            <p className="text-milk text-lg truncate">Docs</p>
                        </LinkWrapper>
                        <LinkWrapper
                            href={AppUrls.DOCUMENTATION}
                            target="_blank"
                            className="flex flex-col justify-between p-6 cursor-alias bg-milk-100/5 hover:bg-milk-100/10 transition-colors duration-300 rounded-xl h-[156px]"
                        >
                            <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-6" />
                            <p className="text-milk text-lg truncate">Read the docs</p>
                        </LinkWrapper>
                        <LinkWrapper
                            href={AppUrls.PROPELLERHEADS_TELEGRAM}
                            target="_blank"
                            className="flex flex-col justify-between p-6 cursor-alias bg-milk-100/5 hover:bg-milk-100/10 transition-colors duration-300 rounded-xl h-[156px]"
                        >
                            <IconWrapper icon={IconIds.TELEGRAM_LOGO} className="size-6" />
                            <p className="text-milk text-lg truncate">Join tycho.build</p>
                        </LinkWrapper>
                    </div>
                </div>
            </div>
        </PageWrapper>
    )
}
