'use client'

import { cn } from '@/utils'
import IconWrapper from '../common/IconWrapper'
// import { ConnectOrDisconnect } from '../wallet/ConnectOrDisconnect'
import LinkWrapper from '../common/LinkWrapper'
import { AppUrls, IconIds } from '@/enums'
import TychoSVG from '../icons/tycho-svg.icon'
import { useRef, useState } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useAppStore } from '@/stores/app.store'
import { CHAINS_CONFIG } from '@/config/app.config'
import { useApiStore } from '@/stores/api.store'
import SvgMapper from '../icons/SvgMapper'
import toast from 'react-hot-toast'
import { toastStyle } from '@/config/toasts.config'
import { switchChain } from '@wagmi/core'
import { config } from '@/providers/wagmi'
import WatIsTisModal from '../app/WatIsTisModal'

export default function Header(props: { className?: string }) {
    // const { currentChainId, setCurrentChain, setShowWasIsTisModal } = useAppStore()
    const { currentChainId, setCurrentChain } = useAppStore()
    const { setMetrics } = useApiStore()
    const [openNetworkDropown, setOpenNetworkDropown] = useState(false)
    const networkDropown = useRef<HTMLDivElement>(null)
    useClickOutside(networkDropown, () => setOpenNetworkDropown(false))
    return (
        <div className={cn('flex justify-between items-start w-full px-7 py-4', props.className)}>
            <div className="flex gap-2 items-center flex-col md:flex-row">
                <TychoSVG className="h-6" />
                <p className="text-milk-600 font-light opacity-50">Orderbook</p>
            </div>
            <div className="flex flex-wrap justify-end items-center gap-2 z-20">
                {/* docs */}
                {/* <button onClick={() => setShowWasIsTisModal(true)} className="flex items-center gap-1 px-2.5">
                    <p className="text-milk text-sm">wat is tis</p>
                </button> */}

                {/* docs */}
                <LinkWrapper href={AppUrls.DOCUMENTATION} target="_blank" className="flex items-center gap-1 px-2.5 cursor-alias">
                    <p className="text-milk text-sm">Docs</p>
                    <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-4" />
                </LinkWrapper>

                {/* networks */}
                <button onClick={() => setOpenNetworkDropown(!openNetworkDropown)} className="relative">
                    <div className="flex items-center gap-1 bg-milk-100/5 transition-colors duration-300 hover:bg-milk-100/10 rounded-xl h-10 px-3">
                        <SvgMapper icon={CHAINS_CONFIG[currentChainId].svgId} className="size-5" />
                        <IconWrapper icon={IconIds.TRIANGLE_DOWN} className="size-5" />
                    </div>

                    {/* dropdown */}
                    <div
                        ref={networkDropown}
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
                                                await switchChain(config, { chainId: chainConfig.wagmi?.id })
                                                setCurrentChain(chainConfig.id)
                                                toast.success(`Chain selected: ${chainConfig.name}`, { style: toastStyle })
                                                setMetrics(undefined)
                                            }
                                        }}
                                        className={cn('flex items-center gap-2 w-full px-4 py-2 text-white rounded-lg transition cursor-pointer', {
                                            'hover:bg-gray-600/20': currentChainId === chainConfig.id,
                                            'opacity-50 hover:opacity-100 hover:bg-gray-600/10': currentChainId !== chainConfig.id,
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

                {/* connect */}
                {/* <ConnectOrDisconnect /> */}
                <WatIsTisModal />
            </div>
        </div>
    )
}
