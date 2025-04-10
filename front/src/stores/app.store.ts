import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { APP_METADATA, IS_DEV } from '@/config/app.config'
import { SelectedTrade, Token } from '@/interfaces'
import { hardcodedTokensList } from '@/data/back-tokens'
import { OrderbookOption, OrderbookAxisScale } from '@/enums'

export const useAppStore = create<{
    /**
     * store
     */

    hasHydrated: boolean
    setHasHydrated: (hasHydrated: boolean) => void

    /**
     * ui
     */

    showMobileMenu: boolean
    setShowMobileMenu: (showMobileMenu: boolean) => void
    storeRefreshedAt: number
    setStoreRefreshedAt: (storeRefreshedAt: number) => void
    refetchInterval: number
    showMarketDepthSection: boolean
    showRoutingSection: boolean
    showLiquidityBreakdownSection: boolean
    showSections: (showMarketDepthSection: boolean, showRoutingSection: boolean, showLiquidityBreakdownSection: boolean) => void
    currentChainName: string
    setCurrentChain: (currentChainName: string) => void

    /**
     * orderbook
     */

    // chart
    yAxisType: OrderbookAxisScale
    yAxisLogBase: number
    setYAxisType: (yAxisType: OrderbookAxisScale) => void
    setYAxisLogBase: (yAxisLogBase: number) => void
    coloredAreas: OrderbookOption
    setColoredAreas: (coloredAreas: OrderbookOption) => void
    symbolsInYAxis: OrderbookOption
    setSymbolsInYAxis: (symbolsInYAxis: OrderbookOption) => void

    /**
     * swap
     */

    // inputs
    sellToken: Token
    selectSellToken: (sellToken: Token) => void
    sellTokenAmountInput: number
    sellTokenAmountInputRaw: string | number
    setSellTokenAmountInput: (sellTokenAmountInput: number) => void
    setSellTokenAmountInputRaw: (sellTokenAmountInputRaw: string | number) => void
    buyToken: Token
    selectBuyToken: (buyToken: Token) => void
    buyTokenAmountInput?: number
    setBuyTokenAmountInput: (buyTokenAmountInput: number) => void
    switchSelectedTokens: () => void
    isLoadingSomeTrade: boolean
    setIsLoadingSomeTrade: (isLoadingSomeTrade: boolean) => void

    // trade
    selectedTrade?: SelectedTrade
    selectOrderbookTrade: (selectedTrade?: SelectedTrade) => void

    /**
     * modal
     */

    showSelectTokenModal: boolean
    setShowSelectTokenModal: (showSelectTokenModal: boolean) => void
    selectTokenModalFor: 'buy' | 'sell'
    setSelectTokenModalFor: (selectTokenModalFor: 'buy' | 'sell') => void
    selectTokenModalSearch: string
    setSelectTokenModalSearch: (selectTokenModalSearch: string) => void

    /**
     * computeds
     */

    getAddressPair: () => string
    getSymbolPair: () => string
}>()(
    persist(
        (set, get) => ({
            /**
             * store
             */

            hasHydrated: false,
            setHasHydrated: (hasHydrated) => set(() => ({ hasHydrated })),

            /**
             * ui
             */

            showMobileMenu: false,
            setShowMobileMenu: (showMobileMenu) => set(() => ({ showMobileMenu })),
            storeRefreshedAt: -1,
            setStoreRefreshedAt: (storeRefreshedAt) => set(() => ({ storeRefreshedAt })),
            refetchInterval: 60 * 1000,
            showMarketDepthSection: true,
            showRoutingSection: true,
            showLiquidityBreakdownSection: true,
            showSections: (showMarketDepthSection, showRoutingSection, showLiquidityBreakdownSection) =>
                set(() => ({ showMarketDepthSection, showRoutingSection, showLiquidityBreakdownSection })),
            currentChainName: 'ethereum',
            setCurrentChain: (currentChainName) => set(() => ({ currentChainName })),

            /**
             * orderbook
             */

            // chart
            yAxisType: OrderbookAxisScale.VALUE,
            yAxisLogBase: 10,
            setYAxisType: (yAxisType) => set(() => ({ yAxisType })),
            setYAxisLogBase: (yAxisLogBase) => set(() => ({ yAxisLogBase })),
            coloredAreas: OrderbookOption.NO,
            setColoredAreas: (coloredAreas) => set(() => ({ coloredAreas })),
            symbolsInYAxis: OrderbookOption.NO,
            setSymbolsInYAxis: (symbolsInYAxis) => set(() => ({ symbolsInYAxis })),

            /**
             * swap
             */

            // inputs

            sellToken: hardcodedTokensList[1], // todo put this as null
            selectSellToken: (sellToken) =>
                set((state) => {
                    console.log(`selectsellToken: ${sellToken.symbol} (prev=${state.sellToken.symbol})`)
                    // reset from
                    // return { sellToken }
                    return { sellToken, sellTokenAmountInput: 1, sellTokenAmountInputRaw: 1 }
                }),
            sellTokenAmountInput: 0,
            sellTokenAmountInputRaw: 0,
            buyToken: hardcodedTokensList[0], // todo put this as null
            selectBuyToken: (buyToken) =>
                set((state) => {
                    console.log(`selectBuyToken: ${buyToken.symbol} (prev=${state.buyToken.symbol})`)
                    return { buyToken }
                }),
            buyTokenAmountInput: 0,
            setSellTokenAmountInputRaw: (sellTokenAmountInputRaw) => set(() => ({ sellTokenAmountInputRaw })),
            setSellTokenAmountInput: (sellTokenAmountInput) => set(() => ({ sellTokenAmountInput })),
            setBuyTokenAmountInput: (buyTokenAmountInput) => set(() => ({ buyTokenAmountInput })),
            switchSelectedTokens: () =>
                set((state) => ({
                    sellToken: state.buyToken,
                    buyToken: state.sellToken,
                    sellTokenAmountInput: state.buyTokenAmountInput,
                    sellTokenAmountInputRaw: state.buyTokenAmountInput,
                    buyTokenAmountInput: state.sellTokenAmountInput,
                })),
            isLoadingSomeTrade: false,
            setIsLoadingSomeTrade: (isLoadingSomeTrade) => set(() => ({ isLoadingSomeTrade })),

            // trade
            selectedTrade: undefined,
            selectOrderbookTrade: (selectedTrade) =>
                set(() => ({
                    selectedTrade,
                    sellTokenAmountInput: selectedTrade?.amountIn ?? 0,
                    sellTokenAmountInputRaw: selectedTrade?.amountIn ?? 0,
                    buyTokenAmountInput: selectedTrade?.trade?.output ?? 0,
                })),

            /**
             * modal
             */

            // -
            showSelectTokenModal: false,
            selectTokenModalFor: 'buy',
            selectTokenModalSearch: '',
            setShowSelectTokenModal: (showSelectTokenModal) => set(() => ({ showSelectTokenModal })),
            setSelectTokenModalFor: (selectTokenModalFor) => set(() => ({ selectTokenModalFor })),
            setSelectTokenModalSearch: (selectTokenModalSearch) => set(() => ({ selectTokenModalSearch })),

            /**
             * computeds
             */

            // -
            getAddressPair: () => `${get().sellToken.address}-${get().buyToken.address}`,
            getSymbolPair: () => `${get().sellToken.symbol}-${get().buyToken.symbol}`,
        }),
        {
            name: IS_DEV
                ? `${APP_METADATA.SITE_DOMAIN}-app-store-dev` // always keep state in dev
                : `${APP_METADATA.SITE_DOMAIN}-app-store-prod-${process.env.NEXT_PUBLIC_COMMIT_TIMESTAMP}`, // refresh at each new deployment
            storage: createJSONStorage(() => sessionStorage),
            skipHydration: false,
            onRehydrateStorage: () => (state) => {
                if (state && !state.hasHydrated) {
                    state.setHasHydrated(true)

                    // console.log({ state })
                    // reset
                    // state?.selectOrderbookTrade(undefined)
                    // state?.setSellTokenAmountInput(0)
                    // state?.setSellTokenAmountInputRaw(state?.sellTokenAmountInput)
                    // state?.setBuyTokenAmountInput(0)

                    // pre select default tokens if need be
                    // if (!state.buyToken)
                    //     state.selectBuyToken({
                    //         address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    //         decimals: 6,
                    //         symbol: 'USDC',
                    //         gas: '40652',
                    //     })
                    // if (!state.sellToken)
                    //     state.selectSellToken({
                    //         address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                    //         decimals: 18,
                    //         symbol: 'WETH',
                    //         gas: '29962',
                    //     })
                }
            },
        },
    ),
)
