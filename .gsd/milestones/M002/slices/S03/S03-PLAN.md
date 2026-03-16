# S03: Boss Ships, Intro & Rewards

**Goal:** Boss captain ships appear on the sailing map. Approaching one triggers an intro overlay then a multi-fish battle. Defeating a boss grants item rewards, marks them beaten (persisted across save/load), and removes them from the map.

**Demo:** Sail to Coral Atoll → approach Captain Barnacle's ship → see intro overlay with name + taunt → fight 3 fish → victory screen with item rewards → boss ship gone → save → reload → boss still gone.

## Must-Haves

- Boss ships visible on sailing map at fixed positions near associated islands
- Boss ships have simple patrol movement and appear as red dots on minimap
- Approaching a boss ship triggers a full-screen intro overlay (captain name, ship sprite, taunt)
- SPACE/tap on intro launches multi-fish battle via S01 engine (`scene.launch` + `scene.pause`)
- SailingScene resumes correctly after battle victory (fade-in, boss removed)
- Defeating a boss grants item rewards (added to inventory registry)
- Victory overlay shows rewards before dismissing
- `defeatedBosses: string[]` added to SaveData with backward-compatible loading
- Beaten bosses don't render on sailing map (filtered by registry + SaveData)
- Whiteout (loss) returns to Beach1 as existing behavior — no change needed
- All 3 bosses (Barnacle, Ironhook, Dread Corsair) functional end-to-end
- Mobile parity: touch triggers intro dismiss and all new UI has 64px tap targets
- Existing 39+ smoke tests still pass

## Proof Level

- This slice proves: final-assembly (milestone completion)
- Real runtime required: yes
- Human/UAT required: yes (Will playtests all 3 bosses)

## Verification

- `npx tsc --noEmit` — zero errors
- `npm run smoke` — all existing tests pass + new boss encounter test
- New smoke test in `e2e/bug-audit.spec.ts`: SailingScene → boss ships present → approach triggers battle with 3-fish party → returnScene is 'Sailing'
- Manual playtest: sail → find each boss → intro → fight 3 fish → victory → rewards → save → reload → boss gone

## Observability / Diagnostics

- Runtime signals: `console.log` for boss ship spawn positions, encounter trigger, defeat persistence
- Inspection surfaces: `window.game.registry.get('defeatedBosses')` via browser console or Playwright `page.evaluate`
- Failure visibility: boss encounter uses same `scene.launch`/`scene.resume` pattern as beach battles — existing battle error logging covers failures
- Redaction constraints: none

## Integration Closure

- Upstream surfaces consumed: `buildBossParty()` and `resolveSpeciesId()` from `enemy-db.ts` (S01), BattleScene `enemyParty`/`isBoss` interface (S01)
- New wiring introduced: SailingScene → boss proximity → intro overlay → `scene.launch('Battle')` → `scene.resume('Sailing')` → victory/rewards → SaveData persistence
- What remains before the milestone is truly usable end-to-end: nothing — this is the final slice

## Tasks

- [x] **T01: Place boss ships on sailing map with patrol and approach detection** `est:1h30m`
  - Why: Foundation for all boss encounters — ships need to exist on the map, move around, show on minimap, and detect player proximity. Also extends SaveData for defeated boss tracking since filtering depends on it.
  - Files: `src/scenes/SailingScene.ts`, `src/systems/SaveSystem.ts`, `src/data/enemy-db.ts`
  - Do: Add `defeatedBosses: string[]` to SaveData interface with backward-compat default in `loadGame()`. In SailingScene `create()`, spawn boss ship sprites (ship-05 for Barnacle near Coral Atoll, ship-12 for Ironhook near Skull Island, ship-18 for Dread Corsair near Storm Reef) filtered by registry `defeatedBosses`. Add simple linear patrol between 2 waypoints using `Phaser.Math.Linear` per frame. Add red dots on minimap for boss ships. Add `checkBossProximity()` modeled after `checkDockProximity()` — distance check against each boss ship using enemy-db `aggroRadius`. When within range, set `nearestBoss` reference (consumed by T02). Apply `setTint()` and scale from enemy-db `shipColor`/`shipScale`. Depth sort boss ships below HUD. No colliders — distance-only detection like dock tips.
  - Verify: `npx tsc --noEmit`, visual confirmation that boss ships appear and move on sailing map
  - Done when: 3 boss ships patrol near their islands, appear as red dots on minimap, `checkBossProximity()` sets `nearestBoss` when player is within aggro range, defeated bosses are filtered out

