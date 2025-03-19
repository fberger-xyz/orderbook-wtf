'use client'

import { useRouter, useSearchParams } from 'next/navigation'
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
    const { availableTokens } = useAppStore()
    const modalRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const showModal = searchParams.get('select-token') === 'true'
    useKeyboardShortcut({ key: 'Escape', onKeyPressed: () => router.back() })
    useClickOutside(modalRef, () => router.back())
    if (!showModal) return null
    return (
        <Backdrop>
            <motion.div
                ref={modalRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ease: 'easeInOut', duration: 0.25 }}
                className="flex max-w-[400px] flex-col gap-5 rounded-xl border border-light-hover bg-background py-3 text-base shadow-lg"
            >
                <div className="flex w-full items-center justify-between px-6">
                    <p className="font-bold text-primary lg:text-lg">Select a token</p>
                    <button
                        onClick={() => router.back()}
                        className="rounded-xl hover:bg-very-light-hover hover:text-primary focus:outline-none text-primary"
                    >
                        <IconWrapper icon={IconIds.CLOSE} className="size-7" />
                    </button>
                </div>
                <div className="flex w-full items-center justify-between px-6">
                    <input
                        type="text"
                        className="border-light-hover px-5 bg-transparent border w-full rounded-lg h-12 placeholder:text-inactive"
                        placeholder="Search a name or paste address"
                    />
                </div>
                {/* <div className="w-full border-t border-very-light-hover" /> */}
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
                {/* <div className="w-full border-t border-very-light-hover" /> */}
                {/* <div className="flex w-full items-center justify-end gap-3 px-5">
                    <Button text="Copy (JSON)" icons={{ right: IconIds.COPY }} />
                    <Button text="Download (CSV)" icons={{ right: IconIds.DOWNLOAD }} />
                </div> */}
            </motion.div>
        </Backdrop>
    )
}
