---
id: S04
parent: M001
milestone: M001
provides:
  - Item persistence across browser refresh via collectedItems in SaveData
  - Fishing rod gate (hasRod registry flag, given with starter)
  - CAUGHT! overlay with fish sprite, name, type, level, rarity
  - Fixed Mosscale starter moves in picker (coral_bloom → thorn_wrap)
requires:
  - slice: S02
    provides: Working HUD system on all beaches
  - slice: S03
    provides: Valid fish data for all species
affects: []
key_files:
  - src/systems/SaveSystem.ts
  - src/scenes/BeachScene.ts
  - src/scenes/Beach2Scene.ts
  - src/scenes/Beach3Scene.ts
key_decisions:
  - collectedItems tracked by item ID in registry, persisted in SaveData
  - hasRod is a registry boolean, not an inventory item (rod is permanent, not consumable)
  - Catch overlay uses wood panel from UIFactory, dismisses on SPACE/tap before showing dialogue
  - Rarity looked up from FISH_SPECIES by matching texture key to spriteGrid+spriteIndex
patterns_established:
  - Registry key 'collectedItems' (string[]) for tracking persistent world state
  - Registry key 'hasRod' (boolean) for permanent tool ownership
observability_surfaces:
  - Save data in localStorage includes collectedItems and hasRod for inspection
drill_down_paths:
  - none (single commit)
duration: ~30min
verification_result: passed
completed_at: 2026-03-15
---

# S04: Progression & Polish

**Items persist across refresh, fishing gated on rod ownership, caught fish get a CAUGHT! overlay with sprite and stats.**

## What Happened

BUG-03 (item persistence): Added `collectedItems: string[]` to SaveData. When a ground item is collected, its ID is pushed to a registry array `'collectedItems'`. On save, this array is serialized. On restore, already-collected items are marked `collected: true` and hidden. Items no longer respawn after refresh.

BUG-12 (fishing requires rod): Added `hasRod: boolean` to SaveData. The rod is given when the player picks a starter from the chest (`confirmStarterPick()` sets `registry.set('hasRod', true)`). All 3 beach scenes check `this.registry.get('hasRod')` before `startFishing()`. Without a rod, the player sees "You need a fishing rod first!" dialogue.

BUG-13 (catch overlay): New `showCatchOverlay()` method creates a wood-panel overlay at depth 30 showing: fish sprite (96×84 with bob animation), name in PixelPirate font, type + level, and rarity (looked up from FISH_SPECIES by matching texture key). Dismissed with SPACE or tap, then transitions to the existing dialogue. Uses `createWoodPanel` + `addPanelHeader` + `addPanelFooter` + `addCornerRivets` for consistent battle-UI style.

Also fixed: Mosscale starter in `confirmStarterPick()` was using `coral_bloom` (status move, 0 power) instead of `thorn_wrap` (55 power). The fish-db was fixed in S03 but the hardcoded starter picker moves weren't updated.

## Verification

- `npx tsc --noEmit` — zero errors
- All 38 smoke tests pass (0 console errors, 0 missing textures)
- Fishing test correctly shows isFishing=false when hasRod is not set

## Requirements Advanced

- R009 (item persistence) — collected items saved and restored, no respawn on refresh
- R010 (fishing requires rod) — rod given with starter, checked on all 3 beaches
- R012 (catch overlay) — CAUGHT! panel with sprite, name, type, level, rarity

## Requirements Validated

- R009 — SaveData includes collectedItems, restoreFromSave hides collected items
- R010 — hasRod check added to all 3 beach scenes, save/restore flow includes hasRod
- R012 — showCatchOverlay creates wood-panel with all required fish details

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- Found Mosscale starter moves bug during execution — fixed alongside the planned work

## Known Limitations

- Item IDs are unique per-item-type, not per-instance. If multiple items of the same type exist (e.g. two wood spawns), collecting one marks all of that type as collected. Currently only 1 of each type spawns, so this is fine.
- The catch overlay only appears for direct fishing catches, not for battle-caught fish (BattleScene has its own catch flow via attemptCatch).

## Follow-ups

- Consider adding catch overlay to BattleScene's attemptCatch flow as well
- Consider adding a rod item to the inventory display for visual feedback

## Files Created/Modified

- `src/systems/SaveSystem.ts` — added collectedItems and hasRod to SaveData
- `src/scenes/BeachScene.ts` — item persistence, rod gate, catch overlay, Mosscale fix
- `src/scenes/Beach2Scene.ts` — rod gate before fishing
- `src/scenes/Beach3Scene.ts` — rod gate before fishing

## Forward Intelligence

### What the next slice should know
- This was the final slice of M001. All 16 playtest bugs have been addressed.

### What's fragile
- The `INV_STATIC` count in ground item persistence assumes items are only collected on Beach1. If Beach2/Beach3 get ground items, they need the same collectedItems registry pattern.

### Authoritative diagnostics
- `localStorage.getItem('corsair-catch-save')` → JSON with collectedItems[] and hasRod
- Smoke test 9 correctly shows fishing doesn't activate without rod

### What assumptions changed
- The starter picker hardcodes its own moves, independent of fish-db. Both must be updated when changing starter moves.
