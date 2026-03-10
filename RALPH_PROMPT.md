# Corsair Catch — Ralph Loop Mission Brief

## THE GAME VISION
A pirate fishing RPG where you **wake up on a beach, explore islands on foot, fish from shore and boats, dig up loot, and battle pirate captains**. Think Pokemon Diamond: you START in a town, walk around, talk to people, and THEN venture out. The sailing is how you travel between islands — it's NOT the game itself.

**The player is a PIRATE CHARACTER, not a ship.** You walk around islands. You board a ship when you want to sail. You fish from shore OR from the ship deck.

## MANDATORY FIRST ACTION
Read these files before writing a single line of code:
1. `/Users/willp/Local Sites/corsair-catch/GAMEPLAN.md` — style bible, movement physics, color palette
2. `/Users/willp/Local Sites/corsair-catch/CLAUDE.md` — architecture rules, known bugs, movement patterns
3. View ALL concept art in `public/sprite_unedited/`: every PNG file is a visual target
4. **Especially `opening scene.png`** — THIS is what the player sees after "New Game". A pirate on a beach.

## NON-NEGOTIABLE RULES
- Stack: PixiJS v8 + TypeScript + Vite. **Three.js is completely banned.**
- PixiJS v8 API: `.rect(x,y,w,h).fill(color)` NOT `beginFill().drawRect()`
- 5-layer rendering: backgroundLayer > oceanLayer > worldLayer > fxLayer > uiLayer
- **DO NOT modify**: BattleSystem.ts, FishingSystem.ts (logic only), SaveManager.ts, AudioManager.ts
- After EVERY milestone: run `npx tsc --noEmit` (0 errors) + `npm test` (41/41 pass)
- Working directory: `/Users/willp/Local Sites/corsair-catch/`

---

## PHASE 1: CORE GAME LOOP FIX (V1-V3)

### V1: Island Exploration State (THE MOST IMPORTANT CHANGE)
**Currently**: Pressing "New Game" dumps you on a ship in the ocean. There is no on-foot gameplay.
**Target**: Pressing "New Game" puts you as a pirate character standing on Sunlit Cove beach, like `opening scene.png`.

Create a new `IslandState` (or rename/repurpose existing state):
1. **New file**: `src/states/IslandState.ts` — top-down island exploration
2. **Player character**: Use the Fisherman sprite from `characters.png` reference (32x32 chunky pixel art)
   - WASD/arrow keys for 4-directional movement (Pokemon Diamond style — grid-like but smooth)
   - Idle: 2-frame bob. Walk: 4-frame cycle synced to speed
   - Sprite anchor at (0.5, 1.0) for correct Y-sorting
3. **Island map**: Each island is a walkable area with:
   - Sandy beach areas (shore fishing spots)
   - Dock (interact to board ship → push SailingState)
   - Dig spots marked with X (interact to dig up loot)
   - NPCs to talk to (shop, quest givers)
   - Fishing spots on shore (interact → push FishingState)
4. **Camera**: Locked center-follow on player character (Pokemon style, no lerp)
5. **Game.startNewGame()**: Change to push `IslandState` for Sunlit Cove, NOT `SailingState`
6. **Transition TO sailing**: Walk to dock → "Press E to Board Ship" → push SailingState
7. **Transition FROM sailing**: Dock at island → pop to IslandState for that island

The flow becomes: **Island (home base) → Dock → Sail → Arrive at new island → Dock → Island**
This is the Pokemon Diamond town→route→town loop.

- Done when: pressing New Game puts you on a beach as a walking pirate character, NOT on a ship

### V2: Shore Fishing
**Currently**: Fishing only works from the ship via FishingState
**Target**: Player can fish from shore on any island

1. Place fishing spots along island shorelines (glowing cyan ripple markers)
2. Walk up to fishing spot → "Press SPACE to Cast" prompt
3. Push existing FishingState but with shore context (no ship hull in scene, character on beach instead)
4. FishingState already handles the minigame — just need to support shore mode for the side-view scene
5. Each island has different fish pools (use zone-db.ts data)
- Done when: player can walk to shore, cast line, and catch fish without ever boarding a ship

