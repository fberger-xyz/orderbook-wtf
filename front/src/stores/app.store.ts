import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { APP_METADATA, IS_DEV } from '@/config/app.config'
import { OrderbookDataPoint } from '@/types'
import { AmmAsOrderbook, AmmPool, Token } from '@/interfaces'
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

    /**
     * orderbook
     */

    // data
    loadedOrderbooks: Record<string, undefined | AmmAsOrderbook>
    saveLoadedOrderbook: (pair: string, orderbook?: AmmAsOrderbook) => void

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
    sellToken?: Token
    selectSellToken: (sellToken?: Token) => void
    sellTokenAmountInput?: number
    setSellTokenAmountInput: (sellTokenAmountInput: number) => void
    buyToken?: Token
    selectBuyToken: (buyToken?: Token) => void
    buyTokenAmountInput?: number
    setBuyTokenAmountInput: (buyTokenAmountInput: number) => void
    switchSelectedTokens: () => void

    // trade
    selectedTrade?: { datapoint: OrderbookDataPoint; bidsPools: AmmPool[]; asksPools: AmmPool[] }
    selectOrderbookDataPoint: (selectedTrade?: { datapoint: OrderbookDataPoint; bidsPools: AmmPool[]; asksPools: AmmPool[] }) => void

    /**
     * modal
     */

    showSelectTokenModal: boolean
    setShowSelectTokenModal: (showSelectTokenModal: boolean) => void
    selectTokenModalFor: 'buy' | 'sell'
    setSelectTokenModalFor: (selectTokenModalFor: 'buy' | 'sell') => void
    selectTokenModalSearch: string
    setSelectTokenModalSearch: (selectTokenModalSearch: string) => void
}>()(
    persist(
        (set) => ({
            /**
             * store
             */

            hasHydrated: false,
            setHasHydrated: (hasHydrated) => set(() => ({ hasHydrated })),

            /**
             * ui
             */

            showMobileMenu: false,
            storeRefreshedAt: -1,
            refetchInterval: (IS_DEV ? 60 : 15) * 1000,

            /**
             * orderbook
             */

            // data
            // chart
            yAxisType: OrderbookAxisScale.VALUE,
            yAxisLogBase: 10,
            setYAxisLogBase: (yAxisLogBase) => set(() => ({ yAxisLogBase })),
            coloredAreas: OrderbookOption.NO,
            setColoredAreas: (coloredAreas) => set(() => ({ coloredAreas })),
            symbolsInYAxis: OrderbookOption.NO,
            setSymbolsInYAxis: (symbolsInYAxis) => set(() => ({ symbolsInYAxis })),

            /**
             * swap
             */

            // inputs
            // trade
            selectedTrade: undefined,

            /**
             * modal
             */

            // -

            // swap
            sellToken: hardcodedTokensList[1], // todo put this as null
            sellTokenAmountInput: 2000,
            buyToken: hardcodedTokensList[0], // todo put this as null
            buyTokenAmountInput: 1,

            loadedOrderbooks: {},
            showSelectTokenModal: false,
            selectTokenModalFor: 'buy',
            selectTokenModalSearch: '',
            setShowMobileMenu: (showMobileMenu) => set(() => ({ showMobileMenu })),
            setStoreRefreshedAt: (storeRefreshedAt) => set(() => ({ storeRefreshedAt })),
            selectOrderbookDataPoint: (selectedTrade) => set(() => ({ selectedTrade })),
            setYAxisType: (yAxisType) => set(() => ({ yAxisType })),
            selectSellToken: (sellToken) =>
                set((state) => {
                    console.log(`selectsellToken: ${sellToken?.symbol} (prev=${state.sellToken?.symbol})`)
                    return { sellToken }
                }),
            setSellTokenAmountInput: (sellTokenAmountInput) => set(() => ({ sellTokenAmountInput })),
            selectBuyToken: (buyToken) =>
                set((state) => {
                    console.log(`selectBuyToken: ${buyToken?.symbol} (prev=${state.buyToken?.symbol})`)
                    return { buyToken }
                }),
            setBuyTokenAmountInput: (buyTokenAmountInput) => set(() => ({ buyTokenAmountInput })),
            saveLoadedOrderbook: (pair, orderbook) => set((state) => ({ loadedOrderbooks: { ...state.loadedOrderbooks, [pair]: orderbook } })),
            switchSelectedTokens: () => set((state) => ({ sellToken: state.buyToken, buyToken: state.sellToken })),
            setShowSelectTokenModal: (showSelectTokenModal) => set(() => ({ showSelectTokenModal })),
            setSelectTokenModalFor: (selectTokenModalFor) => set(() => ({ selectTokenModalFor })),
            setSelectTokenModalSearch: (selectTokenModalSearch) => set(() => ({ selectTokenModalSearch })),
        }),
        {
            name: IS_DEV
                ? // always keep state in dev
                  `${APP_METADATA.SITE_DOMAIN}-app-store-dev`
                : // refresh at each new deployment
                  `${APP_METADATA.SITE_DOMAIN}-app-store-prod-${process.env.NEXT_PUBLIC_COMMIT_TIMESTAMP}`,
            storage: createJSONStorage(() => sessionStorage),
            skipHydration: false,
            onRehydrateStorage: () => (state) => {
                if (state && !state.hasHydrated) {
                    state.setHasHydrated(true)
                    state.selectOrderbookDataPoint(undefined) // reset

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
