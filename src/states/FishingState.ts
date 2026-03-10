import { Assets, Graphics, Sprite } from 'pixi.js';
import type { GameState, StateMachine } from '../core/StateMachine';
import type { InputManager } from '../core/InputManager';
import type { PixiContext } from '../rendering/PixiContext';
import type { UIManager } from '../ui/UIManager';
import type { ShipComponent } from '../components/ShipComponent';
import type { ZoneDefinition } from '../data/zone-db';
import { FISH_SPECIES } from '../data/fish-db';
import { BITE_WINDOW, REEL_COOLDOWN } from '../data/constants';
import { audio } from '../core/AudioManager';
import { showFishingUI, showCatchPopup, hideFishingUI } from '../ui/FishingUI';
import {
  FishingState as FState,
  FishingPhase,
  createFishingState,
  startCast,
  updateCast,
  releaseCast,
  updateWait,
  startReel,
  updateReel,
} from '../systems/FishingSystem';

interface RippleRing {
  radius: number;
  alpha: number;
  color: number;
}

export class FishingState implements GameState {
  private state!: FState;
  private reelCooldown = 0;
  private prevPhase: FishingPhase = 'idle';
  private biteAlertShown = false;
  private biteTimer = 0;
  private catchPopupShown = false;
  private elapsedTime = 0;
  private rippleRings: RippleRing[] = [];
  private rippleSpawnTimer = 1.0;
  private sceneGraphics!: Graphics;
  private characterSprite: Sprite | null = null;

  constructor(
    private pixiCtx: PixiContext,
    private ui: UIManager,
    private input: InputManager,
    private stateMachine: StateMachine,
    private zone: ZoneDefinition,
    private playerShip: ShipComponent
  ) {}

  enter(): void {
    this.state = createFishingState();
    this.prevPhase = 'idle';
    this.biteAlertShown = false;
    this.catchPopupShown = false;
    this.elapsedTime = 0;
    this.rippleRings = [];
    this.rippleSpawnTimer = 1.0;

    // Hide sailing layers — fishing is a side-view scene
    this.pixiCtx.oceanLayer.visible = false;
    this.pixiCtx.worldLayer.visible = false;

    // Fishing scene drawn into fxLayer (screen coordinates)
    this.sceneGraphics = new Graphics();
    this.pixiCtx.fxLayer.addChild(this.sceneGraphics);

    // Character sprite from preloaded PNG (replaces procedural drawCharacter)
    const charTex = Assets.get('sprites/char-fisherman.png');
    if (charTex) {
      this.characterSprite = new Sprite(charTex);
      this.characterSprite.anchor.set(0.5, 1.0); // anchor at bottom-center
      this.characterSprite.scale.set(0.12); // 512px → ~60px tall
      this.pixiCtx.fxLayer.addChild(this.characterSprite);
    }

    audio.playBGM('fishing');
    showFishingUI(this.ui, this.state);
  }

