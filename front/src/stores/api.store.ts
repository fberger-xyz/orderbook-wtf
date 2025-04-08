import { create } from 'zustand'
import { AmmAsOrderbook, DashboardMetrics, Token } from '@/interfaces'
import { IS_DEV } from '@/config/app.config'
import { getDashboardMetrics } from '@/utils'

export const useApiStore = create<{
    apiTokens: Token[]
    apiOrderbooks: Record<string, undefined | AmmAsOrderbook>
    metrics: DashboardMetrics
    orderBookRefreshIntervalMs: number
    apiStoreRefreshedAt: number
    setApiTokens: (apiTokens: Token[]) => void
    setApiOrderbook: (key: string, orderbook?: AmmAsOrderbook) => void
    setApiStoreRefreshedAt: (apiStoreRefreshedAt: number) => void
    getOrderbook: (key: string) => undefined | AmmAsOrderbook
}>((set, get) => ({
    apiTokens: [],
    apiOrderbooks: {},
    metrics: getDashboardMetrics(undefined),
    orderBookRefreshIntervalMs: (IS_DEV ? 10 : 30) * 1000,
    apiStoreRefreshedAt: -1,
    setApiTokens: (apiTokens) => set(() => ({ apiTokens })),
    setApiOrderbook: (key, orderbook) =>
        set((state) => ({
            apiOrderbooks: { ...state.apiOrderbooks, [key]: orderbook },
            metrics: getDashboardMetrics(orderbook),
        })),
    setApiStoreRefreshedAt: (apiStoreRefreshedAt) => set(() => ({ apiStoreRefreshedAt })),
    getOrderbook: (key) => get().apiOrderbooks[key],
}))
