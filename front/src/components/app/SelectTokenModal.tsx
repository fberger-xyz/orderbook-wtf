'use client'

import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcutArgs'
import { motion } from 'framer-motion'
import { IconIds } from '@/enums'
import IconWrapper from '../common/IconWrapper'
import { Backdrop } from '../common/Backdrop'
import { useRef } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useAppStore } from '@/stores/app.store'
import Image from 'next/image'
import { shortenAddress } from '@/utils'

export default function SelectTokenModal() {
    const { availableTokens, setShowSelectTokenModal } = useAppStore()
    const modalRef = useRef<HTMLDivElement>(null)
    useKeyboardShortcut({ key: 'Escape', onKeyPressed: () => setShowSelectTokenModal(false) })
    useClickOutside(modalRef, () => setShowSelectTokenModal(false))
    return (
        <Backdrop>
            <motion.div
                ref={modalRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ease: 'easeInOut', duration: 0.25 }}
                className="flex max-w-[500px] w-full flex-col gap-5 rounded-xl border border-milk-200 bg-background p-6 text-base shadow-lg"
            >
                {/* 1 header */}
                <div className="flex w-full items-center justify-between">
                    <p className="font-semibold text-2xl">Select a token</p>
                    <button
                        onClick={() => setShowSelectTokenModal(false)}
                        className="rounded-xl hover:bg-very-light-hover hover:text-primary focus:outline-none text-primary"
                    >
                        <IconWrapper icon={IconIds.CLOSE} className="size-7" />
                    </button>
                </div>

                {/* 2 search */}
                <div className="flex w-full items-center gap-3 border-milk-200 rounded-lg p-2 border hover:border-folly">
                    <IconWrapper icon={IconIds.SEARCH} className="size-6 text-milk-600" />
                    <input
                        type="text"
                        className="text-lg font-light text-milk-600 border-none w-full rounded-md outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none bg-transparent placeholder:text-milk-200"
                        placeholder="Search a name or paste address"
                    />
                    <IconWrapper icon={IconIds.CLOSE} className="size-7 text-milk-600" />
                </div>

                {/* suggestions */}

                {/* tokens */}
                <div className="px-5 max-h-[300px] overflow-scroll flex flex-col gap-2">
                    {availableTokens.map((token, tokenIndex) => (
                        <button
                            key={`${token}-${tokenIndex}`}
                            className="px-2 py-1 rounded-xl flex items-center gap-3 hover:bg-very-light-hover group shadow-md w-full"
                        >
                            <p className="text-inactive text-xs">{tokenIndex + 1}</p>
                            <Image
                                src={`https://raw.githubusercontent.com/bgd-labs/web3-icons/main/icons/full/${token.symbol.toLowerCase()}.svg`}
                                width={30}
                                height={30}
                                alt="https://x.com/fberger_xyz/photo"
                                className="rounded-full"
                            />
                            <div className="flex flex-col items-start">
                                <p className="">{token.symbol}</p>
                                <p className="text-xs text-inactive">{shortenAddress(token.address)}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </motion.div>
        </Backdrop>
    )
}
