import { FunctionReturn } from '@/types'

export const generateResponseBody = <T>(): FunctionReturn<T> => ({
    ts: Date.now(),
    success: false,
    error: '',
    data: null,
})
