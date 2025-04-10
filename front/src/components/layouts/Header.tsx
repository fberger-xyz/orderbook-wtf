'use client'

import { cn } from '@/utils'
import IconWrapper from '../common/IconWrapper'
import { ConnectOrDisconnect } from '../wallet/ConnectOrDisconnect'
import LinkWrapper from '../common/LinkWrapper'
import { IconIds } from '@/enums'
import TychoSVG from '../icons/tycho-svg.icon'
import ChainImage from '../app/ChainImage'
import { useRef, useState } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useAppStore } from '@/stores/app.store'

export default function Header(props: { className?: string }) {
    const { currentChainName, setCurrentChain } = useAppStore()
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
                <LinkWrapper
                    // href="https://github.com/propeller-heads/tycho-x/blob/main/TAP-2.md"
                    href="https://tycho-orderbook.gitbook.io/docs"
                    target="_blank"
                    className="flex items-center gap-1 px-2.5"
                >
                    <p className="text-milk text-sm">Docs</p>
                    <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-4" />
                </LinkWrapper>

                {/* networks */}
                <button onClick={() => setOpenNetworkDropown(!openNetworkDropown)} className="relative">
                    <div className="flex items-center gap-1 bg-milk-100/5 transition-colors duration-300 hover:bg-milk-100/10 rounded-xl h-10 px-3">
                        <ChainImage networkName={currentChainName} className="size-5" />
                        <IconWrapper icon={IconIds.TRIANGLE_DOWN} className="size-5" />
                    </div>

                    {/* dropdown */}
                    <div
                        ref={networkDropown}
                        className={cn(
                            // `absolute mt-2 w-52 rounded-2xl backdrop-blur-lg border-milk-150 border-2 shadow-lg p-2.5 transition-all origin-top-right`,
                            `absolute right-0 mt-2 w-52 rounded-2xl backdrop-blur-lg border-milk-150 border-2 shadow-lg p-2.5 transition-all origin-top-right`,
                            {
                                'scale-100 opacity-100': openNetworkDropown,
                                'scale-95 opacity-0 pointer-events-none': !openNetworkDropown,
                            },
                        )}
                    >
                        {/* Ethereum */}
                        {[
                            { name: 'ethereum', supported: true },
                            { name: 'base', supported: false },
                            { name: 'arbitrum_2', supported: false },
                        ].map((chainConfig) => {
                            if (chainConfig.supported)
                                return (
                                    <button
                                        key={chainConfig.name}
                                        onClick={() => setCurrentChain(chainConfig.name)}
                                        className={cn('flex items-center gap-2 w-full px-4 py-2 text-white rounded-lg transition', {
                                            'hover:bg-gray-600/20': currentChainName === chainConfig.name,
                                            'hover:bg-gray-600/10': currentChainName !== chainConfig.name,
                                        })}
                                    >
                                        <ChainImage networkName={chainConfig.name} className="size-6" />
                                        <p className="text-milk-600 capitalize">{chainConfig.name}</p>
                                    </button>
                                )
                            else
                                return (
                                    <div
                                        key={chainConfig.name}
                                        className="flex items-center gap-2 px-4 py-2 text-gray-500 cursor-not-allowed mt-1 rounded-lg"
                                    >
                                        <div className="flex items-center gap-2">
                                            <ChainImage networkName={chainConfig.name} className="size-6 opacity-50" />
                                            <p className="capitalize">{chainConfig.name.replace('_2', '')}</p>
                                        </div>
                                        <p className="bg-white/20 px-1 font-semibold rounded-sm text-xs text-background">SOON</p>
                                    </div>
                                )
                        })}
                    </div>
                </button>

                {/* connect */}
                <ConnectOrDisconnect />
            </div>
        </div>
    )
}
