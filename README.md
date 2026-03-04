# Kids Game Builder

> AI-powered browser game generator. Describe any game in plain English — play it in seconds.

**Live:** https://kids-game-builder.vercel.app

---

## What It Does

Type (or speak) a game description like *"a bunny hopping over foxes"* or *"a knight fighting dragons"* — the AI generates a playable Phaser 3 game and loads it instantly. Then keep iterating: *"make it harder"*, *"add extra lives"*, *"switch to a top-down game"*.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 + React 18 + TypeScript |
| Styling | Tailwind CSS |
| Game engine | Phaser 3.70.0 (CDN, runs in sandboxed iframe) |
| AI | OpenAI GPT-4o-mini (config games) + GPT-4o (code clones) |
| Hosting | Vercel (auto-deploy from `origin/main`) |

## Docs

| File | Purpose |
|------|---------|
| [features.md](./features.md) | Every feature by milestone — status, key files |
| [bugs.md](./bugs.md) | Known issues tracker (open + fixed) |
| [CHANGELOG.md](./CHANGELOG.md) | Full version history |

## Dev

```bash
pnpm dev        # starts on http://localhost:3000
pnpm build      # production build + type-check
```

Requires: `OPENAI_API_KEY` in `.env.local`.

## Architecture

```
app/
  page.tsx                  # Main UI — chat rail + game panel + mobile nav
  layout.tsx                # Root layout with viewport meta
  globals.css               # Tailwind + safe-area utilities
  api/generate-game/
    route.ts                # POST /api/generate-game → OpenAI → GameConfig or code
lib/
  ai.ts                     # System prompts + generateGameConfig() + generateGameCode()
  types.ts                  # GameConfig, GameAction, ActionType, etc.
  assets.ts                 # SVG asset catalog (heroes, enemies, backgrounds)
public/
  game.html                 # Phaser 3 game (standalone, runs in iframe)
  assets/
    characters/             # SVG hero + enemy sprites
    backgrounds/            # SVG tileable background scenes
```

**Data flow:**
```
User prompt → POST /api/generate-game → OpenAI
  → GameConfig JSON → postMessage(LOAD_CONFIG) → game.html
  → Phaser create() → postMessage(GAME_READY) → UI badge
```

## Git Tags (Milestones)

| Tag | Version | What shipped |
|-----|---------|--------------|
| `v0.6.2-stable` | 0.6.2 | Bidirectional postMessage (GAME_READY/GAME_ERROR) |
| `v0.6.1-m6-mobile-stable` | 0.6.1 | Mobile web support (bottom nav, safe areas) |
| `v0.6.0-m6-stable` | 0.6.0 | Actions system + Chat Targeting |
| `v0.5.0-m5-stable` | 0.5.0 | SVG asset library + procedural sounds |
| `v0.4.0-m4-stable` | 0.4.0 | Top-down template + output target settings |
| `v0.3.0-m3-stable` | 0.3.0 | Game clone generation (GPT-4o code mode) |
| `v0.1.1-m1-stable` | 0.1.1 | First stable deploy |
