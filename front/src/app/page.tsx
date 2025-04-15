import AppStoreLoader from '@/components/stores/AppStoreLoader'
import Dashboard from '@/components/app/Dashboard'

export default function Page() {
    return (
        <AppStoreLoader>
            <Dashboard />
        </AppStoreLoader>
    )
}
