import Image from 'next/image'

interface FeatureItem {
    image: string
    title: string
    description: string
}

const features: FeatureItem[] = [
    {
        image: './about-features-shape.svg',
        title: 'See the real shape of onchain liquidity',
        description:
            'The Tycho Orderbook SDK runs a solver to simulate hundreds of trades every block over all DEX pools. It then aggregates the results into one orderbook, that combines the liquidity from all DEX pools and shows you the true shape of available liquidity.',
    },
    {
        image: './about-features-trade.svg',
        title: 'Trade over DEXs like an orderbook',
        description:
            'Not just a visual. Each point on the orderbook is a route and call data for the best split trade over DEXs pools at this trade amount. Execute each point directly onchain.',
    },
    {
        image: './about-features-strategies.svg',
        title: 'Run CeFi strategies on DeFi',
        description:
            'If your backend is setup for orderbooks, you can now trade onchain like on any orderbook. Simply run the Tycho Orderbook SDK locally, stream yourself the onchain orderbook, and execute trades.',
    },
]

export const FeatureSection = () => {
    return (
        <div className="flex flex-col max-w-screen w-full items-start gap-4">
            <p className="text-sm text-aquamarine">Features</p>
            <p className="text-[48px] leading-none font-bold max-w-[688px] text-left font-inter-tight">
                Everything Tycho Orderbook brings to your stack
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-3 w-full gap-4 mt-10">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="flex flex-col p-6 transition-colors duration-300 rounded-xl gap-12 w-full bg-[#FFF4E005] border border-milk-50"
                    >
                        <Image src={feature.image} alt={feature.title} width={377} height={204} className="w-full max-h-[204px] mx-auto" />
                        <div className="flex flex-col gap-3">
                            <p className="text-lg">{feature.title}</p>
                            <p className="text-milk-400 text-base font-light">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
