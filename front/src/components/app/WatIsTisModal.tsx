'use client'

import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcutArgs'
import { motion } from 'framer-motion'
import { IconIds } from '@/enums'
import IconWrapper from '../common/IconWrapper'
import { Backdrop } from '../common/Backdrop'
import { useRef } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useAppStore } from '@/stores/app.store'

const GiphyEmbed = () => {
    return (
        <div style={{ width: '100%', height: 0, paddingBottom: '54%', position: 'relative' }}>
            <iframe
                src="https://giphy.com/embed/ygwYiV07aXzJehtTws"
                width="100%"
                height="100%"
                style={{ position: 'absolute' }}
                frameBorder="0"
                allowFullScreen
                className="giphy-embed"
            ></iframe>
            <p>
                <a href="https://giphy.com/gifs/ygwYiV07aXzJehtTws" target="_blank" rel="noopener noreferrer">
                    via GIPHY
                </a>
            </p>
        </div>
    )
}

export default function WatIsTisModal() {
    const { showWasIsTisModal, setShowWasIsTisModal } = useAppStore()
    const modalRef = useRef<HTMLDivElement>(null)
    useKeyboardShortcut({
        key: 'Escape',
        onKeyPressed: () => {
            setShowWasIsTisModal(false)
        },
    })
    useClickOutside(modalRef, () => {
        setShowWasIsTisModal(false)
    })

    if (!showWasIsTisModal) return null
    return (
        <Backdrop>
            <motion.div
                ref={modalRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ease: 'easeInOut', duration: 0.25 }}
                className="flex max-w-[430px] w-full flex-col rounded-xl border border-milk-150 bg-jagger/80 shadow-lg"
            >
                {/* 1 header */}
                <div className="pt-4 px-4 flex w-full items-center justify-between focus:ring-2 focus:ring-folly focus:ring-offset-2 cursor-pointer">
                    <p className="font-semibold text-xl">Wat is tis ?</p>
                    <button
                        onClick={() => {
                            setShowWasIsTisModal(false)
                        }}
                        className="rounded-xl hover:bg-very-light-hover hover:text-milk-600 focus:outline-none p-2 transition-colors duration-300"
                    >
                        <IconWrapper icon={IconIds.CLOSE} className="size-6" />
                    </button>
                </div>

                {/* content to be added */}
                <div className="px-3 py-10 h-[280px] overflow-scroll flex flex-col border-t border-milk-150 mt-4">
                    <GiphyEmbed />
                </div>
            </motion.div>
        </Backdrop>
    )
}
