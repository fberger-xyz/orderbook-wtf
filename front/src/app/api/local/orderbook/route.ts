import { NextRequest, NextResponse } from 'next/server'
import { AmmAsOrderbook, APIResponse } from '@/interfaces'
import { isAddress } from 'viem'
import { RUST_API_ROOT } from '@/config/app.config'

export async function GET(req: NextRequest) {
    const res: APIResponse<AmmAsOrderbook> = { data: undefined, error: '' }
    const url = `${RUST_API_ROOT}/orderbook`

    // safe exec
    try {
        // validation
        const { searchParams } = new URL(req.url)
        const token0 = searchParams.get('token0')
        const token1 = searchParams.get('token1')
        if (!token0 || !isAddress(token0)) {
            res.error = `token0 must be a valid address ${url}`
            return NextResponse.json(res, { status: 500 })
        }
        if (!token1 || !isAddress(token1)) {
            res.error = `token0 must be a valid address ${url}`
            return NextResponse.json(res, { status: 500 })
        }

        // prepare request
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 seconds timeout

        // run req
        const fetchResponse = await fetch(`${url}?tag=${token0}-${token1}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            cache: 'no-store',
        })

        // timeout
        clearTimeout(timeoutId)

        // error
        if (!fetchResponse.ok) {
            res.error = `Error fetching ${url}`
            return NextResponse.json(res, { status: fetchResponse.status })
        }

        // read and cast
        const fetchResponseJson = (await fetchResponse.json()) as { orderbook: AmmAsOrderbook }
        res.data = fetchResponseJson.orderbook

        // res
        return NextResponse.json(res)
    } catch (error) {
        return NextResponse.json({ ...res, error: `Unexpected error while fetching ${url}` }, { status: 500 })
    }
}
