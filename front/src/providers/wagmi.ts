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
        // todo: unichain is supported here https://github.com/wevm/viem/blob/main/src/chains/index.ts but not here https://wagmi.sh/core/api/chains
        // [unichain.id]: http(`https://unichain.drpc.org`),
    },
    appName: APP_METADATA.SITE_NAME,
    ssr: true,
})

export const config = createConfig(configParams)
