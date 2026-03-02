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

const CREATE_SYSTEM_PROMPT = `You are a fun game design helper for kids. A kid will describe a game idea and you will turn it into a game config.

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

const UPDATE_SYSTEM_PROMPT = `You are a fun game design helper for kids. A kid has an existing game and wants to change something about it.

You will receive:
1. The current game config (JSON)
2. What the kid wants to change

Your job: return the UPDATED config. ONLY change the fields the kid mentioned. Keep everything else EXACTLY the same.

Rules:
- If they say "make it faster" → increase speed (max 380), keep everything else
- If they say "change the hero to a cat" → update heroEmoji only
- If they say "make the background purple" → update backgroundColor only
- If they say "make it harder" → increase speed by ~50, keep everything else
- If they say "make it easier" or "slower" → decrease speed by ~50, keep everything else
- groundColor: always keep as "#5a8a5a"
- jumpForce: always keep as 580
- speed: always keep between 180 and 380

Respond with ONLY valid JSON of the complete updated config, no explanation, no markdown.`

const DEFAULT_CONFIG: GameConfig = {
  heroEmoji: '🐶',
  enemyEmoji: '🐱',
  backgroundColor: '#87CEEB',
  groundColor: '#5a8a5a',
  title: 'Dog Jump!',
  speed: 250,
  jumpForce: 580,
}

export async function generateGameConfig(
  userPrompt: string,
  currentConfig?: GameConfig
): Promise<GameConfig> {
  const isUpdate = !!currentConfig

  try {
    const userMessage = isUpdate
      ? `Current game config:\n${JSON.stringify(currentConfig, null, 2)}\n\nWhat the kid wants to change: "${userPrompt}"`
      : userPrompt

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: isUpdate ? UPDATE_SYSTEM_PROMPT : CREATE_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) return isUpdate ? currentConfig : DEFAULT_CONFIG

    const config = JSON.parse(content) as GameConfig

    // Clamp speed to safe range
    config.speed = Math.max(180, Math.min(380, config.speed || 250))
    config.jumpForce = 580 // always fixed
    config.groundColor = '#5a8a5a' // always fixed

    // In update mode, fill any missing fields from the current config as safety net
    if (isUpdate) {
      config.heroEmoji = config.heroEmoji || currentConfig.heroEmoji
      config.enemyEmoji = config.enemyEmoji || currentConfig.enemyEmoji
      config.backgroundColor = config.backgroundColor || currentConfig.backgroundColor
      config.title = config.title || currentConfig.title
    }

    return config
  } catch (error) {
    console.error('Error generating game config:', error)
    // In update mode, fall back to current config so the game doesn't reset
    return isUpdate ? currentConfig : DEFAULT_CONFIG
  }
}
