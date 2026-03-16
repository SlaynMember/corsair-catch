# Corsair Catch — CLAUDE.md

## What This Game Is
A browser-based pirate RPG. Pokémon Diamond clone set at sea.
- Walk the beach, fish at the water's edge, fight crabs/enemies, collect items
- Catch fish that become your battle crew (Pokémon-style turn-based combat)
- Eventually sail to other islands, upgrade ships, fight pirate captains

**Tagline:** "Pokémon meets the Seven Seas"
**Live:** corsair-catch-demo.netlify.app
**itch.io:** https://slaynmember.itch.io/corsair-catch
**Repo:** https://github.com/SlaynMember/corsair-catch
**Local:** c:/Users/willp/Local Sites/corsair-catch

---

## Stack (Current — DO NOT CHANGE)
- **Engine:** Phaser 3 (v3.88+) with TypeScript
- **Build:** Vite (port 3000, open: false)
- **Physics:** Phaser Arcade Physics — gravity is 0,0 (top-down game, NEVER change)
- **Deploy:** Netlify (auto-deploy from GitHub main) + itch.io (butler push)
- **Node:** 20+

---

## Scene Architecture
```
                          SailingScene
                               ↕
           Beach3Scene ⇄ BeachScene ⇄ Beach2Scene
                 ↕            ↕            ↕
            BattleScene  BattleScene  BattleScene
                 ↕            ↕            ↕
            PauseMenu    PauseMenu    PauseMenu   (ESC overlay)
```
- Beach 3 (pirate cove) is LEFT of Beach 1
- Beach 2 (dock) is RIGHT of Beach 1
- Sailing departs from SailingScene (accessed via ship picker)
- Beach 1 has shore fishing (dock zone, lv3-8) + left-edge → Beach 3
- Beach 2 has dock/shore fishing (deep_water zone, lv8-15)
- Beach 3 has shore fishing (deep_water zone), pirate enemies, pirate duel NPC

All scenes in `src/scenes/`.

| Scene | File | Status |
|-------|------|--------|
| BootScene | `src/scenes/BootScene.ts` | Loads all assets, transitions to MainMenu |
| MainMenuScene | `src/scenes/MainMenuScene.ts` | Sunset beach title screen, NEW GAME button with fade transition |
| BeachScene | `src/scenes/BeachScene.ts` | Player walks beach, WASD 8-dir, crabs, NPCs, items, fishing, sailing (left edge), dialogue |
| Beach2Scene | `src/scenes/Beach2Scene.ts` | Dock beach area — fishing (deep_water zone), dock, no sailing |
| Beach3Scene | `src/scenes/Beach3Scene.ts` | Pirate cove — shipwreck bg, cave, pirate duel NPC, Blackhand Pete enemies |
| BattleScene | `src/scenes/BattleScene.ts` | Pokémon-style turn combat; launched/paused from any beach scene |
| SailingScene | `src/scenes/SailingScene.ts` | 4000×4000 ocean, 5 procedural islands, WASD ship, minimap, docking |
| PauseMenuScene | `src/scenes/PauseMenuScene.ts` | ESC pause overlay — Resume, Save, New Game, Quit to Menu |

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
Mix of **real PNG sprites** and **procedural Phaser shapes**. Player character (`public/sprites/pirate/`), fish (`public/sprites/fish/`), crab enemy/NPC, environment props (dock, crate, anchor, shells, palm tree, rocks, starfish, seaweed, driftwood), battle deck platforms, ships, and backgrounds all use real sprites. Remaining procedural: battle clouds, HUD icons — see **Placeholder Asset Tracker** for what still needs real art.

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
- **Always run `npm run smoke` (headless) — never `npm run smoke:headed` unless explicitly debugging a visual bug**
- **Never mark a task complete if smoke tests were skipped — "small change" is not an exception**
- **Agent browser verification: use CLI/headless only** — never open a headed browser from the agent. Use `page.evaluate()` via Playwright or `npm run smoke` for verification. No browser_navigate screenshots for game testing.
- **Ready flag pattern** — every scene with `update()` has `private ready = false`, set `true` as last line of `create()`, gated with `if (!this.ready) return;` at top of `update()`. Reset in shutdown.
- **Never use `!` (definite assignment) on sprites/containers** — use `Type | undefined` and null-guard in update-path methods. Sprites may not exist if create() is interrupted.
- **Cross-scene state must use `this.registry`** — never store scene-transition-surviving state as a local `private` property that resets in `create()`. Use `this.registry.get()`/`set()`.

