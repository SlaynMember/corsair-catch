---
id: T01
parent: S03
milestone: M002
provides:
  - Boss ship sprites on sailing map with patrol movement
  - defeatedBosses field in SaveData with backward-compat loading
  - checkBossProximity() sets nearestBoss for T02 consumption
  - Red minimap dots tracking boss patrol positions
key_files:
  - src/scenes/SailingScene.ts
  - src/systems/SaveSystem.ts
  - src/scenes/BeachScene.ts
  - src/scenes/MainMenuScene.ts
key_decisions:
  - Boss ships use distance-only detection (no physics colliders) matching dock proximity pattern
  - Patrol uses Phaser.Math.Linear lerp between 2 waypoints with direction-based flip
  - nearestBoss is public on SailingScene for T02 cross-method access
patterns_established:
  - BOSS_SHIPS config array maps enemy-db template IDs to island positions and ship sprites
  - bossShips runtime array holds sprite + template + patrol state per active boss
  - spawnBossShips() filters by registry defeatedBosses at scene create time
observability_surfaces:
  - console.log at boss spawn (ID, position, sprite key) and skip (defeated ID)
  - window.game.registry.get('defeatedBosses') — array of defeated boss IDs
  - scene.nearestBoss — current closest in-range boss template or null
  - scene.bossShips — runtime array of active boss ship state (sprite, template, patrol)
  - Minimap red dots — visual signal for boss positions
duration: 35m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T01: Place Boss Ships on Sailing Map with Patrol and Approach Detection

**Added 3 boss ship sprites to SailingScene with linear patrol, proximity detection, minimap dots, and defeated-boss persistence in SaveData.**

## What Happened

Extended SaveData with `defeatedBosses: string[]` and wired backward-compat default in `loadGame()`, registry restore in `restoreFromSave()` (BeachScene) and CONTINUE flow (MainMenuScene), and gathering in `saveFromScene()`.

Defined `BOSS_SHIPS` config array in SailingScene mapping each enemy-db boss to an island, ship sprite, and 2-waypoint patrol path:
- Captain Barnacle (ship-05) patrols near Coral Atoll
- Admiral Ironhook (ship-12) patrols near Skull Island
- The Dread Corsair (ship-18) patrols near Storm Reef

`spawnBossShips()` runs in `create()` after islands, checks registry `defeatedBosses` to skip beaten bosses, creates physics sprites with tint and scale from enemy-db templates.

`updateBossPatrols()` lerps each boss between waypoints at configured speed with sprite flip. `checkBossProximity()` computes distance from player ship to each boss, sets `nearestBoss` and shows/hides a red "APPROACH" prompt (modeled after dock prompt pattern).

Minimap red dots added in `buildMinimap()`, positions updated each frame in `updateMinimap()`.

## Verification

- `npx tsc --noEmit` — zero type errors ✓
- Headless Playwright: 3 boss ships spawn with correct names/positions, patrol movement advancing ✓
- Headless Playwright: proximity detection sets `nearestBoss` when ship within aggro radius ✓
- Headless Playwright: defeated boss filtering — setting `defeatedBosses: ['rival_captain']` and restarting scene results in 2 bosses ✓
- Headless Playwright: minimap dot count matches boss ship count ✓
- `npm run smoke` — all 42 tests pass ✓

### Slice-level verification status (intermediate task):
- `npx tsc --noEmit` — ✅ pass
- `npm run smoke` — ✅ all 42 existing tests pass
- New boss encounter smoke test — ⬜ deferred to T03
- Manual playtest — ⬜ deferred to T03

## Diagnostics

- `console.log('[Boss] Spawned ...')` at spawn time shows template name, ID, position, sprite key
- `console.log('[Boss] Skipping defeated boss: ...')` when a boss is filtered
- `window.game.registry.get('defeatedBosses')` — inspect defeated array via console/Playwright
- `window.game.scene.getScene('Sailing').nearestBoss` — current proximity target
- `window.game.scene.getScene('Sailing').bossShips` — full runtime boss state array

## Deviations

- Also wired `defeatedBosses` restore in MainMenuScene CONTINUE flow and BeachScene `restoreFromSave()` — not in task plan but necessary for save/load round-trip integrity.

## Known Issues

None.

## Files Created/Modified

- `src/systems/SaveSystem.ts` — Added `defeatedBosses: string[]` to SaveData, backward-compat in loadGame(), gather in saveFromScene()
- `src/scenes/SailingScene.ts` — BOSS_SHIPS config, spawnBossShips(), buildBossPrompt(), updateBossPatrols(), checkBossProximity(), minimap red dots, nearestBoss ref
- `src/scenes/BeachScene.ts` — Restore defeatedBosses from save in restoreFromSave()
- `src/scenes/MainMenuScene.ts` — Set defeatedBosses in registry on CONTINUE
- `.gsd/milestones/M002/slices/S03/tasks/T01-PLAN.md` — Added Observability Impact section
