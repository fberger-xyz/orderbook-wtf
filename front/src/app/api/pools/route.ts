import { NextRequest, NextResponse } from 'next/server'
import { RustApiLiquidityPool, StructuredOutput } from '@/interfaces'
import { PUBLIC_STREAM_API_URL } from '@/config/app.config'
import { initOutput } from '@/utils'

export async function GET(req: NextRequest) {
    const res = initOutput<RustApiLiquidityPool[]>()
    try {
        const { searchParams } = new URL(req.url)
        const chainName = searchParams.get('chain')
        const url = `${PUBLIC_STREAM_API_URL}/${chainName}/components`

        // prepare request
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 seconds timeout

        // run req
        const fetchResponse = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', [`${process.env.API_HEADER_KEY}`]: `${process.env.API_HEADER_VALUE}` },
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
        const fetchResponseJson = (await fetchResponse.json()) as StructuredOutput<RustApiLiquidityPool[]>
        res.ts = fetchResponseJson.ts
        res.error = fetchResponseJson.error
        res.data = fetchResponseJson.data

        // res
        return NextResponse.json(res)
    } catch (error) {
        return NextResponse.json({ ...res, error: `Unexpected error while fetching pools` }, { status: 500 })
    }
}
