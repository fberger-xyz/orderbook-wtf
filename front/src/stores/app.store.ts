import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { APP_METADATA, IS_DEV } from '@/config/app.config'
import { OrderbookDataPoint } from '@/types'
import { AmmAsOrderbook, AmmPool } from '@/interfaces'

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
    loadedOrderbooks: Record<string, undefined | AmmAsOrderbook>
    setShowMobileMenu: (showMobileMenu: boolean) => void
    setHasHydrated: (hasHydrated: boolean) => void
    setStoreRefreshedAt: (storeRefreshedAt: number) => void
    selectOrderbookDataPoint: (selectedTrade?: { datapoint: OrderbookDataPoint; bidsPools: AmmPool[]; asksPools: AmmPool[] }) => void
    setYAxisType: (yAxisType: 'value' | 'log') => void
    setYAxisLogBase: (yAxisLogBase: number) => void
    setAvailablePairs: (availablePairs: string[]) => void
    selectPair: (selectedPair?: string) => void
    saveLoadedOrderbook: (pair: string, orderbook?: AmmAsOrderbook) => void
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
            loadedOrderbooks: {},
            setShowMobileMenu: (showMobileMenu) => set(() => ({ showMobileMenu })),
            setHasHydrated: (hasHydrated) => set(() => ({ hasHydrated })),
            setStoreRefreshedAt: (storeRefreshedAt) => set(() => ({ storeRefreshedAt })),
            selectOrderbookDataPoint: (selectedTrade) => set(() => ({ selectedTrade })),
            setYAxisType: (yAxisType) => set(() => ({ yAxisType })),
            setYAxisLogBase: (yAxisLogBase) => set(() => ({ yAxisLogBase })),
            setAvailablePairs: (availablePairs) => set(() => ({ availablePairs })),
            selectPair: (selectedPair) => set(() => ({ selectedPair })),
            saveLoadedOrderbook: (pair, orderbook) => set((state) => ({ loadedOrderbooks: { ...state.loadedOrderbooks, [pair]: orderbook } })),
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
