import { ReactNode } from 'react'

export const OrderbookKeyMetric = (props: { title: string; content: ReactNode }) => (
    <OrderbookComponentLayout title={<p className="text-milk-600 text-xs">{props.title}</p>} content={props.content} />
)
export const OrderbookComponentLayout = (props: { title: ReactNode; content: ReactNode }) => (
    <div className="flex flex-col w-full border rounded-xl px-4 py-3 border-milk-100 gap-1 bg-milk-50 backdrop-blur">
        {props.title}
        {props.content}
    </div>
)
