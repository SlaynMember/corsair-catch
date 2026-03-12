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
                                ↕
                           Beach2Scene ⇄ BattleScene
                                ↕
                           SailingScene
```
All scenes in `src/scenes/`.

| Scene | File | Status |
|-------|------|--------|
| BootScene | `src/scenes/BootScene.ts` | Loads all assets, transitions to MainMenu |
| MainMenuScene | `src/scenes/MainMenuScene.ts` | Sunset beach title screen, NEW GAME button with fade transition |
| BeachScene | `src/scenes/BeachScene.ts` | Player walks beach, WASD 8-dir, crabs, NPCs, items, fishing, dialogue |
| Beach2Scene | `src/scenes/Beach2Scene.ts` | Dock beach area — fishing (deep_water zone), dock, sail to sea transition |
| BattleScene | `src/scenes/BattleScene.ts` | Pokémon-style turn combat; launched/paused from BeachScene or Beach2Scene |
| SailingScene | `src/scenes/SailingScene.ts` | 4000×4000 ocean, 5 procedural islands, WASD ship, minimap, docking |

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
Mix of **real PNG sprites** and **procedural Phaser shapes**. Player character (`public/sprites/pirate/`), fish (`public/sprites/fish/`), crab enemy/NPC, environment props (dock, crate, anchor, shells, palm tree), ships, and backgrounds all use real sprites. Remaining scenery (rocks, starfish, seaweed, driftwood, barrel, HUD icons, battle platforms/clouds) are procedural — see **Placeholder Asset Tracker** for what still needs real art.

**Phaser container gotcha:** `this.add.rectangle()` places objects in scene world-space, NOT inside a container automatically. Always save refs and call `container.add([...])` explicitly or children will render at wrong screen positions.

**Depth sorting formula:** All foreground objects (player, items, crabs, chest, crates, anchor, NPCs) use `depth = 4 + y * 0.001` so objects lower on screen render in front. Background scenery (palms, sand details, shells, dock sprite) stays at fixed low depths (1-3). Updated every frame in `depthSort()` for moving objects; set once at creation for static props.

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

- **Mobile: force landscape** — game is 16:9 calibrated, NEVER use portrait layout. Floating joystick (left 40% of screen), context-sensitive action button (right side). All mobile input goes through `src/systems/MobileInput.ts`.
- **Mobile: Phaser-native only** — no HTML overlay joysticks, no nipple.js, no DOM buttons over canvas. Everything inside the Phaser canvas on a UI camera.
- **Dual-target: mobile + desktop** — Every UI/interaction edit MUST work on both desktop (keyboard) and mobile (touch). Always check: hint text swaps (`MobileInput.IS_MOBILE`), tap handlers alongside keyboard handlers, padded hit areas for touch. Never add a keyboard-only feature without a mobile equivalent. Never add a mobile-only feature without ensuring desktop still works.
- **Placeholder asset rule** — When adding any visual element that uses procedural shapes (rectangles, ellipses, Graphics) as a stand-in for a real sprite, **immediately add it to the Placeholder Asset Tracker below**. This includes barricade objects, UI icons, environmental props, enemy sprites, etc. These are items that work gameplay-wise but need a proper pixel art asset generated later (via PixelLab, nano-banana, or hand-drawn).

---

## Placeholder Asset Tracker (Needs Real Sprites)

Items below are currently procedural/placeholder and need themed pixel art assets generated:

| Element | Location | Current Implementation | Desired Asset |
|---------|----------|----------------------|---------------|
| Right barricade crates | BeachScene `drawBeachScenery()` | Procedural rectangles + env-crate sprites | Stacked weathered pirate crates, rope-tied, barnacles |
| HUD inventory button | BeachScene `createHUD()` | Procedural wood frame + "I" text | Leather satchel/bag icon, pixel art |
| HUD team button | BeachScene `createHUD()` | Procedural bubble frame + fish silhouette | Pokeball-style fish bubble icon, pixel art |
| Rock clusters | BeachScene `drawRocks()` | Procedural ellipses | Chunky pixel rocks with moss/barnacles |
| Starfish | BeachScene `drawSandDetails()` | Procedural circles | Pixel starfish sprite (orange/red) |
| Seaweed patches | BeachScene `drawSandDetails()` | Procedural ellipses | Pixel seaweed clumps |
| Driftwood logs | BeachScene `drawSandDetails()` | Procedural rectangles | Pixel driftwood sprite |
| Battle deck platforms | BattleScene | Procedural wood rectangles | Wooden ship deck platform sprite |
| Battle clouds | BattleScene | Procedural ellipses | Pixel cloud sprites |

> **Rule:** Every time you add a procedural placeholder, add a row here. When a real asset is generated and wired in, remove the row.

---

## Build Commands
```bash
npm run dev       # localhost:3000 (never auto-opens browser)
npm run build     # production
npx tsc --noEmit  # type check before every commit
npm run smoke     # Playwright headless smoke tests (6 tests, ~55s)
npm run smoke:headed  # same but opens visible browser
```

### E2E / Playwright Smoke Tests
- `e2e/smoke.spec.ts` — 6 tests: boot, new game, walk, chest, inventory, state dump
- `playwright.config.ts` — auto-starts Vite dev server, 1376×768 viewport, Chromium
- `window.game` exposed in `src/main.ts` for Playwright `page.evaluate()` access
- Screenshots saved to `e2e/screenshots/` (gitignored)
- Canvas focus: use `#game-shell canvas` selector (Phaser creates 2 canvases)
- Scene keys: `Boot`, `MainMenu`, `Beach`, `Battle`, `Sailing`, `Beach2` (NOT `BeachScene` etc.)

