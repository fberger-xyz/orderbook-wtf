import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { AmmAsOrderbook, APIResponse } from '@/interfaces'

const pathToJsonOrderbookFromFront = '../back/misc/data-front-v2/'

export async function GET(req: NextRequest) {
    const res: APIResponse<AmmAsOrderbook> = { data: undefined, error: '' }
    try {
        // get filename
        const { searchParams } = new URL(req.url)
        const fileName = searchParams.get('fileName')
        if (!fileName) return NextResponse.json({ ...res, error: 'Missing fileName in params' }, { status: 400 })

        // get file path
        const folderPath = path.join(process.cwd(), pathToJsonOrderbookFromFront)
        const filePath = path.join(folderPath, fileName)
        const fileContent = await fs.readFile(filePath, 'utf8')

        // read and cast
        res.data = JSON.parse(fileContent) as AmmAsOrderbook

        // res
        return NextResponse.json(res)
    } catch (error) {
        return NextResponse.json({ ...res, error: 'Failed to load orderbook' }, { status: 500 })
    }
}
