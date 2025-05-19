import { create } from 'zustand'
import { AmmAsOrderbook, DashboardMetrics, RustApiPair, Token } from '@/interfaces'
import { getDashboardMetrics } from '@/utils'
import { AppSupportedChains } from '@/enums'

export const useApiStore = create<{
    apiTokens: Record<AppSupportedChains, Token[]>
    apiPairs: Record<AppSupportedChains, RustApiPair[]>
    apiOrderbooks: Record<string, undefined | AmmAsOrderbook>
    metrics?: DashboardMetrics
    orderBookRefreshIntervalMs: Record<AppSupportedChains, number>
    apiStoreRefreshedAt: number
    actions: {
        setApiTokens: (key: string, pairs: Token[]) => void
        setApiPairs: (key: string, pairs: RustApiPair[]) => void
        setApiOrderbook: (key: string, orderbook?: AmmAsOrderbook) => void
        setApiStoreRefreshedAt: (apiStoreRefreshedAt: number) => void
        setMetrics: (metrics?: DashboardMetrics) => void
        getOrderbook: (key: string) => undefined | AmmAsOrderbook
    }
}>((set, get) => ({
    apiTokens: {
        [AppSupportedChains.ETHEREUM]: [],
        [AppSupportedChains.UNICHAIN]: [],
    },
    apiPairs: {
        [AppSupportedChains.ETHEREUM]: [],
        [AppSupportedChains.UNICHAIN]: [],
    },
    apiOrderbooks: {},
    metrics: getDashboardMetrics(undefined),
    orderBookRefreshIntervalMs: {
        [AppSupportedChains.ETHEREUM]: 12000,
        [AppSupportedChains.UNICHAIN]: 5000,
    },
    apiStoreRefreshedAt: -1,
    actions: {
        setApiTokens: (key, tokens) =>
            set((state) => ({
                // todo try immer middleware for testing. cf. https://www.youtube.com/watch?v=6tEQ1nJZ51w&t=10s
                apiTokens: { ...state.apiTokens, [key]: tokens },
            })),
        setApiPairs: (key, pairs) =>
            set((state) => ({
                apiPairs: { ...state.apiPairs, [key]: pairs },
            })),
        setApiOrderbook: (key, orderbook) =>
            set((state) => ({
                apiOrderbooks: { ...state.apiOrderbooks, [key]: orderbook },
                metrics: getDashboardMetrics(orderbook),
            })),
        setApiStoreRefreshedAt: (apiStoreRefreshedAt) => set(() => ({ apiStoreRefreshedAt })),
        setMetrics: (metrics) => set(() => ({ metrics })),
        getOrderbook: (key) => get().apiOrderbooks[key],
    },
}))
