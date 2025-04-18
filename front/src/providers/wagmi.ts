import { APP_METADATA, APP_ROUTE } from '@/config/app.config'
import { getDefaultConfig } from 'connectkit'
import { createConfig, http } from 'wagmi'
import { base, mainnet } from 'wagmi/chains'
import { safe } from 'wagmi/connectors'

export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? ''
if (!projectId) throw new Error('WALLET_CONNECT_PROJECT_ID is not defined')

const configParams = getDefaultConfig({
    walletConnectProjectId: projectId,
    appUrl: APP_ROUTE,
    chains: [mainnet, base],
    connectors: [safe({ allowedDomains: [/app.safe.global$/], debug: true })],
    transports: {
        [mainnet.id]: http(`https://eth.llamarpc.com`),
        [base.id]: http(`https://base.llamarpc.com`),
        130: http(`https://unichain.drpc.org`),
    },
    appName: APP_METADATA.SITE_NAME,
    ssr: true,
})

export const config = createConfig(configParams)
