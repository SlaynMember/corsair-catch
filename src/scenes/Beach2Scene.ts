import { FishInstance } from '../data/fish-db';
import { FISH_SPRITE_DB, FishSpriteData } from '../data/fish-sprite-db';
import { FISHING_ZONES, rollFishFromZone } from '../data/fishing-zones';
import MobileInput from '../systems/MobileInput';

// ── Layout constants (mapped from user reference: 1024×576 → 1280×720) ──────
const W = 1280;
const H = 720;
// Main beach sand area: x=200-888, y=412-650
const WALK_MIN_X  = 200;
const WALK_MAX_X  = 888;
const WALK_MIN_Y  = 412;              // top of walkable sand
const WALK_MAX_Y  = 650;              // bottom of walkable sand

// Pier/bridge: x=888-1188, y=562-688
const DOCK_LEFT   = 888;
const DOCK_RIGHT  = 1188;
const DOCK_TOP    = 562;              // top of dock walkable area
const DOCK_SAND_Y = 650;              // sand edge (below = dock only)
const SAND_TOP    = 412;              // for scenery placement
const WATER_TOP   = 650;              // for wave drawing

export default class Beach2Scene extends Phaser.Scene {
  // ── Player ───────────────────────────────────────────────────────────────
  private player!: Phaser.Physics.Arcade.Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private iKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  private currentDir = 'south';
  private animFrame  = 0;
  private animTimer  = 0;

  // ── Dialogue ─────────────────────────────────────────────────────────────
  private dlgContainer!: Phaser.GameObjects.Container;
  private dlgText!: Phaser.GameObjects.Text;
  private dlgQueue: string[] = [];
  private dlgOpen    = false;
  private dlgTyping  = false;
  private dlgFull    = '';
  private dlgChars   = 0;
  private dlgTimer   = 0;
  private spacePrev  = false;
  private dlgTapped  = false;
  private fishTapped = false;

  // ── Fishing ─────────────────────────────────────────────────────────────
  private isFishing        = false;
  private fishingPhase:    'cast' | 'wait' | 'bite' | 'reel' | 'done' = 'cast';
  private fishingTimer     = 0;
  private fishingOverlay!: Phaser.GameObjects.Container;
  private fishingBar!:     Phaser.GameObjects.Rectangle;
  private fishingMarker!:  Phaser.GameObjects.Rectangle;
  private fishingZone!:    Phaser.GameObjects.Rectangle;
  private fishingText!:    Phaser.GameObjects.Text;
  private fishingMarkerX   = 0;
  private fishingMarkerDir = 1;
  private fishingBiteTime  = 0;
  private hookedFish?:     FishSpriteData;
  private fishingRolledLevel = 5;

  // ── Inventory panel ──────────────────────────────────────────────────────
  private invContainer!: Phaser.GameObjects.Container;
  private invOpen = false;
  private readonly INV_STATIC = 13;

  // ── Mobile input ────────────────────────────────────────────────────────
  private mobileInput?: MobileInput;

  // ── Transition ──────────────────────────────────────────────────────────
  private sceneTransitioning = false;

  // ── Waves ────────────────────────────────────────────────────────────────
  private waveRects: { rect: Phaser.GameObjects.Rectangle; speed: number }[] = [];

