import IconWrapper from '@/components/common/IconWrapper'
import LinkWrapper from '@/components/common/LinkWrapper'
import PageWrapper from '@/components/common/PageWrapper'
import { LinksSection } from '@/components/about/LinksSection'
import { AppUrls, IconIds } from '@/enums'
import CardsWithScreenshots from '@/components/about/CardsWithScreenshots'
import { FeatureSection } from '@/components/about/ScrollingFeatures'

export default function Page() {
    return (
        <PageWrapper className="mt-20 lg:mt-16">
            <div className="flex flex-col w-full gap-28 items-center">
                {/* tagline */}
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
                <CardsWithScreenshots />
                <FeatureSection />
                <LinksSection />
            </div>
        </PageWrapper>
    )
}
