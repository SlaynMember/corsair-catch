# Corsair Catch — Claude Code Project Context

## What This Game Is
A browser-based pirate fishing RPG. You sail a top-down pixel art ocean, fish at glowing hotspots, and battle enemy pirate captains with a Pokémon-style turn-based combat system. Your crew is the fish you catch.

**Tagline:** *"Pokémon meets the Seven Seas"*

**Live:** corsair-catch-demo.netlify.app
**Repo:** https://github.com/SlaynMember/corsair-catch
**Local:** /Users/willp/Local Sites/corsair-catch

## Target Aesthetic — MATCH THESE REFERENCES
The visual target is **Pirate's Cove Fishing** (mobile game). Reference images in `public/sprite_unedited/`:

| File | What It Shows | Key Visual Takeaways |
|------|--------------|---------------------|
| `IMG_4097.PNG` | Dock fishing, calm tropical | Warm coral sky (#E07856→#F4A76D), teal water (#2DAFB8), concentric ripple rings, chunky palm silhouettes, wooden dock planks, character on dock with rod |
| `IMG_4098.PNG` | Ship fishing, active bite | Deeper teal water (#1B8A96), large side-view ship hull with plank detail, GLOWING cyan ripple center (#1DFFFF), wooden UI bar, "BITE!" popup |
| `IMG_4099.PNG` | Night/deep fishing, bioluminescent | Deep blue water (#0D3B5C), SWIRLING BIOLUMINESCENT cyan lines (#0FFFFF) through dark water, creature silhouettes below, eerie atmosphere — THIS IS THE VISUAL SHOWSTOPPER |
| `IMG_4100.PNG` | Battle encounter | Bright turquoise water (#2BA8C8), wave bands, enemy captain + firefish sprites, Pokémon-style battle menu, wooden UI frames |
| `opening scene.png` | Beach title screen | Character on sandy beach, sunset sky, palm tree framing, "CORSAIR CATCH" title in gold serif with shadow |
| `sunset cove.png` | Aerial island view | Warm golden-hour lighting, dock extending into teal water, horizontal wave bands, distant island silhouettes |
| `coral reef.png` | Underwater overview | Translucent cyan water, visible sand floor, vibrant purple/pink/orange coral formations, multiple islands |
| `corsaircatchaquapedia.png` | Fish encyclopedia UI | Wooden frame border (#8B6B4D), parchment background (#F0E8D8), fish grid + detail card, diegetic UI design |
| `characters.png` | 4 pirate classes | 32-40px chunky sprites, 1px black outlines, 5-7 color palettes, oversized heads, readable silhouettes |
| `fish.png` / `fish2.png` | Elemental fish species | 60-80px sprites, organic curves with anti-aliasing, type-colored effects, bold dark outlines, named labels |
| `ships.png` | 4 ship variants | 80-100px at 3/4 angle, flag identification, hull planking detail, wave at base, color-coded by role |
| `items.png` | Collectible items | 48px items in 70px wooden frames, beveled edges, labels with descriptions |
| `rods.png` | Fishing rod variants | Color-coded by rarity (green=basic, red=rare, blue=magical), metallic reel detail, rope-wrapped handles |

### What Makes the Reference Art GOOD (and what we're missing):
1. **Water is a STAR ELEMENT** — not background filler. Undulating waves, visible foam crests, bioluminescent glow, depth-based color shifts
2. **Ships are LARGE and READABLE** — occupying 1/4 to 1/3 of viewport, with visible plank detail
3. **Atmosphere is DENSE** — persistent weather effects, warm golden lighting, silhouette layering
4. **UI is DIEGETIC** — wooden frames, parchment textures, feels like a pirate's logbook, not a generic game HUD
5. **Color temperature SHIFTS** — warm tropics (coral/gold) vs cool deep water (midnight blue/cyan glow) creates visual drama

## Architecture
- **Stack**: PixiJS v8, TypeScript, Vite — deployed as HTML5 to itch.io and Netlify
- **Rendering**: 5-layer PixiJS stack via `PixiContext`:
  - `backgroundLayer` — sky gradient (screen space)
  - `oceanLayer` — animated water bands + foam (screen space, NOT camera-transformed)
  - `worldLayer` — ships, island, zones, seagulls (camera-transformed)
  - `fxLayer` — particles, ripples, wake effects (screen space for fishing, world space for sailing)
  - Camera: `Camera2D` at `src/rendering/Camera2D.ts`
- **ECS**: Custom Entity/Component/System in `src/core/ECS.ts`
- **State machine**: push/pop in `src/core/StateMachine.ts`
- **States**: `SailingState` (main), `FishingState` (push), `BattleState` (push), `MainMenuState`
- **Game data**: `src/data/fish-db.ts` (62 species), `src/data/move-db.ts` (39 moves), `src/data/zone-db.ts` (3 zones), `src/data/enemy-db.ts` (3 captains)

## Current Status — HONEST ASSESSMENT

### What Actually Works:
- PixiJS v8 rendering pipeline (5 layers, camera system)
- ECS, state machine, movement, AI, collision
- Battle system (41 tests, fully working)
- Fishing system logic (tension, cast, rarity)
- FishingState side-view scene (closest to reference — has ship hull, character, ripples, island silhouettes)
- 62 fish species with procedural sprite generator
- Island docking, treasure hunt, shop system
- Save/load
- Deployed to Netlify

### What's BROKEN (why it looks nothing like the reference):

| Problem | Root Cause | File:Line | Impact |
|---------|-----------|-----------|--------|
| **Ship is microscopic** | `Camera2D` zoom=1.0 instead of 9 | `SailingState.ts:126` → `new Camera2D(1.0, 0.1)` | Ship is 3-5% of screen. Should be 15-25%. Everything feels empty. |
| **Ocean is flat stripes** | 12px band height, no wave deformation, perfectly horizontal | `Ocean2D.ts` BAND_HEIGHT=12 | Looks like a striped gradient, not flowing water. Reference shows undulating crests. |
| **Foam is invisible** | 2-3px dots at ~60 count, weak contrast | `Ocean2D.ts` foam section | Should be visible white foam lines along wave crests, not scattered dots |
| **Shimmer is negligible** | 1 dot per ~8000px, phase-flickering | `Ocean2D.ts` shimmer section | Should be sun glint lines/patches, not invisible star-twinkle |
| **Sky has visible banding** | Only 20 gradient steps | `PixiContext.ts` sky gradient | Should be 100+ steps for smooth sunset. Reference shows smooth coral→peach gradient |
| **Wake trail invisible** | 0.2 alpha, 0.4s lifetime, 4-7 particles | `SailingState.ts` wake section | Should be dense white foam trail, alpha 0.5+, 1s+ lifetime |
| **Seagulls are static dots** | 4 birds, V-shape lines, no animation | `SailingState.ts` seagull section | Should have wing flap, depth layering, more birds |
| **Atmosphere particles sparse** | 0.15s spawn, 1 particle, abrupt appear/despawn | `SailingState.ts` atmosphere section | Storm should have dense rain, volcanic should have visible embers |
| **No bioluminescent water** | Not implemented | — | IMG_4099 shows THE signature visual: glowing cyan lines in dark water. Missing entirely. |
| **No wooden UI frames** | HUD/menus use flat styling | UI files | Reference shows carved wood frames (#8B6B4D), parchment backgrounds (#F0E8D8) |

## Key Files
| File | Purpose |
|------|---------|
| `src/states/SailingState.ts` | Main sailing game loop — **camera zoom fix needed here** |
| `src/states/FishingState.ts` | Fishing minigame — best visual scene currently |
| `src/states/BattleState.ts` | Battle state (HTML UI, do not change logic) |
| `src/world/Ocean2D.ts` | Animated ocean — **needs major visual overhaul** |
| `src/world/WorldManager2D.ts` | Spawns world entities — ship/island scaling |
| `src/world/FishingZone2D.ts` | Zone rings, init/update/dispose |
| `src/effects/ParticleEffects2D.ts` | Particles — needs density increase |
| `src/rendering/PixiContext.ts` | App init, 5 layers — **sky gradient banding fix** |
| `src/rendering/Camera2D.ts` | 2D follow camera — system works, just not used at correct zoom |
| `src/utils/FishSpriteGenerator.ts` | Procedural fish pixel art |

## Build Commands
```bash
# from /Users/willp/Local Sites/corsair-catch/
npm run dev     # dev server
npm run build   # production build
npx tsc --noEmit  # type check
npm test        # 41 tests (logic only, no rendering)
```

## Critical Rules
- **PixiJS v8 API**: `.rect(x,y,w,h).fill(color)` NOT `beginFill().drawRect()` — v8 changed this
- **Do NOT change battle system** — 41 tests cover it, it works
- **Do NOT import Three.js** — fully removed, never re-add
- **getWaveHeight() in Ocean2D** — preserve the Gerstner wave math function
- **Fishing scene is side-view** — NOT top-down. Draw in `fxLayer` at screen coordinates
- **Deploy target**: Netlify (corsair-catch-demo.netlify.app) and itch.io HTML5
- **Camera zoom MUST be 5-9** — never 1.0. Ships must be readable, not microscopic.
- **Reference art is the ONLY acceptable visual target** — if it doesn't look like `public/sprite_unedited/`, it's not done
