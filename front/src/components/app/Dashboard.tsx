'use client'

import AvailablePairs from './AvailablePairs'
import SelectedPairAsOrderbook from './SelectedPairAsOrderbook'
import SelectedTrade from './SelectedTrade'

export default function Dashboard() {
    return (
        <div className="w-full grid grid-cols-12 gap-2">
            <div className="col-span-2">
                <AvailablePairs />
            </div>
            <div className="col-span-7 border-x px-2 border-light-hover">
                <SelectedPairAsOrderbook />
            </div>
            <div className="col-span-3">
                <SelectedTrade />
            </div>
        </div>
    )
}