---

## Asset Pipeline

### Music & SFX (added March 12 2026)
- `public/music_and_fx/catch-pixel.mp3` → key `'bgm-main'` — main BGM loop (~3 min, 128kbps, 4.2MB)
- Loaded in BootScene, played in MainMenuScene with `loop: true, volume: 0.45`
- Persists across scenes (Phaser sound manager is game-wide)
- Future SFX files go in `public/music_and_fx/`

### Fonts (installed March 11 2026)
- `public/fonts/pixel_pirate/pixel_pirate.ttf` → CSS name `'PixelPirate'` — use for ALL titles, scene headers, UI headings (CAPS)
- `public/fonts/pokemon-dp-pro/pokemon-dp-pro.otf` → CSS name `'PokemonDP'` — use for all body text, dialogue, button labels, in-game UI
- Both loaded via `@font-face` in `index.html`. Phaser text uses font family names directly.

### Sprite Sheets (sliced, auto-cropped, transparent bg)
All source sheets are 2000×2000 RGBA, 4×5 grid with 5-6px black grid lines.
Grid cell boundaries: cols `[6,498]` `[504,996]` `[1003,1495]` `[1501,1993]`, rows `[6,398]` `[404,797]` `[803,1196]` `[1202,1595]` `[1601,1993]`. Slicer uses 3px inset to skip AA edge pixels.

- `public/sprites/crab-basic/{dir}.png` — 8 directional crab overworld sprites
- `public/sprites/crab-battle/{anim}-{0-3}.png` — cannonball crab battle animations (331×331 square, borders cropped)
- `public/sprites/normal-crab/` — "Completely Normal Crab" NPC (32×32 PixelLab: 8 dir statics, walk 5 dirs × 4 frames, idle south × 4 frames)
- `public/sprites/items/wood.png`, `rope.png`, `rope2.png`, `bait.png` — ground collectibles
- `public/sprites/items/chest.png` — AI-generated treasure chest (nano-banana, 789×732)
- `public/sprites/environment/dock.png` — dock with built-in DOCK sign (water removed)
- `public/sprites/environment/sail-sign.png` — wooden SAIL arrow sign
- `public/sprites/environment/shell-{1,2,3}.png` — 3 decorative shell sprites
- `public/sprites/environment/crate.png` — wooden crate prop
- `public/sprites/environment/anchor.png` — anchor leaning on tree
- `public/sprites/fish/fish-{1|2}-{00-19}.png` — 39 fish (fish-2-08 is empty/missing)
- `public/sprites/fish/fish-3-{00-07}.png` — 8 fish from page 3
- `public/sprites/ships/ship-{00-19}.png` — 20 pirate ships
- `public/sprites/environment/palm-tree.png` — standalone pixel palm tree
- `public/backgrounds/beach-bg.png` — AI-generated full beach bg 1376×768
- `public/backgrounds/beach2-bg.png` — AI-generated Beach 2 bg with dock, palms, path (nano-banana, 1376×768)
- `public/backgrounds/menu-bg.png` — AI-generated main menu bg with palms + ship + dock
- `public/sprites/portraits/pirate-talk.png` — pirate character talking portrait (709×1169, auto-cropped from 2000×2000 RGBA)
- `public/sprites/portraits/crab-man-talk.png` — crab man talking portrait (1167×1433, Gemini watermark removed)

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

