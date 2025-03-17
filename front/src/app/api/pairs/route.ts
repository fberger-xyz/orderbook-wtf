import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { APIResponse } from '@/interfaces'

const pathToJsonOrderbookFromFront = '../back/misc/data-front-v2/'

export async function GET() {
    const res: APIResponse<string[]> = { data: undefined, error: '' }
    try {
        const folderPath = path.join(process.cwd(), pathToJsonOrderbookFromFront)
        const files = await fs.readdir(folderPath)
        res.data = files.filter((file) => file.endsWith('.json'))
        return NextResponse.json(res)
    } catch (error) {
        return NextResponse.json({ ...res, error: 'Failed to list orderbook files' }, { status: 500 })
    }
}
