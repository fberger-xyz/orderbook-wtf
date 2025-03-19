import type { Metadata } from 'next'
import { Inter_Tight } from 'next/font/google'
import './globals.css'
import { APP_METADATA, DEFAULT_THEME } from '../config/app.config'
import { cn } from '../utils'
import { Suspense } from 'react'
import { ThemeProvider } from 'next-themes'
import { AppThemes } from '@/enums'
import DefaultFallback from '@/components/layouts/DefaultFallback'
import { Toaster } from 'react-hot-toast'
import HeaderWithMenu from '@/components/layouts/HeaderWithMenu'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorBoundaryFallback } from '@/components/common/ErrorBoundaryFallback'
import HeaderDesktop from '@/components/layouts/HeaderDesktop'
import Footer from '@/components/layouts/Footer'
import { WagmiAndReactQueryProviders } from '@/providers/wagmi-and-react-query.providers'

// https://fonts.google.com/
const font = Inter_Tight({ weight: ['400', '700'], subsets: ['latin'] })

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
            <body className={cn(font.className, 'h-screen w-screen overflow-auto text-lg text-default bg-background')}>
                <ThemeProvider attribute="class" disableTransitionOnChange themes={Object.values(AppThemes)} defaultTheme={DEFAULT_THEME}>
                    <WagmiAndReactQueryProviders>
                        <main className="relative flex min-h-screen w-screen flex-col">
                            <HeaderWithMenu className="md:hidden" />
                            <HeaderDesktop className="hidden md:flex" />
                            <Suspense fallback={<DefaultFallback />}>
                                <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>{children}</ErrorBoundary>
                            </Suspense>
                            <Footer />
                            <Toaster position="bottom-center" reverseOrder={true} />
                        </main>
                    </WagmiAndReactQueryProviders>
                </ThemeProvider>
            </body>
        </html>
    )
}