**Recommended starters:** fish-1-04 (fire koi/Emberkoi), fish-1-05 (crystal ice/Tidecrawler), fish-1-08 (flower leaf/Mosscale)

### Ship Index (ship-00 to ship-19)
20 unique pirate ships, each with distinctive sail colors/emblems. Loaded as `ship-{00-19}`.

---

## Current Status (March 12 2026 — Session 12)
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
- [x] Shadow tuned (28×7, 0.20 alpha, +16px from sprite center = actual feet)
- [x] Horizon line masked (sand rect overlay at SAND_TOP)
- [x] Dock removed from BeachScene
- [x] Treasure chest starter flow — no crabs until fish chosen
- [x] Starter picker UI — 3 fish cards (Emberkoi/Fire, Tidecrawler/Water, Mosscale/Nature)
- [x] Battle WASD + space menu navigation
- [x] Battle freeze fix — move IDs corrected (ember→flame_jet, vine_lash→coral_bloom)
- [x] Battle WASD confirm uses valid move list (not raw moves array index)
- [x] Battle shows fish sprites when available (falls back to geometric shapes)
- [x] Crab west-direction uses flipX of east sprite
- [x] Phase 4 polish: PokemonDP font swap, crab-battle idle animation cycling
- [x] Font files repaired (OTS validation — CFF name ASCII, cmap bounds)
- [x] All sprite sheets re-sliced from RGBA source (3 fish sheets + items + ships)
- [x] 47 fish sprites (20+19+8), 4 items, 20 ships — all transparent bg, no grid artifacts
- [x] Starter picker updated: Emberkoi→fish-1-04, Tidecrawler→fish-1-05, Mosscale→fish-1-08
- [x] Fish sprite DB regenerated for all 47 fish
- [x] **Fishing minigame** — SPACE at water edge, cast→wait→bite→timing bar. Direct catch (30% on perfect) or battle
- [x] **Wild fish battles** — CATCH button (C key), HP-based catch chance (15% + 75% × damage dealt)
- [x] **"Completely Normal Crab" NPC** — PixelLab sprite, paces back and forth, comic relief tutorial dialogue
- [x] **Sail pier** — wooden pier on right side of beach, "SET SAIL" sign, SPACE to transition
- [x] **SailingScene** — 4000×4000 ocean, WASD ship movement, minimap, compass HUD, SHIFT full sail, ESC return
- [x] **Ship selection UI** — P key, paginated 4-per-page picker, 20 ships, unlock tiers by fish caught
- [x] **Save/load system** — localStorage, auto-save 60s, F5 manual save, CONTINUE on main menu
- [x] **Move-db audit** — all starter/fish moves verified, 11 pirate-themed moves added (50 total)
- [x] **Shadow fix** — measured sprite feet at row 24/32, offset corrected to +16px (was +28, floating)
- [x] **Text 2x pass** — all dialogue 22px, battle log 20px, HP cards 14-16px, moves 16px, signs 24-28px
- [x] **Crab battle sprites cropped** — removed 2px borders + number artifacts, 344×192 → 331×331 square
- [x] **AI chest sprite** — nano-banana pixel art chest replaces procedural rectangles
- [x] **Dock/pier signs** — 4x bigger text, PixelPirate font, enlarged sign boards
- [x] **Text legibility fix** — 3px black stroke on all world-space text (DOCK, SET SAIL, save notification)
- [x] **Chest sprite regen** — nano-banana pixel art chest, green-screen chroma keyed to clean transparency
- [x] **Sign scaling fix** — DOCK (160×48→72×24) and SET SAIL (160×48→76×24) signs reduced ~50%, grounded
- [x] **Dock plank alignment** — closed 4px gaps between planks, all coords rounded to integers
- [x] **Pier plank alignment** — sail pier planks tightly adjacent, integer coords, no sub-pixel jitter
- [x] **BGM audio** — `catch-pixel.mp3` loaded in BootScene, plays on MainMenu, persists across scenes
- [x] **Animated title** — letter-by-letter wave entrance with Back.easeOut bounce, then Sine float loop
- [x] **Subtitle + button fade-in** — sequenced after title animation completes
- [x] **Palm tree sway** — gentle sine-wave angle tween on all 3 beach palms
- [x] **Text stroke pass** — fishing overlay, starter picker title/hint, save notification all get black strokes
- [x] **Inventory rebuilt** — 560×420 panel, 18px PokemonDP items, CREW + ITEMS sections, 28px PixelPirate header
- [x] **Chest moved + shrunk** — spawn (640,480)→(440,505), display 56→36px, glow+hint destroyed on use
- [x] **Real dock sprite** — replaces procedural planks, DOCK sign baked in, water pixels removed
- [x] **Real sail sign sprite** — replaces procedural SET SAIL sign on pier
- [x] **Crab NPC label** — 12px→18px with thicker stroke
- [x] **Decorative props** — 5 shells, crate near dock, anchor leaning on left palm tree
- [x] **Crates restacked** — moved to between right palm trees (3 crates stacked on sand, visible)
- [x] **Sail sign removed** — replaced with small "SAIL →" text hint on dock end (was confusing second dock)
- [x] **Anchor repositioned** — moved in front of left tree (155,478), rotated -12°, depth 4.5
- [x] **Seashells expanded** — 12→26 shells across full beach + 5 semi-transparent near water edge
- [x] **Lock emoji removed** — ship selection "LOCKED" now uses PixelPirate text, no emojis anywhere
- [x] **Inventory redesign** — dark overlay, double-border wood frame, corner rivets, gold header, fish sprite thumbnails with mini HP bars (color-coded), item sprite icons, empty state messages
- [x] **BattleScene redesign** — 8-band sunset gradient + cloud shapes, wooden deck platforms with rope borders, parchment texture overlay, triple-frame battle log with gold corners, HP cards enlarged (360×110) with PixelPirate headers + colored status badges, move buttons with wood frames + power display, CATCH button redesigned (no emoji, procedural net icon, pulsing gold glow), fish sprites enlarged (140px enemy, 170px player)
- [x] **Fishing hotspot zones** — `src/data/fishing-zones.ts` with 4 zones (dock, deep_water, coral_reef, storm_zone), weighted fish pools + level ranges, wired into BeachScene dock fishing
- [x] **3 beach NPCs** — Old Pete (dock master, x=560 y=530, static), Maps Maggie (navigator, x=950 y=480, flips every 4s), Barnacle Bob (merchant, x=420 y=470, static) — all procedural pixel art, gold labels, first/repeat dialogue, depth sorted
- [x] **Evolution system** — `src/systems/EvolutionSystem.ts` with level thresholds (16/36), stat recalculation, move inheritance
- [x] **XP system** — `src/systems/XPSystem.ts` with battle XP scaling, multi-level-up, evolution checking
- [x] **SailingScene islands** — 5 procedural islands with unique decorations (skull, coral, treasure, storm), wooden docks, name labels with difficulty stars, "PRESS SPACE TO DOCK" prompt, collision bodies
- [x] **Depth sorting fix** — player, ground items, crabs, chest, crates, anchor all use `4 + y * 0.001` depth formula so objects correctly overlap based on Y position (lower = in front)
- [x] **Interaction slide fix** — `openDialogue()` now calls `player.setVelocity(0,0)` so player stops moving when interacting
- [x] **Fishing area** — fishing triggers on dock only (`px >= DOCK_LEFT && px <= DOCK_RIGHT && py > DOCK_SAND_Y`), not from shore
- [x] **Right-edge sail transition** — walking to right edge of beach (`x >= WALK_MAX_X - 10`) auto-triggers sail to SailingScene; "SAIL →" hint moved to right edge; dock no longer triggers sailing
- [x] **NPC/sign dialogue updated** — dock sign + Completely Normal Crab dialogue updated to reference water-edge fishing and right-edge sailing
- [x] **Beach2Scene** — new dock beach area (`src/scenes/Beach2Scene.ts`), AI-generated bg, walk left→Beach1, walk right on dock→SailingScene, fishing uses deep_water zone, inventory panel, dialogue system, depth sorting
- [x] **Playwright e2e smoke tests** — 6 tests (boot→menu→beach→walk→chest→inventory→state), `npm run smoke`, auto-starts Vite, `window.game` exposed
- [x] **Right barricade** — crates, barrel, anchor block right side of beach with narrow gap (~y 450-520) forcing player through passage to Beach2; physics colliders on upper + lower clusters
- [x] **HUD buttons** — top-right wood-framed inventory bag (I) + team fish-bubble (T) buttons, clickable, pirate-themed procedural icons
- [x] **Fish sprite animations** — idle bob (sine float), breathing scale pulse, battle entrance slide+fade; applied in BattleScene `buildFishShape()` + starter picker
- [x] **Battle log stroke fix** — strokeThickness 1→2 for legibility consistency
- [x] **Placeholder Asset Tracker** — CLAUDE.md section + rule: every procedural placeholder must be logged, removed when real sprite replaces it
- [x] **Fish sprite mapping overhaul** — reassigned ALL 35+ spriteGrid/spriteIndex in fish-db.ts to match visual types (fire sprites→fire species, water→water, etc.); fixed buildFishShape to use species spriteGrid/spriteIndex instead of naive ID-based mapping
- [x] **Starter fish type fix** — Clownfin speciesId 4 (Tidecaller/Water) → speciesId 1 (Ember Snapper/Fire); Mosscale spriteIndex corrected to 1:8 (Petalfin)
- [x] **Crab battle sprite cleanup** — removed text/number label artifacts ("Idle", "1.2", "Attack", "Hurt/Defend", "Walk") from all 16 crab-battle PNGs via Python PIL
- [x] **Cannonball Crab rename** — "Beach Crab" → "Cannonball Crab" in battle enemyName + nickname
- [x] **Battle Team/Item buttons** — TEAM [T] and ITEMS [I] wood-framed buttons at bottom-left of BattleScene; placeholder "coming soon" messages; keyboard T/I keys wired
- [x] **Status badge fix** — BRN/PRZ → BURN/PARA, PixelPirate→PokemonDP font, 13px with letter-spacing, wider badge (52px)
- [x] **Dock walkability fix** — added DOCK_MAX_Y (WATER_TOP + 25) to prevent walking off dock into ocean
- [x] **Interaction range tightened** — 68→50px for items/NPCs, 40px for signs
- [x] **Normal Crab tutorial rework** — context-aware dialogue: pre-starter ("check out that chest!"), post-starter ("go try fishing from the dock!"); repeat dialogue variants
- [x] **Barricade cleanup** — removed ugly procedural barrel, repositioned crates lower between palms
- [x] **Dock depth sorting** — dynamic dock depth: renders behind player when player is ON dock, in front when player is above it
- [x] **Starter renamed Emberkoi** — Clownfin→Emberkoi (fire koi starter); updated in both starter picker UI and confirmStarterPick
- [x] **BattleScene crash fix** — stale `crabIdleSprite` reference from previous battle caused `Cannot read 'sys'` crash; `init()` now resets all refs (crabIdleSprite, catchButton, moveButtons, logQueue, phase)
- [x] **Fish sprite aspect ratio fix** — `setDisplaySize(size,size)` squashed non-square fish (Anchor Golem, Corsair Gold); now uses `Math.min(maxSize/w, maxSize/h)` to preserve aspect ratio in BattleScene + starter picker
- [x] **Fishing restricted to dock** — removed shore fishing (was `py > WATER_TOP - 50`); now requires player on dock (`px >= DOCK_LEFT && px <= DOCK_RIGHT && py > DOCK_SAND_Y`)
- [x] **Rarity system** — all 61 species now have `rarity` field (Common/Uncommon/Rare); tier 1=mostly Common, tier 2=Uncommon, tier 3=Rare
- [x] **Fishing zone overhaul** — dock zone expanded from 5→9 fish covering all 7 types (was missing Fire, Storm); Anchor Golem moved from dock→deep_water; coral_reef gets Lantern Angler (Abyssal) + Iron Steamer (Electric); storm_zone gets Astral Squid (Abyssal) + Magma Tuna (Fire); zone→scene mapping documented in header comments
- [x] **Portrait sprites** — pirate-talk.png (709×1169) + crab-man-talk.png (1167×1433, Gemini watermark removed) in `public/sprites/portraits/`, loaded in BootScene as `portrait-pirate` and `portrait-crab-man`
- [x] **Talk overlay system** — full-screen portrait dialogue with Normal Crab NPC; dark dim bg, pirate portrait left, crab man portrait right (flipped), parchment dialogue box with typewriter effect, speaker name header, tutorial menu with 4 options (How do I fish?, What should I do next?, Tell me about yourself, Goodbye); WASD cursor navigation + SPACE select; pre-starter dialogue closes after intro, post-starter shows interactive menu; `talkOpen` blocks all other UI (inventory, ship picker)

