import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { APP_METADATA, IS_DEV } from '@/config/app.config'
import { OrderbookDataPoint } from '@/types'
import { AmmAsOrderbook, AmmPool, Token } from '@/interfaces'

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
    selectedToken0?: Token
    selectedToken1?: Token
    availableTokens: Token[]
    loadedOrderbooks: Record<string, undefined | AmmAsOrderbook>
    showSelectTokenModal: boolean
    setShowMobileMenu: (showMobileMenu: boolean) => void
    setHasHydrated: (hasHydrated: boolean) => void
    setStoreRefreshedAt: (storeRefreshedAt: number) => void
    selectOrderbookDataPoint: (selectedTrade?: { datapoint: OrderbookDataPoint; bidsPools: AmmPool[]; asksPools: AmmPool[] }) => void
    setYAxisType: (yAxisType: 'value' | 'log') => void
    setYAxisLogBase: (yAxisLogBase: number) => void
    setAvailablePairs: (availablePairs: string[]) => void
    selectPair: (selectedPair?: string) => void
    selectToken0: (selectedToken0?: Token) => void
    selectToken1: (selectedToken1?: Token) => void
    setAvailableTokens: (availableTokens: Token[]) => void
    saveLoadedOrderbook: (pair: string, orderbook?: AmmAsOrderbook) => void
    switchSelectedTokens: () => void
    setShowSelectTokenModal: (showSelectTokenModal: boolean) => void
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
            selectedToken0: {
                address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                decimals: 18,
                symbol: 'WETH',
                gas: '29962',
            },
            selectedToken1: {
                address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                decimals: 6,
                symbol: 'USDC',
                gas: '40652',
            },
            availableTokens: [],
            loadedOrderbooks: {},
            showSelectTokenModal: false,
            setShowMobileMenu: (showMobileMenu) => set(() => ({ showMobileMenu })),
            setHasHydrated: (hasHydrated) => set(() => ({ hasHydrated })),
            setStoreRefreshedAt: (storeRefreshedAt) => set(() => ({ storeRefreshedAt })),
            selectOrderbookDataPoint: (selectedTrade) => set(() => ({ selectedTrade })),
            setYAxisType: (yAxisType) => set(() => ({ yAxisType })),
            setYAxisLogBase: (yAxisLogBase) => set(() => ({ yAxisLogBase })),
            setAvailablePairs: (availablePairs) => set(() => ({ availablePairs })),
            selectPair: (selectedPair) => set(() => ({ selectedPair })),
            selectToken0: (selectedToken0) => set(() => ({ selectedToken0 })),
            selectToken1: (selectedToken1) => set(() => ({ selectedToken1 })),
            setAvailableTokens: (availableTokens) => set(() => ({ availableTokens })),
            saveLoadedOrderbook: (pair, orderbook) => set((state) => ({ loadedOrderbooks: { ...state.loadedOrderbooks, [pair]: orderbook } })),
            switchSelectedTokens: () => set((state) => ({ selectedToken0: state.selectedToken1, selectedToken1: state.selectedToken0 })),
            setShowSelectTokenModal: (showSelectTokenModal) => set(() => ({ showSelectTokenModal })),
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
