# M002: Boss Battles

**Vision:** Players can fight multi-fish boss captains in the sailing world, giving the game real progression stakes and a difficulty curve beyond beach grind.

## Success Criteria

- Player encounters a boss captain ship while sailing and triggers a boss fight
- Boss intro shows captain name, ship, and taunt dialogue before battle
- BattleScene handles 3-fish enemy parties — when one faints, the next enters with a transition
- Existing single-fish battles (beach enemies, wild fish) work exactly as before
- All 3 bosses (Barnacle lv7-9, Ironhook lv10-12, Dread Corsair lv13-15) are fightable
- Defeating a boss grants rewards and marks them as beaten
- Boss defeat state persists across save/load — beaten bosses don't respawn

## Key Risks / Unknowns

- Multi-fish party flow — core battle loop only handles 1 enemy fish today
- Species data gap — 2 of 9 boss fish species don't exist in fish-db

## Proof Strategy

- Multi-fish party → retire in S01 by proving BattleScene cycles through 3 enemy fish in sequence without breaking single-fish battles
- Species gap → retire in S01 by adding or remapping the 2 missing species

## Verification Classes

- Contract verification: `npx tsc --noEmit`, `npm run smoke` (38+ tests)
- Integration verification: trigger boss from SailingScene, fight all 3 fish, return to sailing
- Operational verification: save after boss defeat, reload, boss is still defeated
- UAT / human verification: Will playtests all 3 boss fights end-to-end

## Milestone Definition of Done

This milestone is complete only when all are true:

- All slices complete with passing verification
- All 3 bosses fightable from sailing scene
- Multi-fish party works without breaking existing beach/wild battles
- Boss defeat persists across save/load
- `npx tsc --noEmit` clean, `npm run smoke` all green
- Manual playthrough: sail → find boss → intro → fight 3 fish → victory → rewards → save → reload → boss gone

## Requirement Coverage

- Covers: Phase 9 Boss Battles
- Partially covers: none
- Leaves for later: M003 (battle juice), M004 (SFX), M005 (fishing depth), M006 (island scenes)
- Orphan risks: none

## Slices

- [x] **S01: Multi-Fish Battle Engine** `risk:high` `depends:[]`
  > After this: BattleScene handles N-fish enemy parties — when enemy fish faints, next one enters with a transition. Single-fish battles still work. 2 missing boss species added to fish-db. Provable via smoke test launching a 3-fish battle.

- [ ] **S02: Boss Ships in Sailing** `risk:medium` `depends:[S01]`
  > After this: 3 boss captain ships patrol the sailing world near their islands. Player can approach a boss ship to trigger the boss fight. Boss intro overlay shows captain name and taunt before battle starts.

- [ ] **S03: Victory, Rewards & Persistence** `risk:low` `depends:[S01,S02]`
  > After this: Defeating a boss grants item rewards, shows a victory screen, and marks the boss as beaten. Boss defeat state saved in SaveData. Beaten bosses don't appear on the sailing map. All 3 bosses playable end-to-end.

## Boundary Map

### S01 → S02

Produces:
- BattleScene accepts `enemyParty: FishInstance[]` with N fish and cycles through them on faint
- `isBoss?: boolean` flag in BattleData for boss-specific UI (no CATCH button, no flee)
- All 9 boss species have valid numeric speciesId entries in fish-db
- Enemy-db species string → numeric ID resolver utility

Consumes:
- nothing (first slice)

### S01,S02 → S03

Produces:
- Boss ships on sailing map with approach-to-trigger interaction (S02)
- Boss intro overlay with captain name/taunt (S02)
- Working multi-fish battle flow (S01)

Consumes:
- Multi-fish battle from S01
- Boss trigger mechanism from S02
