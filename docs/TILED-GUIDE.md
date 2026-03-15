# Tiled Map Editor Guide — Corsair Catch Collision Bounds

> **For:** Will Patterson
> **Purpose:** Edit beach collision bounds, walkable zones, fishing zones, and transition zones in Tiled while the agent fixes code bugs in parallel.
> **Tiled location:** `C:\Program Files\Tiled\tiled.exe`

---

## Quick Start

1. Open Tiled
2. File → Open → `C:\Users\willp\Local Sites\corsair-catch\public\maps\beach1bounds.tmx`
3. You'll see the beach background with colored overlays on top
4. Edit the zones (see Layer Guide below)
5. Save (Ctrl+S) — the game loads these `.tmx` files at runtime, so changes take effect on next refresh

---

## What Each Layer Does

The game reads **5 named object layers** from each TMX file. The layer names are case-sensitive — don't rename them.

| Layer Name | Color | Purpose | How the Game Uses It |
|------------|-------|---------|---------------------|
| **walkable** | Green | Where the player CAN walk | Player's world bounds are clamped to the bounding rect of all walkable zones |
| **colliders** | Red | Solid obstacles the player bumps into | Creates invisible Phaser physics bodies — player can't walk through these |
| **transitions** | Blue | Scene change trigger zones | When the player overlaps one, the game switches scenes (e.g. `to-beach2`) |
| **fishing** | Light cyan | Where SPACE/tap starts fishing | Player must be standing in one of these zones to fish |
| **dock** | Yellow | Dock area (Beach2 only) | Used for dock-specific behavior |

### Layer Visibility

Toggle layer visibility with the eye icon in the Layers panel (right side). Hide/show layers to focus on what you're editing. The `background` image layer is always at the bottom — keep it visible as your reference.

---

## How to Edit Zones

### Moving a zone
1. Select the **Select Objects** tool (shortcut: `S`)
2. Click a zone shape to select it (you'll see handles)
3. Drag to move it

### Resizing a rectangle
1. Select the zone
2. Drag the corner/edge handles

### Drawing a new rectangle zone
1. Select the correct layer in the Layers panel (e.g. `colliders`)
2. Select **Insert Rectangle** tool (shortcut: `R`)
3. Click and drag on the map to draw the rectangle
4. In the Properties panel (left side), set the `Name` field (important for transitions — see naming below)

### Deleting a zone
1. Select the zone
2. Press `Delete`

---

## ⚠️ CRITICAL: Use Rectangles, Not Polygons for Colliders

**The game converts polygons to their bounding rectangles for collision.** This means a diagonal polygon becomes a much larger invisible box than you intended.

✅ **DO:** Use rectangles for all collider objects
✅ **DO:** Use multiple small rectangles to approximate curved shapes
❌ **DON'T:** Use polygons in the `colliders` layer — they'll be bigger than they look

**Fishing zones CAN use polygons** — the game does proper point-in-polygon testing for those. But colliders and walkable zones get the bounding-rect treatment.

---

## Transition Zone Naming

Transition zones MUST be named exactly as the code expects:

| In this file... | Zone name | What it does |
|-----------------|-----------|--------------|
| `beach1bounds.tmx` | `to-beach2` | Walk right → Beach 2 |
| `beach1bounds.tmx` | `to-beach3` | Walk left → Beach 3 |
| `beach2bounds.tmx` | `to-beach1` | Walk left → Beach 1 |
| `beach3bounds.tmx` | `to-beach1` | Walk right → Beach 1 |
| `beach3bounds.tmx` | `cavemouth` | Walk into cave entrance |

**Don't rename these.** The code does `findTransition('to-beach2', ...)` — if the name doesn't match, the transition breaks.

---

## What Needs Fixing (BUG-01)

### Beach 1 (`beach1bounds.tmx`)
Current state is the cleanest. Main things to verify:
- The **walkable** zone (green) covers the sand area where the player should walk
- **Colliders** (red) cover the palm tree trunks, rocks, and crate stack — player shouldn't walk through these
- The `to-beach2` transition (blue, right side) is positioned so the player enters it naturally when walking right
- The `to-beach3` transition (blue, left side) is positioned at the left edge
- **Fishing** zone (cyan) covers the shore/water edge where casting makes sense

### Beach 2 (`beach2bounds.tmx`)
- The cliff colliders on the left side may be oversized (polygon→rect conversion)
- The `to-beach1` transition on the left should be reachable — verify no collider blocks the path to it
- Dock colliders should follow the dock structure
- Fishing zones should cover the shoreline and dock edge

### Beach 3 (`beach3bounds.tmx`) — WORST
- Has lots of polygon walkable zones that get converted to bounding rects
- Many colliders are small rectangles placed for rock/log detail — these are probably fine
- The big issue is `walkable` polygons (objects 6, 7, 11, 12, 13, 14) — these complex shapes become oversized bounding rects
- **Recommendation:** Replace polygon walkable zones with a set of overlapping rectangles that approximate the actual walkable sand area
- The `to-beach1` transition zone (object 45) is at x=220 — verify this is on the RIGHT edge of Beach 3 (player enters from Beach 1 on the right)
- `cavemouth` transition at x=1009 — verify this lines up with the cave entrance visually

---

## Testing Your Changes

### Quick test (no debug overlay yet)
1. Save the TMX file in Tiled
2. In the browser, refresh the game (or `npm run dev` if not running)
3. Start a new game, walk around, check if you bump into invisible walls
4. Try transitioning between beaches

### Debug overlay (coming soon)
I'm adding a `?debug=1` URL param that draws all TMX zones as colored overlays in-game. Once that's ready, you can:
1. Open `http://localhost:3000/?debug=1`
2. See all colliders (red), walkable (green), transitions (blue), fishing (cyan) drawn on the game
3. Adjust in Tiled, save, refresh browser, see the changes

---

## Map Dimensions Reference

All three maps are: **86 tiles × 48 tiles × 16px = 1376 × 768 pixels**
All three backgrounds are: **1376 × 768 pixels**

These match. ✅ The coordinate system in Tiled is 1:1 with the game — a zone at x=500, y=300 in Tiled will be at x=500, y=300 in the game.

---

## Tips

- **Zoom:** Scroll wheel or View → Zoom In/Out
- **Pan:** Middle-click drag, or hold Space and drag
- **Grid:** View → Show Grid (toggle). The 16×16 grid can help alignment but zones don't need to snap to it
- **Snap to Grid:** If annoying, turn off with View → Snapping → Snap to Grid
- **Object Properties:** Click any zone, then look at the Properties panel on the left to see/edit its name, position, and size numerically
- **Precise positioning:** Use the Properties panel to type exact x/y/width/height values instead of dragging

---

## File Locations

```
public/maps/
  beach1bounds.tmx    ← Beach 1 (main beach)
  beach2bounds.tmx    ← Beach 2 (dock area, right of Beach 1)
  beach3bounds.tmx    ← Beach 3 (pirate cove, left of Beach 1)

public/backgrounds/
  beach-bg.png        ← Beach 1 background (referenced by TMX)
  beach2-bg.png       ← Beach 2 background
  beach3-bg.png       ← Beach 3 background
```

The TMX files reference the backgrounds via relative path (`../backgrounds/beach-bg.png`), so as long as you open the TMX from its current location, the background shows up automatically.
