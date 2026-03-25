import { NextResponse } from 'next/server'
import { appendFile, mkdir, readFile } from 'fs/promises'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')
const VOTES_FILE = join(DATA_DIR, 'votes.jsonl')

export async function POST(req: Request) {
  try {
    const vote = await req.json()
    await mkdir(DATA_DIR, { recursive: true })
    await appendFile(VOTES_FILE, JSON.stringify(vote) + '\n')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Failed to record vote:', err)
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const raw = await readFile(VOTES_FILE, 'utf-8')
    const votes = raw.trim().split('\n').filter(Boolean).map((line: string) => JSON.parse(line))
    return NextResponse.json(votes)
  } catch {
    return NextResponse.json([])
  }
}
