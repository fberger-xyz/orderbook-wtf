import AppStoreLoader from '@/components/stores/AppStoreLoader'
import Dashboard from '@/components/app/Dashboard'
// import CommitInfo from '@/components/common/CommitInfo'

export default function Page() {
    return (
        <AppStoreLoader>
            <Dashboard />
            {/* <CommitInfo /> */}
        </AppStoreLoader>
    )
}
