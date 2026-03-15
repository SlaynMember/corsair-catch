---
id: S03
parent: M001
milestone: M001
provides:
  - Balanced Water and Nature starters with offensive moves
  - Lantern Angler species (id:57) filling data gap
  - All fishing zone references now map to valid species
requires:
  - slice: S01
    provides: Working scene transitions for spawn testing
affects:
  - S04
key_files:
  - src/data/fish-db.ts
key_decisions:
  - Water starter gets bubble_burst (50 power, 100 acc) — reliable but slightly weaker than flame_jet (60 power)
  - Nature starter gets thorn_wrap (55 power, 90 acc) — slightly higher power but less accurate
  - Both starters ATK bumped to 58 (was 50) — still below Fire's 65 but playable
  - Lantern Angler placed at id:57 as tier 2 Abyssal with void_pulse + abyss_drain
patterns_established:
  - Data integrity validation script pattern for checking species completeness
observability_surfaces:
  - none
drill_down_paths:
  - none (two small data changes)
duration: ~15min
verification_result: passed
completed_at: 2026-03-15
---

# S03: Data Integrity & Balance

**Balanced Water/Nature starters, added missing Lantern Angler species, verified all fish data integrity.**

## What Happened

BUG-04 (starter balance): Frost Carp (Water starter, id:5) had aqua_shield (status move, 0 power) as its only non-tackle move, making early battles nearly unwinnable. Changed to bubble_burst (50 power, 100 acc Water special) and bumped ATK from 50 → 58. Sea Moss (Nature starter, id:12) had reef_barrier (status, 0 power) — changed to thorn_wrap (55 power, 90 acc Nature physical) with same ATK bump. Both starters now have offensive STAB moves comparable to Ember Snapper's flame_jet (60 power, 65 ATK).

BUG-06 (fish data): Ran comprehensive data audit. Found 60 species with all required fields. One fishing zone (coral_reef) referenced texture key `fish-3-00` which had no matching species — the Lantern Angler from sprite sheet 3 was never added to fish-db. Created it at id:57 (the one gap in the ID sequence) as a tier 2 Abyssal with void_pulse + abyss_drain moves. After fix: 61 species, all zone references valid, all evolution targets valid, all moves exist.

BUG-08 (Beach3 spawn): Already fixed in S01 — to-beach1 zone positions player on right side of Beach3. No additional work needed.

## Verification

- `npx tsc --noEmit` — zero errors
- All 38 smoke tests pass (includes fish sprite audit test)
- Node data integrity script: 61 species, 47 texture keys, 0 missing zone references, 0 broken evolution chains

## Requirements Advanced

- R006 (fish data integrity) — all 61 species have valid names, types, sprites, moves
- R007 (starter balance) — Water and Nature starters now have offensive moves and comparable ATK
- R008 (Beach3 spawn) — was already fixed in S01, verified still working

## Requirements Validated

- R006 — node audit script proves all fields present, all references valid
- R007 — Frost Carp: bubble_burst (50 power) + 58 ATK. Sea Moss: thorn_wrap (55 power) + 58 ATK
- R008 — S01 fix confirmed in code

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- none

## Known Limitations

- 61 species total (not 62 as CLAUDE.md claims) — the discrepancy was there before; now all IDs 1-61 are filled

## Follow-ups

- none

## Files Created/Modified

- `src/data/fish-db.ts` — balanced starters, added Lantern Angler (id:57)

## Forward Intelligence

### What the next slice should know
- All species now have valid data — fish catch overlay (S04) can safely render any species
- The 3 starters are: Ember Snapper (id:1, Fire), Frost Carp (id:5, Water), Sea Moss (id:12, Nature)

### What's fragile
- The fishing zone system uses textureKey strings ('fish-{grid}-{index}') not speciesId — the catch handler in BeachScene must map textureKey back to species for the fish instance

### Authoritative diagnostics
- Smoke test `Fish Sprite Audit › All 62 fish species have spriteGrid and spriteIndex` validates sprite data

### What assumptions changed
- BUG-06 scope was smaller than expected — only 1 species was truly missing (Lantern Angler). The "???" display bug may be a rendering issue in BattleScene for beach enemies (speciesId:0 sentinel), not a data issue.
