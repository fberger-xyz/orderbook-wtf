'use client'

import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcutArgs'
import { motion } from 'framer-motion'
import { Backdrop } from '../common/Backdrop'
import { useRef } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useAppStore } from '@/stores/app.store'
import { SvgWrapper } from '../icons/SvgMapper'
import Image from 'next/image'

export default function WelcomeModal() {
    const { showWhatIsThisModal, setShowWhatIsThisModal } = useAppStore()
    const modalRef = useRef<HTMLDivElement>(null)
    useKeyboardShortcut({
        key: 'Escape',
        onKeyPressed: () => {
            setShowWhatIsThisModal(false)
        },
    })
    useClickOutside(modalRef, () => {
        setShowWhatIsThisModal(false)
    })

    if (!showWhatIsThisModal) return null
    return (
        <Backdrop>
            <motion.div
                ref={modalRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ease: 'easeInOut', duration: 0.25 }}
                className="flex max-w-[613px] w-full flex-col rounded-xl border border-milk-200 bg-[#FFF4E00A] shadow-lg p-6"
            >
                {/* 1 header */}
                <p className="font-semibold text-xl">Welcome to Tycho Orderbook</p>
                <p className="font-light">A new way to read and trade on-chain.</p>
                <span className="h-6" />
                <p className="font-light">Ever wondered how deep the liquidity is, where it sits, or how LPs behave?</p>
                <p className="font-light">Tycho makes AMM liquidity readable and tradeable like a centralized orderbook.</p>
                <span className="h-6" />
                <div className="flex flex-col gap-4">
                    {[
                        {
                            title: 'Depth',
                            svg: '/depth.svg',
                            description: 'A new way to read and trade on-chain.',
                        },
                        {
                            title: 'Orderbook',
                            svg: '/orderbook.svg',
                            description: 'On-chain liquidity visualized as discrete price-volume points, simulating real limit orders.',
                        },
                        {
                            title: 'Routing',
                            svg: '/routing.svg',
                            description: 'See how trades are split for best execution: pools used, amounts, and pathing.',
                        },
                        {
                            title: 'Liquidity',
                            svg: '/liquidity.svg',
                            description: 'Explore TVL by pool, track where liquidity comes from and how it evolves.',
                        },
                    ].map((entry) => (
                        <div key={entry.svg} className="flex gap-4 items-center">
                            <div className="w-16">
                                <SvgWrapper className="w-16 h-16">
                                    <Image src={entry.svg} alt={entry.title} fill />
                                </SvgWrapper>
                            </div>
                            <div className="flex flex-col">
                                <p className="font-bold text-lg">{entry.title}</p>
                                <p className="font-light text-milk-400 text-sm">{entry.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <span className="h-6" />
                <p className="font-light">Built on Tycho’s open-source stack: Rust SDK, UI, and API ready to use.</p>
                <span className="h-6" />
                <button
                    onClick={() => setShowWhatIsThisModal(false)}
                    className="w-full bg-folly p-4 rounded-lg opacity-90 hover:opacity-100 transition-all duration-300 ease-in-out"
                >
                    <p>Get started</p>
                </button>
            </motion.div>
        </Backdrop>
    )
}
