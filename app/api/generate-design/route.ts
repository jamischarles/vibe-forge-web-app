import { NextRequest, NextResponse } from 'next/server'
import { extractJTBD, generateBreadboards } from '@/lib/agents/strategy-agent'
import { generateFatMarkers } from '@/lib/agents/layout-agent'
import { generateHiFi } from '@/lib/agents/visual-agent'
import type { DesignPhase, BreadboardData, FatMarkerData, VariantVote, JTBDStatement } from '@/lib/vf-types'

interface GenerateDesignRequest {
  phase: DesignPhase
  action: 'setup' | 'generate_breadboards' | 'remix_breadboards' | 'generate_fat_markers' | 'generate_hifi'
  prompt: string
  projectContext?: {
    jtbd?: JTBDStatement
    screens?: { name: string; description: string }[]
    flows?: { name: string; steps: string[] }[]
    breadboard?: BreadboardData
    fatMarker?: FatMarkerData
    previousVariants?: BreadboardData[]
    votes?: Record<string, VariantVote>
    moodDescription?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateDesignRequest
    const { phase, action, prompt, projectContext } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
    }

    switch (action) {
      case 'setup': {
        const result = await extractJTBD(prompt)
        return NextResponse.json({ type: 'setup', ...result })
      }

      case 'generate_breadboards': {
        if (!projectContext?.jtbd || !projectContext?.screens) {
          return NextResponse.json({ error: 'JTBD and screens required for breadboard generation' }, { status: 400 })
        }
        const variants = await generateBreadboards({
          jtbd: projectContext.jtbd,
          screens: projectContext.screens,
          flows: projectContext.flows ?? [],
          count: 4,
        })
        return NextResponse.json({ type: 'breadboards', variants })
      }

      case 'remix_breadboards': {
        if (!projectContext?.jtbd || !projectContext?.screens) {
          return NextResponse.json({ error: 'JTBD and screens required' }, { status: 400 })
        }
        const variants = await generateBreadboards({
          jtbd: projectContext.jtbd,
          screens: projectContext.screens,
          flows: projectContext.flows ?? [],
          count: 3,
          feedback: prompt,
          previousVariants: projectContext.previousVariants,
          votes: projectContext.votes,
        })
        return NextResponse.json({ type: 'breadboards', variants })
      }

      case 'generate_fat_markers': {
        if (!projectContext?.breadboard) {
          return NextResponse.json({ error: 'Committed breadboard required' }, { status: 400 })
        }
        const variants = await generateFatMarkers({
          breadboard: projectContext.breadboard,
          productDescription: prompt,
          jtbdRaw: projectContext.jtbd?.raw ?? prompt,
          moodDescription: projectContext.moodDescription,
        })
        return NextResponse.json({ type: 'fat_markers', variants })
      }

      case 'generate_hifi': {
        if (!projectContext?.breadboard || !projectContext?.fatMarker) {
          return NextResponse.json({ error: 'Committed breadboard and fat marker required' }, { status: 400 })
        }
        const variants = await generateHiFi({
          breadboard: projectContext.breadboard,
          fatMarker: projectContext.fatMarker,
          productDescription: prompt,
          jtbdRaw: projectContext.jtbd?.raw ?? prompt,
          moodDescription: projectContext.moodDescription,
        })
        return NextResponse.json({ type: 'hifi', variants })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Generate design error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate design' },
      { status: 500 }
    )
  }
}
