import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { APP_METADATA, DEFAULT_BUY_TOKEN, DEFAULT_CHAIN_CONFIG, DEFAULT_SELL_TOKEN, IS_DEV } from '@/config/app.config'
import { AmmTrade, SelectedTrade, Token } from '@/interfaces'
import { OrderbookOption, OrderbookAxisScale, AppSupportedChains } from '@/enums'

// todo: find a way to group static setters into an 'actions' record without compromising the persist feature
export const useAppStore = create<{
    /**
     * store
     */

    hasHydrated: boolean
    setHasHydrated: (hasHydrated: boolean) => void

    /**
     * ui
     */

    storeRefreshedAt: number
    setStoreRefreshedAt: (storeRefreshedAt: number) => void
    showMarketDepthSection: boolean
    showRoutingSection: boolean
    showLiquidityBreakdownSection: boolean
    showSections: (showMarketDepthSection: boolean, showRoutingSection: boolean, showLiquidityBreakdownSection: boolean) => void
    currentChainId: AppSupportedChains
    setCurrentChain: (currentChainId: AppSupportedChains, sellToken: Token, buyToken: Token) => void
    showMobileMenu: boolean
    setShowMobileMenu: (showMobileMenu: boolean) => void

    /**
     * market depth
     */

    // chart
    showSteps: OrderbookOption
    setSteps: (steps: OrderbookOption) => void
    filterOutSolverInconsistencies: OrderbookOption
    setFilterOutSolverInconsistencies: (filterOutSolverInconsistencies: OrderbookOption) => void
    yAxisType: OrderbookAxisScale
    setYAxisType: (yAxisType: OrderbookAxisScale) => void
    yAxisLogBase: number
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
    setSellTokenAmountInput: (sellTokenAmountInput: number) => void
    sellTokenAmountInputRaw: string | number
    setSellTokenAmountInputRaw: (sellTokenAmountInputRaw: string | number) => void
    buyToken: Token
    selectBuyToken: (buyToken: Token) => void
    buyTokenAmountInput?: number
    setBuyTokenAmountInput: (buyTokenAmountInput: number) => void
    switchSelectedTokens: () => void

    // trade
    isRefreshingMarketDepth: boolean
    setIsRefreshingMarketDepth: (isRefreshingMarketDepth: boolean) => void
    selectedTrade?: SelectedTrade
    selectTrade: (selectedTrade?: SelectedTrade) => void

    /**
     * modal
     */

    showSelectTokenModal: boolean
    setShowSelectTokenModal: (showSelectTokenModal: boolean) => void
    selectTokenModalFor: 'buy' | 'sell'
    setSelectTokenModalFor: (selectTokenModalFor: 'buy' | 'sell') => void
    selectTokenModalSearch: string
    setSelectTokenModalSearch: (selectTokenModalSearch: string) => void
    showWhatIsThisModal: boolean
    setShowWhatIsThisModal: (showWhatIsThisModal: boolean) => void

    /**
     * orderbook
     */

    hoveredOrderbookTrade?: AmmTrade
    setHoveredOrderbookTrade: (hoveredOrderbookTrade?: AmmTrade) => void

    /**
     * computeds
     */

    getAddressPair: () => string
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

            storeRefreshedAt: -1,
            setStoreRefreshedAt: (storeRefreshedAt) => set(() => ({ storeRefreshedAt })),
            showMarketDepthSection: true,
            showRoutingSection: true,
            showLiquidityBreakdownSection: true,
            showSections: (showMarketDepthSection, showRoutingSection, showLiquidityBreakdownSection) =>
                set(() => ({ showMarketDepthSection, showRoutingSection, showLiquidityBreakdownSection })),
            currentChainId: DEFAULT_CHAIN_CONFIG.id,
            setCurrentChain: (currentChainId, sellToken, buyToken) =>
                set(() => ({
                    currentChainId,
                    sellToken,
                    buyToken,
                    sellTokenAmountInput: 0,
                    sellTokenAmountInputRaw: 0,
                    buyTokenAmountInput: 0,
                })),
            showMobileMenu: false,
            setShowMobileMenu: (showMobileMenu) => set(() => ({ showMobileMenu })),

            /**
             * market depth
             */

            // chart
            showSteps: OrderbookOption.YES,
            setSteps: (showSteps) => set(() => ({ showSteps })),
            filterOutSolverInconsistencies: OrderbookOption.YES,
            setFilterOutSolverInconsistencies: (filterOutSolverInconsistencies) => set(() => ({ filterOutSolverInconsistencies })),
            yAxisType: OrderbookAxisScale.VALUE,
            yAxisLogBase: 2,
            setYAxisType: (yAxisType) => set(() => ({ yAxisType })),
            setYAxisLogBase: (yAxisLogBase) => set(() => ({ yAxisLogBase })),
            coloredAreas: OrderbookOption.YES,
            setColoredAreas: (coloredAreas) => set(() => ({ coloredAreas })),
            symbolsInYAxis: OrderbookOption.NO,
            setSymbolsInYAxis: (symbolsInYAxis) => set(() => ({ symbolsInYAxis })),

            /**
             * swap
             */

            sellToken: DEFAULT_SELL_TOKEN,
            selectSellToken: (sellToken) =>
                set(() => ({
                    sellToken,
                    sellTokenAmountInput: 1,
                    sellTokenAmountInputRaw: 1,
                })),
            sellTokenAmountInput: 0,
            sellTokenAmountInputRaw: 0,
            buyToken: DEFAULT_BUY_TOKEN,
            selectBuyToken: (buyToken) => set(() => ({ buyToken })),
            buyTokenAmountInput: 0,
            setSellTokenAmountInputRaw: (sellTokenAmountInputRaw) => set(() => ({ sellTokenAmountInputRaw })),
            setSellTokenAmountInput: (sellTokenAmountInput) => set(() => ({ sellTokenAmountInput })),
            setBuyTokenAmountInput: (buyTokenAmountInput) => set(() => ({ buyTokenAmountInput })),
            switchSelectedTokens: () =>
                set((state) => ({
                    selectedTrade: undefined,
                    sellToken: state.buyToken,
                    buyToken: state.sellToken,
                    sellTokenAmountInput: state.buyTokenAmountInput,
                    sellTokenAmountInputRaw: state.buyTokenAmountInput,
                    buyTokenAmountInput: state.sellTokenAmountInput,
                })),

            // trade
            isRefreshingMarketDepth: false,
            setIsRefreshingMarketDepth: (isRefreshingMarketDepth) =>
                set((state) => {
                    if (state.isRefreshingMarketDepth !== isRefreshingMarketDepth) set(() => ({ isRefreshingMarketDepth }))
                    return state
                }),
            selectedTrade: undefined,
            selectTrade: (selectedTrade) =>
                set(() => ({
                    selectedTrade,
                    buyTokenAmountInput: selectedTrade?.trade?.output ?? 0,
                })),

            /**
             * orderbook
             */

            hoveredOrderbookTrade: undefined,
            setHoveredOrderbookTrade: (hoveredOrderbookTrade) => set(() => ({ hoveredOrderbookTrade })),

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
            showWhatIsThisModal: false,
            setShowWhatIsThisModal: (showWhatIsThisModal) => set(() => ({ showWhatIsThisModal })),

            /**
             * computeds
             */

            // -
            getAddressPair: () => `${get().sellToken.address}-${get().buyToken.address}`,
        }),
        {
            name: IS_DEV
                ? // ? `${APP_METADATA.SITE_DOMAIN}-app-store-dev` // always keep state in dev
                  `${APP_METADATA.SITE_DOMAIN}-app-store-dev-${process.env.NEXT_PUBLIC_COMMIT_TIMESTAMP}` // change state at each new pnpm dev
                : `${APP_METADATA.SITE_DOMAIN}-app-store-prod-${process.env.NEXT_PUBLIC_COMMIT_TIMESTAMP}`, // refresh at each new deployment
            storage: createJSONStorage(() => sessionStorage),
            skipHydration: false,
            onRehydrateStorage: () => (state) => {
                if (state && !state.hasHydrated) state.setHasHydrated(true)
            },
        },
    ),
)
