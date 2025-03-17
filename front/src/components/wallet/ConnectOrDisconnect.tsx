'use client'

import { BaseError, useAccount, useConnect, useDisconnect } from 'wagmi'
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
    const { disconnect } = useDisconnect()

    useEffect(() => {
        if (account.status === 'connected') {
            console.log('Account connected')
            toast.success(`Connected wallet ${shortenAddress(account.address)}`, { style: toastStyle })
        }
    }, [account.status])

    useEffect(() => {
        if (error) {
            console.log('Connect error', { error })
            toast.error(`Connection error: ${(error as BaseError).shortMessage}`, { style: toastStyle })
        }
    }, [error])

    if (!isClient) return null // Avoid rendering during SSR

    const buttonClassNames = `w-full group flex items-center gap-4 rounded-2xl px-4 py-1.5 border border-light-hover font-bold bg-light-hover justify-around shadow-sm`

    return account.isConnecting ? (
        <button className={buttonClassNames}>
            <div className="size-2.5 rounded-full bg-orange-400" />
            <p className="text-inactive">Connecting</p>
            <IconWrapper icon={IconIds.LOADING} className="size-6 text-orange-400" />
        </button>
    ) : account.isConnected ? (
        <button
            className={buttonClassNames}
            onClick={async () => {
                try {
                    await disconnect()
                } catch (error) {
                    window.alert({ error })
                }
            }}
        >
            <div className="size-2.5 rounded-full bg-green-500 group-hover:bg-inactive" />
            <p className="group-hover:text-inactive">{shortenAddress(String(account.address))}</p>
            <IconWrapper icon={IconIds.DISCONNECT} className="size-6 text-inactive group-hover:text-red-400" />
        </button>
    ) : (
        <button className={buttonClassNames} onClick={() => setOpen(true)}>
            <p className="mx-auto text-primary">Connect wallet</p>
        </button>
    )
}
