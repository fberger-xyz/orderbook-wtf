import CommitInfo from '@/components/common/CommitInfo'
import AppStoreLoader from '@/components/stores/AppStoreLoader'
import Dashboard from '@/components/app/Dashboard'
// import { AmmAsOrderbook } from '@/interfaces'
// import { promises as fs } from 'fs'

export default function Page() {
    // const commonPath = '../back/misc/data-front-v2/orderbook.ethereum.'
    // const FILE_PATH = `${commonPath}DAI-USDT.json`
    // const FILE_PATH = `${commonPath}USDC-DAI.json`
    // const FILE_PATH = `${commonPath}USDC-USDT.json`
    // const FILE_PATH = `${commonPath}USDC-WBTC.json`
    // const FILE_PATH = `${commonPath}WBTC-DAI.json`
    // const FILE_PATH = `${commonPath}WBTC-USDT.json`
    // const FILE_PATH = `${commonPath}WETH-DAI.json`
    // const FILE_PATH = `${commonPath}WETH-USDC.json`
    // const FILE_PATH = `${commonPath}WETH-USDT.json`
    // const FILE_PATH = `${commonPath}WETH-WBTC.json`

    // read locally
    // const ORDERBOOK_PATH = process.cwd() + `/${FILE_PATH}`
    // const ORDERBOOK_CONTENT = await fs.readFile(ORDERBOOK_PATH, 'utf8')
    // const ORDERBOOK = JSON.parse(ORDERBOOK_CONTENT) as AmmAsOrderbook

    return (
        <AppStoreLoader>
            {/* take inspiration from https://app.uniswap.org/explore/pools/ethereum/0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640 */}
            <Dashboard />
            {/* <div className="flex w-full grow flex-col gap-8 lg:flex-row">
                <ChartLayout
                    title={`Ethereum ${ORDERBOOK.token0.symbol}/${ORDERBOOK.token1.symbol} - market depth`}
                    subtitle={`Work in progress 🚧`}
                    chart={<DepthChart orderbook={ORDERBOOK} />}
                />
                <div className="flex size-[500px] flex-col gap-4">
                    <div className="flex w-full flex-col rounded-2xl bg-very-light-hover p-4">
                        <SelectedTrade />
                    </div>
                </div>
            </div> */}
            <CommitInfo />
        </AppStoreLoader>
    )
}
