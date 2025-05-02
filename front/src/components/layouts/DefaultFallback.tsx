import PageWrapper from '../common/PageWrapper'

export default function DefaultFallback() {
    return (
        <PageWrapper>
            <div className="size-full grid grid-cols-1 md:grid-cols-10 gap-4">
                <div className="col-span-1 md:col-span-6 flex flex-col gap-4 xl:col-span-7 h-full w-full">
                    <div className="skeleton-loading h-28" />
                    <div className="skeleton-loading h-80" />
                    <div className="skeleton-loading h-48" />
                    <div className="skeleton-loading h-32" />
                </div>
                <div className="col-span-1 md:col-span-4 flex flex-col gap-4 xl:col-span-3">
                    <div className="skeleton-loading h-40" />
                    <div className="skeleton-loading h-80" />
                </div>
            </div>
        </PageWrapper>
    )
}
