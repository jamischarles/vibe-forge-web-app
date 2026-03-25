// ══════════════════════════════════════════════════════════════════════════════
//  GAME DESIGN ENGINE — co-dependency rules that make generated games smarter
//
//  Instead of hardcoded defaults, this engine applies design heuristics:
//  "if fog-of-war, you need more walls for cover" or "CTF needs survivability."
//
//  Each rule is transparent: it has a human-readable reason that can be surfaced
//  to the user as a "design plan."
//
//  Zero extra API cost — runs post-generation on the config JSON.
// ══════════════════════════════════════════════════════════════════════════════

import type { GameConfig, ShooterConfig, GameDifficulty } from './types'

// ── Design Plan (transparent output) ────────────────────────────────────────

export interface DesignRuleFired {
  id: string
  category: 'balance' | 'synergy' | 'pacing' | 'feel' | 'accessibility'
  reason: string          // human-readable: "Fog of war needs cover — increased walls to 8"
  field: string           // what was changed: "shooter.wallCount"
  before: unknown         // value before rule
  after: unknown          // value after rule
}

export interface DesignPlan {
  rules: DesignRuleFired[]
  summary: string         // 1-sentence overall summary
}

// ── LLM design brief (from pass 1) ─────────────────────────────────────────

export interface DesignBrief {
  style: string                  // e.g. "tactical", "chaotic", "stealth"
  mapIntent: string              // e.g. "dense corridors with flanking routes"
  features: string[]             // e.g. ["fog of war", "frag grenades", "CTF mode"]
  featureReasoning: string[]     // parallel array: why each feature was chosen
  difficultyArc: string          // e.g. "starts moderate, ramps with enemy fire rate"
  keyChoices: string[]           // e.g. ["wallCount:8 — needs cover for flag runs"]
}

// ── Rule definition ─────────────────────────────────────────────────────────

interface DesignRule {
  id: string
  templates: ('runner' | 'topdown' | 'shooter' | 'platformer')[]
  category: 'balance' | 'synergy' | 'pacing' | 'feel' | 'accessibility'
  priority: number        // lower runs first; higher can override
  condition: (config: GameConfig) => boolean
  apply: (config: GameConfig, fired: DesignRuleFired[]) => void
}

// Helper: ensure shooter sub-config exists
function sc(config: GameConfig): ShooterConfig {
  if (!config.shooter) config.shooter = {}
  return config.shooter
}

// Helper: ensure difficulty sub-config exists
function diff(config: GameConfig): GameDifficulty {
  if (!config.difficulty) config.difficulty = {}
  return config.difficulty
}

// Helper: record a change
function record(
  fired: DesignRuleFired[],
  id: string,
  category: DesignRuleFired['category'],
  reason: string,
  field: string,
  before: unknown,
  after: unknown
) {
  fired.push({ id, category, reason, field, before, after })
}

// ══════════════════════════════════════════════════════════════════════════════
//  RULE REGISTRY
// ══════════════════════════════════════════════════════════════════════════════

