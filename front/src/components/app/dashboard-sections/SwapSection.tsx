'use client'

import { IconIds, OrderbookSide } from '@/enums'
import numeral from 'numeral'
import { useAppStore } from '@/stores/app.store'
import { ChangeEvent, useState, useRef } from 'react'
import IconWrapper from '../../common/IconWrapper'
import TokenImage from '../commons/TokenImage'
import { SelectedTrade, Token } from '@/interfaces'
import SelectTokenModal from '../SelectTokenModal'
import {
    cleanOutput,
    cn,
    extractErrorMessage,
    formatAmount,
    formatInputWithCommas,
    getBaseValueInUsd,
    getQuoteValueInUsd,
    mergeOrderbooks,
    safeNumeral,
    sanitizeSwapInput,
    simulateTradeForAmountIn,
} from '@/utils'
import { useApiStore } from '@/stores/api.store'
import toast from 'react-hot-toast'
import { toastStyle } from '@/config/toasts.config'

const TokenSelector = ({ token, onClick }: { token: Token | undefined; onClick: () => void }) => (
    <button
        onClick={onClick}
        className="flex rounded-full bg-gray-600/30 transition-colors duration-300 hover:bg-gray-600/50 items-center pl-1.5 pr-2 py-1.5 min-w-fit"
    >
        <TokenImage size={24} token={token} />
        {token ? (
            <p className="font-semibold tracking-wide pl-1.5">{token.symbol}</p>
        ) : (
            <div className="skeleton-loading flex w-16 h-6 items-center justify-center rounded-full pl-1.5" />
        )}
        <IconWrapper icon={IconIds.TRIANGLE_DOWN} className="size-5" />
    </button>
)

