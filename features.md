# Kids Game Builder — Feature Registry

_Current version: **v1.0.3** | Production: https://kids-game-builder.vercel.app_

> **Note (M11-prereq):** References to `public/game.html` in older milestone rows are historical —
> all Phaser scene code has been migrated to `src/game/*.ts` (compiled to `public/scenes/`).
> See `docs/architecture.md` → Build Pipeline for the full source map.

## Legend
✅ Implemented &nbsp; 🚧 In Progress &nbsp; ⏳ Planned &nbsp; ❌ Dropped

---

## M1 — Core Prompt → Playable Game (v0.1.0–0.1.1)

| Status | Feature | Key Files |
|--------|---------|-----------|
| ✅ | Text prompt → Phaser 3 endless runner | `app/page.tsx`, `public/game.html`, `lib/ai.ts` |
| ✅ | Voice input (Web Speech API, Chrome only) | `app/page.tsx` |
| ✅ | Chat bubble history (user + AI messages) | `app/page.tsx` |
| ✅ | OpenAI GPT-4o-mini config generation with `json_object` format | `lib/ai.ts` (CREATE_SYSTEM_PROMPT) |
| ✅ | Game Over panel with score + restart | `public/game.html` (RunnerScene.triggerGameOver) |
| ✅ | `LOAD_CONFIG` postMessage hot-swap (parent → iframe) | `public/game.html`, `app/page.tsx` |
| ✅ | Sandboxed game iframe | `app/page.tsx` (`sandbox="allow-scripts allow-same-origin"`) |
| ✅ | First stable Vercel deploy (CVE-2025-66478 patch, Next.js 15.3.9) | — |

---

## M2 — Game Iteration Loop (v0.2.0–0.2.2)

| Status | Feature | Key Files |
|--------|---------|-----------|
| ✅ | Conversational game updates (change hero, speed, etc. without restarting) | `lib/ai.ts` (UPDATE_SYSTEM_PROMPT), `app/page.tsx` |
| ✅ | `currentConfig` passed to API for delta-only updates | `lib/ai.ts` (generateGameConfig), `app/api/generate-game/route.ts` |
| ✅ | Hint chips — "Make it faster", "Make it harder", "Change the hero" | `app/page.tsx` (hintChips) |
| ✅ | Adaptive UI: header subtitle, placeholder, button label change after first game | `app/page.tsx` |
| ✅ | Settings panel — read-only view of current GameConfig | `app/page.tsx` (SettingsPanel) |
| ✅ | Live editable settings: title, hero/enemy emoji, speed slider, color pickers | `app/page.tsx` (SettingsRow, EmojiInput, ColorInput) |
| ✅ | Instant config push from settings — no AI round-trip needed | `app/page.tsx` (handleConfigChange → sendConfigToGame) |
| ✅ | `lib/types.ts` — shared `GameConfig`, `SPEED_MIN`, `SPEED_MAX` (fixes client bundle crash) | `lib/types.ts` |

---

## M3 — Game Clone Generation (v0.3.0)

| Status | Feature | Key Files |
|--------|---------|-----------|
| ✅ | "Build a Clone" mode — AI writes complete custom Phaser 3 game from scratch | `app/page.tsx`, `lib/ai.ts` (generateGameCode) |
| ✅ | GPT-4o (full model) used for code generation; mini for config | `lib/ai.ts` |
| ✅ | Clone keyword detection fallback (flappy, pong, snake, asteroids, etc.) | `lib/ai.ts` |
| ✅ | `LOAD_CODE` postMessage handler — runs generated JS via `new Function(code)()` | `public/game.html` |
| ✅ | Orange accent UI for clone mode (toggle, button, badge, textarea border) | `app/page.tsx` |
| ✅ | Code game iteration — `codeAccumPrompt` accumulates full change history | `app/page.tsx` |
| ✅ | Settings panel shows "custom-coded game — use chat to modify" in clone mode | `app/page.tsx` (SettingsPanel, gameMode==='code') |
| ✅ | `GameResult` discriminated union (`type: 'config'` vs `type: 'code'`) | `lib/types.ts` |

