import OpenAI from 'openai'

// ── Client ───────────────────────────────────────────────────────────────────

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ── Model tiers ──────────────────────────────────────────────────────────────

export type ModelTier = 'fast' | 'quality'

function getModel(_tier: ModelTier): string {
  // Use gpt-4o-mini for all tiers
  return 'gpt-4o-mini'
}

// ── Core agent call ──────────────────────────────────────────────────────────

export async function callAgent<T>(opts: {
  systemPrompt: string
  userMessage: string
  tier: ModelTier
  maxTokens?: number
}): Promise<T> {
  const { systemPrompt, userMessage, tier, maxTokens = 4096 } = opts

  const response = await client.chat.completions.create({
    model: getModel(tier),
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  })

  const text = response.choices[0]?.message?.content
  if (!text) {
    throw new Error('No text response from AI agent')
  }

  // Parse JSON from the response — strip markdown fences if present
  let jsonStr = text.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }

  try {
    return JSON.parse(jsonStr) as T
  } catch (e) {
    throw new Error(`Failed to parse agent JSON response: ${(e as Error).message}\n\nRaw response:\n${text.slice(0, 500)}`)
  }
}
