# S01: Blockers — Transitions, Collisions & Pirate Battles

**Goal:** Fix the 4 blocker bugs plus dialogue accuracy — player can walk all 3 beaches cleanly, pirate battles render, TMX debug overlay available.
**Demo:** Walk Beach1→Beach2→Beach1→Beach3→Beach1 without looping. Trigger a pirate battle on Beach3, see the enemy render. Load `?debug=1` and see TMX zone overlays.

## Must-Haves

- Transition cooldown prevents oscillation loops (BUG-02)
- Pirate battles render enemy sprite (BUG-09)
- TMX debug overlay draws all zones with `?debug=1` (BUG-01/R011)
- Dialogue "back east" → "back west" (BUG-11/R013)
- TMX collision bounds from Will's Tiled edits work correctly at runtime

## Proof Level

- This slice proves: integration (scene transitions + battle rendering + TMX parsing)
- Real runtime required: yes (browser)
- Human/UAT required: yes (Will verifies debug overlay visually)

## Verification

- `npx tsc --noEmit` — zero errors
- `npm run smoke` — all existing tests pass
- Manual: walk all 3 beach transitions bidirectionally, no loops
- Manual: trigger pirate battle on Beach3, enemy sprite visible
- Manual: `?debug=1` shows colored zone overlays on all beaches

## Tasks

- [ ] **T01: Fix dialogue + verify TMX bounds alignment** `est:15m`
  - Why: BUG-11 is a 30-second fix. TMX bounds need runtime verification since Will redrew them.
  - Files: `src/scenes/Beach2Scene.ts`, `public/maps/*.tmx`
  - Do: Fix "back east" → "back west" in Beach2Scene dialogue. Start dev server, walk all beaches to verify TMX zones align with backgrounds. Check for invisible walls or unreachable areas.
  - Verify: grep confirms no "back east", dev server walkthrough has no invisible walls
  - Done when: dialogue correct, no collision anomalies on any beach

- [ ] **T02: Fix transition oscillation loop** `est:30m`
  - Why: BUG-02 blocker — walking between beaches causes infinite scene-swap loops
  - Files: `src/scenes/BeachScene.ts`, `src/scenes/Beach2Scene.ts`, `src/scenes/Beach3Scene.ts`
  - Do: Add time-based cooldown (500ms after scene create before any transition fires). Offset spawn positions away from transition zones by 40px+ into the walkable area. Ensure cooldown pattern is consistent across all 3 scenes.
  - Verify: walk Beach1→Beach2→Beach1→Beach3→Beach1 at least twice each direction
  - Done when: no oscillation in any transition direction

- [x] **T03: Fix pirate battle black screen** `est:45m`
  - Why: BUG-09 blocker — battles against Blackhand Pete show black screen
  - Files: `src/scenes/BattleScene.ts`, `src/scenes/BootScene.ts`, `src/data/beach-enemies.ts`
  - Do: Trace the battle launch data from Beach3 enemy collision → BattleScene. Verify evil-pirate texture keys are loaded in BootScene. Check BattleScene's enemy sprite rendering handles the pirate enemy type. Fix whatever breaks the render path.
  - Verify: trigger pirate battle on Beach3, enemy sprite and HP bar visible, battle completes
  - Done when: pirate battles render and play to completion

- [ ] **T04: Add TMX debug overlay** `est:45m`
  - Why: BUG-01/R011 — Will needs visual feedback to iterate on collision bounds in Tiled
  - Files: `src/systems/DebugOverlay.ts` (new), `src/scenes/BeachScene.ts`, `src/scenes/Beach2Scene.ts`, `src/scenes/Beach3Scene.ts`
  - Do: Create a debug overlay system that reads `?debug=1` from URL params. Draw colored semi-transparent rects for each TMX zone layer: red=colliders, green=walkable, blue=transitions, cyan=fishing, yellow=dock. Add to all 3 beach scenes. Labels on each zone with its TMX name.
  - Verify: load each beach with `?debug=1`, all zones visible and match Tiled layout
  - Done when: debug overlay renders on all 3 beaches showing all TMX zone types

## Files Likely Touched

- `src/scenes/BeachScene.ts`
- `src/scenes/Beach2Scene.ts`
- `src/scenes/Beach3Scene.ts`
- `src/scenes/BattleScene.ts`
- `src/scenes/BootScene.ts`
- `src/systems/DebugOverlay.ts` (new)
- `src/data/beach-enemies.ts`
