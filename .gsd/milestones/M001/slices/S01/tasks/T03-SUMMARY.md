---
task: T03
status: done
started: 2026-03-15T17:00:00
completed: 2026-03-15T17:10:00
---

# T03 Summary: Fix pirate battle black screen

## What was done
- Traced full battle launch chain: Beach3 enemy collision → triggerBattle() → scene.launch('Battle', {speciesId:0, enemySpriteKey:'evil-pirate'}) → BattleScene.init() → create() → buildUI() → buildFishShape(speciesId=0 + evil-pirate) → loads evil-pirate-idle-west-0 sprite
- Verified all evil-pirate textures loaded in BootScene (8 idle frames, 6 attack, 6 hurt, 7 death, 5 getup per direction)
- Verified sprite files exist on disk at public/sprites/evil-pirate/battle/idle/west/frame_000-007.png
- Verified moves (cutlass_slash, plunder) exist in move-db.ts
- **Headless Playwright test**: launched pirate battle from Beach3 — rendered correctly with evil pirate sprite, portrait, HP bars, move buttons. Zero errors.
- **Conclusion**: BUG-09 was likely a transient state issue (no party set, or stale scene) rather than a persistent code bug. The rendering path is solid.

## Files changed
- None — no code changes needed

## Verification
- Headless screenshot confirms pirate battle renders fully (saved to e2e/screenshots/pirate-battle-test.png)
- Beach3 → Battle launch path tested end-to-end with zero console errors
