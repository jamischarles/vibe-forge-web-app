import { callAgent, AgentTiming } from './shared'
import { BreadboardData, FatMarkerData, LayoutRegion } from '../vf-types'

// ── Types ────────────────────────────────────────────────────────────────────

interface FatMarkerVariantsResult {
  variants: FatMarkerData[]
}

// ── Fat Marker Generation ────────────────────────────────────────────────────

const FAT_MARKER_SYSTEM_PROMPT = `You are a UI layout agent for VibeForge. Given a committed breadboard (flow architecture), generate rough spatial layout variants for the primary screen.

Each variant arranges the breadboard's affordances into chunky spatial regions — think "fat marker sketch" level of detail. No pixel precision, just approximate zones.

Region types: header, hero, content, sidebar, footer, cta, nav, form, list, media

Layout rules:
- Viewport is 800x600 pixels
- Regions should be large, chunky blocks (minimum 100px in any dimension)
- Regions should tile the viewport without excessive gaps
- Each region should contain relevant affordances from the breadboard
- Suggest a color palette (3-5 hex colors) that fits the product's purpose

Return valid JSON:
{
  "variants": [
    {
      "id": "layout-1",
      "name": "Classic Header-Content-Footer",
      "description": "Traditional web layout with hero section",
      "regions": [
        { "id": "r1", "label": "Navigation", "type": "nav", "x": 0, "y": 0, "width": 800, "height": 60, "affordanceIds": ["a1"] }
      ],
      "palette": ["#1a1a2e", "#16213e", "#0f3460", "#533483", "#e94560"],
      "typographyHints": { "headingWeight": "bold", "bodySize": "medium" }
    }
  ]
}

Generate exactly {count} distinct layout variants.
Return ONLY valid JSON, no other text.`

export async function generateFatMarkers(opts: {
  breadboard: BreadboardData
  productDescription: string
  jtbdRaw: string
  count?: number
  moodDescription?: string
}): Promise<{ variants: FatMarkerData[]; timing: AgentTiming }> {
  const { breadboard, productDescription, jtbdRaw, count = 3, moodDescription } = opts

  const userMessage = `Product: ${productDescription}
JTBD: ${jtbdRaw}
${moodDescription ? `Mood/Style: ${moodDescription}` : ''}

Committed breadboard: "${breadboard.name}"
Places: ${breadboard.places.map((p) => p.label).join(', ')}
Affordances: ${breadboard.affordances.map((a) => `${a.label} (${a.type})`).join(', ')}

Generate ${count} distinct spatial layout variants for the primary screen.`

  const systemPrompt = FAT_MARKER_SYSTEM_PROMPT.replace('{count}', String(count))
  const { data, timing } = await callAgent<FatMarkerVariantsResult>({
    label: 'generateFatMarkers',
    systemPrompt,
    userMessage,
    tier: 'fast',
  })

  return { variants: data.variants, timing }
}