### Known Issues / Next Session Priorities
- [x] **Wire XP/Evolution into BattleScene** — addBattleXP on enemy faint, level-up notifications, 3-phase evolution cinematic (glow→flash→result), full state persistence (level/xp/maxHp/moves/speciesId)
- [ ] **SailingScene controls broken** — ship rotates upside down; should be WASD only, ship always right-side-up, flip horizontally for direction
- [x] **Mobile optimization Phase 8a** — MobileInput.ts (joystick + action + boost buttons), integrated into all scenes, landscape lock, rotate prompt, Safari 100dvh, safe-area insets, touch-action:none, HUD tap targets 64px
- [x] **Mobile optimization Phase 8b** — mobile button bar (BAG/SHIP/X), dialogue tap-to-advance (BeachScene + Beach2Scene + talk overlay), starter picker touch (tap-to-select, tap-to-confirm), BattleScene mobile (action button = SPACE, cursor arrow hidden, MobileInput instantiated)
- [x] **Mobile optimization Phase 8c** — fishing tap-to-reel (tap anywhere during bite/reel), SailingScene RETURN button (top-left), PWA manifest (fullscreen + landscape), powerPreference: high-performance
- [ ] **More beach enemy types** — use PixelLab for new sprites
- [ ] **Boss battles** — enemy captains from enemy-db.ts
- [ ] **Island scenes** — unique encounter scenes for each island (currently docking returns to Beach)
- [ ] **Sound effects** — battle SFX, fishing SFX, UI click sounds
- [ ] **Weather effects** — rain, storms at sea

