---
id: T02
parent: S03
milestone: M002
provides:
  - Boss intro overlay with captain name, ship sprite, taunt dialogue, and FIGHT button
  - Battle launch from SailingScene via scene.launch/pause pattern matching BeachScene
  - onResume handler for SailingScene post-battle recovery with camera fade-in
  - pendingBossDefeat flag for T03 victory/reward flow consumption
key_files:
  - src/scenes/SailingScene.ts
key_decisions:
  - Boss intro uses a single Container at depth 300 with scrollFactor(0) — consistent with dock notification pattern
  - Update loop is fully frozen during intro overlay (bossIntroShowing guard in update()) to prevent ship drift
  - Dismiss uses 200ms delayed listener registration to avoid same-frame SPACE double-fire
  - pendingBossDefeat is kept set after onResume — T03 consumes and clears it during reward flow
  - onResume only runs on victory (BattleScene stops returnScene on whiteout, so resume = win)
patterns_established:
  - showBossIntro() → launchBossBattle() two-step pattern separates overlay from battle launch
  - onResume() handler with pendingBossDefeat check follows BeachScene resume pattern
  - activeBoss holds sprite + template + minimapDot refs for T03 removal
observability_surfaces:
  - "console.log('[Boss] Showing intro for ...')" — when intro overlay opens
  - "console.log('[Boss] Launching battle: ...')" — when battle launches with party size
  - "console.log('[Boss] Resumed after defeating ...')" — on post-victory resume
  - "window.game.scene.getScene('Sailing').pendingBossDefeat" — which boss was fought
  - "window.game.scene.getScene('Sailing').bossIntroShowing" — overlay state
  - "window.game.scene.getScene('Sailing').activeBoss" — current encounter boss refs
duration: 25m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T02: Boss Intro Overlay, Battle Launch, and SailingScene Resume

**Wired full boss encounter chain: proximity → intro overlay → battle launch → SailingScene resume, with pendingBossDefeat flag for T03 rewards.**

## What Happened

Added `onResume` event handler in SailingScene `create()` with cleanup in shutdown. The handler resets transitioning/intro flags, fades camera in, restores mobile UI, and logs boss defeat state for T03 consumption.

Added instance properties: `activeBoss` (template + sprite + minimap refs), `bossIntroShowing`, `bossIntroContainer`, `pendingBossDefeat`. Added `bossIntroShowing` guard to `update()` to freeze all movement/proximity checks while overlay is visible.

Wired SPACE/mobile action trigger in `update()` after the existing dock check — when `nearestBoss` is set and intro isn't showing, calls `showBossIntro()`.

`showBossIntro()` builds a full-screen camera-fixed overlay at depth 300: dark backdrop (0.85 alpha), red border accents, boss ship sprite with dramatic entrance tween (scale 0 → scale with Back.easeOut), captain name in PixelPirate gold, taunt dialogue in PokemonDP, difficulty indicator showing party size and level range, and a pulsing "FIGHT!" button via `createActionButton()` with `[SPACE]` key hint. Dismiss via SPACE key, tap anywhere, or direct FIGHT button click — all with 200ms delay to prevent same-frame double-fire.

`launchBossBattle()` destroys the overlay, sets `pendingBossDefeat` to the boss template ID, builds party via `buildBossParty()`, plays `sfx-battle-intro`, and launches battle with `{ isBoss: true, returnScene: 'Sailing' }` following the exact BeachScene pattern.

Added imports for `buildBossParty`, `FishInstance`, and UIFactory (`createActionButton`, `UI`, `TEXT`).

## Verification

- `npx tsc --noEmit` — zero type errors ✓
- Headless Playwright: 3 boss ships spawn, proximity detection sets nearestBoss to "Captain Barnacle" when ship teleported nearby ✓
- Headless Playwright: showBossIntro() creates overlay container with bossIntroShowing=true, activeBossName="Captain Barnacle" ✓
- Headless Playwright: launchBossBattle() launches Battle scene with returnScene='Sailing', pendingBossDefeat='rival_captain', SailingScene paused ✓
- Headless Playwright: onResume() resets transitioning=false, bossIntroShowing=false, preserves pendingBossDefeat='rival_captain' ✓
- `npm run smoke` — all 42 existing tests pass (8.0m) ✓

### Slice-level verification status (intermediate task):
- `npx tsc --noEmit` — ✅ pass
- `npm run smoke` — ✅ all 42 existing tests pass
- New boss encounter smoke test — ⬜ deferred to T03
- Manual playtest — ⬜ deferred to T03

## Diagnostics

- `console.log('[Boss] Showing intro for ...')` — emitted when overlay opens, includes boss name + ID
- `console.log('[Boss] Launching battle: ...')` — emitted on battle launch, shows party size + pendingBossDefeat
- `console.log('[Boss] Resumed after defeating ...')` — emitted in onResume when pendingBossDefeat is set
- `window.game.scene.getScene('Sailing').pendingBossDefeat` — inspect which boss was fought (null if none)
- `window.game.scene.getScene('Sailing').bossIntroShowing` — check overlay state
- `window.game.scene.getScene('Sailing').activeBoss` — current boss encounter refs (template + sprite + minimap dot)

## Deviations

- Added difficulty indicator (party size + level range) to intro overlay — not in plan but useful player info with zero risk.
- Used `createActionButton()` from UIFactory for the FIGHT button instead of a plain text + interactive zone — consistent with existing pirate UI patterns.
- Added `bossIntroShowing` guard to the main `update()` loop (not just within the SPACE check) to fully freeze ship movement and all proximity checks during overlay.

## Known Issues

None.

## Files Created/Modified

- `src/scenes/SailingScene.ts` — Added imports (buildBossParty, FishInstance, UIFactory), boss encounter instance properties, showBossIntro(), launchBossBattle(), onResume(), SPACE/tap trigger in update(), bossIntroShowing guard in update()
- `.gsd/milestones/M002/slices/S03/tasks/T02-PLAN.md` — Added Observability Impact section
