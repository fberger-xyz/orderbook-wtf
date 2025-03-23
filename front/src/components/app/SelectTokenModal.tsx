'use client'

import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcutArgs'
import { motion } from 'framer-motion'
import { IconIds } from '@/enums'
import IconWrapper from '../common/IconWrapper'
import { Backdrop } from '../common/Backdrop'
import { useEffect, useRef, useState } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useAppStore } from '@/stores/app.store'
import { cn } from '@/utils'
import TokenImage from './TokenImage'

export default function SelectTokenModal() {
    const { selectedToken0, selectedToken1, setShowSelectTokenModal } = useAppStore()
    const [search, setSearch] = useState('')
    const modalRef = useRef<HTMLDivElement>(null)
    const searchInput = useRef<HTMLInputElement>(null)
    useEffect(() => searchInput.current?.focus(), [])
    useKeyboardShortcut({ key: 'Escape', onKeyPressed: () => setShowSelectTokenModal(false) })
    useClickOutside(modalRef, () => setShowSelectTokenModal(false))
    return (
        <Backdrop>
            <motion.div
                ref={modalRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ease: 'easeInOut', duration: 0.25 }}
                className="flex max-w-[430px] w-full flex-col gap-5 rounded-xl border border-milk-200 bg-jagger/80 text-base shadow-lg"
            >
                {/* 1 header */}
                <div className="p-4 flex w-full items-center justify-between focus:ring-2 focus:ring-folly focus:ring-offset-2 cursor-pointer">
                    <p className="font-semibold text-2xl">Select a token</p>
                    <button
                        onClick={() => setShowSelectTokenModal(false)}
                        className="rounded-xl hover:bg-very-light-hover hover:text-primary focus:outline-none text-primary"
                    >
                        <IconWrapper icon={IconIds.CLOSE} className="size-7" />
                    </button>
                </div>

                {/* 2 search */}
                <div className="px-4 pb-4 w-full">
                    <div className="flex w-full items-center rounded-lg border border-milk-200 transition focus-within:ring-2 focus-within:ring-folly">
                        <IconWrapper icon={IconIds.SEARCH} className="size-6 text-milk-600 ml-2 mr-3 my-2" />
                        <input
                            ref={searchInput}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            type="text"
                            className="text-lg font-light text-milk-600 grow bg-transparent outline-none placeholder:text-milk-200"
                            placeholder="Search a name or paste address"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="px-1.5">
                                <IconWrapper icon={IconIds.CLOSE} className="size-7 text-milk-600" />
                            </button>
                        )}
                    </div>
                </div>

                {/* suggestions */}
                <div className="px-4 flex flex-wrap gap-2">
                    {[
                        { symbol: 'eth', name: 'Ethereum' },
                        { symbol: 'weth', name: 'Wrapped Ether' },
                        { symbol: 'usdc', name: 'USDC' },
                        { symbol: 'dai', name: 'DAI' },
                        { symbol: 'usdt', name: 'USDT' },
                        { symbol: 'wbtc', name: 'Wrapped Bitcoin' },
                    ].map((token) => (
                        <button
                            key={token.symbol}
                            className={cn('flex gap-2 border border-milk-200 py-2 px-3 rounded-lg items-center', {
                                'border-folly': [selectedToken0?.symbol.toLowerCase(), selectedToken1?.symbol.toLowerCase()].includes(token.symbol),
                            })}
                        >
                            <TokenImage tokenSymbol={token.symbol} size={20} className="size-fit h-6" />
                            <p className="text-milk-600">{token.symbol.toUpperCase()}</p>
                        </button>
                    ))}
                </div>

                {/* tokens */}
                <div className="px-3 max-h-[300px] overflow-scroll flex flex-col border-t border-milk-150 pt-2">
                    {[
                        { symbol: 'eth', name: 'Ethereum' },
                        { symbol: 'weth', name: 'Wrapped Ether' },
                        { symbol: 'usdc', name: 'USDC' },
                        { symbol: 'dai', name: 'DAI' },
                        { symbol: 'usdt', name: 'USDT' },
                        { symbol: 'wbtc', name: 'Wrapped Bitcoin' },
                    ].map((token, tokenIndex) => (
                        <button
                            key={`${token}-${tokenIndex}`}
                            className="p-3 rounded-xl flex items-center gap-4 hover:bg-very-light-hover group hover:bg-milk-600/5"
                        >
                            <TokenImage tokenSymbol={token.symbol} size={36} className="size-fit h-9" />
                            <div className="flex flex-col items-start">
                                <p className="text-sm text-milk-600">{token.symbol.toUpperCase()}</p>
                                <p className="text-xs text-milk-200">{token.name}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </motion.div>
        </Backdrop>
    )
}
