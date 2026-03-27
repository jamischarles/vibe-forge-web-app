import { NextRequest, NextResponse } from 'next/server'
import { extractJTBD, generateBreadboards } from '@/lib/agents/strategy-agent'
import { generateFatMarkers } from '@/lib/agents/layout-agent'
import { generateHiFi } from '@/lib/agents/visual-agent'
import { computeLayout } from '@/lib/layout'
import type { DesignPhase, BreadboardData, FatMarkerData, JTBDStatement } from '@/lib/vf-types'
import type { AgentTiming } from '@/lib/agents/shared'

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
    moodDescription?: string
  }
}

/** Apply auto-layout positions to breadboard variants that lack coordinates */
function applyLayout(variants: BreadboardData[]): BreadboardData[] {
  return variants.map((v) => {
    const layoutPositions = computeLayout(
      v.places.map((p) => ({ id: p.id, label: p.label })),
      v.connections.map((c) => ({ fromPlaceId: c.fromPlaceId, toPlaceId: c.toPlaceId }))
    )
    const posMap = new Map(layoutPositions.map((lp) => [lp.id, lp]))
    return {
      ...v,
      places: v.places.map((p) => {
        const pos = posMap.get(p.id)
        return pos
          ? { ...p, x: pos.x, y: pos.y, width: pos.width, height: pos.height }
          : { ...p, x: p.x ?? 0, y: p.y ?? 0, width: p.width ?? 140, height: p.height ?? 80 }
      }),
    }
  })
}

export async function POST(request: NextRequest) {
  const requestStart = Date.now()

  try {
    const body = (await request.json()) as GenerateDesignRequest
    const { action, prompt, projectContext } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
    }

    const timings: AgentTiming[] = []

    switch (action) {
      case 'setup': {
        const { result, timing: setupTiming } = await extractJTBD(prompt)
        timings.push(setupTiming)
        const totalMs = Date.now() - requestStart
        console.log(`[route:setup] totalMs=${totalMs}`)
        return NextResponse.json({ type: 'setup', ...result, timing: { agents: timings, totalMs } })
      }

      case 'generate_breadboards': {
        if (!projectContext?.jtbd || !projectContext?.screens) {
          return NextResponse.json({ error: 'JTBD and screens required for breadboard generation' }, { status: 400 })
        }
        const { variants, timings: bbTimings } = await generateBreadboards({
          jtbd: projectContext.jtbd,
          screens: projectContext.screens,
          flows: projectContext.flows ?? [],
          count: 4,
        })
        timings.push(...bbTimings)
        const layoutVariants = applyLayout(variants)
        const totalMs = Date.now() - requestStart
        console.log(`[route:generate_breadboards] totalMs=${totalMs} | parallel calls=${bbTimings.length} | slowest=${Math.max(...bbTimings.map(t => t.durationMs))}ms`)
        return NextResponse.json({ type: 'breadboards', variants: layoutVariants, timing: { agents: timings, totalMs } })
      }

      case 'remix_breadboards': {
        if (!projectContext?.jtbd || !projectContext?.screens) {
          return NextResponse.json({ error: 'JTBD and screens required' }, { status: 400 })
        }
        const { variants, timings: remixTimings } = await generateBreadboards({
          jtbd: projectContext.jtbd,
          screens: projectContext.screens,
          flows: projectContext.flows ?? [],
          count: 3,
          feedback: prompt,
        })
        timings.push(...remixTimings)
        const layoutVariants = applyLayout(variants)
        const totalMs = Date.now() - requestStart
        console.log(`[route:remix_breadboards] totalMs=${totalMs}`)
        return NextResponse.json({ type: 'breadboards', variants: layoutVariants, timing: { agents: timings, totalMs } })
      }

      case 'generate_fat_markers': {
        if (!projectContext?.breadboard) {
          return NextResponse.json({ error: 'Committed breadboard required' }, { status: 400 })
        }
        const { variants, timing: fmTiming } = await generateFatMarkers({
          breadboard: projectContext.breadboard,
          productDescription: prompt,
          jtbdRaw: projectContext.jtbd?.raw ?? prompt,
          moodDescription: projectContext.moodDescription,
        })
        timings.push(fmTiming)
        const totalMs = Date.now() - requestStart
        console.log(`[route:generate_fat_markers] totalMs=${totalMs}`)
        return NextResponse.json({ type: 'fat_markers', variants, timing: { agents: timings, totalMs } })
      }

      case 'generate_hifi': {
        if (!projectContext?.breadboard || !projectContext?.fatMarker) {
          return NextResponse.json({ error: 'Committed breadboard and fat marker required' }, { status: 400 })
        }
        const { variants, timing: hifiTiming } = await generateHiFi({
          breadboard: projectContext.breadboard,
          fatMarker: projectContext.fatMarker,
          productDescription: prompt,
          jtbdRaw: projectContext.jtbd?.raw ?? prompt,
          moodDescription: projectContext.moodDescription,
        })
        timings.push(hifiTiming)
        const totalMs = Date.now() - requestStart
        console.log(`[route:generate_hifi] totalMs=${totalMs}`)
        return NextResponse.json({ type: 'hifi', variants, timing: { agents: timings, totalMs } })
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
