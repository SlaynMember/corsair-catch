# S04: Progression & Polish

**Goal:** Items persist across refresh, fishing requires a rod, caught fish get a proper overlay.
**Demo:** New game → pick starter (get rod) → collect wood → save → refresh → wood is gone, inventory still has it. Walk to water without rod → dialogue says need rod. Catch a fish → see CAUGHT! overlay with sprite, name, type, level, rarity.

## Must-Haves

- Collected ground items don't respawn after browser refresh
- Fishing rod required before fishing (given with starter)
- CAUGHT! overlay shows fish sprite, name, type, level, rarity after catching
- Mosscale starter uses thorn_wrap (not coral_bloom) in starter picker

## Verification

- `npx tsc --noEmit` — zero errors
- `npm run smoke` — all tests pass
- Save system includes collectedItems and hasRod fields

## Tasks

- [x] **T01: Item persistence across refresh** `est:20m`
  - Added collectedItems[] to SaveData
  - BeachScene collectItem() pushes to registry 'collectedItems'
  - restoreFromSave() hides already-collected ground items
  - saveFromScene() includes collectedItems

- [x] **T02: Gate fishing on rod ownership** `est:15m`
  - Added hasRod to SaveData and save/restore flow
  - confirmStarterPick() sets registry 'hasRod' = true
  - All 3 beach scenes check hasRod before startFishing()
  - No rod → dialogue "You need a fishing rod first!"

- [x] **T03: Fish catch overlay** `est:20m`
  - showCatchOverlay() shows wood-panel with fish sprite, name, type, level, rarity
  - Sprite has gentle bob animation
  - Rarity looked up from FISH_SPECIES via texture key
  - Dismiss with SPACE or tap, then shows dialogue

- [x] **T04: Fix Mosscale starter moves** `est:5m`
  - Changed starter picker Mosscale from coral_bloom → thorn_wrap

## Files Likely Touched

- `src/systems/SaveSystem.ts`
- `src/scenes/BeachScene.ts`
- `src/scenes/Beach2Scene.ts`
- `src/scenes/Beach3Scene.ts`
