import { NextRequest, NextResponse } from 'next/server'
import { generateGameConfig, GameConfig } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, currentConfig } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
    }

    const config = await generateGameConfig(
      prompt.trim(),
      currentConfig as GameConfig | undefined
    )

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Generate game error:', error)
    return NextResponse.json(
      { error: 'Failed to generate game config' },
      { status: 500 }
    )
  }
}
