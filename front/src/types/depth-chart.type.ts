import { OrderbookSide } from '@/enums'

// ratio, input, side, distribution, number
export type OrderbookDataPoint = [number, number, OrderbookSide, number[], number]
