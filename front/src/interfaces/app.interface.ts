import { AppPagePaths, IconIds } from '../enums'

export interface InterfaceAppLink {
    name: string
    path: AppPagePaths
    icon?: IconIds
    public: boolean
    tg: boolean
    legal: boolean
    description?: string
    sublinks: InterfaceAppLink[]
}

export interface APIResponse<Data> {
    data?: Data
    error: string
}
