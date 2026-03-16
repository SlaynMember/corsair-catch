# S03: Boss Ships, Intro & Rewards — Research

**Date:** 2026-03-16
**Slice:** M002/S03

## Summary

S03 has four distinct subsystems to implement: (1) boss ship placement + approach detection in SailingScene, (2) boss intro overlay with captain name/ship/taunt, (3) wiring the approach → intro → battle flow, and (4) boss defeat rewards + persistence. The good news is that the hard parts — multi-fish battle engine and the `buildBossParty()` utility — are already done in S01. What remains is primarily new SailingScene content and a SaveData schema extension.

The SailingScene (1192 lines) has a clean structure: procedural ocean, 5 islands with dock interaction, WASD ship movement, minimap, and HUD. It already has a dock proximity system (`checkDockProximity()` with `DOCK_PROXIMITY = 80`) that we can model the boss encounter system after. The scene uses `scene.start()` transitions (not overlay), but beach battles use `scene.launch()` + `scene.pause()` — boss battles from sailing should use the same overlay pattern so the sailing world persists.

The main risk is the enemy-db patrol waypoints — they use a `z` axis (3D convention) at a different scale (±1500) from the 4000×4000 sailing world. Rather than mapping these, it's simpler to define fixed boss positions near their associated islands and add simple patrol movement. The existing `aggroRadius` values (200-300) are reasonable for the sailing world scale.

## Recommendation

Build this in 4 tasks:

1. **Boss ship objects on sailing map** — Add `EnemyTemplate` boss ships as visible sprites near associated islands (Barnacle near Coral Atoll, Ironhook near Skull Island, Dread Corsair roaming open ocean near Storm Reef). Simple patrol movement (linear between 2-3 waypoints). Ships use existing `ship-{NN}` sprites. Minimap shows boss ships as red dots. Boss ships filtered by `defeatedBosses` registry data.

2. **Boss intro overlay** — When player ship approaches within `aggroRadius`, pause movement, show a full-screen overlay: dark background, boss ship sprite, captain name (PixelPirate font), taunt dialogue line (typewriter effect), "FIGHT" button. Reuse `createWoodPanel`/`createOverlay` from UIFactory. Portrait: reuse `portrait-evil-pirate` for all 3 bosses (no unique boss portraits exist). Press SPACE/tap to begin battle.

3. **Battle launch + return flow** — Intro → `scene.launch('Battle', { enemyParty: buildBossParty(template), isBoss: true, returnScene: 'Sailing' })` + `scene.pause()`. On battle victory, `endBattle(true)` resumes SailingScene. Add an `onResume` handler in SailingScene (like beach scenes have) to mark boss as defeated, show victory overlay, and grant rewards.

4. **Defeat persistence + rewards** — Add `defeatedBosses: string[]` to SaveData (boss template IDs). Backward-compatible: `loadGame()` defaults missing field to `[]`. On boss defeat, push template ID to registry + SaveData. `saveFromScene()` needs a sailing-compatible variant or the sailing scene needs to trigger a save explicitly. Boss ships don't render when their ID is in `defeatedBosses`.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Multi-fish enemy party | `buildBossParty()` in enemy-db.ts | Already converts EnemyTemplate → FishInstance[] for BattleScene |
| Boss species resolution | `resolveSpeciesId()` in enemy-db.ts | Maps string names to numeric IDs |
| Battle launch pattern | `scene.launch('Battle', {...}) + scene.pause()` | Used by all 3 beach scenes, proven pattern |
| Wood-panel UI | `createWoodPanel()`, `createOverlay()`, `addCornerRivets()` in UIFactory.ts | Consistent pirate aesthetic, already built |
| Dock proximity pattern | `checkDockProximity()` + `DOCK_PROXIMITY` in SailingScene | Boss approach detection is the same concept — distance check + prompt |
| Resume from battle | `onResume()` pattern in BeachScene (line 470) | Fade-in, reset flags, show mobile buttons |
| Ship sprites | `ship-{00-19}.png` loaded in BootScene | 20 ships available, pick distinct ones per boss |

## Existing Code and Patterns

