---
task: T04
status: done
started: 2026-03-15T17:10:00
completed: 2026-03-15T17:25:00
---

# T04 Summary: Add TMX debug overlay

## What was done
- Created `src/systems/DebugOverlay.ts` — new module with `drawDebugOverlay()` and `isDebugMode()`
- Reads `?debug=1` from URL params; no-ops when absent (zero cost in production)
- Draws colored semi-transparent rectangles for each TMX zone layer:
  - Green: walkable zones
  - Red: collider zones
  - Blue: transition zones
  - Cyan: fishing zones
  - Yellow: dock zones
- Each zone has a label showing layer type + TMX name (e.g. "COLLIDER: rock1")
- Handles both rect and polygon zones (polygons get outline + bounding rect fill)
- Yellow "DEBUG: {SceneName} — TMX overlay active" banner fixed to screen top-left
- Wired into all 3 beach scenes (BeachScene, Beach2Scene, Beach3Scene) in create()

## Files changed
- `src/systems/DebugOverlay.ts` (new)
- `src/scenes/BeachScene.ts` — import + drawDebugOverlay call
- `src/scenes/Beach2Scene.ts` — import + drawDebugOverlay call
- `src/scenes/Beach3Scene.ts` — import + drawDebugOverlay call

## Verification
- `npx tsc --noEmit` clean
- Headless screenshots confirm overlay renders correctly on all 3 beaches
- Without `?debug=1`, no overlay appears (verified in smoke tests)