---

## M4 — Second Game Template + Output Target (v0.4.0)

| Status | Feature | Key Files |
|--------|---------|-----------|
| ✅ | Top-Down Avoid template — 4-direction hero, swarming enemies, time-survived score | `public/game.html` (startTopDownGame, TopDownScene) |
| ✅ | `template: 'runner' | 'topdown'` field in GameConfig | `lib/types.ts` |
| ✅ | AI picks template from description; validated post-parse | `lib/ai.ts` |
| ✅ | Live Template toggle in Settings (switches game immediately, no AI call) | `app/page.tsx` (TemplateToggle) |
| ✅ | Adaptive Settings labels ("Enemy Speed" vs "Move Speed", Ground color hidden on topdown) | `app/page.tsx` |
| ✅ | Touch controls: hold/drag pointer → hero moves toward held point (topdown) | `public/game.html` (TopDownScene) |
| ✅ | Mobile (iPad) toggle in Output Target — appends touch-first constraints to AI prompts | `app/page.tsx`, `lib/ai.ts` |
| ✅ | Preferred template remembered between sessions | `app/page.tsx` (preferredTemplate state) |

---

## M5 — Assets Library + Procedural Sounds (v0.5.0)

| Status | Feature | Key Files |
|--------|---------|-----------|
| ✅ | SVG sprite library — 5 hero + 5 enemy characters (Knight, Robot, Cat, Wizard, Astronaut / Dragon, Ghost, Bat, Alien, Slime) | `public/assets/characters/*.svg` |
| ✅ | 5 tileable SVG background scenes (Blue Sky, Starfield, Dungeon, Forest, Desert) | `public/assets/backgrounds/*.svg` |
| ✅ | `lib/assets.ts` — single source of truth for asset catalog (id/name/tags/url) | `lib/assets.ts` |
| ✅ | AI sprite selection — catalog summary in both system prompts; IDs validated post-parse | `lib/ai.ts` |
| ✅ | Phaser `preload()` in both templates; `textures.exists()` fallback to emoji | `public/game.html` (preload in RunnerScene + TopDownScene) |
| ✅ | Background tile: scrolling parallax (runner) or tiled arena floor (topdown) | `public/game.html` |
| ✅ | `SpritePicker` component — 48×48 thumbnail grid + "Auto" chip | `app/page.tsx` (SpritePicker) |
| ✅ | `BgPicker` component — 56×40 background tiles with fallback color fill | `app/page.tsx` (BgPicker) |
| ✅ | Procedural Web Audio sounds — jump, land, gameOver, score ding | `public/game.html` (createSounds) |

---

## M6 — Actions System + Chat Targeting (v0.6.0)

| Status | Feature | Key Files |
|--------|---------|-----------|
| ✅ | `collectible` action — bonus-point pickups that scroll in runner, sit stationary in topdown | `public/game.html` (ActionSystem.spawnCollectible, tick) |
| ✅ | `lives` action — multi-life HUD with ❤️ hearts; invincibility flash between hits | `public/game.html` (ActionSystem.buildLivesHUD, handleCollision) |
| ✅ | `shield` action — periodic 🛡️ power-up spawns; absorbs one hit with blue bubble visual | `public/game.html` (ActionSystem.spawnShield) |
| ✅ | `double-points` action — timed ⚡ 2× score burst with on-screen banner | `public/game.html` (ActionSystem.tick) |
| ✅ | `enemy-explode` action — enemies tween-scale and fade on collision | `public/game.html` (ActionSystem.handleCollision) |
| ✅ | `speed-ramp` action — auto-accelerates game every 10 seconds | `public/game.html` (ActionSystem.tick) |
| ✅ | `ActionSystem` module — shared init/tick/handleCollision/destroy for both templates | `public/game.html` (ActionSystem object) |
| ✅ | AI action schema + examples in both CREATE and UPDATE prompts | `lib/ai.ts` |
| ✅ | Chat Targeting (🎯) — click any settings row or action card to pre-fill chat | `app/page.tsx` (handleTarget, textareaRef) |
| ✅ | `ActionCard` component — emoji, name, description, 🎯 button | `app/page.tsx` (ActionCard) |
| ✅ | ⚡ Actions section in Settings — action cards or "No actions yet" empty-state | `app/page.tsx` (SettingsPanel) |
| ✅ | `GameAction` interface + `ActionType` union | `lib/types.ts` |

