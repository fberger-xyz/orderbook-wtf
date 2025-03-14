'use client'

import { IconIds, OrderbookSide } from '@/enums'
import { useAppStore } from '@/stores/app.store'
import Button from '../common/Button'
import { ConnectOrDisconnect } from './ConnectOrDisconnect'
import { useAccount } from 'wagmi'
import numeral from 'numeral'

export default function SelectedTrade() {
    const { selectedTrade } = useAppStore()
    const account = useAccount()
    if (!selectedTrade) return <ConnectOrDisconnect />
    const [price, tradersInput, side, distribution] = selectedTrade.datapoint
    const tradersOutput = side === OrderbookSide.ASK ? tradersInput / price : tradersInput * price
    const routes = distribution.map((percent, percentIndex) => {
        const pool = OrderbookSide.ASK ? selectedTrade.asksPools[percentIndex] : selectedTrade.bidsPools[percentIndex]
        const attributes = OrderbookSide.ASK
            ? selectedTrade.asksPools[percentIndex].static_attributes
            : selectedTrade.bidsPools[percentIndex].static_attributes
        const hexaPercent = attributes.find((entry) => entry[0].toLowerCase() === 'fee')?.[1] ?? ''
        // return `- ${numeral(percent / 100).format('#4#0,0%')} in ${protocolName} ${numeral(parseInt(hexaPercent, 16)).divide(100).format('0,0.[0]')}bps`
        return { percent, pool, hexaPercent }
    })
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col rounded-2xl border border-light-hover p-2">
                <p className="text-sm font-bold text-secondary">Amount in</p>
                <div className="flex justify-between">
                    <p>USDC</p>
                    <p>{numeral(selectedTrade.datapoint[1]).format('0,0.[00000]')}</p>
                </div>
                <p className="ml-auto text-right text-sm text-inactive">~ value in $</p>
            </div>
            <div className="flex flex-col rounded-2xl border border-light-hover p-2">
                <p className="text-sm font-bold text-secondary">Amount out</p>
                <div className="flex justify-between">
                    <p>WETH</p>
                    <p>{numeral(tradersOutput).format('0,0.[00000]')}</p>
                </div>
                <p className="ml-auto text-right text-sm text-inactive">~ value in $</p>
            </div>
            <div className="flex flex-col rounded-2xl border border-light-hover p-2">
                <p className="text-sm font-bold text-secondary">Route</p>
                {routes.map((path, pathIndex) => (
                    <div key={`${path.pool.id}-${pathIndex}`} className="flex w-full gap-1 text-sm">
                        <p className="text-inactive">{path.pool.chain.slice(0, 3)}</p>
                        <p className="text-inactive">{'>'}</p>
                        <p className="text-inactive">{path.pool.protocol_system}</p>
                        <p className="text-inactive">{'>'}</p>
                        <p className="text-inactive">{path.pool.tokens.map((token) => token.symbol).join('/')}</p>
                        <p className="text-inactive">{numeral(parseInt(path.hexaPercent, 16)).divide(100).format('0,0.[0]')}bps</p>
                        <p className="text-inactive">{'>'}</p>
                        <p>{numeral(path.percent / 100).format('#4#0,0%')}</p>
                    </div>
                ))}
                <p className="ml-auto text-right text-sm text-inactive">~ value in $</p>
            </div>
            <div className="flex flex-col rounded-2xl border border-light-hover p-2">
                <p className="text-sm font-bold text-secondary">Fees</p>
                <p className="ml-auto text-right text-sm text-inactive">Todo</p>
            </div>
            {account.isConnected ? (
                <Button onClickFn={() => {}} text={'Sign transaction'} icons={{ right: IconIds.TRANSACTION }} className="w-full" />
            ) : (
                <ConnectOrDisconnect />
            )}
        </div>
    )
}
