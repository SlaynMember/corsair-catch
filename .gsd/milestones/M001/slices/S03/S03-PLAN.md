# S03: Data Integrity & Balance

**Goal:** All fish species have valid data, starters are balanced, fishing zones reference valid species.
**Demo:** Pick Water or Nature starter → can win early battles. No "???" fish names anywhere.

## Must-Haves

- Water starter (Frost Carp) has offensive move (bubble_burst) and 58 ATK
- Nature starter (Sea Moss) has offensive move (thorn_wrap) and 58 ATK
- All 61 species have spriteGrid, spriteIndex, type, name, moves
- All fishing zone textureKeys map to valid species
- All evolution targets reference existing species IDs
- Missing species id:57 (Lantern Angler) added to fill data gap

## Verification

- `npx tsc --noEmit` — zero errors
- `npm run smoke` — all tests pass (includes fish sprite audit)
- Node data integrity script confirms all fields present, all references valid

## Tasks

- [x] **T01: Balance Water & Nature starters** `est:10m`
  - Frost Carp: aqua_shield → bubble_burst, ATK 50 → 58
  - Sea Moss: reef_barrier → thorn_wrap, ATK 50 → 58

- [x] **T02: Fix fish data gaps** `est:15m`
  - Added Lantern Angler (id:57, Abyssal tier 2, spriteGrid:3, spriteIndex:0)
  - Fixes fishing zone coral_reef referencing fish-3-00 with no matching species
  - Verified all 61 species have required fields, all moves exist, all evo targets valid

## Files Likely Touched

- `src/data/fish-db.ts`
