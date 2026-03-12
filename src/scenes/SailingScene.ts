import { SHIPS, ShipBlueprint } from '../data/ship-db';

// ── Layout constants ─────────────────────────────────────────────────────────
const W = 1280;
const H = 720;

// Ocean world is much larger than the screen
const WORLD_W = 4000;
const WORLD_H = 4000;

// Minimap
const MAP_SIZE = 160;
const MAP_PAD  = 12;

// Colors
const OCEAN_DEEP    = 0x1b8a96;
const OCEAN_SURFACE = 0x2dafb8;
const OCEAN_LIGHT   = 0x3dc4ce;
const WOOD_UI       = 0x8b6b4d;
const PARCHMENT     = 0xf0e8d8;
const GOLD          = 0xffe066;
const SAND_DOT      = 0xf0e8d8;

// 8-direction labels for compass
const DIR_LABELS: Record<string, string> = {
  'north':      'N',
  'north-east': 'NE',
  'east':       'E',
  'south-east': 'SE',
  'south':      'S',
  'south-west': 'SW',
  'west':       'W',
  'north-west': 'NW',
};

// Island positions in world space (just markers for now)
interface IslandMarker {
  name: string;
  wx: number;
  wy: number;
  color: number;
}

const ISLANDS: IslandMarker[] = [
  { name: 'Home Beach',    wx: 400,  wy: 3600, color: SAND_DOT },
  { name: 'Coral Atoll',   wx: 1800, wy: 1200, color: 0xff6b6b },
  { name: 'Skull Island',  wx: 3200, wy: 800,  color: 0xaaaaaa },
  { name: 'Treasure Cove', wx: 3400, wy: 2800, color: GOLD },
  { name: 'Storm Reef',    wx: 600,  wy: 600,  color: 0x6688cc },
];

// Ship rotation angles for 8 directions (radians, 0 = right/east)
const DIR_ANGLES: Record<string, number> = {
  'north':      -Math.PI / 2,
  'north-east': -Math.PI / 4,
  'east':        0,
  'south-east':  Math.PI / 4,
  'south':       Math.PI / 2,
  'south-west':  3 * Math.PI / 4,
  'west':        Math.PI,
  'north-west': -3 * Math.PI / 4,
};

export default class SailingScene extends Phaser.Scene {
  // ── Ship / Player ──────────────────────────────────────────────────────────
  private ship!: Phaser.Physics.Arcade.Sprite;
  private shipData!: ShipBlueprint;
  private currentDir = 'north';

  // ── Input ──────────────────────────────────────────────────────────────────
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private escKey!: Phaser.Input.Keyboard.Key;
  private shiftKey!: Phaser.Input.Keyboard.Key;

  // ── Ocean visuals ──────────────────────────────────────────────────────────
  private waveBands: { rect: Phaser.GameObjects.Rectangle; baseY: number; speed: number; phase: number }[] = [];

  // ── HUD ────────────────────────────────────────────────────────────────────
  private hudContainer!: Phaser.GameObjects.Container;
  private hudShipName!: Phaser.GameObjects.Text;
  private hudCoords!: Phaser.GameObjects.Text;
  private hudCompass!: Phaser.GameObjects.Text;
  private hudSpeedLabel!: Phaser.GameObjects.Text;

  // ── Minimap ────────────────────────────────────────────────────────────────
  private minimapContainer!: Phaser.GameObjects.Container;
  private minimapShipDot!: Phaser.GameObjects.Rectangle;
  private minimapIslandDots: Phaser.GameObjects.Arc[] = [];

  // ── Transition ─────────────────────────────────────────────────────────────
  private transitioning = false;

