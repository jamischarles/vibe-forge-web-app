import { callAgent, AgentTiming } from './shared'
import {
  JTBDStatement,
  BreadboardData,
} from '../vf-types'

// ── Types ────────────────────────────────────────────────────────────────────

export interface SetupResult {
  jtbd: JTBDStatement
  suggestedScreens: { name: string; description: string }[]
  suggestedFlows: { name: string; steps: string[] }[]
}

export interface BreadboardVariantsResult {
  variants: BreadboardData[]
}

// ── JTBD Extraction ──────────────────────────────────────────────────────────

const SETUP_SYSTEM_PROMPT = `You are a UX strategy agent. Given a product description, extract:
1. A JTBD statement (situation, motivation, outcome)
2. 4-8 key screens
3. 2-4 user flows

Return JSON:
{"jtbd":{"situation":"...","motivation":"...","outcome":"...","raw":"Full sentence"},"suggestedScreens":[{"name":"...","description":"..."}],"suggestedFlows":[{"name":"...","steps":["A","B"]}]}

Be opinionated about good UX. Return ONLY valid JSON.`

export async function extractJTBD(description: string): Promise<{ result: SetupResult; timing: AgentTiming }> {
  const { data, timing } = await callAgent<SetupResult>({
    label: 'extractJTBD',
    systemPrompt: SETUP_SYSTEM_PROMPT,
    userMessage: description,
    tier: 'fast',
  })
  return { result: data, timing }
}

// ── Breadboard Generation (parallelized, no coordinates) ────────────────────

/** Architecture patterns to assign to parallel calls */
const PATTERNS = [
  { name: 'Linear Wizard', hint: 'Step-by-step progression through screens' },
  { name: 'Hub & Spoke', hint: 'Central dashboard linking to sub-pages' },
  { name: 'Progressive Disclosure', hint: 'Start simple, reveal complexity on demand' },
  { name: 'Minimal', hint: 'Fewest screens possible, combine where you can' },
  { name: 'Dashboard-First', hint: 'Data overview as the entry point' },
  { name: 'Conversational', hint: 'Guided Q&A or chat-driven flow' },
]

const SINGLE_VARIANT_PROMPT = `You are a UX flow architect. Generate ONE breadboard variant using the specified pattern.

Return ONLY the logical graph — NO coordinates, NO layout. Just structure:
- places: screen nodes (id, label only)
- affordances: interactive elements (id, label, placeId, type)
- connections: edges (id, fromPlaceId, fromAffordanceId, toPlaceId, label)

Return JSON:
{"id":"variant-N","name":"Pattern Name","description":"Why this works","places":[{"id":"p1","label":"Screen"}],"affordances":[{"id":"a1","label":"Button","placeId":"p1","type":"button"}],"connections":[{"id":"c1","fromPlaceId":"p1","fromAffordanceId":"a1","toPlaceId":"p2","label":"action"}]}

Use ALL suggested screens. Return ONLY valid JSON.`

/** Generate a single variant with a specific pattern */
async function generateSingleVariant(opts: {
  index: number
  pattern: { name: string; hint: string }
  jtbd: JTBDStatement
  screens: { name: string; description: string }[]
  flows: { name: string; steps: string[] }[]
  feedback?: string
}): Promise<{ variant: BreadboardData; timing: AgentTiming }> {
  const { index, pattern, jtbd, screens, flows, feedback } = opts

  const userMessage = `Pattern: ${pattern.name} — ${pattern.hint}

JTBD: ${jtbd.raw}

Screens:
${screens.map((s) => `- ${s.name}: ${s.description}`).join('\n')}

Flows:
${flows.map((f) => `- ${f.name}: ${f.steps.join(' → ')}`).join('\n')}
${feedback ? `\nUser feedback: ${feedback}` : ''}`

  const { data, timing } = await callAgent<BreadboardData>({
    label: `breadboard-${index}`,
    systemPrompt: SINGLE_VARIANT_PROMPT,
    userMessage,
    tier: 'fast',
    maxTokens: 2048,
  })

  // Force unique id based on index (AI may return same id across parallel calls)
  data.id = `variant-${index + 1}`
  data.name = data.name || pattern.name

  return { variant: data, timing }
}

export async function generateBreadboards(opts: {
  jtbd: JTBDStatement
  screens: { name: string; description: string }[]
  flows: { name: string; steps: string[] }[]
  count?: number
  feedback?: string
}): Promise<{ variants: BreadboardData[]; timings: AgentTiming[] }> {
  const { jtbd, screens, flows, count = 4, feedback } = opts

  // Pick patterns for the requested count
  const selectedPatterns = PATTERNS.slice(0, count)

  // Launch all variant calls in parallel
  const promises = selectedPatterns.map((pattern, i) =>
    generateSingleVariant({
      index: i,
      pattern,
      jtbd,
      screens,
      flows,
      feedback: feedback || undefined,
    })
  )

  const results = await Promise.all(promises)

  return {
    variants: results.map((r) => r.variant),
    timings: results.map((r) => r.timing),
  }
}
