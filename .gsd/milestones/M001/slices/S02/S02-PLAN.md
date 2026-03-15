# S02: Battle UI & HUD Parity

**Goal:** Battle TEAM/ITEMS panels work, CATCH button fits the UI, HUD appears on all 3 beaches, mobile detection doesn't false-positive on desktop touch screens.
**Demo:** Player opens battle → uses TEAM to swap fish, ITEMS to heal → CATCH button sits cleanly in the layout. Walk to Beach2/Beach3 → HUD buttons (bag, team, volume) are present. Desktop touch screen → no mobile joystick.

## Must-Haves

- TEAM panel opens in battle with wood-frame UI showing party fish, HP bars, tap/keyboard navigation
- ITEMS panel opens in battle with wood-frame UI showing inventory, descriptions, target selection
- CATCH button sized to match other action buttons, doesn't overlap log or TEAM/ITEMS row
- HUD (inventory, team, volume) appears on Beach2Scene and Beach3Scene, not just Beach1
- IS_MOBILE detection uses screen size + touch, not touch alone — desktop touch screens show desktop UI

## Verification

- `npx tsc --noEmit` — zero errors
- `npm run smoke` — all tests pass
- Visual verification in browser: battle TEAM/ITEMS panels open/close, CATCH button doesn't overlap, HUD on all beaches
- MobileInput.IS_MOBILE returns false on desktop (viewport 1376×768 with touch support)

## Tasks

- [x] **T01: Extract HUD to shared system, wire into Beach2 and Beach3** `est:40m`
  - Why: BUG-14 — HUD buttons only exist on Beach1. Beach2/Beach3 need the same bag/team/volume buttons.
  - Files: `src/systems/HUDManager.ts` (new), `src/scenes/BeachScene.ts`, `src/scenes/Beach2Scene.ts`, `src/scenes/Beach3Scene.ts`
  - Do: Extract createHUD() + toggleMute() from BeachScene into a HUDManager class that any scene can instantiate. Each beach scene creates its own HUDManager in create(). HUD depth 20, scrollFactor 0. Volume mute state persists via registry. Beach2/Beach3 need toggleInventory() and toggleTeamPanel() — either delegate to shared code or stub with scene-specific panel opening.
  - Verify: `npx tsc --noEmit` clean, navigate to Beach2 and Beach3 in browser and see HUD buttons
  - Done when: All 3 beaches show bag (I), team (T), and volume HUD buttons in top-right corner

- [x] **T02: Fix CATCH button size and position in BattleScene** `est:20m`
  - Why: BUG-16 — CATCH button is 200×46 at (310,616), too large and potentially overlapping ITEMS button and log panel
  - Files: `src/scenes/BattleScene.ts`
  - Do: Resize CATCH to match TEAM/ITEMS action button dimensions (114×36). Reposition to sit cleanly in the TEAM/ITEMS row — place it at x=370 (after ITEMS at 230) at y=670. Remove the oversized glow animation or scale it to match new size. Keep the net icon and hint text proportional. Ensure mobile hit area is adequate (pad 10px each side).
  - Verify: `npx tsc --noEmit` clean, launch a wild fish battle in browser and confirm CATCH button sits in the action row without overlapping
  - Done when: CATCH button is same visual weight as TEAM/ITEMS, no UI overlap

- [x] **T03: Fix mobile detection to use screen size heuristic** `est:20m`
  - Why: R017 — `'ontouchstart' in window || navigator.maxTouchPoints > 0` false-positives on Windows touch laptops. Desktop users get joystick overlay and wrong hint text.
  - Files: `src/systems/MobileInput.ts`, any file referencing `MobileInput.IS_MOBILE`
  - Do: Change IS_MOBILE to require BOTH touch support AND small screen (max-width 1024px or similar). Use `window.matchMedia('(pointer: coarse)')` as primary signal — coarse pointer means finger, fine means mouse. Fall back to touch + screen-size check. Keep it a static readonly so it's evaluated once at startup. Verify all IS_MOBILE references still work (hint text swaps, hit area sizing, joystick creation).
  - Verify: `npx tsc --noEmit` clean, test in browser at 1376×768 with touch — IS_MOBILE should be false
  - Done when: Desktop touch screens don't trigger mobile UI; actual mobile devices still get joystick

- [x] **T04: Verify TEAM/ITEMS panels end-to-end and fix any wiring issues** `est:30m`
  - Why: BUG-15 — TEAM/ITEMS buttons may show placeholder text instead of real panels. Need to verify the full flow works: button click → panel opens → selection → action → panel closes → turn continues.
  - Files: `src/scenes/BattleScene.ts`
  - Do: Launch a battle in browser with a party of 2+ fish and some items. Test TEAM button → swap panel → pick fish → swap happens. Test ITEMS button → item panel → pick item → pick target → item applies. If any step shows placeholder text or fails silently, trace and fix the wiring. Check keyboard (T/I keys) and click paths both work.
  - Verify: Visual verification in browser, `npx tsc --noEmit` clean
  - Done when: TEAM swap and ITEMS use both work end-to-end in battle with no placeholder text

## Files Likely Touched

- `src/systems/HUDManager.ts` (new)
- `src/systems/MobileInput.ts`
- `src/scenes/BeachScene.ts`
- `src/scenes/Beach2Scene.ts`
- `src/scenes/Beach3Scene.ts`
- `src/scenes/BattleScene.ts`
