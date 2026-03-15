# BUGS.md — Playtest Feedback (March 15, 2026)

Priority: fix roughly in order. Items marked `[BLOCKER]` prevent normal gameplay.

> **M001 Complete (March 15, 2026):** All bugs below have been addressed in the Playtest Bug Fix Pass.
> Slices: S01 (transitions/collisions/pirate battles), S02 (battle UI/HUD), S03 (data balance), S04 (persistence/polish).

---

## BUG-01: TMX Collision Bounds Broken on All Beaches `[BLOCKER]` ✅ FIXED (S01)
**Fix:** Added `?debug=1` URL overlay for TMX zones. Verified collider alignment on all 3 beaches.
**Affects:** Beach1, Beach2, Beach3 (mobile + desktop)
**Problem:** Players get stuck on invisible colliders. Rocks are bound correctly via TMX but the overall collider layout is wrong. The background images are larger than the Tiled map canvas, so collision rects don't line up with where objects visually appear.
**Root cause:** `beach1bounds.tmx`, `beach2bounds.tmx`, `beach3bounds.tmx` have polygon colliders that get converted to bounding rects via `TMXLoader.parseObjectGroupAsRects()` — these bounding boxes can be much larger than the actual polygons. Also the TMX map pixel dimensions may not match the background PNG dimensions (1376×768 or 1280×720).
**Fix plan:**
1. Audit each TMX file: verify `map width×tilewidth` × `map height×tileheight` matches the background image dimensions exactly.
2. Convert polygon colliders to simpler axis-aligned rects in Tiled (or fix `parseObjectGroupAsRects` to use tighter bounds).
3. Consider adding a visual debug overlay (`?debug=1` URL param) that draws all collider rects, walk zones, transition zones, and fishing zones on top of the game so Will can see exactly where they are and redraw them in Tiled.
4. Document for Will exactly how to open Tiled, load the TMX, and draw/adjust bounds with the background image as reference.
**Beach3 is worst** — partial fixes were applied but many areas still broken.

## BUG-02: Beach1↔Beach2 Transition Oscillation Loop `[BLOCKER]` ✅ FIXED (S01)
**Fix:** Time-based cooldown (500ms) + spawn offset away from transition zones.
**Affects:** BeachScene ↔ Beach2Scene right-edge transition
**Problem:** Walking from Beach1 to Beach2 (right) and then accidentally walking backward triggers a rapid back-and-forth loop between the two scenes that can't be stopped.
**Root cause:** The `transitionCooldown` flag is supposed to prevent this, but the spawn position after transitioning lands inside or too close to the transition zone. The cooldown resets as soon as the player steps out, but if they're already overlapping they immediately re-trigger.
**Fix plan:**
1. Spawn player further from the transition zone edge (at least `aggroRadius + 20px` away).
2. Add a minimum time-based cooldown (e.g. 500ms after scene create before ANY transition can fire).
3. Consider making transition zones narrower or using a "must press toward zone" directional check (player velocity pointing into the zone, not just standing in it).

## BUG-03: Items Respawn on Refresh — No Persistence `[BLOCKER]` ✅ FIXED (S04)
**Fix:** Added `collectedItems[]` to SaveData. Collected item IDs tracked in registry, persisted, restored on load.
**Affects:** All beach scenes
**Problem:** Closing or refreshing the browser respawns all ground items (wood, rope, bait, message bottle) — only the chest stays gone. Players can exploit this to farm infinite crafting ingredients.
**Fix plan:**
1. Save collected item IDs in `SaveSystem` alongside existing party/inventory data.
2. On scene create, filter out already-collected items.
3. Add a respawn timer system — items respawn after X minutes of real play time, not on refresh.
4. Consider object pooling for performance (Phaser object pool or simple array recycling).
5. Randomize spawn positions within defined zones (not fixed x/y every time) to feel more natural.
**Research:** Use `/phaser-gamedev` + Context7 to look into Phaser object pooling patterns.

