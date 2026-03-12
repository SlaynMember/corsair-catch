# Corsair Catch — CLAUDE.md

## What This Game Is
A browser-based pirate RPG. Pokémon Diamond clone set at sea.
- Walk the beach, fish at the water's edge, fight crabs/enemies, collect items
- Catch fish that become your battle crew (Pokémon-style turn-based combat)
- Eventually sail to other islands, upgrade ships, fight pirate captains

**Tagline:** "Pokémon meets the Seven Seas"
**Live:** corsair-catch-demo.netlify.app
**Repo:** https://github.com/SlaynMember/corsair-catch
**Local:** c:/Users/willp/Local Sites/corsair-catch

---

## Stack (Current — DO NOT CHANGE)
- **Engine:** Phaser 3 (v3.88+) with TypeScript
- **Build:** Vite (port 3000, open: false)
- **Physics:** Phaser Arcade Physics — gravity is 0,0 (top-down game, NEVER change)
- **Deploy:** Netlify (auto-deploy from GitHub main)
- **Node:** 20+

---

## Scene Architecture
```
BootScene → MainMenuScene → BeachScene ⇄ BattleScene
```
All scenes in `src/scenes/`.

| Scene | File | Status |
|-------|------|--------|
| BootScene | `src/scenes/BootScene.ts` | Loads all assets, transitions to MainMenu |
| MainMenuScene | `src/scenes/MainMenuScene.ts` | Sunset beach title screen, NEW GAME button with fade transition |
| BeachScene | `src/scenes/BeachScene.ts` | Player walks beach, WASD 8-dir, crabs, items, dialogue |
| BattleScene | `src/scenes/BattleScene.ts` | Pokémon-style turn combat; launched/paused from BeachScene |

---

## Player Sprites (Will's Hand-Made Assets — DO NOT OVERWRITE OR DELETE)
Location: `public/sprites/pirate/`

```
breathing-idle/    ← idle (8 directions × 4 frames)
running-4-frames/  ← run (8 directions × 4 frames)
picking-up/        ← pickup (east, south, west × 5 frames)

Structure per animation:
  {direction}/frame_000.png ... frame_003.png
  Directions: east, north, north-east, north-west, south, south-east, south-west, west
```

**Texture key format:** `pirate-idle-{dir}-{frame}` and `pirate-run-{dir}-{frame}`
- Example: `pirate-idle-south-0`, `pirate-run-north-east-2`
- North idle has no sprite — BeachScene falls back to south for idle only

---

