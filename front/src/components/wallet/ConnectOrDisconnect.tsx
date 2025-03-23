'use client'

import { BaseError, useAccount, useConnect } from 'wagmi'
import { useEffect, useState } from 'react'
import { IconIds } from '@/enums'
import { shortenAddress } from '@/utils'
import toast from 'react-hot-toast'
import { toastStyle } from '@/config/toasts.config'
import IconWrapper from '../common/IconWrapper'
import { useModal } from 'connectkit'

export function ConnectOrDisconnect() {
    const [isClient, setIsClient] = useState(false)
    useEffect(() => {
        setIsClient(true)
    }, [])

    const account = useAccount()
    const { error } = useConnect()
    const { setOpen } = useModal()

    useEffect(() => {
        if (account.status === 'connected') {
            console.log('Account connected')
            toast.success(`Connected wallet ${shortenAddress(account.address)}`, { style: toastStyle })
        }
    }, [account.address, account.status])

    useEffect(() => {
        if (error) {
            console.log('Connect error', { error })
            toast.error(`Connection error: ${(error as BaseError).shortMessage}`, { style: toastStyle })
        }
    }, [error])

    if (!isClient) return null // Avoid rendering during SSR

    return account.isConnected ? (
        <div className="flex items-center gap-2 bg-milk-100/5 rounded-xl h-10 pl-2.5 pr-1 text-milk-600">
            <IconWrapper icon={IconIds.WALLET} className="size-4" />
            <p>0.0449 ETH</p>
            <button
                className="transition-colors duration-300 bg-milk-100/5 hover:bg-milk-100/10 rounded-lg h-8 px-2.5 text-milk-600"
                onClick={async () => {
                    try {
                        await setOpen(true)
                    } catch (error) {
                        window.alert({ error })
                    }
                }}
            >
                <p className="group-hover:text-inactive">{shortenAddress(String(account.address))}</p>
            </button>
        </div>
    ) : (
        <button
            className="transition-colors duration-300 bg-milk-100/5 hover:bg-milk-100/10 rounded-xl h-10 px-4 text-milk-600"
            onClick={() => setOpen(true)}
        >
            <p className="mx-auto text-primary">Connect wallet</p>
        </button>
    )
}