---

## Known Gotchas (Phaser + Codebase)
- **TMX transition zones must be reachable** — verify no collider in the `colliders` layer blocks the path to a `transitions` zone. Test both directions.
- **TMX polygon colliders become bounding rects** — `TMXLoader.parseObjectGroupAsRects()` converts polygons to their bounding boxes, which can be much larger than the polygon.
- **Fish rendering uses `fish-db.ts` only** — `spriteGrid` + `spriteIndex` → `fish-{grid}-{index}` texture key. `fish-sprite-db.ts` is metadata/descriptions only, NOT used for rendering.
- **Every species needs `spriteGrid`/`spriteIndex`** — missing fields → procedural circle fallback in `BattleScene.buildFishShape()`
- **Playwright + Phaser keyboard** — headless Playwright can't reliably send keyboard input to Phaser after `scene.start()`. Use `page.evaluate(() => scene.methodName())` instead of `page.keyboard.press()`.
- **Smoke tests require `--workers=1`** — multiple workers overload the single Vite dev server on port 3000.
- **`createHudButton` doesn't set `scrollFactor(0)`** — works because Beach camera bounds match viewport. Would break with scrolling cameras.

---

## Placeholder Asset Tracker (Needs Real Sprites)

Items below are currently procedural/placeholder and need themed pixel art assets generated:

| Element | Location | Current Implementation | Desired Asset |
|---------|----------|----------------------|---------------|
| Right barricade crates | BeachScene `drawBeachScenery()` | Upper crate stack only (env-crate sprites) | Stacked weathered pirate crates, rope-tied, barnacles |
| HUD inventory button | BeachScene `createHUD()` | Procedural wood frame + "I" text | Leather satchel/bag icon, pixel art |
| HUD team button | BeachScene `createHUD()` | Procedural bubble frame + fish silhouette | Pokeball-style fish bubble icon, pixel art |
| Battle clouds | BattleScene | Procedural ellipses | Pixel cloud sprites |

> **Rule:** Every time you add a procedural placeholder, add a row here. When a real asset is generated and wired in, remove the row.

---

## Build Commands
```bash
npm run dev       # localhost:3000 (never auto-opens browser)
npm run build     # production
npx tsc --noEmit  # type check before every commit
npm test          # vitest unit tests
npm run smoke     # Playwright headless smoke tests (38 tests, ~7min)
npm run smoke:headed  # same but opens visible browser
npm run deploy:itch   # build + butler push to itch.io (html5 channel)
```

### itch.io Deploy (butler)
- **Butler path:** `C:\Users\willp\butler\butler.exe` (add to PATH)
- **Push command:** `butler push dist/ slaynmember/corsair-catch:html5`
- **npm script:** `npm run deploy:itch` — builds then pushes in one command
- Butler uploads only diffs after first push, auto-versions each push
- Game page: https://slaynmember.itch.io/corsair-catch

