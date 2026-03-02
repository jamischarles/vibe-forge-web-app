import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface GameConfig {
  heroEmoji: string
  enemyEmoji: string
  backgroundColor: string
  groundColor: string
  title: string
  speed: number
  jumpForce: number
}

const SYSTEM_PROMPT = `You are a fun game design helper for kids. A kid will describe a game idea and you will turn it into a game config.

Your job: pick the best emojis and colors that match their description.

Rules:
- heroEmoji: one emoji that represents the player character
- enemyEmoji: one emoji that represents the obstacle/enemy to dodge
- backgroundColor: a hex color for the sky/background (make it match the theme)
- groundColor: always "#5a8a5a" (green ground)
- title: a fun short game title (max 20 chars)
- speed: a number between 200 and 350 (how fast enemies move)
- jumpForce: always 580

Examples:
- "dog jumping over cats" → heroEmoji: "🐶", enemyEmoji: "🐱", backgroundColor: "#87CEEB", title: "Dog Jump!"
- "rocket dodging asteroids" → heroEmoji: "🚀", enemyEmoji: "☄️", backgroundColor: "#0a0a2e", title: "Rocket Run!"
- "bunny hopping over carrots" → heroEmoji: "🐰", enemyEmoji: "🥕", backgroundColor: "#90EE90", title: "Bunny Hop!"
- "ninja avoiding shurikens" → heroEmoji: "🥷", enemyEmoji: "⭐", backgroundColor: "#1a1a1a", title: "Ninja Run!"

Respond with ONLY valid JSON, no explanation, no markdown:
{
  "heroEmoji": "🐶",
  "enemyEmoji": "🐱",
  "backgroundColor": "#87CEEB",
  "groundColor": "#5a8a5a",
  "title": "Dog Jump!",
  "speed": 250,
  "jumpForce": 580
}`

const DEFAULT_CONFIG: GameConfig = {
  heroEmoji: '🐶',
  enemyEmoji: '🐱',
  backgroundColor: '#87CEEB',
  groundColor: '#5a8a5a',
  title: 'Dog Jump!',
  speed: 250,
  jumpForce: 580,
}

export async function generateGameConfig(userPrompt: string): Promise<GameConfig> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) return DEFAULT_CONFIG

    const config = JSON.parse(content) as GameConfig

    // Clamp speed to safe range
    config.speed = Math.max(180, Math.min(380, config.speed || 250))
    config.jumpForce = 580 // always fixed
    config.groundColor = config.groundColor || '#5a8a5a'

    return config
  } catch (error) {
    console.error('Error generating game config:', error)
    return DEFAULT_CONFIG
  }
}
