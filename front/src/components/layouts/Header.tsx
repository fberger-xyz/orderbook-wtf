'use client'

import { cn } from '@/utils'
import IconWrapper from '../common/IconWrapper'
import LinkWrapper from '../common/LinkWrapper'
import { AppUrls, IconIds, SvgIds } from '@/enums'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useAppStore } from '@/stores/app.store'
import { CHAINS_CONFIG } from '@/config/app.config'
import { useApiStore } from '@/stores/api.store'
import SvgMapper from '../icons/SvgMapper'
import toast from 'react-hot-toast'
import { toastStyle } from '@/config/toasts.config'

export default function Header(props: { className?: string }) {
    const { currentChainId, setCurrentChain } = useAppStore()
    const { actions } = useApiStore()
    const [openNetworkDropown, setOpenNetworkDropown] = useState(false)
    const networkDropown = useRef<HTMLDivElement>(null)
    useClickOutside(networkDropown, () => setOpenNetworkDropown(false))
    return (
        <div className={cn('flex justify-between items-center w-full px-7 py-4', props.className)}>
            <div className="flex gap-2 items-center flex-col md:flex-row">
                <Image src={'/Tycho-orderbook.svg'} alt={SvgIds.TYCHO_ORDERBOOK} width={180} height={24} className="sm:hidden" />
                <Image src={'/Tycho-orderbook.svg'} alt={SvgIds.TYCHO_ORDERBOOK} width={212} height={24} className="hidden sm:block" />
            </div>
            <div className="flex flex-wrap justify-end items-center gap-2 z-20">
                {/* docs */}
                <LinkWrapper href={AppUrls.DOCUMENTATION} target="_blank" className="flex items-center gap-1 px-2.5 cursor-alias w-max">
                    <p className="text-milk text-sm truncate">
                        <span className="sm:hidden">Docs</span>
                        <span className="hidden sm:block">Docs (Run locally)</span>
                    </p>
                    <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-4" />
                </LinkWrapper>

                {/* networks */}
                <button onClick={() => setOpenNetworkDropown(!openNetworkDropown)} className="relative">
                    <div
                        ref={networkDropown}
                        className="flex items-center gap-1 bg-milk-100/5 transition-colors duration-300 hover:bg-milk-100/10 rounded-xl h-10 px-3"
                    >
                        <SvgMapper icon={CHAINS_CONFIG[currentChainId].svgId} className="size-5" />
                        <IconWrapper icon={IconIds.TRIANGLE_DOWN} className="size-5" />
                    </div>

                    {/* dropdown */}
                    <div
                        className={cn(
                            `absolute right-0 mt-2 w-52 rounded-2xl backdrop-blur-lg border-milk-150 border-2 shadow-lg p-2.5 transition-all origin-top-right`,
                            {
                                'scale-100 opacity-100': openNetworkDropown,
                                'scale-95 opacity-0 pointer-events-none': !openNetworkDropown,
                            },
                        )}
                    >
                        {Object.values(CHAINS_CONFIG).map((chainConfig) => {
                            if (chainConfig.supported)
                                return (
                                    <div
                                        key={chainConfig.name}
                                        onClick={async () => {
                                            if (chainConfig.wagmi?.id) {
                                                setCurrentChain(chainConfig.id)
                                                toast.success(`Chain selected: ${chainConfig.name}`, { style: toastStyle })
                                                actions.setMetrics(undefined)
                                            }
                                        }}
                                        className={cn('flex items-center gap-2 w-full px-4 py-2 text-white rounded-lg transition cursor-pointer', {
                                            'hover:bg-gray-600/20': currentChainId === chainConfig.id,
                                            'hover:opacity-100 hover:bg-gray-600/10': currentChainId !== chainConfig.id,
                                        })}
                                    >
                                        <SvgMapper icon={chainConfig.svgId} className="size-6" />
                                        <p className="text-milk-600 capitalize">{chainConfig.name}</p>
                                    </div>
                                )
                            else
                                return (
                                    <div
                                        key={chainConfig.name}
                                        className="flex items-center gap-2 px-4 py-2 text-gray-500 cursor-not-allowed mt-1 rounded-lg"
                                    >
                                        <div className="flex items-center gap-2">
                                            <SvgMapper icon={chainConfig.svgId} className="size-6 opacity-50" />
                                            <p className="capitalize">{chainConfig.name}</p>
                                        </div>
                                        <p className="bg-white/20 px-1 font-semibold rounded-sm text-xs text-background">SOON</p>
                                    </div>
                                )
                        })}
                    </div>
                </button>
            </div>
        </div>
    )
}
