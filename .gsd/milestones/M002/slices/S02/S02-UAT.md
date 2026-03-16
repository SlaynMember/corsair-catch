# S02: Fix Beach Bounds (All Scenes) — UAT

**Milestone:** M002
**Written:** 2026-03-16

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: Beach bounds and walkable zone clamping are physics behaviors that must be verified by moving the player in-game. Artifact inspection alone cannot confirm the feel.

## Preconditions

- `npm run dev` running on localhost:3000
- Fresh browser tab (no stale save data interfering — or use NEW GAME)
- For debug overlay: append `?debug=1` to the URL

## Smoke Test

Start a new game, walk to Beach3 (left edge of Beach1), confirm the player cannot walk into water/cliffs. If the player stays on sandy terrain in Beach3, the slice basically works.

## Test Cases

### 1. Beach2 body sizing — no clip-through

1. Start NEW GAME on Beach1
2. Walk right to transition to Beach2
3. Walk the player directly into the dock structure on Beach2
4. Walk into the rock/obstacle colliders
5. **Expected:** Player slides along colliders smoothly. No clipping through objects. The collision feels "at the feet" — the player's upper body can overlap scenery slightly (head behind a crate is fine), but the feet never pass through solid objects.

### 2. Beach3 body sizing — consistent with Beach1

1. From Beach1, walk left to transition to Beach3
2. Walk the player into the cave rocks (upper area)
3. Walk into driftwood, rock clusters, any collider props
4. **Expected:** Collision feels identical to Beach1 — small feet-only hitbox, player slides along obstacles. No getting stuck on any collider.

### 3. Beach3 walkable zone clamping — can't walk into water

1. On Beach3, walk toward the bottom edge (southern shore)
2. Try to walk past the sand into the water area
3. Try to walk into the upper-left cliffs/trees
4. Try to walk into the upper-right shipwreck/water area
5. **Expected:** Player stops at the edge of sandy terrain. No "rubber-banding" or visible snap-back — just a smooth stop. The player should never reach the water pixels.

### 4. Beach3 walkable zone clamping — zone edges aren't sticky

1. On Beach3, walk along the boundary between sand and water (follow the shoreline)
2. Walk quickly across the boundary of two walkable zones (e.g., from main-beach to upper-sand-left)
3. **Expected:** Movement feels smooth at zone edges. No stuttering, no getting "stuck" at zone boundaries. The 4px margin should make transitions seamless.

### 5. Beach3 debug overlay verification

1. Load Beach3 with `?debug=1` appended to the URL
2. Observe the green overlay rectangles
3. Walk the player — confirm the player stays within the green zones at all times
4. **Expected:** Green rectangles clearly show the walkable area. Player feet (the hitbox) never leave the green zones. Collider zones (red) are visible blocking off water/cliffs.

### 6. Beach transitions still work

1. From Beach1, walk right → should transition to Beach2
2. From Beach2, walk left → should return to Beach1
3. From Beach1, walk left → should transition to Beach3
4. From Beach3, walk right → should return to Beach1
5. **Expected:** All 4 transitions work smoothly. Player spawns at the correct edge of the destination scene. No oscillation loops.

### 7. Fishing still works on all beaches

1. On Beach1, walk near the dock/water and press SPACE — should trigger fishing
2. On Beach2, walk near the dock and press SPACE — should trigger fishing
3. On Beach3, walk near the fishing zone and press SPACE — should trigger fishing
4. **Expected:** Fishing triggers correctly on all 3 beaches. The body sizing change didn't shift the player's position relative to fishing zone detection.

### 8. Enemy aggro still works on Beach3

1. On Beach3, walk toward an enemy (Blackhand Pete or other patrol)
2. Let the enemy approach
3. **Expected:** Enemy collision triggers battle as before. The smaller body doesn't prevent aggro detection.

## Edge Cases

### Rapid direction changes at Beach3 boundary

1. On Beach3, stand at the edge of a walkable zone
2. Rapidly tap WASD to change direction every frame
3. **Expected:** Player stays within walkable zones. No position jitter or teleporting. The single-axis snap-back handles rapid changes gracefully.

### Beach3 spawn after scene transition

1. Transition from Beach1 to Beach3
2. Immediately check player position
3. **Expected:** Player spawns inside a walkable zone (right side of Beach3). No momentary flash of being in an invalid position.

### Beach2 world bounds at edges

1. On Beach2, walk to the very top of the scene
2. Walk to the very bottom
3. Walk to the right edge (past the dock)
4. **Expected:** Player hits world bounds and stops cleanly. No getting stuck or clipping out of the scene.

## Failure Signals

- Player passes through a solid object (clip-through) — body sizing regression
- Player walks into water/cliffs on Beach3 — walkable zone clamping broken
- Player gets stuck and can't move — collider too tight or zone gap
- Player "teleports" or rubber-bands visibly — snap-back too aggressive
- Transition between beaches fails — body sizing broke transition zone detection
- Fishing doesn't trigger — body position shifted relative to fishing zones
- Green debug overlay shows player outside all green zones — clamping not working

## Requirements Proved By This UAT

- No formal requirements are directly proved — this slice addresses a physics/collision quality issue

## Not Proven By This UAT

- Mobile touch controls on Beach3 (walkable zone clamping with joystick input vs. keyboard)
- Performance under stress (walkable zone check cost — trivial for 4-7 rects, but not load-tested)
- New beach areas (only 3 existing scenes verified)

## Notes for Tester

- The body sizing change is subtle — the player's visual sprite overlapping scenery slightly is **correct** behavior (the hitbox is at the feet, not the full sprite). The player's head/torso can overlap a crate or rock; only the feet should be blocked.
- Beach3 walkable zones are deliberately generous (4px margin). If you can technically reach 1-2 pixels past the visible sand edge, that's the margin working as designed.
- If you notice any area on Beach3 where you think you should be able to walk but can't, check `?debug=1` — the green zones define the absolute boundary.
