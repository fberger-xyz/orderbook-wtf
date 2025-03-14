import { OrderbookSide } from '@/enums'

// ratio, input, side, output, distribution
export type OrderbookDataPoint = [number, number, OrderbookSide, number[]]
