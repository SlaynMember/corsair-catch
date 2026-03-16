---
task: T03
title: TMX collider cleanup pass for Beach3
status: done
started: 2026-03-16
completed: 2026-03-16
duration: ~15m
observability_surfaces:
  - "?debug=1 shows collider rects (red) and walkable zones (green) on Beach3"
---

# T03: TMX collider cleanup pass for Beach3

**Beach3 TMX colliders rewritten to match the 16×8 body size. Walkable zones adjusted. New backgrounds swapped in.**

## What Was Done

Rewrote `beach3bounds.tmx` for the smaller body: 4 walkable zones (main-beach, upper-sand-left, right-sand, cave-grass), 14 colliders (cave rocks, palms, driftwood, rock clusters, water boundaries), 1 transition zone (to-beach1). Also swapped `beach3-bg.png` and `beach2-bg.png` to new AI-generated backgrounds matching the layout.

## Diagnostics

- `?debug=1` renders all TMX zones as colored overlays — visual audit of collider placement
- Smoke test `Beach3 loads with valid TMX and no errors` confirms zone counts (4 walkable, 14 colliders, 1 transition)

## Verification

- `npx tsc --noEmit` — zero errors
- `npm run smoke` — 42/42 pass

## Files Modified

- `public/maps/beach3bounds.tmx` — rewritten colliders and walkable zones
- `public/backgrounds/beach3-bg.png` — new background
- `public/backgrounds/beach2-bg.png` — new background
