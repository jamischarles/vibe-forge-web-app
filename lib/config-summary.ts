import { GameConfig } from './types'

// Fields to skip (runtime-resolved, not meaningful to users)
const SKIP_FIELDS = new Set(['heroSpriteUrl', 'enemySpriteUrl', 'bgUrl', 'groundColor', 'jumpForce'])

// ── New game: describe what was built ────────────────────────────────────────

const TEMPLATE_NAMES: Record<string, string> = {
  runner: 'Side-scrolling runner',
  topdown: 'Top-down arena',
  shooter: 'Top-down shooter',
  platformer: 'Platformer',
}

export function summarizeNewConfig(config: GameConfig): string[] {
  const lines: string[] = []

  lines.push(`${TEMPLATE_NAMES[config.template] || config.template} game`)
  lines.push(`Hero: ${config.heroEmoji}${config.heroSpriteId ? ` (${config.heroSpriteId})` : ''}`)
  lines.push(`Enemy: ${config.enemyEmoji}${config.enemySpriteId ? ` (${config.enemySpriteId})` : ''}`)
  lines.push(`Game speed: ${config.speed}`)
  if (config.bgId) lines.push(`Background: ${config.bgId}`)

  // Actions — describe what gameplay mechanics were added
  if (config.actions?.length) {
    for (const a of config.actions) {
      lines.push(`${a.emoji} ${a.name} — ${a.description}`)
    }
  }

  // Difficulty
  if (config.difficulty) {
    const d = config.difficulty
    if (d.lowObstacleChance && d.lowObstacleChance > 0) {
      lines.push(`Ducking obstacles enabled (${d.lowObstacleEmoji || '🔥'})`)
    }
    if (d.burstChance && d.burstChance >= 0.25) lines.push('Burst spawns for extra challenge')
    if (d.fastEnemyChance && d.fastEnemyChance >= 0.2) lines.push('Fast enemies appear')
  }

  // Shooter specifics
  if (config.shooter) {
    const s = config.shooter
    if (s.fogOfWar) lines.push('Fog of war — limited visibility')
    if (s.grenadeType) lines.push(`${s.grenadeType} grenades enabled`)
    if (s.weaponPickups) lines.push('Weapon pickups on the floor')
    if (s.enemyGrenades) lines.push('Enemies throw grenades')
    if (s.enemyTypes && s.enemyTypes.length > 1) lines.push(`Enemy types: ${s.enemyTypes.join(', ')}`)
    if (s.gameMode === 'ctf') lines.push('Capture the Flag mode')
    if (s.wallStyle && s.wallStyle !== 'box') lines.push(`Wall layout: ${s.wallStyle}`)
    if (s.healthPickups === false) lines.push('No health pickups')
  }

  // Platformer specifics
  if (config.platformer) {
    const p = config.platformer
    if (p.doubleJump) lines.push('Double jump enabled')
    if (p.tieredLayout) lines.push('Tiered platform layout')
    if (p.ladders) lines.push('Climbable ladders')
    if (p.barrels) lines.push(`Rolling barrels (${p.barrelEmoji || '🛢️'})`)
    if (p.villain) lines.push(`Villain at top (${p.villainEmoji || '🦍'})`)
    if (p.goal) lines.push(`Reach-the-top goal (${p.goalEmoji || '👸'})`)
    if (p.hammer) lines.push(`Hammer power-up (${p.hammerEmoji || '🔨'})`)
  }

  return lines
}

// ── Update: describe what changed in business terms ──────────────────────────