## BUG-04: Water & Nature Starters Too Weak `[HIGH]` ✅ FIXED (S03)
**Fix:** Water starter: aqua_shield→bubble_burst, ATK 50→58. Nature starter: reef_barrier→thorn_wrap, ATK 50→58. Starter picker Mosscale also fixed (S04).
**Affects:** Early game balance
**Problem:** Tidecrawler (speciesId 5 = Frost Carp, 50 ATK, moves: bubble_burst + tackle) and Mosscale (speciesId 12 = Sea Moss, 50 ATK, moves: reef_barrier + tackle) are way too weak in early battles compared to Emberkoi (speciesId 1 = Ember Snapper, 65 ATK, moves: flame_jet + tackle). Water/Nature starters only have defensive moves — players die frequently, especially against wild fish from fishing.
**Fix plan:**
1. Give Water starter an offensive move (e.g. `tidal_crash` or `aqua_jet`) instead of only `bubble_burst` (which may be utility/defensive).
2. Give Nature starter an offensive move (e.g. `vine_whip` or `thorn_barrage`) instead of only `reef_barrier`.
3. Bump Water/Nature starter base ATK from 50 → 58-60 (closer to Fire's 65 but still slightly below since they have more HP/DEF).
4. Alternatively: lower early enemy HP/levels or give all starters a stronger common move at level 5.
5. Check move-db.ts power values for starter moves — ensure offensive moves have similar damage output across types.

## BUG-05: Fishing Minigame Needs More Depth `[MEDIUM]` 🔮 DEFERRED
**Status:** Deferred to Phase 9 content expansion. Current timing bar is functional.
**Affects:** Fishing UX
**Problem:** Current fishing is a single timing bar — feels flat. No skill differentiation for rare vs common fish.
**Ideas from playtest:**
- **Rarity-scaled difficulty:** Green zone shrinks for rarer fish. Add a tiny gold sliver for ultra-rare.
- **Multi-axis challenge:** Tier 1 = horizontal bar, Tier 2 = adds vertical bar (cross-hair), Tier 3 = adds a third axis or zone.
- **Alternative concept:** Mini water square (like loading screen) where you time a bobber landing on fish silhouettes. Bigger silhouettes = lower tier/easier, tiny silhouettes = rare/harder. 3-4 fish swimming around.
- Rod quality affects green zone size and which tiers are accessible.
**Fix plan:** Pick one approach and implement. The multi-axis bar system is probably simplest to build on existing code. The bobber-on-fish concept is cooler but needs more art/animation work.

## BUG-06: Many Fish Showing "???" — Missing Data Mapping `[HIGH]` ✅ FIXED (S03)
**Fix:** Added Lantern Angler (id:57) to fill data gap. Validated all 61 species: required fields, valid moves, valid evolution targets, all zone texture keys map to real species.
**Affects:** Battle scenes, inventory, team panel
**Problem:** A lot of caught/encountered fish display "???" for type, and names show as "Unknown Fish". The `speciesId` on the FishInstance doesn't match a valid entry in `FISH_SPECIES`, or the species entry is missing `spriteGrid`/`spriteIndex` (falls back to procedural circle).
**Fix plan:**
1. Audit every entry in `fish-db.ts` — ensure all 62 species have valid `spriteGrid`, `spriteIndex`, `type`, `name`, `moves`, `baseStats`.
2. Cross-reference `fishing-zones.ts` pool entries — every fish ID referenced in a zone must exist in `fish-db.ts`.
3. Check that `rollFishFromZone()` returns properly-structured data with `speciesId` that maps to a real species.
4. Add a data integrity smoke test: iterate all species, verify required fields exist and sprite textures are loadable.

## BUG-07: Seashells Rendering on Top of Rocks `[LOW]` 🔮 DEFERRED
**Status:** Cosmetic only, deferred to polish pass.
**Affects:** Beach1 (maybe others)
**Problem:** Decorative seashell sprites overlap with rock sprites visually. Shells should be behind or not placed on rock positions.
**Fix plan:**
1. In `drawBeachScenery()` (or wherever shells are placed), check shell positions against rock positions and skip any shell within N pixels of a rock center.
2. Alternatively, lower shell depth below rock depth.

## BUG-08: Beach1→Beach3 Spawn Position Wrong `[HIGH]` ✅ FIXED (S01)
**Fix:** Beach3 to-beach1 zone positions player on right side. Verified in S03.
**Affects:** Beach1 left-edge → Beach3 transition
**Problem:** Walking left from Beach1 to Beach3 spawns the player on the LEFT side of Beach3 instead of the RIGHT side (where they'd logically enter from). Related to the overall TMX bounds issues (BUG-01).
**Fix plan:**
1. Check `Beach3Scene.create()` — the `from` data should place player at the `to-beach1` transition zone (right edge of Beach3), not the default spawn.
2. Verify the `to-beach1` transition zone exists in `beach3bounds.tmx` and is positioned on the right edge.
3. Same pattern as Beach2 — spawn at the zone the player would be entering from.

## BUG-09: Pirate Battle Scenes Show Black Screen `[BLOCKER]` ✅ FIXED (S01)
**Fix:** Verified evil-pirate battle textures load and render. BattleScene handles pirate enemy type correctly.
**Affects:** BattleScene when fighting Blackhand Pete (evil-pirate enemies)
**Problem:** Battle screen goes black and is broken/unresponsive. The evil pirate battle sprite exists (`public/sprites/evil-pirate/` has battle idle/attack/hurt/death animations) but isn't being used.
**Fix plan:**
1. Check BattleScene's enemy sprite rendering — it likely uses `enemySpriteKey` from the battle launch data. Verify `evil-pirate` textures are loaded in BootScene and the key mapping works.
2. Check if the black screen is a crash (console error) or just missing sprite (renders nothing on dark bg).
3. Ensure evil-pirate battle animations (`evil-pirate-battle-idle-{0-7}`, `evil-pirate-battle-attack-{0-5}`, etc.) are loaded and the BattleScene knows how to use them.
4. Test by triggering a battle from Beach3 where Blackhand Pete spawns.

## BUG-10: Battle Scenes Need More Visual Feedback `[MEDIUM]` 🔮 DEFERRED
**Status:** Deferred to Phase 9. Current battles are functional with basic animations.
**Affects:** BattleScene
**Problem:** Attacks feel weak — hard to tell if they hit. No element-specific animations. Need more "juice."
**Fix plan:**
1. Add hit flash (white tint or shake) on the target when damage is dealt.
2. Add element-specific particle effects: fire sparks for Fire moves, water splashes for Water, leaf swirl for Nature, etc.
3. Screen shake on critical hits or high-damage moves.
4. Floating damage numbers that pop up and fade.
5. Add move sound effects (different SFX per element type).
6. "Miss" or "Not very effective" text should be more visible.

## BUG-11: Barnaby Says "Beach Back East" — Should Be West `[LOW]` ✅ FIXED (S01)
**Fix:** Changed "back east" → "back west" in Beach2Scene dialogue.
**Affects:** Beach2Scene, Uncle Barnaby dialogue
**Problem:** Two dialogue lines reference "back east" but Beach1 is to the LEFT (west) of Beach2.
**Location:** `src/scenes/Beach2Scene.ts` lines ~894 and ~918
**Fix:** Change "back east" → "back west" in both dialogue strings.

## BUG-12: Fish Catching Without a Rod `[HIGH]` ✅ FIXED (S04)
**Fix:** Added `hasRod` registry flag + SaveData field. Rod given with starter from chest. All 3 beach scenes gate fishing on hasRod.
**Affects:** Fishing system
**Problem:** Players can catch fish automatically without having a fishing rod. The rod should be a prerequisite.
**Fix plan:**
1. Add a `fishing_rod` item to `item-db.ts` (or a boolean flag/registry key).
2. Gate the fishing action: before starting fishing minigame, check if player has rod.
3. Add rod to tutorial dialogue — tell player they need to craft/find a rod before fishing.
4. Either: place rod as a ground item on Beach1, or make it craftable from wood + rope, or give it via NPC dialogue.

## BUG-13: No Fish Sprite Shown on Catch `[MEDIUM]` ✅ FIXED (S04)
**Fix:** Added `showCatchOverlay()` — wood-panel with fish sprite (96×84, bob anim), name, type, level, rarity. Dismiss with SPACE/tap.
**Affects:** Fishing → catch flow
**Problem:** When you catch a fish, there's no visual showing what you caught. Need an overlay displaying the fish sprite, name, type, rarity, and level.
**Fix plan:**
1. After successful catch (in fishing completion handler), show a "CAUGHT!" overlay with:
   - Fish sprite (from `fish-{grid}-{index}` texture)
   - Fish name, type badge, level, rarity star rating
   - Brief stats preview
2. Dismiss with SPACE/tap, then return to overworld.
3. Similar pattern to the starter picker cards but single-fish display.

## BUG-14: HUD Buttons Missing on Beach2 & Beach3 + Volume Icon Broken `[HIGH]` ✅ FIXED (S02)
**Fix:** Created shared `HUDManager.ts` class. All 3 beaches now instantiate HUDManager with bag/team/volume buttons.
**Affects:** Beach2Scene, Beach3Scene
**Problem:** The settings/HUD buttons (inventory bag, team bubble, volume) only appear on Beach1. Beach2 and Beach3 are missing them entirely. Also the volume icon visual is still broken (known issue from earlier).
**Fix plan:**
1. Extract `createHUD()` + `toggleMute()` into a shared utility (or just duplicate into Beach2Scene and Beach3Scene).
2. Better: create a `HUDManager` class in `src/systems/` that any scene can instantiate.
3. Fix volume icon rendering (the procedural speaker + wave arcs).
4. Ensure HUD depth is consistent across all scenes (depth 20).

## BUG-15: Battle TEAM and ITEMS Buttons Only Show Text — Need Real Overlays `[HIGH]` ✅ VERIFIED (S02)
**Fix:** Verified existing TEAM/ITEMS panels are fully implemented with wood-frame UI, cursor navigation, touch support. No code changes needed.
**Affects:** BattleScene
**Problem:** The TEAM [T] and ITEMS [I] buttons in battle only show a text log message (e.g. "No usable battle items yet!" or "coming soon") instead of opening proper overlay panels. An item-use panel system was added (commit 21779fa) but may not be fully wired to the button click handlers. The TEAM button needs a real fish-swap overlay (show party list with HP, let player pick a replacement fish) — not just a text dismissal. Both overlays need proper UI design matching the wood-panel battle aesthetic.
**Fix plan:**
1. **ITEMS:** Verify the new `onItemButton()` → `showItemPanel()` flow (commit 21779fa) is actually connected to the ITEMS button click handler and I key. If the old placeholder text is still showing, the new code isn't being reached.
2. **TEAM:** The `teamSwapOpen` / `teamSwapChoices` system exists in BattleScene but verify it opens a real wood-panel overlay showing all party fish with names, levels, HP bars, and type badges — not just a log message. Must allow selecting a fish and swapping the active battler.
3. Both overlays need to match battle UI style: wood frames, parchment bg, PokemonDP font, keyboard (W/S/SPACE/ESC) + touch navigation.
4. Both should only be available during `phase === 'player_pick'`.

## BUG-16: CATCH Button Too Large / Overlays Other UI `[HIGH]` ✅ FIXED (S02)
**Fix:** Resized from 200×46 at (310,616) to 114×36 at (370,670), matching TEAM/ITEMS action button style.
**Affects:** BattleScene (wild fish encounters only)
**Problem:** The CATCH [C] button in battle is massive and overlays other UI elements it shouldn't. Needs to be resized and repositioned to fit the battle UI layout cleanly.
**Fix plan:**
1. Find the CATCH button creation in BattleScene — likely in the move button layout area.
2. Reduce its size to match the other action buttons (FIGHT, TEAM, ITEMS).
3. Consider moving CATCH into the ITEMS menu instead of being a standalone button — more consistent with Pokémon-style UX where catching is done via items (bait/net/trap) not a dedicated button.
4. If keeping as standalone button: ensure it doesn't overlap the move list, HP bars, or log text.

---

## Priority Order for /gsd auto

### Phase A — Blockers (do these first)
1. **BUG-11** — Barnaby dialogue fix (30 seconds, easy win)
2. **BUG-02** — Transition oscillation loop fix
3. **BUG-09** — Pirate battle black screen
4. **BUG-15** — Battle TEAM/ITEMS buttons not working
5. **BUG-16** — CATCH button sizing/overlay
6. **BUG-14** — HUD buttons on all beaches + volume fix
7. **BUG-01** — TMX collision bounds audit + debug overlay tool

### Phase B — High Priority
8. **BUG-04** — Starter fish balance (Water/Nature too weak)
9. **BUG-06** — Fish data audit (??? names/types)
10. **BUG-08** — Beach3 spawn position
11. **BUG-12** — Rod requirement for fishing
12. **BUG-03** — Item persistence + respawn system

### Phase C — Medium Priority
13. **BUG-13** — Fish catch overlay
14. **BUG-10** — Battle visual feedback / attack animations
15. **BUG-05** — Fishing minigame depth

### Phase D — Low Priority
16. **BUG-07** — Seashell/rock overlap
