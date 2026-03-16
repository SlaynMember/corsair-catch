---
task: T02
title: Add per-frame walkable zone clamping to Beach3
status: done
started: 2026-03-16
completed: 2026-03-16
duration: ~20m
observability_surfaces:
  - "?debug=1 URL param renders green walkable zone overlays on Beach3"
---

# T02: Add per-frame walkable zone clamping to Beach3

**Beach3 now has a per-frame safety net: `clampToWalkableZones()` checks every frame that the player is inside a TMX walkable rect, snapping back to last valid position if they escape.**

## What Was Done

Added `lastValidX`/`lastValidY` fields, `isInWalkableZone(px, py)` AABB checker with 4px margin, and `clampToWalkableZones()` called every frame after `handleMovement()`. Uses single-axis snap-back first for smooth feel, then full snap as fallback. Spawn position validated against walkable zones on scene entry.

## Diagnostics

- `?debug=1` renders green walkable zone overlays — visual proof of clamping boundaries
- Smoke test `Player stays within walkable bounds on Beach3` is the automated check
- If player reports being stuck: check `?debug=1` to see if walkable zones match background

## Verification

- `npx tsc --noEmit` — zero errors
- `?debug=1` confirms player stays within green zones

## Files Modified

- `src/scenes/Beach3Scene.ts` — lastValidX/Y, isInWalkableZone(), clampToWalkableZones(), spawn validation
