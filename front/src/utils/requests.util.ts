import { StructuredOutput } from '@/types'

export type RequestOptions = RequestInit & {
    timeout?: number
    retries?: number
}

export const initOutput = <T>(): StructuredOutput<T> => ({
    ts: Date.now(),
    success: false,
    error: '',
    data: undefined,
})

export const fetchWithTimeout = async (
    url: string,
    options: RequestOptions = {},
): Promise<Response> => {
    const { timeout = 15000, retries = 0, ...fetchOptions } = options
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        return response
    } catch (error) {
        if (retries > 0) {
            return fetchWithTimeout(url, { ...options, retries: retries - 1 })
        }
        throw error
    } finally {
        clearTimeout(timeoutId)
    }
}

export const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
} as const

export const createRequest = async <T>(
    url: string,
    options: RequestOptions = {},
): Promise<StructuredOutput<T>> => {
    const output = initOutput<T>()

    try {
        const response = await fetchWithTimeout(url, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers },
        })
        const data = await response.json()
        return { ...output, success: true, data }
    } catch (error) {
        return {
            ...output,
            error: error instanceof Error ? error.message : 'An unknown error occurred',
        }
    }
}
