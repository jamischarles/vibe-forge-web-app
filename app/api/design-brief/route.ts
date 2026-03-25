import { NextRequest, NextResponse } from 'next/server'
import { generateDesignBrief } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
    }

    const brief = await generateDesignBrief(prompt.trim())
    return NextResponse.json({ brief })

  } catch (error) {
    console.error('Design brief error:', error)
    return NextResponse.json(
      { error: 'Failed to generate design brief' },
      { status: 500 }
    )
  }
}
