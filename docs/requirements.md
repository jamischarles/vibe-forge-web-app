# Kids Game Builder — Requirements

## R1: Games Must Be Playable Without Errors

**Priority:** Critical
**Rule:** Every generated game must start and run without JavaScript errors. A broken game is worse than no game.

**Implementation:**
- Global error + unhandledrejection handlers in the game iframe catch runtime errors
- Config validation in `startGame()` — checks template, hero, enemy; applies safe fallbacks for speed/jumpForce
- 8-second timeout if `GAME_READY` never fires after sending config
- Game errors surfaced in chat so users know what went wrong

**Key files:** `public/game.html`, `src/game/shared.ts`, `app/page.tsx`

---

## R2: Chat Changes Summary

**Priority:** High
**Rule:** After the AI generates or updates a game, the chat must display an expandable summary of **what was actually built or changed** — described in business/gameplay terms, not raw config diffs.

**What to show:**
- **New games:** What was built — game type, hero/enemy, gameplay mechanics (fog of war, grenades, double jump, etc.), difficulty settings
- **Updates (config mode):** What changed — "Changed hero to dog", "Added fog of war", "Increased speed", "Enabled double jump"
- **New code games:** What was built — AI provides summary of gameplay features implemented
- **Code game updates:** What changed — AI provides summary of changes made

**Presentation:**
- Collapsible `<details>/<summary>` block inside the chat message bubble
- Collapsed by default (keeps chat clean)
- Label: "What was built" for new games, "Changes made" for updates
- Business-rule descriptions, NOT field-level diffs (e.g., "Enabled fog of war" not "shooter.fogOfWar: false → true")

**Key files:** `lib/config-summary.ts`, `app/page.tsx`, `lib/ai.ts` (SUMMARY comments for code-mode)

---

## R3: Error Transparency

**Priority:** Medium
**Rule:** When something goes wrong (game error, API failure), the user must see a clear message explaining what happened — not a silent failure or a tiny badge they might miss.

**Implementation:**
- Game errors posted as chat messages
- API errors shown in the error banner
- Loading timeout detection (8s)

**Key files:** `app/page.tsx`