---

## Build Roadmap

### Phase 5 — Content Expansion ✅ COMPLETE
1. ~~Fishing minigame~~ ✅
2. ~~NPC placement (captain)~~ ✅
3. ~~Ship selection UI~~ ✅
4. ~~SailingScene skeleton~~ ✅
5. ~~Save/load system~~ ✅

### Phase 6 — World Expansion ✅ MOSTLY COMPLETE
1. ~~More beach enemy types~~ (pending — need PixelLab sprites)
2. ~~Additional NPCs (dock master, navigator, merchant)~~ ✅
3. ~~SailingScene islands (landable, unique encounters)~~ ✅
4. Boss battles (enemy captains from enemy-db.ts)
5. ~~Fish evolution system~~ ✅ (system built + wired into BattleScene)
6. ~~Fishing hotspot zones~~ ✅
7. Sound effects + music (BGM done, SFX pending)

### Phase 7 — Polish & Content ✅ COMPLETE
1. ~~Wire XP/Evolution into BattleScene~~ ✅
2. ~~Talk overlay system (portrait dialogue + tutorial menu)~~ ✅
3. Fix SailingScene controls (WASD only, no rotation) — **moved to Phase 9**

### Phase 8 — Mobile Optimization ✅ COMPLETE
All 14 steps done across 3 sub-phases:
- ✅ **8a MVP:** MobileInput.ts, scene integration, landscape lock, Safari fixes, HUD tap targets
- ✅ **8b Polish:** mobile button bar, dialogue tap-to-advance, starter picker touch, BattleScene mobile
- ✅ **8c Fine-tune:** fishing tap-to-reel, SailingScene RETURN button, PWA manifest, powerPreference

