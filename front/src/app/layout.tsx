import type { Metadata } from 'next'
import './globals.css'
import { APP_FONT, APP_METADATA } from '../config/app.config'
import { cn } from '../utils'
import { Suspense } from 'react'
import DefaultFallback from '@/components/layouts/DefaultFallback'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorBoundaryFallback } from '@/components/common/ErrorBoundaryFallback'
import Footer from '@/components/layouts/Footer'
import { WagmiAndReactQueryProviders } from '@/providers/wagmi-and-react-query.providers'
import Header from '@/components/layouts/Header'

export const metadata: Metadata = {
    title: APP_METADATA.SITE_NAME,
    description: APP_METADATA.SITE_DESCRIPTION,
    metadataBase: new URL(APP_METADATA.SITE_URL),
    manifest: '/manifest.json',
    appleWebApp: {
        title: APP_METADATA.SITE_NAME,
        capable: true,
        statusBarStyle: 'black-translucent',
    },
    openGraph: {
        type: 'website',
        title: APP_METADATA.SITE_URL.replace('https://', ''),
        siteName: APP_METADATA.SITE_NAME,
        description: APP_METADATA.SITE_DESCRIPTION,
        url: APP_METADATA.SITE_URL,
        images: [
            {
                url: 'https://raw.githubusercontent.com/propeller-heads/tycho-x/19c454303ad279419c9eae38f2c818d20220a0c5/assets/orderbook-header.png',
                width: 1100,
                height: 400,
                alt: 'Tycho X ORDERBOOK visual header — abstract dark background with teal and purple liquidity chart textures and bold orderbook title.',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        site: 'fberger_xyz',
        title: APP_METADATA.SITE_NAME,
        description: APP_METADATA.SITE_DESCRIPTION,
        images: [
            {
                url: 'https://raw.githubusercontent.com/propeller-heads/tycho-x/19c454303ad279419c9eae38f2c818d20220a0c5/assets/orderbook-header.png',
                width: 1100,
                height: 400,
                alt: 'Tycho X ORDERBOOK visual header — abstract dark background with teal and purple liquidity chart textures and bold orderbook title.',
            },
        ],
        // label1: 'Coded by',
        // data1: 'PropellerHeads',
        // label2: 'Reading time',
        // data2: '3 minutes',
    },
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={cn(APP_FONT.className, 'h-screen w-screen overflow-auto text-base text-milk bg-background')}>
                <WagmiAndReactQueryProviders>
                    <main className="relative flex min-h-screen w-screen flex-col">
                        <div
                            className="absolute w-full -top-[600px] h-[800px] rounded-full bg-gradient-stroke blur-3xl opacity-[0.06]"
                            style={{ zIndex: -1 }}
                        />
                        <Header />
                        <Suspense fallback={<DefaultFallback />}>
                            <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>{children}</ErrorBoundary>
                        </Suspense>
                        <Footer />
                        <Toaster position="bottom-right" reverseOrder={true} />
                    </main>
                </WagmiAndReactQueryProviders>
            </body>
        </html>
    )
}
