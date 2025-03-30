import { StructuredOutput } from '@/types'

export const initOutput = <T>(): StructuredOutput<T> => ({
    ts: Date.now(),
    success: false,
    error: '',
    data: undefined,
})
