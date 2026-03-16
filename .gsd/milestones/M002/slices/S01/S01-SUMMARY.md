---
id: S01
parent: M002
milestone: M002
provides:
  - BattleScene handles N-fish enemy parties with sequential swap-in on faint
  - isBoss flag disables catch button for boss battles
  - Enemy party indicator (● ○ dots) for multi-fish battles
  - Shockjaw (id:62, Electric T2) and Depthwalker (id:63, Abyssal T2) species
  - resolveSpeciesId() and buildBossParty() utilities in enemy-db.ts
requires: []
affects:
  - S02 (boss ships use buildBossParty to create battle data)
  - S03 (victory flow uses afterEnemyDefeated path)
key_files:
  - src/scenes/BattleScene.ts
  - src/data/fish-db.ts
  - src/data/enemy-db.ts
  - e2e/bug-audit.spec.ts
key_decisions:
  - Multi-fish uses enemyPartyIndex advancing through existing enemyParty array
  - afterEnemyDefeated() is the single gate: checks for next fish OR calls endBattle
  - Evolution sequence also routes through afterEnemyDefeated (not endBattle directly)
  - Boss species share sprites with existing fish (no free sprite slots)
  - Enemy party indicator uses ● (alive) and ○ (fainted) dots below enemy HP card
patterns_established:
  - afterEnemyDefeated() pattern — all enemy defeat paths converge here
  - buildBossParty() — converts enemy-db templates to FishInstance[] for BattleScene
observability_surfaces:
  - enemyPartyIndicator text visible in battle UI
  - Smoke test verifies 3-fish battle launches with correct party length
duration: ~40min
verification_result: passed
completed_at: 2026-03-15
---

# S01: Multi-Fish Battle Engine

**BattleScene now handles N-fish enemy parties. When an enemy fish faints, the next slides in from the right. Single-fish battles unchanged.**

## What Happened

Added `enemyPartyIndex` tracker and `afterEnemyDefeated()` gate method. When an enemy fish faints, instead of always calling `endBattle(true)`, the battle checks if more fish remain. If yes, `sendNextEnemyFish()` rebuilds the enemy shape with a slide-in animation from the right, resets status, and returns to `player_pick` phase. If no, calls `endBattle(true)` as before.

The evolution sequence's completion also routes through `afterEnemyDefeated()` — if the player's fish evolves mid-boss-fight, the next enemy fish still enters correctly afterward.

Added `isBoss` flag to `BattleInit` interface. Currently used to disable catch button (wild fish only). Boss battles have `isWildFish: false, isBoss: true`.

Added enemy party indicator (● ○ dots) below the enemy HP card, visible when `enemyParty.length > 1`.

Added 2 missing species to fish-db: Shockjaw (id:62, Electric tier 2, `thunder_fang`/`surge_strike`/`static_shock`/`lightning_lash`) and Depthwalker (id:63, Abyssal tier 2, `shadow_bite`/`void_pulse`/`abyss_drain`/`dread_gaze`). Both share sprites with existing fish (no free sprite grid slots).

Added `resolveSpeciesId()` (string name → numeric ID) and `buildBossParty()` (EnemyTemplate → FishInstance[]) utilities to enemy-db.ts for S02 consumption.

Fixed existing battle smoke test — was passing `enemyFish` instead of `enemyParty` format.

## Verification

- `npx tsc --noEmit` — zero errors
- 39/39 smoke tests pass (new multi-fish boss battle test included)
- New test confirms: Battle scene active, party indicator present, enemy party length = 3

## Files Created/Modified

- `src/data/fish-db.ts` — added Shockjaw (id:62) and Depthwalker (id:63)
- `src/data/enemy-db.ts` — added resolveSpeciesId(), buildBossParty(), FISH_SPECIES import
- `src/scenes/BattleScene.ts` — enemyPartyIndex, isBoss, afterEnemyDefeated(), sendNextEnemyFish(), updateEnemyPartyIndicator(), party indicator UI
- `e2e/bug-audit.spec.ts` — fixed battle test format, added multi-fish boss battle test

## Forward Intelligence

### What the next slice should know
- `buildBossParty(template)` returns `FishInstance[]` ready for BattleScene's `enemyParty`
- Launch boss battle with: `scene.start('Battle', { enemyName, enemyParty, returnScene, isBoss: true })`
- `afterEnemyDefeated()` is the single convergence point after any enemy defeat — S03 victory rewards should hook here

### What's fragile
- The `sendNextEnemyFish()` method destroys and rebuilds `enemyShape` — if BattleScene adds more refs to the enemy shape container (e.g. for M003 battle juice), those need to be cleaned up too
- `enemySpriteKey` is only used for the first enemy fish — subsequent boss fish use standard fish sprites from fish-db
