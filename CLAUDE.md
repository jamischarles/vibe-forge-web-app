# Project Instructions

## About
VibeForge is an AI-powered UI/UX design canvas that guides users from idea → JTBD extraction → breadboard flow → fat marker layout → hi-fi visual design. Built on Next.js 15 + React + TypeScript + Tailwind + Zustand + Anthropic API.

## Architecture
- `app/page.tsx` — Main shell: split-pane layout (left: chat + voting + JTBD, right: canvas)
- `lib/store.ts` — Zustand store with localStorage persistence
- `lib/vf-types.ts` — All TypeScript interfaces
- `lib/agents/` — AI agent layer (strategy, layout, visual) using Anthropic SDK
- `components/canvas/` — SVG breadboard, fat marker, and hi-fi renderers
- `components/panels/` — Chat, voting, JTBD, phase indicator panels
- `app/api/generate-design/route.ts` — API route dispatching to agents

## Version Bumping
Before pushing a PR branch, always bump the version in `package.json`:
- **Minor bump** (e.g. 0.1.0 → 0.2.0): new features, new phases, new UI
- **Patch bump** (e.g. 0.1.0 → 0.1.1): bug fixes, refactors, docs, style changes

## Environment
- `ANTHROPIC_API_KEY` — required for AI generation
