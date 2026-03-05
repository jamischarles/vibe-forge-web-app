# Game Scenarios — "Can We Build It?"

Our north star: a kid should be able to describe any of these in one sentence and get
a working, fun game using only our engine + AI prompts. This is the measure of success.

**Legend:** ✅ Works today &nbsp; 🚧 Partial (core works, polish missing) &nbsp; ❌ Not yet supported

---

## Runner Template

| Status | Scenario | Example prompt | Notes |
|--------|----------|----------------|-------|
| ✅ | Classic endless runner | "a dog jumping over cats" | Core template |
| ✅ | Space runner | "rocket dodging asteroids in space" | bg-space asset |
| ✅ | Fantasy runner | "knight jumping over dragons" | sprite assets |
| ✅ | Obstacle course with ducking | "obstacle course with things to jump over and duck under" | M9 duck mechanic |
| ✅ | Collectible runner | "bunny collecting carrots while jumping" | collectible action |
| ✅ | Speed-ramping runner | "car race getting faster and faster" | speed-ramp action + baked ramp |
| ✅ | Multi-life runner | "ninja with 3 lives dodging swords" | lives action |
| ✅ | Shield power-up runner | "wizard with a shield avoiding fireballs" | shield action |
| 🚧 | Multiple obstacle types | "jungle run: low branches AND crocodiles" | duck + enemies work; no separate enemy types yet |
| ❌ | Platformer (jump across platforms) | "mario-style platformer" | Needs platformer template (M12+) |

---

## Top-Down Avoid Template

| Status | Scenario | Example prompt | Notes |
|--------|----------|----------------|-------|
| ✅ | Classic 4-dir avoid | "mouse avoiding cats in an arena" | Core template |
| ✅ | Space dodge | "spaceship dodging missiles in all directions" | bg-space |
| ✅ | Collector | "robot collecting stars while avoiding aliens" | collectible action |
| ✅ | Multi-life dodge | "wizard with 3 lives avoiding ghosts" | lives action |
| ✅ | Speed-ramp dodge | "car dodging in traffic getting faster" | speed-ramp action |
| 🚧 | Maze-like narrow arena | "dodging enemies through narrow corridors" | No walls in topdown yet |
| ❌ | Stealth / cover | "spy sneaking through a guarded base" | Needs shooter template walls |

---

## Shooter Template (M10 — v1.0.0)

| Status | Scenario | Example prompt | Notes |
|--------|----------|----------------|-------|
| ✅ | Paintball battle | "paintball battle with walls to hide behind" | Core shooter template |
| ✅ | Arena shooter | "arena shooter with obstacles" | Core shooter template |
| ✅ | Laser tag | "laser tag arena" | shooter template + laser emojis |
| ✅ | Castle siege | "knight defending a castle shooting at invaders" | shooter + fantasy sprites |
| ✅ | Space battle | "spaceship battle in an asteroid field" | shooter + bg-space |
| 🚧 | Boss enemy | "fight a giant boss enemy" | Needs boss mechanic (future action type) |
| ❌ | Co-op multiplayer | "two players vs enemies" | Out of scope |
| ❌ | Top-down RPG exploration | "explore a dungeon and fight monsters" | Needs exploration + rooms |

---

## Clone Mode (free-form AI code generation)

| Status | Scenario | Example prompt | Notes |
|--------|----------|----------------|-------|
| ✅ | Flappy Bird | "make a flappy bird clone" | Clone mode |
| ✅ | Pong | "make a pong game" | Clone mode |
| ✅ | Snake | "make a snake game" | Clone mode |
| ✅ | Breakout | "make a breakout / brick-breaker game" | Clone mode |
| ✅ | Asteroids | "make an asteroids game" | Clone mode |
| 🚧 | Pac-Man | "make a pac-man game" | AI sometimes struggles with the maze generation |
| ❌ | Complex RPG | "make a pokemon-style RPG" | Too complex for a single code-gen call |

---

## Future Templates (engine gaps)

| Priority | Scenario | Template needed |
|----------|----------|----------------|
| M11 | Platformer: run + jump on platforms | `'platformer'` template |
| M12 | Tower defense: place towers, enemy waves | `'tower-defense'` template |
| M13 | Racing: top-down track with lap timer | `'racing'` template |
| M14 | Puzzle / match-3 | `'puzzle'` template |
