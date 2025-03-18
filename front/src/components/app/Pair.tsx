'use client'

import { IconIds } from '@/enums'
import IconWrapper from '../common/IconWrapper'
import { cn } from '@/utils'
import { useAppStore } from '@/stores/app.store'

export default function Pair(props: { pair: string }) {
    const { selectedPair, selectPair } = useAppStore()

    return (
        <button
            className={cn('flex gap-3 border rounded-xl py-1.5 px-2 items-center', {
                'bg-light-hover border-primary': props.pair === selectedPair,
                'bg-very-light-hover border-light-hover hover:border-inactive hover:bg-light-hover': props.pair !== selectedPair,
            })}
            onClick={() => selectPair(props.pair)}
        >
            {props.pair.toLowerCase().includes('ethereum') ? <IconWrapper icon={IconIds.ASSET_ETH} className="size-5" /> : null}
            <p className={cn('text-base', { 'text-primary': props.pair === selectedPair })}>
                {props.pair.replace('orderbook.ethereum.', '').replace('.json', '')}
            </p>
        </button>
    )
}
