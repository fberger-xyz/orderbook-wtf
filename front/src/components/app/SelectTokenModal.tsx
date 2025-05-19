'use client'

import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcutArgs'
import { motion } from 'framer-motion'
import { IconIds } from '@/enums'
import IconWrapper from '../common/IconWrapper'
import { Backdrop } from '../common/Backdrop'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useAppStore } from '@/stores/app.store'
import { cn, shortenAddress } from '@/utils'
import TokenImage from './commons/TokenImage'
import { useAccount } from 'wagmi'
import { useApiStore } from '@/stores/api.store'
import StyledTooltip from '../common/StyledTooltip'
import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual'
import { CHAINS_CONFIG } from '@/config/app.config'
import { Token } from '@/interfaces'

export default function SelectTokenModal() {
    const {
        sellToken,
        buyToken,
        showSelectTokenModal,
        selectTokenModalFor,
        selectTokenModalSearch,
        currentChainId,
        selectSellToken,
        selectBuyToken,
        setShowSelectTokenModal,
        setSelectTokenModalSearch,
        setBuyTokenAmountInput,
    } = useAppStore()
    const { apiTokens, actions } = useApiStore()
    const account = useAccount()
    const modalRef = useRef<HTMLDivElement>(null)
    const searchInput = useRef<HTMLInputElement>(null)
    const parentRef = useRef<HTMLDivElement>(null)
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
    const [debouncedSearch, setDebouncedSearch] = useState('')

    // memoize tokens list
    const tokensList = useMemo(() => apiTokens[currentChainId] || [], [apiTokens, currentChainId])

    // filter tokens based on search
    const filteredTokens = useMemo(() => {
        return tokensList.filter((token) => token.symbol.toLowerCase().includes(debouncedSearch.toLowerCase()))
    }, [tokensList, debouncedSearch])

    // setup
    const rowVirtualizer = useVirtualizer({
        count: filteredTokens.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 52, // px
        overscan: 10,
    })

    // close modal callback
    const closeModal = useCallback(() => {
        setShowSelectTokenModal(false)
        setSelectTokenModalSearch('')
        setDebouncedSearch('')
    }, [setShowSelectTokenModal, setSelectTokenModalSearch])

    // handle token selection
    const handleTokenSelect = useCallback(
        async (token: Token) => {
            if (selectTokenModalFor === 'buy') {
                if (buyToken.address === token.address) return
                selectBuyToken(token)
                setBuyTokenAmountInput(0)
                actions.setMetrics(undefined)
            } else {
                if (sellToken.address === token.address) return
                selectSellToken(token)
                actions.setMetrics(undefined)
            }
            closeModal()
        },
        [selectTokenModalFor, buyToken, sellToken, selectBuyToken, selectSellToken, setBuyTokenAmountInput, actions, closeModal],
    )

    // focus search input when modal opens
    useEffect(() => {
        if (showSelectTokenModal) searchInput.current?.focus()
    }, [showSelectTokenModal])

    // listen keyboard
    useKeyboardShortcut({ key: 'Escape', onKeyPressed: closeModal })
    useClickOutside(modalRef, closeModal)

    if (!showSelectTokenModal) return null

    return (
        <Backdrop>
            <motion.div
                ref={modalRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ease: 'easeInOut', duration: 0.25 }}
                className="flex max-w-[430px] w-full flex-col rounded-xl border border-milk-200 bg-[#FFF4E00A] shadow-lg"
            >
                {/* header */}
                <div className="p-4 flex w-full items-center justify-between">
                    <StyledTooltip
                        className="max-w-80"
                        content={
                            <p className="flex gap-1 text-milk text-sm">
                                We only display tokens for which a single-hop exchange path exists, meaning that a liquidity pool contains base tokens
                                and quote tokens.
                            </p>
                        }
                    >
                        <div className="flex items-center gap-1.5 group">
                            <p className="font-semibold text-xl">Select a token</p>
                            <IconWrapper icon={IconIds.INFORMATION} className="size-4 text-milk-200 group-hover:text-milk cursor-pointer" />
                        </div>
                    </StyledTooltip>
                    <button
                        onClick={closeModal}
                        className="rounded-xl hover:bg-very-light-hover hover:text-milk-600 focus:outline-none p-2 transition-colors duration-300"
                    >
                        <IconWrapper icon={IconIds.CLOSE} className="size-6" />
                    </button>
                </div>

                {/* search */}
                <div className="px-4 pb-4 w-full">
                    <div className="flex w-full items-center rounded-lg border border-milk-200 transition focus-within:ring-2 focus-within:ring-folly">
                        <IconWrapper icon={IconIds.SEARCH} className="size-[22px] text-milk-600 ml-2 mr-3 my-2" />
                        <input
                            ref={searchInput}
                            value={selectTokenModalSearch}
                            onChange={(e) => {
                                setSelectTokenModalSearch(e.target.value)
                                if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
                                debounceTimeout.current = setTimeout(() => {
                                    setDebouncedSearch(e.target.value.trim())
                                }, 400)
                            }}
                            type="text"
                            className="text-base font-light text-milk-600 grow bg-transparent outline-none placeholder:text-milk-400"
                            placeholder="Search a name or paste address"
                        />
                        {selectTokenModalSearch && (
                            <button
                                onClick={() => {
                                    setSelectTokenModalSearch('')
                                    setDebouncedSearch('')
                                }}
                                className="px-1.5"
                            >
                                <IconWrapper icon={IconIds.CLOSE} className="size-7 text-milk-600" />
                            </button>
                        )}
                    </div>
                </div>

                {/* suggestions */}
                <div className="px-4 flex flex-wrap gap-2">
                    {CHAINS_CONFIG[currentChainId].suggestedTokens
                        .filter((token) => !!token)
                        .filter((token, tokenIndex, tokens) => tokens.findIndex((_t) => _t?.address === token.address) === tokenIndex)
                        .map((token) => (
                            <button
                                key={token.symbol}
                                // todo: remove useless keys
                                onClick={() => handleTokenSelect({ ...token, decimals: 0, gas: '' })}
                                disabled={token.address === (selectTokenModalFor === 'buy' ? sellToken.address : buyToken.address)}
                                className={cn('flex gap-2 border border-milk-200 py-2.5 px-3 rounded-lg items-center', {
                                    'border-folly': [
                                        selectTokenModalFor === 'buy' ? buyToken.symbol.toLowerCase() : sellToken.symbol.toLowerCase(),
                                    ].includes(token.symbol.toLowerCase()),
                                    'opacity-30 cursor-not-allowed':
                                        token.address === (selectTokenModalFor === 'buy' ? sellToken.address : buyToken.address),
                                })}
                            >
                                {/* todo: remove useless keys */}
                                <TokenImage token={{ ...token, decimals: 0, gas: '' }} size={20} className="size-fit h-5" />
                                <p className="text-milk text-sm">{token.symbol}</p>
                            </button>
                        ))}
                </div>

                {/* virtualized token list */}
                <div ref={parentRef} className="px-3 max-h-[360px] overflow-auto flex flex-col border-t border-milk-150 mt-4">
                    {account.isConnected && (
                        <>
                            <p className="p-4 text-base text-milk-400">Your tokens</p>
                            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                                {rowVirtualizer.getVirtualItems().map((virtualRow: VirtualItem) => {
                                    const token = filteredTokens[virtualRow.index]
                                    return (
                                        <button
                                            key={token.address}
                                            ref={rowVirtualizer.measureElement}
                                            onClick={() => handleTokenSelect(token)}
                                            disabled={token.address === (selectTokenModalFor === 'buy' ? sellToken.address : buyToken.address)}
                                            className={cn(
                                                'absolute left-0 right-0 px-2.5 h-[52px] mb-[2px] rounded-xl flex justify-between hover:bg-very-light-hover group hover:bg-milk-600/5',
                                                {
                                                    'bg-milk-600/5': [
                                                        selectTokenModalFor === 'buy'
                                                            ? buyToken.symbol.toLowerCase()
                                                            : sellToken.symbol.toLowerCase(),
                                                    ].includes(token.symbol.toLowerCase()),
                                                    'opacity-30 cursor-not-allowed':
                                                        token.address === (selectTokenModalFor === 'buy' ? sellToken.address : buyToken.address),
                                                },
                                            )}
                                            style={{
                                                top: 0,
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                        >
                                            <div className="flex items-center gap-4">
                                                <TokenImage token={token} size={36} className="size-fit h-9" />
                                                <div className="flex flex-col items-start">
                                                    <p className="text-sm text-milk truncate max-w-60">{token.symbol.toUpperCase()}</p>
                                                    <p className="text-xs text-milk-400">{shortenAddress(token.address)}</p>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </>
                    )}

                    <p className="p-4 text-base text-milk-400">Popular tokens</p>
                    <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }} className="mb-4">
                        {rowVirtualizer.getVirtualItems().map((virtualRow: VirtualItem) => {
                            const token = filteredTokens[virtualRow.index]
                            return (
                                <button
                                    key={token.address}
                                    ref={rowVirtualizer.measureElement}
                                    onClick={() => handleTokenSelect(token)}
                                    disabled={token.address === (selectTokenModalFor === 'buy' ? sellToken.address : buyToken.address)}
                                    className={cn(
                                        'absolute left-0 right-0 px-2.5 h-[52px] mb-[2px] rounded-xl flex justify-between hover:bg-very-light-hover group hover:bg-milk-600/5',
                                        {
                                            'bg-milk-600/5': [
                                                selectTokenModalFor === 'buy' ? buyToken.symbol.toLowerCase() : sellToken.symbol.toLowerCase(),
                                            ].includes(token.symbol.toLowerCase()),
                                            'opacity-30 cursor-not-allowed':
                                                token.address === (selectTokenModalFor === 'buy' ? sellToken.address : buyToken.address),
                                        },
                                    )}
                                    style={{ top: 0, transform: `translateY(${virtualRow.start}px)` }}
                                >
                                    <div className="flex items-center gap-4">
                                        <TokenImage token={token} size={36} className="size-fit h-9" />
                                        <div className="flex flex-col items-start">
                                            <p className="text-sm text-milk-600 truncate max-w-60">{token.symbol.toUpperCase()}</p>
                                            <p className="text-xs text-milk-400">{shortenAddress(token.address)}</p>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                    <span className="h-2" />
                </div>
            </motion.div>
        </Backdrop>
    )
}
