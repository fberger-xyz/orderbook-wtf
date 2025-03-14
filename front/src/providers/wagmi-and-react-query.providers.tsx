// https://docs.family.co/connectkit/getting-started#getting-started-nextjs-app-router
// https://wagmi-safe-integration.vercel.app/

'use client'

import * as React from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider } from 'connectkit'
import { config } from './wagmi'

const queryClient = new QueryClient()

export function WagmiAndReactQueryProviders({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider>{children}</ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
