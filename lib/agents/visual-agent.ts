import { callAgent } from './shared'
import { BreadboardData, FatMarkerData, HiFiData } from '../vf-types'

// ── Types ────────────────────────────────────────────────────────────────────

interface HiFiVariantsResult {
  variants: HiFiData[]
}

// ── Hi-Fi Generation ─────────────────────────────────────────────────────────

const HIFI_SYSTEM_PROMPT = `You are a visual design agent for VibeForge. Given a committed breadboard and fat marker layout, generate polished hi-fi HTML/CSS renders.

Each variant should be a complete, self-contained HTML page with inline CSS that renders at 800x600 viewport. The design should:
- Follow the spatial layout from the fat marker regions
- Include all affordances from the breadboard as actual UI elements
- Apply the color palette from the fat marker
- Use modern CSS (flexbox/grid, border-radius, shadows, gradients)
- Include placeholder text that feels realistic
- Be visually polished — this is the hi-fi output

Return valid JSON:
{
  "variants": [
    {
      "id": "hifi-1",
      "name": "Clean Modern",
      "description": "Minimal design with bold typography",
      "html": "<!DOCTYPE html><html>...</html>",
      "css": "",
      "moodBoardInfluence": ["clean", "modern", "minimal"]
    }
  ]
}

The HTML should be complete and self-contained (inline styles or a <style> tag). The css field can be empty if styles are in the HTML.
Generate exactly {count} distinct visual variants.
Return ONLY valid JSON, no other text.`

export async function generateHiFi(opts: {
  breadboard: BreadboardData
  fatMarker: FatMarkerData
  productDescription: string
  jtbdRaw: string
  count?: number
  moodDescription?: string
}): Promise<HiFiData[]> {
  const { breadboard, fatMarker, productDescription, jtbdRaw, count = 2, moodDescription } = opts

  const userMessage = `Product: ${productDescription}
JTBD: ${jtbdRaw}
${moodDescription ? `Mood/Style: ${moodDescription}` : ''}

Committed breadboard: "${breadboard.name}"
Places: ${breadboard.places.map((p) => p.label).join(', ')}
Affordances: ${breadboard.affordances.map((a) => `${a.label} (${a.type})`).join(', ')}

Committed layout: "${fatMarker.name}"
Regions: ${fatMarker.regions.map((r) => `${r.label} (${r.type}, ${r.width}×${r.height})`).join(', ')}
Palette: ${fatMarker.palette.join(', ')}
Typography: heading=${fatMarker.typographyHints.headingWeight}, body=${fatMarker.typographyHints.bodySize}

Generate ${count} distinct hi-fi HTML/CSS renders.`

  const systemPrompt = HIFI_SYSTEM_PROMPT.replace('{count}', String(count))
  const result = await callAgent<HiFiVariantsResult>({
    systemPrompt,
    userMessage,
    tier: 'quality',
    maxTokens: 8192,
  })

  return result.variants
}