## Fish & Reference Assets (Will's Hand-Made — NEVER DELETE)
- `public/sprite_unedited/fish.png` — hand-drawn fish sprite sheet 1
- `public/sprite_unedited/fish2.png` — hand-drawn fish sprite sheet 2
- `public/sprite_unedited/IMG_4097-4100.PNG` — visual reference (Pirate's Cove Fishing app)
- `public/sprite_unedited/ships.png` — ship sprites

---

## Visual Target — Match Pirate's Cove Fishing (reference in public/sprite_unedited/)
- Warm coral/orange sunset sky
- Teal/cyan ocean with animated wave bands
- Chunky pixel art characters, 1px black outlines
- Wooden diegetic UI (color `#8B6B4D`, parchment bg `#F0E8D8`)
- Bioluminescent glow for deep water

### Color Palette
```
Sky:       #E07856 → #F4A76D → #FFD59E (sunset gradient)
Ocean:     #2DAFB8 (surface)  #1B8A96 (deep)
Sand:      #F0E8D8
Wood UI:   #8B6B4D
Gold:      #FFE066
Dark BG:   #2C1011
```

---

## Graphics Architecture
All backgrounds, scenery, UI, and enemies are **procedural Phaser shapes** (rectangles, ellipses, circles, Graphics). Only the player character uses real PNG sprites (`public/sprites/pirate/`). When improving visuals, edit the draw methods in each scene — no external tileset/texture files involved.

**Phaser container gotcha:** `this.add.rectangle()` places objects in scene world-space, NOT inside a container automatically. Always save refs and call `container.add([...])` explicitly or children will render at wrong screen positions.

---

## Asset Generation MCPs (configured in `.mcp.json` — gitignored)
- **nano-banana-2** — Gemini image gen (`uvx nanobanana-mcp-server@latest`, needs `GEMINI_API_KEY`)
- **stitch** — Google Stitch UI design tool (`npx -y stitch-mcp`, Google auth)
- **pixellab** — Pixel art specialist, 8-dir sprites + tilesets (`uvx pixellab-mcp`, needs `PIXELLAB_API_SECRET`)
- PixelLab free trial: 40 generations, no card — best for matching existing sprite style

---

## Critical Rules
- **ZERO GRAVITY** — top-down game. `gravity: { x:0, y:0 }` in `src/main.ts`. Never change.
- **Phaser 3 only** — no PixiJS, no Three.js, never re-add them
- **Pixel art** — `pixelArt: true`, `roundPixels: true`, `antialias: false`
- **parent: 'game-shell'** — Phaser mounts into `#game-shell` in index.html
- **Port 3000, no auto-open** — vite.config.ts is already set correctly
- **Never touch Will's sprites** — fish.png, fish2.png, pirate/ folder

---

## Build Commands
```bash
npm run dev       # localhost:3000 (never auto-opens browser)
npm run build     # production
npx tsc --noEmit  # type check before every commit
```

---

## Asset Pipeline

### Fonts (installed March 11 2026)
- `public/fonts/pixel_pirate/pixel_pirate.ttf` → CSS name `'PixelPirate'` — use for ALL titles, scene headers, UI headings (CAPS)
- `public/fonts/pokemon-dp-pro/pokemon-dp-pro.otf` → CSS name `'PokemonDP'` — use for all body text, dialogue, button labels, in-game UI
- Both loaded via `@font-face` in `index.html`. Phaser text uses font family names directly.

### Sprite Sheets (sliced, auto-cropped, transparent bg)
- `public/sprites/crab-basic/{dir}.png` — 8 directional crab overworld sprites (344×384px source)
- `public/sprites/crab-battle/{anim}-{0-3}.png` — cannonball crab battle animations (idle/attack/hurt/walk × 4 frames)
- `public/sprites/items/wood.png`, `rope.png`, `rope2.png`, `bait.png` — ground collectibles
- `public/sprites/fish/fish-{1|2}-{00-19}.png` — 40 fish monster sprites from sheets 1.png + 2.png
- `public/sprites/environment/palm-tree.png` — standalone pixel palm tree (white bg keyed out)
- `public/backgrounds/beach-bg.png` — AI-generated (nano-banana-2) full beach bg 1376×768
- `public/backgrounds/menu-bg.png` — AI-generated main menu bg with palms + ship + dock

### Fish Sheet Index (for starter picker + battle use)
Sheet 1 (fish-1-00 to fish-1-19, row-major 4×5):
- 00: sea serpent | 01: green coiled serpent | 02: lava fish | 03: cyan octopus
- 04: clownfish | 05: sea worm | 06: black eel | 07: fire serpent
- 08: submarine fish | 09: mech fish | 10: gear manta | 11: potion eel
- 12: mossy fish | 13: clownfish 2 | 14: black anglerfish | 15: metal eel
- 16: mermaid | 17: skeleton fish | 18: unicorn fish | 19: green octopus

Sheet 2 (fish-2-00 to fish-2-19):
- 00: blue angler | 01: blue sea dragon | 02: jellyfish | 03: void fish
- 04: fire koi | 05: blue carp | 06: blue school | 07: ghost fish
- 08: flower fish | 09: yellow/blue fish | 10: sand fish | 11: steampunk fish
- 12: treasure chest fish | 13: black anglerfish 2 | 14: seaweed fish | 15: lava fish
- 16: electric eel | 17: gold mech fish | 18: octosquid | 19: ghost fish 2

**Recommended starters:** fish-1-04 (clownfish), fish-2-04 (fire koi), fish-2-08 (flower fish)

---

## Current Status (March 11 2026 — Session 3)
- [x] Phaser 3 full rebuild (replaced broken PixiJS codebase)
- [x] BootScene → MainMenuScene → BeachScene → BattleScene pipeline
- [x] 8-direction movement, idle/run/pickup animations
- [x] Ground items (wood, rope, bait) with collect + pickup animation (stops movement on pickup)
- [x] Dialogue system (typewriter effect, SPACE to advance)
- [x] Inventory panel (I key, wooden frame UI)
- [x] AI-generated beach bg + main menu bg (nano-banana-2, Gemini Flash)
- [x] AI-generated pixel palm tree sprite (white bg keyed, placed in both scenes)
- [x] Palm tree physics colliders (staticGroup, player bounces off trunks)
- [x] PixelPirate font (titles) + PokemonDP font (body) — installed + wired + preloaded in HTML
- [x] Subtitle changed to "Sail. Catch. Conquer."
- [x] 40 fish monster sprites sliced and loaded (sheets 1+2, transparent bg)
- [x] Player display size 64×64 (was 32×32 native)
- [x] Items scale 0.055 (~28px — matches player scale)
- [x] Shadow tuned (28×7, 0.20 alpha, feet-anchored)
- [x] Horizon line masked (sand rect overlay at SAND_TOP)
- [x] Dock removed from BeachScene
- [x] Treasure chest starter flow — no crabs until fish chosen
- [x] Starter picker UI — 3 fish cards (Clownfin/Fire, Tidecrawler/Water, Mosscale/Nature)
- [x] Battle WASD + space menu navigation
- [x] Battle freeze fix — move IDs corrected (ember→flame_jet, vine_lash→coral_bloom)
- [x] Battle WASD confirm uses valid move list (not raw moves array index)
- [x] Battle shows fish sprites when available (falls back to geometric shapes)
- [x] Crab west-direction uses flipX of east sprite

### Known Issues / Next Session Priorities
- [ ] **Fish stat database** — 40 sprites need: name, type, HP, moves, evolution stage. Deploy subagent to read each sprite visually and generate full data file `src/data/fish-sprite-db.ts`
- [ ] **BattleScene polish** — replace all `"Press Start 2P"` font refs with `PokemonDP`. Show crab-battle animation frames during attack. Enemy crab should use `crab-battle/idle-X.png` sprites
- [ ] **Starter picker texture keys** — currently uses fish-1-04/05/10 but recommended starters are fish-1-04, fish-2-04, fish-2-08. Fix to match visual intent
- [ ] **Dialogue font** — all in-game dialogue still uses Press Start 2P. Swap to PokemonDP throughout BeachScene + BattleScene
- [ ] **Fishing minigame** — SPACE at water edge. Needs FishingScene or overlay. Fish sprites are ready
- [ ] **NPC starter** — captain NPC near spawn who gives tutorial dialogue
- [ ] **Move-db audit** — ensure all starter + enemy moves exist: tackle ✅, flame_jet ✅, bubble_burst ✅, coral_bloom — VERIFY this exists

---

## Build Roadmap

### Phase 4 — Polish Pass (Next Session)
1. Fish sprite stat database (subagent visual analysis → src/data/fish-sprite-db.ts)
2. Full font swap PokemonDP in BeachScene + BattleScene dialogue/UI
3. Starter picker — fix texture keys to use best-looking starters
4. Battle crab animation (crab-battle/idle frames cycling)
5. Fishing minigame (SPACE at water edge)

### Phase 5 — Content Expansion
6. More beach enemy types (use PixelLab for new sprites)
7. NPC placement (captain, dock master, navigator)
8. SailingScene skeleton
9. Save/load system

---

## Next Chat Prompt
> Read CLAUDE.md fully. Then: (1) Audit move-db.ts — verify coral_bloom exists, fix any missing starter moves. (2) Deploy a subagent to visually analyze each fish sprite in public/sprites/fish/ and generate src/data/fish-sprite-db.ts with name, type, baseHP, suggestedMoves[], evolutionStage for all 40 fish. (3) Swap all "Press Start 2P" font references in BeachScene.ts and BattleScene.ts to "PokemonDP, monospace". (4) Fix starter picker texture keys to fish-1-04, fish-2-04, fish-2-08. (5) Add crab-battle idle animation cycling in BattleScene enemy display.
8. SailingScene (top-down ocean, ship movement)
9. Fishing hotspot zones with fish encounters

---

## Preserved Data Files (Old Build — Still Valid, Reuse These)
- `src/data/fish-db.ts` — 62 fish species
- `src/data/move-db.ts` — 39 battle moves
- `src/data/zone-db.ts` — 3 ocean zones
- `src/data/enemy-db.ts` — 3 enemy captains
- `src/data/ship-db.ts` — 20 ship blueprints

---

## Deploy
Push to GitHub main → Netlify auto-deploys to corsair-catch-demo.netlify.app
Always run `npx tsc --noEmit` before committing.