- `src/data/enemy-db.ts` — 3 boss templates with party, patrolWaypoints (IGNORE the waypoints — use island-relative positions instead), aggroRadius, shipColor, shipScale. `buildBossParty()` and `resolveSpeciesId()` ready to use.
- `src/scenes/SailingScene.ts` — `checkDockProximity()` (line ~850) is the blueprint for boss proximity. `dockAtIsland()` (line ~900) shows the transition pattern. `ISLANDS[]` array has position data for each island. The `update()` method runs movement → waves → dock check → labels → HUD → minimap — boss proximity check inserts naturally after dock check.
- `src/scenes/BattleScene.ts` — `init()` accepts `BattleInit { enemyName, enemyParty, returnScene, isBoss }`. `endBattle(true)` calls `scene.stop()` then `scene.resume(returnScene)`. `afterEnemyDefeated()` is the convergence point where rewards hook in.
- `src/systems/SaveSystem.ts` — `SaveData` interface needs `defeatedBosses: string[]`. `loadGame()` needs null-coalesce for backward compat. `saveFromScene()` gathers from registry — add `defeatedBosses` to the gather list.
- `src/ui/UIFactory.ts` — `createWoodPanel()`, `createOverlay()`, `addCornerRivets()`, `addPanelHeader()`, `createActionButton()` — all reusable for intro + victory overlays.
- `src/scenes/BeachScene.ts` — `talkOverlay` (line 1413) is the portrait dialogue pattern. `onResume()` (line 470) is the post-battle resume pattern. `triggerBattle()` (line 2340) is the battle launch pattern.

## Constraints

- **SailingScene uses `scene.start()`** — it's not an overlay scene. When launching battle FROM sailing, we need `scene.launch('Battle', data) + scene.pause()`, NOT `scene.start()`. The Battle's `endBattle(true)` calls `scene.resume(returnScene)` which requires the calling scene to be paused (not stopped).
- **No boss portraits exist** — Only 3 portraits in `public/sprites/portraits/`: pirate-talk, crab-man-talk, evil-pirate-talk. Boss intro must either reuse `portrait-evil-pirate` for all bosses or skip portraits and use ship sprites as the visual centerpiece instead.
- **Enemy-db patrol waypoints are unusable** — They use `{x, z}` in a ±1500 range, not the 4000×4000 `{x, y}` sailing world. Define new positions relative to island coordinates.
- **SaveData backward compatibility** — Old saves won't have `defeatedBosses`. `loadGame()` must default to `[]` when the field is missing.
- **`saveFromScene()` assumes a beach scene** — It reads `player.x/y` which is meaningless in sailing. Boss defeat should save via `saveGame()` directly with a modified SaveData, or we add a `saveBossDefeat()` helper that patches the existing save.
- **No CATCH button for bosses** — Already handled by `isBoss: true` in S01 (disables catch button).
- **No flee from boss battles** — `isBoss` should also disable the flee option (currently flee is not implemented, but if it gets added, bosses should block it).
- **Mobile parity** — Boss intro overlay needs tap-to-dismiss (SPACE equivalent). Boss ship encounter needs to work with joystick movement. All new UI needs 64px touch targets.
- **Boss ship sprite must not collide with existing ship collision** — Player ship already collides with `islandColliders` static group. Boss ships should be separate collision-less sprites with only distance-based proximity detection (like dock tips).

## Common Pitfalls

- **Scene lifecycle on resume** — SailingScene has no `onResume()` handler. If not added, the scene will resume in whatever state it was paused in (ship at last position, no fade-in, no boss-defeated cleanup). Must wire `this.events.on('resume', this.onResume, this)` in `create()`.
- **Boss ships reappearing after defeat** — If boss defeat is only tracked in registry (runtime), it'll reset on page refresh. Must persist to SaveData AND load into registry on game start. Double-check: `loadGame()` → restore `defeatedBosses` to registry, `create()` in SailingScene → filter boss ships by registry data.
- **`buildBossParty()` uses `Date.now()` in UIDs** — Each call generates fresh UIDs. This is fine but means boss party fish can't be tracked across battles (not needed for S03, but worth noting).
- **Battle scene reuse** — BattleScene is a singleton that gets `init()` called each time. The `init()` method resets all stale refs. This is safe for boss battles — no special handling needed.
- **Minimap dot stacking** — If boss ship dots overlap with island dots on the minimap, they'll be invisible. Use a different depth or ensure boss dots render on top.
- **Enemy-db `shipColor` is a tint** — Not a sprite index. Each boss template has `shipColor` (e.g. `0x1a0e08`) and `shipScale` (1.0-1.4). Apply these as `setTint()` and `setDisplaySize()` on the ship sprite.
- **Phaser container gotcha** — When building boss ship sprites with name labels, use `container.add([...])` explicitly. `this.add.text()` alone puts objects in scene world-space, not the container.

