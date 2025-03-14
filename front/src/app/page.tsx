import { ChartLayout } from '@/components/charts/ChartsCommons'
import DepthChart from '@/components/charts/DepthChart'
import CommitInfo from '@/components/common/CommitInfo'
import AppStoreLoader from '@/components/stores/AppStoreLoader'
import SelectedTrade from '@/components/wallet/SelectedTrade'
import { OrderbookTrades } from '@/interfaces'
import { promises as fs } from 'fs'

enum JsonInputs {
    ASKS = 'asks-ethereum.opti.eth-usdc.orderbook-0to1.json',
    BIDS = 'bids-ethereum.opti.eth-usdc.orderbook-1to0.json',
}

export default async function Page() {
    // read locally
    const ASKS_PATH = process.cwd() + `/src/data/depth-chart/${JsonInputs.ASKS}`
    const BIDS_PATH = process.cwd() + `/src/data/depth-chart/${JsonInputs.BIDS}`

    // parse
    const ASKS_FILE = await fs.readFile(ASKS_PATH, 'utf8')
    const BIDS_FILE = await fs.readFile(BIDS_PATH, 'utf8')

    // cast
    const ASKS = JSON.parse(ASKS_FILE) as OrderbookTrades
    const BIDS = JSON.parse(BIDS_FILE) as OrderbookTrades

    // hardcoded for now
    const token0 = 'WETH'
    const token1 = 'USDC'
    // const zeroToOne = true

    return (
        <AppStoreLoader>
            {/* take inspiration from https://app.uniswap.org/explore/pools/ethereum/0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640 */}
            <div className="flex w-full grow flex-col gap-8 md:flex-row">
                <ChartLayout
                    title={`Ethereum ${token0}/${token1} - market depth`}
                    subtitle={`Work in progress 🚧`}
                    chart={<DepthChart bids={BIDS} asks={ASKS} />}
                />
                <div className="flex size-[500px] flex-col gap-4">
                    <div className="flex w-full flex-col rounded-2xl bg-very-light-hover p-4">
                        <SelectedTrade />
                    </div>
                </div>
            </div>
            {/* <ChartLayout
                title={`${token0}/${token1} liquidity`}
                subtitle={`some description`}
                chart={<ActiveLiquidityChart token0={token0} token1={token1} zeroToOne={zeroToOne} />}
            /> */}
            <CommitInfo />
        </AppStoreLoader>
    )
}
