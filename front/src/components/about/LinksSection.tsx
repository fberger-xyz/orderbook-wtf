import IconWrapper from '@/components/common/IconWrapper'
import LinkWrapper from '@/components/common/LinkWrapper'
import { AppUrls, IconIds } from '@/enums'

interface LinkItem {
    href: string
    target?: '_blank' | '_self'
    icon: IconIds
    text: string
    className?: string
}

const links: LinkItem[] = [
    {
        href: AppUrls.ORDERBOOK,
        target: '_self',
        icon: IconIds.OPEN_LINK_IN_NEW_TAB,
        text: 'See DEXs as an orderbook',
        className: 'bg-folly/95 hover:bg-folly/100 cursor-pointer',
    },
    {
        href: AppUrls.DOCUMENTATION,
        target: '_blank',
        icon: IconIds.OPEN_LINK_IN_NEW_TAB,
        text: 'Read the docs',
        className: 'bg-[#FFF4E005] hover:bg-milk-100/10 cursor-alias',
    },
    {
        href: AppUrls.PROPELLERHEADS_TELEGRAM,
        target: '_blank',
        icon: IconIds.TELEGRAM_LOGO,
        text: 'Join tycho.build',
        className: 'bg-[#FFF4E005] hover:bg-milk-100/10 cursor-alias',
    },
]

export const LinksSection = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 w-full gap-4 pb-28 max-w-[1050px] mx-auto">
            {links.map((link, index) => (
                <LinkWrapper
                    key={index}
                    href={link.href}
                    target={link.target}
                    className={`flex flex-col justify-between p-6 border border-milk-50 transition-colors duration-300 rounded-xl h-[156px] ${link.className}`}
                >
                    <IconWrapper icon={link.icon} className="size-6" />
                    <p className="text-milk text-lg truncate">{link.text}</p>
                </LinkWrapper>
            ))}
        </div>
    )
}