### E2E / Playwright Smoke Tests
- `e2e/smoke.spec.ts` — 10 tests: boot, new game, walk, chest, inventory, state dump, Beach1↔Beach2 transitions, fishing, console errors
- `e2e/bug-audit.spec.ts` — 28 tests: fish sprites, scene warps, starter persistence, UI toggles (inventory/team/pause/volume), physics, battle launch, data integrity, error sweep, save system
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
- `public/sprites/gull/` — Scallywag Gull enemy (32×32 PixelLab: 8 dir statics + walk/east,south,west × 8 frames "scary waddle")
- `public/sprites/jelly/` — Loot Jelly enemy (32×32 PixelLab: 8 dir statics + walk/east,west × 6 frames "running slide" pounce)
- `public/sprites/hermit/` — Loot Hermit enemy (32×32 PixelLab: 8 dir statics + walk/east,west × 8 frames scuttle + angry/south × 7 frames)
- `public/sprites/evil-pirate/` — Blackhand Pete enemy (32×32 PixelLab: 4 dir statics + walk × 4 frames + battle: idle 8f, attack 6f, hurt 6f, death 7f, getup 5f)
- `public/sprites/items/wood.png`, `rope.png`, `bait.png` — ground collectibles (rope2.png moved to _unused)
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
- `public/backgrounds/beach3-bg.png` — AI-generated Beach 3 pirate cove bg with shipwreck + cave (Kling, 1376×768, flipped)
- `public/backgrounds/menu-bg.png` — AI-generated main menu bg with palms + ship + dock
- `public/sprites/portraits/pirate-talk.png` — pirate character talking portrait (709×1169, auto-cropped from 2000×2000 RGBA)
- `public/sprites/portraits/crab-man-talk.png` — crab man talking portrait (1531×1941, auto-cropped from 2000×2000)
- `public/sprites/environment/rocks.png` — mossy coastal rock cluster (64×64 PixelLab)
- `public/sprites/environment/starfish.png` — orange-red starfish (32×32 PixelLab)
- `public/sprites/environment/seaweed.png` — green seaweed clump (48×48 PixelLab)
- `public/sprites/environment/driftwood.png` — weathered driftwood log (80×80 PixelLab)
- `public/sprites/environment/battle-deck.png` — wooden ship deck platform for battles (192×192 PixelLab)
- `public/sprites/environment/south-dock.png` — T-shaped south dock sprite (1920×1080 RGBA, crossbar ~1307px wide + stem ~424px wide)
- `public/sprites/items/message-bottle.png` — message in a bottle collectible (64×64 RGBA)

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

## Implemented Features

### Core Gameplay
- 8-direction movement (idle/run/pickup animations), WASD + mobile joystick
- Ground items (wood, rope, bait, message bottle) with collect + pickup animation
- Treasure chest starter flow — 3 fish cards (Emberkoi/Fire, Tidecrawler/Water, Mosscale/Nature)
- Dialogue system (typewriter effect, SPACE to advance, tap on mobile)
- Inventory panel (I key) — wood-framed, fish thumbnails with HP bars, item sprite icons
- Save/load system — localStorage, auto-save 60s, F5 manual save, CONTINUE on main menu
- Item persistence — collected ground items tracked in SaveData.collectedItems[], don't respawn on refresh

### Beach Overworld
- AI-generated backgrounds (beach-bg, beach2-bg, menu-bg via nano-banana)
- T-shaped south dock — crossbar (490-750, y 545-585), stem (575-665, y 585-645), WALK_MAX_Y=655
- Decorative props: 26 shells, crate, anchor (155,478 rotated -12°), palm trees with sway tween
- Right barricade — upper crate stack only, open passage below (y 400+) to Beach2
- "Completely Normal Crab" NPC — PixelLab sprite, paces left/right, context-aware tutorial dialogue
- Talk overlay — portrait dialogue with pirate + crab man portraits, 4-option tutorial menu
- Beach 1 enemies: Cannonball Crab (40%), Scallywag Gull (25%), Loot Jelly (15%), Blackhand Pete (20%) — Hermit is Beach 2 only
- HUD buttons — inventory bag (I) + team fish-bubble (T), top-right, wood-framed

