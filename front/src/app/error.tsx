'use client'

import PageWrapper from '@/components/common/PageWrapper'
import { useEffect } from 'react'
import { extractErrorMessage } from '@/utils'
import IconWrapper from '@/components/common/IconWrapper'
import { AppUrls, IconIds } from '@/enums'
import CenteredContent from '@/components/common/CenteredContent'
import LinkWrapper from '@/components/common/LinkWrapper'

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
                    <div className="flex w-full flex-col items-center gap-4">
                        <p className="text-sm text-milk-600">Please</p>

                        <button
                            onClick={() => reset()}
                            className="flex w-full text-aquamarine items-center justify-center gap-2.5 rounded-xl border-2 border-aquamarine bg-very-light-hover px-2 py-1.5 font-semibold sm:py-2"
                        >
                            <p className="font-semibold">Reload page</p>
                            <IconWrapper icon={IconIds.UPDATE_NOW} className="size-6" />
                        </button>

                        <p className="text-sm text-milk-600">
                            Or reach out for help on telegram:
                            <LinkWrapper
                                href={AppUrls.PROPELLERHEADS_TELEGRAM}
                                target="_blank"
                                className="hover:underline hover:text-aquamarine pl-1"
                            >
                                PropellerHeads
                            </LinkWrapper>
                            ,
                            <LinkWrapper href={AppUrls.MERSO_TELEGRAM} target="_blank" className="hover:underline hover:text-aquamarine px-1">
                                @xMerso
                            </LinkWrapper>
                            and
                            <LinkWrapper href={AppUrls.FBERGER_WEBSITE} target="_blank" className="hover:underline hover:text-aquamarine px-1">
                                @fberger_xyz
                            </LinkWrapper>
                        </p>
                    </div>
                </div>
            </CenteredContent>
        </PageWrapper>
    )
}
