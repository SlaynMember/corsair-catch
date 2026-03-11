# Corsair Catch Master Recovery Plan

## Objective

Stop trying to build "all systems at once" and ship one strong vertical slice:

1. Wake up on the beach.
2. Move cleanly on foot.
3. Pick up wood and twine.
4. Craft a basic rod.
5. Fish from shore or dock.
6. Catch fish into a visible crew/bench.
7. Board a ship.
8. Sail a readable world map.
9. Dock, switch ships, and repeat.

If a feature does not directly strengthen that loop, it is secondary.

## What Is Actually Wrong

The game does not mainly fail because of missing assets. It fails because the current codebase has multiple disconnected "almost systems" competing for control.

### Root causes

- There is no single authoritative player journey.
- UI is being used to fake gameplay instead of supporting gameplay.
- State transitions are visually and logically inconsistent.
- World scale, sprite scale, and camera scale are not aligned.
- Several screens are procedural placeholders even though final art exists.
- Tests validate isolated logic, not the real playable loop.

### Evidence in the current code

- `src/states/IslandState.ts`
  - Hardcodes beach bounds, fishing spots, treasure spots, and spawn instead of anchoring gameplay to authored points.
  - Opens fishing directly from glowing circles in the water rather than from believable shoreline/dock interactions.
- `src/states/FishingState.ts`
  - Replaces the world with a procedurally drawn sunset scene.
  - Renders a ship-side fishing composition regardless of whether you started from shore, dock, or boat.
  - Depends on overlay state updates that are easy to desync from the scene.
- `src/states/SailingState.ts`
  - Mixes manual fishing prompt behavior with random auto-encounter fishing.
  - Treats sailing, docking, fishing encounter flow, and pirate battles as one overloaded state.
- `src/ui/MainMenuUI.ts`
  - Uses a fullscreen stretched spritesheet and overlays buttons directly over the focal art.
- `src/ui/InventoryUI.ts`
  - Implements a stats-heavy party panel, but not the "Aquapedia + haul + bench" presentation you want.
- `src/ui/DockingUI.ts`
  - Contains a small island modal and treasure minigame, but not a proper dock/ship/bench progression hub.
- `src/ui/CraftingUI.ts`
  - Exists, but is modal-first and disconnected from environmental resource pickup.
- `src/data/fish-db.ts`, `src/data/ship-db.ts`, sprite assets in `public/`
  - These are worth keeping. The content layer is not the problem.

## Salvage vs Replace

### Keep

- Fish database and fish progression data.
- Ship database and ship unlock data.
- Save/load structure.
- Pirate walk/idle sprite assets.
- Fish image assets and ship sprite sheet assets.
- Battle system as a secondary system.
- Core ECS utilities where already stable.

### Replace or heavily rewrite

- Main menu composition.
- Opening/wake-up sequence.
- Island exploration scene layout.
- Fishing presentation and flow.
- Inventory presentation.
- Docking flow.
- Ship selection presentation.
- Interaction prompts and tutorial messaging.
- Camera/scaling rules.

## Non-Negotiable Product Decisions

These decisions prevent more agent drift.

1. Beach gameplay is a handcrafted map, not a generic open scene.
2. Fishing is context-based:
   - Shore fishing scene
   - Dock fishing scene
   - Boat fishing scene
3. Inventory is split into:
   - Crew
   - Bench
   - Materials/Items
   - Aquapedia/Collection
4. Sailing is deliberate traversal, not random fishing interruption.
5. Docking is a hub action with clear options:
   - Go ashore
   - Fish from dock
   - Manage crew/bench
   - Craft/build
   - Select ship
   - Sail out
6. The first 30 minutes must work before adding more islands or more feature branches.

## The Vertical Slice To Build

### Slice name

Beach to Boat

### Required player fantasy

- The player wakes up on a beach with a clean intro.
- The player can move on sand without floating.
- The player sees collectible wood/twine nodes on the island.
- The player crafts a rod from gathered materials.
- The player can fish from a shoreline or dock with a good-looking composition.
- Fish go into crew if space is available, otherwise bench.
- The player can open a real collection/inventory screen.
- The player can board a starter ship at the dock.
- The player can sail to nearby islands.
- At the dock, the player can select from unlocked ships.