---

## M6.1 — Mobile Web Support (v0.6.1)

| Status | Feature | Key Files |
|--------|---------|-----------|
| ✅ | Viewport meta: `device-width, maximumScale=1, viewportFit=cover` | `app/layout.tsx` (Viewport export) |
| ✅ | `Chat \| Game \| Settings` bottom nav bar (mobile < lg, fixed, z-50) | `app/page.tsx` (mobile nav) |
| ✅ | Absolute-position overlay layout: game (z-0) always rendered, left panel (z-10) overlays | `app/page.tsx` |
| ✅ | `h-[100dvh]` root height for correct mobile browser height | `app/page.tsx` |
| ✅ | Safe-area CSS utilities: `.pb-safe`, `.h-nav`, `.mb-nav` for iPhone notch | `app/globals.css` |
| ✅ | Touch optimizations: `touch-action: manipulation`, no tap flash, no overscroll bounce | `app/globals.css` |
| ✅ | Version badge in header for cross-device verification | `app/page.tsx` |

---

## M6.2 — Bidirectional postMessage / Game Ready Signal (v0.6.2)

| Status | Feature | Key Files |
|--------|---------|-----------|
| ✅ | `GAME_READY` emitted by RunnerScene + TopDownScene at end of `create()` | `public/game.html` |
| ✅ | `GAME_ERROR` emitted on `startGame()` exception (LOAD_CONFIG) and caught code errors (LOAD_CODE) | `public/game.html` |
| ✅ | `GAME_READY` emitted after 500ms on successful LOAD_CODE execution | `public/game.html` |
| ✅ | `window.addEventListener('message')` in parent — updates `gameReady` / `gameError` state | `app/page.tsx` |
| ✅ | 3-state badge: ⏳ Loading (gray) → 🎮/🕹️ Playing! (green/orange) → ⚠️ Error (red) | `app/page.tsx` |

---

## M9 — Duck Mechanic + Low Obstacles (v0.9.0)

| Status | Feature | Key Files |
|--------|---------|-----------|
| ✅ | Duck mechanic: DOWN arrow or tap bottom-half → hero squishes to half height | `public/game.html` (startDuck, stopDuck) |
| ✅ | Duck hitbox: 22px tall (vs 44px standing) — verified safe under low obstacles | `public/game.html` (heroBox conditional) |
| ✅ | Can't duck mid-air; can't jump while ducking | `public/game.html` (startDuck guard, doJump guard) |
| ✅ | Split-screen mobile: tap top → jump, tap bottom → duck | `public/game.html` (pointerdown handler) |
| ✅ | Low obstacles: spawn at `GROUND_Y - 50`, require ducking to avoid | `public/game.html` (spawnOneEnemy) |
| ✅ | `difficulty.lowObstacleChance` + `difficulty.lowObstacleEmoji` fields | `lib/types.ts` (GameDifficulty) |
| ✅ | AI CREATE: "duck", "crouch", "obstacle course" → applies `lowObstacleChance: 0.3` | `lib/ai.ts` (CREATE_SYSTEM_PROMPT) |
| ✅ | AI UPDATE: "add duck obstacles" / "remove duck obstacles" rules | `lib/ai.ts` (UPDATE_SYSTEM_PROMPT) |
| ✅ | Style chip "🦆 Add Duck Obstacles" for runner games without low obstacles | `app/page.tsx` (styleChips) |