## Open Risks

- **Boss difficulty balance** — Barnacle (lv7-9), Ironhook (lv10-12), Dread Corsair (lv13-15). If player fish are underleveled, bosses may be impossible. No difficulty scaling or level recommendation UI planned. Mitigation: whiteout recovery already exists (heal to 50%), so losing isn't permanent.
- **SailingScene size** — Already 1192 lines. Adding boss ships + intro + resume + rewards could push it to ~1500+. If it gets unwieldy, consider extracting BossShipManager class, but don't preemptively split.
- **No victory SFX** — No dedicated victory/fanfare sound exists. Boss victory overlay will be silent unless we add a new sound or reuse sfx-levelup. Not a blocker, just polish gap.
- **Return position after boss battle** — When battle ends and SailingScene resumes, the player ship will be at the position where the boss encounter triggered. The boss ship should disappear (defeated), but the player might be in open water far from any island. This is fine — it's actually the expected behavior.
- **endBattle whiteout path** — If the player loses a boss fight, `endBattle(false)` stops the return scene and starts `'Beach'`. This means losing a boss fight warps you to Beach1, not back to sailing. This is probably fine for S03 (whiteout = safe zone). Could be confusing UX, but changing it risks breaking the existing whiteout system.

## Reward Design

Proposed rewards per boss (items added to inventory, stored in registry):

| Boss | Items | Registry Flag |
|------|-------|---------------|
| Captain Barnacle | 3× Grog Potion, 1× Antidote | `defeatedBosses: ['rival_captain']` |
| Admiral Ironhook | 2× Captain's Rum, 1× Revive | `defeatedBosses: [..., 'admiral_ironhook']` |
| Dread Corsair | 3× Captain's Rum, 2× Revive | `defeatedBosses: [..., 'dread_corsair']` |

These use existing items from item-db. No new item types needed.

## Boss Ship Positions (Proposed)

| Boss | Near Island | Ship Sprite | Position (wx, wy) | Patrol Radius |
|------|-------------|-------------|-------------------|---------------|
| Captain Barnacle | Coral Atoll (1800, 1200) | ship-05 | (1600, 1000) | 150px orbit |
| Admiral Ironhook | Skull Island (3200, 800) | ship-12 | (3000, 600) | 180px orbit |
| Dread Corsair | Storm Reef (600, 600) | (ship-18) | (900, 400) | 250px orbit |

Ship sprite indices chosen for visual variety — can be adjusted.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Phaser 3 | `chongdashu/phaserjs-tinyswords@phaser-gamedev` | available (477 installs) |
| Playwright | `currents-dev/playwright-best-practices-skill@playwright-best-practices` | available (10.7K installs) |

## Sources

- SailingScene.ts (1192 lines) — full read, dock proximity pattern, island data, update loop structure
- BattleScene.ts — BattleInit interface, endBattle flow, afterEnemyDefeated convergence point
- enemy-db.ts — 3 boss templates, buildBossParty(), resolveSpeciesId()
- SaveSystem.ts — SaveData schema, saveFromScene pattern, loadGame validation
- UIFactory.ts — createWoodPanel, createOverlay, addCornerRivets for consistent pirate UI
- BeachScene.ts — triggerBattle pattern, onResume pattern, talkOverlay portrait pattern
- item-db.ts — 5 existing items available for rewards
- ship-db.ts — 20 ships with spriteIndex for boss ship visuals
