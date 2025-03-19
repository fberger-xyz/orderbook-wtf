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
            <div className="flex flex-col gap-3 w-full">
                {/* buy */}
                <div className="flex flex-col rounded-3xl border border-light-hover p-4 gap-2 bg-very-light-hover/50">
                    <p className="text-sm text-inactive">You sell</p>
                    <div className="flex justify-between">
                        <Link
                            href="/?select-token=true"
                            className="bg-light-hover px-2.5 py-1.5 rounded-xl flex items-center gap-2 hover:bg-very-light-hover group shadow-lg"
                        >
                            <Image
                                src={`https://raw.githubusercontent.com/bgd-labs/web3-icons/main/icons/full/${tradeSide === OrderbookSide.BID ? selectedToken0.symbol.toLowerCase() : selectedToken1.symbol.toLowerCase()}.svg`}
                                width={24}
                                height={24}
                                alt="https://x.com/fberger_xyz/photo"
                                className="rounded-full"
                            />
                            <p className="text-secondary font-bold">
                                {tradeSide === OrderbookSide.BID ? selectedToken0.symbol : selectedToken1.symbol}
                            </p>
                            <IconWrapper icon={IconIds.CHEVRON_DOWN} className="size-4 group-hover:text-primary" />
                        </Link>
                        <input
                            type="text"
                            className="ml-auto bg-transparent text-xl font-bold text-right"
                            value={numeral(selectedToken0Amount).format('0,0.[00000]')}
                        />
                    </div>
                    <div className="flex w-full justify-between items-center mt-2 text-xs px-2">
                        <div className="flex gap-1 items-center text-inactive">
                            <IconWrapper icon={IconIds.WALLET} className="size-3" />
                            <p>0</p>
                        </div>
                        <p className="ml-auto text-right text-inactive">todo ~ value in $</p>
                    </div>
                </div>

                {/* sell */}
                <div className="flex flex-col rounded-3xl border border-light-hover p-4 gap-2 bg-very-light-hover/50">
                    <p className="text-sm text-inactive">You buy</p>
                    <div className="flex justify-between w-full">
                        <Link
                            href="/?select-token=true"
                            className="bg-light-hover px-2.5 py-1.5 rounded-xl flex items-center gap-2 hover:bg-very-light-hover group shadow-lg"
                        >
                            <Image
                                src={`https://raw.githubusercontent.com/bgd-labs/web3-icons/main/icons/full/${tradeSide === OrderbookSide.BID ? selectedToken1.symbol.toLowerCase() : selectedToken0.symbol.toLowerCase()}.svg`}
                                width={24}
                                height={24}
                                alt="https://x.com/fberger_xyz/photo"
                                className="rounded-full"
                            />
                            <p className="text-secondary font-bold">
                                {tradeSide === OrderbookSide.BID ? selectedToken1.symbol : selectedToken0.symbol}
                            </p>
                            <IconWrapper icon={IconIds.CHEVRON_DOWN} className="size-4 group-hover:text-primary" />
                        </Link>
                        <input
                            type="text"
                            className="ml-auto bg-transparent text-xl font-bold text-right"
                            value={numeral(selectedToken1Amount).format('0,0.[00000]')}
                        />
                    </div>
                    <div className="flex w-full justify-between items-center mt-2 text-xs px-2">
                        <div className="flex gap-1 items-center text-inactive">
                            <IconWrapper icon={IconIds.WALLET} className="size-3" />
                            <p>0</p>
                        </div>
                        <p className="ml-auto text-right text-inactive">todo ~ value in $</p>
                    </div>
                </div>

                {/* routes */}
                {routes.length > 0 && (
                    <div className="flex flex-col rounded-3xl border border-light-hover p-4 gap-2 bg-very-light-hover/50">
                        <p className="text-sm text-inactive">Route (todo)</p>
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
                    </div>
                )}

                {/* fees etc */}
                {selectedTrade && (
                    <div className="flex flex-col rounded-3xl border border-light-hover p-4 gap-2 bg-very-light-hover/50">
                        <p className="text-sm text-inactive">Fees (todo)</p>
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
