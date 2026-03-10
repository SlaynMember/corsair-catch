# Corsair Catch — Visual Polish Mission Brief

## THE PROBLEM
The game is deployed but looks NOTHING like the reference art. The screenshot shows a microscopic ship on a flat teal-striped gradient. The reference art shows warm tropical paradise with chunky readable ships, flowing water with foam crests, bioluminescent deep zones, and dense atmospheric effects.

## MANDATORY FIRST ACTION
Read these files before writing a single line of code:
1. `/Users/willp/Local Sites/corsair-catch/GAMEPLAN.md` — style bible, color palette, architecture rules
2. `/Users/willp/Local Sites/corsair-catch/CLAUDE.md` — architecture rules, honest status, known bugs
3. View ALL concept art in `public/sprite_unedited/`: every PNG file is a visual target
4. Pay special attention to: IMG_4097-4100 (fishing/battle scenes), `opening scene.png`, `sunset cove.png`, `coral reef.png`

## WHAT YOU'RE FIXING
The game has working mechanics (battle, fishing, sailing, save/load — all functional). The problem is purely VISUAL. Every rendering file needs tuning to match the reference art.

## NON-NEGOTIABLE ARCHITECTURE RULES
- Stack: PixiJS v8 + TypeScript + Vite. **Three.js is completely banned.**
- PixiJS v8 API: `.rect(x,y,w,h).fill(color)` NOT `beginFill().drawRect()`
- 5-layer rendering: backgroundLayer > oceanLayer > worldLayer > fxLayer > uiLayer
- **DO NOT modify**: BattleSystem.ts, FishingSystem.ts (logic only), SaveManager.ts, AudioManager.ts
- After EVERY milestone: run `npx tsc --noEmit` (must pass 0 errors) + `npm test` (must pass 41/41)
- Working directory: `/Users/willp/Local Sites/corsair-catch/`
- Deploy: Netlify (corsair-catch-demo.netlify.app) + GitHub (https://github.com/SlaynMember/corsair-catch)

## VISUAL FIX MILESTONES (complete in order)

### V1: Camera Zoom Fix (THE MOST IMPACTFUL SINGLE CHANGE)
**File**: `src/states/SailingState.ts` line 126
**Bug**: `new Camera2D(1.0, 0.1)` — zoom=1.0 makes everything microscopic
**Fix**: Change to `new Camera2D(7.0, 0.1)` — or tune between 5-9 until ship is ~20% of viewport
**Verify**: Ship should be clearly visible with hull detail readable. World should feel intimate, not vast-and-empty.
**Also check**: WorldManager2D ship sprite sizes may need adjustment after zoom change. Ships should be chunky and detailed at the new zoom level.
- Done when: ship is clearly visible, ~15-25% of viewport width, with readable detail

### V2: Ocean Overhaul — From Stripes to Waves
**File**: `src/world/Ocean2D.ts`
**Current state**: 12px flat horizontal bands with barely-visible foam dots
**Target**: Reference shows undulating wave bands with visible foam crests and depth

Specific fixes:
1. **Band height**: Increase from 12px to 20-28px (fatter, more visible bands)
2. **Wave deformation**: Bands should NOT be perfectly horizontal. Apply sinusoidal vertical offset so bands undulate (amplitude 3-6px, varying wavelength per band)
3. **Foam lines**: Replace scattered 2-3px dots with visible white/light-teal foam LINES along wave crests. Foam should be 2-4px tall, running along the top edge of darker bands.
4. **Shimmer overhaul**: Replace invisible star-twinkle with visible sun glint patches — small bright rectangles (3-5px wide) that drift slowly, 1 per 2000px area (not 8000px)
5. **Depth gradient**: Top 30% of screen = bright teal (#3AB8C8 → #5DD4C8), middle 40% = medium (#2D9FB5 → #1A7A8C), bottom 30% = deep (#1A3A5C → #0D2040)
6. **Ripple lines**: Make thicker (2px), slower, more visible. Add slight vertical bob.
- Done when: ocean looks like flowing water with visible wave crests, not flat stripes

### V3: Sky Gradient Polish
**File**: `src/rendering/PixiContext.ts`
**Current state**: 20-step gradient with visible banding
**Target**: Smooth multi-stage sunset matching reference

Specific fixes:
1. Increase gradient steps from 20 to 100+ (eliminate visible banding)
2. Multi-stage color: deep coral (#E07856) at top → warm orange (#F4A76D) mid → golden peach (#FFD080) at horizon → pale cream (#FFF5E8) at waterline
3. Add 2-3 simple cloud shapes (off-white #F5F0E8 with peachy shadow #E8A090) as static graphics in backgroundLayer
- Done when: sky is smooth, warm, atmospheric — no visible color stepping

### V4: Wake, Seagulls, and Atmosphere Density
**File**: `src/states/SailingState.ts`

**Wake trail fixes:**
- Alpha: 0.2 → 0.5-0.6
- Lifetime: 0.4s → 1.0-1.5s
- Particle count: 4-7 → 8-12 per frame
- Size: 4-7px → 6-10px
- Color: add white core (#FFFFFF alpha 0.3) inside blue circle for foam appearance

**Seagull fixes:**
- Count: 4 → 8-12
- Add simple 2-frame wing flap (V-shape toggles open/closed every 0.3s)
- Vary Y positions across more of the sky (not just top 80px)
- Add size variation for depth (smaller = farther)

**Atmosphere particle fixes:**
- Volcanic embers: spawn rate 0.15s → 0.06s, 1 particle → 3-5, alpha 0.3 → 0.6
- Storm rain: spawn rate 0.08s → 0.03s, 3 particles → 8-12, add wind angle (not straight down)
- Coral bubbles: spawn rate 0.15s → 0.08s, add size variation, gentle drift
- All: extend despawn radius (not 50% screen, use 80%+ so effects don't abruptly vanish)
- Done when: atmosphere feels DENSE and persistent, not sparse and flickering

### V5: Bioluminescent Deep Water Effect (THE SHOWSTOPPER)
**New feature** — reference IMG_4099 shows the most impressive visual in the game

Implementation:
1. When player enters Dread Fortress zone OR deep water areas, ocean transitions to dark mode
2. Base water color shifts to deep navy (#0D3B5C → #061825)
3. Add **glowing cyan bezier curves** (#0FFFFF, alpha 0.3-0.6) that slowly drift across the ocean surface
4. Curves should be organic, flowing, varying in width (1-4px), phase-animated
5. Add faint creature silhouettes (simple dark shapes) below the glow lines
6. Subtle pulsing — glow intensity oscillates (0.3 → 0.6 → 0.3 over 3-5 seconds)
7. This effect should be the game's visual signature — the thing people screenshot
- Done when: deep water zones look magical and mysterious, matching IMG_4099

### V6: Wooden UI Frames (Diegetic Design)
**Files**: `src/ui/UIManager.ts`, `HUD.ts`, `InventoryUI.ts`, `SettingsUI.ts`
**Reference**: `corsaircatchaquapedia.png`, IMG_4098 UI elements

Implementation:
1. All UI panels: wooden frame border (#8B6B4D outer, #A0805C inner) with beveled 3D edges
2. Panel backgrounds: parchment/cream (#F0E8D8) or aged paper texture
3. Buttons: darker wood (#6B5438) with lighter text, hover state slightly lighter
4. All text: "Press Start 2P" font
5. HP/status bars: wooden frame around colored bar
6. Dialog boxes: cream (#E8DCC8) with dark brown text (#3B2817)
7. Overall feel: like reading a pirate's logbook, not a generic game UI
- Done when: every UI element uses wooden frames and feels nautical/diegetic

### V7: Ship and Island Visual Polish
**File**: `src/world/WorldManager2D.ts`

After zoom fix (V1), evaluate ship/island visuals at new scale:
1. Player ship: should show hull planking, mast, sail, flag — chunky pixel art with 6-8 colors
2. Enemy ships: distinct flag colors for identification, same detail level
3. Islands: palm fronds should be individually visible, dock planks detailed, sandy beach fringe
4. Add shadow/depth: ships cast small shadow on water, islands have darker water ring underneath
5. Fishing zones: pulsing rings should be wider, more visible, with zone name labels
- Done when: ships and islands look like the sprites in `ships.png` reference, not colored rectangles

### V8: Main Menu / Opening Scene
**Reference**: `opening scene.png`

1. Sandy beach scene (not just ocean) — character standing on beach
2. Palm tree silhouettes framing left and right edges
3. "CORSAIR CATCH" title in gold serif (#FFD040) with dark shadow, upper-center
4. Warm sunset sky background
5. START / CONTINUE / SETTINGS buttons in wooden-frame style
- Done when: opening screen matches `opening scene.png` aesthetic

## AFTER ALL VISUAL MILESTONES
```bash
npx tsc --noEmit    # 0 errors
npm test            # 41/41 pass
npm run build       # succeeds
```
Then deploy to Netlify and push to GitHub.

## STYLE SUMMARY (full details in GAMEPLAN.md)
- NO anti-aliasing. Hard pixel edges only.
- 32x32 base sprites, scaled 3-4x
- Ocean: teal #3AB8C8 / aqua #5DD4C8 / deep #1A3A5C — WITH wave deformation, NOT flat bands
- Sky: smooth warm sunset (#E07856 → #F4A76D → #FFD080) — 100+ gradient steps
- Wood UI: #8B6B4D frames, #F0E8D8 parchment backgrounds — DIEGETIC design
- Font: "Press Start 2P" (Google Fonts)
- Player ship: #FFD700 | Enemy ships: #DC143C / #4B0082
- Camera zoom: 7-9x — NEVER 1.0
- Bioluminescence: #0FFFFF glowing curves in deep water — THE signature visual
