---
estimated_steps: 7
estimated_files: 3
---

# T03: Victory Rewards, Defeat Persistence, and Smoke Test

**Slice:** S03 — Boss Ships, Intro & Rewards
**Milestone:** M002

## Description

Close the boss encounter loop: after defeating a boss, show a victory overlay with item rewards, persist the defeat to SaveData, remove the boss from the map, and verify the full flow with a Playwright smoke test. This is the milestone completion task.

## Steps

1. In SailingScene `onResume()`, when `pendingBossDefeat` is set (victory): show a victory overlay. Build a wood-panel container (UIFactory `createWoodPanel` or hand-built): captain name + "DEFEATED!" header (PixelPirate, gold), list of reward items with emoji icons from item-db, "CONTINUE" button or SPACE/tap dismiss. Rewards per boss:
   - Captain Barnacle: 3× Grog Potion (`small_potion`), 1× Antidote (`antidote`)
   - Admiral Ironhook: 2× Captain's Rum (`big_potion`), 1× Revive (`revive`)
   - Dread Corsair: 3× Captain's Rum (`big_potion`), 2× Revive (`revive`)

2. On victory overlay dismiss: add reward items to `inventory` registry (increment counts). Push boss template ID to `defeatedBosses` registry array. Clear `pendingBossDefeat`.

3. Remove defeated boss's ship sprite and minimap dot from the scene. Destroy the sprite, remove from `bossShips` array (or mark as defeated so `checkBossProximity` skips it).

4. Add `saveBossDefeat()` function to SaveSystem: loads current save, patches `defeatedBosses` and `inventory` from registry, saves back. Call this after boss defeat is processed. This avoids needing player position (meaningless in sailing).

5. Ensure `defeatedBosses` is restored to registry on game load. Two paths need updating:
   - `MainMenuScene` CONTINUE flow (line ~194): after `registry.set('inventory', save.inventory)`, add `registry.set('defeatedBosses', save.defeatedBosses ?? [])`
   - `BeachScene.restoreFromSave()` (line ~1812): add `registry.set('defeatedBosses', save.defeatedBosses ?? [])` alongside other registry restorations
   - NEW GAME flow in MainMenuScene: add `registry.remove('defeatedBosses')` or `registry.set('defeatedBosses', [])` to clear state

6. Verify backward compatibility: old saves without `defeatedBosses` field load cleanly (null-coalesce to `[]`).

7. Add Playwright smoke test in `e2e/bug-audit.spec.ts` — "Boss encounter launches from SailingScene":
   - Boot → new game → pick starter → warp to Sailing via `page.evaluate`
   - Verify boss ships exist: `game.scene.getScene('Sailing')` has boss ship refs
   - Trigger boss encounter programmatically: set player ship near Barnacle, call encounter trigger
   - Confirm Battle scene launches with `isBoss: true` and `enemyParty.length === 3`
   - Confirm `returnScene` is `'Sailing'`

## Must-Haves

- [ ] Victory overlay shows boss name + "DEFEATED!" + reward items with icons
- [ ] Reward items added to inventory registry on dismiss
- [ ] Boss template ID pushed to `defeatedBosses` registry array
- [ ] Defeated boss ship + minimap dot removed from scene
- [ ] `saveBossDefeat()` persists defeat to localStorage
- [ ] `loadGame()` restores `defeatedBosses` to registry (backward compat with `[]` default)
- [ ] Playwright smoke test passes: boss encounter from sailing → 3-fish battle with isBoss
- [ ] `npx tsc --noEmit` clean, `npm run smoke` all green

## Verification

- `npx tsc --noEmit` — zero type errors
- `npm run smoke` — all existing tests pass + new boss encounter test
- Manual: defeat a boss → save → refresh → boss gone from map → load save → boss still gone
- Manual: check inventory has reward items after boss defeat

## Inputs

- `src/scenes/SailingScene.ts` — `pendingBossDefeat` flag from T02, `bossShips` array from T01, `onResume()` from T02
- `src/systems/SaveSystem.ts` — `SaveData` with `defeatedBosses` from T01
- `src/data/item-db.ts` — item IDs and names for reward display
- `src/data/enemy-db.ts` — template IDs for defeat tracking

## Expected Output

- `src/scenes/SailingScene.ts` — victory overlay, reward granting, boss removal, save trigger
- `src/systems/SaveSystem.ts` — `saveBossDefeat()` function
- `src/scenes/MainMenuScene.ts` — `defeatedBosses` registry restoration on CONTINUE + clear on NEW GAME
- `src/scenes/BeachScene.ts` — `defeatedBosses` registry restoration in `restoreFromSave()`
- `e2e/bug-audit.spec.ts` — new boss encounter smoke test
