import { FishInstance } from '../data/fish-db';
import { FISH_SPRITE_DB, FishSpriteData } from '../data/fish-sprite-db';
import { FISHING_ZONES, rollFishFromZone } from '../data/fishing-zones';
import MobileInput from '../systems/MobileInput';

// ── Layout constants ─────────────────────────────────────────────────────────
const W = 1280;
const H = 720;
const SAND_TOP    = 300;
const WATER_TOP   = 510;
const WALK_MIN_X  = 70;
const WALK_MAX_X  = 1210;
const WALK_MIN_Y  = SAND_TOP + 30;   // 330
const WALK_MAX_Y  = WATER_TOP + 40;  // 550

// Dock walkable zone (right side — extends into water)
const DOCK_LEFT   = 920;
const DOCK_RIGHT  = 1160;
const DOCK_TOP    = WATER_TOP - 60;  // 450
const DOCK_SAND_Y = WATER_TOP - 20;  // 490 — sand limit outside dock

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
  private sailTransitioning = false;
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
    this.sailTransitioning = false;
    this.sceneTransitioning = false;

    // ── Background ──────────────────────────────────────────────────────
    this.add.image(W / 2, H / 2, 'bg-beach2').setDisplaySize(W, H).setDepth(0);

    // ── Surf edge highlight ──────────────────────────────────────────────
    this.add.rectangle(W / 2, WATER_TOP,     W, 3, 0xffffff, 0.5).setDepth(1);
    this.add.rectangle(W / 2, WATER_TOP + 7, W, 2, 0xffffff, 0.25).setDepth(1);

    // ── Animated wave bands ──────────────────────────────────────────────
    this.createWaves();

    // ── Dock scenery (procedural on top of bg) ──────────────────────────
    this.drawDockScenery();

    // ── Transition hints ─────────────────────────────────────────────────
    this.add.text(WALK_MIN_X + 10, (WALK_MIN_Y + WALK_MAX_Y) / 2, '\u2190 BEACH', {
      fontFamily: 'PokemonDP, monospace', fontSize: '14px',
      color: '#f0e8d8', stroke: '#2c1011', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4);

    this.add.text(DOCK_RIGHT - 20, DOCK_TOP + 10, 'SET SAIL \u2192', {
      fontFamily: 'PokemonDP, monospace', fontSize: '16px',
      color: '#f0e8d8', stroke: '#2c1011', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4);

    // ── Player ──────────────────────────────────────────────────────────
    const spawnX = data?.from === 'left' ? WALK_MIN_X + 40 : W / 2;
    const spawnY = (WALK_MIN_Y + DOCK_SAND_Y) / 2;
    this.player = this.physics.add.sprite(spawnX, spawnY, 'pirate-idle-south-0');
    this.player.setDisplaySize(64, 64);
    this.player.setDepth(5);
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(WALK_MIN_X, WALK_MIN_Y, WALK_MAX_X - WALK_MIN_X, WALK_MAX_Y - WALK_MIN_Y);

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
    const configs: { color: number; alpha: number; h: number; speed: number; delay: number }[] = [
      { color: 0x3dc4ce, alpha: 0.35, h: 5, speed: 22,  delay: 0   },
      { color: 0xffffff, alpha: 0.18, h: 3, speed: -16, delay: 200 },
      { color: 0x2dafb8, alpha: 0.25, h: 3, speed: 28,  delay: 400 },
      { color: 0x3dc4ce, alpha: 0.30, h: 4, speed: -20, delay: 150 },
    ];
    configs.forEach((c, i) => {
      const y = WATER_TOP + 15 + i * 22;
      const rect = this.add.rectangle(W / 2, y, W, c.h, c.color, c.alpha).setDepth(1);
      this.waveRects.push({ rect, speed: c.speed });
      this.tweens.add({
        targets: rect,
        x:     { from: W / 2 - 18, to: W / 2 + 18 },
        alpha: { from: c.alpha * 0.4, to: c.alpha },
        duration: 1100 + i * 280,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: c.delay,
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCK SCENERY
  // ═══════════════════════════════════════════════════════════════════════════
  private drawDockScenery() {
    // Dock planks (procedural, over the bg dock)
    if (this.textures.exists('env-dock')) {
      this.add.image(1040, WATER_TOP - 10, 'env-dock').setDisplaySize(240, 120).setDepth(3);
    }

    // Palm trees (reuse existing sprite)
    if (this.textures.exists('palm-tree')) {
      const palms = [
        this.add.image(860, SAND_TOP + 40, 'palm-tree').setDisplaySize(100, 175).setDepth(2).setAngle(8),
        this.add.image(960, SAND_TOP + 30, 'palm-tree').setDisplaySize(90, 160).setDepth(2).setAngle(-5),
      ];
      palms.forEach((palm, i) => {
        const base = palm.angle;
        this.tweens.add({
          targets: palm, angle: base + 3,
          duration: 2200 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 300,
        });
      });
    }

    // Scattered shells
    if (this.textures.exists('env-shell-1')) {
      this.add.image(200, DOCK_SAND_Y - 10, 'env-shell-1').setDisplaySize(16, 16).setDepth(2).setAngle(30);
      this.add.image(350, DOCK_SAND_Y + 5,  'env-shell-2').setDisplaySize(14, 14).setDepth(2).setAngle(-20);
      this.add.image(500, DOCK_SAND_Y - 5,  'env-shell-3').setDisplaySize(16, 20).setDepth(2).setAngle(15);
      this.add.image(680, DOCK_SAND_Y + 8,  'env-shell-1').setDisplaySize(12, 12).setDepth(2).setAngle(-35);
      this.add.image(780, DOCK_SAND_Y - 8,  'env-shell-2').setDisplaySize(18, 18).setDepth(2).setAngle(42);
    }

    // Crates near dock
    if (this.textures.exists('env-crate')) {
      this.add.image(900, DOCK_SAND_Y - 30, 'env-crate').setDisplaySize(30, 28).setDepth(4 + (DOCK_SAND_Y - 30) * 0.001);
      this.add.image(895, DOCK_SAND_Y - 55, 'env-crate').setDisplaySize(26, 24).setDepth(4 + (DOCK_SAND_Y - 30) * 0.001).setAngle(6);
    }

    // Rope coils near dock (procedural)
    this.add.ellipse(940, DOCK_SAND_Y - 10, 18, 12, 0x8b6b4d, 0.7).setDepth(2);
    this.add.ellipse(940, DOCK_SAND_Y - 10, 10, 6, 0xa08060, 0.5).setDepth(2);

    // Rock clusters
    this.drawRocks(300, DOCK_SAND_Y + 5);
    this.drawRocks(600, DOCK_SAND_Y + 10);
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
    const roll = rollFishFromZone(FISHING_ZONES.deep_water);
    this.hookedFish = FISH_SPRITE_DB.find(f => f.textureKey === roll.textureKey)
      ?? FISH_SPRITE_DB.filter(f => f.evolutionStage <= 2)[0];
    this.fishingRolledLevel = roll.level;
    this.fishingOverlay.setVisible(true);
    this.fishingText.setText('CASTING...');
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

  private sailToSea() {
    if (this.sailTransitioning) return;
    this.sailTransitioning = true;
    this.player.setVelocity(0, 0);
    this.openDialogue(['Setting sail...']);
    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.sailTransitioning = false;
        this.scene.start('Sailing', { shipId: 1 });
      });
    });
  }

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

    // Dock end → sail to sea
    if (!this.sailTransitioning && this.player.x >= DOCK_RIGHT - 10 && this.player.y >= DOCK_TOP) {
      this.sailToSea();
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
      // On dock — can walk into water
      if (feetY > WALK_MAX_Y) {
        this.player.y = WALK_MAX_Y - 16;
        body.velocity.y = 0;
      }
    } else {
      // Off dock — stop at sand edge
      if (feetY > DOCK_SAND_Y) {
        this.player.y = DOCK_SAND_Y - 16;
        body.velocity.y = 0;
      }
    }

    // Funnel player onto dock if past shoreline
    if (feetY > DOCK_SAND_Y) {
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
