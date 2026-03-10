# Corsair Catch — Claude Code Project Context

## What This Game Is
A browser-based pirate fishing RPG. You sail a top-down pixel art ocean, fish at glowing hotspots, and battle enemy pirate captains with a Pokémon-style turn-based combat system. Your crew is the fish you catch.

**Tagline:** *"Pokémon meets the Seven Seas"*

## Target Aesthetic — MATCH THESE REFERENCES
The visual target is **Pirate's Cove Fishing** (mobile game). Key characteristics:
- **Warm tropical palette**: coral/sunset skies, teal ocean, sandy beaches, rich wood browns
- **Pixel art sprites** — chunky, readable at small sizes, high contrast against background
- **Sailing map**: top-down view, camera follows player ship, animated water bands, pulsing zone rings
- **Fishing scene**: SIDE-VIEW — player ship visible from the side on the right, fishing rod extending left over the water, glowing teal ripple where bobber is, sky/horizon visible in background
- **Battle UI**: Pokémon-style HTML overlay (already implemented, do not change)

Reference images are saved at: `/Users/willp/Local Sites/game-design/IMG_4097.PNG`, `IMG_4098.PNG`, `IMG_4099.PNG`

## Architecture
- **Stack**: PixiJS v8, TypeScript, Vite — deployed as HTML5 to itch.io
- **Rendering**: 5-layer PixiJS stack via `PixiContext`:
  - `backgroundLayer` — static sky gradient (screen space)
  - `oceanLayer` — animated water bands + foam (screen space, NOT camera-transformed)
  - `worldLayer` — ships, island, zones, seagulls (camera-transformed)
  - `fxLayer` — particles, ripples, wake effects (screen space for fishing, world space for sailing)
  - Camera: `Camera2D` at `src/rendering/Camera2D.ts`, zoom=9, lerp follow
- **ECS**: Custom Entity/Component/System in `src/core/ECS.ts`
- **State machine**: push/pop in `src/core/StateMachine.ts`
- **States**: `SailingState` (main), `FishingState` (push), `BattleState` (push), `MainMenuState`
- **Game data**: `src/data/fish-db.ts` (62 species), `src/data/move-db.ts` (39 moves), `src/data/zone-db.ts` (3 zones), `src/data/enemy-db.ts` (3 captains)

## Current Status
All milestones M1–M8 complete. Deployed to Netlify.

**Done:**
- Three.js fully replaced with PixiJS v8
- Ocean2D: animated teal water bands + foam dots, shimmer highlights, depth shading, ripple lines
- WorldManager2D: pixel art ships (golden player, red/purple/black enemies), island with palms
- FishingZone2D: pulsing colored rings with zone labels
- Seagulls: orbiting V-shape graphics
- Day/night ColorMatrixFilter cycle (120s)
- SailingState: full sailing, movement, AI, collision, battles, save/load all working
- FishingState: full side-view scene with detailed ship hull, character, fishing rod, bobber, ripple rings, seagulls, island silhouettes, waterline foam, lantern glow
- 62 fish species with procedural pixel art sprite generator (FishSpriteGenerator)
- AnimationManager with canvas sprite sheets
- Island docking UI, treasure hunt, shop system
- Per-island atmosphere particles (volcanic embers, storm rain, coral bubbles)
- Battle UI with fish sprites wired into battle cards
- Ocean polish: shimmer highlights, depth shading, more ripple lines

**Needs work:**
- (none — all milestones complete, deployed to Netlify at corsair-catch-demo.netlify.app)

## Key Files
| File | Purpose |
|------|---------|
| `src/states/SailingState.ts` | Main sailing game loop |
| `src/states/FishingState.ts` | Fishing minigame — full side-view scene |
| `src/states/BattleState.ts` | Battle state (HTML UI, no Pixi rendering needed) |
| `src/world/Ocean2D.ts` | Animated ocean, getWaveHeight() (Gerstner waves) |
| `src/world/WorldManager2D.ts` | Spawns all world entities with pixel art visuals |
| `src/world/FishingZone2D.ts` | Zone rings, init/update/dispose |
| `src/effects/ParticleEffects2D.ts` | Particles — ParticleBurst, RippleEffect |
| `src/rendering/PixiContext.ts` | App init, 5 layers, sky gradient |
| `src/rendering/Camera2D.ts` | 2D follow camera, zoom=9 |

## Build Commands
```bash
# from corsair-catch/
npm run dev     # dev server
npm run build   # production build
npx tsc --noEmit  # type check
npm test        # 41 tests (logic only, no rendering)
```

## Critical Rules
- **PixiJS v8 API**: `.rect(x,y,w,h).fill(color)` NOT `beginFill().drawRect()` — v8 changed this
- **Do NOT change battle system** — 41 tests cover it, it works
- **Do NOT import Three.js** — fully removed, never re-add
- **getWaveHeight() in Ocean2D** — preserve verbatim (Gerstner wave math)
- **Fishing scene is side-view** — NOT top-down. Draw in `fxLayer` at screen coordinates
- **Deploy target**: itch.io HTML5. Build to `dist/`, upload zip.
