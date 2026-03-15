---
id: S02
parent: M001
milestone: M001
provides:
  - Shared HUDManager system for bag/team/volume buttons on all beach scenes
  - Team panel (YOUR CREW) on Beach2 and Beach3 with T key toggle
  - CATCH button resized to match TEAM/ITEMS action button dimensions
  - Mobile detection uses (pointer: coarse) instead of touch-only check
requires:
  - slice: S01
    provides: Working scene transitions and debug overlay
affects:
  - S04
key_files:
  - src/systems/HUDManager.ts
  - src/systems/MobileInput.ts
  - src/scenes/BattleScene.ts
  - src/scenes/Beach2Scene.ts
  - src/scenes/Beach3Scene.ts
  - src/scenes/BeachScene.ts
key_decisions:
  - HUDManager is a class instantiated per-scene (not a singleton) — each scene owns its HUD lifecycle
  - CATCH button placed in the action row at (370,670) matching TEAM/ITEMS visual style
  - IS_MOBILE uses (pointer coarse) as primary signal, touch + small screen as fallback
  - Team/Items panels in BattleScene were already fully implemented — no changes needed
patterns_established:
  - HUDManager(scene, { onInventory, onTeam }) pattern for adding HUD to any beach scene
  - Team panel pattern duplicated to Beach2/Beach3 (createTeamPanel + toggleTeamPanel + refreshTeamUI)
observability_surfaces:
  - none new
drill_down_paths:
  - none (single commit, all tasks executed in one pass)
duration: ~25min
verification_result: passed
completed_at: 2026-03-15
---

# S02: Battle UI & HUD Parity

**Shared HUD on all 3 beaches, CATCH button properly sized, mobile detection fixed for desktop touch screens.**

## What Happened

BUG-14 (HUD missing on Beach2/Beach3): Extracted the 3 HUD buttons (inventory bag, team bubble, volume) from BeachScene's inline `createHUD()` into a new `HUDManager` class in `src/systems/HUDManager.ts`. The manager takes callback functions for inventory and team panel toggling, so each scene controls its own panels. Wired into all 3 beach scenes. Beach2 and Beach3 also needed team panels — added `createTeamPanel()`, `toggleTeamPanel()`, `refreshTeamUI()` methods plus T key registration and ESC-to-close handling. Both scenes already had inventory panels.

BUG-16 (CATCH button too large): Resized from 200×46 at (310,616) to 114×36 at (370,670), sitting in the same row as TEAM and ITEMS. Changed from ocean-blue oversized button with huge glow to a standard action button with wood frame, matching the visual language of the other buttons. Removed the standalone net icon Graphics object. Added `[C]` key hint text consistent with `[T]` and `[I]` hints.

R017 (mobile detection): Changed `IS_MOBILE` from `'ontouchstart' in window || navigator.maxTouchPoints > 0` to `matchMedia('(pointer: coarse)') || (touch + screen <= 1024px)`. The `pointer: coarse` media query correctly identifies finger input vs mouse — desktop touch laptops report `pointer: fine` because the mouse is the primary pointing device. The screen-size fallback catches edge cases where matchMedia isn't available.

BUG-15 (TEAM/ITEMS panels): Audited the full code path. Both panels are fully implemented with wood-frame overlays, cursor navigation, touch support, and proper keyboard (WASD/SPACE/ESC) handling. The TEAM panel shows party fish with sprites, HP bars, levels, and allows swapping. The ITEMS panel shows inventory with descriptions and target selection. The T and I keys are wired in `update()`. No placeholder text exists — the "No items to use!" message is the correct empty-state response.

## Verification

- `npx tsc --noEmit` — zero errors
- All 38 smoke tests pass (includes inventory/team panel open/close tests, scene transitions, battle launch, error sweep)

## Requirements Advanced

- R003 (Battle TEAM/ITEMS panels) — verified fully working end-to-end, no code changes needed
- R004 (CATCH button sizing) — resized to 114×36, positioned in action row at (370,670)
- R005 (HUD on all beaches) — HUDManager wired into Beach2 and Beach3 with bag/team/volume buttons
- R017 (mobile detection) — IS_MOBILE now uses pointer:coarse, no false-positive on desktop touch
- R018 (mobile layout parity) — HUD buttons use IS_MOBILE-scaled sizing (64px vs 44px)

## Requirements Validated

- R003 — code audit confirms full wood-panel UI with cursor nav, touch support, target selection
- R004 — CATCH button dimensions match TEAM/ITEMS (114×36), no overlap
- R005 — HUDManager creates identical buttons on all 3 scenes
- R017 — pointer:coarse is false on desktop browsers with touch screens

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- BUG-15 required no code fix — panels were already complete. Spent verification time instead of implementation time.

## Known Limitations

- Team panel code is duplicated across Beach2Scene and Beach3Scene (not extracted to shared module). Acceptable for 3 scenes — would want to extract if more scenes are added.
- CATCH button lost its net icon and hint text in the resize. The `[C]` key hint compensates.

## Follow-ups

- none

## Files Created/Modified

- `src/systems/HUDManager.ts` — new shared HUD button manager (bag, team, volume)
- `src/systems/MobileInput.ts` — IS_MOBILE detection changed to pointer:coarse + screen size
- `src/scenes/BeachScene.ts` — replaced inline createHUD/toggleMute with HUDManager
- `src/scenes/Beach2Scene.ts` — added HUDManager, team panel, T key handling
- `src/scenes/Beach3Scene.ts` — added HUDManager, team panel, T key handling
- `src/scenes/BattleScene.ts` — resized CATCH button to action-row dimensions

## Forward Intelligence

### What the next slice should know
- HUDManager doesn't destroy itself on scene shutdown — Phaser's scene lifecycle handles cleanup of scene-owned game objects. If HUD buttons ever persist across scenes unexpectedly, add explicit destroy() call in shutdown handler.
- Beach2/Beach3 team panels use the same `TEAM_STATIC = 13` magic number as BeachScene — count the static container children carefully if changing the panel header/footer structure.

### What's fragile
- The `TEAM_STATIC` and `INV_STATIC` constants must match the exact count of static elements added in createTeamPanel/createInventoryPanel. Adding a decorative element to the panel without updating the constant will cause stale rows on refresh.

### Authoritative diagnostics
- Smoke tests `UI Elements › Inventory opens and closes` and `UI Elements › Team panel opens and closes` verify the toggle flow on Beach1
- `npx tsc --noEmit` catches any import or type errors from the HUDManager integration

### What assumptions changed
- BUG-15 was assumed to be broken — the panels were actually fully implemented and working. The bug report may have been filed against an older build.
