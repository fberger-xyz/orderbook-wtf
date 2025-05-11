import { NextRequest, NextResponse } from 'next/server'
import { AmmAsOrderbook, StructuredOutput } from '@/interfaces'
import { isAddress } from 'viem'
import { PUBLIC_STREAM_API_URL } from '@/config/app.config'
import { extractErrorMessage, fetchWithTimeout, initOutput } from '@/utils'

export async function GET(req: NextRequest) {
    const res = initOutput<AmmAsOrderbook>()

    // safe exec
    try {
        // validation
        const { searchParams } = new URL(req.url)
        const chainName = searchParams.get('chain')
        const url = `${PUBLIC_STREAM_API_URL}/${chainName}/orderbook`
        const token0 = searchParams.get('token0')
        const token1 = searchParams.get('token1')
        const pointToken = searchParams.get('pointToken')
        const pointAmount = Number(searchParams.get('pointAmount'))
        if (!token0 || !isAddress(token0)) {
            res.error = `token0 must be a valid address ${url}`
            return NextResponse.json(res, { status: 500 })
        }
        if (!token1 || !isAddress(token1)) {
            res.error = `token0 must be a valid address ${url}`
            return NextResponse.json(res, { status: 500 })
        }

        // prepare request
        const body: { tag: string; point?: { input: string; amount: number } } = { tag: `${token0}-${token1}` }
        if (pointToken && !isNaN(Number(pointAmount))) body.point = { input: pointToken, amount: Number(pointAmount) }

        // run req
        const fetchResponse = await fetchWithTimeout(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', [`${process.env.API_HEADER_KEY}`]: `${process.env.API_HEADER_VALUE}` },
            cache: 'no-store',
            body: JSON.stringify(body),
        })

        // error
        if (!fetchResponse.ok) {
            res.error = `Error fetching ${url}`
            return NextResponse.json(res, { status: fetchResponse.status })
        }

        // cast
        const fetchResponseJson = (await fetchResponse.json()) as StructuredOutput<AmmAsOrderbook>
        res.ts = fetchResponseJson.ts
        res.error = fetchResponseJson.error
        res.data = fetchResponseJson.data

        // double check errors
        if (String(res.data).includes('error')) return NextResponse.json({ ...res, error: `Upstream rust API returned an error` }, { status: 502 })

        // res
        return NextResponse.json(res)
    } catch (error) {
        const parsedError = extractErrorMessage(error)
        return NextResponse.json({ ...res, error: `Unexpected error while fetching orderbook: ${parsedError}` }, { status: 500 })
    }
}