### V3: Fix Ship Controls & Physics (For When You DO Sail)
**File**: `src/states/SailingState.ts` lines 354-364
**Bug**: Pressing UP moves the ship RIGHT. The sin/cos mapping is 90 degrees off.

```typescript
// CURRENT (broken) — at rotationY=0, cos(0)=1 moves in X (right)
velocity.vx = Math.cos(transform.rotationY) * speed;
velocity.vz = Math.sin(transform.rotationY) * speed;

// FIX — swap and negate so UP goes up
velocity.vx = Math.sin(transform.rotationY) * speed;
velocity.vz = -Math.cos(transform.rotationY) * speed;
```

Also add basic boat feel:
- **Momentum**: `speed *= 0.9` per frame (ship coasts to a stop)
- **Turn rate tied to speed**: can't steer when stopped
- **Wave bobbing**: Sample `getWaveHeight()` for render Y offset (1-2px)
- Done when: WASD works correctly AND ship feels like a boat, not a car

---

## PHASE 2: VISUAL POLISH (V4-V9)

### V4: Ocean Overhaul — From Stripes to Waves
**File**: `src/world/Ocean2D.ts`
**Current**: 12px flat horizontal bands with barely-visible foam dots
**Target**: Reference shows undulating wave bands with visible foam crests

