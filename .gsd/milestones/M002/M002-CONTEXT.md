# M002: Boss Battles

**Gathered:** 2026-03-15
**Status:** Ready for planning

## Project Description

Corsair Catch is a Pokémon Diamond-style pirate RPG in Phaser 3. Players catch fish, battle enemies, and sail between islands. The battle system supports 1v1 turn-based combat but currently only handles single-fish enemies. Boss captains with multi-fish parties are defined in `enemy-db.ts` but not wired into gameplay.

## Why This Milestone

The game currently has no end-goal or difficulty spikes. Beach enemies (crabs, gulls, jellies, hermits, pirates) are all single-fish encounters that become trivial after a few levels. Boss battles give players a reason to build a strong team, explore fishing zones for better fish, and progress through the world. The 3 boss captains (Barnacle lv7-9, Ironhook lv10-12, Dread Corsair lv13-15) provide the backbone of the game's difficulty curve.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Encounter boss captains in the sailing world or on specific islands
- Fight multi-fish boss parties (3 fish each, escalating difficulty)
- See a boss intro screen before the battle starts
- Win rewards for defeating each boss (items, new fishing zones, story progression)

### Entry point / environment

- Entry point: http://localhost:3000 (Vite dev) or corsair-catch-demo.netlify.app
- Environment: browser (desktop + mobile)
- Live dependencies involved: none

## Completion Class

- Contract complete means: BattleScene handles multi-fish parties, boss data maps to valid fish species, tsc clean, smoke tests pass
- Integration complete means: player can trigger a boss fight from the sailing scene or island, battle all 3 enemy fish in sequence, and return to overworld on victory
- Operational complete means: boss defeat state persists across save/load

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Sail to a boss captain's patrol area, trigger the boss fight, defeat all 3 of their fish in sequence, receive victory rewards, and return to the sailing scene
- Boss defeat state persists: after beating a boss and reloading, the boss does not respawn (or is marked as defeated)
- All 3 bosses can be fought and beaten with a well-leveled party

## Risks and Unknowns

- **Multi-fish battle flow** — BattleScene currently only uses `enemyParty[0]`. Adding "send next fish" logic touches the core battle loop and could break existing single-fish battles.
- **Enemy-db species mapping** — enemy-db uses string species names, BattleScene uses numeric speciesId. 2 of 9 boss species (`shockjaw`, `depthwalker`) have no match in fish-db.
- **Boss trigger location** — Unclear whether bosses should be on islands, in sailing, or both. Sailing has waypoints defined but no aggro/interaction system yet.

## Existing Codebase / Prior Art

- `src/data/enemy-db.ts` — 3 boss templates with string speciesId, patrol waypoints, aggro radius
- `src/scenes/BattleScene.ts` — Turn-based battle, receives `enemyParty: FishInstance[]` but only uses index 0
- `src/scenes/SailingScene.ts` — 4000×4000 ocean, 5 islands, ship movement, minimap, compass
- `src/data/fish-db.ts` — 61 species with numeric IDs, stats, moves, evolution chains
- `src/data/beach-enemies.ts` — Beach enemy system with sprite keys, stats, aggro, patrol patterns

## Relevant Requirements

- Phase 9 item 1 (Boss battles — enemy captains from enemy-db.ts)

## Scope

### In Scope

- Multi-fish enemy party support in BattleScene (next fish on faint)
- Fix enemy-db species mapping (add missing species or remap to existing ones)
- Boss encounter trigger from SailingScene (ship-to-ship approach)
- Boss intro screen (name, portrait, taunt dialogue)
- Victory rewards (items, registry flag for boss defeated)
- Boss defeat persistence in save system
- All 3 bosses playable end-to-end

### Out of Scope / Non-Goals

- Battle visual juice (hit flash, shake, particles) — that's M003
- Sound effects — that's M004
- Island-specific scenes — that's M006
- New fish species beyond filling the 2 missing boss references
- Boss respawn/rematch system (beaten = beaten for now)

## Technical Constraints

- Phaser 3 + TypeScript, no other engines
- BattleScene changes must not break existing beach enemy battles or wild fish battles
- Save system changes must be backward-compatible (old saves without boss data should still load)
- Zero gravity, pixel art, 1280×720 resolution

## Integration Points

- `SailingScene` — boss ships appear on the ocean, player approaches to trigger
- `BattleScene` — receives multi-fish party, handles sequential enemy swaps
- `SaveSystem` — persists boss defeat flags
- `fish-db.ts` — may need 2 new species (Shockjaw, Depthwalker) or remap to existing ones

## Open Questions

- Where exactly do bosses appear? On islands? Sailing? Both? — Current thinking: sailing scene, near specific islands. Captain Barnacle near Coral Atoll, Admiral Ironhook near Skull Island, Dread Corsair roaming open ocean.
- Should the player be able to re-fight bosses? — Current thinking: no, beaten = beaten. Maybe add rematches later.
- What rewards for beating each boss? — Current thinking: rare items + unlock next fishing zone tier.
