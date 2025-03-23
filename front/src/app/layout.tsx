import type { Metadata } from 'next'
import './globals.css'
import { APP_FONT, APP_METADATA } from '../config/app.config'
import { cn } from '../utils'
import { Suspense } from 'react'
import DefaultFallback from '@/components/layouts/DefaultFallback'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorBoundaryFallback } from '@/components/common/ErrorBoundaryFallback'
import HeaderDesktop from '@/components/layouts/HeaderDesktop'
import Footer from '@/components/layouts/Footer'
import { WagmiAndReactQueryProviders } from '@/providers/wagmi-and-react-query.providers'

export const metadata: Metadata = {
    title: APP_METADATA.SITE_NAME,
    description: APP_METADATA.SITE_DESCRIPTION,
    applicationName: APP_METADATA.SITE_NAME,
    metadataBase: new URL(APP_METADATA.SITE_URL),
    manifest: '/manifest.json',
    appleWebApp: {
        title: APP_METADATA.SITE_NAME,
        capable: true,
        statusBarStyle: 'black-translucent',
    },
    openGraph: {
        type: 'website',
        title: APP_METADATA.SITE_NAME,
        siteName: APP_METADATA.SITE_NAME,
        description: APP_METADATA.SITE_DESCRIPTION,
        url: APP_METADATA.SITE_URL,
        images: '/opengraph-image',
    },
    twitter: {
        card: 'summary_large_image',
        site: 'fberger_xyz',
        title: APP_METADATA.SITE_NAME,
        description: APP_METADATA.SITE_DESCRIPTION,
        images: '/opengraph-image',
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
                        <HeaderDesktop />
                        <Suspense fallback={<DefaultFallback />}>
                            <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>{children}</ErrorBoundary>
                        </Suspense>
                        <Footer />
                        <Toaster position="bottom-center" reverseOrder={true} />
                    </main>
                </WagmiAndReactQueryProviders>
            </body>
        </html>
    )
}