---

## M8 — Progression Mechanics (v0.8.0)

| Status | Feature | Key Files |
|--------|---------|-----------|
| ✅ | Runner progressive spawn: `max(spawnMin, 2200 − elapsed×spawnDecay)` ± 25% jitter; default ramp to peak at ~2.7 min | `public/game.html` (RunnerScene.update) |
| ✅ | Burst mechanic: 20% chance of quick follow-up enemy 350–600ms after each spawn | `public/game.html` (spawnOneEnemy + delayedCall) |
| ✅ | Speed variance: 15% chance of 1.5× faster enemy per spawn | `public/game.html` (spawnOneEnemy) |
| ✅ | Top-down ramp fixed: was `×80` (20s to peak), now `×12` (2.2 min to peak) | `public/game.html` (TopDownScene.update) |
| ✅ | `GameDifficulty` type + `difficulty?` field in `GameConfig` (spawnDecay, spawnMin, burstChance, fastEnemyChance) | `lib/types.ts` |
| ✅ | AI CREATE: difficulty presets for "easy", "hard", "obstacle course" | `lib/ai.ts` (CREATE_SYSTEM_PROMPT) |
| ✅ | AI UPDATE: rules for "harder/easier/more varied/reset difficulty" + pass-through | `lib/ai.ts` (UPDATE_SYSTEM_PROMPT, generateGameConfig) |
| ✅ | Settings panel Difficulty Picker: 😊 Easy / ⚡ Normal / 💀 Hard one-tap presets | `app/page.tsx` (DifficultyPicker component) |

---

## M7a — Smart Style Vocab + Post-Game Chips (v0.7.0)

| Status | Feature | Key Files |
|--------|---------|-----------|
| ✅ | AI style vocabulary — "obstacle course" → runner + speed-ramp; "collector" → collectible; "top-down" → topdown | `lib/ai.ts` (CREATE_SYSTEM_PROMPT) |
| ✅ | Post-game style chips (auto-submit) — `🎯 Go Top-Down`, `⭐ Add Collectibles`, `🧗 Harder/Faster` (runner); `🏃 Go Runner`, `💀 More Enemies` (topdown) | `app/page.tsx` (styleChips) |
| ✅ | Style chips shown only after `gameReady` (not on first load), with blue visual treatment distinct from gray hint chips | `app/page.tsx` |

---

## M10 — Shooter Template + scenarios.md (v1.0.0)

