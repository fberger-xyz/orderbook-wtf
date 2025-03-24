import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { APP_METADATA, IS_DEV } from '@/config/app.config'
import { OrderbookDataPoint } from '@/types'
import { AmmAsOrderbook, AmmPool, Token } from '@/interfaces'
import { tokensListFromBackend } from '@/data/back-tokens'

export const useAppStore = create<{
    showMobileMenu: boolean
    hasHydrated: boolean
    storeRefreshedAt: number
    refetchInterval: number
    selectedTrade?: { datapoint: OrderbookDataPoint; bidsPools: AmmPool[]; asksPools: AmmPool[] }
    yAxisType: 'value' | 'log'
    yAxisLogBase: number
    availablePairs: string[]
    selectedPair?: string
    sellToken?: Token
    sellTokenAmountInput?: number
    buyToken?: Token
    buyTokenAmountInput?: number
    availableTokens: Token[]
    loadedOrderbooks: Record<string, undefined | AmmAsOrderbook>
    showSelectTokenModal: boolean
    selectTokenModalFor: 'buy' | 'sell'
    selectTokenModalSearch: string
    setShowMobileMenu: (showMobileMenu: boolean) => void
    setHasHydrated: (hasHydrated: boolean) => void
    setStoreRefreshedAt: (storeRefreshedAt: number) => void
    selectOrderbookDataPoint: (selectedTrade?: { datapoint: OrderbookDataPoint; bidsPools: AmmPool[]; asksPools: AmmPool[] }) => void
    setYAxisType: (yAxisType: 'value' | 'log') => void
    setYAxisLogBase: (yAxisLogBase: number) => void
    setAvailablePairs: (availablePairs: string[]) => void
    selectPair: (selectedPair?: string) => void
    selectSellToken: (sellToken?: Token) => void
    setSellTokenAmountInput: (sellTokenAmountInput: number) => void
    selectBuyToken: (buyToken?: Token) => void
    setBuyTokenAmountInput: (buyTokenAmountInput: number) => void
    setAvailableTokens: (availableTokens: Token[]) => void
    saveLoadedOrderbook: (pair: string, orderbook?: AmmAsOrderbook) => void
    switchSelectedTokens: () => void
    setShowSelectTokenModal: (showSelectTokenModal: boolean) => void
    setSelectTokenModalFor: (selectTokenModalFor: 'buy' | 'sell') => void
    setSelectTokenModalSearch: (selectTokenModalSearch: string) => void
}>()(
    persist(
        (set) => ({
            showMobileMenu: false,
            hasHydrated: false,
            storeRefreshedAt: -1,
            refetchInterval: (IS_DEV ? 60 : 15) * 1000,
            selectedTrade: undefined,
            yAxisType: 'value',
            yAxisLogBase: 10,
            availablePairs: [],
            selectedPair: undefined,
            sellToken: tokensListFromBackend[1],
            sellTokenAmountInput: 2000,
            buyToken: tokensListFromBackend[0],
            buyTokenAmountInput: 1,
            availableTokens: [],
            loadedOrderbooks: {},
            showSelectTokenModal: false,
            selectTokenModalFor: 'buy',
            selectTokenModalSearch: '',
            setShowMobileMenu: (showMobileMenu) => set(() => ({ showMobileMenu })),
            setHasHydrated: (hasHydrated) => set(() => ({ hasHydrated })),
            setStoreRefreshedAt: (storeRefreshedAt) => set(() => ({ storeRefreshedAt })),
            selectOrderbookDataPoint: (selectedTrade) => set(() => ({ selectedTrade })),
            setYAxisType: (yAxisType) => set(() => ({ yAxisType })),
            setYAxisLogBase: (yAxisLogBase) => set(() => ({ yAxisLogBase })),
            setAvailablePairs: (availablePairs) => set(() => ({ availablePairs })),
            selectPair: (selectedPair) => set(() => ({ selectedPair })),
            selectSellToken: (sellToken) => set(() => ({ sellToken })),
            setSellTokenAmountInput: (sellTokenAmountInput) => set(() => ({ sellTokenAmountInput })),
            selectBuyToken: (buyToken) => set(() => ({ buyToken })),
            setBuyTokenAmountInput: (buyTokenAmountInput) => set(() => ({ buyTokenAmountInput })),
            setAvailableTokens: (availableTokens) => set(() => ({ availableTokens })),
            saveLoadedOrderbook: (pair, orderbook) => set((state) => ({ loadedOrderbooks: { ...state.loadedOrderbooks, [pair]: orderbook } })),
            switchSelectedTokens: () => set((state) => ({ sellToken: state.buyToken, buyToken: state.sellToken })),
            setShowSelectTokenModal: (showSelectTokenModal) => set(() => ({ showSelectTokenModal })),
            setSelectTokenModalFor: (selectTokenModalFor) => set(() => ({ selectTokenModalFor })),
            setSelectTokenModalSearch: (selectTokenModalSearch) => set(() => ({ selectTokenModalSearch })),
        }),
        {
            name: IS_DEV
                ? // always keep state in dev
                  `${APP_METADATA.SITE_DOMAIN}-store-dev`
                : // refresh at each new deployment
                  `${APP_METADATA.SITE_DOMAIN}-store-prod-${process.env.NEXT_PUBLIC_COMMIT_TIMESTAMP}`,
            storage: createJSONStorage(() => sessionStorage),
            skipHydration: false,
            onRehydrateStorage: () => (state) => {
                if (!state?.hasHydrated) {
                    state?.setHasHydrated(true)
                    state?.setAvailablePairs([]) // reset
                    state?.selectOrderbookDataPoint(undefined) // reset
                }
            },
        },
    ),
)
