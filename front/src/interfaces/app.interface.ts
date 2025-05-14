import { AppUrls } from '../enums'

export interface InterfaceAppLink {
    name: string
    path: AppUrls
}

export interface StructuredOutput<Data> {
    success: boolean
    data?: Data
    error: string
    ts: number
}
