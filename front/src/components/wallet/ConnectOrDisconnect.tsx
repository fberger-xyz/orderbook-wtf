'use client'

import { BaseError, useAccount, useConnect } from 'wagmi'
import { useEffect, useState } from 'react'
import { IconIds } from '@/enums'
import { fetchBalance, shortenAddress } from '@/utils'
import toast from 'react-hot-toast'
import { toastStyle } from '@/config/toasts.config'
import IconWrapper from '../common/IconWrapper'
import { useModal } from 'connectkit'
import numeral from 'numeral'

export function ConnectOrDisconnect() {
    const [gasTokenBalance, setGasTokenBalance] = useState(-1)
    const [isClient, setIsClient] = useState(false)
    const [isFetchingGasBalance, setIsFetchingGasBalance] = useState(false)
    useEffect(() => {
        setIsClient(true)
    }, [])

    const account = useAccount()
    const { error } = useConnect()
    const { setOpen } = useModal()

    useEffect(() => {
        if (account.status === 'connected' && account.address) {
            toast.success(`Connected wallet ${shortenAddress(account.address)}`, { style: toastStyle })
            try {
                setIsFetchingGasBalance(true)
                fetchBalance(account.address, account.chainId).then((balance) => {
                    setGasTokenBalance(typeof balance === 'number' ? balance : -1)
                    setIsFetchingGasBalance(false)
                })
            } catch (error) {
                setIsFetchingGasBalance(false)
            }
        }
    }, [account.address, account.chainId, account.status])

    useEffect(() => {
        if (error) {
            toast.error(`Connection error: ${(error as BaseError).shortMessage}`, { style: toastStyle })
        }
    }, [error])

    // avoid rendering during SSR
    if (!isClient) return null

    return account.isConnected ? (
        <div className="flex items-center gap-2 bg-milk-100/5 rounded-xl h-10 pl-2.5 pr-1 text-milk">
            <IconWrapper icon={IconIds.WALLET} className="size-5 text-milk-600" />
            {!isFetchingGasBalance && gasTokenBalance >= 0 ? (
                <p className="text-sm">{numeral(gasTokenBalance).format('0,0.[00000]')} ETH</p>
            ) : (
                <div className="skeleton-loading flex w-16 h-6 items-center justify-center rounded-full" />
            )}
            <button
                className="transition-colors duration-300 bg-milk-100/5 hover:bg-milk-100/10 rounded-lg h-8 px-2.5 text"
                onClick={async () => {
                    try {
                        await setOpen(true)
                    } catch (error) {
                        toast.error(`Failed to open wallet modal: ${(error as Error).message}`, { style: toastStyle })
                    }
                }}
            >
                <p className="group-hover:text-inactive text-sm">{shortenAddress(String(account.address))}</p>
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
