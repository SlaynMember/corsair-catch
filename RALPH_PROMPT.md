# Corsair Catch — Ralph Loop Mission Brief

## MANDATORY FIRST ACTION
Read these files before writing a single line of code:
1. `/Users/willp/Local Sites/game-design/corsair-catch/GAMEPLAN.md` — style bible, color palette, architecture rules, island list, fish species plan
2. `/Users/willp/Local Sites/game-design/corsair-catch/CLAUDE.md` — architecture rules, critical file list
3. View concept art in `public/sprite_unedited/`: characters.png, fish.png, ships.png, `sunset cove.png`
4. View reference screenshots: IMG_4097.PNG, IMG_4098.PNG, IMG_4099.PNG (these are the EXACT visual target)

## WHAT YOU'RE BUILDING
Corsair Catch — a pirate fishing RPG browser game. Full visual rebuild from Three.js to PixiJS v8 pixel art.

Visual target: EXACTLY match "Pirate's Cove Fishing" mobile game (see IMG_4097-4099). Not similar — identical aesthetic.

## NON-NEGOTIABLE ARCHITECTURE RULES
- Stack: PixiJS v8 + TypeScript + Vite. **Three.js is completely banned.**
- PixiJS v8 API: `.rect(x,y,w,h).fill(color)` NOT `beginFill().drawRect()`
- 5-layer rendering: backgroundLayer > oceanLayer > worldLayer > fxLayer > uiLayer
- Camera2D: zoom=9, lerp=0.1
- **DO NOT modify**: BattleSystem.ts, FishingSystem.ts (logic only), SaveManager.ts, AudioManager.ts
- After EVERY milestone: run `npx tsc --noEmit` (must pass 0 errors) + `npm test` (must pass 41/41)
- Commit after every milestone: `git add -A && git commit -m "[M#] description"`
- Working directory: `/Users/willp/Local Sites/game-design/corsair-catch/`

## MILESTONES (complete in order)

### M1: PixiJS v8 Foundation
- `npm uninstall three @types/three`
- `npm install pixi.js@^8.0.0`
- Delete Three.js files: SceneSetup.ts, ToonMaterial.ts, WaterShader.ts, CameraRig.ts, Ocean.ts, Skybox.ts, Island.ts
- Create: src/rendering/PixiContext.ts (5-layer PIXI.Application, resolution:1, antialias:false)
- Create: src/rendering/Camera2D.ts (zoom=9, lerp=0.1 follow)
- Create: src/world/Ocean2D.ts (horizontal animated teal #3AB8C8 pixel bands, foam dots)
- Update: src/core/Game.ts to use PixiJS instead of Three.js
- Update: src/states/SailingState.ts — golden ship (#FFD700) visible and moves with WASD
- Done: teal pixel ocean visible, golden ship moves

### M2: Archipelago World Map
- 6 islands as PIXI.Containers in 4000x4000 world:
  1. Sunlit Cove (400,400) — sand #F4C87A, palms, wooden dock
  2. Coral Reef Atoll (1800,600) — coral rings #FF6B6B
  3. Volcanic Isle (600,2000) — dark rock #3D2B1F, lava glow
  4. Storm Reach (2800,800) — gray clouds, dark water
  5. Merchant's Port (2400,2400) — large island, market stalls
  6. Dread Corsair's Fortress (3200,3200) — jagged spires, black/purple flag
- 3 enemy patrol ships (red/black, reuse AIPatrolComponent + AISystem)
- Minimap: 120x120px top-right, gold player dot, white island dots
- Done: all 6 islands visible, minimap works

### M3: Fishing Zones + Fishing Scene (MOST IMPORTANT VISUAL)
- Pulsing teal rings around each island as fishing zones
- Fishing scene side-view (EXACTLY like IMG_4097/IMG_4098):
  - Sky: coral #FF7849 → peach #FFD4A8 gradient
  - 2-3 island silhouettes in distance (parallax)
  - Water: teal-to-deep-blue, animated ripple lines
  - Ship side-view right 30% screen: wooden hull #8B5E3C, cream sail, rigging, lantern
  - Character on deck with fishing rod arc to water
  - Bobber: red/white dot at water surface
  - Glowing concentric cyan ripple rings (#00E5FF) around bobber — pulse animation
  - Bottom UI: wooden frame, tension bar (green→yellow→red), "Press A to Reel!" text
- Connect to existing FishingSystem.ts logic (DO NOT rewrite it)
- Done: side-view fishing scene looks like reference images, catch works

### M4: Island Docking + Treasure + Shop
- Dock prompt (radius 60px from dock): "Press E to dock"
- Island UI (HTML overlay, wooden style #5C3A1E frame, "Press Start 2P" font):
  - EXPLORE button → 3x3 tile grid, X marks → dig animation → random loot (bait/potions/gold)
  - SHOP button (Merchant's Port only) → sell fish for gold, buy items/baits/ship cosmetics
  - SAIL OUT button
- Extend SaveManager: add gold, baitInventory, discoveredTreasures fields
- Done: docking works, treasure found, shop works, gold saves

### M5: Fish Database Expansion + Procedural Sprites
- Expand fish-db.ts from 22 to 62 species (see GAMEPLAN.md for naming rules + type counts)
- Create src/utils/FishSpriteGenerator.ts:
  - Canvas-based 32x32 pixel art fish generator
  - Body shape + eye (2x2 white, 1x1 black pupil) + fins
  - Type-colored elemental effects (flames/bubbles/sparks/leaves/void/clouds)
  - 3-frame swim animation (body wiggle + tail sweep)
  - Type colors from GAMEPLAN.md color palette
- Done: 62 fish in db, procedural sprites visible in battle

### M6: Character Sprite Animations
- Create src/core/AnimationManager.ts
- Canvas-drawn 3-frame sprite sheets for fisherman character (32x32 each):
  - idle: 2-frame body bob
  - walk: 3-frame leg movement
  - fish: 2-frame rod bob
- PIXI.AnimatedSprite on ship deck, switches state in FishingState
- Done: character visibly animates on ship

### M7: Visual Polish + Battle Integration
- Battle UI: fish sprites in battle boxes, "Press Start 2P" font, type effect sparks
- Per-island atmosphere: ember particles (Volcanic), rain+lightning (Storm), coral bubbles (Atoll)
- Wake trail: white foam pixels behind ship, fade 0.5s
- Add Press Start 2P font to index.html
- Done: game looks gorgeous, all tests pass, build passes

### M8: Deploy
- `npm run build` — must succeed
- Zip dist/ → corsair-catch-web.zip
- `git add -A && git commit -m "feat: Corsair Catch v2 — full PixiJS pixel art rebuild"`
- `git push origin master`
- Done: game is deployed

## STYLE SUMMARY (full details in GAMEPLAN.md)
- NO anti-aliasing. Hard pixel edges only.
- 32x32 base sprites, scaled 3-4x
- Ocean: teal #3AB8C8 / aqua #5DD4C8 / deep #1A3A5C
- Sky: always warm sunset (#FF7849 → #FF9B5C → #FFD4A8) unless explicitly night
- Wood UI: #8B5E3C frames, #F5E6C8 text areas
- Font: "Press Start 2P" (Google Fonts)
- Player ship: #FFD700 | Enemy ships: #DC143C / #4B0082
