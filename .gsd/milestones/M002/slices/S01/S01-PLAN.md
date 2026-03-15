# S01: Multi-Fish Battle Engine

**Goal:** BattleScene handles N-fish enemy parties. When an enemy fish faints, the next one enters. Single-fish battles still work unchanged.
**Demo:** Launch a 3-fish battle via smoke test. Defeat fish 1 → fish 2 enters → defeat it → fish 3 enters → defeat → victory. Also run existing single-fish battles to prove no regression.

## Must-Haves

- BattleScene tracks `enemyPartyIndex` and advances through `enemyParty[]` on faint
- "Send next fish" transition: enemy faint → brief pause → new fish slides in → HP bar resets
- Enemy party indicator (e.g. "Fish 2/3") in the enemy info area
- `isBoss` flag in BattleInit: disables CATCH button and flee
- 2 missing boss species added to fish-db (Shockjaw, Depthwalker)
- Enemy-db species string→numeric ID resolver
- Single-fish battles (beach enemies, wild fish) work exactly as before

## Verification

- `npx tsc --noEmit` — zero errors
- `npm run smoke` — all existing tests pass
- New smoke test: launch 3-fish battle, verify all 3 are fought in sequence

## Tasks

- [x] **T01: Add missing species + enemy-db resolver** `est:15m`
- [x] **T02: Multi-fish enemy party flow in BattleScene** `est:30m`
- [x] **T03: Boss flag (no catch, no flee) + enemy party indicator** `est:15m`
- [x] **T04: Verify + smoke test** `est:15m`

## Files Likely Touched

- `src/data/fish-db.ts` — add Shockjaw, Depthwalker species
- `src/data/enemy-db.ts` — add resolver function, fix speciesId to numeric
- `src/scenes/BattleScene.ts` — multi-fish party flow, isBoss flag, party indicator
- `e2e/bug-audit.spec.ts` — new smoke test for multi-fish battle
