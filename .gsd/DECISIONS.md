# Decisions

## D001 — Per-frame walkable zone clamping for irregular terrain (S02, 2026-03-16)
**Context:** Beach3 has an irregular L-shaped layout where TMX colliders alone leave gaps between rects. Players could walk into water/cliffs through these gaps.
**Decision:** Use per-frame `clampToWalkableZones()` as a safety net — check if player is inside any TMX walkable rect every frame, snap back to last valid position if not. Single-axis snap-back tried first for smoother feel.
**Alternatives considered:** Tighter TMX colliders only (fragile, hard to maintain); invisible wall sprites (Phaser overhead); polygon colliders (TMX parser only does bounding rects).
**Consequence:** ~0 performance cost (AABB check on 4-7 rects). Pattern is reusable for any future irregular beach scene.

## D002 — S02 re-scoped from Boss Ships to Beach Bounds (S02, 2026-03-16)
**Context:** During M002 S01 work, beach physics issues (player clipping through objects, escaping Beach3 boundaries) were discovered. These were more urgent than adding boss ship content.
**Decision:** Re-plan S02 as "Fix Beach Bounds" instead of "Boss Ships in Sailing". Boss ship content deferred.
**Consequence:** Boss ships need a new slice or must be folded into S03 before the milestone can complete.

## D003 — Multi-fish battle uses enemyPartyIndex advancing (S01, 2026-03-15)
**Context:** BattleScene needed to handle N-fish enemy parties for boss battles without breaking single-fish battles.
**Decision:** `afterEnemyDefeated()` is the single convergence point — checks for next fish in party array via `enemyPartyIndex`, sends next fish or ends battle.
**Consequence:** All enemy defeat paths (normal, evolution mid-battle) route through one gate. S03 victory rewards should hook here.

## D004 — Boss encounter uses pendingBossDefeat flag for deferred victory processing (S03/T02, 2026-03-16)
**Context:** After a boss battle, SailingScene resumes via `onResume()`. T03 needs to show victory overlay and persist the defeat. The boss ID must survive the battle scene transition.
**Decision:** Set `pendingBossDefeat = template.id` before launching battle. `onResume()` checks this flag but does NOT consume it — T03 handles consumption, reward display, and defeat persistence. BattleScene's existing whiteout path (scene.stop + scene.start Beach) means onResume only fires on victory.
**Consequence:** Clean separation: T02 owns the encounter chain, T03 owns victory processing. No race condition since Phaser scene events are synchronous.

## D005 — saveBossDefeat patches existing save rather than creating new (S03/T03, 2026-03-16)
**Context:** Boss defeats happen in SailingScene where player position is meaningless (ocean coordinates, not beach). `saveFromScene()` requires a player position and is designed for beach auto-save.
**Decision:** `saveBossDefeat(scene)` loads the existing localStorage save, patches only `defeatedBosses` and `inventory` fields from registry, and writes back. Does not touch player position or other save fields.
**Consequence:** Requires an existing save to patch (auto-save runs every 60s so this is virtually always true). Warns via console if no save exists. Pattern is reusable for any non-beach scene state persistence.
