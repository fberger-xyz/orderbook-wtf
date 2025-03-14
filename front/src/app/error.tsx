'use client'

import PageWrapper from '@/components/common/PageWrapper'
import JsonField from '@/components/common/JsonField'
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
                <div className="my-10 flex w-full flex-col items-center gap-6">
                    <p className="font-bold">Something went wrong!</p>
                    <div className="flex w-full flex-col items-center gap-2 rounded-xl border border-light-hover p-4">
                        <p className="text-inactive">Application logs</p>
                        <JsonField className="text-orange-500">{JSON.stringify(extractErrorMessage(error), null, 2)}</JsonField>
                    </div>
                    <div className="flex w-full flex-col items-center gap-3">
                        <p className="text-sm text-inactive">Please</p>
                        <button
                            onClick={() => reset()}
                            className="flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-primary bg-very-light-hover px-2 py-1.5 font-bold sm:py-2"
                        >
                            <p className="font-bold">Try a refresh</p>
                            <IconWrapper icon={IconIds.UPDATE_NOW} className="size-6" />
                        </button>
                    </div>
                </div>
            </CenteredContent>
        </PageWrapper>
    )
}
