# M001: Playtest Bug Fix Pass

**Vision:** Fix all 16 playtest bugs so the game is stable enough for the next round of playtesting and content expansion.

## Success Criteria

- Player walks all 3 beaches without hitting invisible walls or transition loops
- All enemy types (crabs, gulls, jellies, hermits, pirates) render and fight correctly
- Battle TEAM/ITEMS panels are interactive, CATCH button fits the UI
- HUD buttons appear on all 3 beaches
- All 62 fish show correct names, types, and sprites — no "???"
- Water and Nature starters can win early battles (have offensive moves)
- Items persist across browser refresh; fishing requires a rod
- A "CAUGHT!" overlay shows fish details after catching
- TMX debug overlay available via `?debug=1`
- Mobile detection doesn't false-positive on desktop touch screens

## Key Risks / Unknowns

- TMX bounds alignment — Will redrew in Tiled, need to verify at runtime
- Pirate battle black screen — unknown root cause (texture? animation? launch data?)

## Proof Strategy

- TMX alignment → retire in S01 by proving debug overlay matches visual expectations and player walks cleanly
- Pirate battle → retire in S01 by proving BattleScene renders enemy sprite for evil-pirate type

## Verification Classes

- Contract verification: `npx tsc --noEmit`, `npm run smoke` (38 tests)
- Integration verification: beach transitions work bidirectionally, battle → overworld round-trips
- Operational verification: save/load preserves items, rod, collected-items state
- UAT / human verification: Will playtests all 3 beaches with `?debug=1` overlay

## Milestone Definition of Done

This milestone is complete only when all are true:

- All 4 slices complete with passing verification
- All 16 bugs from BUGS.md verified fixed
- `npx tsc --noEmit` clean, `npm run smoke` all green
- Manual playthrough: new game → starter → walk all beaches → fish → battle → catch → save → reload → continue
- No console errors during normal gameplay

## Requirement Coverage

- Covers: R001, R002, R003, R004, R005, R006, R007, R008, R009, R010, R011, R012, R013, R017, R018
- Partially covers: none
- Leaves for later: R014 (battle juice), R015 (fishing depth), R016 (shell overlap)
- Orphan risks: none

## Slices

- [x] **S01: Blockers — Transitions, Collisions & Pirate Battles** `risk:high` `depends:[]`
  > After this: player walks all 3 beaches cleanly, pirate battles render, TMX debug overlay works, dialogue is correct
- [x] **S02: Battle UI & HUD Parity** `risk:medium` `depends:[S01]`
  > After this: TEAM/ITEMS panels work in battle, CATCH button fits, HUD on all beaches, mobile detection fixed
- [x] **S03: Data Integrity & Balance** `risk:low` `depends:[S01]`
  > After this: all 62 fish have valid data, starters are balanced, Beach3 spawns correctly
- [ ] **S04: Progression & Polish** `risk:low` `depends:[S01,S02,S03]`
  > After this: items persist, fishing requires rod, catch overlay shows fish details

## Boundary Map

### S01 → S02

Produces:
- Working TMX collision system with debug overlay (`?debug=1`)
- Fixed transition cooldown pattern (time-based + spawn offset)
- Working pirate battle sprite rendering in BattleScene
- Correct dialogue text in Beach2Scene

Consumes:
- nothing (first slice)

### S01 → S03

Produces:
- Stable scene transitions (Beach3 spawn uses TMX `to-beach1` zone position)

Consumes:
- nothing (first slice)

### S01,S02,S03 → S04

Produces:
- Working HUD system on all beaches (S02)
- Valid fish data for all 62 species (S03)
- Battle TEAM/ITEMS panels for item integration (S02)

Consumes:
- HUD from S02 (for item feedback)
- Fish data from S03 (for catch overlay)