  update(dt: number): void {
    this.reelCooldown = Math.max(0, this.reelCooldown - dt);
    this.elapsedTime += dt;

    switch (this.state.phase) {
      case 'idle':
        if (this.input.wasPressed('Space')) {
          startCast(this.state);
          audio.playSFX('cast');
        }
        if (this.input.wasPressed('Escape')) {
          this.exitFishing();
          return;
        }
        break;

      case 'cast':
        updateCast(this.state, dt);
        if (this.input.wasReleased('Space')) {
          releaseCast(this.state, this.zone);
          audio.playSFX('splash');
          this.rippleRings.push({ radius: 2, alpha: 0.9, color: 0x88DDFF });
          this.rippleSpawnTimer = 1.2;
        }
        break;

      case 'wait':
        updateWait(this.state, dt);
        this.rippleSpawnTimer -= dt;
        if (this.rippleSpawnTimer <= 0) {
          this.rippleSpawnTimer = 1.8;
          this.rippleRings.push({ radius: 2, alpha: 0.7, color: 0x00E5FF });
        }
        if (this.input.wasPressed('Escape')) {
          this.exitFishing();
          return;
        }
        break;

      case 'bite':
        if (!this.biteAlertShown) {
          this.biteAlertShown = true;
          this.biteTimer = 0;
          this.showScreenEffect('bite-alert');
          audio.playSFX('bite');
          for (let i = 0; i < 4; i++) {
            this.rippleRings.push({ radius: i * 6, alpha: 0.9 - i * 0.18, color: 0x00E5FF });
          }
        }
        if (this.input.wasPressed('Space')) {
          startReel(this.state);
          this.biteAlertShown = false;
        }
        this.biteTimer += dt;
        if (this.biteTimer > BITE_WINDOW) {
          this.state.phase = 'escaped';
          this.state.message = 'Too slow! The fish got away...';
          this.biteAlertShown = false;
        }
        break;

      case 'reel': {
        const isReeling = this.input.wasPressed('Space') && this.reelCooldown <= 0;
        if (isReeling) {
          this.reelCooldown = REEL_COOLDOWN;
          audio.playSFX('reel_click');
        }
        const prevTension = this.state.tension;
        const prevHp = this.state.fishHp;
        updateReel(this.state, dt, isReeling);

        if (this.state.tension > 0.7) {
          this.showScreenEffect('tension-vignette');
        } else {
          this.ui.remove('tension-vignette');
        }
        this.checkReelTransitions(prevTension, prevHp);
        break;
      }

      case 'caught':
        this.ui.remove('tension-vignette');
        if (this.input.wasPressed('Space')) {
          if (this.state.caughtFish && this.playerShip.party.length < this.playerShip.maxPartySize) {
            this.playerShip.party.push(this.state.caughtFish);
            audio.playSFX('catch');
          } else {
            audio.playSFX('splash');
          }
          this.exitFishing();
          return;
        }
        if (!this.catchPopupShown && this.state.caughtFish) {
          this.catchPopupShown = true;
          const species = FISH_SPECIES[this.state.caughtFish.speciesId];
          const partyFull = this.playerShip.party.length >= this.playerShip.maxPartySize;
          showCatchPopup(
            this.ui,
            species.name,
            this.state.caughtFish.level,
            species.type,
            species.color,
            partyFull,
            species.rarity
          );
        }
        // Slow golden ripples on catch
        this.rippleSpawnTimer -= dt;
        if (this.rippleSpawnTimer <= 0) {
          this.rippleSpawnTimer = 0.4;
          this.rippleRings.push({ radius: 2, alpha: 0.8, color: 0xFFD700 });
        }
        break;

      case 'escaped':
        this.ui.remove('tension-vignette');
        if (this.input.wasPressed('Space') || this.input.wasPressed('Escape')) {
          this.exitFishing();
          return;
        }
        break;
    }

    this.prevPhase = this.state.phase;

    // Expand ripple rings
    for (let i = this.rippleRings.length - 1; i >= 0; i--) {
      const ring = this.rippleRings[i];
      ring.radius += 55 * dt;
      ring.alpha = Math.max(0, 1 - ring.radius / 80);
      if (ring.alpha <= 0) this.rippleRings.splice(i, 1);
    }

    this.drawScene();
    showFishingUI(this.ui, this.state);
  }