  constructor() {
    super({ key: 'Sailing' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════════════════════
  create(data?: { shipId?: number }) {
    this.transitioning = false;

    // Resolve ship
    const sid = data?.shipId ?? 1;
    this.shipData = SHIPS.find(s => s.id === sid) ?? SHIPS[0];

    // ── World bounds ──────────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // ── Camera ────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    // ── Draw ocean background ─────────────────────────────────────────────
    this.drawOcean();

    // ── Draw island placeholder circles in world ──────────────────────────
    for (const isl of ISLANDS) {
      const c = this.add.circle(isl.wx, isl.wy, 30, isl.color, 0.6);
      c.setStrokeStyle(2, 0x000000, 0.5);
      // Label
      this.add.text(isl.wx, isl.wy - 42, isl.name, {
        fontFamily: 'PokemonDP, monospace',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);
    }

    // ── Ship sprite ───────────────────────────────────────────────────────
    const sprIdx = String(this.shipData.spriteIndex).padStart(2, '0');
    const texKey = `ship-${sprIdx}`;
    const startX = ISLANDS[0].wx;  // Start near Home Beach
    const startY = ISLANDS[0].wy - 80;

    this.ship = this.physics.add.sprite(startX, startY, texKey);
    this.ship.setDisplaySize(64, 64);
    this.ship.setCollideWorldBounds(true);
    this.ship.setDepth(10);

    // Camera follows ship
    this.cameras.main.startFollow(this.ship, true, 0.08, 0.08);

    // ── Input ─────────────────────────────────────────────────────────────
    this.cursors  = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.escKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    // ── HUD (fixed to camera / scroll-ignored) ───────────────────────────
    this.buildHUD();

    // ── Minimap ───────────────────────────────────────────────────────────
    this.buildMinimap();

    // ── Fade in ───────────────────────────────────────────────────────────
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DRAW OCEAN
  // ═══════════════════════════════════════════════════════════════════════════
  private drawOcean() {
    // Deep ocean base
    this.add.rectangle(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, OCEAN_DEEP).setDepth(0);

    // Gradient bands (horizontal stripes across the world)
    const bandCount = 40;
    const bandH = WORLD_H / bandCount;
    for (let i = 0; i < bandCount; i++) {
      const t = i / bandCount;
      // Alternate between surface and deep colors
      const color = i % 2 === 0 ? OCEAN_SURFACE : OCEAN_DEEP;
      const alpha = 0.15 + t * 0.15;
      const y = i * bandH + bandH / 2;
      this.add.rectangle(WORLD_W / 2, y, WORLD_W, bandH, color, alpha).setDepth(0);
    }

    // Animated wave bands — thin horizontal lines that scroll
    const waveConfigs = [
      { color: OCEAN_LIGHT,  alpha: 0.35, h: 4, speed: 25,  ySpacing: 80  },
      { color: 0xffffff,     alpha: 0.15, h: 2, speed: -18, ySpacing: 120 },
      { color: OCEAN_SURFACE, alpha: 0.25, h: 3, speed: 30,  ySpacing: 95  },
      { color: 0xaaeef0,     alpha: 0.18, h: 2, speed: -22, ySpacing: 110 },
    ];

    this.waveBands = [];
    for (const cfg of waveConfigs) {
      for (let y = 0; y < WORLD_H; y += cfg.ySpacing) {
        const rect = this.add.rectangle(WORLD_W / 2, y, WORLD_W + 200, cfg.h, cfg.color, cfg.alpha);
        rect.setDepth(1);
        this.waveBands.push({
          rect,
          baseY: y,
          speed: cfg.speed,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HUD
  // ═══════════════════════════════════════════════════════════════════════════
  private buildHUD() {
    this.hudContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

    // Background bar at top
    const bar = this.add.rectangle(W / 2, 0, W, 40, 0x000000, 0.55).setOrigin(0.5, 0);
    this.hudContainer.add(bar);

    // Ship name (left)
    this.hudShipName = this.add.text(12, 8, this.shipData.name.toUpperCase(), {
      fontFamily: 'PixelPirate',
      fontSize: '20px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.hudContainer.add(this.hudShipName);

    // Coordinates (center)
    this.hudCoords = this.add.text(W / 2, 8, 'X: 0  Y: 0', {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0);
    this.hudContainer.add(this.hudCoords);

    // Compass (center-right)
    this.hudCompass = this.add.text(W / 2 + 180, 8, 'N', {
      fontFamily: 'PixelPirate',
      fontSize: '22px',
      color: '#ff8866',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0);
    this.hudContainer.add(this.hudCompass);

    // Speed indicator (right)
    this.hudSpeedLabel = this.add.text(W - 12, 8, 'HALF SAIL', {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '14px',
      color: '#aaeef0',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0);
    this.hudContainer.add(this.hudSpeedLabel);

    // Bottom hint bar
    const hintBar = this.add.rectangle(W / 2, H, W, 30, 0x000000, 0.45).setOrigin(0.5, 1);
    this.hudContainer.add(hintBar);

    const hintText = this.add.text(W / 2, H - 6, 'WASD: Sail    SHIFT: Full Speed    ESC: Return to Beach', {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '13px',
      color: '#cccccc',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5, 1);
    this.hudContainer.add(hintText);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MINIMAP
  // ═══════════════════════════════════════════════════════════════════════════
  private buildMinimap() {
    const mx = W - MAP_SIZE - MAP_PAD;
    const my = 50 + MAP_PAD;

    this.minimapContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

    // Background
    const bg = this.add.rectangle(mx + MAP_SIZE / 2, my + MAP_SIZE / 2, MAP_SIZE, MAP_SIZE, 0x1b3a4a, 0.85);
    bg.setStrokeStyle(2, WOOD_UI, 1);
    this.minimapContainer.add(bg);

    // Island dots
    this.minimapIslandDots = [];
    for (const isl of ISLANDS) {
      const dotX = mx + (isl.wx / WORLD_W) * MAP_SIZE;
      const dotY = my + (isl.wy / WORLD_H) * MAP_SIZE;
      const dot = this.add.circle(dotX, dotY, 4, isl.color, 0.9);
      this.minimapContainer.add(dot);
      this.minimapIslandDots.push(dot);
    }

    // Ship dot (will be updated each frame)
    this.minimapShipDot = this.add.rectangle(mx, my, 5, 5, 0xffffff, 1);
    this.minimapContainer.add(this.minimapShipDot);

    // "MAP" label
    const label = this.add.text(mx + MAP_SIZE / 2, my - 6, 'MAP', {
      fontFamily: 'PixelPirate',
      fontSize: '12px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 1);
    this.minimapContainer.add(label);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════════════════════
  update(_time: number, delta: number) {
    if (!this.ship || this.transitioning) return;

    // ── ESC → return to beach ──────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.returnToBeach();
      return;
    }

    // ── Ship movement ──────────────────────────────────────────────────────
    this.handleShipMovement(delta);

    // ── Animate waves ──────────────────────────────────────────────────────
    this.animateWaves(_time, delta);

    // ── Update HUD ─────────────────────────────────────────────────────────
    this.updateHUD();

    // ── Update minimap ─────────────────────────────────────────────────────
    this.updateMinimap();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHIP MOVEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  private handleShipMovement(_delta: number) {
    const baseSpeed = this.shipData.baseStats.speed * 2;  // Scale to pixel speed
    const isBoosting = this.shiftKey.isDown;
    const speed = isBoosting ? baseSpeed * 1.8 : baseSpeed;

    let vx = 0, vy = 0;
    const L = this.cursors.left?.isDown  || this.wasd.A.isDown;
    const R = this.cursors.right?.isDown || this.wasd.D.isDown;
    const U = this.cursors.up?.isDown    || this.wasd.W.isDown;
    const D = this.cursors.down?.isDown  || this.wasd.S.isDown;

    if (L) vx = -speed; else if (R) vx = speed;
    if (U) vy = -speed; else if (D) vy = speed;

    // Normalize diagonal speed
    if (vx !== 0 && vy !== 0) {
      const norm = Math.SQRT1_2;
      vx *= norm;
      vy *= norm;
    }

    // Determine 8-way direction
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

    this.ship.setVelocity(vx, vy);

    // Rotate ship to face direction
    const targetAngle = DIR_ANGLES[this.currentDir] ?? 0;
    this.ship.setRotation(targetAngle);

    // Update speed label
    if (vx === 0 && vy === 0) {
      this.hudSpeedLabel.setText('ANCHORED');
      this.hudSpeedLabel.setColor('#888888');
    } else if (isBoosting) {
      this.hudSpeedLabel.setText('FULL SAIL');
      this.hudSpeedLabel.setColor('#ffe066');
    } else {
      this.hudSpeedLabel.setText('HALF SAIL');
      this.hudSpeedLabel.setColor('#aaeef0');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WAVE ANIMATION
  // ═══════════════════════════════════════════════════════════════════════════
  private animateWaves(time: number, _delta: number) {
    const t = time / 1000;
    for (const wave of this.waveBands) {
      // Gentle sine-wave vertical bob + horizontal scroll
      const yOff = Math.sin(t * 0.8 + wave.phase) * 6;
      wave.rect.y = wave.baseY + yOff;
      wave.rect.x = (WORLD_W / 2) + Math.sin(t * 0.3 + wave.phase) * 40;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HUD UPDATE
  // ═══════════════════════════════════════════════════════════════════════════
  private updateHUD() {
    const sx = Math.round(this.ship.x);
    const sy = Math.round(this.ship.y);
    this.hudCoords.setText(`X: ${sx}  Y: ${sy}`);
    this.hudCompass.setText(DIR_LABELS[this.currentDir] ?? 'N');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MINIMAP UPDATE
  // ═══════════════════════════════════════════════════════════════════════════
  private updateMinimap() {
    const mx = W - MAP_SIZE - MAP_PAD;
    const my = 50 + MAP_PAD;
    const dotX = mx + (this.ship.x / WORLD_W) * MAP_SIZE;
    const dotY = my + (this.ship.y / WORLD_H) * MAP_SIZE;
    this.minimapShipDot.setPosition(dotX, dotY);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN TO BEACH
  // ═══════════════════════════════════════════════════════════════════════════
  private returnToBeach() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.ship.setVelocity(0, 0);

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Beach');
    });
  }
}
