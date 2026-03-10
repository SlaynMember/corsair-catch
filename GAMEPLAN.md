# Corsair Catch — Master Style & Design Bible

## Game Identity
**Title**: Corsair Catch
**Tagline**: "Pokémon meets the Seven Seas"
**Genre**: Pirate fishing RPG — catch, level, battle
**Platform**: Browser (HTML5), deploy to itch.io and Netlify
**Stack**: PixiJS v8 + TypeScript + Vite

## Visual Target
Match EXACTLY the "Pirate's Cove Fishing" mobile game aesthetic.
Reference screenshots saved at:
- `public/sprite_unedited/IMG_4097.PNG` — dock fishing, warm sunset, glowing teal ripple
- `public/sprite_unedited/IMG_4098.PNG` — ship deck fishing, wooden UI, CATCH bar, "BITE!" popup
- `public/sprite_unedited/IMG_4099.PNG` — night ship fishing, bioluminescent swirling water
- `public/sprite_unedited/characters.png` — 4 chunky pixel pirate character classes
- `public/sprite_unedited/fish.png` — elemental fish sprites (fire, water, nature, electric)
- `public/sprite_unedited/sunset cove.png` — aerial dock + glowing fishing spot scene
- `public/sprite_unedited/ships.png` — pirate ship styles
- `public/sprite_unedited/items.png` — bait, potions, gear
- `public/sprite_unedited/rods.png` — fishing rod styles

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
- Camera2D: zoom=9, lerp follow at 0.1, world bounds clamping

### Code Rules
- **DO NOT modify**: `BattleSystem.ts`, `FishingSystem.ts` (logic), `SaveManager.ts`, `AudioManager.ts`
- **Extend only**: `SaveManager.ts` — add `gold`, `baitInventory`, `discoveredTreasures` fields
- Tests must pass: `npm test` → 41/41 always. Run after every milestone.
- TypeScript strict: `npx tsc --noEmit` → 0 errors. Run after every milestone.
- Commit after every milestone: `git add -A && git commit -m "[M#] description"`

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

## Fish Species (62 total — expand from 22)

Naming convention:
- **Common** (Tier 1): [Adjective][Sea creature] — Ember Snapper, Frost Carp, Jade Eel
- **Uncommon** (Tier 2): [Element]fin/jaw/ray/claw — Blazefin, Frostring, Coralclaw
- **Rare** (Tier 3): [Grand/Dread/Ancient/Void] + noun — Grand Infernoray, Void Serpent
- **Legendary** (1 per type): Mythic proper name — The Tidewyrm, Lord of Embers, Storm Leviathan

Target per type: Water (12), Fire (10), Electric (9), Nature (9), Abyssal (8), Storm (8), Normal (6) = 62 total.

## Key Features Roadmap

- [x] Turn-based battle system (41 tests passing)
- [x] Fishing mechanics (tension, cast power, rarity)
- [x] Save/load (party, position, playtime)
- [x] Audio (procedural SFX + BGM via Web Audio API)
- [ ] **M1**: PixiJS v8 replaces Three.js — ocean visible, ship moves
- [ ] **M2**: Archipelago world — 6 islands, 4000x4000, minimap
- [ ] **M3**: Fishing side-view scene (match IMG_4097-4098 exactly)
- [ ] **M4**: Island docking + X-mark treasure + shop system
- [ ] **M5**: 62 fish database + procedural pixel art generator
- [ ] **M6**: Character sprite animations (2-3 frames each)
- [ ] **M7**: Battle polish + per-island atmosphere effects
- [ ] **M8**: Deploy to itch.io + Netlify

## Bait System (new feature)

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
corsair-catch/
├── GAMEPLAN.md          ← YOU ARE HERE (style bible)
├── CLAUDE.md            ← Architecture rules
├── src/
│   ├── core/
│   │   ├── Game.ts              — Main entry, PixiApp init
│   │   ├── GameLoop.ts          — Fixed timestep loop
│   │   ├── StateMachine.ts      — Push/pop states
│   │   ├── ECS.ts               — Entity/Component/System
│   │   ├── InputManager.ts      — Keyboard + touch
│   │   ├── AudioManager.ts      ← DO NOT MODIFY
│   │   ├── SaveManager.ts       ← EXTEND ONLY (add gold/bait)
│   │   ├── AnimationManager.ts  — NEW: sprite sheet animation
│   │   └── EventBus.ts          — Pub/sub events
│   ├── rendering/
│   │   ├── PixiContext.ts       — NEW: 5-layer PixiJS app
│   │   └── Camera2D.ts          — NEW: follow camera zoom=9
│   ├── world/
│   │   ├── Ocean2D.ts           — NEW: animated teal water bands
│   │   ├── WorldManager2D.ts    — NEW: islands, ships, zones
│   │   └── IslandDock.ts        — NEW: docking + treasure
│   ├── states/
│   │   ├── MainMenuState.ts     — keep (update styling)
│   │   ├── SailingState.ts      — MAJOR UPDATE: PixiJS rendering
│   │   ├── FishingState.ts      — MAJOR UPDATE: side-view scene
│   │   └── BattleState.ts       ← DO NOT MODIFY LOGIC
│   ├── systems/
│   │   ├── BattleSystem.ts      ← DO NOT MODIFY
│   │   ├── FishingSystem.ts     ← DO NOT MODIFY LOGIC
│   │   ├── MovementSystem.ts    — update for PixiJS
│   │   ├── AISystem.ts          — keep
│   │   └── CollisionSystem.ts   — keep
│   ├── data/
│   │   ├── fish-db.ts           — EXPAND: 22 → 62 fish
│   │   ├── move-db.ts           ← DO NOT MODIFY
│   │   ├── type-chart.ts        ← DO NOT MODIFY
│   │   ├── enemy-db.ts          — UPDATE: 3 → 6 captains
│   │   ├── zone-db.ts           — UPDATE: map to 6 islands
│   │   └── item-db.ts           — ADD: bait types
│   ├── utils/
│   │   ├── FishSpriteGenerator.ts — NEW: procedural pixel art
│   │   ├── math.ts              — keep
│   │   └── easing.ts            — keep
│   └── ui/
│       ├── UIManager.ts         — update for wooden style
│       ├── HUD.ts               — update: compass, minimap
│       ├── BattleUI.ts          — update: fish sprites, pixel font
│       ├── FishingUI.ts         — REWRITE: side-view UI
│       ├── InventoryUI.ts       — update: wooden style
│       ├── SettingsUI.ts        — update: wooden style
│       └── ui-utils.ts          — update TYPE_COLORS
└── public/
    ├── sprite_unedited/         ← Reference art (DO NOT MODIFY)
    └── sprites/                 ← Game sprites (editable)
```