export function diffConfigs(oldConfig: GameConfig, newConfig: GameConfig): string[] {
  const changes: string[] = []

  // Template change
  if (oldConfig.template !== newConfig.template) {
    changes.push(`Switched to ${TEMPLATE_NAMES[newConfig.template] || newConfig.template}`)
  }

  // Hero/enemy changes
  if (oldConfig.heroEmoji !== newConfig.heroEmoji || oldConfig.heroSpriteId !== newConfig.heroSpriteId) {
    changes.push(`Changed hero to ${newConfig.heroEmoji}${newConfig.heroSpriteId ? ` (${newConfig.heroSpriteId})` : ''}`)
  }
  if (oldConfig.enemyEmoji !== newConfig.enemyEmoji || oldConfig.enemySpriteId !== newConfig.enemySpriteId) {
    changes.push(`Changed enemy to ${newConfig.enemyEmoji}${newConfig.enemySpriteId ? ` (${newConfig.enemySpriteId})` : ''}`)
  }

  // Title
  if (oldConfig.title !== newConfig.title) {
    changes.push(`Renamed to "${newConfig.title}"`)
  }

  // Speed
  if (oldConfig.speed !== newConfig.speed) {
    const delta = newConfig.speed - oldConfig.speed
    changes.push(delta > 0
      ? `Increased speed (${oldConfig.speed} → ${newConfig.speed})`
      : `Decreased speed (${oldConfig.speed} → ${newConfig.speed})`)
  }

  // Background
  if (oldConfig.backgroundColor !== newConfig.backgroundColor) {
    changes.push(`Changed background color to ${newConfig.backgroundColor}`)
  }
  if (oldConfig.bgId !== newConfig.bgId) {
    if (newConfig.bgId) changes.push(`Changed background to ${newConfig.bgId}`)
    else changes.push('Removed background tile')
  }

  // Actions
  const oldActions = oldConfig.actions || []
  const newActions = newConfig.actions || []
  const oldTypes = new Set(oldActions.map(a => a.type))
  const newTypes = new Set(newActions.map(a => a.type))
  for (const a of newActions) {
    if (!oldTypes.has(a.type)) changes.push(`Added ${a.emoji} ${a.name}`)
  }
  for (const a of oldActions) {
    if (!newTypes.has(a.type)) changes.push(`Removed ${a.emoji} ${a.name}`)
  }

  // Difficulty changes
  diffSubObject(oldConfig.difficulty, newConfig.difficulty, {
    spawnDecay: (o, n) => n > o ? 'Enemies spawn faster over time' : 'Enemies spawn slower over time',
    spawnMin: (o, n) => n < o ? 'Higher max enemy density' : 'Lower max enemy density',
    burstChance: (o, n) => n > o ? 'More burst spawns' : 'Fewer burst spawns',
    fastEnemyChance: (o, n) => n > o ? 'More fast enemies' : 'Fewer fast enemies',
    lowObstacleChance: (o, n) => n > 0 ? 'Ducking obstacles enabled' : 'Ducking obstacles removed',
  }, changes)

  // Shooter changes
  diffSubObject(oldConfig.shooter, newConfig.shooter, {
    wallCount: (o, n) => n > o ? 'Added more walls/cover' : 'Removed some walls',
    heroHp: (o, n) => n > o ? `Increased player health to ${n}` : `Decreased player health to ${n}`,
    enemyHp: (o, n) => n > o ? 'Enemies are tougher' : 'Enemies are easier to kill',
    fireRate: (o, n) => n < o ? 'Faster shooting' : 'Slower shooting',
    enemyFireRate: (o, n) => n > o ? 'Enemies shoot less often' : 'Enemies shoot more often',
    maxEnemies: (o, n) => n > o ? `More enemies (up to ${n})` : `Fewer enemies (up to ${n})`,
    fogOfWar: (_, n) => n ? 'Enabled fog of war' : 'Disabled fog of war',
    fogRadius: (o, n) => n > o ? 'Increased visibility range' : 'Decreased visibility range',
    grenadeType: (o, n) => n ? `Switched to ${n} grenades` : 'Removed grenades',
    grenadeCount: (o, n) => n === 0 ? 'Unlimited grenades' : `Grenade ammo set to ${n}`,
    weaponPickups: (_, n) => n ? 'Added weapon pickups' : 'Removed weapon pickups',
    healthPickups: (_, n) => n ? 'Added health pickups' : 'Removed health pickups',
    enemyGrenades: (_, n) => n ? 'Enemies now throw grenades' : 'Enemies no longer throw grenades',
    enemyTypes: (_, n) => `Enemy types: ${(n as string[]).join(', ')}`,
    gameMode: (_, n) => n === 'ctf' ? 'Switched to Capture the Flag' : 'Switched to Deathmatch',
    wallStyle: (_, n) => `Wall layout changed to ${n}`,
    arenaScale: (o, n) => n < o ? 'Zoomed out (bigger arena)' : 'Zoomed in (tighter arena)',
    entityScale: (o, n) => n > o ? 'Characters are larger' : 'Characters are smaller',
  }, changes)

  // Platformer changes
  diffSubObject(oldConfig.platformer, newConfig.platformer, {
    doubleJump: (_, n) => n ? 'Enabled double jump' : 'Disabled double jump',
    tieredLayout: (_, n) => n ? 'Switched to tiered layout' : 'Switched to random platforms',
    ladders: (_, n) => n ? 'Added ladders' : 'Removed ladders',
    barrels: (_, n) => n ? 'Added rolling barrels' : 'Removed barrels',
    villain: (_, n) => n ? 'Added villain at top' : 'Removed villain',
    goal: (_, n) => n ? 'Added reach-the-top goal' : 'Removed goal',
    hammer: (_, n) => n ? 'Added hammer power-up' : 'Removed hammer',
    clampEdges: (_, n) => n ? 'Clamped to screen edges' : 'Screen wrap enabled',
  }, changes)

  return changes
}

// Helper: diff two optional sub-objects using business-rule descriptions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function diffSubObject(
  oldObj: any,
  newObj: any,
  descriptions: Record<string, (oldVal: any, newVal: any) => string>,
  changes: string[]
) {
  const o = oldObj || {}
  const n = newObj || {}
  for (const key of Object.keys(descriptions)) {
    const ov = o[key]
    const nv = n[key]
    if (ov !== nv && nv !== undefined) {
      changes.push(descriptions[key](ov, nv))
    }
  }
}
