---
task: T02
status: done
started: 2026-03-15T16:40:00
completed: 2026-03-15T17:00:00
---

# T02 Summary: Fix transition oscillation loop

## What was done
- **Root cause**: Beach2 and Beach3 spawned player *inside* the transition zone. Position-only cooldown was fragile — player could clear and re-enter immediately.
- **Fix 1**: Offset spawn positions away from transition zones:
  - Beach2: spawn 40px right of the to-beach1 zone edge (not inside it)
  - Beach3: spawn 40px left of the to-beach1 zone edge (not inside it)
  - Beach1 already had proper offsets
- **Fix 2**: Added time-based cooldown (500ms) in addition to position-based:
  - All 3 scenes now require BOTH leaving the zone AND 500ms elapsed before transitions arm
  - `transitionCooldownTimer` tracks elapsed ms since create()
- **Fix 3**: Explicit reset of cooldown state in create() for all 3 scenes (Phaser reuses scene instances)

## Files changed
- `src/scenes/BeachScene.ts` — timer field + create reset + update condition
- `src/scenes/Beach2Scene.ts` — spawn offset + timer field + create reset + update condition
- `src/scenes/Beach3Scene.ts` — spawn offset + timer field + create reset + update condition

## Verification
- `npx tsc --noEmit` clean
- All 10 smoke tests pass including Beach1↔Beach2 transitions
- Headless Playwright confirms Beach3 player spawns at x=1275 (outside to-beach1 zone at x=1315)