### Fishing
- Fishing minigame — SPACE/tap near water, cast→wait→bite→timing bar, direct catch or battle
- Beach 1: shore fishing (dock zone, lv3-8), Beach 2: dock/shore fishing (deep_water zone, lv8-15)
- 4 fishing zones: dock (Beach 1 shore, 9 fish), deep_water (Beach 2, 7 fish), coral_reef, storm_zone
- Wild fish battles — CATCH button (C key, 114×36 in action row), HP-based catch chance (15% + 75% × damage%)
- CAUGHT! overlay — wood panel with fish sprite (96×84 bob anim), name, type, level, rarity; SPACE/tap dismiss
- Fishing rod required — given with starter from chest, gated on all 3 beaches via `hasRod` registry flag

### Battle System
- Pokémon-style turn combat with sunset gradient bg, wooden deck platforms, parchment overlay
- WASD menu navigation, move buttons with wood frames + power display
- Fish sprite animations (idle bob, breathing pulse, battle entrance slide+fade)
- XP system — battle XP scaling, multi-level-up, evolution cinematic (glow→flash→result)
- Evolution — tier 1→2 at level 16, tier 2→3 at level 36, stat recalculation
- Rarity system — Common/Uncommon/Rare across all 61 species
- TEAM [T] and ITEMS [I] buttons — item use panel in battle (heal, revive, cure status)

### Beach 2 Enemies
- 2 overworld enemies per visit: Loot Jelly (55%) + Loot Hermit (45%) via `rollBeach2Enemy()`
- Full patrol animation: Hermit angry/scuttle cycle, Jelly slide pounce
- Aggro collision → battle trigger with fade transition
- Battle returns to Beach2 scene after victory

### Sailing & Ships
- SailingScene — 4000×4000 ocean, WASD ship, minimap, compass, SHIFT full sail, ESC return
- 5 procedural islands (Home Beach, Coral Atoll, Skull Island, Treasure Cove, Storm Reef)
- Ship selection (P key) — 20 ships, 4-per-page picker, unlock tiers by fish caught

### Mobile (Phase 8 — Complete)
- MobileInput.ts — floating joystick (left 40%), action button (right), boost button
- Landscape lock, rotate prompt, Safari 100dvh, safe-area insets, 64px tap targets
- Mobile button bar (BAG/SHIP/X), dialogue tap-to-advance, starter picker touch
- Fishing tap-to-reel, SailingScene RETURN button, PWA manifest

### Polish
- PixelPirate font (titles) + PokemonDP font (body), 3px black stroke on all world text
- BGM audio — `catch-pixel.mp3`, animated title with wave entrance + float loop
- Full code audit (3 agents, 51 findings) — all critical/high issues fixed

### Next Priorities
- [ ] **BUGS.md** — 16 playtest bugs filed (4 blockers, 6 high, 4 medium, 2 low). Run `/gsd auto` to work through them in priority order.
- [ ] **Boss battles** — enemy captains from enemy-db.ts
- [ ] **Island scenes** — unique encounter scenes for each island (currently docking returns to Beach)
- [ ] **Sound effects** — battle SFX, fishing SFX, UI click sounds
- [ ] **Weather effects** — rain, storms at sea

---

## Build Roadmap

Phases 5-8 complete (content expansion, world expansion, polish, mobile optimization).

### Phase 9 — Content Expansion (Current)
1. Boss battles (enemy captains from enemy-db.ts)
2. Island-specific scenes (unique encounters per island)
3. Sound effects (battle SFX, fishing SFX, UI clicks)
4. Multiple save slots
5. Achievement system
6. Weather effects (rain, storms at sea)
7. Day/night cycle

---

## Systems Reference

### HUDManager (`src/systems/HUDManager.ts`)
- Shared HUD buttons for all beach scenes: bag (I), team (T), volume (VOL)
- Constructor: `new HUDManager(scene, { onInventory, onTeam })`
- Mute state persists via registry key `'muted'`
- Each scene provides its own callbacks for inventory/team panel toggling

