---
id: S02
parent: M002
milestone: M002
provides:
  - Consistent player body sizing (16×8 feet-only hitbox) across all 3 beach scenes
  - Per-frame walkable zone clamping on Beach3 (safety net for irregular L-shaped terrain)
  - Cleaned-up Beach3 TMX colliders matched to new body size
requires: []
affects:
  - S03 (no direct dependency, but stable beach physics are prerequisite for any future beach work)
key_files:
  - src/scenes/Beach2Scene.ts
  - src/scenes/Beach3Scene.ts
  - public/maps/beach3bounds.tmx
key_decisions:
  - Per-frame walkable zone clamping chosen over tighter TMX colliders alone — safety net pattern
  - Single-axis snap-back tried first for smoother feel before full position reset
  - 4px margin on zone containment checks to prevent sticky edges
  - Walkable bounding rect also used for physics.world.setBounds on Beach2
patterns_established:
  - isInWalkableZone() + clampToWalkableZones() per-frame safety net pattern for irregular terrain
  - lastValidX/lastValidY tracking for snap-back on escape
  - Consistent body.setSize(16, 8) + body.setOffset(8, 28) across all beach scenes
observability_surfaces:
  - ?debug=1 URL param shows green walkable zone overlays on Beach3 (via TMXDebug.ts)
drill_down_paths: []
duration: ~50min
verification_result: passed
completed_at: 2026-03-16
---

# S02: Fix Beach Bounds (All Scenes)

**All 3 beach scenes now use identical 16×8 feet-only physics bodies, and Beach3 has per-frame walkable zone clamping so the player can never walk into water/cliffs/trees.**

## What Happened

Beach1 already had `body.setSize(16, 8)` + `body.setOffset(8, 28)` for a small feet-only collision box, but Beach2 and Beach3 were using the full 64×64 sprite as the physics body. This caused the player to clip into colliders and get stuck against walls/objects, especially on Beach3's irregular L-shaped terrain.

**T01** added identical body sizing to Beach2Scene and Beach3Scene — `setSize(16, 8)` + `setOffset(8, 28)` after `setDisplaySize(64, 64)`, matching BeachScene exactly. Beach2 also got `physics.world.setBounds()` clamped to the walkable bounding rect.

**T02** added a per-frame walkable zone safety net to Beach3. Two new fields (`lastValidX`, `lastValidY`) track the last known-good position. After every movement frame, `clampToWalkableZones()` checks if the player is inside any TMX walkable rect (simple AABB with 4px margin). If not, it tries single-axis snap-back first (smoother feel) before falling back to full position reset. The spawn position is also validated — if the player spawns outside a walkable zone, the nearest zone center is used instead.

**T03** cleaned up the Beach3 TMX colliders. The `beach3bounds.tmx` file was rewritten to match the correct body size — colliders that were too aggressive when the body was 64×64 were adjusted now that the hitbox is 16×8. The walkable zone clamping serves as the ultimate safety net, so colliders only need to be "good enough" for natural feel.

The Beach3 background was also swapped during this work (new AI-generated bg committed alongside the TMX rewrite).

## Verification

- `npx tsc --noEmit` — zero errors
- `npm run smoke` — all 42 tests pass (including Beach3-specific walkable bounds test and Beach3→Beach1 transition test)
- Smoke test `Player stays within walkable bounds on Beach3` explicitly validates the clamping system
- Smoke test `Beach3 loads with valid TMX and no errors` confirms 4 walkable zones, 14 colliders, 1 transition

## Requirements Advanced

- none — this slice addresses a physics/collision quality issue not tracked as a formal requirement

## Requirements Validated

- none — no new requirements moved to validated

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- S02 was re-planned from "Boss Ships in Sailing" (original M002 roadmap) to "Fix Beach Bounds" — beach physics issues were discovered during M002 S01 testing that needed to be addressed before adding more sailing content. Boss ships will be addressed in a future slice.
- Beach3 background was swapped as part of T03 (new AI-generated bg better matched the TMX layout).

## Known Limitations

- Walkable zone clamping is Beach3-only. Beach1 and Beach2 rely on `setCollideWorldBounds(true)` + TMX colliders, which is sufficient for their simpler rectangular layouts. If Beach1/Beach2 develop escape bugs, the same pattern can be applied.
- The 4px margin on zone checks means the player can technically be 4px outside a walkable rect — negligible in practice but a known tolerance.

## Follow-ups

- Boss Ships in Sailing (original S02 scope from M002 roadmap) still needs to be implemented — will become the next slice
- If new beach areas are added, apply the body.setSize(16, 8) pattern and consider walkable zone clamping for irregular terrain

## Files Created/Modified

- `src/scenes/Beach2Scene.ts` — added body.setSize(16, 8) + body.setOffset(8, 28), physics.world.setBounds
- `src/scenes/Beach3Scene.ts` — added body sizing, lastValidX/Y tracking, isInWalkableZone(), clampToWalkableZones(), spawn validation
- `public/maps/beach3bounds.tmx` — rewritten colliders and walkable zones for 16×8 body size
- `public/backgrounds/beach3-bg.png` — swapped to new AI-generated background
- `public/backgrounds/beach2-bg.png` — swapped to new AI-generated background
- `e2e/smoke.spec.ts` — Beach3 walkable bounds test verifies clamping system

## Forward Intelligence

### What the next slice should know
- All 3 beach scenes now have identical body sizing — any new beach scene should copy the `setSize(16, 8)` + `setOffset(8, 28)` pattern
- Beach3's `clampToWalkableZones()` runs every frame in `update()` after `handleMovement()` — if adding new movement systems, ensure they run before the clamp
- The TMX walkable zones on Beach3 define the absolute boundary of player movement — colliders are a softer first defense

### What's fragile
- Beach3 walkable zone rects are hand-tuned to the background image — if the background changes again, the TMX must be re-tuned or the player will be clamped to wrong areas
- The single-axis snap-back in clampToWalkableZones() assumes zone rects are roughly aligned — diagonal gaps between zones could cause jittery behavior

### Authoritative diagnostics
- `?debug=1` URL param renders green walkable zone overlays — this is the first place to check if a player reports being stuck or unable to reach an area on Beach3
- Smoke test `Player stays within walkable bounds on Beach3` is the automated proof that clamping works

### What assumptions changed
- Original assumption: S02 would be Boss Ships in Sailing — actual: beach physics issues were more urgent and became the S02 scope
- Original assumption: TMX colliders alone would be sufficient for Beach3 — actual: irregular L-shaped terrain needs a walkable zone safety net
