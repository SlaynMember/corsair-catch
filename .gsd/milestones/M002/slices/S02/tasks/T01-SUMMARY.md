---
task: T01
title: Add player body sizing to Beach2 and Beach3
status: done
started: 2026-03-16
completed: 2026-03-16
duration: ~15m
observability_surfaces:
  - none
---

# T01: Add player body sizing to Beach2 and Beach3

**Added `body.setSize(16, 8)` + `body.setOffset(8, 28)` to Beach2Scene and Beach3Scene, matching Beach1's feet-only collision box.**

## What Was Done

Beach1 already had a small feet-only physics body, but Beach2 and Beach3 were using the full 64×64 sprite. Added identical body sizing after `setDisplaySize(64, 64)` in both scenes, plus `physics.world.setBounds()` clamped to walkable bounding rect.

## Diagnostics

- `npx tsc --noEmit` — zero errors
- Collision feel verifiable by walking into objects on Beach2/Beach3

## Verification

- `npx tsc --noEmit` — zero errors

## Files Modified

- `src/scenes/Beach2Scene.ts` — body sizing + world bounds
- `src/scenes/Beach3Scene.ts` — body sizing + world bounds
