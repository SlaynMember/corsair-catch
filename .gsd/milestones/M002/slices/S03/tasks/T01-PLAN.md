---
estimated_steps: 8
estimated_files: 3
---

# T01: Place Boss Ships on Sailing Map with Patrol and Approach Detection

**Slice:** S03 — Boss Ships, Intro & Rewards
**Milestone:** M002

## Description

Add boss captain ships to the SailingScene as visible sprites that patrol near their associated islands. Extend SaveData to track defeated bosses so they can be filtered out. Add approach-proximity detection modeled after the dock proximity system. Show boss ships as red dots on the minimap.

## Steps

1. Add `defeatedBosses: string[]` to `SaveData` interface. In `loadGame()`, add `data.defeatedBosses = data.defeatedBosses ?? [];` for backward compatibility. In `saveFromScene()`, gather `defeatedBosses` from registry (default `[]`).

2. Define boss ship config in SailingScene — a `BOSS_SHIPS` array mapping each enemy-db template ID to: island position (relative to ISLANDS array), ship sprite key, patrol waypoints (2 points, island-relative). Use ship-05 for Barnacle (near Coral Atoll 1800,1200), ship-12 for Ironhook (near Skull Island 3200,800), ship-18 for Dread Corsair (near Storm Reef 600,600).

3. In `create()`, after island rendering, spawn boss ship sprites. For each boss in `BOSS_SHIPS`: check if `defeatedBosses` registry array includes the boss ID — skip if defeated. Create `this.physics.add.sprite()` positioned at patrol start point. Apply `setTint(template.shipColor)` and `setDisplaySize()` scaled by `template.shipScale`. Store refs in a `bossShips` array for update-loop access. No physics colliders — boss ships are proximity-only.

4. Add simple patrol movement in `update()`: each boss ship lerps between its 2 waypoints using `Phaser.Math.Linear`, reversing direction at each end. Speed ~30px/s. Flip sprite horizontally based on movement direction.

5. Add `checkBossProximity()` — iterate `bossShips` array, compute distance from player ship to each boss ship, compare against template's `aggroRadius`. Set `this.nearestBoss` to the closest in-range boss (or null). Show/hide an "APPROACH" prompt similar to dock prompt (reuse pattern).

6. Call `checkBossProximity()` in `update()` after `checkDockProximity()`.

7. In minimap setup (`createMinimap`), add red dots for boss ships. Store refs so they can be updated each frame (boss ships move) and removed on defeat.

8. Update minimap boss dots in `updateMinimap()` to track patrol positions.

## Must-Haves

- [ ] `defeatedBosses: string[]` in SaveData with backward-compat default
- [ ] 3 boss ship sprites visible on sailing map at correct positions
- [ ] Boss ships filtered out when ID is in `defeatedBosses` registry
- [ ] Simple patrol movement (linear between 2 waypoints)
- [ ] Red dots on minimap for boss ships, updated per frame
- [ ] `checkBossProximity()` detects player within aggro radius, sets `nearestBoss`
- [ ] `shipColor` tint and `shipScale` applied from enemy-db templates
- [ ] No physics colliders on boss ships (distance-only detection)

## Verification

- `npx tsc --noEmit` — zero type errors
- Dev server: sail around, confirm 3 boss ships visible with tints and patrol movement
- Confirm minimap shows red dots at boss positions
- Approach a boss ship — `nearestBoss` is set (verify via console or prompt visibility)

## Observability Impact

- `console.log` at boss ship spawn: logs boss ID, position, and ship sprite key for each spawned boss
- `console.log` when boss ship is skipped due to defeat: logs boss ID
- `window.game.registry.get('defeatedBosses')` — array of defeated boss IDs, inspectable via browser console or Playwright `page.evaluate`
- `nearestBoss` on SailingScene instance: set to the closest in-range boss template or null; verifiable via `page.evaluate(() => window.game.scene.getScene('Sailing').nearestBoss)`
- Minimap red dots: visual signal that boss ships exist and are tracking patrol positions

## Inputs

- `src/data/enemy-db.ts` — `ENEMIES` array with template IDs, `aggroRadius`, `shipColor`, `shipScale`
- `src/scenes/SailingScene.ts` — `ISLANDS` array with positions, `checkDockProximity()` pattern, minimap system
- `src/systems/SaveSystem.ts` — `SaveData` interface, `loadGame()`, `saveFromScene()`

## Expected Output

- `src/systems/SaveSystem.ts` — `defeatedBosses` field in SaveData, backward-compat loading, registry gather in save
- `src/scenes/SailingScene.ts` — boss ship sprites, patrol movement, `checkBossProximity()`, minimap red dots, `nearestBoss` ref for T02 consumption
