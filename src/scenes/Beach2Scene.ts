import { BEACH_ENEMIES, BeachEnemyDef, rollBeach2Enemy } from '../data/beach-enemies';
import { FishInstance, FISH_SPECIES } from '../data/fish-db';
import { FISH_SPRITE_DB, FishSpriteData } from '../data/fish-sprite-db';
import { FISHING_ZONES, rollFishFromZone } from '../data/fishing-zones';
import MobileInput from '../systems/MobileInput';
import HUDManager from '../systems/HUDManager';
import { TMXMapData, TMXRect, computeBoundingRect, isInZone, findTransition } from '../systems/TMXLoader';

// ── Visual constants (wave drawing + scenery — NOT physics) ──────────────────
const W = 1280;
const H = 720;
const WATER_TOP   = 650;              // for wave drawing

interface Beach2Enemy {
  container: Phaser.GameObjects.Container;
  sprite?: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  minX: number;
  maxX: number;
  dir: 1 | -1;
  speed: number;
  defeated: boolean;
  animFrame: number;
  animTimer: number;
  enemyId: string;
  enemyName: string;
  spriteKey: string;
  level: number;
  hp: number;
  moves: string[];
  aggroRadius: number;
  patrolState?: 'angry' | 'moving';
  patrolClock?: number;
}

export default class Beach2Scene extends Phaser.Scene {
  // ── TMX map data (loaded from registry, set in create) ─────────────────
  private tmx!: TMXMapData;
  private walkBounds!: { x: number; y: number; width: number; height: number };
  private dockRect?: TMXRect;
  private colliderGroup!: Phaser.Physics.Arcade.StaticGroup;

  // ── Enemies ──────────────────────────────────────────────────────────────
  private enemies: Beach2Enemy[] = [];
  private battlePending = false;

  private ready = false;

  // ── Player ───────────────────────────────────────────────────────────────
  private player!: Phaser.Physics.Arcade.Sprite;
  private shadow: Phaser.GameObjects.Ellipse | undefined;
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
  private fishingPhase:    'castAnim' | 'cast' | 'wait' | 'bite' | 'reel' | 'done' = 'cast';
  private fishingTimer     = 0;
  private castAnimFrame    = 0;
  private castAnimTimer    = 0;
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

  // ── Team panel ──────────────────────────────────────────────────────────
  private teamContainer!: Phaser.GameObjects.Container;
  private teamOpen = false;
  private readonly TEAM_STATIC = 13;
  private tKey!: Phaser.Input.Keyboard.Key;

  // ── Uncle Barnaby NPC ───────────────────────────────────────────────────
  private uncleContainer!: Phaser.GameObjects.Container;
  private uncleSprite!: Phaser.GameObjects.Image;
  private uncleLabel!: Phaser.GameObjects.Text;
  private uncleAnimFrame = 0;
  private uncleAnimTimer = 0;
  private unclePaceTimer = 0;
  private unclePhase: 'idle' | 'stumbleE1' | 'stumbleW' | 'stumbleE2' | 'fling' = 'idle';
  private uncleTalked = false;
  private readonly uncleX = 400;
  private readonly uncleY = 440;

  // ── Mobile input ────────────────────────────────────────────────────────
  private mobileInput?: MobileInput;

  // ── Transition ──────────────────────────────────────────────────────────
  private sceneTransitioning = false;
  private transitionCooldown = true;

  // ── Waves ────────────────────────────────────────────────────────────────
  private waveRects: { rect: Phaser.GameObjects.Rectangle; speed: number }[] = [];