const TradeDetails = ({ isLoading, selectedTrade, sellToken }: { isLoading: boolean; selectedTrade?: SelectedTrade; sellToken?: Token }) => (
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
        selectTrade,
        setShowSelectTokenModal,
        setSelectTokenModalFor,
        getAddressPair,
        currentChainId,
    } = useAppStore()

    const { metrics, actions } = useApiStore()
    // const account = useAccount()
    const [openTradeDetails, setOpenTradeDetails] = useState(false)
    // const [sellTokenBalance] = useState(-1)
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

    const simulateTradeAndMergeOrderbook = async (amountIn: number, start: number) => {
        try {
            // state
            setIsRefreshingMarketDepth(true)

            // prevent useless processing
            if (amountIn !== sellTokenAmountInput) return
            const currentOrderbook = actions.getOrderbook(getAddressPair())
            if (!currentOrderbook) return

            // simulate trade and update state (orderbook then selected trade)
            const orderbookWithTrade = await simulateTradeForAmountIn(currentChainId, sellToken, buyToken, amountIn)
            const mergedOrderbook = mergeOrderbooks(currentOrderbook, orderbookWithTrade)
            actions.setApiOrderbook(getAddressPair(), mergedOrderbook)
            const newSelectedTrade = orderbookWithTrade?.bids.find((bid) => bid.amount === amountIn)
            if (orderbookWithTrade && newSelectedTrade) {
                // if trade found AND trade amount equals what the input set by user
                if (newSelectedTrade && newSelectedTrade.amount === sellTokenAmountInput) {
                    selectTrade({
                        side: OrderbookSide.BID,
                        amountIn: sellTokenAmountInput,
                        selectedAt: Date.now(),
                        trade: newSelectedTrade,
                        pools: orderbookWithTrade.pools,
                        xAxis: newSelectedTrade.average_sell_price,
                    })

                    // end
                    toast(
                        `Trade simulated (~${numeral(Date.now() - start)
                            .divide(1000)
                            .format('0,0.0')}s)`,
                        { style: toastStyle },
                    )

                    // trigger an ui refresh
                    actions.setApiStoreRefreshedAt(Date.now())
                }
            }
        } catch (error) {
        } finally {
            setIsRefreshingMarketDepth(false)
        }
    }

    const handleChangeOfAmountIn = async (event: ChangeEvent<HTMLInputElement>) => {
        try {
            const raw = event.target.value.replace(/,/g, '') // remove commas first
            if (!/^[\d.]*$/.test(raw)) return // skip if invalid char

            // allow input like '12.', '0.', etc.
            const dotCount = (raw.match(/\./g) || []).length
            if (dotCount > 1) return

            // format and set state
            const formatted = formatInputWithCommas(raw)
            setSellTokenAmountInputRaw(formatted)

            // parse numeric part for logic
            const numeric = sanitizeSwapInput(raw)
            if (isNaN(Number(numeric))) return

            setSellTokenAmountInput(Number(numeric))
            selectTrade({
                side: OrderbookSide.BID,
                amountIn: Number(numeric),
                selectedAt: Date.now(),
                trade: undefined,
                pools: [],
                xAxis: -1,
            })

            // debounce
            const start = Date.now()
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
            debounceTimeout.current = setTimeout(() => {
                simulateTradeAndMergeOrderbook(Number(numeric), start)
            }, 600)
        } catch (error) {
            toast.error(`Unexpected error while fetching price: ${extractErrorMessage(error)}`, { style: toastStyle })
        }
    }

    return (
        <>
            <div className="w-full flex flex-col gap-1">
                {/* Sell section */}
                <div className="flex gap-3 p-4 rounded-xl border-milk-150 w-full bg-milk-100 justify-between items-center">
                    <div className="flex gap-2 items-center">
                        <p className="text-milk-600 text-xs">Sell</p>
                        <TokenSelector
                            token={sellToken}
                            onClick={() => {
                                setSelectTokenModalFor('sell')
                                setShowSelectTokenModal(true)
                            }}
                        />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <input
                            type="text"
                            className="text-base font-semibold text-right border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none bg-transparent w-full"
                            value={sellTokenAmountInputRaw}
                            onChange={handleChangeOfAmountIn}
                        />
                        {selectedTrade ? (
                            getBaseValueInUsd(metrics?.orderbook) ? (
                                <p className="text-milk-600 text-xs">
                                    ${safeNumeral(selectedTrade.amountIn * (getBaseValueInUsd(metrics?.orderbook) as number), '0,0.[00]')}
                                </p>
                            ) : (
                                <div className="skeleton-loading flex w-20 h-4 items-center justify-center rounded-full" />
                            )
                        ) : (
                            <p className="ml-auto text-milk-600 text-xs">$0</p>
                        )}
                    </div>
                </div>

                {/* Token switch button */}
                <div className="h-0 w-full flex justify-center items-center z-10">
                    <div className="size-[32px] rounded-lg bg-background p-0.5">
                        <button
                            onClick={async () => {
                                actions.setApiOrderbook(getAddressPair(), undefined)
                                switchSelectedTokens()
                            }}
                            className="size-full rounded-lg bg-milk-600/5 flex items-center justify-center group"
                        >
                            <IconWrapper icon={IconIds.ARROW_DOWN} className="size-4 transition-transform duration-300 group-hover:rotate-180" />
                        </button>
                    </div>
                </div>

                {/* Buy section */}
                <div className="flex gap-3 p-4 rounded-xl border-milk-150 w-full bg-milk-100 justify-between items-center">
                    <div className="flex gap-2 items-center">
                        <p className="text-milk-600 text-xs">Buy</p>
                        <TokenSelector
                            token={buyToken}
                            onClick={() => {
                                setSelectTokenModalFor('buy')
                                setShowSelectTokenModal(true)
                            }}
                        />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <input
                            type="text"
                            className={cn('text-base font-semibold text-right border-none outline-none', {
                                'cursor-not-allowed bg-transparent ring-0 focus:ring-0 focus:outline-none focus:border-none w-full':
                                    selectedTrade?.trade || sellTokenAmountInput === 0,
                                'skeleton-loading ml-auto w-1/2 h-6 rounded-full text-transparent':
                                    (!selectedTrade?.trade && sellTokenAmountInput !== 0) || (sellTokenAmountInput > 0 && buyTokenAmountInput === 0),
                            })}
                            value={numeral(buyTokenAmountInput).format('0,0.[00000]')}
                            disabled={true}
                        />

                        {/* last row  */}
                        {selectedTrade?.trade ? (
                            <div className="flex justify-end items-center">
                                {isRefreshingMarketDepth || (sellTokenAmountInput > 0 && buyTokenAmountInput === 0) ? (
                                    <div className="skeleton-loading w-16 h-4 rounded-full" />
                                ) : (
                                    <p className="text-milk-600 text-xs">
                                        {sellTokenAmountInput !== 0 && buyTokenAmountInput && getQuoteValueInUsd(metrics?.orderbook)
                                            ? `$${numeral(buyTokenAmountInput).multiply(getQuoteValueInUsd(metrics?.orderbook)).format('0,0.[00]')}`
                                            : '$0'}
                                    </p>
                                )}
                            </div>
                        ) : sellTokenAmountInput === 0 ? (
                            <p className="ml-auto text-milk-600 text-xs">$0</p>
                        ) : (
                            <div className="ml-auto skeleton-loading flex w-20 h-4 items-center justify-center rounded-full" />
                        )}
                    </div>
                </div>

                {/* Separator */}
                <div className="h-0 w-full" />

                {/* Trade details section */}
                <div className="border-milk-100 bg-milk-50 backdrop-blur-xl flex flex-col gap-6 px-2 py-4 rounded-xl border text-xs">
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
                            onClick={() => setOpenTradeDetails(!openTradeDetails)}
                            className="flex gap-1.5 items-center hover:bg-milk-100/5 px-2 py-1 rounded-xl"
                        >
                            <IconWrapper icon={IconIds.GAS} className="size-4" />
                            {/* <ChainImage oneInchId={CHAINS_CONFIG[AppSupportedChains.ETHEREUM].oneInchId} className="size-4" /> */}
                            <p>
                                $
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
                        <TradeDetails
                            isLoading={isRefreshingMarketDepth || (!selectedTrade?.trade && sellTokenAmountInput !== 0)}
                            selectedTrade={selectedTrade}
                            sellToken={sellToken}
                        />
                    )}
                </div>
            </div>

            {/* select token modal */}
            <SelectTokenModal />
        </>
    )
}
