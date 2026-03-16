---
estimated_steps: 7
estimated_files: 2
---

# T02: Boss Intro Overlay, Battle Launch, and SailingScene Resume

**Slice:** S03 — Boss Ships, Intro & Rewards
**Milestone:** M002

## Description

Wire the encounter chain: when the player approaches a boss ship and presses SPACE/tap, show a full-screen intro overlay with captain name, ship, and taunt dialogue. On dismiss, launch a multi-fish battle using `buildBossParty()`. Add an `onResume` handler to SailingScene so it recovers correctly after battle. This is the riskiest task — scene transitions have been historically fragile.

## Steps

1. Add `this.events.on('resume', this.onResume, this)` in SailingScene `create()`, after the shutdown handler. Define `onResume()` method: reset `transitioning = false`, fade-in camera (400ms), reset any encounter state flags. Add cleanup in shutdown handler: `this.events.off('resume', this.onResume, this)`.

2. Add instance properties: `private activeBoss: { template: EnemyTemplate, shipObj: Phaser.GameObjects.Sprite, minimapDot: Phaser.GameObjects.Arc } | null = null` and `private bossIntroShowing = false` and `private pendingBossDefeat: string | null = null`.

3. In `update()`, after the SPACE/dock check block, add boss encounter trigger: if `spaceDown && this.nearestBoss && !this.bossIntroShowing`, call `this.showBossIntro(this.nearestBoss)`. Also check for mobile action button.

4. Implement `showBossIntro(boss)`: freeze ship movement (`this.ship.setVelocity(0,0)`), set `bossIntroShowing = true`. Build a full-screen overlay container (scrollFactor 0, depth 300):
   - Dark background rect (full viewport, 0x000000, alpha 0.85)
   - Boss ship sprite (centered-upper, use ship texture key, apply tint/scale from template)
   - Captain name in PixelPirate font (gold, 28px, stroke)
   - Taunt text in PokemonDP font (white, 16px) — one line per boss: Barnacle: "Ye dare sail these waters? Prepare to be boarded!", Ironhook: "My fleet has sunk a hundred ships. Yours will be next.", Dread Corsair: "The deep claims all who challenge me."
   - "FIGHT!" button via `createActionButton()` from UIFactory, or a styled text with interactive zone (64px minimum touch target)
   - SPACE key listener + tap-anywhere listener to dismiss

5. On intro dismiss: destroy overlay container, set `bossIntroShowing = false`, set `this.pendingBossDefeat = boss.template.id`. Build party via `buildBossParty(boss.template)`. Fade out camera (350ms). On fade complete: `this.scene.launch('Battle', { enemyName: template.name, enemyParty: party, isBoss: true, returnScene: 'Sailing' })`, `this.scene.bringToTop('Battle')`, `this.scene.pause()`.

6. In `onResume()`, check `this.pendingBossDefeat`. If set, this means we just won a boss fight — store the ID for T03's victory/reward flow (or clear it if battle was lost). Determine win/loss: check if party has any fish with HP > 0 (won) vs all fainted (whiteout handled by BattleScene already, so if we resume, we won). Reset ship movement state, show mobile buttons.

7. Mobile parity: ensure intro overlay responds to tap anywhere (not just SPACE). Ensure the "FIGHT!" button has minimum 64px touch target. Test that joystick movement properly triggers proximity.

## Must-Haves

- [ ] `onResume` handler wired in SailingScene `create()` with proper cleanup
- [ ] Boss intro overlay shows on SPACE/tap when near boss ship
- [ ] Intro displays: captain name, ship sprite (tinted/scaled), taunt dialogue
- [ ] Dismiss intro → launches battle with `buildBossParty()` and `isBoss: true`
- [ ] Battle launch uses `scene.launch` + `scene.pause` (not `scene.start`)
- [ ] SailingScene resumes correctly after victory (camera fade-in, state reset)
- [ ] `pendingBossDefeat` tracks which boss was just fought (for T03 rewards)
- [ ] Mobile: tap dismisses intro, 64px touch targets

## Verification

- `npx tsc --noEmit` — zero type errors
- Dev server: approach Barnacle → intro overlay appears → SPACE → battle starts with 3 fish → win battle → SailingScene resumes with fade-in
- Confirm ship is at the position where encounter triggered (not warped)
- Confirm `pendingBossDefeat` is set after resume (verify via console)

## Inputs

- `src/scenes/SailingScene.ts` — `nearestBoss` ref from T01, `bossShips` array, patrol system
- `src/data/enemy-db.ts` — `buildBossParty()`, `EnemyTemplate` interface
- `src/ui/UIFactory.ts` — `createActionButton()`, `createOverlay()` for consistent pirate UI
- BeachScene `triggerBattle()` pattern (line 2340) — proven battle launch sequence
- BeachScene `onResume()` pattern (line 471) — proven post-battle resume

## Expected Output

- `src/scenes/SailingScene.ts` — `showBossIntro()`, `onResume()`, battle launch flow, `pendingBossDefeat` flag for T03
