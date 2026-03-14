import { SHIPS, ShipBlueprint } from '../data/ship-db';
import MobileInput from '../systems/MobileInput';

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
const SAND          = 0xf0e8d8;
const SAND_DARK     = 0xd4c9b0;
const SAND_WET      = 0xc4b89e;
const GRASS_GREEN   = 0x5a8a3c;
const GRASS_DARK    = 0x4a7a2c;
const PALM_TRUNK    = 0x6b4226;
const PALM_LEAF     = 0x2d8a2e;
const PALM_LEAF_LT  = 0x3aad3a;
const ROCK_GREY     = 0x777777;
const ROCK_DARK     = 0x555555;
const SKULL_WHITE   = 0xddddcc;
const DOCK_WOOD     = 0x8b6b4d;
const DOCK_WOOD_DK  = 0x6b4e33;

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

// ── Island Data ──────────────────────────────────────────────────────────────
// Each island has a position, visual shape, dock offset, and encounter notes.

interface IslandDef {
  name: string;
  wx: number;
  wy: number;
  color: number;           // minimap / accent color
  radius: number;          // base island radius in world pixels
  shape: 'round' | 'oblong' | 'crescent' | 'jagged';
  dockSide: 'south' | 'north' | 'east' | 'west'; // which side the dock extends from
  difficulty: number;      // 1-5 scale
  description: string;     // tooltip / future UI
  // ── Future encounter data (not wired yet) ──
  // Fish encounter tables will reference zone-db.ts zones
  // Enemy captains will reference enemy-db.ts templates
  // These are notes for Phase 6 wiring:
  //   Home Beach:    starter zone, zone_shallows fish, no enemy captains
  //   Coral Atoll:   zone_shallows fish (coral_guardian, coralline), Captain Barnacle patrols nearby
  //   Skull Island:  zone_volcanic fish (ember_snapper, infernoray, voidfin), Admiral Ironhook
  //   Treasure Cove: rare fish (depthwalker, abyssal_fang, blazefin), treasure chest loot
  //   Storm Reef:    zone_storm fish (volt_eel, galecutter, tempestfang), The Dread Corsair
}

const ISLANDS: IslandDef[] = [
  {
    name: 'Home Beach',
    wx: 400,  wy: 3600,
    color: SAND,
    radius: 110,
    shape: 'round',
    dockSide: 'north',
    difficulty: 1,
    description: 'Your home port. Safe waters, gentle surf.',
    // Fish: tidecaller (35%), tidecaster (25%), coralline (20%) — levels 3-7
    // Enemies: none
  },
  {
    name: 'Coral Atoll',
    wx: 1800, wy: 1200,
    color: 0xff6b6b,
    radius: 90,
    shape: 'oblong',
    dockSide: 'south',
    difficulty: 2,
    description: 'A ring of living coral. Rich fishing grounds.',
    // Fish: coral_guardian (25%), coralline (30%), tsunamaw (15%) — levels 4-8
    // Enemies: Captain Barnacle patrols (aggroRadius 200)
  },
  {
    name: 'Skull Island',
    wx: 3200, wy: 800,
    color: 0xaaaaaa,
    radius: 130,
    shape: 'jagged',
    dockSide: 'west',
    difficulty: 3,
    description: 'A volcanic rock shaped like a skull. Dangerous waters.',
    // Fish: ember_snapper (30%), infernoray (20%), voidfin (15%) — levels 5-11
    // Enemies: Admiral Ironhook patrols (aggroRadius 250)
  },
  {
    name: 'Treasure Cove',
    wx: 3400, wy: 2800,
    color: GOLD,
    radius: 100,
    shape: 'crescent',
    dockSide: 'west',
    difficulty: 4,
    description: 'Hidden cove rumored to hold pirate treasure.',
    // Fish: depthwalker (20%), abyssal_fang (15%), blazefin (10%) — levels 8-13
    // Loot: random treasure chest with gold/rare items
    // Enemies: roaming pirates
  },
  {
    name: 'Storm Reef',
    wx: 600,  wy: 600,
    color: 0x6688cc,
    radius: 120,
    shape: 'jagged',
    dockSide: 'east',
    difficulty: 5,
    description: 'Perpetual storm. Only the bravest sail here.',
    // Fish: volt_eel (20%), galecutter (15%), tempestfang (10%), shockjaw (8%) — levels 8-15
    // Enemies: The Dread Corsair patrols (aggroRadius 300)
  },
];

