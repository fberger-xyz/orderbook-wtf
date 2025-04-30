'use client'

import { OrderbookComponentLayout } from '../commons/Commons'

export default function OrderbookSection() {
    return (
        <OrderbookComponentLayout
            title={
                <div className="w-full flex justify-between">
                    <button className="flex gap-1 items-center rounded-lg px-2.5 py-1.5 -ml-1">
                        <p className="text-milk text-base font-semibold">Orderbook 🚧</p>
                    </button>
                </div>
            }
            content={
                <div className="flex flex-col">
                    {/* <p>Asks</p>
                    <p>Mid</p>
                    <p>Bids</p> */}
                </div>
            }
        />
    )
}
