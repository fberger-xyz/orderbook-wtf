'use client'

import { APP_PAGES, CHAINS_CONFIG } from '@/config/app.config'
import { useAppStore } from '@/stores/app.store'
import { cn, isCurrentPath, shortenAddress } from '@/utils'
import { useRef, useState, useMemo, Suspense, useEffect } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcutArgs'
import Image from 'next/image'
import { AppUrls, IconIds, SvgIds } from '@/enums'
import { toastStyle } from '@/config/toasts.config'
import { hardcodedTokensList } from '@/data/back-tokens'
import toast from 'react-hot-toast'
import IconWrapper from '../common/IconWrapper'
import SvgMapper from '../icons/SvgMapper'
import { useApiStore } from '@/stores/api.store'
import LinkWrapper from '../common/LinkWrapper'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export default function HeaderMobile() {
    const debug = false
    const { showMobileMenu, currentChainId, setCurrentChain, sellToken, buyToken, selectSellToken, selectBuyToken, setShowMobileMenu } = useAppStore()
    const { actions } = useApiStore()

    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // prevent unnecessary rerenders
    const currentChainConfig = useMemo(() => CHAINS_CONFIG[currentChainId], [currentChainId])

    // grid
    const [openGridDropdown, setOpenGridDropdown] = useState(false)
    const gridDropown = useRef<HTMLButtonElement>(null)
    useClickOutside(gridDropown, () => setOpenGridDropdown(false))

    // networks
    const [openNetworkDropown, setOpenNetworkDropown] = useState(false)
    const networkDropown = useRef<HTMLButtonElement>(null)
    useClickOutside(networkDropown, () => setOpenNetworkDropown(false))

    // menu
    const menuDropdown = useRef<HTMLButtonElement>(null)
    useKeyboardShortcut({ key: 'Escape', onKeyPressed: () => setShowMobileMenu(false) })

    // -
    const handleNetworkChange = useMemo(
        () => (chainConfig: (typeof CHAINS_CONFIG)[keyof typeof CHAINS_CONFIG]) => {
            if (chainConfig.wagmi?.id) {
                setCurrentChain(chainConfig.id, hardcodedTokensList[chainConfig.id][1], hardcodedTokensList[chainConfig.id][0])
                toast.success(`Chain selected: ${chainConfig.name}`, { style: toastStyle })
                actions.setMetrics(undefined)
            }
        },
        [setCurrentChain, actions],
    )

    /**
     * manage url sync with currently selected chain and tokens
     */

    // 1. update the state to follow the url
    useEffect(() => {
        // -
        if (pathname === AppUrls.ABOUT) return

        // extract
        const urlChain = String(searchParams.get('chain')).toLowerCase()
        const urlSell = String(searchParams.get('sell'))
        const urlBuy = String(searchParams.get('buy'))

        // find
        const chainConfig = Object.values(CHAINS_CONFIG).find((c) => c.name.toLowerCase() === urlChain)
        if (debug) console.log('Header 1 |', { chainConfig, urlChain, urlSell, urlBuy })

        // set
        if (chainConfig) {
            // sell
            let targetSellToken = hardcodedTokensList[chainConfig.id].find((token) => token.address.toLowerCase() === urlSell.toLowerCase())
            if (!targetSellToken) {
                // console.log('switching to default sell token')
                targetSellToken = hardcodedTokensList[chainConfig.id][1]
            }

            // buy
            let targetBuyToken = hardcodedTokensList[chainConfig.id].find((token) => token.address.toLowerCase() === urlBuy.toLowerCase())
            if (!targetBuyToken) {
                // console.log('switching to default buy token')
                targetBuyToken = hardcodedTokensList[chainConfig.id][0]
            }

            if (targetSellToken.address.toLowerCase() === targetBuyToken.address.toLowerCase()) {
                targetSellToken = hardcodedTokensList[chainConfig.id][1]
                targetBuyToken = hardcodedTokensList[chainConfig.id][0]
            }

            // debug
            if (debug)
                console.log(
                    `Header 1 | current sellToken.address ${shortenAddress(sellToken.address)} !== targetSellToken.address ${shortenAddress(targetSellToken.address)}`,
                    sellToken.address !== targetSellToken.address,
                )
            if (debug)
                console.log(
                    `Header 1 | current buyToken.address ${shortenAddress(buyToken.address)} !== targetBuyToken.address ${shortenAddress(targetBuyToken.address)}`,
                    buyToken.address !== targetBuyToken.address,
                )

            // set state
            if (currentChainId !== chainConfig.id) setCurrentChain(chainConfig.id, targetSellToken, targetBuyToken)
            else {
                if (sellToken.address !== targetSellToken.address) {
                    if (debug) console.log('Header 1 | change sell to follow URL')
                    selectSellToken(targetSellToken)
                }
                if (buyToken.address !== targetBuyToken.address) {
                    if (debug) console.log('Header 1 | change buy to follow URL')
                    selectBuyToken(targetBuyToken)
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname])

    // 2. update the url to follow the state
    useEffect(() => {
        // -
        if (pathname === AppUrls.ABOUT) return

        // const params = new URLSearchParams(searchParams.toString())
        const urlChain = String(searchParams.get('chain')).toLowerCase()
        const urlSell = String(searchParams.get('sell'))
        const urlBuy = String(searchParams.get('buy'))

        // -
        const appChain = CHAINS_CONFIG[currentChainId].name.toLowerCase()
        if (urlChain !== appChain) {
            // params.set('chain', appChain)
            const newUrl = `${pathname}?chain=${appChain}&sell=${sellToken.address}&buy=${buyToken.address}`
            if (debug) console.log('Header 2 | new chain', newUrl)
            router.replace(newUrl)
        }
        if (urlSell !== sellToken.address) {
            // params.set('sell', sellToken.address)
            const newUrl = `${pathname}?chain=${appChain}&sell=${sellToken.address}&buy=${buyToken.address}`
            if (debug) console.log('Header 2 | new sellToken', sellToken.address)
            router.replace(newUrl)
        }
        if (urlBuy !== buyToken.address) {
            // params.set('buy', buyToken.address)
            const newUrl = `${pathname}?chain=${appChain}&sell=${sellToken.address}&buy=${buyToken.address}`
            if (debug) console.log('Header 2 | new buyToken', buyToken.address)
            router.replace(newUrl)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentChainId, sellToken, buyToken])

    return (
        <div className={cn('flex justify-center z-50 w-full', { 'fixed top-0': showMobileMenu })}>
            <div className="w-full lg:hidden flex justify-between px-5 pt-4 ">
                {/* left */}
                <div className="flex gap-4 items-center z-30">
                    {/* grid */}
                    <button ref={gridDropown} onClick={() => setOpenGridDropdown(!openGridDropdown)} className="relative">
                        <div className="bg-milk-100 p-2.5 rounded-xl">
                            <Image src={'/dots-grid.svg'} alt="dots-grid" width={16} height={16} className="min-w-4" />
                        </div>

                        {/* grid dropdown */}
                        <div
                            className={cn(
                                `absolute left-0 mt-2 w-52 rounded-2xl backdrop-blur-lg bg-milk-200/4 border-milk-150 border-2 shadow-lg p-2 transition-all origin-top-left flex flex-col items-start z-10 gap-1`,
                                {
                                    'scale-100 opacity-100': openGridDropdown,
                                    'scale-95 opacity-0 pointer-events-none': !openGridDropdown,
                                },
                            )}
                        >
                            <div className="cursor-not-allowed p-2.5 w-full rounded-xl flex justify-between items-center">
                                <p className="text-sm text-gray-500 text-left">Explorer</p>
                                <p className="bg-white/20 px-1 font-semibold rounded-sm text-xs text-background">SOON</p>
                            </div>
                            <div onClick={() => setOpenGridDropdown(false)} className="bg-gray-600/20 p-2.5 w-full rounded-xl">
                                <p className="text-sm text-milk text-left">Orderbook</p>
                            </div>
                        </div>
                    </button>

                    {/* logo */}
                    <Image src={'/Tycho-orderbook-sm.svg'} alt={SvgIds.TYCHO_ORDERBOOK} width={132} height={24} />
                </div>

                {/* right */}
                <div className="flex gap-2 z-30">
                    {/* networks */}
                    <button ref={networkDropown} onClick={() => setOpenNetworkDropown(!openNetworkDropown)} className="relative">
                        <div className="flex items-center gap-1 bg-milk-100/5 transition-colors duration-300 hover:bg-milk-100/10 rounded-xl h-10 px-3">
                            <SvgMapper icon={currentChainConfig.svgId} className="size-5" />
                            <IconWrapper icon={IconIds.TRIANGLE_DOWN} className="size-5" />
                        </div>

                        {/* networks dropdown */}
                        <div
                            className={cn(
                                `absolute right-0 mt-2 w-52 rounded-2xl backdrop-blur-lg bg-milk-200/4 border-milk-150 border-2 shadow-lg p-2.5 transition-all origin-top-right flex flex-col gap-1`,
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
                                            onClick={() => handleNetworkChange(chainConfig)}
                                            className={cn(
                                                'flex items-center gap-2 w-full px-4 py-2 text-white rounded-lg transition cursor-pointer',
                                                {
                                                    'bg-gray-600/30': currentChainId === chainConfig.id,
                                                    'hover:opacity-100 hover:bg-gray-600/20': currentChainId !== chainConfig.id,
                                                },
                                            )}
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

                    {/* menu */}
                    <button
                        ref={menuDropdown}
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="flex items-center gap-1 bg-milk-100/5 transition-colors duration-300 hover:bg-milk-100/10 rounded-xl h-10 px-3"
                    >
                        <IconWrapper icon={showMobileMenu ? IconIds.CLOSE : IconIds.MENU} className="size-5" />
                    </button>
                </div>

                {showMobileMenu && (
                    <div
                        className="fixed z-20 inset-0 flex size-full items-center justify-center px-4 backdrop-blur-xl bg-[#190A35B2]"
                        onClick={(e) => {
                            // to improve later
                            if (e.target === e.currentTarget) {
                                setShowMobileMenu(false)
                            }
                        }}
                    >
                        <Suspense
                            fallback={
                                <nav className="absolute inset-2 z-30 flex items-center justify-center h-fit flex-col gap-2 pt-28">
                                    {[1, 2, 3].map((index) => (
                                        <div key={index}>
                                            <p className="text-base p-2.5 skeleton-loading text-transparent">----------------------</p>
                                        </div>
                                    ))}
                                </nav>
                            }
                        >
                            <nav className="absolute inset-2 z-30 flex items-center justify-center h-fit flex-col gap-2 pt-28">
                                {APP_PAGES.map((page) => (
                                    <LinkWrapper key={page.path} href={page.path}>
                                        <p
                                            className={cn('text-base text-milk p-2.5 hover:bg-milk-100/5 rounded-xl cursor-pointer', {
                                                'bg-milk-100/5': isCurrentPath(pathname, page.path),
                                            })}
                                        >
                                            {page.name}
                                        </p>
                                    </LinkWrapper>
                                ))}
                                <LinkWrapper href={AppUrls.DOCUMENTATION} target="_blank" className="flex items-center gap-1 cursor-alias p-2.5">
                                    <p className="text-base">Docs (Run locally)</p>
                                    <IconWrapper icon={IconIds.OPEN_LINK_IN_NEW_TAB} className="size-4" />
                                </LinkWrapper>
                            </nav>
                        </Suspense>
                    </div>
                )}
            </div>
        </div>
    )
}
