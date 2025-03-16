import { ChartLayout } from '@/components/charts/ChartsCommons'
import DepthChart from '@/components/charts/DepthChart'
import CommitInfo from '@/components/common/CommitInfo'
import AppStoreLoader from '@/components/stores/AppStoreLoader'
import SelectedTrade from '@/components/wallet/SelectedTrade'
import { NewOrderbookTrades } from '@/interfaces'
import { promises as fs } from 'fs'

export default async function Page() {

    const commonPath = "../back/misc/data-front-v2/orderbook.ethereum."
    // const FILE_PATH = `${commonPath}0x2260fac5e5542a773aa44fbcfedf7c193bc2c599-0x6b175474e89094c44da98b954eedeac495271d0f.json`
    // const FILE_PATH = `${commonPath}0x2260fac5e5542a773aa44fbcfedf7c193bc2c599-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.json`
    // const FILE_PATH = `${commonPath}0x2260fac5e5542a773aa44fbcfedf7c193bc2c599-0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2.json`
    // const FILE_PATH = `${commonPath}0x2260fac5e5542a773aa44fbcfedf7c193bc2c599-0xdac17f958d2ee523a2206206994597c13d831ec7.json`
    // const FILE_PATH = `${commonPath}0x6b175474e89094c44da98b954eedeac495271d0f-0xdac17f958d2ee523a2206206994597c13d831ec7.json`
    // const FILE_PATH = `${commonPath}0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48-0xdac17f958d2ee523a2206206994597c13d831ec7.json`
    const FILE_PATH = `${commonPath}0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.json`
    // const FILE_PATH = `${commonPath}0xdac17f958d2ee523a2206206994597c13d831ec7-0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.json`

    // read locally
    const ORDERBOOK_PATH = process.cwd() + `/${FILE_PATH}`

    // parse
    const ORDERBOOK_CONTENT = await fs.readFile(ORDERBOOK_PATH, 'utf8')

    // cast
    const ORDERBOOK = JSON.parse(ORDERBOOK_CONTENT) as NewOrderbookTrades


    return (
        <AppStoreLoader>
            {/* take inspiration from https://app.uniswap.org/explore/pools/ethereum/0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640 */}
            <div className="flex w-full grow flex-col gap-8 md:flex-row">
                <ChartLayout
                    title={`Ethereum ${ORDERBOOK.from.symbol}/${ORDERBOOK.to.symbol} - market depth`}
                    subtitle={`Work in progress 🚧`}
                    chart={<DepthChart orderbook={ORDERBOOK} />}
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
