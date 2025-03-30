export type StructuredOutput<T> = {
    ts: number
    success: boolean
    error: string
    data?: T
}
