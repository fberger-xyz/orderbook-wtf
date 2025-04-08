'use client'

import { IconIds, OrderbookSide } from '@/enums'
import numeral from 'numeral'
import { useAppStore } from '@/stores/app.store'
import { ChangeEvent, useEffect, useState } from 'react'
import IconWrapper from '../../common/IconWrapper'
import TokenImage from '../TokenImage'
import ChainImage from '../ChainImage'
import { AmmAsOrderbook, SelectedTrade, StructuredOutput, Token } from '@/interfaces'
import SelectTokenModal from '../SelectTokenModal'
import { useModal } from 'connectkit'
import { useAccount } from 'wagmi'
import { cn, extractErrorMessage, fetchBalance, formatAmount, getBaseValueInUsd, getDashboardMetrics, getQuoteValueInUsd, safeNumeral } from '@/utils'
import { useApiStore } from '@/stores/api.store'
import { APP_ROUTE, IS_DEV } from '@/config/app.config'
import toast from 'react-hot-toast'
import { toastStyle } from '@/config/toasts.config'

type TokenBalanceProps = {
    balance: number
    isConnected: boolean
}

const TokenBalance = ({ balance, isConnected }: TokenBalanceProps) => (
    <div className="flex justify-between gap-1 items-center">
        <IconWrapper icon={IconIds.WALLET} className="size-4 text-milk-400" />
        <p className="text-milk-400 text-xs">{isConnected && balance >= 0 ? formatAmount(balance) : 0}</p>
    </div>
)

type TokenSelectorProps = {
    token: Token | undefined
    onClick: () => void
}