  private drawScene(): void {
    const g = this.sceneGraphics;
    g.clear();

    const W = this.pixiCtx.app.renderer.width;
    const H = this.pixiCtx.app.renderer.height;
    const horizonY = H * 0.48;
    const t = this.elapsedTime;

    // === HORIZON GLOW BAND (lighter teal at sky/water boundary) ===
    g.rect(0, horizonY - 15, W, 30).fill({ color: 0x5DD4C8, alpha: 0.35 });

    // === WATER (teal → deep blue gradient strips) ===
    const waterColors = [0x4ECDC4, 0x3AB8C8, 0x2A90A8, 0x1A6080, 0x1A3A5C, 0x0d2040];
    const waterH = H - horizonY;
    for (let i = 0; i < waterColors.length; i++) {
      const y0 = horizonY + (i / waterColors.length) * waterH;
      const y1 = horizonY + ((i + 1) / waterColors.length) * waterH;
      g.rect(0, y0, W, Math.ceil(y1 - y0)).fill(waterColors[i]);
    }

    // Animated horizontal ripple lines
    for (let i = 0; i < 9; i++) {
      const y = horizonY + 14 + i * ((waterH - 16) / 9);
      const offset = ((t * 38 + i * 41) % (W + 80)) - 40;
      const lineW = 22 + i * 7;
      g.rect(offset, y, lineW, 2).fill({ color: 0x8EEEFF, alpha: 0.22 - i * 0.018 });
      if (offset + lineW + 18 < W) {
        g.rect(offset + lineW + 18, y, lineW * 0.45, 2).fill({ color: 0x8EEEFF, alpha: 0.10 });
      }
    }

    // Water sparkle dots (sunlight glinting)
    for (let i = 0; i < 12; i++) {
      const sx = ((i * 137 + t * 20) % W);
      const sy = horizonY + 20 + ((i * 73) % (waterH - 30));
      const flicker = Math.sin(t * 3 + i * 1.7) * 0.5 + 0.5;
      if (flicker > 0.6) {
        g.rect(sx, sy, 2, 2).fill({ color: 0xFFFFFF, alpha: flicker * 0.4 });
      }
    }

    // === ISLAND SILHOUETTES near horizon (now visible!) ===
    g.ellipse(W * 0.12, horizonY - 8, 100, 38).fill({ color: 0x1a3050 });
    g.ellipse(W * 0.28, horizonY - 5, 62, 24).fill({ color: 0x1a3050, alpha: 0.9 });
    g.ellipse(W * 0.42, horizonY - 3, 40, 16).fill({ color: 0x1a3050, alpha: 0.7 });
    // Palm on far island
    g.rect(W * 0.105, horizonY - 44, 3, 36).fill({ color: 0x1a3050 });
    g.ellipse(W * 0.106, horizonY - 48, 18, 9).fill({ color: 0x1a3050 });
    g.ellipse(W * 0.100, horizonY - 44, 14, 7).fill({ color: 0x1a3050, alpha: 0.9 });
    // Second palm
    g.rect(W * 0.145, horizonY - 38, 2, 30).fill({ color: 0x1a3050 });
    g.ellipse(W * 0.146, horizonY - 40, 12, 6).fill({ color: 0x1a3050, alpha: 0.85 });

    // === SEAGULLS in sky ===
    for (let i = 0; i < 3; i++) {
      const gullX = ((W * 0.8 - t * (12 + i * 5) + i * W * 0.3) % (W + 60)) - 30;
      const gullY = H * 0.15 + i * H * 0.08 + Math.sin(t * 1.5 + i * 2) * 6;
      g.moveTo(gullX - 8, gullY + 3).lineTo(gullX, gullY).lineTo(gullX + 8, gullY + 3)
        .stroke({ width: 1.5, color: 0x1a3050, alpha: 0.6 });
    }

    // === SHIP SIDE VIEW (right side) — with rocking animation ===
    const rockOffset = Math.sin(t * 0.8) * 3;
    const shipLeft = W * 0.58;
    const shipW = W - shipLeft;
    const deckY = horizonY + rockOffset;

    // Hull — trapezoid shape (wider at waterline)
    const hullTopY = deckY - 16;
    const hullBotY = deckY + H * 0.12;
    g.moveTo(shipLeft + 6, hullTopY)
      .lineTo(shipLeft + shipW, hullTopY)
      .lineTo(shipLeft + shipW + 8, hullBotY)
      .lineTo(shipLeft - 4, hullBotY)
      .fill(0x8B5E3C);
    // Hull outline
    g.moveTo(shipLeft + 6, hullTopY)
      .lineTo(shipLeft + shipW, hullTopY)
      .lineTo(shipLeft + shipW + 8, hullBotY)
      .lineTo(shipLeft - 4, hullBotY)
      .closePath()
      .stroke({ width: 2, color: 0x5C3A1E });

    // Plank lines on hull
    for (let i = 0; i < 5; i++) {
      const py = hullTopY + 4 + i * ((hullBotY - hullTopY - 4) / 5);
      g.moveTo(shipLeft, py).lineTo(shipLeft + shipW + 4, py)
        .stroke({ width: 1, color: 0x5C3A1E, alpha: 0.4 });
    }

    // Portholes (3 dark circles with lighter ring)
    for (let i = 0; i < 3; i++) {
      const px = shipLeft + 20 + i * (shipW * 0.25);
      const py = deckY + H * 0.04;
      g.circle(px, py, 5).fill({ color: 0x1A1A2E });
      g.circle(px, py, 5).stroke({ width: 1, color: 0x6B4020 });
      g.circle(px, py, 3).fill({ color: 0x2A3A5A, alpha: 0.6 });
    }

    // Cannon port (dark rect cutout)
    g.rect(shipLeft + 12, deckY + H * 0.07, 8, 5).fill({ color: 0x0A0A14 });
    g.rect(shipLeft + 12, deckY + H * 0.07, 8, 5).stroke({ width: 1, color: 0x5C3A1E });

    // Submerged hull (darker, below waterline)
    g.rect(shipLeft - 4, horizonY, shipW + 12, H * 0.04).fill({ color: 0x4A2810, alpha: 0.6 });

    // Waterline foam
    for (let i = 0; i < 6; i++) {
      const fx = shipLeft + i * (shipW / 5) + Math.sin(t * 2 + i) * 3;
      g.circle(fx, horizonY + 2, 2 + Math.random()).fill({ color: 0xFFFFFF, alpha: 0.35 });
    }

    // Railing with posts
    g.rect(shipLeft + 4, hullTopY - 4, shipW - 4, 4).fill(0x6B4020);
    for (let i = 0; i < 6; i++) {
      g.rect(shipLeft + 8 + i * (shipW / 6), hullTopY - 6, 2, 6).fill(0x5C3A1E);
    }

    // Deck details — barrel
    const barrelX = shipLeft + shipW * 0.75;
    const barrelY = hullTopY - 12;
    g.ellipse(barrelX, barrelY + 8, 8, 4).fill(0x6B4423);
    g.rect(barrelX - 8, barrelY, 16, 8).fill(0x8B5E3C);
    g.rect(barrelX - 8, barrelY + 2, 16, 1).fill({ color: 0x4A2810, alpha: 0.5 });
    g.rect(barrelX - 8, barrelY + 5, 16, 1).fill({ color: 0x4A2810, alpha: 0.5 });
    g.ellipse(barrelX, barrelY, 8, 4).fill(0x9B6E4C);

    // Deck details — rope coil
    const ropeX = shipLeft + shipW * 0.88;
    const ropeY = hullTopY - 6;
    g.ellipse(ropeX, ropeY, 6, 3).fill({ color: 0xC4A060, alpha: 0.8 });
    g.ellipse(ropeX, ropeY, 4, 2).stroke({ width: 1, color: 0x8B6914, alpha: 0.6 });

    // Mast
    const mastX = shipLeft + shipW * 0.55;
    const mastBaseY = hullTopY - 4;
    const mastTopY = mastBaseY - H * 0.32;
    g.rect(mastX - 3, mastTopY, 6, mastBaseY - mastTopY).fill(0x8B5E3C);
    g.rect(mastX - 3, mastTopY, 6, mastBaseY - mastTopY).stroke({ width: 1, color: 0x5C3A1E });

    // Sail (trapezoidal shape)
    g.moveTo(mastX, mastTopY + 8)
      .lineTo(mastX + shipW * 0.30, mastTopY + H * 0.06)
      .lineTo(mastX + shipW * 0.32, mastTopY + H * 0.25)
      .lineTo(mastX, mastTopY + H * 0.25)
      .fill({ color: 0xF5E6C8, alpha: 0.92 });

    // Sail stripes
    for (let i = 0; i < 3; i++) {
      const sy = mastTopY + H * 0.08 + i * H * 0.055;
      g.rect(mastX, sy, shipW * 0.28, 2).fill({ color: 0xC4854A, alpha: 0.35 });
    }

    // Rigging lines
    g.moveTo(mastX, mastTopY + 2).lineTo(shipLeft + 4, mastBaseY)
      .stroke({ width: 1, color: 0x8B5E3C, alpha: 0.45 });
    g.moveTo(mastX, mastTopY + 2).lineTo(shipLeft + shipW, mastBaseY)
      .stroke({ width: 1, color: 0x8B5E3C, alpha: 0.35 });
    // Crow's nest rope
    g.moveTo(mastX - 1, mastTopY + 4).lineTo(mastX + shipW * 0.15, mastTopY + H * 0.04)
      .stroke({ width: 1, color: 0x8B5E3C, alpha: 0.3 });

    // Flag at masthead — with flutter animation
    const flagW = 16 * (Math.sin(t * 2) * 0.3 + 0.7);
    g.rect(mastX + 2, mastTopY - 8, flagW, 8).fill(0xCC2222);
    g.rect(mastX + 2, mastTopY - 5, flagW, 2).fill({ color: 0x881111, alpha: 0.6 });

    // Lantern at bow with improved glow
    const lanternX = shipLeft + 14;
    const lanternY = hullTopY - 16 + rockOffset;
    g.rect(lanternX - 3, lanternY - 8, 6, 10).fill(0x8B5E3C);
    const lanternFlicker = 0.18 + Math.sin(t * 3) * 0.04;
    g.circle(lanternX, lanternY - 3, 5).fill(0xFF9B3D);
    g.circle(lanternX, lanternY - 3, 20).fill({ color: 0xFF9B3D, alpha: lanternFlicker * 0.6 });
    g.circle(lanternX, lanternY - 3, 12).fill({ color: 0xFF9B3D, alpha: lanternFlicker });

    // === CHARACTER ON DECK ===
    const charX = shipLeft + shipW * 0.16;
    const charBaseY = hullTopY - 4 + rockOffset;
    if (this.characterSprite) {
      this.characterSprite.x = charX;
      this.characterSprite.y = charBaseY;
    } else {
      this.drawCharacter(g, charX, charBaseY);
    }

    // === FISHING ROD ===
    const handX = charX - 6;
    const handY = charBaseY - 20;
    const phase = this.state.phase;
    const rodBend = (phase === 'reel') ? (0.3 + this.state.tension * 0.4) : 0;
    const rodAngle = -2.25 - rodBend;
    const rodLen = 60;
    const rodTipX = handX + Math.cos(rodAngle) * rodLen;
    const rodTipY = handY + Math.sin(rodAngle) * rodLen;
    const tipExtX = rodTipX + Math.cos(rodAngle) * 22;
    const tipExtY = rodTipY + Math.sin(rodAngle) * 22;

    g.moveTo(handX, handY).lineTo(rodTipX, rodTipY)
      .stroke({ width: 3, color: 0x8B4513 });
    g.moveTo(rodTipX, rodTipY).lineTo(tipExtX, tipExtY)
      .stroke({ width: 1, color: 0x654321 });

    // === BOBBER POSITION ===
    const castPct = (phase === 'cast') ? this.state.castPower : this.state.finalCastPower;
    const bobberX = W * 0.32 - castPct * W * 0.14;
    let bobberY = horizonY + 5;

    if (phase === 'wait') {
      bobberY += Math.sin(t * 1.5) * 4;
    } else if (phase === 'bite') {
      bobberY += Math.sin(t * 8) * 10 + 10;
    } else if (phase === 'reel') {
      bobberY += Math.sin(t * 3) * 3 - this.state.tension * 7;
    }

    // Fishing LINE from rod tip to bobber
    if (phase !== 'idle' && phase !== 'cast') {
      const ctrlX = (tipExtX + bobberX) * 0.5;
      const ctrlY = Math.min(tipExtY, bobberY) - 22;
      g.moveTo(tipExtX, tipExtY)
        .quadraticCurveTo(ctrlX, ctrlY, bobberX, bobberY)
        .stroke({ width: 1, color: 0xdddddd, alpha: 0.75 });

      // === BOBBER ===
      g.circle(bobberX, bobberY + 3, 7).fill(0xffffff);
      g.rect(bobberX - 7, bobberY - 4, 14, 7).fill(0xff3300);
      g.circle(bobberX, bobberY, 7).stroke({ width: 1, color: 0xcc2200, alpha: 0.7 });
      // Antenna
      g.moveTo(bobberX, bobberY - 7).lineTo(bobberX, bobberY - 16)
        .stroke({ width: 1, color: 0xdddddd, alpha: 0.65 });

      // === RIPPLE RINGS around bobber (cyan glow — layered for depth) ===
      for (const ring of this.rippleRings) {
        g.circle(bobberX, bobberY, ring.radius + 4)
          .stroke({ width: 4, color: ring.color, alpha: ring.alpha * 0.3 });
        g.circle(bobberX, bobberY, ring.radius)
          .stroke({ width: 2, color: ring.color, alpha: ring.alpha });
      }
    }

    // CAST phase: show arc trajectory
    if (phase === 'cast') {
      const targetX = W * 0.32 - this.state.castPower * W * 0.14;
      g.moveTo(tipExtX, tipExtY)
        .quadraticCurveTo(
          (tipExtX + targetX) * 0.5,
          Math.min(tipExtY, horizonY) - 35,
          targetX,
          horizonY + 5
        )
        .stroke({ width: 1, color: 0xdddddd, alpha: 0.45 });
    }
  }

