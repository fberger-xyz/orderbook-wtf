import { create } from 'zustand'
import { AmmAsOrderbook, Token } from '@/interfaces'

export const useApiStore = create<{
    apiTokens: Token[]
    apiOrderbooks: Record<string, undefined | AmmAsOrderbook>
    orderBookRefreshIntervalMs: number
    apiStoreRefreshedAt: number
    setApiTokens: (apiTokens: Token[]) => void
    setApiOrderbook: (key: string, orderbook?: AmmAsOrderbook) => void
    setApiStoreRefreshedAt: (apiStoreRefreshedAt: number) => void
    getOrderbook: (key: string) => undefined | AmmAsOrderbook
}>((set, get) => ({
    apiTokens: [],
    apiOrderbooks: {},
    orderBookRefreshIntervalMs: 30 * 1000,
    apiStoreRefreshedAt: -1,
    setApiTokens: (apiTokens) => set(() => ({ apiTokens })),
    setApiOrderbook: (key, orderbook) => set((state) => ({ apiOrderbooks: { ...state.apiOrderbooks, [key]: orderbook } })),
    setApiStoreRefreshedAt: (apiStoreRefreshedAt) => set(() => ({ apiStoreRefreshedAt })),
    getOrderbook: (key) => get().apiOrderbooks[key],
}))
