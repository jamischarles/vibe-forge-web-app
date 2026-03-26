# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-26

### VibeForge MVP1 — AI-Native UI/UX Design Canvas

Complete rebuild of kids-game-maker into VibeForge, an AI-powered design tool
that guides users from idea → JTBD extraction → breadboard flow → fat marker
layout → hi-fi visual design using Shape Up methodology.

### Added

**Core Architecture:**
- Zustand store (`lib/store.ts`) with phase management, voting state, chat, and history snapshots
- Full TypeScript data model (`lib/vf-types.ts`): Project, Screen, BreadboardData, FatMarkerData, HiFiData, JTBDStatement, Flow, and voting types
- OpenAI GPT-4o-mini integration via `callAgent<T>()` JSON helper (`lib/agents/shared.ts`)
- Unified API route (`app/api/generate-design/route.ts`) dispatching to three AI agents

**AI Agents:**
- Strategy Agent — extracts JTBD statements from product descriptions; generates 4-6 breadboard flow variants with different architectural approaches (linear wizard, hub-and-spoke, progressive disclosure, etc.)
- Layout Agent — generates 2-3 fat marker spatial layouts per screen with color palettes and typography hints
- Visual Agent — generates polished HTML/CSS renders from committed breadboard + fat marker layouts

**Design Canvas:**
- SVG Breadboard Renderer — pure React SVG rendering of node+edge flow diagrams with places, affordances, and connections
- Fat Marker Renderer — colored region blocks with role labels (header, nav, content, sidebar, etc.)
- Hi-Fi Renderer — sandboxed iframe rendering of AI-generated HTML/CSS

**UI Components:**
- Split-pane layout: left panel (JTBD + voting + chat) + right canvas area
- Phase indicator toolbar: Setup → Breadboard → Fat Marker → Hi-Fi → Export
- Voting panel with thumbs up/down/star per variant, multi-round funnel (3 rounds breadboard, 2 fat marker, 1 hi-fi)
- Chat panel with auto-scroll, auto-resize textarea, and phase-contextual placeholders
- JTBD panel displaying extracted situation/motivation/outcome
- X-ray fidelity toggle (breadboard/fat marker/hi-fi) in export phase
- JSON project export

**Infrastructure:**
- Node 22+ localStorage SSR fix in `next.config.js` (deletes broken global before SSR)
- Next.js 15 + React 18 + TypeScript + Tailwind CSS

### Removed
- All Phaser 3 game code (runner, topdown, shooter, platformer scenes)
- Game asset library (sprites, backgrounds)
- Game-specific AI prompts, vocabulary mappings, and design engine
- esbuild game build pipeline
- OpenAI → replaced with OpenAI GPT-4o-mini (previously used GPT-4o for clone mode)

### Architecture
```
User describes idea
  → POST /api/generate-design (action: setup)
  → Strategy Agent extracts JTBD + suggests screens/flows
  → POST /api/generate-design (action: generate_breadboards)
  → Strategy Agent generates 4-6 breadboard variants
  → User votes through 1-3 rounds → commits flow
  → POST /api/generate-design (action: generate_fat_markers)
  → Layout Agent generates 2-3 spatial layouts
  → User votes → commits layout
  → POST /api/generate-design (action: generate_hifi)
  → Visual Agent generates HTML/CSS renders
  → User votes → commits design → export
```
