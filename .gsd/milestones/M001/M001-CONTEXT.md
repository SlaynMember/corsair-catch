# M001: Playtest Bug Fix Pass

**Gathered:** 2026-03-15
**Status:** Ready for execution

## Project Description

Corsair Catch is a browser-based pirate RPG (Pokémon clone at sea) built with Phaser 3 + TypeScript. After completing Phases 1-8, a playtest revealed 16 bugs ranging from blockers to polish items.

## Why This Milestone

Post-playtest stabilization. 4 blockers prevent normal gameplay, 6 high-priority bugs break core loops (battle UI, fishing, data integrity). The game can't ship or be meaningfully playtested again until these are resolved.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Walk between all 3 beaches without getting stuck or looping
- Fight all enemy types (including pirates) with working battle UI
- Use TEAM/ITEMS panels in battle, catch fish with properly sized CATCH button
- See correct fish names/types/sprites everywhere (no "???")
- Retain items and progress across refresh
- Fish only when holding a rod
- See what fish they caught after catching it

### Entry point / environment

- Entry point: `http://localhost:3000` or `corsair-catch-demo.netlify.app`
- Environment: browser (desktop + mobile)
- Live dependencies involved: none (all client-side)

## Completion Class

- Contract complete means: smoke tests pass, tsc clean, no console errors
- Integration complete means: all 3 beach transitions work bidirectionally, battle → overworld round-trips work
- Operational complete means: save/load preserves all new state (items, rod)

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- A full playthrough loop: new game → pick starter → walk all 3 beaches → fish → battle → catch → save → reload → continue
- All 16 bugs verified fixed via manual playtest or smoke test

## Risks and Unknowns

- TMX collision bounds — Will edited in Tiled, need to verify alignment with game rendering
- Pirate battle black screen — could be missing texture loading, animation key mismatch, or scene launch data

## Existing Codebase / Prior Art

- `src/systems/TMXLoader.ts` — parses TMX, returns typed zones; already handles rects and polygons
- `src/scenes/BeachScene.ts` — main beach with transitions, fishing, HUD
- `src/scenes/Beach2Scene.ts` — dock beach, transitions back to Beach1
- `src/scenes/Beach3Scene.ts` — pirate cove, cave, pirate duel NPC
- `src/scenes/BattleScene.ts` — turn-based combat, XP, evolution
- `src/data/fish-db.ts` — 62 fish species definitions
- `src/data/move-db.ts` — 50 battle moves
- `BUGS.md` — all 16 bugs with root cause analysis and fix plans

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R001–R013, R017–R018 — all 15 active requirements map to this milestone's 4 slices

## Scope

### In Scope

- All 16 playtest bugs (BUG-01 through BUG-16)
- TMX debug overlay for collision visualization
- Mobile detection fix (R017)

### Out of Scope / Non-Goals

- New features (boss battles, island scenes, weather)
- Battle visual juice beyond basic hit feedback (R014 deferred)
- Fishing minigame redesign (R015 deferred)
- Shell/rock z-order (R016 deferred)

## Technical Constraints

- Phaser 3 only, gravity 0,0, pixel art mode
- Must work on both desktop (keyboard) and mobile (touch)
- TMX files are the source of truth for collision/zone layout
- Never modify Will's hand-drawn sprites

## Integration Points

- TMX files (Will edits in Tiled → code reads at runtime)
- Phaser registry for cross-scene state
- localStorage for save/load persistence

## Open Questions

- None — all bugs have fix plans in BUGS.md