  private drawCharacter(g: Graphics, x: number, baseY: number): void {
    // Legs
    g.rect(x - 7, baseY - 14, 6, 14).fill(0x3A2010);
    g.rect(x + 1, baseY - 14, 6, 14).fill(0x3A2010);
    // Body (blue pirate shirt)
    g.rect(x - 9, baseY - 30, 18, 17).fill(0x1E3A7A);
    // Left arm extends toward rod
    g.rect(x - 16, baseY - 28, 8, 8).fill(0x1E3A7A);
    // Right arm down
    g.rect(x + 9, baseY - 26, 6, 9).fill(0x1E3A7A);
    // Head
    g.rect(x - 7, baseY - 43, 14, 13).fill(0xF5CBA7);
    // Tricorn hat
    g.rect(x - 8, baseY - 52, 16, 10).fill(0x1A1A2E);
    g.rect(x - 10, baseY - 46, 20, 3).fill(0x1A1A2E);
    g.rect(x - 3, baseY - 48, 6, 2).fill(0xFFD700);
    // Eye patch
    g.rect(x + 1, baseY - 39, 5, 3).fill(0x1A1A2E);
    // Eye (left)
    g.rect(x - 4, baseY - 39, 3, 2).fill(0x2244AA);
  }

  render(): void {
    this.pixiCtx.app.renderer.render(this.pixiCtx.app.stage);
  }

