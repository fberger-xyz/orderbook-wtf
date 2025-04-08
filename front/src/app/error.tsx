'use client'

import PageWrapper from '@/components/common/PageWrapper'
import { useEffect } from 'react'
import { extractErrorMessage } from '@/utils'
import IconWrapper from '@/components/common/IconWrapper'
import { IconIds } from '@/enums'
import CenteredContent from '@/components/common/CenteredContent'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => console.error(error), [error])
    return (
        <PageWrapper>
            <CenteredContent>
                <div className="my-10 flex w-fit flex-col items-center gap-10">
                    <p className="font-semibold text-milk text-lg">Something went wrong!</p>
                    <div className="flex w-full flex-col items-center gap-2 rounded-xl border border-milk-200 p-4">
                        <p className="text-milk-400">Application logs</p>
                        <pre className="text-orange-500 max-h-96 overflow-y-auto rounded-xl p-5 text-xs text-center text-wrap bg-milk-50">
                            {JSON.stringify(extractErrorMessage(error), null, 2)}
                        </pre>
                    </div>
                    <div className="flex w-full flex-col items-center gap-3">
                        <p className="text-sm text-milk-600">Please</p>
                        <button
                            onClick={() => reset()}
                            className="flex w-full text-aquamarine items-center justify-center gap-2.5 rounded-xl border-2 border-aquamarine bg-very-light-hover px-2 py-1.5 font-semibold sm:py-2"
                        >
                            <p className="font-semibold">Try a refresh</p>
                            <IconWrapper icon={IconIds.UPDATE_NOW} className="size-6" />
                        </button>
                        <p className="text-sm text-milk-600">Or reachout on telegram</p>
                    </div>
                </div>
            </CenteredContent>
        </PageWrapper>
    )
}