### Phase 9 — Content Expansion (Current)
1. Fix SailingScene controls (WASD only, no rotation)
2. More beach enemy types (PixelLab sprites)
3. Boss battles (enemy captains from enemy-db.ts)
4. Island-specific scenes (unique encounters per island)
5. Sound effects (battle SFX, fishing SFX, UI clicks)
6. Multiple save slots
7. Achievement system
8. Weather effects (rain, storms at sea)
9. Day/night cycle

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

### Fishing Zones (`src/data/fishing-zones.ts`)
- 4 zones with scene mapping:
  - **dock** → Beach 1 dock: 9 fish, all 7 types covered, lv3-8 (Fire/Storm rare here)
  - **deep_water** → Beach 2 dock: 7 fish, Abyssal/Nature focus, lv8-15
  - **coral_reef** → Coral Atoll island: 7 fish, colorful variety, lv5-12
  - **storm_zone** → Storm Reef island: 6 fish, Storm/Electric focus, lv10-18
- Weighted random selection via `rollFishFromZone(zone)`
- Tier 3 fish are evolution-only (not in any wild zone pool)

### Evolution System (`src/systems/EvolutionSystem.ts`)
- `canEvolve(fish, species)` — checks level threshold + evolvesInto exists
- `evolveFish(fish, species)` — returns new FishInstance with evolved stats, proportional HP, +1 move
- Thresholds: tier 1→2 at level 16, tier 2→3 at level 36

