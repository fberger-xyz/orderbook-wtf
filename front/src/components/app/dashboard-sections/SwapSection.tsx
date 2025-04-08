'use client'

import { IconIds, OrderbookSide } from '@/enums'
import numeral from 'numeral'
import { useAppStore } from '@/stores/app.store'
import { ChangeEvent, useEffect, useState } from 'react'
import IconWrapper from '../../common/IconWrapper'
import TokenImage from '../TokenImage'
import ChainImage from '../ChainImage'
import { AmmAsOrderbook, SelectedTrade, StructuredOutput } from '@/interfaces'
import SelectTokenModal from '../SelectTokenModal'
import { useModal } from 'connectkit'
import { useAccount } from 'wagmi'
import { cn, extractErrorMessage, fetchBalance, formatAmount, getBaseValueInUsd, getDashboardMetrics, getQuoteValueInUsd, safeNumeral } from '@/utils'
import { useApiStore } from '@/stores/api.store'
import { APP_ROUTE } from '@/config/app.config'
import toast from 'react-hot-toast'
import { toastStyle } from '@/config/toasts.config'

export default function SwapSection(props: { metrics: ReturnType<typeof getDashboardMetrics> }) {
    /**
     * zustand
     */

    const {
        /**
         * store
         */

        // hasHydrated,
        // setHasHydrated,

        /**
         * ui
         */

        // showMobileMenu,
        // setShowMobileMenu,
        // storeRefreshedAt,
        // setStoreRefreshedAt,
        // refetchInterval,
        // showMarketDepthSection,
        // showRoutingSection,
        // showLiquidityBreakdownSection,
        // showSections,

        /**
         * orderbook
         */

        // data
        // loadedOrderbooks,
        // saveLoadedOrderbook,

        // chart
        // yAxisType,
        // yAxisLogBase,
        // setYAxisType,
        // setYAxisLogBase,
        // coloredAreas,
        // setColoredAreas,
        // symbolsInYAxis,
        // setSymbolsInYAxis,

        /**
         * swap
         */

        // inputs
        sellToken,
        // selectSellToken,
        sellTokenAmountInput,
        setSellTokenAmountInput,
        buyToken,
        // selectBuyToken,
        buyTokenAmountInput,
        // setBuyTokenAmountInput,
        switchSelectedTokens,
        isLoadingSomeTrade,
        setIsLoadingSomeTrade,

        // trade
        selectedTrade,
        selectOrderbookTrade,

        /**
         * modal
         */

        // showSelectTokenModal,
        setShowSelectTokenModal,
        // selectTokenModalFor,
        setSelectTokenModalFor,
        // selectTokenModalSearch,
        // setSelectTokenModalSearch,

        /**
         * computeds
         */

        getAddressPair,
    } = useAppStore()
    const { setApiOrderbook, getOrderbook } = useApiStore()

    /**
     * swap
     */

    // actions
    const account = useAccount()
    const [openTradeDetails, showTradeDetails] = useState(false)
    const [buyTokenBalance, setBuyTokenBalance] = useState(-1)
    const [sellTokenBalance, setSellTokenBalance] = useState(-1)
    const { setOpen } = useModal()

    // balances
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

    /**
     * misc
     */

    const simulateTradeAndMergeOrderbook = async (amountIn: number) => {
        try {
            // state
            setIsLoadingSomeTrade(true)

            // prepare
            const url = `${APP_ROUTE}/api/local/orderbook?token0=${sellToken?.address}&token1=${buyToken?.address}&pointAmount=${amountIn}&pointToken=${sellToken?.address}`
            const tradeResponse = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
            const tradeResponseJson = (await tradeResponse.json()) as StructuredOutput<AmmAsOrderbook>
            const pair = getAddressPair()
            const orderbook = getOrderbook(pair)
            if (!tradeResponseJson.data) return
            if (!orderbook) return

            // -
            const newOrderbook = {
                ...orderbook,
                bids: [...orderbook.bids, ...tradeResponseJson.data.bids],
                asks: [...orderbook.asks, ...tradeResponseJson.data.asks],
                base_worth_eth: tradeResponseJson.data.base_worth_eth,
                quote_worth_eth: tradeResponseJson.data.quote_worth_eth,
                block: tradeResponseJson.data.block,
            }

            // update store
            setApiOrderbook(pair, newOrderbook)

            // -
            const newSelectedTrade = {
                side: OrderbookSide.BID,
                amountIn,
                selectedAt: Date.now(),

                // must be calculated
                trade: newOrderbook.bids.find((bid) => bid.amount === amountIn),
                pools: newOrderbook.pools,

                // meta
                toDisplay: true,
            }

            // update store
            selectOrderbookTrade(newSelectedTrade)
        } catch (error) {
            toast.error(`Unexepected error while fetching price: ${extractErrorMessage(error)}`, {
                style: toastStyle,
            })
        } finally {
            // state
            setIsLoadingSomeTrade(false)
        }
    }

    const handleChangeOfAmountIn = async (event: ChangeEvent<HTMLInputElement>) => {
        try {
            // parse
            const amountIn = Number(numeral(event.target.value).value())

            // prevent errors
            if (isNaN(amountIn)) return

            // prepare
            const newTradeSide = OrderbookSide.BID // always bid
            const newSelectedTrade: SelectedTrade = {
                side: newTradeSide,
                amountIn,
                selectedAt: Date.now(),

                // must be calculated
                trade: undefined,
                pools: [],
            }

            // update store
            selectOrderbookTrade(newSelectedTrade)
            setSellTokenAmountInput(amountIn)

            // prevent errors
            if (!sellToken?.address || !buyToken?.address) return

            // -
            await simulateTradeAndMergeOrderbook(amountIn)
        } catch (error) {
            toast.error(`Unexepected error while fetching price: ${extractErrorMessage(error)}`, {
                style: toastStyle,
            })
        } finally {
            // tba
        }
    }

    return (
        <>
            <div className="col-span-1 md:col-span-4 flex flex-col gap-0.5 xl:col-span-3">
                {/* sell */}
                <div
                    className={cn('flex flex-col gap-1 p-4 rounded-xl border-milk-150 w-full', {
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
                            sellTokenBalance < sellTokenAmountInput ? (
                                <p className="text-folly font-bold text-xs pr-2">Exceeds Balance</p>
                            ) : null}
                            <button
                                onClick={() => {}}
                                className={cn('flex transition-colors duration-300 opacity-80 px-2.5 py-1.5 rounded-lg', {
                                    'bg-milk-100/5': true,
                                    'hover:opacity-100 hover:bg-milk-100/5': false,
                                })}
                            >
                                <p className="font-bold text-aquamarine text-xs">Best bid</p>
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-between gap-3">
                        <button
                            onClick={() => {
                                setSelectTokenModalFor('sell')
                                setShowSelectTokenModal(true)
                            }}
                            className="flex rounded-full bg-gray-600/30 transition-colors duration-300 hover:bg-gray-600/50 items-center gap-1.5 pl-1.5 pr-2 py-1.5 min-w-fit"
                        >
                            <TokenImage size={24} token={sellToken} />
                            {sellToken ? (
                                <p className="font-semibold tracking-wide">{sellToken.symbol}</p>
                            ) : (
                                <div className="skeleton-loading flex w-16 h-6 items-center justify-center rounded-full" />
                            )}
                            <IconWrapper icon={IconIds.TRIANGLE_DOWN} className="size-4" />
                        </button>
                        <input
                            type="text"
                            className="text-xl font-bold text-right border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none bg-transparent w-40"
                            value={numeral(sellTokenAmountInput).format('0,0.[00000]')}
                            onChange={handleChangeOfAmountIn}
                        />
                    </div>
                    {selectedTrade && props.metrics.midPrice ? (
                        <div className="mt-2 flex justify-between items-center">
                            {/* left: balance */}
                            <div className="flex justify-between gap-1 items-center">
                                <IconWrapper icon={IconIds.WALLET} className="size-4 text-milk-400" />
                                <p className="text-milk-400 text-xs">
                                    {account.isConnected && sellTokenBalance >= 0 ? formatAmount(sellTokenBalance) : 0}
                                </p>
                                {account.isConnected && sellToken?.address && (
                                    <button onClick={() => setSellTokenAmountInput(sellTokenBalance)} className="pl-1">
                                        <p className="text-folly font-bold text-xs">MAX</p>
                                    </button>
                                )}
                            </div>

                            {/* right: input value in $ */}
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
                        <div className="mt-2 flex justify-between items-center">
                            <div className="flex justify-between gap-1 items-center">
                                <IconWrapper icon={IconIds.WALLET} className="size-4 text-milk-400" />
                                <p className="text-milk-400 text-xs">
                                    {account.isConnected && buyTokenBalance >= 0 ? formatAmount(buyTokenBalance) : 0}
                                </p>
                            </div>
                            <div className="skeleton-loading w-16 h-4 rounded-full" />
                        </div>
                    )}
                </div>

                {/* arrow */}
                <div className="h-0 w-full flex justify-center items-center z-10">
                    <div className="size-[44px] rounded-xl bg-background p-1">
                        <button
                            onClick={async () => {
                                switchSelectedTokens()
                                if (sellTokenAmountInput) await simulateTradeAndMergeOrderbook(sellTokenAmountInput)
                            }}
                            className="size-full rounded-lg bg-milk-600/5 flex items-center justify-center group"
                        >
                            <IconWrapper icon={IconIds.ARROW_DOWN} className="size-5 transition-transform duration-300 group-hover:rotate-180" />
                        </button>
                    </div>
                </div>

                {/* buy */}
                <div className="bg-milk-600/5 flex flex-col gap-3 p-4 rounded-xl border-milk-150 w-full">
                    <p className="text-milk-600 text-xs">Buy</p>
                    <div className="flex justify-between gap-3 w-full">
                        <button
                            onClick={() => {
                                setSelectTokenModalFor('buy')
                                setShowSelectTokenModal(true)
                            }}
                            className="flex rounded-full bg-gray-600/30 transition-colors duration-300 hover:bg-gray-600/50 items-center gap-1.5 pl-1.5 pr-2 py-1.5 min-w-fit"
                        >
                            <TokenImage size={24} token={buyToken} />
                            {buyToken ? (
                                <p className="font-semibold tracking-wide">{buyToken.symbol}</p>
                            ) : (
                                <div className="skeleton-loading flex w-16 h-6 items-center justify-center rounded-full" />
                            )}
                            <IconWrapper icon={IconIds.TRIANGLE_DOWN} className="size-4" />
                        </button>
                        {/* <p className="text-xl font-bold text-right border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none bg-transparent w-40 cursor-not-allowed">
                            {selectedTrade
                                ? safeNumeral(
                                      selectedTrade.amountIn *
                                          (selectedTrade.side === OrderbookSide.ASK ? 1 / selectedTrade.price : selectedTrade.price),
                                      '0,0.[00000]',
                                  )
                                : '-'}
                        </p> */}
                        <input
                            type="text"
                            className={cn('text-xl font-bold text-right border-none outline-none', {
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
                            <div className="flex justify-between gap-1 items-center">
                                <IconWrapper icon={IconIds.WALLET} className="size-4 text-milk-400" />
                                <p className="text-milk-400 text-xs">
                                    {account.isConnected && sellTokenBalance >= 0 ? formatAmount(sellTokenBalance) : 0}
                                </p>
                            </div>

                            {/* right: input value in $ */}
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
                        <div className="mt-2 flex justify-between items-center">
                            <div className="flex justify-between gap-1 items-center">
                                <IconWrapper icon={IconIds.WALLET} className="size-4 text-milk-400" />
                                <p className="text-milk-400 text-xs">
                                    {account.isConnected && sellTokenBalance >= 0 ? formatAmount(sellTokenBalance) : 0}
                                </p>
                            </div>
                            <div className="skeleton-loading w-16 h-4 rounded-full" />
                        </div>
                    )}
                </div>

                {/* separator */}
                <div className="h-0 w-full" />

                {/* fees */}
                <div className="bg-milk-600/5 flex flex-col gap-6 px-2 py-4 rounded-xl border-milk-150 text-xs">
                    {/* summary */}
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

                    {/* details */}
                    {openTradeDetails && (
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
                                {isLoadingSomeTrade ? (
                                    <div className="skeleton-loading w-16 h-4 rounded-full" />
                                ) : (
                                    <p>
                                        {selectedTrade?.trade?.price_impact ? numeral(selectedTrade?.trade?.price_impact).format('0,0.[000]%') : '-'}
                                    </p>
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
                    )}
                </div>

                {/* separator */}
                <div className="h-0 w-full" />

                {/* fees */}
                {account.isConnected ? (
                    <button
                        onClick={() => {}}
                        className="bg-folly flex justify-center p-4 rounded-xl border-milk-150 transition-all duration-300 hover:opacity-90"
                    >
                        <p className="font-bold">Swap</p>
                    </button>
                ) : (
                    <button
                        onClick={() => setOpen(true)}
                        className="bg-folly flex justify-center p-4 rounded-xl border-milk-150 transition-all duration-300 hover:opacity-90"
                    >
                        <p className="font-bold">Connect wallet</p>
                    </button>
                )}
            </div>

            {/* modal */}
            <SelectTokenModal />
        </>
    )
}
