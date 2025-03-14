'use client'

import { APP_THEMES } from '@/config/app.config'
import { cn } from '@/utils'
import { Tooltip } from '@nextui-org/tooltip'
import IconWrapper from '../common/IconWrapper'
import { useTheme } from 'next-themes'
import Logo from './Logo'
import { useAppStore } from '@/stores/app.store'

export default function HeaderDesktop(props: { className?: string }) {
    const { resolvedTheme, setTheme } = useTheme()
    const { showMobileMenu } = useAppStore()
    return (
        <div
            className={cn(
                'flex items-start justify-between w-full border-b px-8 pt-3',
                { 'bg-transparent border-transparent': showMobileMenu, 'border-transparent': !showMobileMenu },
                props.className,
            )}
        >
            <Logo />
            <div className="z-40 flex justify-end gap-1">
                <div className={cn('pl-10 flex justify-end gap-1', props.className)}>
                    {Object.entries(APP_THEMES)
                        .sort((curr, next) => curr[1].index - next[1].index)
                        .map(([theme, config]) => (
                            <Tooltip
                                key={theme}
                                content={
                                    <p className="rounded-2xl border border-light-hover bg-very-light-hover px-3 py-0.5 text-base text-primary">
                                        Show {theme} mode
                                    </p>
                                }
                            >
                                <button
                                    onClick={() => setTheme(theme)}
                                    className={cn('rounded-2xl px-2 sm:px-2.5 py-2 hover:bg-light-hover border shadow-sm', {
                                        'bg-background border-light-hover text-primary': resolvedTheme === theme,
                                        'text-inactive border-transparent': resolvedTheme !== theme,
                                    })}
                                >
                                    <IconWrapper icon={config.iconId} className="size-6" />
                                </button>
                            </Tooltip>
                        ))}
                </div>
            </div>
        </div>
    )
}
