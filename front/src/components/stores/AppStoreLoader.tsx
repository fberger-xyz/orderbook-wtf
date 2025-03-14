'use client'

import { useAppStore } from '@/stores/app.store'
import { ReactNode, useEffect } from 'react'
import PageWrapper from '../common/PageWrapper'

export default function AppStoreLoader(props: { children: ReactNode }) {
    const { hasHydrated } = useAppStore()
    const loadAppStore = () => useAppStore.persist.rehydrate()?.then(() => console.log('✅ Page rehydrated'))
    useEffect(() => {
        if (!hasHydrated) loadAppStore()
        // add toast if need be
    }, [hasHydrated])
    return <PageWrapper>{props.children}</PageWrapper>
}