  private exitFishing(): void {
    this.ui.remove('tension-vignette');
    this.ui.remove('bite-alert-effect');
    this.ui.remove('snap-flash-effect');
    this.ui.remove('catch-flash-effect');
    this.stateMachine.pop();
  }

  private checkReelTransitions(prevTension: number, prevHp: number): void {
    if (this.state.phase === 'escaped' && prevTension < 1.0) {
      this.showScreenEffect('snap-flash');
      this.showScreenShake();
      audio.playSFX('line_snap');
    }
    if (this.state.phase === 'caught' && prevHp > 0) {
      this.showScreenEffect('catch-flash');
      audio.playSFX('catch');
      // Golden celebration burst
      for (let i = 0; i < 6; i++) {
        this.rippleRings.push({ radius: i * 10, alpha: 1.0 - i * 0.14, color: 0xFFD700 });
      }
    }
  }

  private showScreenEffect(className: string): void {
    const panelId = `${className}-effect`;
    this.ui.show(panelId, `<div class="${className}"></div>`);
    setTimeout(() => this.ui.remove(panelId), 500);
  }

  private showScreenShake(): void {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.classList.add('screen-shake');
      setTimeout(() => canvas.classList.remove('screen-shake'), 300);
    }
  }

  exit(): void {
    this.ui.remove('tension-vignette');
    hideFishingUI(this.ui);
    // Remove only our graphics — don't clear the whole layer
    if (this.sceneGraphics) {
      this.pixiCtx.fxLayer.removeChild(this.sceneGraphics);
      this.sceneGraphics.destroy();
    }
    if (this.characterSprite) {
      this.pixiCtx.fxLayer.removeChild(this.characterSprite);
      this.characterSprite.destroy();
      this.characterSprite = null;
    }
    // Restore sailing layers
    this.pixiCtx.oceanLayer.visible = true;
    this.pixiCtx.worldLayer.visible = true;
    audio.playBGM('sailing');
  }
}
