'use client'

import { APP_PAGES, APP_THEMES } from '@/config/app.config'
import { cn, isCurrentPath, sleep } from '@/utils'
import IconWrapper from '../common/IconWrapper'
import { AppPagePaths, IconIds } from '@/enums'
import { usePathname, useRouter } from 'next/navigation'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcutArgs'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useRef } from 'react'
import { Tooltip } from '@nextui-org/tooltip'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
// import Logo from './Logo'
import { useAppStore } from '@/stores/app.store'

export default function HeaderWithMenu(props: { className?: string }) {
    const pathname = usePathname()
    const { resolvedTheme, setTheme } = useTheme()
    const router = useRouter()
    const modalRef = useRef<HTMLDivElement>(null)
    const { showMobileMenu, setShowMobileMenu } = useAppStore()
    useClickOutside(modalRef, async () => {
        await sleep(100)
        setShowMobileMenu(false)
    })
    useKeyboardShortcut({
        key: 'Escape',
        onKeyPressed: async () => {
            await sleep(100)
            setShowMobileMenu(false)
        },
    })
    return (
        <div className="px-4" ref={modalRef}>
            <div
                className={cn(
                    'flex items-center w-full border-b px-4 pt-3',
                    { 'bg-transparent border-transparent': showMobileMenu, 'border-transparent': !showMobileMenu },
                    props.className,
                )}
            >
                {/* todo */}
                {/* <Logo /> */}
                <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="z-40 flex w-full grow justify-end">
                    <IconWrapper icon={showMobileMenu ? IconIds.CLOSE : IconIds.MENU} className="size-10 text-primary md:size-12" />
                </button>
                <span />
            </div>
            {showMobileMenu && (
                <motion.div
                    className="fixed inset-0 z-30 flex size-full items-center justify-center overflow-y-auto bg-gray-500/50 px-4 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowMobileMenu(false)}
                >
                    <div className="absolute inset-x-1 top-1 z-30 flex h-fit flex-col gap-2 rounded-2xl bg-background shadow-md">
                        <div className="flex flex-col gap-1 pb-6 pr-10 pt-20">
                            {/* legal links */}
                            <div className="flex w-full flex-col items-end gap-1">
                                {/* app AppPagePaths.RATES */}
                                {APP_PAGES?.filter((page) => [AppPagePaths.HOME].includes(page.path)).map((page) => (
                                    <button
                                        key={page.path}
                                        onClick={async () => {
                                            await router.push(page.path)
                                            await sleep(500).then(() => setShowMobileMenu(false))
                                        }}
                                        className="ml-auto"
                                    >
                                        <p
                                            className={cn('text-right text-2xl px-3 py-1.5 rounded-lg', {
                                                'font-bold text-primary bg-very-light-hover': isCurrentPath(pathname, page.path),
                                                'text-inactive': !isCurrentPath(pathname, page.path),
                                            })}
                                        >
                                            {page.name}
                                        </p>
                                    </button>
                                ))}
                            </div>

                            {/* theme */}
                            <div className="mt-6 flex w-full justify-end gap-3">
                                {Object.entries(APP_THEMES)
                                    .sort((curr, next) => curr[1].index - next[1].index)
                                    .map(([theme, config]) => (
                                        <Tooltip
                                            key={theme}
                                            content={
                                                <p className="rounded-lg border border-light-hover bg-very-light-hover px-3 py-0.5 capitalize text-primary">
                                                    {theme}
                                                </p>
                                            }
                                        >
                                            <button
                                                onClick={() => setTheme(theme)}
                                                className={cn('rounded-2xl p-3', {
                                                    'bg-background text-primary': resolvedTheme === theme,
                                                    'text-inactive': resolvedTheme !== theme,
                                                })}
                                            >
                                                <IconWrapper icon={config.iconId} className="size-9" />
                                            </button>
                                        </Tooltip>
                                    ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
