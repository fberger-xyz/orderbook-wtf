export type FunctionReturn<T> = {
    ts: number
    success: boolean
    error: string
    data: null | T
}