| Status | Feature | Key Files |
|--------|---------|-----------|
| ✅ | Shooter game template — top-down arena with walls, bidirectional shooting, enemy AI | `public/game.html` (startShooterGame, ShooterScene) |
| ✅ | Procedural wall generation — WALL_COUNT clusters (horizontal bar / vertical bar / L-shape) | `public/game.html` (generateWalls, addWall) |
| ✅ | `resolveWallCollision(cx, cy, r)` — nearest-point AABB push-out for hero + enemies | `public/game.html` (ShooterScene) |
| ✅ | `hasLOS(x1, y1, x2, y2)` — parametric segment–AABB slab test for enemy AI + cover-seeking | `public/game.html` (ShooterScene) |
| ✅ | Projectile system — `spawnBullet()` / `updateBullets()` / `splatEffect()` tween on wall hits | `public/game.html` (ShooterScene) |
| ✅ | 4-state enemy AI: patrol → alert → shoot → cover; `findCoverPoint()` samples wall edges | `public/game.html` (updateEnemy, findCoverPoint) |
| ✅ | Zone system: arena split into 4 quadrants; enemies respawn in same zone after 3 s | `public/game.html` (buildZones, spawnEnemy) |
| ✅ | Baked-in difficulty ramp: fire rate every 30 s, maxEnemies every 60 s | `public/game.html` (updateDifficultyRamp) |
| ✅ | Mobile hold-to-move + quick-tap-to-shoot (180 ms threshold); WASD + Space/click on desktop | `public/game.html` (pointer handlers) |
| ✅ | `ShooterConfig` interface — 7 optional params (wallCount, heroHp, enemyHp, fireRate, enemyFireRate, maxEnemies, projectileSpeed) | `lib/types.ts` |
| ✅ | `createSounds()` extended with `shoot()` + `hit()` Web Audio methods | `public/game.html` (createSounds) |
| ✅ | 3-way TemplateToggle: 🏃 Runner / ⬆️ Top-Down / 🔫 Shooter | `app/page.tsx` (TemplateToggle) |
| ✅ | `ShooterSettingsSection` — Wall Count slider, HP pills, Toughness slider, Fire Speed pills | `app/page.tsx` (ShooterSettingsSection) |
| ✅ | AI CREATE shooter vocabulary: "paintball", "laser tag", "arena shooter", "combat arena", etc. | `lib/ai.ts` (CREATE_SYSTEM_PROMPT) |
| ✅ | AI UPDATE shooter rules: wallCount ±2, fireRate presets, enemyHp ±1, maxEnemies ±1 | `lib/ai.ts` (UPDATE_SYSTEM_PROMPT) |
| ✅ | Shooter field clamping + config preservation in `generateGameConfig` | `lib/ai.ts` |
| ✅ | Shooter style chips: 🧱 More Cover / 🔫 Rapid Fire / 💀 Tougher Enemies / 🏃 Go Runner | `app/page.tsx` (styleChips) |
| ✅ | `scenarios.md` — "Can We Build It?" tracker for all templates + future roadmap | `scenarios.md` |
| ✅ | `template` union extended to `'runner' \| 'topdown' \| 'shooter'` everywhere | `lib/types.ts`, `lib/ai.ts`, `app/page.tsx` |
| ✅ | Difficulty picker hidden for shooter template (ramp is baked in) | `app/page.tsx` |
| ✅ | Ground color guard narrowed from `!isTopDown` → `config.template === 'runner'` | `app/page.tsx` |

---

## M10.1 — Shooter Bug Fixes + UX (v1.0.1)

| Status | Feature | Key Files |
|--------|---------|-----------|
| ✅ | Enemy patrol wall collision — `resolveWallCollision()` now called in all 4 enemy states | `public/game.html` (updateEnemy patrol branch) |
| ✅ | Hero rotation + aim indicator — hero sprite rotates toward mouse; yellow dot at 26px offset | `public/game.html` (heroGunIndicator graphics, setRotation, lastFacingX/Y) |
| ✅ | Rapid fire pill — 100ms option added; AI fire rate clamp lowered from 200ms to 80ms | `app/page.tsx` (fire speed pills), `lib/ai.ts` |
| ✅ | Checkerboard floor — when no bgId, draws 56×56 alternating brightness tiles over bg color | `public/game.html` (ShooterScene create, checkerboard loop) |
| ✅ | Template picker — 2×2 card grid (🏃 Runner / ⬆️ Top-Down / 🔫 Shooter / 🕹️ Clone) shown in empty chat state | `app/page.tsx` (template picker grid) |
| ✅ | Template-specific textarea placeholder text | `app/page.tsx` (getPlaceholder function) |
| ✅ | Clone card in template picker auto-switches `inputMode` to 'clone' | `app/page.tsx` |

---

## M10.2 — Kenney Asset Library (v1.0.2)

