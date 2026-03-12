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
All source sheets are 2000×2000 RGBA, 4×5 grid with 5-6px black grid lines.
Grid cell boundaries: cols `[6,498]` `[504,996]` `[1003,1495]` `[1501,1993]`, rows `[6,398]` `[404,797]` `[803,1196]` `[1202,1595]` `[1601,1993]`. Slicer uses 3px inset to skip AA edge pixels.

- `public/sprites/crab-basic/{dir}.png` — 8 directional crab overworld sprites
- `public/sprites/crab-battle/{anim}-{0-3}.png` — cannonball crab battle animations (idle/attack/hurt/walk × 4 frames)
- `public/sprites/items/wood.png`, `rope.png`, `rope2.png`, `bait.png` — ground collectibles (from beachitems.png)
- `public/sprites/fish/fish-{1|2}-{00-19}.png` — 39 fish (fish-2-08 is empty/missing)
- `public/sprites/fish/fish-3-{00-07}.png` — 8 fish from page 3
- `public/sprites/ships/ship-{00-19}.png` — 20 pirate ships
- `public/sprites/environment/palm-tree.png` — standalone pixel palm tree
- `public/backgrounds/beach-bg.png` — AI-generated full beach bg 1376×768
- `public/backgrounds/menu-bg.png` — AI-generated main menu bg with palms + ship + dock

### Fish Sheet Index (for starter picker + battle use)
Sheet 1 (fish-1-00 to fish-1-19, row-major 4×5):
- 00: compass map fish | 01: gold coin fish | 02: skull jellyfish | 03: dark void fish
- 04: fire koi | 05: crystal ice fish | 06: crystal shard fish | 07: stingray
- 08: flower leaf fish | 09: golden splash fish | 10: driftwood fish | 11: mech armored fish
- 12: treasure chest fish | 13: angler lure fish | 14: kelp wraith | 15: lava dark fish
- 16: lightning dragon | 17: steampunk mech | 18: dark octopus | 19: white angel fish

Sheet 2 (fish-2-00 to fish-2-19, fish-2-08 MISSING):
- 00: lava turtle | 01: stone fish | 02: pirate goldfish | 03: ice crystal fish
- 04: anchor fish | 05: bomb fish | 06: coral reef fish | 07: cloud storm fish
- 08: (EMPTY) | 09: pufferfish | 10: coral reef fish 2 | 11: torpedo sub fish
- 12: moss island fish | 13: palm tree fish | 14: barrel fish | 15: steampunk sub
- 16: shark | 17: octopus | 18: chain anglerfish | 19: (empty — verify)

Sheet 3 (fish-3-00 to fish-3-07):
- 00: lantern anglerfish | 01: lava crack fish | 02: cutlass sword | 03: thunder shark
- 04: bandaged eel | 05: ice crystal fish | 06: compass crab | 07: teal swirl fish

**Recommended starters:** fish-1-04 (fire koi/Clownfin), fish-1-05 (crystal ice/Tidecrawler), fish-1-08 (flower leaf/Mosscale)

### Ship Index (ship-00 to ship-19)
20 unique pirate ships, each with distinctive sail colors/emblems. Loaded as `ship-{00-19}`.

---

## Current Status (March 11 2026 — Session 5)
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
- [x] Phase 4 polish: PokemonDP font swap, crab-battle idle animation cycling
- [x] Font files repaired (OTS validation — CFF name ASCII, cmap bounds)
- [x] All sprite sheets re-sliced from RGBA source (3 fish sheets + items + ships)
- [x] 47 fish sprites (20+19+8), 4 items, 20 ships — all transparent bg, no grid artifacts
- [x] Starter picker updated: Clownfin→fish-1-04, Tidecrawler→fish-1-05, Mosscale→fish-1-08
- [x] Fish sprite DB regenerated for all 47 fish
- [x] **Fishing minigame** — SPACE at water edge, cast→wait→bite→timing bar. Direct catch (30% on perfect) or battle
- [x] **Wild fish battles** — CATCH button (C key), HP-based catch chance (15% + 75% × damage dealt)
- [x] **Captain NPC** — procedural pirate captain near spawn with tutorial dialogue (4 lines, shorter repeat)
- [x] **Sail pier** — wooden pier on right side of beach, "SET SAIL" sign, SPACE to transition
- [x] **SailingScene** — 4000×4000 ocean, WASD ship movement, minimap, compass HUD, SHIFT full sail, ESC return
- [x] **Ship selection UI** — P key, paginated 4-per-page picker, 20 ships, unlock tiers by fish caught
- [x] **Save/load system** — localStorage, auto-save 60s, F5 manual save, CONTINUE on main menu
- [x] **Move-db audit** — all starter/fish moves verified, 11 pirate-themed moves added (50 total)

