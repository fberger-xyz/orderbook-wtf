import { NextResponse } from 'next/server'
import { APIResponse, Token } from '@/interfaces'
import { RUST_API_ROOT } from '@/config/app.config'

export async function GET() {
    const res: APIResponse<Token[]> = { data: undefined, error: '' }
    const url = `${RUST_API_ROOT}/tokens`
    try {
        // prepare request
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 seconds timeout

        // run req
        const fetchResponse = await fetch(url, {
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
        const fetchResponseJson = (await fetchResponse.json()) as { tokens: Token[] }
        res.data = fetchResponseJson.tokens

        // res
        return NextResponse.json(res)
    } catch (error) {
        return NextResponse.json({ ...res, error: `Unexpected error while fetching ${url}` }, { status: 500 })
    }
}
