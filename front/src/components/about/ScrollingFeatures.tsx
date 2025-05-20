import Image from 'next/image'
import LinkWrapper from '../common/LinkWrapper'
import { cn } from '@/utils'

const features: {
    className: string
    image: string
    title: string
    description: string
}[] = [
    {
        className: 'col-span-3',
        image: './about-features-shape.svg',
        title: 'See the real shape of onchain liquidity',
        description:
            'The Tycho Orderbook SDK runs a solver to simulate hundreds of trades every block over all DEX pools. It then aggregates the results into one orderbook, that combines the liquidity from all DEX pools and shows you the true shape of available liquidity.',
    },
    {
        className: 'col-span-3',
        image: './about-features-trade.svg',
        title: 'Trade over DEXs like an orderbook',
        description:
            'Not just a visual. Each point on the orderbook is a route and call data for the best split trade over DEXs pools at this trade amount. Execute each point directly onchain.',
    },
    {
        className: 'col-span-2',
        image: './about-features-strategies.svg',
        title: 'Run CeFi strategies on DeFi',
        description:
            'If your backend is setup for orderbooks, you can now trade onchain like on any orderbook. Simply run the Tycho Orderbook SDK locally, stream yourself the onchain orderbook, and execute trades.',
    },
    {
        className: 'col-span-2',
        image: './about-features-always-up-dexs.svg',
        title: 'Always up to date with the latest DEXs',
        description:
            '[Tycho](https://docs.propellerheads.xyz/tycho/for-solvers/simulation) adds new DEXs as they launch – so the orderbook gives you an up to date view of the true liquidity.',
    },
    {
        className: 'col-span-2',
        image: './about-features-always-up-block.svg',
        title: 'Up to date with the latest block',
        description:
            'Tycho streams updates 50-200ms after each new block – and the [Tycho Ordebook SDK](https://tycho-orderbook.gitbook.io/docs) runs a convex solver to update the orderbook and streams the update to the UI.',
    },
]

export const FeatureSection = () => {
    return (
        <div className="flex flex-col w-full items-start gap-4 max-w-[1050px] mx-auto">
            <p className="text-sm text-aquamarine">Features</p>
            <p className="text-[48px] leading-none font-bold max-w-[688px] text-left font-inter-tight">
                Everything Tycho Orderbook brings to your stack
            </p>
            <div className="relative w-full mt-10">
                <div className="w-full grid grid-cols-2 lg:grid-cols-6 gap-4 pb-4">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={cn(
                                'flex flex-col p-6 transition-colors duration-300 rounded-xl gap-12 bg-[#FFF4E005] border border-milk-50',
                                feature.className,
                            )}
                        >
                            <div className="flex h-[271px]">
                                <Image src={feature.image} alt={feature.title} width={400} height={271} className="mx-auto" />
                            </div>
                            <div className="flex flex-col gap-3">
                                <p className="text-lg">{feature.title}</p>

                                {/* exceptions */}
                                {feature.title === 'Always up to date with the latest DEXs' ? (
                                    <p className="text-milk-400 text-base font-light">
                                        <LinkWrapper
                                            href="https://docs.propellerheads.xyz/tycho/for-solvers/simulation"
                                            target="_blank"
                                            className="cursor-alias hover:underline hover:text-aquamarine pr-1 underline"
                                        >
                                            Tycho
                                        </LinkWrapper>
                                        adds new DEXs as they launch – so the orderbook gives you an up to date view of the true liquidity.
                                    </p>
                                ) : feature.title === 'Up to date with the latest block' ? (
                                    <p className="text-milk-400 text-base font-light">
                                        <LinkWrapper
                                            href="https://tycho-orderbook.gitbook.io/docs"
                                            target="_blank"
                                            className="cursor-alias hover:underline hover:text-aquamarine pr-1 underline"
                                        >
                                            Tycho Ordebook SDK
                                        </LinkWrapper>
                                        adds new DEXs as they launch – so the orderbook gives you an up to date view of the true liquidity.
                                    </p>
                                ) : (
                                    // default
                                    <p className="text-milk-400 text-base text-justify font-light">{feature.description}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
