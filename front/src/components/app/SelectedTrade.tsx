'use client'

import { IconIds, OrderbookSide } from '@/enums'
import { useAppStore } from '@/stores/app.store'
import Button from '../common/Button'
import { ConnectOrDisconnect } from '../wallet/ConnectOrDisconnect'
import { useAccount } from 'wagmi'
import numeral from 'numeral'
import { AmmPool } from '@/interfaces'
import IconWrapper from '../common/IconWrapper'
import SelectTokenModal from './SelectTokenModal'
import Link from 'next/link'
import Image from 'next/image'

export default function SelectedTrade() {
    const { selectedTrade, selectedToken0, selectedToken1 } = useAppStore()
    const account = useAccount()
    if (!selectedToken0 || !selectedToken1)
        return (
            <div className="flex flex-col gap-3 w-full">
                {/* <p className="font-bold mx-auto">Actions</p> */}
                <ConnectOrDisconnect />
            </div>
        )

    let selectedToken0Amount = 0
    let selectedToken1Amount = 0
    let routes: { percent: number; pool: AmmPool; hexaPercent: string }[] = []
    let tradeSide: OrderbookSide = OrderbookSide.ASK

    if (selectedTrade) {
        const [price, tradersInput, side, distribution] = selectedTrade.datapoint
        tradeSide = side
        selectedToken0Amount = tradersInput
        selectedToken1Amount = side === OrderbookSide.ASK ? tradersInput / price : tradersInput * price
        routes = distribution.map((percent, percentIndex) => {
            const pool = OrderbookSide.ASK ? selectedTrade.asksPools[percentIndex] : selectedTrade.bidsPools[percentIndex]
            const attributes = OrderbookSide.ASK
                ? selectedTrade.asksPools[percentIndex].static_attributes
                : selectedTrade.bidsPools[percentIndex].static_attributes
            const hexaPercent = attributes.find((entry) => entry[0].toLowerCase() === 'fee')?.[1] ?? ''
            return { percent, pool, hexaPercent }
        })
    }
    return (
        <div className="flex flex-col gap-3 w-full">
            {/* <p className="font-bold mx-auto">Actions</p> */}
            <div className="flex flex-col gap-3 w-full">
                <div className="flex flex-col rounded-2xl border border-light-hover p-2">
                    <p className="text-sm font-bold text-inactive">Token in</p>
                    <div className="flex justify-between">
                        <Link
                            href="/?select-token=true"
                            className="bg-light-hover px-2 py-1 rounded-xl flex items-center gap-2 hover:bg-very-light-hover group shadow-md"
                        >
                            <Image
                                src={`https://raw.githubusercontent.com/bgd-labs/web3-icons/main/icons/full/${tradeSide === OrderbookSide.BID ? selectedToken0.symbol.toLowerCase() : selectedToken1.symbol.toLowerCase()}.svg`}
                                width={20}
                                height={22}
                                alt="https://x.com/fberger_xyz/photo"
                                className="rounded-full"
                            />
                            <p className="text-secondary">{tradeSide === OrderbookSide.BID ? selectedToken0.symbol : selectedToken1.symbol}</p>
                            <IconWrapper icon={IconIds.CHEVRON_DOWN} className="size-4 group-hover:text-primary" />
                        </Link>
                        {/* <button
                            onClick={() => {}}
                            className="bg-light-hover px-2 py-1 rounded-xl flex items-center gap-1.5 hover:bg-very-light-hover group shadow-md"
                        >
                            <span className="size-5 rounded-full bg-inactive" />
                            <p className="text-primary">{tradeSide === OrderbookSide.BID ? selectedToken0.symbol : selectedToken1.symbol}</p>
                            <IconWrapper icon={IconIds.CHEVRON_DOWN} className="size-4 group-hover:text-primary" />
                        </button> */}
                        <p>{numeral(selectedToken0Amount).format('0,0.[00000]')}</p>
                    </div>
                    <p className="ml-auto text-right text-xs text-inactive">~ value in $</p>
                </div>
                <div className="flex flex-col rounded-2xl border border-light-hover p-2">
                    <p className="text-sm font-bold text-inactive">Token out</p>
                    <div className="flex justify-between">
                        {/* <button
                            onClick={() => {}}
                            className="bg-light-hover px-2 py-1 rounded-xl flex items-center gap-1.5 hover:bg-very-light-hover group shadow-md"
                        >
                            <span className="size-5 rounded-full bg-inactive" />
                            <p className="text-primary">{tradeSide === OrderbookSide.BID ? selectedToken1.symbol : selectedToken0.symbol}</p>
                            <IconWrapper icon={IconIds.CHEVRON_DOWN} className="size-4 group-hover:text-primary" />
                        </button> */}
                        <Link
                            href="/?select-token=true"
                            className="bg-light-hover px-2 py-1 rounded-xl flex items-center gap-2 hover:bg-very-light-hover group shadow-md"
                        >
                            <Image
                                src={`https://raw.githubusercontent.com/bgd-labs/web3-icons/main/icons/full/${tradeSide === OrderbookSide.BID ? selectedToken1.symbol.toLowerCase() : selectedToken0.symbol.toLowerCase()}.svg`}
                                width={20}
                                height={20}
                                alt="https://x.com/fberger_xyz/photo"
                                className="rounded-full"
                            />
                            <p className="text-secondary">{tradeSide === OrderbookSide.BID ? selectedToken1.symbol : selectedToken0.symbol}</p>
                            <IconWrapper icon={IconIds.CHEVRON_DOWN} className="size-4 group-hover:text-primary" />
                        </Link>
                        <p>{numeral(selectedToken1Amount).format('0,0.[00000]')}</p>
                    </div>
                    <p className="ml-auto text-right text-xs text-inactive">~ value in $</p>
                </div>
                {routes.length > 0 && (
                    <div className="flex flex-col rounded-2xl border border-light-hover p-2">
                        <p className="text-sm font-bold text-secondary">Route</p>
                        {routes.map((path, pathIndex) => (
                            <div key={`${path.pool.id}-${pathIndex}`} className="flex w-full gap-1 text-sm">
                                {/* hardcoded */}
                                <p className="text-inactive">mainnet</p>
                                <p className="text-inactive">{'>'}</p>
                                <p className="text-inactive">{path.pool.protocol_system}</p>
                                <p className="text-inactive">{'>'}</p>
                                <p className="text-inactive">{path.pool.tokens.map((token) => token.symbol).join('/')}</p>
                                {/* <p className="text-inactive">{numeral(parseInt(path.hexaPercent, 16)).divide(100).format('0,0.[0]')}bps</p> */}
                                <p className="text-inactive">{'>'}</p>
                                <p>{numeral(path.percent / 100).format('#4#0,0%')}</p>
                            </div>
                        ))}
                        <p className="ml-auto text-right text-xs text-inactive">~ value in $</p>
                    </div>
                )}
                {selectedTrade && (
                    <div className="flex flex-col rounded-2xl border border-light-hover p-2">
                        <p className="text-sm font-bold text-secondary">Fees</p>
                        <p className="ml-auto text-right text-xs text-inactive">Todo</p>
                    </div>
                )}
                {account.isConnected ? (
                    <Button onClickFn={() => {}} text={'Sign transaction'} icons={{ right: IconIds.TRANSACTION }} className="w-full" />
                ) : (
                    <ConnectOrDisconnect />
                )}
            </div>
            <SelectTokenModal />
        </div>
    )
}
