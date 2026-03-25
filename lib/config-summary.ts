import { GameConfig } from './types'

// Fields to skip in diffs/summaries (runtime-resolved, not user-meaningful)
const SKIP_FIELDS = new Set([
  'heroSpriteUrl', 'enemySpriteUrl', 'bgUrl',
])

// Friendly labels for top-level GameConfig keys
const LABELS: Record<string, string> = {
  template: 'Template',
  heroEmoji: 'Hero',
  heroSpriteId: 'Hero sprite',
  enemyEmoji: 'Enemy',
  enemySpriteId: 'Enemy sprite',
  bgId: 'Background',
  backgroundColor: 'Background color',
  groundColor: 'Ground color',
  title: 'Title',
  speed: 'Speed',
  jumpForce: 'Jump force',
}

function formatValue(val: unknown): string {
  if (val === undefined || val === null) return 'none'
  if (typeof val === 'string') return val
  if (typeof val === 'number') return String(val)
  if (typeof val === 'boolean') return val ? 'yes' : 'no'
  if (Array.isArray(val)) return val.map(formatValue).join(', ')
  return JSON.stringify(val)
}

function friendlyKey(key: string): string {
  return LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
}

function summarizeActions(actions: GameConfig['actions']): string[] {
  if (!actions || actions.length === 0) return []
  return [`Actions: ${actions.map(a => `${a.emoji} ${a.name}`).join(', ')}`]
}

function summarizeSubObject(label: string, obj: Record<string, unknown> | undefined): string[] {
  if (!obj) return []
  const lines: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      lines.push(`${label} ${friendlyKey(k)}: ${formatValue(v)}`)
    }
  }
  return lines
}

/** Summarize key settings of a newly created game config */
export function summarizeNewConfig(config: GameConfig): string[] {
  const lines: string[] = []
  lines.push(`Template: ${config.template}`)
  lines.push(`Hero: ${config.heroEmoji}  Enemy: ${config.enemyEmoji}`)
  lines.push(`Speed: ${config.speed}  Jump force: ${config.jumpForce}`)
  lines.push(`Background: ${config.backgroundColor}  Ground: ${config.groundColor}`)
  if (config.heroSpriteId) lines.push(`Hero sprite: ${config.heroSpriteId}`)
  if (config.enemySpriteId) lines.push(`Enemy sprite: ${config.enemySpriteId}`)
  if (config.bgId) lines.push(`Background tile: ${config.bgId}`)
  lines.push(...summarizeActions(config.actions))
  if (config.difficulty) lines.push(...summarizeSubObject('Difficulty', config.difficulty as Record<string, unknown>))
  if (config.shooter) lines.push(...summarizeSubObject('Shooter', config.shooter as Record<string, unknown>))
  if (config.platformer) lines.push(...summarizeSubObject('Platformer', config.platformer as Record<string, unknown>))
  return lines
}

/** Compare two configs and return human-readable change descriptions */
export function diffConfigs(oldConfig: GameConfig, newConfig: GameConfig): string[] {
  const changes: string[] = []

  // Top-level simple fields
  for (const key of Object.keys(newConfig) as (keyof GameConfig)[]) {
    if (SKIP_FIELDS.has(key)) continue
    if (key === 'actions' || key === 'difficulty' || key === 'shooter' || key === 'platformer') continue

    const oldVal = oldConfig[key]
    const newVal = newConfig[key]
    if (formatValue(oldVal) !== formatValue(newVal)) {
      changes.push(`${friendlyKey(key)}: ${formatValue(oldVal)} \u2192 ${formatValue(newVal)}`)
    }
  }

  // Actions diff
  const oldActions = oldConfig.actions || []
  const newActions = newConfig.actions || []
  const oldTypes = new Set(oldActions.map(a => a.type))
  const newTypes = new Set(newActions.map(a => a.type))
  for (const a of newActions) {
    if (!oldTypes.has(a.type)) changes.push(`Added action: ${a.emoji} ${a.name}`)
  }
  for (const a of oldActions) {
    if (!newTypes.has(a.type)) changes.push(`Removed action: ${a.emoji} ${a.name}`)
  }

  // Nested object diffs
  for (const section of ['difficulty', 'shooter', 'platformer'] as const) {
    const oldObj = (oldConfig[section] || {}) as Record<string, unknown>
    const newObj = (newConfig[section] || {}) as Record<string, unknown>
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])
    for (const k of allKeys) {
      const ov = oldObj[k]
      const nv = newObj[k]
      if (formatValue(ov) !== formatValue(nv)) {
        const label = section.charAt(0).toUpperCase() + section.slice(1)
        changes.push(`${label} ${friendlyKey(k)}: ${formatValue(ov)} \u2192 ${formatValue(nv)}`)
      }
    }
  }

  return changes
}