1. **Band height**: 12px → 20-28px
2. **Wave deformation**: Sinusoidal vertical offset (amplitude 3-6px, varying wavelength per band)
3. **Foam lines**: Replace scattered dots with visible white/light-teal foam LINES along wave crests (2-4px tall)
4. **Shimmer**: Replace invisible twinkle with sun glint patches (3-5px wide), 1 per 2000px area
5. **Depth gradient**: Top 30% bright teal (#3AB8C8), middle 40% medium (#2D9FB5), bottom 30% deep (#1A3A5C)
- Done when: ocean looks like flowing water, not flat stripes

### V5: Sky Gradient Polish
**File**: `src/rendering/PixiContext.ts`
1. Gradient steps: 20 → 100+ (eliminate visible banding)
2. Multi-stage: deep coral (#E07856) top → warm orange (#F4A76D) mid → golden peach (#FFD080) horizon
3. Add 2-3 simple cloud shapes in backgroundLayer
- Done when: sky is smooth, warm, atmospheric — no visible stepping

### V6: Wake, Seagulls, Atmosphere Density
**File**: `src/states/SailingState.ts`

**Wake:** Alpha 0.2→0.5, lifetime 0.4s→1.5s, particles 4-7→8-12, size 4-7→6-10px, add white foam core
**Seagulls:** 4→8-12, add 2-frame wing flap, vary Y positions, size variation for depth
**Atmosphere:** Increase spawn rates 2-3x, extend despawn radius to 80%+
- Done when: atmosphere feels DENSE and persistent

### V7: Bioluminescent Deep Water (THE SHOWSTOPPER)
**Reference**: IMG_4099 — the most impressive visual

1. Deep water zones: ocean shifts to dark navy (#0D3B5C → #061825)
2. Glowing cyan bezier curves (#0FFFFF, alpha 0.3-0.6) drift across ocean surface
3. Faint creature silhouettes below the glow lines
4. Pulsing glow intensity (0.3 → 0.6 → 0.3 over 3-5 seconds)
- Done when: deep water looks magical — the thing people screenshot

### V8: Ship and Island Visual Polish
**File**: `src/world/WorldManager2D.ts`

At the new zoom level:
1. Player ship: hull planking, mast, sail, flag — chunky pixel art
2. Enemy ships: distinct flag colors, same detail level
3. Islands: visible palm fronds, dock planks, sandy beach fringe
4. Shadow/depth: ships cast shadow, islands have darker water ring
5. Fishing zones: wider pulsing rings with zone name labels
- Done when: ships and islands match `ships.png` reference, not colored rectangles

### V9: Wooden UI Frames (Diegetic Design)
**Files**: `src/ui/UIManager.ts`, `HUD.ts`, `InventoryUI.ts`, `SettingsUI.ts`
**Reference**: `corsaircatchaquapedia.png`, IMG_4098

1. All panels: wooden frame border (#8B6B4D outer, #A0805C inner) with beveled edges
2. Parchment backgrounds (#F0E8D8)
3. Buttons: darker wood (#6B5438) with lighter text
4. All text: "Press Start 2P" font
5. Dialog boxes: cream (#E8DCC8) with dark brown text (#3B2817)
- Done when: UI feels like a pirate's logbook, not a generic HUD

---

## PHASE 3: GAMEPLAY FEEL (V10-V14)

### V10: Main Menu / Opening Scene
**Reference**: `opening scene.png`

1. Sandy beach scene — character standing on beach
2. Palm tree silhouettes framing left/right edges
3. "CORSAIR CATCH" title in gold (#FFD040) with dark shadow
4. Warm sunset sky background
5. START / CONTINUE / SETTINGS in wooden-frame buttons
- Done when: opening screen matches `opening scene.png`

### V11: Encounter System (Pokemon Tall Grass → Fishing Zones)
**Files**: `src/world/FishingZone2D.ts`, `src/states/SailingState.ts`

1. **Step counter**: Ship enters zone → count movement ticks
2. **Encounter roll**: After 8 steps / 3 seconds minimum, roll against zone rate (0.05-0.15)
3. **Weighted tables**: Common 60%, Uncommon 25%, Rare 12%, Legendary 3%
4. **Force idle**: On trigger, stop ship, play transition, push FishingState
5. **Depth sorting**: `worldLayer.sortableChildren = true`, `zIndex = sprite.y + sprite.height`
- Done when: encounters feel natural and sprites sort correctly

### V12: Scene Transitions (Pokemon Diamond Style)
**Files**: New `src/effects/TransitionEffect.ts`

1. Custom PixiJS v8 `Filter` with `GlProgram` for mask-based transitions
2. **Battle entry**: white flash → radial collapse (0.8s)
3. **Battle exit**: iris open from center (0.6s)
4. **Fishing entry**: horizontal wave wipe (0.5s)
5. **Zone change**: fade black → load → fade in (0.5s each)
- Done when: state transitions are polished, not hard cuts

### V13: Menu Interaction Polish
**Files**: All UI files

1. **Cursor navigation**: Arrow keys move cursor (►), SPACE confirms, ESC cancels
2. **Menu slide-in**: 0.3s ease-out from edge
3. **Stack-based**: push/pop menus, ESC always pops one level
4. **Scale pulse on confirm**: 1.0 → 1.05 → 1.0 over 0.15s
- Done when: menus feel responsive like Pokemon Diamond

### V14: Game Feel / Juice Pass
**All files** — final polish:

1. Screen shake on battle hits (0.1-0.3s)
2. Particle bursts on fish catch, level up, treasure open (10-30 particles)
3. Color flash on damage (white, 1-2 frames)
4. Wake trail density tied to ship speed
5. Ship bobbing synced to wave system via `getWaveHeight()`
- Done when: every interaction has visual + motion feedback

---

## AFTER ALL MILESTONES
```bash
npx tsc --noEmit    # 0 errors
npm test            # 41/41 pass
npm run build       # succeeds
```

## STYLE SUMMARY
- NO anti-aliasing. Hard pixel edges only.
- 32x32 base sprites, scaled 3-4x
- Ocean: teal #3AB8C8 / aqua #5DD4C8 / deep #1A3A5C — WITH wave deformation
- Sky: smooth warm sunset (#E07856 → #F4A76D → #FFD080) — 100+ gradient steps
- Wood UI: #8B6B4D frames, #F0E8D8 parchment — DIEGETIC design
- Font: "Press Start 2P" (Google Fonts)
- Camera zoom: 7-9x — NEVER 1.0
- Bioluminescence: #0FFFFF glowing curves in deep water