### Known Issues / Next Session Priorities
- [ ] **Fishing hotspot zones** — different fish in different water areas
- [ ] **More beach NPCs** — dock master, navigator, merchant
- [ ] **SailingScene islands** — landable islands with unique encounters
- [ ] **Fish evolution system** — fish level up and evolve
- [ ] **Sound effects + music** — no audio yet

---

## Build Roadmap

### Phase 5 — Content Expansion ✅ COMPLETE
1. ~~Fishing minigame~~ ✅
2. ~~NPC placement (captain)~~ ✅
3. ~~Ship selection UI~~ ✅
4. ~~SailingScene skeleton~~ ✅
5. ~~Save/load system~~ ✅

### Phase 6 — World Expansion (Next)
1. More beach enemy types (use PixelLab for new sprites)
2. Additional NPCs (dock master, navigator, merchant)
3. SailingScene islands (landable, unique encounters)
4. Boss battles (enemy captains from enemy-db.ts)
5. Fish evolution system
6. Sound effects + music

### Phase 7 — Polish & Content
7. Multiple save slots
8. Achievement system
9. Weather effects (rain, storms at sea)
10. Day/night cycle

---

## New Systems Added (Session 5)

### SaveSystem (`src/systems/SaveSystem.ts`)
- `hasSave()` — quick localStorage check
- `loadGame()` — deserialize with validation
- `saveGame(data)` — serialize to localStorage
- `deleteSave()` — clear save
- `saveFromScene(scene, player, starterChosen, playtime)` — gather + save
- `startAutoSave(scene, ...)` — 60s auto-save timer
- **SaveData**: playerX, playerY, party[], inventory{}, starterChosen, playtime, savedAt

### SailingScene (`src/scenes/SailingScene.ts`)
- 4000×4000 world with ocean gradient bands
- Animated wave effect (sine-wave bob + horizontal drift)
- Ship sprite from ship-db, WASD + SHIFT speed boost
- Minimap with 5 island markers (Home Beach, Coral Atoll, Skull Island, Treasure Cove, Storm Reef)
- HUD: ship name, coordinates, compass direction
- ESC returns to BeachScene

### Ship Selection (in BeachScene)
- P key toggles overlay
- 4 cards per page, 5 pages, A/D navigate, W/S page, SPACE select, ESC close
- Unlock tiers: 0 (ship-00), 5 (01-04), 15 (05-09), 30 (10-14), 50 (15-19) fish caught
- Selected ship stored in registry as `selectedShip`

### Key Bindings Summary
| Key | Action | Context |
|-----|--------|---------|
| WASD | Move | Beach, Sailing, Battle menus, Ship picker |
| SPACE | Interact/Confirm | Dialogue, chest, fishing, battle, captain NPC, sail pier |
| I | Inventory | Beach |
| P | Ship selection | Beach |
| C | Catch | Wild fish battles only |
| F5 | Manual save | Beach |
| ESC | Close/Return | Ship picker, SailingScene |
| SHIFT | Full sail | SailingScene |

---

## Next Chat Prompt
> Test the full gameplay loop: start new game → talk to captain → pick starter fish → fight a crab → go fishing → catch a wild fish → check ship selection (P key) → sail to sea → save and reload. Fix any bugs found during testing.

---

## Preserved Data Files (Old Build — Still Valid, Reuse These)
- `src/data/fish-db.ts` — 62 fish species
- `src/data/move-db.ts` — 50 battle moves (39 original + 11 pirate-themed)
- `src/data/zone-db.ts` — 3 ocean zones
- `src/data/enemy-db.ts` — 3 enemy captains
- `src/data/ship-db.ts` — 20 ship blueprints

---

## Deploy
Push to GitHub main → Netlify auto-deploys to corsair-catch-demo.netlify.app
Always run `npx tsc --noEmit` before committing.
