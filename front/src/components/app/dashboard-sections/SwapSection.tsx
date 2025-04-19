'use client'

import { AppSupportedChains, IconIds, OrderbookSide } from '@/enums'
import numeral from 'numeral'
import { useAppStore } from '@/stores/app.store'
import { ChangeEvent, useState, useRef } from 'react'
import IconWrapper from '../../common/IconWrapper'
import TokenImage from '../commons/TokenImage'
import ChainImage from '../commons/ChainImage'
import { SelectedTrade, Token } from '@/interfaces'
import SelectTokenModal from '../SelectTokenModal'
import { useAccount } from 'wagmi'
import {
    cleanOutput,
    cn,
    extractErrorMessage,
    formatAmount,
    formatOrDisplayRaw,
    getBaseValueInUsd,
    getHighestBid,
    getQuoteValueInUsd,
    mergeOrderbooks,
    safeNumeral,
    simulateTradeForAmountIn,
} from '@/utils'
import { useApiStore } from '@/stores/api.store'
import { CHAINS_CONFIG } from '@/config/app.config'
import toast from 'react-hot-toast'
import { toastStyle } from '@/config/toasts.config'

const rawAmountFormat = '0,0.[00000000000]'

const TokenSelector = ({ token, onClick }: { token: Token | undefined; onClick: () => void }) => (
    <button
        onClick={onClick}
        className="flex rounded-full bg-gray-600/30 transition-colors duration-300 hover:bg-gray-600/50 items-center gap-1.5 pl-1.5 pr-2 py-1.5 min-w-fit"
    >
        <TokenImage size={24} token={token} />
        {token ? (
            <p className="font-semibold tracking-wide">{token.symbol}</p>
        ) : (
            <div className="skeleton-loading flex w-16 h-6 items-center justify-center rounded-full" />
        )}
        <IconWrapper icon={IconIds.TRIANGLE_DOWN} className="size-4" />
    </button>
)

const TradeDetails = ({
    isLoading,
    selectedTrade,
    sellToken,
}: {
    isLoading: boolean
    selectedTrade: SelectedTrade | null
    sellToken: Token | undefined
}) => (
    <div className="flex flex-col gap-2 text-xs px-2">
        <div className="flex justify-between w-full text-milk-400">
            <p>Expected output</p>
            {isLoading ? (
                <div className="skeleton-loading w-16 h-4 rounded-full" />
            ) : (
                <p>{selectedTrade?.trade?.output ? cleanOutput(numeral(selectedTrade?.trade?.output).format('0,0.[000000]')) : 0}</p>
            )}
        </div>
        <div className="flex justify-between w-full text-milk-400">
            <p>Minimum received after slippage (0.2%)</p>
            {isLoading ? (
                <div className="skeleton-loading w-16 h-4 rounded-full" />
            ) : (
                <p>{selectedTrade?.trade?.output ? cleanOutput(numeral(selectedTrade?.trade?.output * 0.998).format('0,0.[000000]')) : 0}</p>
            )}
        </div>
        <div className="flex justify-between w-full text-milk-400">
            <p>Price Impact</p>
            {isLoading ? (
                <div className="skeleton-loading w-16 h-4 rounded-full" />
            ) : (
                <p>{selectedTrade?.trade?.price_impact ? cleanOutput(`~${numeral(selectedTrade?.trade?.price_impact).format('0,0.[00]%')}`) : '-'}</p>
            )}
        </div>
        <div className="flex justify-between w-full text-milk-400">
            <p>Gas token</p>
            <div className="flex gap-1 items-center">
                {sellToken ? (
                    <TokenImage size={16} token={sellToken} />
                ) : (
                    <span className="animate-pulse rounded-full bg-milk-150" style={{ width: 16, height: 16 }} />
                )}
                {sellToken ? (
                    <p className="font-semibold tracking-wide">{sellToken.symbol}</p>
                ) : (
                    <div className="skeleton-loading flex w-16 h-6 items-center justify-center rounded-full" />
                )}
            </div>
        </div>
        <div className="flex justify-between w-full text-milk-400">
            <p>Network Fee</p>
            {isLoading ? (
                <div className="skeleton-loading w-16 h-4 rounded-full" />
            ) : (
                <p>
                    {selectedTrade?.trade?.gas_costs_usd
                        ? cleanOutput(`~${numeral(selectedTrade?.trade?.gas_costs_usd.reduce((acc, curr) => (acc += curr), 0)).format('0,0.[00]')} $`)
                        : 0}
                </p>
            )}
        </div>
    </div>
)

