import { NextRequest, NextResponse } from 'next/server'
import { StructuredOutput, Token } from '@/interfaces'
import { PUBLIC_STREAM_API_URL } from '@/config/app.config'
import { fetchWithTimeout, initOutput } from '@/utils'

export async function GET(req: NextRequest) {
    const res = initOutput<Token[]>()
    try {
        const { searchParams } = new URL(req.url)
        const chainName = searchParams.get('chain')
        const url = `${PUBLIC_STREAM_API_URL}/${chainName}/tokens`

        // run req
        const fetchResponse = await fetchWithTimeout(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', [`${process.env.API_HEADER_KEY}`]: `${process.env.API_HEADER_VALUE}` },
            cache: 'no-store',
        })

        // error
        if (!fetchResponse.ok) {
            res.error = `Error fetching ${url}`
            return NextResponse.json(res, { status: fetchResponse.status })
        }

        // read and cast
        const fetchResponseJson = (await fetchResponse.json()) as StructuredOutput<Token[]>
        res.ts = fetchResponseJson.ts
        res.error = fetchResponseJson.error
        res.data = fetchResponseJson.data

        // res
        return NextResponse.json(res)
    } catch (error) {
        return NextResponse.json({ ...res, error: `Unexpected error while fetching tokens` }, { status: 500 })
    }
}
