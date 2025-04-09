import { create } from 'zustand'
import { AmmAsOrderbook, DashboardMetrics, RustApiPair, Token } from '@/interfaces'
import { IS_DEV } from '@/config/app.config'
import { getDashboardMetrics } from '@/utils'

export const useApiStore = create<{
    apiTokens: Token[]
    apiPairs: RustApiPair[]
    apiOrderbooks: Record<string, undefined | AmmAsOrderbook>
    metrics: DashboardMetrics
    orderBookRefreshIntervalMs: number
    apiStoreRefreshedAt: number
    setApiTokens: (apiTokens: Token[]) => void
    setApiPairs: (apiPairs: RustApiPair[]) => void
    setApiOrderbook: (key: string, orderbook?: AmmAsOrderbook) => void
    setApiStoreRefreshedAt: (apiStoreRefreshedAt: number) => void
    getOrderbook: (key: string) => undefined | AmmAsOrderbook
}>((set, get) => ({
    apiTokens: [],
    apiPairs: [],
    apiOrderbooks: {},
    metrics: getDashboardMetrics(undefined),
    orderBookRefreshIntervalMs: (IS_DEV ? 12 : 30) * 1000,
    apiStoreRefreshedAt: -1,
    setApiTokens: (apiTokens) => set(() => ({ apiTokens })),
    setApiPairs: (apiPairs) => set(() => ({ apiPairs })),
    setApiOrderbook: (key, orderbook) =>
        set((state) => ({
            apiOrderbooks: { ...state.apiOrderbooks, [key]: orderbook },
            metrics: getDashboardMetrics(orderbook),
        })),
    setApiStoreRefreshedAt: (apiStoreRefreshedAt) => set(() => ({ apiStoreRefreshedAt })),
    getOrderbook: (key) => get().apiOrderbooks[key],
}))