### XP System (`src/systems/XPSystem.ts`)
- `addBattleXP(fish, enemyLevel, species)` — awards XP (50 + 10 × enemyLevel), handles multi-level-ups
- `checkEvolution(fish, species)` — convenience wrapper for canEvolve + getEvolutionTarget
- **Wired into BattleScene** — enemyFainted() calls addBattleXP, shows level-up, triggers evolution cinematic

### MobileInput System (`src/systems/MobileInput.ts`) — TO BE CREATED
- `IS_MOBILE` static flag — `'ontouchstart' in window || navigator.maxTouchPoints > 0`
- Floating virtual joystick — Phaser Container on UI camera, 120px base, 40px thumb, 50px max radius
- Appears at touch position in left 40% of screen, returns `{ x: -1..1, y: -1..1 }`
- Action button — 80px gold circle at bottom-right, contextual label per game state
- Multi-touch pointer separation by screen region (left 40% = joystick, right 40% = action)
- Public API: `getMovementVector()`, `isActionJustDown()`, `showContextButtons(context)`, `destroy()`

### Beach NPCs (BeachScene)
- **"Completely Normal Crab"** at (280, 440) — PixelLab sprite, paces left/right, comic relief tutorial dialogue
- Old Pete, Maps Maggie, Barnacle Bob — **removed** (saving for later islands, not the starter beach)

### Key Bindings Summary
| Key | Action | Context |
|-----|--------|---------|
| WASD | Move | Beach, Sailing, Battle menus, Ship picker |
| SPACE | Interact/Confirm | Dialogue, chest, fishing (near water), battle, all NPCs |
| Walk right | Next area | Beach right edge → Beach2 |
| Walk left | Previous area | Beach2 left edge → Beach |
| Walk right (dock) | Sail transition | Beach2 dock end → SailingScene |
| I | Inventory | Beach |
| P | Ship selection | Beach |
| C | Catch | Wild fish battles only |
| F5 | Manual save | Beach |
| ESC | Close/Return | Ship picker, SailingScene |
| SHIFT | Full sail | SailingScene |
| Touch left 40% | Virtual joystick (mobile) | All scenes |
| Touch right 40% | Action button (mobile) | All scenes |
| Tap anywhere | Advance dialogue (mobile) | During dlgOpen |

---

## Next Chat Prompt
> **Priority 1:** Mobile optimization Phase 8a (MobileInput.ts, scene integration, landscape lock, Safari fixes, HUD tap targets). **Priority 2:** Fix SailingScene controls (WASD only, no rotation). **After mobile:** Generate real pixel art for placeholders, more enemy types, boss battles, island scenes, SFX.

---

## Preserved Data Files (Old Build — Still Valid, Reuse These)
- `src/data/fish-db.ts` — 62 fish species
- `src/data/move-db.ts` — 50 battle moves (39 original + 11 pirate-themed)
- `src/data/zone-db.ts` — 3 ocean zones
- `src/data/enemy-db.ts` — 3 enemy captains
- `src/data/ship-db.ts` — 20 ship blueprints
- `src/data/fishing-zones.ts` — 4 fishing hotspot zones (dock, deep_water, coral_reef, storm_zone)
- `src/systems/EvolutionSystem.ts` — fish evolution logic (level thresholds, stat recalc)
- `src/systems/XPSystem.ts` — battle XP awards, multi-level-up, evolution checking
- `src/systems/MobileInput.ts` — virtual joystick + action button (TO BE CREATED — Phase 8a)
- `docs/mobile optimization plan` — full 14-step mobile optimization plan with verification checklist

---

## Deploy
Push to GitHub main → Netlify auto-deploys to corsair-catch-demo.netlify.app
Always run `npx tsc --noEmit` before committing.
