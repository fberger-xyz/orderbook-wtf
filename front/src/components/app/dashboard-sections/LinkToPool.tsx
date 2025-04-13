'use client'

import { AppSupportedChains, IconIds } from '@/enums'
import { AmmPool } from '@/interfaces'
import { cn, mapProtocolIdToProtocolConfig } from '@/utils'
import IconWrapper from '@/components/common/IconWrapper'
import LinkWrapper from '@/components/common/LinkWrapper'
import SvgMapper from '@/components/icons/SvgMapper'
import { CHAINS_CONFIG } from '@/config/app.config'

export default function PoolLink({
    currentChainId,
    pool,
    config,
    className,
}: {
    currentChainId: AppSupportedChains
    pool: AmmPool | undefined
    config?: ReturnType<typeof mapProtocolIdToProtocolConfig>
    className?: string
}) {
    if (!pool) return null

    return (
        <LinkWrapper
            target="_blank"
            href={`${CHAINS_CONFIG[currentChainId].explorerRoot}/address/${pool.address}`}
            className={cn('flex gap-2 items-center group cursor-alias', className)}
        >
            <div className="flex justify-center rounded-full p-1 border border-milk-200 bg-milk-200/10">
                <SvgMapper icon={config?.svgId} className="size-3.5" />
            </div>
            <p className="text-milk-600 truncate group-hover:underline">
                {config?.version ? `${config?.version.toLowerCase()} - ` : ''}
                {pool.fee} bps - {pool?.address.slice(0, 5)}
            </p>
            <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-4 text-milk-200 group-hover:text-milk" />
        </LinkWrapper>
    )
}