const RULES: DesignRule[] = [

  // ── SHOOTER: Fog of War needs cover ────────────────────────────────────
  {
    id: 'fog-needs-cover',
    templates: ['shooter'],
    category: 'synergy',
    priority: 10,
    condition: (c) => c.shooter?.fogOfWar === true && (c.shooter?.wallCount ?? 6) < 6,
    apply: (c, fired) => {
      const before = sc(c).wallCount ?? 6
      sc(c).wallCount = Math.max(before, 8)
      record(fired, 'fog-needs-cover', 'synergy',
        'Fog of war needs cover for tactical play — walls increased to ' + sc(c).wallCount,
        'shooter.wallCount', before, sc(c).wallCount)
    },
  },

  // ── SHOOTER: Fog + CTF should not be too tight ─────────────────────────
  {
    id: 'fog-ctf-vision',
    templates: ['shooter'],
    category: 'balance',
    priority: 15,
    condition: (c) => c.shooter?.fogOfWar === true && c.shooter?.gameMode === 'ctf' && (c.shooter?.fogRadius ?? 180) < 150,
    apply: (c, fired) => {
      const before = sc(c).fogRadius ?? 180
      sc(c).fogRadius = 160
      record(fired, 'fog-ctf-vision', 'balance',
        'CTF with fog needs enough visibility to navigate flag routes — radius set to 160',
        'shooter.fogRadius', before, 160)
    },
  },

  // ── SHOOTER: CTF needs survivability ───────────────────────────────────
  {
    id: 'ctf-survivability',
    templates: ['shooter'],
    category: 'balance',
    priority: 10,
    condition: (c) => c.shooter?.gameMode === 'ctf' && (c.shooter?.heroHp ?? 3) < 3,
    apply: (c, fired) => {
      const before = sc(c).heroHp ?? 3
      sc(c).heroHp = 3
      record(fired, 'ctf-survivability', 'balance',
        'CTF flag runs require survivability — hero HP set to 3',
        'shooter.heroHp', before, 3)
    },
  },

  // ── SHOOTER: CTF needs enough enemies ──────────────────────────────────
  {
    id: 'ctf-enemy-count',
    templates: ['shooter'],
    category: 'balance',
    priority: 10,
    condition: (c) => c.shooter?.gameMode === 'ctf' && (c.shooter?.maxEnemies ?? 4) < 4,
    apply: (c, fired) => {
      const before = sc(c).maxEnemies ?? 4
      sc(c).maxEnemies = 4
      record(fired, 'ctf-enemy-count', 'balance',
        'CTF needs enough enemies for both defense and attack roles — minimum 4',
        'shooter.maxEnemies', before, 4)
    },
  },

  // ── SHOOTER: CTF needs cover for flag runs ─────────────────────────────
  {
    id: 'ctf-cover',
    templates: ['shooter'],
    category: 'synergy',
    priority: 10,
    condition: (c) => c.shooter?.gameMode === 'ctf' && (c.shooter?.wallCount ?? 6) < 6,
    apply: (c, fired) => {
      const before = sc(c).wallCount ?? 6
      sc(c).wallCount = Math.max(before, 7)
      record(fired, 'ctf-cover', 'synergy',
        'CTF flag runs need cover to dodge defenders — walls increased to ' + sc(c).wallCount,
        'shooter.wallCount', before, sc(c).wallCount)
    },
  },

  // ── SHOOTER: Grenades are tactical — need walls to matter ──────────────
  {
    id: 'grenades-need-walls',
    templates: ['shooter'],
    category: 'synergy',
    priority: 10,
    condition: (c) => !!c.shooter?.grenadeType && (c.shooter?.wallCount ?? 6) < 4,
    apply: (c, fired) => {
      const before = sc(c).wallCount ?? 6
      sc(c).wallCount = Math.max(before, 5)
      record(fired, 'grenades-need-walls', 'synergy',
        'Grenades are most tactical with walls to arc over — walls set to ' + sc(c).wallCount,
        'shooter.wallCount', before, sc(c).wallCount)
    },
  },

  // ── SHOOTER: Enemy grenades need hero survivability ────────────────────
  {
    id: 'enemy-grenades-hp',
    templates: ['shooter'],
    category: 'balance',
    priority: 15,
    condition: (c) => c.shooter?.enemyGrenades === true && (c.shooter?.heroHp ?? 3) < 3,
    apply: (c, fired) => {
      const before = sc(c).heroHp ?? 3
      sc(c).heroHp = 3
      record(fired, 'enemy-grenades-hp', 'balance',
        'Enemy grenades are punishing — hero HP raised to 3 for fairness',
        'shooter.heroHp', before, 3)
    },
  },

  // ── SHOOTER: Open arena (few walls) → faster bullets ───────────────────
  {
    id: 'open-arena-fast-bullets',
    templates: ['shooter'],
    category: 'feel',
    priority: 20,
    condition: (c) => (c.shooter?.wallCount ?? 6) <= 3 && (c.shooter?.projectileSpeed ?? 450) < 500,
    apply: (c, fired) => {
      const before = sc(c).projectileSpeed ?? 450
      sc(c).projectileSpeed = 520
      record(fired, 'open-arena-fast-bullets', 'feel',
        'Open arena with few walls plays better with faster projectiles — speed set to 520',
        'shooter.projectileSpeed', before, 520)
    },
  },

  // ── SHOOTER: Dense map (many walls) → more enemies to fill space ───────
  {
    id: 'dense-map-more-enemies',
    templates: ['shooter'],
    category: 'pacing',
    priority: 20,
    condition: (c) => (c.shooter?.wallCount ?? 6) >= 10 && (c.shooter?.maxEnemies ?? 4) < 5,
    apply: (c, fired) => {
      const before = sc(c).maxEnemies ?? 4
      sc(c).maxEnemies = Math.max(before, 5)
      record(fired, 'dense-map-more-enemies', 'pacing',
        'Dense maps with ' + (sc(c).wallCount ?? 6) + ' walls feel empty without enough enemies — raised to ' + sc(c).maxEnemies,
        'shooter.maxEnemies', before, sc(c).maxEnemies)
    },
  },

  // ── SHOOTER: Weapon pickups need map space ─────────────────────────────
  {
    id: 'weapons-need-space',
    templates: ['shooter'],
    category: 'synergy',
    priority: 10,
    condition: (c) => c.shooter?.weaponPickups === true && (c.shooter?.wallCount ?? 6) < 5,
    apply: (c, fired) => {
      const before = sc(c).wallCount ?? 6
      sc(c).wallCount = Math.max(before, 5)
      record(fired, 'weapons-need-space', 'synergy',
        'Weapon pickups need map complexity to create risk/reward for pickups — walls set to ' + sc(c).wallCount,
        'shooter.wallCount', before, sc(c).wallCount)
    },
  },

  // ── SHOOTER: Many enemy types → cap maxEnemies to avoid chaos ──────────
  {
    id: 'variety-cap-enemies',
    templates: ['shooter'],
    category: 'balance',
    priority: 25,
    condition: (c) => (c.shooter?.enemyTypes?.length ?? 1) >= 3 && (c.shooter?.maxEnemies ?? 4) > 6,
    apply: (c, fired) => {
      const before = sc(c).maxEnemies ?? 4
      sc(c).maxEnemies = 6
      record(fired, 'variety-cap-enemies', 'balance',
        'Multiple enemy types already add complexity — capped enemies at 6 to prevent chaos',
        'shooter.maxEnemies', before, 6)
    },
  },

  // ── SHOOTER: Scouts are fragile → allow more enemies ───────────────────
  {
    id: 'scouts-allow-more',
    templates: ['shooter'],
    category: 'balance',
    priority: 20,
    condition: (c) => (c.shooter?.enemyTypes ?? []).includes('scout') && (c.shooter?.maxEnemies ?? 4) < 5,
    apply: (c, fired) => {
      const before = sc(c).maxEnemies ?? 4
      sc(c).maxEnemies = Math.max(before, 5)
      record(fired, 'scouts-allow-more', 'balance',
        'Scouts are fragile (1 HP) — bumped enemy count to keep pressure up',
        'shooter.maxEnemies', before, sc(c).maxEnemies)
    },
  },

  // ── SHOOTER: Smoke grenades + fog = stealth mode, tighter fog ──────────
  {
    id: 'smoke-fog-stealth',
    templates: ['shooter'],
    category: 'synergy',
    priority: 25,
    condition: (c) => c.shooter?.grenadeType === 'smoke' && c.shooter?.fogOfWar === true && (c.shooter?.fogRadius ?? 180) > 160,
    apply: (c, fired) => {
      const before = sc(c).fogRadius ?? 180
      sc(c).fogRadius = 150
      record(fired, 'smoke-fog-stealth', 'synergy',
        'Smoke + fog creates a stealth playstyle — tightened fog radius to 150 for more tension',
        'shooter.fogRadius', before, 150)
    },
  },

  // ── RUNNER: Speed ramp should start moderate ───────────────────────────
  {
    id: 'speed-ramp-moderate-start',
    templates: ['runner'],
    category: 'pacing',
    priority: 10,
    condition: (c) => {
      const hasRamp = c.actions?.some(a => a.type === 'speed-ramp')
      return !!hasRamp && c.speed > 320
    },
    apply: (c, fired) => {
      const before = c.speed
      c.speed = 300
      record(fired, 'speed-ramp-moderate-start', 'pacing',
        'Speed ramp action means the game accelerates over time — starting speed lowered to 300 so it builds up',
        'speed', before, 300)
    },
  },

  // ── RUNNER: High speed → spawn gap needed ──────────────────────────────
  {
    id: 'fast-runner-spawn-gap',
    templates: ['runner'],
    category: 'balance',
    priority: 15,
    condition: (c) => c.speed > 400 && (c.difficulty?.spawnMin ?? 1000) < 900,
    apply: (c, fired) => {
      const before = diff(c).spawnMin
      diff(c).spawnMin = 950
      record(fired, 'fast-runner-spawn-gap', 'balance',
        'High speed (' + c.speed + ') needs wider spawn gaps to give reaction time — spawnMin set to 950',
        'difficulty.spawnMin', before, 950)
    },
  },

  // ── RUNNER: Low obstacles + bursts = unfair dodge overlap ──────────────
  {
    id: 'low-obstacles-reduce-burst',
    templates: ['runner'],
    category: 'balance',
    priority: 15,
    condition: (c) => (c.difficulty?.lowObstacleChance ?? 0) > 0.2 && (c.difficulty?.burstChance ?? 0) > 0.25,
    apply: (c, fired) => {
      const before = diff(c).burstChance
      diff(c).burstChance = 0.2
      record(fired, 'low-obstacles-reduce-burst', 'balance',
        'Duck obstacles + burst spawns overlap — players can\'t duck and jump simultaneously, burst chance reduced',
        'difficulty.burstChance', before, 0.2)
    },
  },

  // ── RUNNER: Multiple lives → can afford harder pacing ──────────────────
  {
    id: 'lives-allow-harder-pacing',
    templates: ['runner'],
    category: 'pacing',
    priority: 20,
    condition: (c) => {
      const hasLives = c.actions?.some(a => a.type === 'lives' && (a.params?.count ?? 3) >= 3)
      return !!hasLives && (!c.difficulty || (c.difficulty.spawnDecay ?? 8) < 10)
    },
    apply: (c, fired) => {
      const before = diff(c).spawnDecay ?? 8
      diff(c).spawnDecay = 10
      record(fired, 'lives-allow-harder-pacing', 'pacing',
        'Extra lives provide a safety net — spawn acceleration increased for more excitement',
        'difficulty.spawnDecay', before, 10)
    },
  },

  // ── TOPDOWN: High speed + fast enemies = too hectic ────────────────────
  {
    id: 'topdown-speed-cap',
    templates: ['topdown'],
    category: 'balance',
    priority: 10,
    condition: (c) => c.speed > 350 && (c.difficulty?.fastEnemyChance ?? 0) > 0.2,
    apply: (c, fired) => {
      const before = diff(c).fastEnemyChance
      diff(c).fastEnemyChance = 0.15
      record(fired, 'topdown-speed-cap', 'balance',
        'High arena speed + fast enemies is overwhelming — fast enemy chance reduced to 0.15',
        'difficulty.fastEnemyChance', before, 0.15)
    },
  },

  // ── PLATFORMER: Double jump → can place platforms higher / faster ──────
  {
    id: 'double-jump-faster',
    templates: ['platformer'],
    category: 'feel',
    priority: 10,
    condition: (c) => c.platformer?.doubleJump === true && c.speed < 220,
    apply: (c, fired) => {
      const before = c.speed
      c.speed = 230
      record(fired, 'double-jump-faster', 'feel',
        'Double jump lets the hero cover more air distance — base speed bumped to 230 for better flow',
        'speed', before, 230)
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
//  ENGINE — run rules, produce plan
// ══════════════════════════════════════════════════════════════════════════════

export function applyDesignRules(config: GameConfig): DesignPlan {
  const fired: DesignRuleFired[] = []
  const template = config.template

  // Sort by priority
  const applicable = RULES
    .filter(r => r.templates.includes(template))
    .sort((a, b) => a.priority - b.priority)

  for (const rule of applicable) {
    try {
      if (rule.condition(config)) {
        rule.apply(config, fired)
      }
    } catch {
      // Rule errors should never break game generation
    }
  }

  // Build summary
  let summary: string
  if (fired.length === 0) {
    summary = 'Config looks balanced — no design adjustments needed.'
  } else {
    const categories = [...new Set(fired.map(f => f.category))]
    summary = 'Applied ' + fired.length + ' design rule' + (fired.length > 1 ? 's' : '') +
      ' (' + categories.join(', ') + ') to improve gameplay.'
  }

  return { rules: fired, summary }
}
