import { FeatureCard } from '@/components/about/FeatureCard'
import Image from 'next/image'

export default function CardsWithScreenshots() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 max-w-[1050px] mx-auto">
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
                        <p className="font-light text-lg">See how trades are split for best execution: pools used, amounts, and pathing.</p>
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
    )
}
