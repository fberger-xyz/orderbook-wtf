'use client'

export function ErrorBoundaryFallback({ error }: { error: Error }) {
    return (
        <div className="flex flex-col items-center text-xs">
            <p className="">Something went wrong...</p>
            <p className="rounded-md bg-very-light-hover p-1 text-orange-400">Error: {error.message}</p>
        </div>
    )
}
