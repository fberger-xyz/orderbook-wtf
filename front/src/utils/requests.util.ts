import { StructuredOutput } from '@/types'

export const initOutput = <T>(): StructuredOutput<T> => ({
    ts: Date.now(),
    success: false,
    error: '',
    data: undefined,
})

export const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number = 15000) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    const response = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(id)
    return response
}

export const defaultHeaders = { 'Content-Type': 'application/json' }
