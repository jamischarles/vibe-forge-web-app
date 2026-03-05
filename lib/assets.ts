// ── Asset Catalog ─────────────────────────────────────────────────────────────
//
// Single source of truth for the curated CC0 sprite library.
// Used by:
//   - lib/ai.ts        → getCatalogSummary() injected into AI system prompts
//   - app/page.tsx     → HERO_SPRITES / ENEMY_SPRITES / BG_ASSETS for Settings picker
//   - public/game.html → URL pattern /assets/characters/{id}.svg (no import needed)
//
// All art is CC0 (public domain) from Kenney.nl — https://kenney.nl/assets

export interface CharacterAsset {
  id: string
  name: string
  role: 'hero' | 'enemy'
  tags: string[]
  url: string   // served from /public/assets/characters/{id}.svg or .png
}

export interface BackgroundAsset {
  id: string
  name: string
  tags: string[]
  url: string           // served from /public/assets/backgrounds/{id}.svg
  fallbackColor: string // hex — used by Settings picker if image not yet loaded
}

// ── Hero character sprites ────────────────────────────────────────────────────

export const HERO_SPRITES: CharacterAsset[] = [
  {
    id: 'hero-knight',
    name: 'Knight',
    role: 'hero',
    tags: ['fantasy', 'warrior', 'brave', 'medieval'],
    url: '/assets/characters/hero-knight.svg',
  },
  {
    id: 'hero-robot',
    name: 'Robot',
    role: 'hero',
    tags: ['sci-fi', 'machine', 'tech', 'future'],
    url: '/assets/characters/hero-robot.svg',
  },
  {
    id: 'hero-cat',
    name: 'Cat',
    role: 'hero',
    tags: ['animal', 'cute', 'friendly', 'pet'],
    url: '/assets/characters/hero-cat.svg',
  },
  {
    id: 'hero-wizard',
    name: 'Wizard',
    role: 'hero',
    tags: ['fantasy', 'magic', 'spell', 'mage'],
    url: '/assets/characters/hero-wizard.svg',
  },
  {
    id: 'hero-astronaut',
    name: 'Astronaut',
    role: 'hero',
    tags: ['space', 'sci-fi', 'explorer', 'galaxy'],
    url: '/assets/characters/hero-astronaut.svg',
  },
  // ── Kenney top-down shooter characters (CC0, PNG, overhead view) ─────────────
  {
    id: 'hero-blue',
    name: 'Blue Guy',
    role: 'hero',
    tags: ['human', 'casual', 'modern', 'shooter', 'topdown'],
    url: '/assets/characters/hero-blue.png',
  },
  {
    id: 'hero-soldier',
    name: 'Soldier',
    role: 'hero',
    tags: ['military', 'warrior', 'tactical', 'shooter', 'topdown'],
    url: '/assets/characters/hero-soldier.png',
  },
  {
    id: 'hero-survivor',
    name: 'Survivor',
    role: 'hero',
    tags: ['human', 'casual', 'survivor', 'shooter', 'topdown'],
    url: '/assets/characters/hero-survivor.png',
  },
  {
    id: 'hero-woman',
    name: 'Green Woman',
    role: 'hero',
    tags: ['human', 'female', 'casual', 'shooter', 'topdown'],
    url: '/assets/characters/hero-woman.png',
  },
  {
    id: 'hero-trooper',
    name: 'Trooper',
    role: 'hero',
    tags: ['sci-fi', 'robot', 'machine', 'tech', 'shooter', 'topdown'],
    url: '/assets/characters/hero-trooper.png',
  },
]

// ── Enemy character sprites ───────────────────────────────────────────────────

