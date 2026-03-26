import { callAgent } from './shared'
import {
  JTBDStatement,
  BreadboardData,
  Place,
  Affordance,
  Connection,
  VariantVote,
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

const SETUP_SYSTEM_PROMPT = `You are a UX strategy agent for VibeForge, an AI-powered design tool.

Given a product or feature description from a user, extract:
1. A Jobs-to-Be-Done statement with situation, motivation, and outcome
2. 4-8 key screens/pages the product needs
3. 2-4 primary user flows connecting those screens

Return valid JSON matching this exact structure:
{
  "jtbd": {
    "situation": "When I am [situation]...",
    "motivation": "I want to [motivation]...",
    "outcome": "So I can [outcome]...",
    "raw": "Full JTBD sentence"
  },
  "suggestedScreens": [
    { "name": "Screen Name", "description": "What this screen does" }
  ],
  "suggestedFlows": [
    { "name": "Flow Name", "steps": ["Screen A", "Screen B", "Screen C"] }
  ]
}

Guidelines:
- The JTBD statement should capture the core user need, not be too generic
- Screens should be concrete and specific to the product described
- Flows should represent complete user journeys through the screens
- Be opinionated about good UX — suggest screens the user might not have thought of (e.g., onboarding, error states, empty states)
- Keep screen names short and descriptive (2-4 words)
- Return ONLY valid JSON, no other text`

export async function extractJTBD(description: string): Promise<SetupResult> {
  return callAgent<SetupResult>({
    systemPrompt: SETUP_SYSTEM_PROMPT,
    userMessage: description,
    tier: 'fast',
  })
}

// ── Breadboard Generation ────────────────────────────────────────────────────

const BREADBOARD_SYSTEM_PROMPT = `You are a UX flow architect for VibeForge. Given a JTBD statement and a list of screens, generate breadboard flow variants.

Each variant is a different architectural approach to organizing the same screens:
- Linear/wizard: step-by-step progression
- Hub-and-spoke: central dashboard linking to sub-pages
- Progressive disclosure: start simple, reveal complexity
- Conversational: guided Q&A flow
- Dashboard-first: data overview as entry point
- Minimal: fewest screens possible

For each variant, generate:
- places: screen nodes with x,y coordinates and dimensions for SVG rendering in an 800x600 viewport
- affordances: interactive elements within each place (buttons, fields, links, etc.)
- connections: directed edges between places (which affordance leads where)

Layout rules:
- Viewport is 800x600 pixels
- Place nodes should be 120-180px wide, 60-100px tall
- Leave 40px minimum padding from edges
- Space nodes evenly — avoid overlapping
- Place nodes in a logical reading order (top-to-bottom, left-to-right)

Return valid JSON:
{
  "variants": [
    {
      "id": "variant-1",
      "name": "Linear Wizard",
      "description": "Step-by-step flow with clear progression",
      "places": [
        { "id": "p1", "label": "Landing Page", "x": 80, "y": 80, "width": 160, "height": 80 }
      ],
      "affordances": [
        { "id": "a1", "label": "Get Started", "placeId": "p1", "type": "button" }
      ],
      "connections": [
        { "id": "c1", "fromPlaceId": "p1", "fromAffordanceId": "a1", "toPlaceId": "p2", "label": "Click CTA" }
      ]
    }
  ]
}

Generate exactly {count} distinct variants. Each must use ALL the suggested screens but arrange them differently.
Return ONLY valid JSON, no other text.`

export async function generateBreadboards(opts: {
  jtbd: JTBDStatement
  screens: { name: string; description: string }[]
  flows: { name: string; steps: string[] }[]
  count?: number
  feedback?: string
  previousVariants?: BreadboardData[]
  votes?: Record<string, VariantVote>
}): Promise<BreadboardData[]> {
  const { jtbd, screens, flows, count = 4, feedback, previousVariants, votes } = opts

  let userMessage = `JTBD: ${jtbd.raw}

Screens:
${screens.map((s) => `- ${s.name}: ${s.description}`).join('\n')}

Flows:
${flows.map((f) => `- ${f.name}: ${f.steps.join(' → ')}`).join('\n')}

Generate ${count} distinct breadboard variants.`

  if (previousVariants && votes) {
    const voted = previousVariants.map((v) => ({
      name: v.name,
      description: v.description,
      vote: votes[v.id] ?? 'none',
    }))
    userMessage += `

Previous round results:
${voted.map((v) => `- "${v.name}": ${v.vote}`).join('\n')}

${feedback ? `User feedback: ${feedback}` : ''}

Generate ${count} new variants that incorporate the user's preferences. Keep elements from starred/upvoted variants and avoid patterns from downvoted ones.`
  }

  const systemPrompt = BREADBOARD_SYSTEM_PROMPT.replace('{count}', String(count))
  const result = await callAgent<BreadboardVariantsResult>({
    systemPrompt,
    userMessage,
    tier: 'fast',
    maxTokens: 8192,
  })

  return result.variants
}
