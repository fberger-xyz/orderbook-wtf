export enum AppSupportedChains {
    ETHEREUM = 'ethereum',
    UNICHAIN = 'unichain',
}

export enum AppUrls {
    // app pages
    ABOUT = '/about',
    ORDERBOOK = '/',

    // next api
    NEXT_API_LOCALHOST = 'http://localhost:3000',
    NEXT_API_PROD = 'https://www.orderbook.wtf',
    NEXT_API_PROD_SHORTER = 'https:/orderbook.wtf',

    // rust api
    RUST_API_LOCALHOST = 'http://localhost:42042/api',
    RUST_API_DOCKER = 'http://stream:42042/api',
    RUST_API_PROD = 'https://tycho.merso.xyz/api',

    // PropellerHeads
    PROPELLERHEADS_WEBSITE = 'https://www.propellerheads.xyz/',
    PROPELLERHEADS_X = 'https://x.com/PropellerSwap',
    PROPELLERHEADS_TELEGRAM = 'https://t.me/+B4CNQwv7dgIyYTJl',
    PROPELLERHEADS_EXPLORER = 'to-be-added',
    TYCHO_STATUS = 'https://grafana.propellerheads.xyz/public-dashboards/518dd877a470434383caf9fc5845652e?orgId=1&refresh=5s',

    // merso
    MERSO_X = 'https://x.com/0xMerso',
    MERSO_TELEGRAM = 'https://t.me/xMerso',
    MERSO_WEBSITE = 'https://www.merso.xyz/',

    // fberger
    FBERGER_X = 'https://x.com/fberger_xyz',
    FBERGER_TELEGRAM = 'https://t.me/fberger_xyz',
    FBERGER_WEBSITE = 'https://www.fberger.xyz/',

    // VM
    VM_UPTIME = 'https://merso.betteruptime.com/',

    // doc
    TYCHO_INDEXER = 'https://docs.propellerheads.xyz/tycho/for-solvers/indexer',
    DOCUMENTATION = 'https://tycho-orderbook.gitbook.io/docs',
}
