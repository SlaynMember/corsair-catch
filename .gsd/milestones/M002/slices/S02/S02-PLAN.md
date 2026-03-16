# S02: Fix Beach Bounds (All Scenes)

**Goal:** Player physics body is correctly sized across all beach scenes, and Beach3 has a per-frame walkable zone safety net so the player can never walk into water/cliffs/trees.
**Demo:** Walk Beach3 with `?debug=1` — player stays within green walkable zones. Same body sizing on Beach1, Beach2, Beach3.

## Must-Haves

- All 3 beach scenes use identical `body.setSize(16, 8)` + `body.setOffset(8, 28)` for the player sprite
- Beach3 has per-frame walkable zone clamping as a safety net (Option A from discussion)
- Beach2 gets the same body fix for consistency
- No gameplay regressions — transitions, fishing, enemy aggro all still work
- Zero performance impact from per-frame check (simple rect containment on 7 zones)

## Verification

- `npx tsc --noEmit` — zero errors
- `npm run smoke` — all tests pass
- Manual: walk Beach3 with `?debug=1`, confirm player stays within green zones
- Manual: walk Beach2, confirm no body-sizing regressions

## Tasks

- [ ] **T01: Add player body sizing to Beach2 and Beach3** `est:15m`
  - Why: Beach1 has `body.setSize(16, 8)` + `body.setOffset(8, 28)` for a small feet-only collision box. Beach2 and Beach3 are missing this, so the player's full 64×64 sprite is the physics body — causing clips and stuck situations against colliders.
  - Files: `src/scenes/Beach2Scene.ts`, `src/scenes/Beach3Scene.ts`
  - Do: After `this.player.setDisplaySize(64, 64)`, cast `this.player.body` and call `setSize(16, 8)` + `setOffset(8, 28)` — identical to BeachScene.ts lines 314-316. Apply to all places where player sprite is reset (fishing end, etc.) if needed.
  - Verify: `npx tsc --noEmit`
  - Done when: All 3 beach scenes have identical body config

- [ ] **T02: Add per-frame walkable zone clamping to Beach3** `est:20m`
  - Why: Even with correct body sizing, Beach3's irregular L-shaped terrain has gaps between collider rects. A per-frame "are you in any walkable zone?" check snaps the player back to the last valid position if they escape.
  - Files: `src/scenes/Beach3Scene.ts`
  - Do: Add `lastValidX`/`lastValidY` fields. In `handleMovement()`, after `setVelocity`, check if player position is inside any `this.tmx.walkable` rect (simple AABB test on 7 rects — negligible cost). If not, snap to last valid. If yes, update last valid. Use a small margin (~4px) so the player doesn't feel sticky at zone edges.
  - Verify: `npx tsc --noEmit`, then manual walk test with `?debug=1`
  - Done when: Player cannot leave green walkable zones in Beach3

- [ ] **T03: TMX collider cleanup pass for Beach3** `est:15m`
  - Why: With the body fix, some colliders may now be too aggressive or have gaps in new places. Quick audit pass.
  - Files: `public/maps/beach3bounds.tmx`
  - Do: Review collider rects against the background image. Adjust any that are clearly wrong now that the body is 16×8 instead of 64×64. The per-frame clamp (T02) is the safety net — colliders just need to be "good enough" to feel natural.
  - Verify: `npx tsc --noEmit`, `npm run smoke`
  - Done when: Smoke tests pass, no obvious collision weirdness in Beach3

## Files Likely Touched

- `src/scenes/Beach2Scene.ts`
- `src/scenes/Beach3Scene.ts`
- `public/maps/beach3bounds.tmx`