- [x] **T02: Boss intro overlay, battle launch, and SailingScene resume** `est:1h30m`
  - Why: The encounter chain — what happens when you approach a boss. This is the riskiest task because it crosses the SailingScene → BattleScene boundary and requires a new onResume handler.
  - Files: `src/scenes/SailingScene.ts`, `src/ui/UIFactory.ts`
  - Do: When `checkBossProximity()` detects a boss and player presses SPACE/tap, freeze ship movement, show intro overlay: dark bg (0x000000, 0.85 alpha), boss ship sprite (scaled), captain name (PixelPirate font), taunt dialogue with typewriter effect, "FIGHT!" button (or SPACE/tap to continue). On dismiss: `scene.launch('Battle', { enemyName, enemyParty: buildBossParty(template), isBoss: true, returnScene: 'Sailing' })` + `scene.pause()`. Add `this.events.on('resume', this.onResume, this)` in `create()`. `onResume(_, data)` handler: fade-in camera, reset `transitioning`, check if returning from a boss battle via a flag, trigger T03's victory flow. Mobile: tap anywhere dismisses intro overlay; all overlay buttons have 64px minimum targets.
  - Verify: `npx tsc --noEmit`, approach boss → intro shows → SPACE launches battle → battle ends → SailingScene resumes with fade-in
  - Done when: Full encounter chain works: approach → intro → battle → resume. SailingScene doesn't break on resume. Mobile touch triggers work.

- [ ] **T03: Victory rewards, defeat persistence, and smoke test** `est:1h`
  - Why: Closes the loop — defeating a boss must grant rewards, persist across save/load, and be verified by automated test. This is the milestone completion task.
  - Files: `src/scenes/SailingScene.ts`, `src/systems/SaveSystem.ts`, `src/scenes/MainMenuScene.ts`, `src/scenes/BeachScene.ts`, `e2e/bug-audit.spec.ts`
  - Do: In `onResume`, after boss battle victory: show wood-panel victory overlay (captain name + "DEFEATED!", item rewards list with icons from item-db, SPACE/tap dismiss). Add items to inventory registry. Push boss template ID to registry `defeatedBosses` array. Remove defeated boss ship sprite + minimap dot. Add `saveBossDefeat()` helper in SaveSystem that patches existing save with updated `defeatedBosses` and inventory (doesn't need player position). Wire `saveFromScene()` to include `defeatedBosses` in save data for auto-save compat. Verify `loadGame()` restores `defeatedBosses` to registry on game start. Add Playwright smoke test: boot → new game → pick starter → warp to Sailing → verify boss ships exist → trigger boss encounter via `page.evaluate()` → confirm battle launches with `isBoss: true` and 3-fish party → confirm `returnScene` is 'Sailing'.
  - Verify: `npx tsc --noEmit`, `npm run smoke` all green including new boss test
  - Done when: Victory overlay shows rewards, items added to inventory, boss doesn't reappear after defeat, save/load round-trip preserves defeated state, new smoke test passes, all existing tests pass

## Files Likely Touched

- `src/scenes/SailingScene.ts`
- `src/systems/SaveSystem.ts`
- `src/data/enemy-db.ts`
- `src/ui/UIFactory.ts`
- `src/scenes/MainMenuScene.ts`
- `src/scenes/BeachScene.ts`
- `e2e/bug-audit.spec.ts`
