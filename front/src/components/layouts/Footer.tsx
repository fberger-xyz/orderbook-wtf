'use client'

import { cn } from '@/utils'
import { APP_METADATA } from '@/config/app.config'
import IconWrapper from '../common/IconWrapper'
import { IconIds } from '@/enums'
import Image from 'next/image'
import LinkWithIcon from '../common/LinkWithIcon'

export default function Footer(props: { className?: string }) {
    return (
        <div className={cn('w-full flex justify-center text-sm border-t-2 border-light-hover bg-background/30', props.className)}>
            <div className="mx-auto my-8 flex max-w-[600px] flex-col justify-center items-center gap-1 py-6 sm:max-w-[700px]">
                <p className="text-sm text-secondary mx-auto text-center font-bold">Data provided by Tycho</p>
                <Image
                    src="https://docs.propellerheads.xyz/~gitbook/image?url=https%3A%2F%2F1487321251-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FjrIe0oInIEt65tHqWn2w%252Fuploads%252FL4NnLGGDr9gnBxcyG5ik%252Findexer.png%3Falt%3Dmedia%26token%3D37f95e88-b9bd-4d6c-a641-d6987ba54212&width=768&dpr=4&quality=100&sign=3fab38f6&sv=2"
                    width={240}
                    height={240}
                    alt="tycho-indexer"
                />
                <p className="text-sm text-secondary mx-auto text-center font-bold mt-6">Visualisation coded by</p>
                <div className="flex gap-4 items-center flex-col md:flex-row">
                    {/* fberger */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <Image
                                src={APP_METADATA.PROFILE_PICTURE}
                                width={40}
                                height={40}
                                alt="https://x.com/fberger_xyz/photo"
                                className="rounded-full"
                            />
                            <div className="flex h-min flex-col justify-center">
                                <p className="flex text-lg font-bold text-primary">{APP_METADATA.SITE_AUTHOR}</p>
                                <p className="text-xs text-inactive">fullstack</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {[
                                { href: `https://${APP_METADATA.SITE_AUTHOR}`, icon: IconIds.WEBSITE },
                                {
                                    href: `https://t.me/${APP_METADATA.SOCIALS.TELEGRAM}`,
                                    icon: IconIds.TELEGRAM_LOGO,
                                    id: APP_METADATA.SOCIALS.TELEGRAM,
                                },
                            ].map((link) => (
                                <LinkWithIcon
                                    key={link.href}
                                    href={link.href}
                                    className={
                                        link.icon === IconIds.TELEGRAM_LOGO
                                            ? 'border-2 border-telegram bg-telegram/10 py-1 text-telegram'
                                            : 'h-9 border-2 py-1'
                                    }
                                >
                                    {link.id && <p className="pr-1 text-base font-bold">{link.id}</p>}
                                    <IconWrapper icon={link.icon} className="size-5" />
                                </LinkWithIcon>
                            ))}
                        </div>
                    </div>

                    <p className="text-sm text-secondary text-center font-bold">+</p>

                    {/* xmerso */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <Image
                                src="https://pbs.twimg.com/profile_images/1854388324238311424/TMiKYbdx_400x400.jpg"
                                width={40}
                                height={40}
                                alt="https://x.com/0xMerso/photo"
                                className="rounded-full"
                            />
                            <div className="flex h-min flex-col justify-center">
                                <p className="flex text-lg font-bold text-primary">{APP_METADATA.SITE_AUTHOR}</p>
                                <p className="text-xs text-inactive">rust + solidity</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {[
                                { href: `https://merso.xyz`, icon: IconIds.WEBSITE },
                                { href: `https://t.me/0xMerso`, icon: IconIds.TELEGRAM_LOGO, id: '0xMerso' },
                            ].map((link) => (
                                <LinkWithIcon
                                    key={link.href}
                                    href={link.href}
                                    className={
                                        link.icon === IconIds.TELEGRAM_LOGO
                                            ? 'border-2 border-telegram bg-telegram/10 py-1 text-telegram'
                                            : 'h-9 border-2 py-1'
                                    }
                                >
                                    {link.id && <p className="pr-1 text-base font-bold">{link.id}</p>}
                                    <IconWrapper icon={link.icon} className="size-5" />
                                </LinkWithIcon>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
