# Kids Game Builder — Known Issues

_Last updated: 2026-03-03_

## Severity Legend
🔴 Blocking — breaks core functionality
🟡 Notable — visible problem but has workaround
🟢 Minor — cosmetic or edge-case

---

## Open

| # | Sev | Description | First Seen | Root Cause / Notes |
|---|-----|-------------|------------|--------------------|
| B-001 | 🟢 | `package.json` version is `0.1.0`; should reflect actual version `0.6.2` | v0.6.2 | Next.js doesn't auto-sync the package version. UI shows correct version via badge in header. |
| B-002 | 🟡 | M6 Actions (lives, collectibles, shield, etc.) were silently non-functional on all prod deploys from v0.6.0 until the v0.6.2 hotfix | v0.6.0 | `ActionSystem` object references `config` as a free variable, but `config` only exists as a closure param inside `startRunnerGame(config)` — not in global scope. Fixed in same session but worth noting that M6 shipped broken and went undetected. |

---

## Fixed (Recent)

| # | Sev | Description | Fixed In | Fix |
|---|-----|-------------|----------|-----|
| B-003 | 🔴 | `ReferenceError: config is not defined` — all games black-screen on prod after M6 deploy | v0.6.2 hotfix | Changed all `config.` refs inside `ActionSystem` to `currentConfig.` (the actual global set by `startGame()`). Affected: `init()`, `tick()`, `spawnCollectible()`, `spawnShield()`, `handleCollision()`. |
| B-004 | 🔴 | Phaser initializes at 0×0 on mobile — game canvas never visible | v0.6.1 | Game iframe was inside a `display:none` container when `mobileView='chat'` on load. Fixed by switching to absolute-positioning overlay: game always renders with real viewport dimensions (z-0), left panel overlays it (z-10). |

---

## Wontfix / By Design

| # | Description | Rationale |
|---|-------------|-----------|
| — | Voice input (mic button) Chrome-only | Web Speech API is a Chrome/Edge feature. No plans to polyfill. |
| — | `sandbox="allow-scripts allow-same-origin"` on iframe — no form submission, popups, etc. | Intentional security boundary. Game code runs isolated. |

---

## How to Add a New Bug

Copy a row from the Open table. Next bug ID is `B-005`.

```
| B-005 | 🟡 | Short description | vX.X.X | Root cause note |
```

When fixed, move the row to the **Fixed** table and add the fix version + what was changed.