  constructor() {
    super({ key: 'Beach2' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════════════════════
  create(data?: { from?: string }) {
    this.sceneTransitioning = false;

    // ── Background ──────────────────────────────────────────────────────
    this.add.image(W / 2, H / 2, 'bg-beach2').setDisplaySize(W, H).setDepth(0);

    // ── Animated water layers (spritesheet-matched style) ──────────────────
    this.createWaves();

    // ── Dock scenery (procedural on top of bg) ──────────────────────────
    this.drawDockScenery();

    // ── Transition hints ─────────────────────────────────────────────────
    this.add.text(WALK_MIN_X + 20, (WALK_MIN_Y + WALK_MAX_Y) / 2, '\u2190 BEACH', {
      fontFamily: 'PokemonDP, monospace', fontSize: '14px',
      color: '#f0e8d8', stroke: '#2c1011', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4);

    this.add.text(DOCK_RIGHT - 40, DOCK_TOP + 20, 'FISH \u25bc', {
      fontFamily: 'PokemonDP, monospace', fontSize: '14px',
      color: '#2dafb8', stroke: '#2c1011', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4);

    // ── Player ──────────────────────────────────────────────────────────
    const spawnX = data?.from === 'left' ? WALK_MIN_X + 40 : (WALK_MIN_X + WALK_MAX_X) / 2;
    const spawnY = (WALK_MIN_Y + WALK_MAX_Y) / 2;
    this.player = this.physics.add.sprite(spawnX, spawnY, 'pirate-idle-south-0');
    this.player.setDisplaySize(64, 64);
    this.player.setDepth(5);
    this.player.setCollideWorldBounds(true);
    // Left edge is 0 so player can walk off-screen to trigger Beach1 transition
    this.physics.world.setBounds(0, WALK_MIN_Y, WALK_MAX_X, WALK_MAX_Y - WALK_MIN_Y);

    // ── Shadow ──────────────────────────────────────────────────────────
    this.shadow = this.add.ellipse(this.player.x, this.player.y + 16, 28, 7, 0x000000, 0.20);
    this.shadow.setDepth(4);

    // ── Dialogue box ─────────────────────────────────────────────────────
    this.createDialogueBox();

    // ── Fishing overlay ──────────────────────────────────────────────────
    this.createFishingOverlay();

    // ── Inventory panel ──────────────────────────────────────────────────
    this.createInventoryPanel();

    // ── Input ────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.iKey     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.escKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // ── Camera ──────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // ── Mobile input ─────────────────────────────────────────────────
    if (MobileInput.IS_MOBILE) {
      this.mobileInput = new MobileInput(this);
      this.mobileInput.showContextButtons('overworld');

      // Tap-to-advance dialogue
      this.input.on('pointerdown', () => {
        if (this.dlgOpen) this.dlgTapped = true;
        if (this.isFishing) this.fishTapped = true;
      });
    }

    // ── Resume handler (fade back in after returning from BattleScene) ───
    this.events.on('resume', () => this.onResume());

    // ── Shutdown handler (clean up mobile input) ───────────────────────
    this.events.on('shutdown', () => this.mobileInput?.destroy());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WAVES
  // ═══════════════════════════════════════════════════════════════════════════
  private createWaves() {
    const waterH = H - WATER_TOP;

    // ── Wet sand shadow ─────────────────────────────────────────────────
    const wetSand = this.add.rectangle(W / 2, WATER_TOP - 3, W, 8, 0xc4a882, 0.30);
    wetSand.setDepth(0.8);
    this.tweens.add({
      targets: wetSand,
      alpha: { from: 0.30, to: 0.12 },
      scaleY: { from: 1, to: 0.6 },
      duration: 2400,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // ── Wide gradient bands (spritesheet style) ─────────────────────────
    const bands: { color: number; alpha: number; yOff: number; h: number; delay: number }[] = [
      { color: 0x6dd4d8, alpha: 0.28, yOff: 0,   h: 20, delay: 0    },
      { color: 0x45bcc4, alpha: 0.32, yOff: 18,  h: 24, delay: 150  },
      { color: 0x2dafb8, alpha: 0.38, yOff: 40,  h: 28, delay: 300  },
      { color: 0x1f8a96, alpha: 0.42, yOff: 66,  h: 32, delay: 200  },
      { color: 0x1a6e80, alpha: 0.38, yOff: 96,  h: 36, delay: 400  },
      { color: 0x155a6a, alpha: 0.32, yOff: 130, h: waterH - 130, delay: 100 },
    ];

    bands.forEach((b, i) => {
      const y = WATER_TOP + b.yOff + b.h / 2;
      const rect = this.add.rectangle(W / 2, y, W + 40, b.h, b.color, b.alpha).setDepth(1);
      this.waveRects.push({ rect, speed: (i % 2 === 0 ? 1 : -1) * (12 + i * 3) });
      this.tweens.add({
        targets: rect,
        x: { from: W / 2 - 10 - i * 2, to: W / 2 + 10 + i * 2 },
        y: { from: y - 2, to: y + 2 },
        alpha: { from: b.alpha * 0.65, to: b.alpha },
        duration: 2200 + i * 400,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: b.delay,
      });
    });

    // ── Foam edge ───────────────────────────────────────────────────────
    const foam = this.add.graphics().setDepth(2);
    let foamTime = 0;
    this.time.addEvent({
      delay: 80,
      loop: true,
      callback: () => {
        foamTime += 0.08;
        const yOff = Math.sin(foamTime * 0.4) * 3;
        const a = 0.45 + Math.sin(foamTime * 0.25) * 0.12;
        foam.clear();
        foam.fillStyle(0xffffff, a);
        foam.beginPath();
        foam.moveTo(0, WATER_TOP + yOff + 4);
        for (let x = 0; x <= W; x += 16) {
          const jag = Math.sin(x * 0.04 + foamTime * 0.5) * 3
                    + Math.sin(x * 0.09) * 2
                    + Math.cos(x * 0.015 + foamTime * 0.3) * 2;
          foam.lineTo(x, WATER_TOP + yOff + jag);
        }
        foam.lineTo(W, WATER_TOP + yOff + 8);
        foam.lineTo(0, WATER_TOP + yOff + 8);
        foam.closePath();
        foam.fillPath();
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCK SCENERY
  // ═══════════════════════════════════════════════════════════════════════════
  private drawDockScenery() {
    // No env-dock overlay — the dock built into beach2-bg is the dock

    // Palm trees — on sand, left of dock
    if (this.textures.exists('palm-tree')) {
      const palms = [
        this.add.image(500, WALK_MIN_Y - 10, 'palm-tree').setDisplaySize(117, 175).setDepth(2).setAngle(8),
        this.add.image(650, WALK_MIN_Y - 20, 'palm-tree').setDisplaySize(107, 160).setDepth(2).setAngle(-5),
      ];
      palms.forEach((palm, i) => {
        const base = palm.angle;
        this.tweens.add({
          targets: palm, angle: base + 3,
          duration: 2200 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 300,
        });
      });
    }

    // Scattered shells — mid-sand area
    const sandMidY = (WALK_MIN_Y + DOCK_SAND_Y) / 2;
    if (this.textures.exists('env-shell-1')) {
      this.add.image(200, sandMidY + 30, 'env-shell-1').setDisplaySize(16, 16).setDepth(2).setAngle(30);
      this.add.image(350, sandMidY + 40, 'env-shell-2').setDisplaySize(14, 14).setDepth(2).setAngle(-20);
      this.add.image(500, sandMidY + 20, 'env-shell-3').setDisplaySize(14, 20).setDepth(2).setAngle(15);
      this.add.image(650, sandMidY + 35, 'env-shell-1').setDisplaySize(12, 12).setDepth(2).setAngle(-35);
    }

    // Crates near dock — sitting on sand at dock entrance
    if (this.textures.exists('env-crate')) {
      this.add.image(770, DOCK_SAND_Y - 20, 'env-crate').setDisplaySize(30, 28).setDepth(4 + DOCK_SAND_Y * 0.001);
      this.add.image(765, DOCK_SAND_Y - 45, 'env-crate').setDisplaySize(26, 24).setDepth(4 + DOCK_SAND_Y * 0.001).setAngle(6);
    }

    // Rope coils near crates
    this.add.ellipse(800, DOCK_SAND_Y - 5, 18, 12, 0x8b6b4d, 0.7).setDepth(2);
    this.add.ellipse(800, DOCK_SAND_Y - 5, 10, 6, 0xa08060, 0.5).setDepth(2);

    // Rock clusters on sand
    this.drawRocks(300, DOCK_SAND_Y - 10);
    this.drawRocks(550, DOCK_SAND_Y - 5);
  }

  private drawRocks(cx: number, cy: number) {
    const rocks: [number, number, number, number, number][] = [
      [  0,  0, 24, 16, 0x9a8878],
      [ 14, -4, 18, 12, 0xa09888],
      [-10,  2, 14, 10, 0x887870],
    ];
    rocks.forEach(([ox, oy, rw, rh, col]) => {
      this.add.ellipse(cx + ox + 2, cy + oy + 3, rw - 2, rh - 2, 0x6a5850, 0.35).setDepth(1);
      this.add.ellipse(cx + ox, cy + oy, rw, rh, col).setDepth(2);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DIALOGUE BOX
  // ═══════════════════════════════════════════════════════════════════════════
  private createDialogueBox() {
    const cx = W / 2, cy = H - 95, bw = W - 40, bh = 120;
    this.dlgContainer = this.add.container(cx, cy).setDepth(20);
    const bg = this.add.rectangle(0, 0, bw, bh, 0xf0e8d8).setStrokeStyle(4, 0x5a3a1a);
    const stripColor = 0x8b6b4d;
    const s1 = this.add.rectangle(0, -bh / 2 + 4, bw, 8, stripColor);
    const s2 = this.add.rectangle(0,  bh / 2 - 4, bw, 8, stripColor);
    const s3 = this.add.rectangle(-bw / 2 + 4, 0, 8, bh, stripColor);
    const s4 = this.add.rectangle( bw / 2 - 4, 0, 8, bh, stripColor);
    this.dlgText = this.add.text(-bw / 2 + 20, -bh / 2 + 16, '', {
      fontFamily: 'PokemonDP, monospace', fontSize: '22px', color: '#2c1011',
      wordWrap: { width: bw - 48 }, lineSpacing: 6,
    });
    const promptStr = MobileInput.IS_MOBILE ? 'TAP \u25bc' : '\u25bc';
    const prompt = this.add.text(bw / 2 - 20, bh / 2 - 16, promptStr, {
      fontFamily: 'PokemonDP, monospace', fontSize: '20px', color: '#8b6b4d',
    }).setOrigin(1, 1);
    this.dlgContainer.add([bg, s1, s2, s3, s4, this.dlgText, prompt]);
    this.dlgContainer.setVisible(false);
    this.tweens.add({
      targets: prompt, y: { from: bh / 2 - 16, to: bh / 2 - 10 },
      duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  private openDialogue(lines: string[]) {
    this.player.setVelocity(0, 0);
    this.dlgQueue = [...lines];
    this.dlgOpen  = true;
    this.dlgContainer.setVisible(true);
    this.advanceDlg();
  }

  private advanceDlg() {
    if (this.dlgQueue.length === 0) {
      this.dlgOpen = false;
      this.dlgContainer.setVisible(false);
      return;
    }
    this.dlgFull  = this.dlgQueue.shift()!;
    this.dlgChars = 0;
    this.dlgTimer = 0;
    this.dlgTyping = true;
    this.dlgText.setText('');
  }

  private tickDialogue(delta: number, spaceJustDown: boolean) {
    if (this.dlgTyping) {
      this.dlgTimer += delta;
      while (this.dlgTimer >= 38 && this.dlgChars < this.dlgFull.length) {
        this.dlgTimer -= 38;
        this.dlgChars++;
        this.dlgText.setText(this.dlgFull.slice(0, this.dlgChars));
        if (this.dlgChars % 3 === 0) this.sound.play('sfx-typewriter', { volume: 0.15 });
      }
      if (this.dlgChars >= this.dlgFull.length) this.dlgTyping = false;
      if (spaceJustDown) {
        this.dlgChars = this.dlgFull.length;
        this.dlgText.setText(this.dlgFull);
        this.dlgTyping = false;
      }
    } else if (spaceJustDown) {
      this.advanceDlg();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FISHING
  // ═══════════════════════════════════════════════════════════════════════════
  private createFishingOverlay() {
    this.fishingOverlay = this.add.container(W / 2, H / 2).setDepth(28);
    const bg = this.add.rectangle(0, 0, W, H, 0x000000, 0.75);
    this.fishingText = this.add.text(0, -120, '', {
      fontFamily: 'PixelPirate, monospace', fontSize: '28px',
      color: '#ffe066', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);
    const barBg = this.add.rectangle(0, 30, 500, 40, 0x3d1a10).setStrokeStyle(3, 0x8b6b4d);
    this.fishingZone   = this.add.rectangle(0, 30, 100, 36, 0x44cc44, 0.5);
    this.fishingMarker = this.add.rectangle(-240, 30, 12, 36, 0xffe066);
    this.fishingBar    = barBg;
    const fishHintStr = MobileInput.IS_MOBILE
      ? 'TAP when the marker is in the green zone!'
      : 'Press SPACE when the marker is in the green zone!';
    const hint = this.add.text(0, 80, fishHintStr, {
      fontFamily: 'PokemonDP, monospace', fontSize: '20px', color: '#f0e8d8',
    }).setOrigin(0.5);
    this.fishingOverlay.add([bg, this.fishingText, barBg, this.fishingZone, this.fishingMarker, hint]);
    this.fishingOverlay.setVisible(false);
  }

  private startFishing() {
    this.isFishing = true;
    this.fishingPhase = 'cast';
    this.fishingTimer = 0;
    this.player.setVelocity(0, 0);

    // Always face east when fishing (dock is on the right, water to the right)
    this.player.setFlipX(false);
    if (this.textures.exists('pirate-fish-east-0')) {
      this.player.setTexture('pirate-fish-east-0');
      this.player.setDisplaySize(64, 64);
    }

    const roll = rollFishFromZone(FISHING_ZONES.deep_water);
    this.hookedFish = FISH_SPRITE_DB.find(f => f.textureKey === roll.textureKey)
      ?? FISH_SPRITE_DB.filter(f => f.evolutionStage <= 2)[0];
    this.fishingRolledLevel = roll.level;
    this.fishingOverlay.setVisible(true);
    this.fishingText.setText('CASTING...');
    this.sound.play('sfx-cast', { volume: 0.5 });
    this.fishingMarker.setVisible(false);
    this.fishingZone.setVisible(false);
    this.fishingBiteTime = 1500 + Math.random() * 2000;
  }

  private tickFishing(delta: number, spaceJustDown: boolean) {
    this.fishingTimer += delta;

    if (this.fishingPhase === 'cast') {
      if (this.fishingTimer > 800) {
        this.fishingPhase = 'wait';
        this.fishingTimer = 0;
        this.fishingText.setText('Waiting...');
      }
    } else if (this.fishingPhase === 'wait') {
      const dots = '.'.repeat(Math.floor(this.fishingTimer / 400) % 4);
      this.fishingText.setText(`Waiting${dots}`);
      if (this.fishingTimer >= this.fishingBiteTime) {
        this.fishingPhase = 'bite';
        // Swap to reel sprite on bite
        if (this.textures.exists('pirate-fish-east-1')) {
          this.player.setTexture('pirate-fish-east-1');
          this.player.setDisplaySize(64, 64);
        }
        this.fishingTimer = 0;
        this.fishingText.setText('!! BITE !!');
        this.fishingMarker.setVisible(true);
        this.fishingZone.setVisible(true);
        this.fishingMarkerX = -240;
        this.fishingMarkerDir = 1;
        const zoneX = -100 + Math.random() * 200;
        this.fishingZone.setX(zoneX);
      }
      if (spaceJustDown) { this.endFishing(); return; }
    } else if (this.fishingPhase === 'bite') {
      const speed = 400;
      this.fishingMarkerX += this.fishingMarkerDir * speed * (delta / 1000);
      if (this.fishingMarkerX > 240)  { this.fishingMarkerX = 240;  this.fishingMarkerDir = -1; }
      if (this.fishingMarkerX < -240) { this.fishingMarkerX = -240; this.fishingMarkerDir = 1;  }
      this.fishingMarker.setX(this.fishingMarkerX);

      if (this.fishingTimer > 4000) {
        this.fishingPhase = 'done';
        this.fishingTimer = 0;
        this.fishingText.setText('It got away...');
        this.fishingMarker.setVisible(false);
        this.fishingZone.setVisible(false);
        this.time.delayedCall(1200, () => this.endFishing());
        return;
      }

      if (spaceJustDown) {
        this.fishingMarker.setVisible(false);
        this.fishingZone.setVisible(false);
        const markerX = this.fishingMarkerX;
        const zoneX = this.fishingZone.x;
        const inZone = Math.abs(markerX - zoneX) < 50;

        if (inZone) {
          const perfectHit = Math.abs(markerX - zoneX) < 15;
          if (perfectHit && Math.random() < 0.30) {
            this.fishingPhase = 'done';
            this.fishingText.setText(`Caught ${this.hookedFish!.name}!`);
            this.time.delayedCall(1500, () => {
              this.endFishing();
              this.addCaughtFish(this.hookedFish!);
            });
          } else {
            this.fishingPhase = 'done';
            this.fishingText.setText(`${this.hookedFish!.name} fights back!`);
            this.time.delayedCall(1200, () => {
              this.endFishing();
              this.triggerFishBattle(this.hookedFish!);
            });
          }
        } else {
          this.fishingPhase = 'done';
          this.fishingText.setText('Missed! It got away...');
          this.time.delayedCall(1200, () => this.endFishing());
        }
      }
    }
  }

  private endFishing() {
    this.isFishing = false;
    this.fishingPhase = 'cast';
    this.fishingTimer = 0;
    this.fishingOverlay.setVisible(false);
    // Restore idle sprite at original 64×64 display size
    this.player.setFlipX(false);
    this.player.setTexture('pirate-idle-south-0');
    this.player.setDisplaySize(64, 64);
  }

  private addCaughtFish(fishData: FishSpriteData) {
    const party = (this.registry.get('party') as FishInstance[]) || [];
    if (party.length >= 6) {
      this.openDialogue([`${fishData.name} was caught!`, 'But your party is full...', 'It swam away.']);
      return;
    }
    const level = this.fishingRolledLevel;
    const newFish: FishInstance = {
      uid: `fish_${Date.now()}`,
      speciesId: fishData.textureKey,
      nickname: fishData.name,
      level, xp: 0,
      currentHp: fishData.baseHP, maxHp: fishData.baseHP,
      moves: fishData.suggestedMoves.slice(0, 2),
      iv: {
        hp: 5 + Math.floor(Math.random() * 10),
        attack: 5 + Math.floor(Math.random() * 10),
        defense: 5 + Math.floor(Math.random() * 10),
        speed: 5 + Math.floor(Math.random() * 10),
      },
    };
    party.push(newFish);
    this.registry.set('party', party);
    this.openDialogue([`${fishData.name} joined your crew!`, `Party: ${party.length}/6`]);
  }

  private triggerFishBattle(fishData: FishSpriteData) {
    const level = this.fishingRolledLevel;
    const wildFish: FishInstance = {
      uid: `wild_${Date.now()}`,
      speciesId: fishData.textureKey,
      nickname: fishData.name,
      level, xp: 0,
      currentHp: fishData.baseHP, maxHp: fishData.baseHP,
      moves: fishData.suggestedMoves.slice(0, 2),
      iv: {
        hp: 5 + Math.floor(Math.random() * 8),
        attack: 5 + Math.floor(Math.random() * 8),
        defense: 5 + Math.floor(Math.random() * 8),
        speed: 5 + Math.floor(Math.random() * 8),
      },
    };
    this.sound.play('sfx-battle-intro', { volume: 0.4 });
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.launch('Battle', {
        enemyName: fishData.name,
        enemyParty: [wildFish],
        returnScene: 'Beach2',
        isWildFish: true,
        fishSpriteData: fishData,
      });
      this.scene.pause();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INVENTORY PANEL (simplified — same visual as Beach1)
  // ═══════════════════════════════════════════════════════════════════════════
  private createInventoryPanel() {
    this.invContainer = this.add.container(W / 2, H / 2).setDepth(25);
    const pw = 620, ph = 480, hh = 48;
    const ov = this.add.rectangle(0, 0, W, H, 0x000000, 0.55);
    const of_ = this.add.rectangle(0, 0, pw + 8, ph + 8, 0x5a3a1a);
    const if_ = this.add.rectangle(0, 0, pw + 2, ph + 2, 0x8b6b4d);
    const bg  = this.add.rectangle(0, 0, pw, ph, 0xf0e8d8);
    const hd = this.add.rectangle(0, -ph / 2 + hh / 2, pw, hh, 0x8b6b4d);
    const hl = this.add.rectangle(0, -ph / 2 + hh, pw - 8, 2, 0x5a3a1a);
    const ti = this.add.text(0, -ph / 2 + hh / 2, 'INVENTORY', {
      fontFamily: 'PixelPirate, monospace', fontSize: '30px',
      color: '#ffe066', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);
    const fb = this.add.rectangle(0, ph / 2 - 18, pw, 36, 0x8b6b4d, 0.4);
    const ht = this.add.text(0, ph / 2 - 18, '[I] CLOSE', {
      fontFamily: 'PokemonDP, monospace', fontSize: '18px',
      color: '#5a3a1a', stroke: '#f0e8d8', strokeThickness: 2,
    }).setOrigin(0.5);
    const rr = 5, rc = 0x5a3a1a, rx = pw / 2 - 12, ry = ph / 2 - 12;
    this.invContainer.add([
      ov, of_, if_, bg, hd, hl, ti, fb, ht,
      this.add.circle(-rx, -ry, rr, rc), this.add.circle(rx, -ry, rr, rc),
      this.add.circle(-rx, ry, rr, rc),  this.add.circle(rx, ry, rr, rc),
    ]);
    this.invContainer.setVisible(false);
  }

  private toggleInventory() {
    this.invOpen = !this.invOpen;
    this.invContainer.setVisible(this.invOpen);
    if (this.invOpen) {
      this.player.setVelocity(0, 0);
      this.refreshInventoryUI();
    }
  }

  private refreshInventoryUI() {
    while (this.invContainer.length > this.INV_STATIC) {
      this.invContainer.removeAt(this.INV_STATIC, true);
    }
    const party = (this.registry.get('party') as FishInstance[]) || [];
    const inventory = (this.registry.get('inventory') as Record<string, number>) || {};
    const entries = Object.entries(inventory);
    const startY = -160;
    let curY = startY;
    const ts = (size: number, color: string) => ({ fontFamily: 'PokemonDP, monospace', fontSize: `${size}px`, color });
    const ss = () => ({ fontFamily: 'PixelPirate, monospace', fontSize: '20px', color: '#8b6b4d', stroke: '#f0e8d8', strokeThickness: 1 });

    this.invContainer.add(this.add.text(-270, curY, 'CREW', ss()));
    this.invContainer.add(this.add.rectangle(0, curY + 18, 540, 2, 0x8b6b4d, 0.4));
    curY += 30;
    if (party.length === 0) {
      this.invContainer.add(this.add.text(0, curY + 10, 'No fish yet!', ts(18, '#8b6b4d')).setOrigin(0.5));
      curY += 40;
    } else {
      party.forEach((fish, fi) => {
        const fy = curY + fi * 52;
        const name = String(fish.nickname || fish.speciesId);
        const rowBg = this.add.rectangle(0, fy + 10, 540, 46, fi % 2 === 0 ? 0xe8dcc8 : 0xf0e8d8, 0.6);
        this.invContainer.add(rowBg);
        this.invContainer.add(this.add.text(-218, fy - 2, name.toUpperCase(), ts(18, '#2c1011')));
        this.invContainer.add(this.add.text(-218, fy + 18, `Lv ${fish.level}`, ts(14, '#6a5850')));
        const hpRatio = Math.max(0, fish.currentHp / fish.maxHp);
        const barW = 160, barX = 60;
        const hpColor = hpRatio > 0.5 ? 0x44cc44 : hpRatio > 0.25 ? 0xffcc00 : 0xff4444;
        this.invContainer.add(this.add.rectangle(barX + barW / 2, fy + 6, barW, 10, 0x555555));
        this.invContainer.add(this.add.rectangle(barX, fy + 6, Math.max(1, Math.floor(barW * hpRatio)), 10, hpColor).setOrigin(0, 0.5));
        this.invContainer.add(this.add.text(barX + barW + 6, fy, `${fish.currentHp}/${fish.maxHp}`, ts(14, '#2c1011')));
      });
      curY += party.length * 52 + 10;
    }
    curY = Math.max(curY, startY + 40);
    this.invContainer.add(this.add.text(-270, curY, 'ITEMS', ss()));
    this.invContainer.add(this.add.rectangle(0, curY + 18, 540, 2, 0x8b6b4d, 0.4));
    curY += 30;
    if (entries.length === 0) {
      this.invContainer.add(this.add.text(0, curY + 10, 'No items.', ts(18, '#8b6b4d')).setOrigin(0.5));
    } else {
      entries.forEach(([id, qty], i) => {
        const iy = curY + i * 32;
        this.invContainer.add(this.add.text(-218, iy, id.toUpperCase(), ts(18, '#2c1011')));
        this.invContainer.add(this.add.text(200, iy, `x${qty}`, ts(18, '#5a3a1a')).setOrigin(1, 0));
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSITIONS
  // ═══════════════════════════════════════════════════════════════════════════
  private goToBeach1() {
    if (this.sceneTransitioning) return;
    this.sceneTransitioning = true;
    this.player.setVelocity(0, 0);
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Beach', { from: 'right' });
    });
  }

  // Sailing removed from Beach 2 — now accessed from Beach 1 left edge

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════════════════════
  update(_time: number, delta: number) {
    if (!this.player) return;

    const spaceDown     = this.spaceKey.isDown;
    const spaceJustDown = (spaceDown && !this.spacePrev) || (this.mobileInput?.isActionJustDown() ?? false) || this.dlgTapped || this.fishTapped;
    this.dlgTapped = false;
    this.fishTapped = false;
    this.spacePrev = spaceDown;

    // I key — inventory
    if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
      this.toggleInventory();
      return;
    }
    if (this.invOpen) return;

    // Fishing overlay
    if (this.isFishing) {
      this.mobileInput?.showContextButtons('fishing');
      this.tickFishing(delta, spaceJustDown);
      return;
    }

    // ESC closes dialogue
    if (this.dlgOpen && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.dlgQueue = [];
      this.dlgOpen = false;
      this.dlgContainer.setVisible(false);
      this.mobileInput?.showContextButtons('overworld');
      return;
    }

    // Dialogue
    if (this.dlgOpen) {
      this.mobileInput?.showContextButtons('dialogue');
      this.tickDialogue(delta, spaceJustDown);
      return;
    }

    this.mobileInput?.showContextButtons('overworld');

    this.handleMovement(delta);
    this.checkSpaceActions(spaceJustDown);
    this.depthSort();

    // Left edge → Beach 1
    if (!this.sceneTransitioning && this.player.x <= WALK_MIN_X + 10) {
      this.goToBeach1();
    }

  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOVEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  private handleMovement(delta: number) {
    const speed = 150;
    const joy = this.mobileInput?.getMovementVector() ?? { x: 0, y: 0 };
    let vx = joy.x * speed;
    let vy = joy.y * speed;
    const L = this.cursors.left?.isDown  || this.wasd.A.isDown;
    const R = this.cursors.right?.isDown || this.wasd.D.isDown;
    const U = this.cursors.up?.isDown    || this.wasd.W.isDown;
    const D = this.cursors.down?.isDown  || this.wasd.S.isDown;

    if (L) vx = -speed; else if (R) vx = speed;
    if (U) vy = -speed; else if (D) vy = speed;

    if (vx !== 0 || vy !== 0) {
      if      (vx < 0 && vy < 0) this.currentDir = 'north-west';
      else if (vx > 0 && vy < 0) this.currentDir = 'north-east';
      else if (vx < 0 && vy > 0) this.currentDir = 'south-west';
      else if (vx > 0 && vy > 0) this.currentDir = 'south-east';
      else if (vx < 0)           this.currentDir = 'west';
      else if (vx > 0)           this.currentDir = 'east';
      else if (vy < 0)           this.currentDir = 'north';
      else                       this.currentDir = 'south';
    }

    this.player.setVelocity(vx, vy);

    // Clamp Y: use feet position (player.y + 16) for boundary checks
    const feetY = this.player.y + 16;
    const onDock = this.player.x >= DOCK_LEFT && this.player.x <= DOCK_RIGHT;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    if (onDock) {
      // On dock — clamp to dock bottom
      const dockBottom = 688;
      if (feetY > dockBottom) {
        this.player.y = dockBottom - 16;
        body.velocity.y = 0;
      }
      if (feetY < DOCK_TOP) {
        this.player.y = DOCK_TOP - 16;
        body.velocity.y = 0;
      }
    } else {
      // Off dock — stop at sand bottom edge
      if (feetY > WALK_MAX_Y) {
        this.player.y = WALK_MAX_Y - 16;
        body.velocity.y = 0;
      }
    }

    // Funnel player onto dock if past sand edge
    if (feetY > WALK_MAX_Y) {
      if (this.player.x < DOCK_LEFT) { this.player.x = DOCK_LEFT; body.velocity.x = 0; }
      if (this.player.x > DOCK_RIGHT) { this.player.x = DOCK_RIGHT; body.velocity.x = 0; }
    }

    this.tickAnim(vx !== 0 || vy !== 0, delta);
    this.shadow.setPosition(this.player.x, this.player.y + 16);
  }

  private tickAnim(moving: boolean, delta: number) {
    this.animTimer += delta;
    const dur = moving ? 100 : 160;
    if (this.animTimer >= dur) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
    if (moving) {
      this.player.setTexture(`pirate-run-${this.currentDir}-${this.animFrame}`);
    } else {
      const dir = this.currentDir === 'north' ? 'south' : this.currentDir;
      this.player.setTexture(`pirate-idle-${dir}-${this.animFrame}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SPACE ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  private checkSpaceActions(spaceJustDown: boolean) {
    if (!spaceJustDown) return;
    const py = this.player.y;

    // Fishing — only from the dock
    const px = this.player.x;
    if (px >= DOCK_LEFT && px <= DOCK_RIGHT && py >= DOCK_SAND_Y - 16) {
      this.startFishing();
      return;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPTH SORT
  // ═══════════════════════════════════════════════════════════════════════════
  private depthSort() {
    const d = 4 + this.player.y * 0.001;
    this.player.setDepth(d);
    this.shadow.setDepth(d - 0.1);
  }

  // ── Resume from Battle ─────────────────────────────────────────────────
  private onResume() {
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }
}