// Docking radius — how close the ship must be to dock
const DOCK_PROXIMITY = 80;
// Label visibility distance
const LABEL_FAR_DIST  = 500;
const LABEL_NEAR_DIST = 200;

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
  private spaceKey!: Phaser.Input.Keyboard.Key;

  // ── Ocean visuals ──────────────────────────────────────────────────────────
  private waveBands: { rect: Phaser.GameObjects.Rectangle; baseY: number; speed: number; phase: number }[] = [];

  // ── Islands ────────────────────────────────────────────────────────────────
  private islandColliders: Phaser.Physics.Arcade.StaticGroup | null = null;
  private islandNameLabels: { text: Phaser.GameObjects.Text; isl: IslandDef }[] = [];
  private islandDiffLabels: { text: Phaser.GameObjects.Text; isl: IslandDef }[] = [];
  private palmTreeObjects: { gfx: Phaser.GameObjects.Graphics; baseAngle: number; phase: number }[] = [];

  // ── Dock prompt ────────────────────────────────────────────────────────────
  private dockPrompt!: Phaser.GameObjects.Container;
  private dockPromptVisible = false;
  private nearestDockIsland: IslandDef | null = null;

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

  // ── Mobile input ───────────────────────────────────────────────────────────
  private mobileInput?: MobileInput;

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

    // Clean up tweens/timers on scene shutdown to prevent orphaned callbacks
    this.events.once('shutdown', () => {
      this.tweens.killAll();
      this.time.removeAllEvents();
      this.mobileInput?.destroy();
    });

    // Resolve ship
    const sid = data?.shipId ?? 1;
    this.shipData = SHIPS.find(s => s.id === sid) ?? SHIPS[0];

    // ── World bounds ──────────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // ── Camera ────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    // ── Draw ocean background ─────────────────────────────────────────────
    this.drawOcean();

    // ── Draw islands ──────────────────────────────────────────────────────
    this.islandColliders = this.physics.add.staticGroup();
    this.islandNameLabels = [];
    this.islandDiffLabels = [];
    this.palmTreeObjects = [];
    for (const isl of ISLANDS) {
      this.drawIsland(isl);
    }

    // ── Ship sprite ───────────────────────────────────────────────────────
    const sprIdx = String(this.shipData.spriteIndex).padStart(2, '0');
    const texKey = `ship-${sprIdx}`;
    const startX = ISLANDS[0].wx;  // Start near Home Beach
    const startY = ISLANDS[0].wy - ISLANDS[0].radius - 50;

    this.ship = this.physics.add.sprite(startX, startY, texKey);
    this.ship.setDisplaySize(64, 64);
    this.ship.setCollideWorldBounds(true);
    this.ship.setDepth(10);

    // Collide ship with island bodies
    this.physics.add.collider(this.ship, this.islandColliders);

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
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ── HUD (fixed to camera / scroll-ignored) ───────────────────────────
    this.buildHUD();

    // ── Dock prompt (hidden by default) ──────────────────────────────────
    this.buildDockPrompt();

    // ── Minimap ───────────────────────────────────────────────────────────
    this.buildMinimap();

    // ── Mobile input ──────────────────────────────────────────────────────
    if (MobileInput.IS_MOBILE) {
      this.mobileInput = new MobileInput(this);
      this.mobileInput.showContextButtons('sailing');
      this.buildMobileReturnButton();
    }

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
  // DRAW ISLAND — procedural island shapes with beach, grass, trees, dock
  // ═══════════════════════════════════════════════════════════════════════════
  private drawIsland(isl: IslandDef) {
    const gfx = this.add.graphics();
    gfx.setDepth(3);

    const cx = isl.wx;
    const cy = isl.wy;
    const r  = isl.radius;

    // ── Shallow water ring (lighter ocean around island) ──────────────────
    gfx.fillStyle(0x3dc4ce, 0.4);
    this.fillIslandShape(gfx, cx, cy, r + 30, isl.shape);

    // ── Wet sand ring ─────────────────────────────────────────────────────
    gfx.fillStyle(SAND_WET, 0.9);
    this.fillIslandShape(gfx, cx, cy, r + 10, isl.shape);

    // ── Main sand body ────────────────────────────────────────────────────
    gfx.fillStyle(SAND, 1);
    this.fillIslandShape(gfx, cx, cy, r, isl.shape);

    // ── Sand texture spots ────────────────────────────────────────────────
    const rng = this.createSeededRng(cx * 7 + cy * 13);
    for (let i = 0; i < 12; i++) {
      const angle = rng() * Math.PI * 2;
      const dist  = rng() * (r * 0.7);
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist;
      gfx.fillStyle(SAND_DARK, 0.3 + rng() * 0.2);
      gfx.fillCircle(sx, sy, 3 + rng() * 5);
    }

    // ── Grass interior (smaller ellipse) ──────────────────────────────────
    if (r > 70) {
      const grassR = r * 0.55;
      gfx.fillStyle(GRASS_GREEN, 0.85);
      this.fillIslandShape(gfx, cx, cy - 4, grassR, 'round');
      // Darker grass patches
      for (let i = 0; i < 6; i++) {
        const angle = rng() * Math.PI * 2;
        const dist  = rng() * (grassR * 0.6);
        const gx = cx + Math.cos(angle) * dist;
        const gy = cy - 4 + Math.sin(angle) * dist;
        gfx.fillStyle(GRASS_DARK, 0.5);
        gfx.fillCircle(gx, gy, 4 + rng() * 8);
      }
    }

    // ── Island-specific decorations ───────────────────────────────────────
    switch (isl.name) {
      case 'Skull Island':
        this.drawSkullDecoration(gfx, cx, cy, rng);
        this.drawRocks(gfx, cx, cy, r, rng, 8);
        break;
      case 'Coral Atoll':
        this.drawCoralDecoration(gfx, cx, cy, r, rng);
        break;
      case 'Treasure Cove':
        this.drawTreasureDecoration(gfx, cx, cy, rng);
        break;
      case 'Storm Reef':
        this.drawStormDecoration(gfx, cx, cy, r, rng);
        this.drawRocks(gfx, cx, cy, r, rng, 10);
        break;
      default:
        break;
    }

    // ── Palm trees ────────────────────────────────────────────────────────
    const treeCount = isl.name === 'Storm Reef' ? 1 : (isl.name === 'Skull Island' ? 2 : 3);
    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2 + rng() * 0.6;
      const dist  = r * 0.3 + rng() * (r * 0.25);
      const tx = cx + Math.cos(angle) * dist;
      const ty = cy + Math.sin(angle) * dist;
      this.drawPalmTree(tx, ty, rng);
    }

    // ── Dock ──────────────────────────────────────────────────────────────
    this.drawDock(isl);

    // ── Island collision body (invisible circle physics body) ─────────────
    // We use a zone + static body so the ship collides with the island landmass.
    const collider = this.add.zone(cx, cy, r * 1.6, r * 1.6);
    this.physics.add.existing(collider, true); // static
    (collider.body as Phaser.Physics.Arcade.StaticBody).setCircle(r * 0.75, r * 0.8 - r * 0.75, r * 0.8 - r * 0.75);
    this.islandColliders!.add(collider);

    // ── Island name label (world-space, visible from distance) ────────────
    const nameLabel = this.add.text(cx, cy - r - 40, isl.name.toUpperCase(), {
      fontFamily: 'PixelPirate',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(15);
    this.islandNameLabels.push({ text: nameLabel, isl });

    // ── Difficulty stars label ────────────────────────────────────────────
    const stars = '\u2605'.repeat(isl.difficulty) + '\u2606'.repeat(5 - isl.difficulty);
    const diffColor = isl.difficulty <= 2 ? '#aaffaa' : isl.difficulty <= 3 ? '#ffe066' : '#ff6b6b';
    const diffLabel = this.add.text(cx, cy - r - 20, stars, {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '14px',
      color: diffColor,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(15);
    this.islandDiffLabels.push({ text: diffLabel, isl });
  }

  // ── Shape helper: fills an island shape centered at cx,cy with radius r ──
  private fillIslandShape(gfx: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, shape: string) {
    switch (shape) {
      case 'oblong':
        gfx.fillEllipse(cx, cy, r * 2.2, r * 1.4);
        break;
      case 'crescent': {
        // Main body
        gfx.fillCircle(cx, cy, r);
        // Bite taken out (draw with ocean color to create crescent)
        const savedAlpha = gfx.defaultFillAlpha;
        gfx.fillStyle(OCEAN_DEEP, 1);
        gfx.fillCircle(cx + r * 0.5, cy - r * 0.3, r * 0.6);
        // Restore — re-fill the remaining crescent shape
        gfx.fillStyle(SAND, 1);
        gfx.fillCircle(cx - r * 0.15, cy + r * 0.1, r * 0.85);
        break;
      }
      case 'jagged': {
        // Irregular polygon
        const points: { x: number; y: number }[] = [];
        const segments = 12;
        for (let i = 0; i < segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const jitter = 0.75 + Math.sin(i * 3.7) * 0.25; // deterministic jitter
          const px = cx + Math.cos(angle) * r * jitter;
          const py = cy + Math.sin(angle) * r * jitter;
          points.push({ x: px, y: py });
        }
        gfx.beginPath();
        gfx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          gfx.lineTo(points[i].x, points[i].y);
        }
        gfx.closePath();
        gfx.fillPath();
        break;
      }
      default: // 'round'
        gfx.fillCircle(cx, cy, r);
        break;
    }
  }

  // ── Skull Island decoration: a skull shape on the rock ──────────────────
  private drawSkullDecoration(gfx: Phaser.GameObjects.Graphics, cx: number, cy: number, _rng: () => number) {
    // Skull shape (simplified)
    gfx.fillStyle(SKULL_WHITE, 0.8);
    gfx.fillCircle(cx, cy - 10, 18); // cranium
    gfx.fillRect(cx - 10, cy + 2, 20, 12); // jaw
    // Eye sockets
    gfx.fillStyle(0x222222, 1);
    gfx.fillCircle(cx - 7, cy - 12, 5);
    gfx.fillCircle(cx + 7, cy - 12, 5);
    // Nose
    gfx.fillStyle(0x333333, 1);
    gfx.fillTriangle(cx - 3, cy - 2, cx + 3, cy - 2, cx, cy + 4);
  }

  // ── Coral Atoll decoration: colorful coral clusters ─────────────────────
  private drawCoralDecoration(gfx: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, rng: () => number) {
    const coralColors = [0xff6b6b, 0xff9999, 0xffab91, 0xff7777, 0xee5555];
    for (let i = 0; i < 15; i++) {
      const angle = rng() * Math.PI * 2;
      const dist  = r * 0.5 + rng() * (r * 0.4);
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      const color = coralColors[Math.floor(rng() * coralColors.length)];
      gfx.fillStyle(color, 0.7 + rng() * 0.3);
      // Little coral branch (3 small circles in a cluster)
      const size = 3 + rng() * 4;
      gfx.fillCircle(px, py, size);
      gfx.fillCircle(px + size * 0.7, py - size * 0.5, size * 0.7);
      gfx.fillCircle(px - size * 0.5, py - size * 0.8, size * 0.6);
    }
  }

  // ── Treasure Cove decoration: X marks the spot ──────────────────────────
  private drawTreasureDecoration(gfx: Phaser.GameObjects.Graphics, cx: number, cy: number, _rng: () => number) {
    // Treasure chest (simple box)
    gfx.fillStyle(DOCK_WOOD, 1);
    gfx.fillRect(cx - 12, cy - 6, 24, 16);
    gfx.fillStyle(GOLD, 1);
    // Gold trim
    gfx.fillRect(cx - 12, cy - 6, 24, 3);
    gfx.fillRect(cx - 2, cy - 2, 4, 8);
    // Gold lock
    gfx.fillCircle(cx, cy + 3, 3);

    // "X" on the ground
    gfx.lineStyle(3, 0xcc0000, 0.8);
    gfx.beginPath();
    gfx.moveTo(cx + 20, cy + 20);
    gfx.lineTo(cx + 36, cy + 36);
    gfx.moveTo(cx + 36, cy + 20);
    gfx.lineTo(cx + 20, cy + 36);
    gfx.strokePath();
  }

  // ── Storm Reef decoration: lightning bolt symbol + dark clouds ───────────
  private drawStormDecoration(gfx: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, rng: () => number) {
    // Dark storm clouds (semi-transparent grey circles above the island)
    for (let i = 0; i < 5; i++) {
      const cloudX = cx - r * 0.4 + rng() * r * 0.8;
      const cloudY = cy - r * 0.3 + rng() * r * 0.3;
      gfx.fillStyle(0x334455, 0.35 + rng() * 0.2);
      gfx.fillEllipse(cloudX, cloudY, 30 + rng() * 25, 12 + rng() * 8);
    }

    // Lightning bolt symbol on island center
    gfx.fillStyle(GOLD, 0.9);
    gfx.beginPath();
    gfx.moveTo(cx + 2, cy - 16);
    gfx.lineTo(cx - 6, cy);
    gfx.lineTo(cx - 1, cy);
    gfx.lineTo(cx - 4, cy + 16);
    gfx.lineTo(cx + 6, cy);
    gfx.lineTo(cx + 1, cy);
    gfx.closePath();
    gfx.fillPath();
  }

  // ── Rocks scattered around an island ────────────────────────────────────
  private drawRocks(gfx: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, rng: () => number, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const dist  = r * 0.6 + rng() * (r * 0.35);
      const rx = cx + Math.cos(angle) * dist;
      const ry = cy + Math.sin(angle) * dist;
      const size = 4 + rng() * 6;
      gfx.fillStyle(rng() > 0.5 ? ROCK_GREY : ROCK_DARK, 0.8);
      gfx.fillCircle(rx, ry, size);
      // Highlight
      gfx.fillStyle(0x999999, 0.3);
      gfx.fillCircle(rx - 1, ry - 1, size * 0.5);
    }
  }

  // ── Procedural palm tree ────────────────────────────────────────────────
  private drawPalmTree(tx: number, ty: number, rng: () => number) {
    const treeGfx = this.add.graphics();
    treeGfx.setDepth(5);

    // Trunk (slightly curved via 3 segments)
    const lean = (rng() - 0.5) * 12;
    treeGfx.lineStyle(5, PALM_TRUNK, 1);
    treeGfx.beginPath();
    treeGfx.moveTo(tx, ty);
    treeGfx.lineTo(tx + lean * 0.3, ty - 14);
    treeGfx.lineTo(tx + lean * 0.7, ty - 28);
    treeGfx.lineTo(tx + lean, ty - 40);
    treeGfx.strokePath();

    // Trunk highlight
    treeGfx.lineStyle(2, 0x8b5e3c, 0.5);
    treeGfx.beginPath();
    treeGfx.moveTo(tx + 1, ty);
    treeGfx.lineTo(tx + lean + 1, ty - 40);
    treeGfx.strokePath();

    // Fronds (6 leaf shapes radiating from top)
    const topX = tx + lean;
    const topY = ty - 40;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + rng() * 0.3;
      const leafLen = 16 + rng() * 8;
      const endX = topX + Math.cos(angle) * leafLen;
      const endY = topY + Math.sin(angle) * leafLen * 0.7; // squish vertically for top-down
      const midX = topX + Math.cos(angle) * leafLen * 0.5 + (rng() - 0.5) * 4;
      const midY = topY + Math.sin(angle) * leafLen * 0.35;

      // Leaf shape — thick line with tapering
      treeGfx.lineStyle(4, i % 2 === 0 ? PALM_LEAF : PALM_LEAF_LT, 0.9);
      treeGfx.beginPath();
      treeGfx.moveTo(topX, topY);
      treeGfx.lineTo(midX, midY);
      treeGfx.lineTo(endX, endY);
      treeGfx.strokePath();

      // Leaf fill (small ellipse at mid)
      treeGfx.fillStyle(i % 2 === 0 ? PALM_LEAF : PALM_LEAF_LT, 0.6);
      treeGfx.fillEllipse(midX, midY, 8, 4);
    }

    // Coconuts (2-3 small brown circles)
    const coconutCount = 2 + (rng() > 0.5 ? 1 : 0);
    for (let i = 0; i < coconutCount; i++) {
      const cAngle = rng() * Math.PI * 2;
      const cx = topX + Math.cos(cAngle) * 4;
      const cy = topY + Math.sin(cAngle) * 3;
      treeGfx.fillStyle(0x5a3a1a, 1);
      treeGfx.fillCircle(cx, cy, 2.5);
    }

    // Shadow at base
    treeGfx.fillStyle(0x000000, 0.15);
    treeGfx.fillEllipse(tx, ty + 3, 14, 6);

    // Store for potential sway animation
    this.palmTreeObjects.push({
      gfx: treeGfx,
      baseAngle: 0,
      phase: rng() * Math.PI * 2,
    });
  }

  // ── Dock — wooden planks extending from the island toward the water ─────
  private drawDock(isl: IslandDef) {
    const gfx = this.add.graphics();
    gfx.setDepth(4);

    const cx = isl.wx;
    const cy = isl.wy;
    const r  = isl.radius;

    // Determine dock origin and direction
    let dockX = cx, dockY = cy;
    let dx = 0, dy = 0;  // direction vector (unit)
    const dockLen = 50;
    const dockW   = 16;

    switch (isl.dockSide) {
      case 'north': dockY = cy - r;    dy = -1; break;
      case 'south': dockY = cy + r;    dy =  1; break;
      case 'east':  dockX = cx + r;    dx =  1; break;
      case 'west':  dockX = cx - r;    dx = -1; break;
    }

    // Dock planks
    const plankCount = 6;
    const plankSpacing = dockLen / plankCount;
    for (let i = 0; i < plankCount; i++) {
      const px = dockX + dx * (i * plankSpacing + plankSpacing * 0.5);
      const py = dockY + dy * (i * plankSpacing + plankSpacing * 0.5);

      if (dy !== 0) {
        // Horizontal planks (dock extends vertically)
        gfx.fillStyle(i % 2 === 0 ? DOCK_WOOD : DOCK_WOOD_DK, 1);
        gfx.fillRect(px - dockW / 2, py - plankSpacing * 0.4, dockW, plankSpacing * 0.75);
        // Plank lines
        gfx.lineStyle(1, 0x000000, 0.2);
        gfx.strokeRect(px - dockW / 2, py - plankSpacing * 0.4, dockW, plankSpacing * 0.75);
      } else {
        // Vertical planks (dock extends horizontally)
        gfx.fillStyle(i % 2 === 0 ? DOCK_WOOD : DOCK_WOOD_DK, 1);
        gfx.fillRect(px - plankSpacing * 0.4, py - dockW / 2, plankSpacing * 0.75, dockW);
        gfx.lineStyle(1, 0x000000, 0.2);
        gfx.strokeRect(px - plankSpacing * 0.4, py - dockW / 2, plankSpacing * 0.75, dockW);
      }
    }

    // Dock posts (4 circles at corners)
    const endX = dockX + dx * dockLen;
    const endY = dockY + dy * dockLen;
    const postOffset = dockW / 2 + 1;
    const posts = dy !== 0
      ? [
          { x: dockX - postOffset, y: dockY },
          { x: dockX + postOffset, y: dockY },
          { x: endX - postOffset,  y: endY  },
          { x: endX + postOffset,  y: endY  },
        ]
      : [
          { x: dockX, y: dockY - postOffset },
          { x: dockX, y: dockY + postOffset },
          { x: endX,  y: endY - postOffset  },
          { x: endX,  y: endY + postOffset  },
        ];
    for (const p of posts) {
      gfx.fillStyle(DOCK_WOOD_DK, 1);
      gfx.fillCircle(p.x, p.y, 3);
      gfx.lineStyle(1, 0x000000, 0.5);
      gfx.strokeCircle(p.x, p.y, 3);
    }

    // Rope between end posts
    gfx.lineStyle(1.5, 0xccbb99, 0.6);
    if (dy !== 0) {
      gfx.beginPath();
      gfx.moveTo(endX - postOffset, endY);
      gfx.lineTo(endX + postOffset, endY);
      gfx.strokePath();
    } else {
      gfx.beginPath();
      gfx.moveTo(endX, endY - postOffset);
      gfx.lineTo(endX, endY + postOffset);
      gfx.strokePath();
    }
  }

  // ── Simple seeded pseudo-random (deterministic per island) ──────────────
  private createSeededRng(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s & 0xfffffff) / 0xfffffff;
    };
  }

  // ── Get dock tip position (where the ship should approach) ──────────────
  private getDockTip(isl: IslandDef): { x: number; y: number } {
    const dockLen = 50;
    switch (isl.dockSide) {
      case 'north': return { x: isl.wx, y: isl.wy - isl.radius - dockLen };
      case 'south': return { x: isl.wx, y: isl.wy + isl.radius + dockLen };
      case 'east':  return { x: isl.wx + isl.radius + dockLen, y: isl.wy };
      case 'west':  return { x: isl.wx - isl.radius - dockLen, y: isl.wy };
      default:      return { x: isl.wx, y: isl.wy + isl.radius + dockLen };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCK PROMPT
  // ═══════════════════════════════════════════════════════════════════════════
  private buildDockPrompt() {
    this.dockPrompt = this.add.container(W / 2, H - 80).setScrollFactor(0).setDepth(120);
    this.dockPrompt.setVisible(false);
    this.dockPromptVisible = false;

    // Background panel
    const bg = this.add.rectangle(0, 0, 340, 44, 0x000000, 0.75);
    bg.setStrokeStyle(2, GOLD, 0.8);
    this.dockPrompt.add(bg);

    // Text
    const dockHint = MobileInput.IS_MOBILE ? 'TAP  ACT  TO  DOCK' : 'PRESS  SPACE  TO  DOCK';
    const txt = this.add.text(0, 0, dockHint, {
      fontFamily: 'PixelPirate',
      fontSize: '20px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.dockPrompt.add(txt);
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

    const hintStr = MobileInput.IS_MOBILE
      ? 'JOYSTICK: Sail    BOOST: Full Speed    DOCK at islands'
      : 'WASD: Sail    SHIFT: Full Speed    ESC: Return to Beach';
    const hintText = this.add.text(W / 2, H - 6, hintStr, {
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

    // Island dots (sized by island radius)
    this.minimapIslandDots = [];
    for (const isl of ISLANDS) {
      const dotX = mx + (isl.wx / WORLD_W) * MAP_SIZE;
      const dotY = my + (isl.wy / WORLD_H) * MAP_SIZE;
      const dotR = Math.max(3, (isl.radius / WORLD_W) * MAP_SIZE * 1.5);
      const dot = this.add.circle(dotX, dotY, dotR, isl.color, 0.9);
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

    // ── SPACE / mobile action → dock at island ────────────────────────────
    const spaceDown = Phaser.Input.Keyboard.JustDown(this.spaceKey) || (this.mobileInput?.isActionJustDown() ?? false);
    if (spaceDown && this.nearestDockIsland) {
      this.dockAtIsland(this.nearestDockIsland);
      return;
    }

    // ── Ship movement ──────────────────────────────────────────────────────
    this.handleShipMovement(delta);

    // ── Animate waves ──────────────────────────────────────────────────────
    this.animateWaves(_time, delta);

    // ── Check dock proximity ──────────────────────────────────────────────
    this.checkDockProximity();

    // ── Update island label visibility (fade based on distance) ───────────
    this.updateIslandLabels();

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
    const isBoosting = this.shiftKey.isDown || (this.mobileInput?.isBoostHeld() ?? false);
    const speed = isBoosting ? baseSpeed * 1.8 : baseSpeed;

    // Merge mobile joystick with keyboard
    const joy = this.mobileInput?.getMovementVector() ?? { x: 0, y: 0 };
    let vx = joy.x * speed;
    let vy = joy.y * speed;

    const L = this.cursors.left?.isDown  || this.wasd.A.isDown;
    const R = this.cursors.right?.isDown || this.wasd.D.isDown;
    const U = this.cursors.up?.isDown    || this.wasd.W.isDown;
    const D = this.cursors.down?.isDown  || this.wasd.S.isDown;

    // Keyboard overrides joystick when active
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

    // Flip ship sprite horizontally based on direction (never rotate)
    if (vx < 0) {
      this.ship.setFlipX(true);   // facing left (west)
    } else if (vx > 0) {
      this.ship.setFlipX(false);  // facing right (east, default)
    }
    // If vx === 0 (pure north/south), keep current flipX state

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
  // DOCK PROXIMITY CHECK
  // ═══════════════════════════════════════════════════════════════════════════
  private checkDockProximity() {
    let closestIsland: IslandDef | null = null;
    let closestDist = Infinity;

    for (const isl of ISLANDS) {
      const tip = this.getDockTip(isl);
      const dist = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, tip.x, tip.y);
      if (dist < DOCK_PROXIMITY && dist < closestDist) {
        closestDist = dist;
        closestIsland = isl;
      }
    }

    this.nearestDockIsland = closestIsland;

    if (closestIsland && !this.dockPromptVisible) {
      this.dockPrompt.setVisible(true);
      this.dockPromptVisible = true;
      // Pulse animation
      this.tweens.add({
        targets: this.dockPrompt,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (!closestIsland && this.dockPromptVisible) {
      this.dockPrompt.setVisible(false);
      this.dockPromptVisible = false;
      this.tweens.killTweensOf(this.dockPrompt);
      this.dockPrompt.setScale(1);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ISLAND LABEL VISIBILITY (fade in/out based on distance)
  // ═══════════════════════════════════════════════════════════════════════════
  private updateIslandLabels() {
    for (const entry of this.islandNameLabels) {
      const dist = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, entry.isl.wx, entry.isl.wy);
      if (dist > LABEL_FAR_DIST) {
        // Very far — show small
        entry.text.setAlpha(0.5);
        entry.text.setScale(0.7);
      } else if (dist < LABEL_NEAR_DIST) {
        // Close — full visibility
        entry.text.setAlpha(1);
        entry.text.setScale(1);
      } else {
        // Interpolate
        const t = 1 - (dist - LABEL_NEAR_DIST) / (LABEL_FAR_DIST - LABEL_NEAR_DIST);
        entry.text.setAlpha(0.5 + t * 0.5);
        entry.text.setScale(0.7 + t * 0.3);
      }
    }
    for (const entry of this.islandDiffLabels) {
      const dist = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, entry.isl.wx, entry.isl.wy);
      // Only show difficulty stars when reasonably close
      if (dist > LABEL_FAR_DIST) {
        entry.text.setAlpha(0);
      } else if (dist < LABEL_NEAR_DIST) {
        entry.text.setAlpha(1);
      } else {
        const t = 1 - (dist - LABEL_NEAR_DIST) / (LABEL_FAR_DIST - LABEL_NEAR_DIST);
        entry.text.setAlpha(t);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCK AT ISLAND
  // ═══════════════════════════════════════════════════════════════════════════
  private dockAtIsland(isl: IslandDef) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.ship.setVelocity(0, 0);

    // Hide dock prompt
    this.dockPrompt.setVisible(false);
    this.dockPromptVisible = false;
    this.tweens.killTweensOf(this.dockPrompt);

    // Show docking notification
    const notif = this.add.container(W / 2, H / 2).setScrollFactor(0).setDepth(200);
    const notifBg = this.add.rectangle(0, 0, 400, 80, 0x000000, 0.8);
    notifBg.setStrokeStyle(2, GOLD, 1);
    notif.add(notifBg);

    const notifTitle = this.add.text(0, -16, `DOCKING AT ${isl.name.toUpperCase()}`, {
      fontFamily: 'PixelPirate',
      fontSize: '22px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    notif.add(notifTitle);

    const notifDesc = this.add.text(0, 14, isl.description, {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '14px',
      color: '#cccccc',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    notif.add(notifDesc);

    // Fade out and transition
    this.time.delayedCall(1200, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        // Home Beach returns to the main beach scene
        // Other islands: for now, also return to beach with a notification
        // TODO: Phase 6 — each island gets its own scene or BeachScene variant
        this.mobileInput?.destroy();
        this.mobileInput = undefined;
        if (isl.name === 'Home Beach') {
          this.scene.start('Beach', { from: 'sailing' });
        } else {
          // Future: this.scene.start('IslandScene', { island: isl.name });
          // For now, return to beach with island data passed
          this.scene.start('Beach', { from: 'sailing', arrivedFrom: isl.name });
        }
      });
    });
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
  // MOBILE RETURN BUTTON
  // ═══════════════════════════════════════════════════════════════════════════
  private buildMobileReturnButton() {
    const btn = this.add.container(50, 50).setScrollFactor(0).setDepth(900);
    const circle = this.add.circle(0, 0, 24, 0x8b3a2a, 0.85);
    circle.setStrokeStyle(2, 0x2c1011);
    const txt = this.add.text(0, 0, 'BACK', {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '11px',
      color: '#f0e8d8',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    btn.add([circle, txt]);
    circle.setInteractive(
      new Phaser.Geom.Circle(0, 0, 34),
      Phaser.Geom.Circle.Contains
    );
    circle.on('pointerdown', () => {
      this.returnToBeach();
    });
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
      this.mobileInput?.destroy();
      this.mobileInput = undefined;
      this.scene.start('Beach', { from: 'sailing' });
    });
  }
}
