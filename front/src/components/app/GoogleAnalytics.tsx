'use client'

import { GANALYTICS_ID } from '@/config/app.config'
import Script from 'next/script'

export const Analytics = () => (
    <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=G-${GANALYTICS_ID}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
            {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-${GANALYTICS_ID}');
      `}
        </Script>
    </>
)
