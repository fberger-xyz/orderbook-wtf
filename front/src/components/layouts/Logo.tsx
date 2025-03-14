'use client'

import { APP_METADATA } from '@/config/app.config'
import LinkWrapper from '../common/LinkWrapper'
import { AppPagePaths } from '@/enums'

export default function Logo() {
    return (
        <div className="z-40 flex w-40 flex-col items-center gap-0">
            <LinkWrapper href={AppPagePaths.HOME} className="flex items-center gap-1">
                <p className="truncate text-xl font-bold tracking-wider text-primary underline decoration-inactive decoration-2 underline-offset-4 md:text-2xl">
                    {APP_METADATA.SITE_NAME}
                </p>
            </LinkWrapper>
            <p className="w-full text-center text-2xs font-bold text-inactive md:text-xs">{APP_METADATA.SITE_DESCRIPTION}</p>
        </div>
    )
}
