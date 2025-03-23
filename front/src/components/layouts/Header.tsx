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

export default function Header(props: { className?: string }) {
    const [openNetworkDropown, setOpenNetworkDropown] = useState(false)
    const networkDropown = useRef<HTMLDivElement>(null)
    useClickOutside(networkDropown, () => setOpenNetworkDropown(false))
    return (
        <div className={cn('flex justify-between w-full px-7 py-4', props.className)}>
            <div className="flex gap-2 items-center">
                <TychoSVG className="h-5" />
                <p className="text-milk-600 font-light opacity-50">Orderbook</p>
            </div>
            <div className="flex justify-end gap-2">
                {/* docs */}
                <LinkWrapper href="https://github.com/propeller-heads/tycho-x/blob/main/TAP-2.md" className="flex items-center gap-1 px-2.5">
                    <p className="text-milk text-sm">Docs</p>
                    <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-4" />
                </LinkWrapper>

                {/* networks */}
                <button onClick={() => setOpenNetworkDropown(!openNetworkDropown)} className="relative">
                    <div className="flex items-center gap-1 bg-milk-100/5 transition-colors duration-300 hover:bg-milk-100/10 rounded-xl h-10 px-3">
                        <ChainImage networkName="ethereum" className="size-5" />
                        <IconWrapper icon={IconIds.TRIANGLE_DOWN} className="size-5" />
                    </div>

                    {/* dropdown */}
                    <div
                        ref={networkDropown}
                        className={cn(
                            `absolute mt-2 w-52 rounded-2xl backdrop-blur-lg border-milk-150 border-2 shadow-lg p-2.5 transition-all origin-top-right`,
                            {
                                'scale-100 opacity-100': openNetworkDropown,
                                'scale-95 opacity-0 pointer-events-none': !openNetworkDropown,
                            },
                        )}
                    >
                        {/* Ethereum */}
                        <button className="flex items-center gap-2 w-full px-4 py-2 text-white hover:bg-gray-600/20 rounded-lg transition">
                            <ChainImage networkName="ethereum" className="size-6" />
                            <p className="text-milk-600">Ethereum</p>
                        </button>

                        {/* Disabled */}
                        <div className="flex items-center gap-2 px-4 py-2 text-gray-500 cursor-not-allowed mt-1 rounded-lg">
                            <div className="flex items-center gap-2">
                                <ChainImage networkName="arbitrum_2" className="size-6 opacity-50" />
                                <p>Arbitrum</p>
                            </div>
                            <p className="bg-white/20 px-1 font-bold rounded-sm text-xs text-background">SOON</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 text-gray-500 cursor-not-allowed mt-1 rounded-lg">
                            <div className="flex items-center gap-2">
                                <ChainImage networkName="base" className="size-6 opacity-50" />
                                <p>Base</p>
                            </div>
                            <p className="bg-white/20 px-1 font-bold rounded-sm text-xs text-background">SOON</p>
                        </div>
                    </div>
                </button>

                {/* connect */}
                <ConnectOrDisconnect />
            </div>
        </div>
    )
}