| Status | Feature | Key Files |
|--------|---------|-----------|
| ✅ | 5 new top-down SVG floor tiles: Concrete, Grass (aerial), Wood Floor, Metal, Sand | `public/assets/backgrounds/bg-concrete.svg` etc. |
| ✅ | 5 Kenney PNG floor tiles (CC0, 64×64): grass, light, dark, teal, sand | `public/assets/backgrounds/bg-kenney-*.png` |
| ✅ | 9 Kenney PNG character sprites (CC0, top-down): 5 heroes + 4 enemies | `public/assets/characters/hero-*.png`, `enemy-*.png` |
| ✅ | `lib/assets.ts` template tags: runner/topdown/shooter scoping on all existing assets | `lib/assets.ts` |
| ✅ | AI background selection by template — runner = side-scroll only; topdown/shooter = floor tiles only | `lib/ai.ts` (Background selection rule block) |
| ✅ | Shooter always defaults to Kenney human sprites (soldier+hitman) — realistic overhead look | `lib/ai.ts` (ALWAYS assign heroSpriteId rule) |
| ✅ | PNG URL resolution fix — `sendConfigToGame()` injects `heroSpriteUrl`/`enemySpriteUrl`/`bgUrl` before postMessage | `app/page.tsx` (sendConfigToGame), `lib/types.ts` |
| ✅ | All 3 Phaser scenes use resolved URL first, fall back to old `id + .svg` pattern | `public/game.html` (preload in all 3 scenes) |
| ✅ | Kenney char/bg combos added to AI: paintball→soldier+guard, zombie→survivor+zombie, laser tag→trooper+hitman | `lib/ai.ts` |

---

## M10.3 — Combat Depth + Polish (v1.0.3)

| Status | Feature | Key Files |
|--------|---------|-----------|
| ✅ | **Grenade system** — `E` key to throw, arcs over walls (no collision), 1.6s fuse, parabolic arc visual | `public/game.html` (spawnGrenade, updateGrenades, detonateGrenade) |
| ✅ | Frag grenade — 90px explosion blast + ring flash, damages all enemies in radius | `public/game.html` (detonateFrag) |
| ✅ | Smoke grenade — gray cloud (r=80, 8s) blocks `hasLOS()` for both hero and enemies | `public/game.html` (detonateSmoke, hasLOS smoke check) |
| ✅ | Flashbang — white screen flash, enemies within 200px get `blindedUntil` +3s (wander randomly) | `public/game.html` (detonateFlash, updateEnemy blinded branch) |
| ✅ | Slow-motion grenade — `gameDt * 0.25` for 4s, blue overlay tint, hero moves at full speed | `public/game.html` (detonateSlow, slowUntil state in update loop) |
| ✅ | Fog of war — dark overlay + `GeometryMask` visibility circle (default r=180) around hero | `public/game.html` (FOG_OF_WAR setup in create, updateFog) |
| ✅ | Grenade ammo HUD — top-center `💣 ×3` counter; type-specific icon | `public/game.html` (grenadeTxt) |
| ✅ | Grenade style chips — `💣 Add Grenades`, `💨 Smoke Grenades`, `🌑 Fog of War` shown contextually | `app/page.tsx` (styleChips) |
| ✅ | **HUD above fog** — all HUD elements (score, hearts, grenade counter) moved to depth 56 (above fog at 52) | `public/game.html` (setDepth in create + buildHpHUD) |
| ✅ | Grenade speed 200→320 px/s — faster, more responsive throw | `public/game.html` (spawnGrenade spd) |
| ✅ | Frag/flash grenades affect hero — frag self-damage at close range; flashbang disorients hero controls for 1.5s | `public/game.html` (detonateFrag, detonateFlash, heroDisorientedUntil) |
| ✅ | Enemy grenades — enemies in `shoot` state can throw grenades (same type) on 5s cooldown | `public/game.html` (spawnEnemyGrenade, ENEMY_GRENADES) |
| ✅ | **Pickup system** — health packs (❤️) and grenade packs (📦) scattered in arena; float-bob animation, 18s respawn | `public/game.html` (spawnPickup, updatePickups, heroHeal) |
| ✅ | **Weapon pickups** — machinegun/shotgun/sniper floor drops with 20s respawn; pick-up banner; shotgun = 5-pellet spread; sniper = 3× damage | `public/game.html` (spawnWeapon, updateWeaponPickups, tryHeroShoot weapon dispatch) |
| ✅ | **Enemy health bars** — animated HP bar above each enemy (green→yellow→red), hidden at full HP | `public/game.html` (hpBar graphics in spawnEnemy, drawn in updateEnemy) |
| ✅ | **Enemy type variance** — grunt/heavy/scout/sniper archetypes; heavy 2× HP, slower; scout 1 HP, fast, doesn't shoot; sniper low fire rate; visual scale/tint per type | `public/game.html` (ETYPE_STATS, spawnEnemy type dispatch) |
| ✅ | **Wall/cover redesign** — zoned layout: guaranteed center T-shape + 1 quadrant anchor per zone when wallCount≥8; random fill for remainder | `public/game.html` (generateWalls rewrite) |
| ✅ | New style chips — `🔫 Weapon Pickups`, `👥 Mixed Enemies`, `💥 Enemy Grenades` | `app/page.tsx` (styleChips) |
| ✅ | `ShooterConfig` extended — `healthPickups`, `grenadePickups`, `weaponPickups`, `enemyGrenades`, `enemyTypes` | `lib/types.ts` |
| ✅ | AI vocabulary — all new features mapped to natural language prompts | `lib/ai.ts` |

