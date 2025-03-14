import { APP_METADATA, root } from '@/config/app.config'
import { getDefaultConfig } from 'connectkit'
import { createConfig, http } from 'wagmi'
import { arbitrum, Chain, gnosis } from 'wagmi/chains'
import { safe } from 'wagmi/connectors'

export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? ''
if (!projectId) throw new Error('Project ID is not defined')

const supportedChains: Chain[] = [arbitrum, gnosis]
const configParams = getDefaultConfig({
    walletConnectProjectId: projectId,
    appUrl: root,
    chains: [arbitrum, gnosis],
    connectors: [
        safe({
            allowedDomains: [/app.safe.global$/],
            debug: true,
            // shimDisconnect: true,
        }),
    ],
    transports: supportedChains.reduce((obj, chain) => ({ ...obj, [chain.id]: http() }), {}),
    appName: APP_METADATA.SITE_NAME,
    ssr: true,
})

export const config = createConfig(configParams)