### SaveSystem (`src/systems/SaveSystem.ts`)
- `hasSave()` — quick localStorage check
- `loadGame()` — deserialize with validation
- `saveGame(data)` — serialize to localStorage
- `deleteSave()` — clear save
- `saveFromScene(scene, player, starterChosen, playtime)` — gather + save
- `startAutoSave(scene, ...)` — 60s auto-save timer
- **SaveData**: playerX, playerY, party[], inventory{}, collectedItems[], hasRod, starterChosen, playtime, savedAt

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
  - **dock** → Beach 1 shore fishing: 9 fish, all 7 types covered, lv3-8 (Fire/Storm rare here)
  - **deep_water** → Beach 2 dock/shore fishing: 7 fish, Abyssal/Nature focus, lv8-15
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

### MobileInput System (`src/systems/MobileInput.ts`)
- `IS_MOBILE` static flag — `'ontouchstart' in window || navigator.maxTouchPoints > 0`
- Floating virtual joystick — Phaser Container on UI camera, 120px base, 40px thumb, 50px max radius, 15% dead zone
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
| Walk left | Sail transition | Beach left edge → SailingScene |
| Walk right | Next area | Beach right edge → Beach2 |
| Walk left (Beach2) | Previous area | Beach2 left edge → Beach |
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
> **Priority 1:** Boss battles (enemy captains from enemy-db.ts). **Priority 2:** Island-specific scenes, SFX, real pixel art for placeholders.

---

## Data & Systems Files
- `src/data/fish-db.ts` — 62 fish species with stats, moves, rarity, evolution chains
- `src/data/fish-sprite-db.ts` — fish sprite grid/index mappings for battle + UI rendering
- `src/data/move-db.ts` — 50 battle moves (39 original + 11 pirate-themed)
- `src/data/type-chart.ts` — type effectiveness multipliers (fire/water/nature/etc.)
- `src/data/zone-db.ts` — 3 ocean zones
- `src/data/enemy-db.ts` — 3 enemy captains (boss battles)
- `src/data/ship-db.ts` — 20 ship blueprints
- `src/data/ship-unlock-db.ts` — ship unlock tiers by fish caught count
- `src/data/fishing-zones.ts` — 4 fishing hotspot zones (dock, deep_water, coral_reef, storm_zone)
- `src/data/beach-enemies.ts` — 4 beach enemy types with stats, moves, sprite keys; `rollBeach1Enemy()` (Crab+Gull), `rollBeach2Enemy()` (Jelly+Hermit)
- `src/data/beach-layout.ts` — beach scene layout constants and positions
- `src/data/constants.ts` — shared game constants
- `src/data/item-db.ts` — item definitions
- `src/systems/EvolutionSystem.ts` — fish evolution logic (level thresholds, stat recalc)
- `src/systems/XPSystem.ts` — battle XP awards, multi-level-up, evolution checking
- `src/systems/MobileInput.ts` — virtual joystick + action button + boost button
- `src/systems/SaveSystem.ts` — localStorage save/load with auto-save timer

---

## Pre-Commit Checklist
1. `npx tsc --noEmit` — zero errors (EVERY commit)
2. `npm run smoke` — all 38 tests pass (EVERY BIG commit — multi-file changes, new features, refactors. Skip for typos/docs/single-line fixes)
3. If you touched a scene transition: verify both directions pass in smoke
4. If you touched physics: confirm `gravity: {x:0, y:0}` still set in main.ts
5. If you touched fishing or battle: full flow must be covered by a smoke test or explicitly noted as untested

---

## Deploy
- **Netlify:** Push to GitHub main → auto-deploys to corsair-catch-demo.netlify.app
- **itch.io:** `npm run deploy:itch` → builds + butler pushes to slaynmember.itch.io/corsair-catch
- Always run `npx tsc --noEmit` before committing.