---

## M11-prereq — TypeScript Game Source Split (v1.0.3+)

> **Goal:** Extract 2100-line `public/game.html` monolith into typed TypeScript source files
> so future templates (Platformer, Maze, etc.) can be added without touching the monolith.
> No gameplay logic changes — type annotations only.

| Status | Feature | Key Files |
|--------|---------|-----------|
| ✅ | esbuild build pipeline — TypeScript → `public/scenes/*.js` in 5ms | `package.json` (build:game, dev:game, type-check:game), `tsconfig.game.json` |
| ✅ | `phaser@3.70.0` as devDep — types only, Phaser loaded via CDN at runtime | `package.json`, `src/game/phaser-global.d.ts` |
| ✅ | Ambient global declarations — Phaser, game, currentConfig, ActionSystem, startXxxGame | `src/game/phaser-global.d.ts` |
| ✅ | `src/game/shared.ts` — global state, `createSounds`, `makePhaserConfig`, `startGame` | `src/game/shared.ts` |
| ✅ | `src/game/action-system.ts` — ActionSystem (script file; `var` is a true global) | `src/game/action-system.ts` |
| ✅ | `src/game/scenes/runner.ts` — `startRunnerGame` + `RunnerScene` typed | `src/game/scenes/runner.ts` |
| ✅ | `src/game/scenes/topdown.ts` — `startTopDownGame` + `TopDownScene` typed | `src/game/scenes/topdown.ts` |
| ✅ | `src/game/scenes/shooter.ts` — `startShooterGame` + `ShooterScene` typed (~500 lines) | `src/game/scenes/shooter.ts` |
| ✅ | `public/game.html` gutted to ~55-line HTML shell (loads CDN + 5 scene scripts) | `public/game.html` |
| ✅ | `public/scenes/` gitignored (build artifact); `npm run build` auto-compiles for Vercel | `.gitignore`, `package.json` |
| ✅ | Zero type errors (`npm run type-check:game`); all 3 templates verified working | — |

---

## Planned / Future

| Status | Feature | Notes |
|--------|---------|-------|
| ⏳ | Ricochet bullets, homing projectiles | Shooter building blocks |
| ⏳ | Boss enemy / wave system | M11 candidate |
| ⏳ | Save / share game URL | Serialize GameConfig to URL params or short link |
| ⏳ | More game templates (platformer, racing, tower defense) | M11+ candidates |
| ⏳ | More action types (boss wave, time limit, checkpoint) | M7 candidate |
| ⏳ | User-uploadable sprite images | Needs storage (Vercel Blob or similar) |
| ⏳ | Game title screen / intro animation | Polish pass |
| ⏳ | Leaderboard / high score persistence | Needs backend / KV store |