### Explicit cuts for this slice

- No freeform survival crafting tree.
- No advanced economy.
- No giant world map redesign.
- No procedural opening animation experiments.
- No random fishing auto-encounters while sailing.
- No extra AI agent-generated UI variants.

## Execution Order

## Phase 0: Freeze and Simplify

Goal: stop the codebase from fighting itself.

Tasks:

- Remove or disable auto-trigger fishing encounters from `SailingState`.
- Pick one starter flow:
  - `MainMenuState` -> `IslandState` (beach intro) -> dock -> `SailingState`
- Remove placeholder treasure/X UX from the primary path.
- Keep current save schema, but reset gameplay flow expectations.

Acceptance criteria:

- Starting a new game always leads to one deterministic beach scene.
- Fishing only starts from explicit interactable points.
- Exiting fishing always returns control cleanly.

## Phase 1: Visual Foundation

Goal: make the game readable before adding more systems.

Tasks:

- Set a fixed internal render resolution and scale policy.
- Re-anchor the player sprite to the ground correctly.
- Rebuild the beach scene layout around authored anchors:
  - spawn point
  - gather nodes
  - shoreline fish point
  - dock
- Rebuild the main menu so buttons do not cover the focal art.
- Replace the current opening with a short, staged wake-up sequence:
  - frame 1: beach vista
  - frame 2: pirate wakes
  - frame 3: input prompt

Acceptance criteria:

- No floating character.
- No UI covering the character.
- No stretched or muddy fullscreen art.
- Intro text remains readable long enough to process.

## Phase 2: Gather and Craft Loop

Goal: give the player a reason to exist on the island.

Tasks:

- Add visible gatherables:
  - driftwood
  - twine/rope scrap
- Add interaction animation/state for pickup.
- Add item tracking for materials in inventory.
- Rework crafting into a diegetic beach workbench or simple camp menu.
- Make the first craft mandatory: `Basic Rod`.

Data model:

- Reuse `ShipComponent.items` for now.
- Track `hasBasicRod` or infer from `fishing_rod_basic > 0`.

Acceptance criteria:

- New game starts with no rod.
- Player gathers materials in under 2 minutes.
- Player crafts rod once and can now fish.

## Phase 3: Fishing Rebuild

Goal: make fishing the best-feeling system in the game.

Tasks:

- Split fishing into three scene presets:
  - shore
  - dock
  - boat
- Replace procedural sunset-only scene with authored compositions using your asset direction.
- Keep the reel minigame logic if it still feels good.
- Rebuild the overlay so it updates one stable panel instead of re-creating multiple competing states.
- Make `Esc` always back out.

Design rules:

- The player avatar must be visible in-context.
- The cast target must be visible.
- The tension meter must not obscure focal action.
- Prompt language must be short and consistent.

Acceptance criteria:

- Fishing never softlocks.
- Fishing scene matches where the player started it.
- Catch result always resolves into crew or bench.

## Phase 4: Crew, Bench, and Aquapedia

Goal: make catches feel owned.

Tasks:

- Replace the current inventory-first presentation with a structured management screen.
- Tabs:
  - Crew
  - Bench
  - Materials
  - Aquapedia
- Aquapedia layout should follow the reference in `FIXTHESENOW/GOAL LOOK AND FEEL/inventorymonstertracker.png`.
- Crew should show active fishing/battle team.
- Bench should store overflow catches and support promote/swap/release.

Data changes:

- Add `bench: FishInstance[]` to save data and `ShipComponent`.
- Party limit remains small early; overflow goes to bench automatically.

Acceptance criteria:

- Caught fish are never silently lost.
- Bench exists and is manageable.
- Collection screen feels like a reward, not a debug panel.

## Phase 5: Dock and Ship Management

Goal: turn the dock into the game's main progression hub.

Tasks:

- Replace the current small island modal with a dock menu.
- Dock options:
  - Go Ashore
  - Fish From Dock
  - Crew & Bench
  - Craft
  - Shipyard
  - Sail Out
- Rework ship selection UI to actually use `ships.png` visuals, not text-only cards.
- Tie unlocked ships to clear progression conditions.

Acceptance criteria:

- Player can board and leave ship cleanly.
- Ship selection shows real ship art.
- Dock menu becomes the control center for the loop.

## Phase 6: Sailing

Goal: make sailing feel adventurous, not noisy.

Tasks:

- Keep the zoomed-out readable world direction.
- Reduce overlay clutter.
- Reserve fishing at sea for intentional boat interactions, not random popup transitions.
- Use ship stats to affect movement and handling later, not before the loop feels good.

Acceptance criteria:

- Sailing map is readable at a glance.
- Docks are obvious.
- Transition from sailing -> dock -> island is clean.

## Recommended File Strategy

### High priority rewrites

- `src/states/IslandState.ts`
- `src/states/FishingState.ts`
- `src/ui/MainMenuUI.ts`
- `src/ui/InventoryUI.ts`
- `src/ui/DockingUI.ts`

### High priority edits

- `src/states/SailingState.ts`
- `src/components/ShipComponent.ts`
- `src/core/SaveManager.ts`
- `src/systems/CraftingSystem.ts`
- `src/ui/styles.css`

### Likely new files

- `src/data/beach-layout.ts`
- `src/data/dock-actions.ts`
- `src/ui/BenchUI.ts`
- `src/ui/AquapediaUI.ts`
- `src/ui/DockMenuUI.ts`
- `src/rendering/ScenePresets.ts`

## Concrete Fixes For The Exact Complaints

### "Opening animation is ass / text appears for two frames / arrow disappears"

- Stop using the stretched looping sheet as the entire menu composition.
- Make the opening sequence state-driven, not a fast looping canvas gimmick.
- Keep text on screen until a timed beat or input.

### "Resolution and quality are piss poor"

- Fix internal resolution and nearest-neighbor scaling.
- Stop stretching art to arbitrary viewport dimensions.
- Standardize sprite scale across menu, beach, fishing, and sailing.

### "Character is covered by buttons"

- Move menu controls to a dedicated lower panel or side panel.
- Never place UI on top of the focal sprite area.

### "Character is floating"

- Re-anchor the pirate sprite feet to the world ground line.
- Author the beach walkable strip visually and mechanically from the same coordinates.

### "You have to walk into the horizon to fish"

- Replace water-entry fishing trigger with shoreline/dock interactables.
- The player should stand on land or a dock and cast outward.

### "Treasure X glitches with 50g popup"

- Remove the current treasure popup from the core path.
- Reintroduce treasure later as a secondary polished system.

### "Inventory is nonexistent / no grid / no bench"

- Replace current party-only modal with Crew / Bench / Materials / Aquapedia.

### "Fishing freezes on a sunset"

- Replace the current contextless fishing scene with authored context presets.
- Ensure every fishing phase has:
  - visual scene
  - stable UI
  - escape path
  - return transition

## Team Rule For Future Agent Work

Do not ask agents to "improve the game" broadly.

Only assign tasks in this format:

1. One screen or one state only.
2. One acceptance test list.
3. One file list.
4. No new systems unless they serve the current vertical slice.

Example:

"Rewrite `IslandState.ts` so the player spawns on the beach, can collect 3 wood, craft a rod, and fish from one dock point. Do not touch sailing, battle, or ship unlock systems."

## Success Metrics

The recovery is working when:

- A new player understands what to do in 15 seconds.
- The first fish can be caught in under 5 minutes.
- No state transition softlocks.
- The inventory/bench makes catches feel valuable.
- The dock/ship flow hints at the larger game without breaking the first slice.

## Immediate Next Build Target

Build this and nothing else:

`New Game -> Wake-up intro -> Beach exploration -> Gather wood/twine -> Craft rod -> Fish from dock -> Catch first fish -> Open Crew/Bench/Aquapedia -> Board starter ship -> Sail to next island`
