import OpenAI from 'openai'

// ── Client ───────────────────────────────────────────────────────────────────

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return client
}

// ── Model tiers ──────────────────────────────────────────────────────────────

export type ModelTier = 'fast' | 'quality'

function getModel(_tier: ModelTier): string {
  // Use gpt-4o-mini for all tiers
  return 'gpt-4o-mini'
}

// ── Timing metadata ─────────────────────────────────────────────────────────

export interface AgentTiming {
  label: string
  durationMs: number
  model: string
  promptTokens: number
  completionTokens: number
}

// ── Core agent call ──────────────────────────────────────────────────────────

export interface AgentResult<T> {
  data: T
  timing: AgentTiming
}

export async function callAgent<T>(opts: {
  label: string
  systemPrompt: string
  userMessage: string
  tier: ModelTier
  maxTokens?: number
}): Promise<AgentResult<T>> {
  const { label, systemPrompt, userMessage, tier, maxTokens = 4096 } = opts
  const model = getModel(tier)
  const start = Date.now()

  const response = await getClient().chat.completions.create({
    model,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  })

  const durationMs = Date.now() - start
  const promptTokens = response.usage?.prompt_tokens ?? 0
  const completionTokens = response.usage?.completion_tokens ?? 0

  console.log(`[agent:${label}] ${durationMs}ms | model=${model} | tokens=${promptTokens}+${completionTokens}`)

  const text = response.choices[0]?.message?.content
  if (!text) {
    throw new Error('No text response from AI agent')
  }

  // Parse JSON from the response — strip markdown fences if present
  let jsonStr = text.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }

  const timing: AgentTiming = { label, durationMs, model, promptTokens, completionTokens }

  try {
    return { data: JSON.parse(jsonStr) as T, timing }
  } catch (e) {
    throw new Error(`Failed to parse agent JSON response: ${(e as Error).message}\n\nRaw response:\n${text.slice(0, 500)}`)
  }
}