const TokenSelector = ({ token, onClick }: TokenSelectorProps) => (
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

type TradeDetailsProps = {
    isLoading: boolean
    selectedTrade: SelectedTrade | null
    sellToken: Token | undefined
}

const TradeDetails = ({ isLoading, selectedTrade, sellToken }: TradeDetailsProps) => (
    <div className="flex flex-col gap-2 text-xs px-2">
        <div className="flex justify-between w-full text-milk-400">
            <p>Expected output</p>
            <div className="skeleton-loading w-16 h-4 rounded-full" />
        </div>
        <div className="flex justify-between w-full text-milk-400">
            <p>Minimum received after slippage (0.2%)</p>
            <div className="skeleton-loading w-16 h-4 rounded-full" />
        </div>
        <div className="flex justify-between w-full text-milk-400">
            <p>Price Impact</p>
            {isLoading ? (
                <div className="skeleton-loading w-16 h-4 rounded-full" />
            ) : (
                <p>{selectedTrade?.trade?.price_impact ? numeral(selectedTrade?.trade?.price_impact).format('0,0.[000]%') : '-'}</p>
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
            <div className="skeleton-loading w-16 h-4 rounded-full" />
        </div>
    </div>
)

export default function SwapSection(props: { metrics: ReturnType<typeof getDashboardMetrics> }) {
    const {
        sellToken,
        sellTokenAmountInput,
        setSellTokenAmountInput,
        buyToken,
        buyTokenAmountInput,
        switchSelectedTokens,
        isLoadingSomeTrade,
        setIsLoadingSomeTrade,
        selectedTrade,
        selectOrderbookTrade,
        setShowSelectTokenModal,
        setSelectTokenModalFor,
        getAddressPair,
    } = useAppStore()

    const { setApiOrderbook, getOrderbook } = useApiStore()
    const account = useAccount()
    const [openTradeDetails, showTradeDetails] = useState(false)
    const [buyTokenBalance, setBuyTokenBalance] = useState(-1)
    const [sellTokenBalance, setSellTokenBalance] = useState(-1)
    const { setOpen } = useModal()

    useEffect(() => {
        if (account.status === 'connected' && account.address && account.chainId) {
            if (buyToken?.address)
                fetchBalance(account.address, account.chainId, buyToken.address as `0x${string}`).then((balance) =>
                    setBuyTokenBalance(isNaN(balance) ? -1 : balance),
                )
            if (sellToken?.address)
                fetchBalance(account.address, account.chainId, sellToken.address as `0x${string}`).then((balance) =>
                    setSellTokenBalance(isNaN(balance) ? -1 : balance),
                )
        }
    }, [account.address, account.chainId, account.status, buyToken?.address, sellToken?.address])

    const simulateTradeAndMergeOrderbook = async (amountIn: number) => {
        try {
            setIsLoadingSomeTrade(true)

            // prevent errors
            const pair = getAddressPair()
            const orderbook = getOrderbook(pair)
            if (!orderbook) return

            // fetch data
            const url = `${APP_ROUTE}/api/local/orderbook?token0=${sellToken?.address}&token1=${buyToken?.address}&pointAmount=${amountIn}&pointToken=${sellToken?.address}`
            const tradeResponse = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
            const tradeResponseJson = (await tradeResponse.json()) as StructuredOutput<AmmAsOrderbook>
            if (!tradeResponseJson.data || !orderbook) return

            // nb: can only be a bid for now
            const side = OrderbookSide.BID

            // prevent errors
            if (!side) return

            // ease access
            const newTradeEntry = tradeResponseJson.data?.bids.length > 0 ? tradeResponseJson.data.bids[0] : null

            // prevent errors
            if (!newTradeEntry) return

            // new orderbook
            // nb: make sure we have the same amount of pools
            const newOrderbook = {
                ...tradeResponseJson.data,

                // filter out previous entry for same trade
                bids: [...orderbook.bids.filter((bid) => newTradeEntry.amount !== bid.amount), ...tradeResponseJson.data.bids],
                asks: orderbook.asks,
            }

            /// update state
            setApiOrderbook(pair, newOrderbook)

            const newSelectedTrade = {
                side: OrderbookSide.BID,
                amountIn,
                selectedAt: Date.now(),
                trade: newTradeEntry,
                pools: newOrderbook.pools,
                xAxis: newTradeEntry.average_sell_price,
            }

            selectOrderbookTrade(newSelectedTrade)
        } catch (error) {
            toast.error(`Unexepected error while fetching price: ${extractErrorMessage(error)}`, {
                style: toastStyle,
            })
        } finally {
            setIsLoadingSomeTrade(false)
        }
    }

    const handleChangeOfAmountIn = async (event: ChangeEvent<HTMLInputElement>) => {
        try {
            const amountIn = Number(numeral(event.target.value).value())
            if (isNaN(amountIn)) return

            const newSelectedTrade: SelectedTrade = {
                side: OrderbookSide.BID,
                amountIn,
                selectedAt: Date.now(),
                trade: undefined,
                pools: [],
                xAxis: -1,
            }

            selectOrderbookTrade(newSelectedTrade)
            setSellTokenAmountInput(amountIn)

            if (!sellToken?.address || !buyToken?.address) return

            await simulateTradeAndMergeOrderbook(amountIn)
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
                <div
                    className={cn('flex flex-col gap-4 p-4 rounded-xl border-milk-150 w-full', {
                        'bg-folly/20': account.isConnected && sellToken?.address && sellTokenAmountInput && sellTokenBalance < sellTokenAmountInput,
                        'bg-milk-600/5': !(
                            account.isConnected &&
                            sellToken?.address &&
                            sellTokenAmountInput &&
                            sellTokenBalance < sellTokenAmountInput
                        ),
                    })}
                >
                    <div className="flex justify-between">
                        <p className="text-milk-600 text-xs">Sell</p>
                        <div className="flex items-center">
                            {account.isConnected &&
                                sellToken?.address &&
                                sellTokenBalance &&
                                sellTokenAmountInput &&
                                sellTokenBalance < sellTokenAmountInput && <p className="text-folly font-semibold text-xs pr-2">Exceeds Balance</p>}
                            <p className="text-aquamarine text-xs">Best bid</p>
                        </div>
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
                            className="text-xl font-semibold text-right border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none bg-transparent w-40"
                            value={numeral(sellTokenAmountInput).format('0,0.[00000]')}
                            onChange={handleChangeOfAmountIn}
                        />
                    </div>
                    {selectedTrade && props.metrics.midPrice ? (
                        <div className="mt-2 flex justify-between items-center">
                            <div className="flex items-center gap-1">
                                <TokenBalance balance={sellTokenBalance} isConnected={account.isConnected} />
                                {account.isConnected && sellToken?.address && (
                                    <button onClick={() => setSellTokenAmountInput(sellTokenBalance)} className="pl-1">
                                        <p className="text-folly font-semibold text-xs">MAX</p>
                                    </button>
                                )}
                            </div>
                            {isLoadingSomeTrade ? (
                                <div className="skeleton-loading w-16 h-4 rounded-full" />
                            ) : (
                                <p className="text-milk-600 text-xs">
                                    ${' '}
                                    {getBaseValueInUsd(props.metrics.orderbook)
                                        ? safeNumeral(selectedTrade.amountIn * (getBaseValueInUsd(props.metrics.orderbook) as number), '0,0.[00]')
                                        : '-'}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <TokenBalance balance={buyTokenBalance} isConnected={account.isConnected} />
                            <div className="skeleton-loading w-16 h-4 rounded-full" />
                        </div>
                    )}
                </div>

                {/* Token switch button */}
                <div className="h-0 w-full flex justify-center items-center z-10">
                    <div className="size-[44px] rounded-xl bg-background p-1">
                        <button
                            onClick={async () => {
                                setApiOrderbook(getAddressPair(), undefined)
                                switchSelectedTokens()
                                if (sellTokenAmountInput) await simulateTradeAndMergeOrderbook(sellTokenAmountInput)
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
                                'cursor-not-allowed bg-transparent ring-0 focus:ring-0 focus:outline-none focus:border-none w-40':
                                    selectedTrade?.trade,
                                'skeleton-loading ml-auto w-28 h-8 rounded-full text-transparent': !selectedTrade?.trade,
                            })}
                            value={numeral(buyTokenAmountInput).format('0,0.[00000]')}
                            disabled={true}
                        />
                    </div>

                    {selectedTrade ? (
                        <div className="flex justify-between items-center">
                            <TokenBalance balance={sellTokenBalance} isConnected={account.isConnected} />
                            {isLoadingSomeTrade ? (
                                <div className="skeleton-loading w-16 h-4 rounded-full" />
                            ) : (
                                <p className="text-milk-600 text-xs">
                                    ${' '}
                                    {buyTokenAmountInput && getQuoteValueInUsd(props.metrics.orderbook)
                                        ? numeral(buyTokenAmountInput).multiply(getQuoteValueInUsd(props.metrics.orderbook)).format('0,0.[00]')
                                        : '-'}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <TokenBalance balance={sellTokenBalance} isConnected={account.isConnected} />
                            <div className="skeleton-loading w-16 h-4 rounded-full" />
                        </div>
                    )}
                </div>

                {/* Separator */}
                <div className="h-0 w-full" />

                {/* Trade details section */}
                <div className="bg-milk-600/5 flex flex-col gap-6 px-2 py-4 rounded-xl border-milk-150 text-xs">
                    {/* Summary */}
                    <div className="flex w-full justify-between items-center">
                        {sellToken && buyToken && props.metrics.highestBid && props.metrics.orderbook ? (
                            <p className="text-milk-600 truncate pl-2">
                                1 {sellToken.symbol} = {formatAmount(props.metrics.midPrice)} {buyToken.symbol} (${' '}
                                {formatAmount(getBaseValueInUsd(props.metrics.orderbook))})
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
                            <ChainImage networkName="ethereum" className="size-4" />
                            <p className="text-milk-600">
                                ${' '}
                                {props.metrics.highestBid?.gas_costs_usd
                                    ? numeral(props.metrics.highestBid.gas_costs_usd.reduce((cost, curr) => (cost += curr), 0)).format('0,0.[00]')
                                    : '-'}
                            </p>
                            <IconWrapper
                                icon={openTradeDetails ? IconIds.TRIANGLE_UP : IconIds.TRIANGLE_DOWN}
                                className="size-4 transition-transform duration-300"
                            />
                        </button>
                    </div>

                    {/* Trade details */}
                    {openTradeDetails && <TradeDetails isLoading={isLoadingSomeTrade} selectedTrade={selectedTrade ?? null} sellToken={sellToken} />}
                </div>

                {/* Separator */}
                <div className="h-0 w-full" />

                {/* Swap button */}
                {account.isConnected ? (
                    <button
                        onClick={() => {}}
                        className="bg-folly flex justify-center p-4 rounded-xl border-milk-150 transition-all duration-300 hover:opacity-90"
                    >
                        <p className="font-semibold">Swap</p>
                    </button>
                ) : (
                    <button
                        onClick={() => setOpen(true)}
                        className="bg-folly flex justify-center p-4 rounded-xl border-milk-150 transition-all duration-300 hover:opacity-90"
                    >
                        <p className="font-semibold">Connect wallet</p>
                    </button>
                )}

                {/* Debug */}
                {IS_DEV && <pre className="text-xs p-2">{JSON.stringify(selectedTrade, null, 2)}</pre>}
            </div>

            {/* Token selection modal */}
            <SelectTokenModal />
        </>
    )
}
