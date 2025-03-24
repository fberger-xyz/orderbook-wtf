import { APP_METADATA, APP_ROUTE } from '@/config/app.config'
import { getDefaultConfig } from 'connectkit'
import { createConfig, http } from 'wagmi'
import { arbitrum, gnosis, mainnet } from 'wagmi/chains'
import { safe } from 'wagmi/connectors'

export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? ''
if (!projectId) throw new Error('WALLET_CONNECT_PROJECT_ID is not defined')

const configParams = getDefaultConfig({
    walletConnectProjectId: projectId,
    appUrl: APP_ROUTE,
    chains: [mainnet, arbitrum, gnosis],
    connectors: [safe({ allowedDomains: [/app.safe.global$/], debug: true })],
    transports: [mainnet, arbitrum, gnosis].reduce((obj, chain) => ({ ...obj, [chain.id]: http() }), {}),
    appName: APP_METADATA.SITE_NAME,
    ssr: true,
})

export const config = createConfig(configParams)
