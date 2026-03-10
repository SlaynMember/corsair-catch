# Corsair Catch — Master Style & Design Bible

## Game Identity
**Title**: Corsair Catch
**Tagline**: "Pokémon meets the Seven Seas"
**Genre**: Pirate fishing RPG — catch, level, battle
**Platform**: Browser (HTML5), deploy to Netlify and itch.io
**Stack**: PixiJS v8 + TypeScript + Vite
**Live**: corsair-catch-demo.netlify.app
**Repo**: https://github.com/SlaynMember/corsair-catch
**Local**: /Users/willp/Local Sites/corsair-catch

## Visual Target — NON-NEGOTIABLE
Match EXACTLY the "Pirate's Cove Fishing" mobile game aesthetic.
Reference screenshots saved at: `public/sprite_unedited/`

### Scene-by-Scene Visual Requirements (from reference analysis):

**Fishing Scenes (IMG_4097, IMG_4098, IMG_4099):**
- Sky: smooth multi-stage sunset — deep coral (#E07856) top → warm peach (#F4A76D) → golden (#FFD080) at horizon
- Clouds: off-white (#F5F0E8) with peachy-coral shadow undersides (#E8A090)
- Water zones by depth:
  - Shallow/calm: bright teal (#2DAFB8) with gentle ripple rings
  - Active/mid: deeper teal (#1B8A96) with intense glowing ripples (#1DFFFF cyan core)
  - Deep/night: dark blue (#0D3B5C) with BIOLUMINESCENT cyan lines (#0FFFFF) — swirling organic patterns, creature silhouettes below surface
- Ship hull: warm brown planks (#8B6F47 base, #6B5438 shadow), visible railings, cabin, rope rigging
- Bobber: red/white dot with concentric cyan ripple rings expanding outward
- UI: brown panel (#6B5438) with rounded corners, green catch meter, "BITE!" popup

**Battle Scene (IMG_4100):**
- Bright turquoise water (#2BA8C8) with animated wave bands and foam
- Enemy captain + creature sprites: chunky, iconic, 64px+ with aggressive poses
- Pokémon-style battle menu: FIGHT / ITEM / RUN in white text on dark brown (#3B2817)
- HP bars with wooden UI frames (brown border, cream fill)
- Dialog box: cream/beige (#E8DCC8) with dark text

**Opening Scene (opening scene.png):**
- Sandy beach foreground with character center-left
- Sunset sky gradient framed by palm tree silhouettes
- "CORSAIR CATCH" title: gold serif (#FFD040) with dark brown shadow, prominent upper-center
- Directional arrow guiding player

**World Map (sunset cove.png, coral reef.png):**
- Top-down with warm golden-hour lighting
- Horizontal wave bands (NOT flat gradient) — darker bands alternate with lighter to suggest rolling waves
- Islands with sandy shores, palm trees, wooden docks extending into water
- Distant island silhouettes with atmospheric perspective (lighter, less saturated)
- Coral reef: visible sand floor through translucent water, vibrant coral formations (purple #B73B7A, pink #F0709E, orange #FF9A5A)

**Aquapedia UI (corsaircatchaquapedia.png):**
- Wooden frame border (#8B6B4D) with beveled 3D edges
- Parchment/cream background (#F0E8D8)
- Fish grid (4×4) with individual framed thumbnails
- Detail card: large fish illustration, name, type badge, rarity indicator, stats
- Diegetic design — feels like a pirate's logbook, not a generic HUD

## Master Style Prompt
16-bit pixel art, retro RPG aesthetic, warm and vibrant color palette with rich sunset
oranges, deep ocean blues, and tropical teals. Characters are chunky chibi-proportioned
sprites with expressive faces, detailed clothing, and clear silhouettes. Environments
feature layered parallax-style backgrounds with atmospheric lighting — lantern glows,
bioluminescent water effects, and golden-hour sunsets. Ocean water uses animated shimmer
tiles in cerulean and aquamarine with subtle wave patterns. Fish and creatures are
fantastical and elemental (fire, water, thunder, nature types) with bold outlines,
glowing particle effects, and distinct personality. UI elements use wooden plank frames
with warm brown tones and pixel-font labels. Pirate aesthetic throughout — tricorn hats,
eyepatches, ship rigging, treasure chests, dock planks, crow's nests. Style references:
Stardew Valley meets Pokemon meets old-school JRPG. Pixel density: ~32x32 to 64x64 sprite
base, scaled up 3-4x. No anti-aliasing. Hard pixel edges only.

## Context-Specific Style Addons

### Fishing Scene
Side-scrolling view. Pirate character on ship deck (right 30% of screen) casting a glowing
teal lure left over the water. Concentric ripple ring effect on water surface in cyan
(#00E5FF). Twilight or sunset sky background — warm coral to peach gradient. Tropical
island silhouettes in distance with slight parallax. Ship hull visible from side (wooden
brown planks, rope rigging, lantern at bow). Fishing rod arc from character to water.
Bobber: red/white dot. Bottom UI: wooden-frame tension bar (green→yellow→red).

### Battle Scene
Turn-based RPG battle layout. Two fish combatants facing off across water/sandbar. HP bars
with wooden UI frames (brown border #8B5E3C, cream fill #F5E6C8). Elemental fish sprites
animated (3-frame wiggle). Damage numbers in pixel font. Type effectiveness badges. Action
spark effects matching type color. Battle background: ocean waves matching current biome.

### World/Exploration Map
Top-down view. 4000x4000 pixel world. Tropical archipelago with 6 named islands. Wooden
docks visible at island edges. Animated ocean bands in teal/aquamarine. Small fish sprites
swimming freely in shallow zones. Compass rose in corner. Minimap top-right (120x120px,
dark bg, color-coded island dots, gold player dot). Fog-of-war reveals as you explore.

**CRITICAL**: Camera zoom must be 5-9x so the player ship is 15-25% of viewport width.
At zoom=1, the ship is microscopic. The world should feel intimate and detailed, not vast and empty.

### Character Design
Chunky pixel art, ~32x32 base (scaled 4x). 4 classes:
1. **Fisherman**: red bandana, blue shirt, fishing rod — main player class
2. **Captain**: tricorn hat, long coat, sword — battle captain archetype
3. **Cook**: white chef hat, striped apron, ladle — support class
4. **Navigator**: wide-brim hat, telescope, explorer vest — scout class
All have 3-frame animations: idle (2-frame bob), walk (3-frame step), action (rod/sword raise).

### Fish/Creature Design
32x32 base sprite. Bold dark outline (#111). Glowing elemental particle effects per type.
3-frame swim animation (body wiggle + tail sweep). Named label below in pixel font.
Types: Fire (flames), Water (bubbles), Electric (sparks), Nature (leaves), Abyssal (void
particles), Storm (cloud puffs), Normal (shimmer).

Reference fish sprites (fish.png, fish2.png) show:
- 60-80px wide, organic flowing shapes with anti-aliased curves
- 4-6 colors per fish with strategic highlights on upper body
- Each fish has a UNIQUE silhouette (spiky urchin, streamlined ghost, armored plates, bioluminescent rays)
- Type colors telegraph mechanics: spiky=aggressive, smooth=fast, glowing=rare

## Color Palette

| Role | Name | Hex |
|------|------|-----|
| Ocean teal | Primary water | `#3AB8C8` |
| Aquamarine | Water shimmer | `#5DD4C8` |
| Deep ocean | Below surface | `#1A3A5C` |
| Sky coral | Sunset top | `#FF7849` |
| Sky orange | Sunset mid | `#FF9B5C` |
| Sky peach | Sunset horizon | `#FFD4A8` |
| Night sky | Dark mode | `#0A1628` |
| Sand | Beach/island | `#F4C87A` |
| Wood dark | UI frames | `#8B5E3C` |
| Wood medium | UI body | `#5C3A1E` |
| Wood light | UI inset | `#C4854A` |
| Cream | Text areas | `#F5E6C8` |
| Player ship | Golden | `#FFD700` |
| Enemy ship 1 | Crimson | `#DC143C` |
| Enemy ship 2 | Deep purple | `#4B0082` |
| Enemy ship 3 | Black | `#1A1A2E` |
| Catch ripple | Cyan glow | `#00E5FF` |
| Bioluminescent | Deep glow | `#0FFFFF` |
| Fire type body | Orange-red | `#E8521A` |
| Fire type fin | Dark orange | `#C23E0E` |
| Fire type effect | Flame yellow | `#FF9B3D` |
| Water type body | Ocean blue | `#2E86DE` |
| Water type fin | Deep blue | `#1A6BAD` |
| Water type effect | Light blue | `#8ED6FF` |
| Electric type body | Yellow | `#FFD700` |
| Electric type fin | Gold | `#D4A800` |
| Electric type effect | Pale yellow | `#FFF87A` |
| Nature type body | Forest green | `#27AE60` |
| Nature type fin | Dark green | `#1E8449` |
| Nature type effect | Aqua | `#7FFFD4` |
| Abyssal type body | Void purple | `#6C3483` |
| Abyssal type fin | Dark purple | `#4A235A` |
| Abyssal type effect | Lavender | `#D7BDE2` |
| Storm type body | Slate gray | `#5D6D7E` |
| Storm type fin | Dark slate | `#4A5A6A` |
| Storm type effect | Ice blue | `#E8EAF6` |
| Normal type body | Warm gold | `#D4AC0D` |
| Normal type fin | Bronze | `#B7950B` |
| Normal type effect | Cream | `#FAD7A0` |

## Typography
- **Game font**: "Press Start 2P" (Google Fonts) — ALL pixel-art text, no exceptions
- Sizes: 8px (HUD/labels), 10px (menu items), 12px (subtitles), 16px (titles), 24px (big headers)
- No anti-aliasing on text
- Load in index.html: `<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">`

## Architecture Rules (mandatory for ALL future agents)

### Rendering
- **PixiJS v8 ONLY**. Three.js is completely banned — remove all imports if found.
- PixiJS v8 API pattern: `.rect(x,y,w,h).fill(color)` NOT `beginFill().drawRect()`
- 5-layer stack (create in this order, render bottom-to-top):
  1. `backgroundLayer` — sky gradient (screen space, fixed)
  2. `oceanLayer` — animated water bands + foam (screen space)
  3. `worldLayer` — ships, islands, fishing zones (camera-transformed)
  4. `fxLayer` — particles, ripples, wake effects (mixed)
  5. `uiLayer` — HUD, minimap, compass (screen space, fixed)
- `PIXI.Application` init: `{ resolution: 1, antialias: false, backgroundAlpha: 0 }`
- Sprite scaling: nearest-neighbor pixel art — `texture.source.scaleMode = 'nearest'`
- **Camera2D: zoom=7-9, lerp=0.1** — NEVER zoom=1.0. Ships must be readable.

### Code Rules
- **DO NOT modify**: `BattleSystem.ts`, `FishingSystem.ts` (logic), `SaveManager.ts`, `AudioManager.ts`
- **Extend only**: `SaveManager.ts` — add `gold`, `baitInventory`, `discoveredTreasures` fields
- Tests must pass: `npm test` → 41/41 always. Run after every milestone.
- TypeScript strict: `npx tsc --noEmit` → 0 errors. Run after every milestone.

## Game Loop & Progression

1. **Start** → Sunlit Cove (starter island, level 1-5 fish, tutorial)
2. **Explore** → catch starter fish → battle Captain Barnacle (lv5-7)
3. **Defeat** captain → party size +1, unlock adjacent islands on map
4. **Each island** has: unique fish types, captain to defeat, 1-3 X-mark treasures, shop items
5. **Collect gold** → buy better rods/bait at Merchant's Port → access rarer fish
6. **Defeat 3 main captains** → party expands to 6, endgame unlocked
7. **Endgame** → The Dread Corsair's Fortress, legendary fish, ultimate battle

## Islands & Encounters

| Island | Biome | Fish Types | Captain | Lv Range | Treasure |
|--------|-------|-----------|---------|----------|---------|
| Sunlit Cove | Tropical | Normal, Water | Captain Barnacle | 5-7 | Starter bait, potion |
| Coral Reef Atoll | Shallow reef | Water, Nature | Coralline Pete | 8-11 | Coral rod, rare bait |
| Volcanic Isle | Volcanic | Fire, Electric | Ignis the Burning | 12-15 | Fire rod, ember bait |
| Storm Reach | Open ocean | Storm, Electric | Admiral Ironhook | 16-20 | Storm rod, gold |
| Merchant's Port | Harbor | All commons | (no captain, shop) | — | Gold, all items |
| Dread Fortress | Abyss | Abyssal, Legendaries | The Dread Corsair | 25-30 | Legendary bait |

## Fish Species (62 total)

Naming convention:
- **Common** (Tier 1): [Adjective][Sea creature] — Ember Snapper, Frost Carp, Jade Eel
- **Uncommon** (Tier 2): [Element]fin/jaw/ray/claw — Blazefin, Frostring, Coralclaw
- **Rare** (Tier 3): [Grand/Dread/Ancient/Void] + noun — Grand Infernoray, Void Serpent
- **Legendary** (1 per type): Mythic proper name — The Tidewyrm, Lord of Embers, Storm Leviathan

Target per type: Water (12), Fire (10), Electric (9), Nature (9), Abyssal (8), Storm (8), Normal (6) = 62 total.

## Bait System

Baits found in treasure / bought in shop. Affect catch rarity:
| Bait | Effect | Price |
|------|--------|-------|
| Worm Bait (starter) | Normal rarity distribution | free |
| Glitter Lure | +15% uncommon rate | 50g |
| Deep Hook | +10% rare rate | 120g |
| Volcanic Ember | +20% fire type rate | 100g |
| Storm Fly | +20% storm/electric rate | 100g |
| Void Pearl | +20% abyssal rate, +5% legendary | 300g |

## Ship Cosmetics (shop feature)

| Cosmetic | Description | Price |
|----------|-------------|-------|
| Crimson Hull | Red color scheme | 500g |
| Midnight Skull | Black + skull flag | 500g |
| Azure Anchor | Blue + anchor flag | 500g |
| Golden Galleon | All-gold premium | 1500g |

## File Structure Reference

```
corsair-catch/                    ← /Users/willp/Local Sites/corsair-catch/
├── CLAUDE.md                     ← Architecture rules + honest status
├── GAMEPLAN.md                   ← YOU ARE HERE (style bible)
├── RALPH_PROMPT.md               ← Autonomous agent mission brief
├── src/
│   ├── core/
│   │   ├── Game.ts              — Main entry, PixiApp init
│   │   ├── GameLoop.ts          — Fixed timestep loop
│   │   ├── StateMachine.ts      — Push/pop states
│   │   ├── ECS.ts               — Entity/Component/System
│   │   ├── InputManager.ts      — Keyboard + touch
│   │   ├── AudioManager.ts      ← DO NOT MODIFY
│   │   ├── SaveManager.ts       ← EXTEND ONLY (add gold/bait)
│   │   ├── AnimationManager.ts  — Sprite sheet animation
│   │   └── EventBus.ts          — Pub/sub events
│   ├── rendering/
│   │   ├── PixiContext.ts       — 5-layer PixiJS app — FIX sky gradient banding
│   │   └── Camera2D.ts          — Follow camera — MUST use zoom=7-9
│   ├── world/
│   │   ├── Ocean2D.ts           — Animated water — NEEDS MAJOR VISUAL OVERHAUL
│   │   ├── WorldManager2D.ts    — Islands, ships, zones
│   │   └── IslandDock.ts        — Docking + treasure
│   ├── states/
│   │   ├── MainMenuState.ts     — Main menu
│   │   ├── SailingState.ts      — CRITICAL: camera zoom=1.0 bug here (line 126)
│   │   ├── FishingState.ts      — Best visual scene currently
│   │   └── BattleState.ts       ← DO NOT MODIFY LOGIC
│   ├── systems/
│   │   ├── BattleSystem.ts      ← DO NOT MODIFY
│   │   ├── FishingSystem.ts     ← DO NOT MODIFY LOGIC
│   │   ├── MovementSystem.ts
│   │   ├── AISystem.ts
│   │   └── CollisionSystem.ts
│   ├── data/
│   │   ├── fish-db.ts           — 62 fish species
│   │   ├── move-db.ts           ← DO NOT MODIFY
│   │   ├── type-chart.ts        ← DO NOT MODIFY
│   │   ├── enemy-db.ts          — 3 captains (expand to 6)
│   │   ├── zone-db.ts           — 3 zones (expand to 6)
│   │   └── item-db.ts           — Bait types
│   ├── utils/
│   │   ├── FishSpriteGenerator.ts — Procedural pixel art
│   │   ├── math.ts
│   │   └── easing.ts
│   └── ui/
│       ├── UIManager.ts         — Needs wooden frame styling
│       ├── HUD.ts               — Needs compass, minimap
│       ├── BattleUI.ts          — Fish sprites, pixel font
│       ├── FishingUI.ts         — Side-view UI
│       ├── InventoryUI.ts       — Needs wooden style
│       ├── SettingsUI.ts        — Needs wooden style
│       └── ui-utils.ts          — TYPE_COLORS
└── public/
    ├── sprite_unedited/         ← Reference art (DO NOT MODIFY)
    └── sprites/                 ← Game sprites (editable)
```