export const ENEMY_SPRITES: CharacterAsset[] = [
  {
    id: 'enemy-dragon',
    name: 'Dragon',
    role: 'enemy',
    tags: ['fantasy', 'fire', 'scary', 'villain'],
    url: '/assets/characters/enemy-dragon.svg',
  },
  {
    id: 'enemy-ghost',
    name: 'Ghost',
    role: 'enemy',
    tags: ['spooky', 'halloween', 'horror', 'undead'],
    url: '/assets/characters/enemy-ghost.svg',
  },
  {
    id: 'enemy-bat',
    name: 'Bat',
    role: 'enemy',
    tags: ['dark', 'cave', 'night', 'flying'],
    url: '/assets/characters/enemy-bat.svg',
  },
  {
    id: 'enemy-alien',
    name: 'Alien',
    role: 'enemy',
    tags: ['space', 'sci-fi', 'ufo', 'strange'],
    url: '/assets/characters/enemy-alien.svg',
  },
  {
    id: 'enemy-slime',
    name: 'Slime',
    role: 'enemy',
    tags: ['gooey', 'blob', 'weird', 'bouncy'],
    url: '/assets/characters/enemy-slime.svg',
  },
  // ── Kenney top-down shooter enemies (CC0, PNG, overhead view) ────────────────
  {
    id: 'enemy-zombie',
    name: 'Zombie',
    role: 'enemy',
    tags: ['horror', 'undead', 'monster', 'scary', 'shooter', 'topdown'],
    url: '/assets/characters/enemy-zombie.png',
  },
  {
    id: 'enemy-hitman',
    name: 'Hitman',
    role: 'enemy',
    tags: ['human', 'villain', 'dark', 'shooter', 'topdown'],
    url: '/assets/characters/enemy-hitman.png',
  },
  {
    id: 'enemy-elder',
    name: 'Elder',
    role: 'enemy',
    tags: ['human', 'elder', 'civilian', 'shooter', 'topdown'],
    url: '/assets/characters/enemy-elder.png',
  },
  {
    id: 'enemy-guard',
    name: 'Guard',
    role: 'enemy',
    tags: ['human', 'soldier', 'military', 'guard', 'shooter', 'topdown'],
    url: '/assets/characters/enemy-guard.png',
  },
]

// ── Background tiles ──────────────────────────────────────────────────────────

