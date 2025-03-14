import CenteredContent from '../common/CenteredContent'
import PageWrapper from '../common/PageWrapper'

export default function DefaultFallback() {
    return (
        <div className="h-full overflow-scroll">
            <PageWrapper>
                <CenteredContent>
                    <div className="flex h-96 w-full animate-pulse items-center justify-center rounded-lg bg-primary">
                        <p className="text-orange-500">App loading...</p>
                    </div>
                </CenteredContent>
            </PageWrapper>
        </div>
    )
}