  constructor() {
    super({ key: 'Beach2' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════════════════════
  create(data?: { from?: string }) {
    this.ready = false;
    this.sceneTransitioning = false;
    this.enemies = [];
    this.battlePending = false;

    // ── TMX map data (from BootScene registry) ──────────────────────────
    this.tmx = this.registry.get('tmx-beach2') as TMXMapData;
    this.walkBounds = computeBoundingRect(this.tmx.walkable);
    this.dockRect = this.tmx.dock[0];

    // ── Background ──────────────────────────────────────────────────────
    this.add.image(W / 2, H / 2, 'bg-beach2').setDisplaySize(W, H).setDepth(0);

    // ── Animated water layers (spritesheet-matched style) ──────────────────
    this.createWaves();

    // ── Dock scenery (procedural on top of bg) ──────────────────────────
    this.drawDockScenery();

    // ── Colliders (from TMX object layer) ─────────────────────────────────
    this.colliderGroup = this.physics.add.staticGroup();
    for (const c of this.tmx.colliders) {
      const cx = c.x + c.width / 2;
      const cy = c.y + c.height / 2;
      const box = this.add.rectangle(cx, cy, c.width, c.height, 0x000000, 0) as unknown as Phaser.Physics.Arcade.Image;
      this.physics.add.existing(box, true);
      this.colliderGroup.add(box);
    }

    // ── Transition hints ─────────────────────────────────────────────────
    const wb = this.walkBounds;
    this.add.text(wb.x + 20, wb.y + wb.height / 2, '\u2190 BEACH', {
      fontFamily: 'PokemonDP, monospace', fontSize: '14px',
      color: '#f0e8d8', stroke: '#2c1011', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4);

    if (this.dockRect) {
      const dr = this.dockRect;
      this.add.text(dr.x + dr.width - 40, dr.y + 20, 'FISH \u25bc', {
        fontFamily: 'PokemonDP, monospace', fontSize: '14px',
        color: '#2dafb8', stroke: '#2c1011', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(4);
    }

    // ── Player ──────────────────────────────────────────────────────────
    // Spawn near the to-beach1 transition zone (left edge of map)
    const b1zone = findTransition('to-beach1', this.tmx.transitions);
    let spawnX: number, spawnY: number;
    if (b1zone) {
      spawnX = b1zone.x + b1zone.width / 2;
      spawnY = b1zone.y + b1zone.height / 2;
    } else {
      spawnX = wb.x + 40;
      spawnY = wb.y + wb.height / 2;
    }
    this.player = this.physics.add.sprite(spawnX, spawnY, 'pirate-idle-south-0');
    this.player.setDisplaySize(64, 64);
    this.player.setDepth(5);
    this.player.setCollideWorldBounds(true);
    // Clamp player to walkable bounding rect (prevents cliff stuck)
    this.physics.world.setBounds(wb.x, wb.y, wb.width, wb.height);
    this.physics.add.collider(this.player, this.colliderGroup);

    // ── Shadow ──────────────────────────────────────────────────────────
    this.shadow = this.add.ellipse(this.player.x, this.player.y + 16, 28, 7, 0x000000, 0.20);
    this.shadow.setDepth(4);

    // ── Dialogue box ─────────────────────────────────────────────────────
    this.createDialogueBox();

    // ── Fishing overlay ──────────────────────────────────────────────────
    this.createFishingOverlay();

    // ── Inventory panel ──────────────────────────────────────────────────
    this.createInventoryPanel();

    // ── Team panel ────────────────────────────────────────────────────────
    this.createTeamPanel();

    // ── HUD buttons (top-right) ──────────────────────────────────────────
    new HUDManager(this, {
      onInventory: () => this.toggleInventory(),
      onTeam: () => this.toggleTeamPanel(),
    });

    // ── Uncle Barnaby NPC ───────────────────────────────────────────────
    this.createUncleNPC();

    // ── Beach 2 enemies (Loot Jelly + Loot Hermit) ──────────────────────
    this.spawnEnemies();

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
    this.tKey     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);
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

    // ── Shutdown handler ────────────────────────────────────────────────
    this.events.on('shutdown', () => {
      this.ready = false;
      this.tweens.killAll();
      this.time.removeAllEvents();
      this.mobileInput?.destroy();
      this.mobileInput = undefined;
      this.enemies = [];
      this.battlePending = false;
    });

    this.ready = true;
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
    const walkTop = this.walkBounds.y;
    const sandBottom = this.walkBounds.y + this.walkBounds.height;

    // Palm trees — on sand, left of dock
    if (this.textures.exists('palm-tree')) {
      const palms = [
        this.add.image(500, walkTop - 10, 'palm-tree').setDisplaySize(117, 175).setDepth(2).setAngle(8),
        this.add.image(650, walkTop - 20, 'palm-tree').setDisplaySize(107, 160).setDepth(2).setAngle(-5),
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
    const sandMidY = (walkTop + sandBottom) / 2;
    if (this.textures.exists('env-shell-1')) {
      this.add.image(200, sandMidY + 30, 'env-shell-1').setDisplaySize(16, 16).setDepth(2).setAngle(30);
      this.add.image(350, sandMidY + 40, 'env-shell-2').setDisplaySize(14, 14).setDepth(2).setAngle(-20);
      this.add.image(500, sandMidY + 20, 'env-shell-3').setDisplaySize(14, 20).setDepth(2).setAngle(15);
      this.add.image(650, sandMidY + 35, 'env-shell-1').setDisplaySize(12, 12).setDepth(2).setAngle(-35);
    }

    // Crates near dock — sitting on sand at dock entrance
    if (this.textures.exists('env-crate')) {
      this.add.image(770, sandBottom - 20, 'env-crate').setDisplaySize(30, 28).setDepth(4 + sandBottom * 0.001);
      this.add.image(765, sandBottom - 45, 'env-crate').setDisplaySize(26, 24).setDepth(4 + sandBottom * 0.001).setAngle(6);
    }

    // Rope coils near crates
    this.add.ellipse(800, sandBottom - 5, 18, 12, 0x8b6b4d, 0.7).setDepth(2);
    this.add.ellipse(800, sandBottom - 5, 10, 6, 0xa08060, 0.5).setDepth(2);

    // Rock clusters on sand
    this.drawRocks(300, sandBottom - 10);
    this.drawRocks(550, sandBottom - 5);
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
    this.player.setVelocity(0, 0);

    const roll = rollFishFromZone(FISHING_ZONES.deep_water);
    this.hookedFish = FISH_SPRITE_DB.find(f => f.textureKey === roll.textureKey)
      ?? FISH_SPRITE_DB.filter(f => f.evolutionStage <= 2)[0];
    this.fishingRolledLevel = roll.level;
    this.fishingBiteTime = 1500 + Math.random() * 2000;

    // Start with the cast animation on the player sprite
    this.fishingPhase = 'castAnim';
    this.castAnimFrame = 0;
    this.castAnimTimer = 0;
    this.fishingTimer = 0;

    const castDir = this.getCastDirection();
    this.player.setTexture(`pirate-cast-${castDir}-0`);
    this.player.setDisplaySize(64, 64);
    this.sound.play('sfx-cast', { volume: 0.5 });
  }

  /** Map current 8-way direction to nearest cast direction (north/east/south/west) */
  private getCastDirection(): string {
    const dir = this.currentDir;
    if (dir.includes('east')) return 'east';
    if (dir.includes('west')) return 'west';
    if (dir === 'north') return 'north';
    return 'south';
  }

  private tickFishing(delta: number, spaceJustDown: boolean) {
    this.fishingTimer += delta;

    // ── Cast animation phase — play 16-frame rod cast on player sprite ──
    if (this.fishingPhase === 'castAnim') {
      this.castAnimTimer += delta;
      if (this.castAnimTimer >= 80) {
        this.castAnimTimer = 0;
        this.castAnimFrame++;
      }
      if (this.castAnimFrame < 16) {
        const castDir = this.getCastDirection();
        const key = `pirate-cast-${castDir}-${this.castAnimFrame}`;
        if (this.textures.exists(key)) this.player.setTexture(key);
      } else {
        // Cast animation done → show fishing overlay
        this.fishingPhase = 'cast';
        this.fishingTimer = 0;
        this.fishingOverlay.setVisible(true);
        this.fishingText.setText('CASTING...');
        this.fishingMarker.setVisible(false);
        this.fishingZone.setVisible(false);
      }
      return;
    }

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
  // TEAM PANEL
  // ═══════════════════════════════════════════════════════════════════════════
  private createTeamPanel() {
    this.teamContainer = this.add.container(W / 2, H / 2).setDepth(25);
    const pw = 620, ph = 480, hh = 48;
    const ov = this.add.rectangle(0, 0, W, H, 0x000000, 0.55);
    const of_ = this.add.rectangle(0, 0, pw + 8, ph + 8, 0x5a3a1a);
    const if_ = this.add.rectangle(0, 0, pw + 2, ph + 2, 0x8b6b4d);
    const bg  = this.add.rectangle(0, 0, pw, ph, 0xf0e8d8);
    const hd = this.add.rectangle(0, -ph / 2 + hh / 2, pw, hh, 0x8b6b4d);
    const hl = this.add.rectangle(0, -ph / 2 + hh, pw - 8, 2, 0x5a3a1a);
    const ti = this.add.text(0, -ph / 2 + hh / 2, 'YOUR CREW', {
      fontFamily: 'PixelPirate, monospace', fontSize: '30px',
      color: '#ffe066', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);
    const fb = this.add.rectangle(0, ph / 2 - 18, pw, 36, 0x8b6b4d, 0.4);
    const ht = this.add.text(0, ph / 2 - 18, '[T] CLOSE', {
      fontFamily: 'PokemonDP, monospace', fontSize: '18px',
      color: '#5a3a1a', stroke: '#f0e8d8', strokeThickness: 2,
    }).setOrigin(0.5);
    const rr = 5, rc = 0x5a3a1a, rx = pw / 2 - 12, ry = ph / 2 - 12;
    this.teamContainer.add([
      ov, of_, if_, bg, hd, hl, ti, fb, ht,
      this.add.circle(-rx, -ry, rr, rc), this.add.circle(rx, -ry, rr, rc),
      this.add.circle(-rx, ry, rr, rc),  this.add.circle(rx, ry, rr, rc),
    ]);
    this.teamContainer.setVisible(false);
  }

  private toggleTeamPanel() {
    this.teamOpen = !this.teamOpen;
    this.teamContainer.setVisible(this.teamOpen);
    if (this.teamOpen) {
      this.player.setVelocity(0, 0);
      this.refreshTeamUI();
    }
  }

  private refreshTeamUI() {
    while (this.teamContainer.length > this.TEAM_STATIC) {
      this.teamContainer.removeAt(this.TEAM_STATIC, true);
    }
    const party = (this.registry.get('party') as FishInstance[]) || [];
    const startY = -160;
    let curY = startY;
    const ts = (size: number, color: string) => ({ fontFamily: 'PokemonDP, monospace', fontSize: `${size}px`, color });

    if (party.length === 0) {
      this.teamContainer.add(this.add.text(0, curY + 10, 'No fish yet!', ts(18, '#8b6b4d')).setOrigin(0.5));
      return;
    }

    party.forEach((fish: FishInstance, fi: number) => {
      const fy = curY + fi * 72;
      const name = String(fish.nickname || fish.speciesId);
      const rowBg = this.add.rectangle(0, fy + 16, 540, 62, fi % 2 === 0 ? 0xe8dcc8 : 0xf0e8d8, 0.6);
      this.teamContainer.add(rowBg);

      // Fish sprite thumbnail
      const sid = fish.speciesId;
      const species = FISH_SPECIES.find(s => s.id === sid || s.id === Number(sid));
      let texKey: string | undefined;
      if (typeof sid === 'string' && sid.startsWith('fish-')) {
        texKey = sid;
      } else if (species?.spriteGrid && species?.spriteIndex !== undefined) {
        texKey = `fish-${species.spriteGrid}-${String(species.spriteIndex).padStart(2, '0')}`;
      }
      if (texKey && this.textures.exists(texKey)) {
        this.teamContainer.add(this.add.image(-246, fy + 16, texKey).setDisplaySize(48, 42));
      } else {
        this.teamContainer.add(this.add.circle(-246, fy + 16, 20, 0x8b6b4d, 0.5));
      }

      this.teamContainer.add(this.add.text(-210, fy, `${name.toUpperCase()}`, ts(20, '#2c1011')));
      this.teamContainer.add(this.add.text(-210, fy + 22, `Lv ${fish.level}`, ts(14, '#6a5850')));

      // Type
      const typeName = species?.type ?? '???';
      this.teamContainer.add(this.add.text(200, fy, typeName.toUpperCase(), ts(14, '#5a3a1a')).setOrigin(1, 0));

      // HP bar
      const hpRatio = Math.max(0, fish.currentHp / fish.maxHp);
      const barW = 200, barH = 12, barX = 20;
      const hpColor = hpRatio > 0.5 ? 0x44cc44 : hpRatio > 0.25 ? 0xffcc00 : 0xff4444;
      this.teamContainer.add(this.add.rectangle(barX + barW / 2, fy + 30, barW, barH, 0x555555));
      this.teamContainer.add(this.add.rectangle(barX, fy + 30, Math.max(1, Math.floor(barW * hpRatio)), barH, hpColor).setOrigin(0, 0.5));
      this.teamContainer.add(this.add.text(barX - 26, fy + 24, 'HP', ts(12, '#5a3a1a')));
      this.teamContainer.add(this.add.text(barX + barW + 6, fy + 24, `${fish.currentHp}/${fish.maxHp}`, ts(14, '#2c1011')));
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UNCLE BARNABY NPC (stationary, teaches crafting)
  // ═══════════════════════════════════════════════════════════════════════════
  private createUncleNPC() {
    this.uncleContainer = this.add.container(this.uncleX, this.uncleY).setDepth(4 + this.uncleY * 0.001);

    // Shadow
    const shadow = this.add.ellipse(0, 26, 28, 7, 0x000000, 0.20);

    // Fisherman sprite (displayed at 64×64)
    const texKey = 'fisherman-idle-south-0';
    if (this.textures.exists(texKey)) {
      this.uncleSprite = this.add.image(0, 0, texKey).setDisplaySize(64, 64);
    } else {
      this.uncleSprite = this.add.image(0, 0, '__DEFAULT') as any;
      const fallback = this.add.ellipse(0, 0, 28, 36, 0x6b8e23).setStrokeStyle(1, 0x000000);
      this.uncleContainer.add(fallback);
    }

    this.uncleContainer.add([shadow, this.uncleSprite]);

    // Name label
    this.uncleLabel = this.add.text(this.uncleX, this.uncleY - 42, 'Uncle Barnaby', {
      fontFamily: 'PokemonDP, monospace', fontSize: '14px',
      color: '#f0e8d8', stroke: '#2c1011', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);
  }

  /** Drunk stumble patrol cycle:
   *  idle 2s → stumble east 2s → stumble west 1s → stumble east 2s → fling 1.5s → repeat */
  private tickUncleNPC(delta: number) {
    if (!this.uncleSprite || !this.uncleContainer) return;

    this.unclePaceTimer += delta;
    this.uncleAnimTimer += delta;

    // Total cycle: 8500ms
    const cycle = this.unclePaceTimer % 8500;
    if (cycle < 2000)       this.unclePhase = 'idle';
    else if (cycle < 4000)  this.unclePhase = 'stumbleE1';
    else if (cycle < 5000)  this.unclePhase = 'stumbleW';
    else if (cycle < 7000)  this.unclePhase = 'stumbleE2';
    else                    this.unclePhase = 'fling';

    const frameDur = this.unclePhase === 'idle' ? 160 : 100;
    if (this.uncleAnimTimer >= frameDur) {
      this.uncleAnimTimer = 0;
      this.uncleAnimFrame++;
    }

    let key: string;
    switch (this.unclePhase) {
      case 'idle':
        this.uncleAnimFrame = this.uncleAnimFrame % 4;
        key = `fisherman-idle-south-${this.uncleAnimFrame}`;
        if (this.textures.exists(key)) this.uncleSprite.setTexture(key);
        this.uncleSprite.setFlipX(false);
        break;
      case 'stumbleE1':
      case 'stumbleE2':
        this.uncleAnimFrame = this.uncleAnimFrame % 16;
        key = `fisherman-stumble-east-${this.uncleAnimFrame}`;
        if (this.textures.exists(key)) this.uncleSprite.setTexture(key);
        this.uncleSprite.setFlipX(false);
        this.uncleContainer.x += 0.35;
        break;
      case 'stumbleW':
        this.uncleAnimFrame = this.uncleAnimFrame % 16;
        key = `fisherman-stumble-west-${this.uncleAnimFrame}`;
        if (this.textures.exists(key)) this.uncleSprite.setTexture(key);
        this.uncleSprite.setFlipX(false);
        this.uncleContainer.x -= 0.35;
        break;
      case 'fling':
        this.uncleAnimFrame = this.uncleAnimFrame % 4;
        key = `fisherman-stumble-east-${12 + this.uncleAnimFrame}`;
        if (this.textures.exists(key)) this.uncleSprite.setTexture(key);
        this.uncleSprite.setFlipX(false);
        break;
    }

    // Keep label tracking above NPC
    this.uncleLabel.setPosition(this.uncleContainer.x, this.uncleContainer.y - 42);
    // Depth sort
    this.uncleContainer.setDepth(4 + this.uncleContainer.y * 0.001);
  }

  private talkToUncle() {
    const inventory = (this.registry.get('inventory') as Record<string, number>) || {};
    const hasWood = (inventory['wood'] ?? 0) >= 3;
    const hasRope = (inventory['rope'] ?? 0) >= 1;
    const hasBait = (inventory['bait'] ?? 0) >= 1;
    const hasRod = (inventory['fishing_rod'] ?? 0) >= 1;

    if (!this.uncleTalked) {
      this.uncleTalked = true;
      if (hasRod) {
        this.openDialogue([
          "*hic* ...oh! You've already got a rod!",
          "Smart one, aren't ya? Go catch somethin' big!",
        ]);
      } else if (hasWood && hasRope) {
        this.openDialogue([
          "*hic* ...oh! You again!",
          "I'm your Uncle Barnaby! ...twice removed.",
          "Listen... I can teach ya to CRAFT things.",
          "You've got the wood and rope... perfect!",
          "I'll make you a FISHING ROD right now!",
        ]);
        // Craft the rod
        inventory['wood'] = (inventory['wood'] ?? 0) - 3;
        if (inventory['wood'] <= 0) delete inventory['wood'];
        inventory['rope'] = (inventory['rope'] ?? 0) - 1;
        if (inventory['rope'] <= 0) delete inventory['rope'];
        inventory['fishing_rod'] = (inventory['fishing_rod'] ?? 0) + 1;
        this.registry.set('inventory', inventory);
      } else {
        const need: string[] = [];
        if (!hasWood) need.push('3 wood');
        if (!hasRope) need.push('1 rope');
        this.openDialogue([
          "*hic* ...oh! A visitor!",
          "I'm your Uncle Barnaby! ...twice removed.",
          "I can teach ya to CRAFT things!",
          `Bring me ${need.join(' and ')} and I'll make ya a fishing rod.`,
          "You can find wood and rope on the beach back east.",
        ]);
      }
    } else {
      // Repeat visits
      if (hasRod) {
        this.openDialogue(["*sways* ...go catch fish, ya landlubber! *hic*"]);
      } else if (hasWood && hasRope) {
        this.openDialogue([
          "You brought the materials! Let me work me magic...",
          "There! One FISHING ROD, freshly crafted!",
        ]);
        inventory['wood'] = (inventory['wood'] ?? 0) - 3;
        if (inventory['wood'] <= 0) delete inventory['wood'];
        inventory['rope'] = (inventory['rope'] ?? 0) - 1;
        if (inventory['rope'] <= 0) delete inventory['rope'];
        inventory['fishing_rod'] = (inventory['fishing_rod'] ?? 0) + 1;
        this.registry.set('inventory', inventory);
      } else {
        const need: string[] = [];
        if (!hasWood) need.push('3 wood');
        if (!hasRope) need.push('1 rope');
        this.openDialogue([
          `*hic* ...still need ${need.join(' and ')} for that rod!`,
          "Check the beach back east. Items respawn!",
        ]);
      }
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
    if (!this.ready || !this.player) return;

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
    if (this.invOpen) {
      if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) this.toggleInventory();
      return;
    }

    // T key — team panel
    if (Phaser.Input.Keyboard.JustDown(this.tKey)) {
      this.toggleTeamPanel();
      return;
    }
    if (this.teamOpen) {
      if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) this.toggleTeamPanel();
      return;
    }

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

    // ESC opens pause menu when nothing else is open
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.scene.pause('Beach2');
      this.scene.launch('PauseMenu', { callingScene: 'Beach2' });
      return;
    }

    this.handleMovement(delta);
    this.updateEnemies(delta);
    this.tickUncleNPC(delta);
    this.checkEnemyCollisions();
    this.checkSpaceActions(spaceJustDown);
    this.depthSort();

    // Left edge → Beach 1 (with cooldown to prevent spawn-inside-zone loop)
    const b1zone = findTransition('to-beach1', this.tmx.transitions);
    const inB1 = b1zone && this.player.x >= b1zone.x && this.player.x <= b1zone.x + b1zone.width &&
                 this.player.y >= b1zone.y && this.player.y <= b1zone.y + b1zone.height;
    if (this.transitionCooldown && !inB1) {
      this.transitionCooldown = false;
    }
    if (!this.transitionCooldown && !this.sceneTransitioning && inB1) {
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
    // TMX colliders handle most blocking; this handles dock-specific clamping
    const feetY = this.player.y + 16;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const sandBottom = this.walkBounds.y + this.walkBounds.height;

    if (this.dockRect) {
      const dLeft = this.dockRect.x;
      const dRight = this.dockRect.x + this.dockRect.width;
      const dTop = this.dockRect.y;
      const dBottom = this.dockRect.y + this.dockRect.height;
      const onDock = this.player.x >= dLeft && this.player.x <= dRight;

      if (onDock) {
        if (feetY > dBottom) { this.player.y = dBottom - 16; body.velocity.y = 0; }
        if (feetY < dTop)    { this.player.y = dTop - 16;    body.velocity.y = 0; }
      } else if (feetY > sandBottom) {
        this.player.y = sandBottom - 16;
        body.velocity.y = 0;
      }

      // Funnel player onto dock if past sand edge
      if (feetY > sandBottom) {
        if (this.player.x < dLeft)  { this.player.x = dLeft;  body.velocity.x = 0; }
        if (this.player.x > dRight) { this.player.x = dRight; body.velocity.x = 0; }
      }
    } else {
      // No dock — just clamp to sand
      if (feetY > sandBottom) {
        this.player.y = sandBottom - 16;
        body.velocity.y = 0;
      }
    }

    this.tickAnim(vx !== 0 || vy !== 0, delta);
    this.shadow?.setPosition(this.player.x, this.player.y + 16);
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
    if (!spaceJustDown || !this.player) return;
    if (this.isFishing) return;

    // Uncle Barnaby interaction (use container position since he stumbles around)
    const px = this.player.x;
    const py = this.player.y;
    if (!this.uncleContainer) return;
    const uncleDist = Math.hypot(this.uncleContainer.x - px, this.uncleContainer.y - py);
    if (uncleDist < 70) {
      this.talkToUncle();
      return;
    }

    // Use +32 (bottom of 64px displayed sprite) for generous fishing zone overlap
    const feetY = this.player.y + 32;
    if (isInZone(px, feetY, this.tmx.fishing)) {
      this.startFishing();
      return;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENEMIES
  // ═══════════════════════════════════════════════════════════════════════════
  private spawnEnemies() {
    // Only spawn if player has a starter
    const party = this.registry.get('party') as FishInstance[] | undefined;
    if (!party || party.length === 0) return;

    // Beach 2 spawns: Loot Jelly + Loot Hermit (tougher than Beach 1)
    // Positions chosen in mid-right walkable area, away from Uncle Barnaby (400,440)
    const spawns = [
      { x: 600, y: 420, minX: 500, maxX: 740, enemy: rollBeach2Enemy() },
      { x: 760, y: 480, minX: 650, maxX: 860, enemy: rollBeach2Enemy() },
    ];

    spawns.forEach(pos => {
      const def = pos.enemy;
      const container = this.add.container(pos.x, pos.y).setDepth(4);
      let sprite: Phaser.GameObjects.Sprite | undefined;

      const texKey = `${def.spriteKey}-east`;
      if (this.textures.exists(texKey)) {
        sprite = this.add.sprite(0, 0, texKey);
        sprite.setScale(def.spriteScale);
        container.add([sprite]);
      } else {
        // Procedural fallback — colored ellipse with eyes
        const body = this.add.ellipse(0, 0, 28, 20, def.fallbackColor);
        body.setStrokeStyle(1, 0x000000);
        const eye1 = this.add.circle(-6, -6, 3, 0x111111);
        const eye2 = this.add.circle( 6, -6, 3, 0x111111);
        container.add([body, eye1, eye2]);
      }

      // Name label
      const labelY = sprite ? -(sprite.height * def.spriteScale * 0.5 + 8) : -22;
      const label = this.add.text(0, labelY, def.name, {
        fontFamily: 'PokemonDP, monospace',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
      container.add([label]);

      const speed = def.spriteKey === 'jelly' ? 30 + Math.random() * 12
                  : def.spriteKey === 'hermit' ? 40 + Math.random() * 15
                  : 20 + Math.random() * 18;
      this.enemies.push({
        container, sprite,
        x: pos.x, y: pos.y,
        minX: pos.minX, maxX: pos.maxX,
        dir: 1,
        speed,
        defeated: false,
        animFrame: 0,
        animTimer: 0,
        enemyId: def.id,
        enemyName: def.name,
        spriteKey: def.spriteKey,
        level: def.level,
        hp: def.hp,
        moves: [...def.moves],
        aggroRadius: def.aggroRadius,
        ...(def.spriteKey === 'hermit' ? { patrolState: 'angry' as const, patrolClock: 1500 + Math.random() * 1000 } : {}),
      });
    });
  }

  private updateEnemies(delta: number) {
    for (const e of this.enemies) {
      if (e.defeated) continue;

      // Hermit: angry-then-move patrol cycle
      if (e.spriteKey === 'hermit' && e.patrolState !== undefined) {
        e.patrolClock = (e.patrolClock ?? 0) - delta;
        if (e.patrolClock <= 0) {
          if (e.patrolState === 'angry') {
            e.patrolState = 'moving';
            e.patrolClock = 800 + Math.random() * 600;
            e.dir = Math.random() < 0.5 ? 1 : -1;
            e.animFrame = 0;
          } else {
            e.patrolState = 'angry';
            e.patrolClock = 1500 + Math.random() * 1000;
            e.animFrame = 0;
          }
        }
        if (e.patrolState === 'moving') {
          e.x += e.dir * e.speed * (delta / 1000);
          if (e.x >= e.maxX) { e.x = e.maxX; e.dir = -1; }
          if (e.x <= e.minX) { e.x = e.minX; e.dir =  1; }
        }
        e.container.setPosition(e.x, e.y);
        if (e.sprite) {
          e.animTimer += delta;
          if (e.patrolState === 'angry') {
            if (e.animTimer >= 130) {
              e.animTimer = 0;
              e.animFrame = (e.animFrame + 1) % 7;
            }
            const tex = `hermit-angry-${e.animFrame}`;
            if (this.textures.exists(tex)) e.sprite.setTexture(tex);
          } else {
            const dirKey = e.dir > 0 ? 'east' : 'west';
            if (e.animTimer >= 100) {
              e.animTimer = 0;
              e.animFrame = (e.animFrame + 1) % 8;
            }
            const tex = `hermit-walk-${dirKey}-${e.animFrame}`;
            if (this.textures.exists(tex)) e.sprite.setTexture(tex);
          }
          e.sprite.setFlipX(false);
          e.container.setScale(1, 1);
        }
        continue;
      }

      // Jelly + others: constant movement
      e.x += e.dir * e.speed * (delta / 1000);
      if (e.x >= e.maxX) { e.x = e.maxX; e.dir = -1; }
      if (e.x <= e.minX) { e.x = e.minX; e.dir =  1; }
      e.container.setPosition(e.x, e.y);

      if (e.sprite) {
        const dirKey = e.dir > 0 ? 'east' : 'west';

        if (e.spriteKey === 'jelly') {
          e.animTimer += delta;
          if (e.animTimer >= 80) {
            e.animTimer = 0;
            e.animFrame = (e.animFrame + 1) % 6;
          }
          const pounceTex = `jelly-walk-${dirKey}-${e.animFrame}`;
          if (this.textures.exists(pounceTex)) e.sprite.setTexture(pounceTex);
        } else {
          const texKey = `${e.spriteKey}-${dirKey}`;
          if (this.textures.exists(texKey)) e.sprite.setTexture(texKey);
        }
        e.sprite.setFlipX(false);
        e.container.setScale(1, 1);
      } else {
        e.container.setScale(e.dir < 0 ? -1 : 1, 1);
      }
    }
  }

  private checkEnemyCollisions() {
    if (this.battlePending) return;
    if (!this.player || !this.enemies) return;
    const px = this.player.x, py = this.player.y;
    for (const e of this.enemies) {
      if (e.defeated) continue;
      const dist = Math.hypot(e.x - px, e.y - py);
      if (dist < e.aggroRadius) {
        this.triggerBattle(e);
        return;
      }
    }
  }

  private triggerBattle(enemy: Beach2Enemy) {
    this.battlePending = true;
    enemy.defeated = true;
    enemy.container.setVisible(false);

    const enemyFish: FishInstance = {
      uid:       `${enemy.enemyId}_${Date.now()}`,
      speciesId:  0,
      nickname:   enemy.enemyName,
      level:      enemy.level,
      xp:         0,
      currentHp:  enemy.hp,
      maxHp:      enemy.hp,
      moves:      enemy.moves,
      iv:         { hp: 5, attack: 5, defense: 5, speed: 5 },
    };

    this.sound.play('sfx-battle-intro', { volume: 0.4 });
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.launch('Battle', {
        enemyName:   enemy.enemyName,
        enemyParty:  [enemyFish],
        returnScene: 'Beach2',
        enemySpriteKey: enemy.spriteKey,
      });
      this.scene.pause();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPTH SORT
  // ═══════════════════════════════════════════════════════════════════════════
  private depthSort() {
    if (!this.player) return;
    const d = 4 + this.player.y * 0.001;
    this.player.setDepth(d);
    this.shadow?.setDepth(d - 0.1);
    for (const e of this.enemies) {
      if (e.defeated) continue;
      e.container.setDepth(4 + e.y * 0.001);
    }
  }

  // ── Resume from Battle ─────────────────────────────────────────────────
  private onResume() {
    this.battlePending = false;
    this.isFishing     = false;
    this.dlgOpen       = false;
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.mobileInput?.showContextButtons('overworld');
  }
}
