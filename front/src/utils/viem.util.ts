'use client'

import toast from 'react-hot-toast'
import { config } from '@/providers/wagmi'
import { toastStyle } from '@/config/toasts.config'
import { getBalance, readContract } from '@wagmi/core'
import { formatUnits } from 'viem'
import { erc20Abi } from 'viem'
import { shortenAddress } from './format.util'

export async function fetchBalance(
    accountAddress: string | `0x${string}`,
    accountChainId: number,
    tokenAddress?: string | `0x${string}`, // optional ERC-20 address
): Promise<number> {
    const debug = false
    try {
        if (!tokenAddress) {
            // native token
            if (debug) console.log('Fetching gas token balance...')
            if (debug) toast('Fetching gas token balance...', { style: toastStyle })
            const result = await getBalance(config, { address: accountAddress as `0x${string}`, chainId: accountChainId })
            const formatted = Number(formatUnits(result.value, result.decimals))
            if (debug) console.log(`Gas token balance = ${formatted}`)
            if (debug) toast.success(`Gas token balance = ${formatted}`, { style: toastStyle })
            return formatted
        } else {
            // erc20 token
            if (debug) console.log(`Fetching ${shortenAddress(tokenAddress)} balance...`)
            if (debug) toast(`Fetching ${shortenAddress(tokenAddress)} balance...`, { style: toastStyle })
            const [decimals, balance] = await Promise.all([
                readContract(config, {
                    address: tokenAddress as `0x${string}`,
                    abi: erc20Abi,
                    functionName: 'decimals',
                    chainId: accountChainId,
                }) as Promise<number>,
                readContract(config, {
                    address: tokenAddress as `0x${string}`,
                    abi: erc20Abi,
                    functionName: 'balanceOf',
                    args: [accountAddress as `0x${string}`],
                    chainId: accountChainId,
                }) as Promise<bigint>,
            ])
            const formatted = Number(formatUnits(balance, decimals))
            if (debug) console.log(`${shortenAddress(tokenAddress)} balance = ${formatted}`)
            if (debug) toast.success(`${shortenAddress(tokenAddress)} balance = ${formatted}`, { style: toastStyle })
            return formatted
        }
    } catch (err) {
        console.error('Failed to fetch balance', err)
        toast.error('Could not fetch balance', { style: toastStyle })
        return 0
    }
}
