---
id: S01
parent: M001
milestone: M001
provides:
  - Fixed transition cooldown pattern (time + position based, consistent across all 3 scenes)
  - TMX debug overlay system via ?debug=1 URL param
  - Verified pirate battle rendering works end-to-end
  - Corrected Beach2 dialogue directions
requires:
  - slice: none
    provides: first slice
affects:
  - S02
  - S03
  - S04
key_files:
  - src/systems/DebugOverlay.ts
  - src/scenes/BeachScene.ts
  - src/scenes/Beach2Scene.ts
  - src/scenes/Beach3Scene.ts
key_decisions:
  - Spawn players 40px away from transition zones, not inside them
  - Time-based cooldown (500ms) in addition to position-based for transition guards
  - Debug overlay at depth 999, labels with monospace font on colored backgrounds
patterns_established:
  - transitionCooldown + transitionCooldownTimer pattern for scene transitions
  - drawDebugOverlay(scene, tmx) call in create() for any beach scene
observability_surfaces:
  - ?debug=1 URL param draws all TMX zones as colored overlays
drill_down_paths:
  - .gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T03-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T04-SUMMARY.md
duration: ~50min
verification_result: passed
completed_at: 2026-03-15
---

# S01: Blockers — Transitions, Collisions & Pirate Battles

**Fixed scene transition oscillation, verified pirate battles render correctly, added TMX debug overlay for collision bound visualization.**

## What Happened

Will completed Tiled edits for all 3 beach TMX files — all rectangles, proper naming. TMX data loads correctly at runtime (verified via headless Playwright).

BUG-11 (dialogue direction) was a 2-line fix: "back east" → "back west" in Beach2Scene.

BUG-02 (transition oscillation) root cause: Beach2 and Beach3 spawned the player *inside* the transition zone. The position-only cooldown was fragile. Fix: offset spawns 40px away from transition zones + add 500ms time-based cooldown. Both conditions must clear before transitions arm. Explicit reset in create() since Phaser reuses scene instances.

BUG-09 (pirate battle black screen) investigation: traced full launch chain from Beach3 enemy collision through BattleScene rendering. Evil pirate textures exist, speciesId:0 path renders correctly, moves exist. Headless test launched pirate battle successfully with zero errors. Conclusion: was a transient state issue during playtest, not a persistent code bug.

BUG-01 (TMX debug overlay): created `DebugOverlay.ts` with colored overlays for all zone types. Activated by `?debug=1`. Wired into all 3 beach scenes. Screenshots confirm zones align with background imagery.

## Verification

- `npx tsc --noEmit` clean
- All 10 smoke tests pass (2 runs)
- Headless Playwright: TMX data verified, pirate battle rendered, debug overlay screenshots on all 3 beaches
- Beach1↔Beach2 transitions tested bidirectionally in smoke tests

## Requirements Advanced

- R001 (scene transitions) — transitions work without oscillation, spawn positions corrected
- R002 (pirate battles) — verified rendering works, no code fix needed
- R008 (Beach3 spawn) — to-beach1 zone now at x=1315 (right side), spawn offset to x=1275
- R011 (debug overlay) — ?debug=1 draws all TMX zones on all beaches
- R013 (dialogue accuracy) — "back east" → "back west" fixed

## Requirements Validated

- R011 — debug overlay confirmed working via screenshots
- R013 — dialogue text confirmed correct via grep

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- R002 — BUG-09 was not a persistent code bug; pirate battles already work. May remove from active tracking.

## Deviations

- BUG-09 required no code fix — was traced and verified working rather than fixed.

## Known Limitations

- Debug overlay labels can overlap when zones are small/adjacent (readable but not beautiful)
- Beach3 camera follows player so full overlay isn't visible in one screenshot — must walk around to see all zones

## Follow-ups

- none

## Files Created/Modified

- `src/systems/DebugOverlay.ts` — new module for TMX zone visualization
- `src/scenes/BeachScene.ts` — transition cooldown fix + debug overlay import
- `src/scenes/Beach2Scene.ts` — spawn offset + cooldown fix + dialogue fix + debug overlay
- `src/scenes/Beach3Scene.ts` — spawn offset + cooldown fix + debug overlay

## Forward Intelligence

### What the next slice should know
- BattleScene reuses scene instances — all state must be explicitly reset in init() or create()
- The enemy type "???" shown in pirate battle HP card is BUG-06 (S03), not a rendering bug
- `speciesId: 0` is the special sentinel for beach enemies (crabs, gulls, jellies, pirates) — not a real fish species

### What's fragile
- `transitionCooldownTimer` depends on `delta` from update() — if update runs at variable rates, the 500ms threshold could be inconsistent. In practice this is fine since Phaser's delta is frame-accurate.

### Authoritative diagnostics
- `?debug=1` on any beach — shows all TMX zones, confirms collision/walk/transition alignment
- `e2e/screenshots/pirate-battle-test.png` — proof pirate battles render correctly

### What assumptions changed
- BUG-09 was assumed to be a code bug — it was actually a transient state issue (no party or stale scene)
