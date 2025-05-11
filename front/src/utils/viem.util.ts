'use client'

import toast from 'react-hot-toast'
import { config } from '@/providers/wagmi'
import { toastStyle } from '@/config/toasts.config'
import { getBalance, readContract } from '@wagmi/core'
import { formatUnits } from 'viem'
import { erc20Abi } from 'viem'

export async function fetchBalance(
    accountAddress: string | `0x${string}`,
    accountChainId: number,
    tokenAddress?: string | `0x${string}`, // optional ERC-20 address
): Promise<number> {
    try {
        if (!tokenAddress) {
            // native token
            const result = await getBalance(config, { address: accountAddress as `0x${string}`, chainId: accountChainId })
            return Number(formatUnits(result.value, result.decimals))
        } else {
            // erc20 token
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
            return Number(formatUnits(balance, decimals))
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        toast.error(`Failed to fetch balance: ${errorMessage}`, { style: toastStyle })
        return 0
    }
}