export default function SwapSection() {
    const {
        sellToken,
        sellTokenAmountInput,
        sellTokenAmountInputRaw,
        setSellTokenAmountInput,
        setSellTokenAmountInputRaw,
        buyToken,
        buyTokenAmountInput,
        switchSelectedTokens,
        isRefreshingMarketDepth,
        setIsRefreshingMarketDepth,
        selectedTrade,
        selectOrderbookTrade,
        setShowSelectTokenModal,
        setSelectTokenModalFor,
        getAddressPair,
        currentChainId,
    } = useAppStore()

    const { metrics, setApiOrderbook, getOrderbook, setApiStoreRefreshedAt } = useApiStore()
    const account = useAccount()
    const [openTradeDetails, showTradeDetails] = useState(true)
    const [sellTokenBalance] = useState(-1)
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

    // todo: improve this
    if (sellTokenAmountInputRaw === 0 && sellTokenAmountInput !== 0) setSellTokenAmountInputRaw(sellTokenAmountInput)

    const simulateTradeAndMergeOrderbook = async (amountIn: number) => {
        try {
            // state
            setIsRefreshingMarketDepth(true)

            // prevent useless processing
            if (amountIn !== sellTokenAmountInput) return
            const currentOrderbook = getOrderbook(getAddressPair())
            if (!currentOrderbook) return

            // simulate trade and update state (orderbook then selected trade)
            const orderbookWithTrade = await simulateTradeForAmountIn(currentChainId, sellToken, buyToken, amountIn)
            const mergedOrderbook = mergeOrderbooks(currentOrderbook, orderbookWithTrade)
            setApiOrderbook(getAddressPair(), mergedOrderbook)
            if (orderbookWithTrade?.bids.length) {
                const newSelectedTrade = orderbookWithTrade.bids.find((bid) => bid.amount === amountIn)
                // if trade found AND trade amount equals what the input set by user
                if (newSelectedTrade && newSelectedTrade.amount === sellTokenAmountInput)
                    selectOrderbookTrade({
                        side: OrderbookSide.BID,
                        amountIn: amountIn,
                        selectedAt: Date.now(),
                        trade: newSelectedTrade,
                        pools: orderbookWithTrade.pools,
                        xAxis: newSelectedTrade.average_sell_price,
                    })
            }
        } catch (error) {
        } finally {
            // trigger an ui refresh
            setApiStoreRefreshedAt(Date.now())
            setIsRefreshingMarketDepth(false)
        }
    }

    const handleChangeOfAmountIn = async (event: ChangeEvent<HTMLInputElement>) => {
        try {
            // prepare
            const raw = event.target.value
            setSellTokenAmountInputRaw(raw)

            // parse
            const parsed = numeral(raw).value()
            const amountIn = typeof parsed === 'number' ? parsed : NaN
            if (isNaN(amountIn)) return

            // update ui
            setSellTokenAmountInput(amountIn)
            selectOrderbookTrade({
                side: OrderbookSide.BID,
                amountIn,
                selectedAt: Date.now(),
                trade: undefined,
                pools: [],
                xAxis: -1,
            })

            // debounced
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
            debounceTimeout.current = setTimeout(() => {
                simulateTradeAndMergeOrderbook(amountIn)
            }, 600) // 1000ms debounce delay
        } catch (error) {
            toast.error(`Unexepected error while fetching price: ${extractErrorMessage(error)}`, {
                style: toastStyle,
            })
        }
    }

    return (
        <>
            <div className="col-span-1 md:col-span-4 flex flex-col gap-0.5 xl:col-span-3">
                {/* Sell section */}
                <div className="flex flex-col gap-4 p-4 rounded-xl border-milk-150 w-full bg-milk-600/5">
                    <div className="flex justify-between items-end">
                        <p className="text-milk-600 text-xs">Sell</p>
                        <button
                            onClick={() => {
                                // retrieve best bid
                                const highestBid = getHighestBid(metrics?.orderbook)

                                // select it
                                if (metrics?.orderbook && highestBid) {
                                    selectOrderbookTrade({
                                        side: OrderbookSide.BID,
                                        amountIn: highestBid.amount,
                                        selectedAt: Date.now(),
                                        trade: highestBid,
                                        pools: metrics.orderbook.pools,
                                        xAxis: highestBid.average_sell_price,
                                    })

                                    // notify
                                    toast.success(`Best bid trade selected`, { style: toastStyle })
                                }
                            }}
                            className="flex items-center hover:bg-milk-600/5 px-2 py-1 rounded-lg -mb-1"
                        >
                            <p className="text-aquamarine text-xs">Best bid</p>
                        </button>
                    </div>
                    <div className="flex justify-between gap-3">
                        <TokenSelector
                            token={sellToken}
                            onClick={() => {
                                setSelectTokenModalFor('sell')
                                setShowSelectTokenModal(true)
                            }}
                        />
                        <input
                            type="text"
                            className="text-xl font-semibold text-right border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none bg-transparent w-full"
                            value={formatOrDisplayRaw(sellTokenAmountInputRaw, rawAmountFormat)}
                            onChange={handleChangeOfAmountIn}
                        />
                    </div>

                    {/* last row  */}
                    {selectedTrade ? (
                        <div className="mt-2 flex justify-between items-center">
                            <div className="flex items-center gap-1">
                                {account.isConnected && sellToken.address && (
                                    <button
                                        onClick={() => {
                                            setSellTokenAmountInput(sellTokenBalance)
                                            setSellTokenAmountInputRaw(numeral(sellTokenBalance).format(rawAmountFormat))
                                        }}
                                        className="pl-1"
                                    >
                                        <p className="text-folly font-semibold text-xs">MAX</p>
                                    </button>
                                )}
                            </div>
                            <p className="text-milk-600 text-xs">
                                {getBaseValueInUsd(metrics?.orderbook)
                                    ? `$ ${safeNumeral(selectedTrade.amountIn * (getBaseValueInUsd(metrics?.orderbook) as number), '0,0.[00]')}`
                                    : '-'}
                            </p>
                        </div>
                    ) : (
                        <p className="ml-auto text-milk-600 text-xs">$ 0</p>
                    )}
                </div>

                {/* Token switch button */}
                <div className="h-0 w-full flex justify-center items-center z-10">
                    <div className="size-[44px] rounded-xl bg-background p-1">
                        <button
                            onClick={async () => {
                                setApiOrderbook(getAddressPair(), undefined)
                                switchSelectedTokens()
                            }}
                            className="size-full rounded-lg bg-milk-600/5 flex items-center justify-center group"
                        >
                            <IconWrapper icon={IconIds.ARROW_DOWN} className="size-5 transition-transform duration-300 group-hover:rotate-180" />
                        </button>
                    </div>
                </div>

                {/* Buy section */}
                <div className="bg-milk-600/5 flex flex-col gap-4 p-4 rounded-xl border-milk-150 w-full">
                    <p className="text-milk-600 text-xs">Buy</p>
                    <div className="flex justify-between gap-3 w-full">
                        <TokenSelector
                            token={buyToken}
                            onClick={() => {
                                setSelectTokenModalFor('buy')
                                setShowSelectTokenModal(true)
                            }}
                        />
                        <input
                            type="text"
                            className={cn('text-xl font-semibold text-right border-none outline-none', {
                                'cursor-not-allowed bg-transparent ring-0 focus:ring-0 focus:outline-none focus:border-none w-full':
                                    selectedTrade?.trade || sellTokenAmountInput === 0,
                                'skeleton-loading ml-auto w-1/2 h-8 rounded-full text-transparent':
                                    !selectedTrade?.trade && sellTokenAmountInput !== 0,
                            })}
                            value={numeral(buyTokenAmountInput).format('0,0.[00000]')}
                            disabled={true}
                        />
                    </div>

                    {/* last row  */}
                    {selectedTrade ? (
                        <div className="flex justify-end items-center">
                            {isRefreshingMarketDepth ? (
                                <div className="skeleton-loading w-16 h-4 rounded-full" />
                            ) : (
                                <p className="text-milk-600 text-xs">
                                    ${' '}
                                    {sellTokenAmountInput !== 0 && buyTokenAmountInput && getQuoteValueInUsd(metrics?.orderbook)
                                        ? numeral(buyTokenAmountInput).multiply(getQuoteValueInUsd(metrics?.orderbook)).format('0,0.[00]')
                                        : '0'}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="ml-auto text-milk-600 text-xs">$ 0</p>
                    )}
                </div>

                {/* Separator */}
                <div className="h-0 w-full" />

                {/* Trade details section */}
                <div className="bg-milk-600/5 flex flex-col gap-6 px-2 py-4 rounded-xl border-milk-150 text-xs">
                    {/* summary */}
                    <div className="flex w-full justify-between items-center">
                        {sellToken && buyToken && metrics?.highestBid && metrics.orderbook ? (
                            <p className="text-milk-600 truncate pl-2">
                                1 {sellToken.symbol} = {formatAmount(metrics.midPrice)} {buyToken.symbol} (${' '}
                                {formatAmount(getBaseValueInUsd(metrics.orderbook))})
                            </p>
                        ) : sellToken && buyToken ? (
                            <div className="flex items-center gap-1">
                                <p className="text-milk-600 truncate pl-2">1 {sellToken.symbol} =</p>
                                <div className="skeleton-loading flex w-12 h-4 items-center justify-center rounded-full" />
                                <p className="text-milk-600 truncate">{buyToken.symbol}</p>
                            </div>
                        ) : (
                            <div className="skeleton-loading flex w-20 h-4 items-center justify-center rounded-full" />
                        )}

                        <button
                            onClick={() => showTradeDetails(!openTradeDetails)}
                            className="flex gap-1.5 items-center hover:bg-milk-100/5 px-2 py-1 rounded-xl"
                        >
                            <IconWrapper icon={IconIds.GAS} className="size-4 text-milk-600" />
                            <ChainImage oneInchId={CHAINS_CONFIG[AppSupportedChains.ETHEREUM].oneInchId} className="size-4" />
                            <p className="text-milk-600">
                                ${' '}
                                {metrics?.highestBid?.gas_costs_usd
                                    ? numeral(metrics?.highestBid.gas_costs_usd.reduce((cost, curr) => (cost += curr), 0)).format('0,0.[00]')
                                    : '-'}
                            </p>
                            <IconWrapper
                                icon={openTradeDetails ? IconIds.TRIANGLE_UP : IconIds.TRIANGLE_DOWN}
                                className="size-4 transition-transform duration-300"
                            />
                        </button>
                    </div>

                    {/* trade details */}
                    {openTradeDetails && (
                        <TradeDetails isLoading={isRefreshingMarketDepth} selectedTrade={selectedTrade ?? null} sellToken={sellToken} />
                    )}
                </div>
            </div>

            {/* select token modal */}
            <SelectTokenModal />
        </>
    )
}
