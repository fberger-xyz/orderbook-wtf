'use client'

import toast from 'react-hot-toast'
import { config } from '@/providers/wagmi'
import { toastStyle } from '@/config/toasts.config'
import { getBalance, readContract } from '@wagmi/core'
import { formatUnits } from 'viem'
import { erc20Abi } from 'viem'
import { shortenAddress } from './format.util'

export async function fetchBalance(
    accountAddress: `0x${string}`,
    accountChainId: number,
    tokenAddress?: `0x${string}`, // optional ERC-20 address
): Promise<number> {
    try {
        if (!tokenAddress) {
            // native token
            console.log('Fetching gas token balance...')
            // toast('Fetching gas token balance...', { style: toastStyle })
            const result = await getBalance(config, {
                address: accountAddress,
                chainId: accountChainId,
            })
            const formatted = Number(formatUnits(result.value, result.decimals))
            console.log(`Gas token balance = ${formatted}`)
            // toast.success(`Gas token balance = ${formatted}`, { style: toastStyle })
            return formatted
        } else {
            // erc20 token
            console.log(`Fetching ${shortenAddress(tokenAddress)} balance...`)
            // toast(`Fetching ${shortenAddress(tokenAddress)} balance...`, { style: toastStyle })
            const [decimals, balance] = await Promise.all([
                readContract(config, {
                    address: tokenAddress,
                    abi: erc20Abi,
                    functionName: 'decimals',
                    chainId: accountChainId,
                }) as Promise<number>,
                readContract(config, {
                    address: tokenAddress,
                    abi: erc20Abi,
                    functionName: 'balanceOf',
                    args: [accountAddress],
                    chainId: accountChainId,
                }) as Promise<bigint>,
            ])
            const formatted = Number(formatUnits(balance, decimals))
            console.log(`${shortenAddress(tokenAddress)} balance = ${formatted}`)
            // toast.success(`${shortenAddress(tokenAddress)} balance = ${formatted}`, { style: toastStyle })
            return formatted
        }
    } catch (err) {
        console.error('Failed to fetch balance', err)
        toast.error('Could not fetch balance', { style: toastStyle })
        return 0
    }
}
