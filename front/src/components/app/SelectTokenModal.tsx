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
                    <p className="font-bold text-secondary lg:text-lg">Select token</p>
                    <button
                        onClick={() => router.back()}
                        className="rounded-xl text-default hover:bg-very-light-hover hover:text-primary focus:outline-none"
                    >
                        <IconWrapper icon={IconIds.CLOSE} className="size-7" />
                    </button>
                </div>
                <div className="w-full border-t border-very-light-hover" />
                <div className="px-5 max-h-[300px] overflow-scroll flex flex-col gap-2">
                    {availableTokens.map((token, tokenIndex) => (
                        <div key={`${token}-${tokenIndex}`} className="flex gap-2 rounded-xl bg-very-light-hover w-min p-2 text-sm">
                            <p className="text-inactive">{tokenIndex + 1}</p>
                            <p className="">{token.symbol}</p>
                        </div>
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