export const BG_ASSETS: BackgroundAsset[] = [
  // ── Side-scrolling (runner-optimized) ───────────────────────────────────────
  {
    id: 'bg-sky',
    name: 'Blue Sky',
    tags: ['outdoor', 'day', 'friendly', 'runner'],
    url: '/assets/backgrounds/bg-sky.svg',
    fallbackColor: '#87CEEB',
  },
  {
    id: 'bg-forest',
    name: 'Forest',
    tags: ['nature', 'green', 'trees', 'outdoor', 'runner'],
    url: '/assets/backgrounds/bg-forest.svg',
    fallbackColor: '#2d5a1b',
  },
  {
    id: 'bg-desert',
    name: 'Desert (Side)',
    tags: ['arid', 'sand', 'hot', 'runner'],
    url: '/assets/backgrounds/bg-desert.svg',
    fallbackColor: '#c4a25a',
  },
  // ── Top-down / Shooter floor tiles ──────────────────────────────────────────
  {
    id: 'bg-concrete',
    name: 'Concrete Floor',
    tags: ['indoor', 'industrial', 'urban', 'topdown', 'shooter'],
    url: '/assets/backgrounds/bg-concrete.svg',
    fallbackColor: '#787878',
  },
  {
    id: 'bg-grass-td',
    name: 'Grass Field',
    tags: ['outdoor', 'nature', 'green', 'topdown', 'shooter'],
    url: '/assets/backgrounds/bg-grass-td.svg',
    fallbackColor: '#4a7a3a',
  },
  {
    id: 'bg-dungeon',
    name: 'Stone Floor',
    tags: ['dark', 'fantasy', 'underground', 'cave', 'topdown', 'shooter'],
    url: '/assets/backgrounds/bg-dungeon.svg',
    fallbackColor: '#2a1f2a',
  },
  {
    id: 'bg-wood-floor',
    name: 'Wood Floor',
    tags: ['indoor', 'warm', 'cozy', 'topdown', 'shooter'],
    url: '/assets/backgrounds/bg-wood-floor.svg',
    fallbackColor: '#8b6327',
  },
  {
    id: 'bg-metal',
    name: 'Metal Floor',
    tags: ['sci-fi', 'industrial', 'space', 'topdown', 'shooter'],
    url: '/assets/backgrounds/bg-metal.svg',
    fallbackColor: '#3a4a5a',
  },
  {
    id: 'bg-sand-td',
    name: 'Sandy Ground',
    tags: ['outdoor', 'arid', 'desert', 'sandy', 'topdown', 'shooter'],
    url: '/assets/backgrounds/bg-sand-td.svg',
    fallbackColor: '#c4a255',
  },
  // ── Kenney top-down floor tiles (CC0, PNG, 64×64 tileable) ──────────────────
  {
    id: 'bg-kenney-grass',
    name: 'Grass (Kenney)',
    tags: ['outdoor', 'nature', 'green', 'topdown', 'shooter'],
    url: '/assets/backgrounds/bg-kenney-grass.png',
    fallbackColor: '#5a8a3a',
  },
  {
    id: 'bg-kenney-light',
    name: 'Light Floor (Kenney)',
    tags: ['indoor', 'clean', 'bright', 'topdown', 'shooter'],
    url: '/assets/backgrounds/bg-kenney-light.png',
    fallbackColor: '#f0ede8',
  },
  {
    id: 'bg-kenney-dark',
    name: 'Dark Floor (Kenney)',
    tags: ['indoor', 'dark', 'industrial', 'topdown', 'shooter'],
    url: '/assets/backgrounds/bg-kenney-dark.png',
    fallbackColor: '#4a4a4a',
  },
  {
    id: 'bg-kenney-teal',
    name: 'Teal Floor (Kenney)',
    tags: ['indoor', 'sci-fi', 'clean', 'cool', 'topdown', 'shooter'],
    url: '/assets/backgrounds/bg-kenney-teal.png',
    fallbackColor: '#7ab8b8',
  },
  {
    id: 'bg-kenney-sand',
    name: 'Sandy Floor (Kenney)',
    tags: ['outdoor', 'warm', 'desert', 'sandy', 'topdown', 'shooter'],
    url: '/assets/backgrounds/bg-kenney-sand.png',
    fallbackColor: '#c4a255',
  },
  // ── Universal (works for any template) ──────────────────────────────────────
  {
    id: 'bg-space',
    name: 'Starfield',
    tags: ['space', 'night', 'sci-fi', 'dark', 'runner', 'topdown', 'shooter'],
    url: '/assets/backgrounds/bg-space.svg',
    fallbackColor: '#0a0a2e',
  },
]

// ── Lookup helpers ────────────────────────────────────────────────────────────

export const ALL_CHARACTER_IDS = new Set(
  [...HERO_SPRITES, ...ENEMY_SPRITES].map(c => c.id)
)
export const ALL_BG_IDS = new Set(BG_ASSETS.map(b => b.id))

export function getCharacterById(id: string): CharacterAsset | null {
  return [...HERO_SPRITES, ...ENEMY_SPRITES].find(c => c.id === id) ?? null
}

export function getBackgroundById(id: string): BackgroundAsset | null {
  return BG_ASSETS.find(b => b.id === id) ?? null
}

// ── AI prompt injection ───────────────────────────────────────────────────────

/**
 * Returns a compact multi-line string summarising available sprites.
 * Prepended to CREATE_SYSTEM_PROMPT and UPDATE_SYSTEM_PROMPT in lib/ai.ts.
 */
export function getCatalogSummary(): string {
  const fmt = (arr: CharacterAsset[] | BackgroundAsset[]) =>
    arr.map(a => `${a.id} (${a.tags.slice(0, 3).join('/')})`).join(', ')

  return [
    'AVAILABLE SPRITES (optional — add to config JSON when a good thematic match exists):',
    `Hero sprites   → heroSpriteId:   ${fmt(HERO_SPRITES)}`,
    `Enemy sprites  → enemySpriteId:  ${fmt(ENEMY_SPRITES)}`,
    `Backgrounds    → bgId:           ${fmt(BG_ASSETS)}`,
    'Rules: always keep heroEmoji + enemyEmoji as emoji fallbacks.',
    'Omit sprite fields entirely if no good catalog match — emoji-only is fine.',
  ].join('\n')
}
