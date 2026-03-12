import { FishInstance } from '../data/fish-db';

// ── Layout constants ─────────────────────────────────────────────────────────
const W = 1280;
const H = 720;
const SAND_TOP    = 360;   // y where sky ends / sand begins
const WATER_TOP   = 575;   // y where sand ends / ocean begins
const WALK_MIN_X  = 70;
const WALK_MAX_X  = 1210;
const WALK_MIN_Y  = SAND_TOP + 35;   // 395
const WALK_MAX_Y  = WATER_TOP - 22;  // 553

interface GroundItem {
  id: string;
  name: string;
  x: number;
  y: number;
  container: Phaser.GameObjects.Container;
  collected: boolean;
  isSign?: boolean;
  signLines?: string[];
}

interface Crab {
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
}

export default class BeachScene extends Phaser.Scene {
  // ── Player ───────────────────────────────────────────────────────────────
  private player!: Phaser.Physics.Arcade.Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private iKey!: Phaser.Input.Keyboard.Key;

  private currentDir = 'south';
  private animFrame  = 0;
  private animTimer  = 0;

  // ── Pickup animation ────────────────────────────────────────────────────
  private isPickingUp  = false;
  private pickupFrame  = 0;
  private pickupTimer  = 0;

  // ── Waves ────────────────────────────────────────────────────────────────
  private waveRects: { rect: Phaser.GameObjects.Rectangle; speed: number }[] = [];

  // ── Ground items ─────────────────────────────────────────────────────────
  private groundItems: GroundItem[] = [];
  private inventory: Record<string, number> = {};

  // ── Crabs ────────────────────────────────────────────────────────────────
  private crabs: Crab[] = [];
  private battlePending = false;

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

  // ── Inventory panel ──────────────────────────────────────────────────────
  private invContainer!: Phaser.GameObjects.Container;
  private invOpen = false;

  // ── Starter picker ───────────────────────────────────────────────────────
  private starterPicked      = false;
  private starterPickerOpen  = false;
  private starterOverlay!:   Phaser.GameObjects.Container;
  private starterSelection   = 1; // 1, 2, or 3
  private chestContainer!:   Phaser.GameObjects.Container;
  private readonly chestX    = 640;
  private readonly chestY    = 480;

  // ── Palm tree colliders ──────────────────────────────────────────────────
  private palmColliders!: Phaser.Physics.Arcade.StaticGroup;

  // Extra key refs used by the starter picker
  private oneKey!:   Phaser.Input.Keyboard.Key;
  private twoKey!:   Phaser.Input.Keyboard.Key;
  private threeKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'Beach' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════════════════════
  create() {
    this.battlePending    = false;
    this.starterPicked    = false;
    this.starterPickerOpen = false;

    // ── Background image (sky + sand + ocean) ─────────────────────────────
    this.add.image(W / 2, H / 2, 'bg-beach').setDisplaySize(W, H).setDepth(0);
    // Mask the thick pixel-art horizon line baked into bg image
    this.add.rectangle(W / 2, SAND_TOP, W, 6, 0xf0e8d8).setDepth(0.5);

    // ── Surf edge highlight (animated feel on top of bg) ──────────────────
    this.add.rectangle(W / 2, WATER_TOP,     W, 3, 0xffffff, 0.6).setDepth(1);
    this.add.rectangle(W / 2, WATER_TOP + 7, W, 2, 0xffffff, 0.3).setDepth(1);

    // ── Animated wave bands ────────────────────────────────────────────────
    this.createWaves();

    // ── Beach scenery (palms, rocks, dock) ────────────────────────────────
    this.drawBeachScenery();

    // ── Palm tree colliders ────────────────────────────────────────────────
    this.palmColliders = this.physics.add.staticGroup();
    const palmTrunks: { x: number; y: number }[] = [
      { x: 100,  y: 440 },
      { x: 1175, y: 430 },
      { x: 1085, y: 445 },
    ];
    palmTrunks.forEach(pt => {
      const box = this.add.rectangle(pt.x, pt.y, 20, 30, 0x000000, 0) as unknown as Phaser.Physics.Arcade.Image;
      this.physics.add.existing(box, true);
      this.palmColliders.add(box);
    });

    // ── Player ────────────────────────────────────────────────────────────
    this.player = this.physics.add.sprite(W / 2, 480, 'pirate-idle-south-0');
    this.player.setDisplaySize(64, 64);
    this.player.setDepth(5);
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(WALK_MIN_X, WALK_MIN_Y, WALK_MAX_X - WALK_MIN_X, WALK_MAX_Y - WALK_MIN_Y);
    this.physics.add.collider(this.player, this.palmColliders);

    // ── Shadow ────────────────────────────────────────────────────────────
    this.shadow = this.add.ellipse(this.player.x, this.player.y + 28, 28, 7, 0x000000, 0.20);
    this.shadow.setDepth(4);

    // ── Items ─────────────────────────────────────────────────────────────
    this.spawnGroundItems();

    // ── Starter chest (crabs are NOT spawned until starter is picked) ──────
    this.createStarterChest();

    // ── Dock sign ─────────────────────────────────────────────────────────
    this.createDockSign();

    // ── Dialogue box ──────────────────────────────────────────────────────
    this.createDialogueBox();

    // ── Inventory panel ───────────────────────────────────────────────────
    this.createInventoryPanel();

    // ── Starter picker overlay (hidden until chest is opened) ─────────────
    this.createStarterPickerUI();

    // ── Input ─────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey  = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.iKey      = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.oneKey    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.twoKey    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.threeKey  = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);

    // ── Starter party ─────────────────────────────────────────────────────
    this.initParty();

    // ── Camera ────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  // ── Lifecycle: resume from Battle ───────────────────────────────────────
  resume() {
    this.battlePending = false;
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WAVE SETUP
  // ═══════════════════════════════════════════════════════════════════════════
  private createWaves() {
    const configs: { color: number; alpha: number; h: number; speed: number; delay: number }[] = [
      { color: 0x3dc4ce, alpha: 0.40, h: 5, speed: 22,  delay: 0   },
      { color: 0xffffff, alpha: 0.22, h: 3, speed: -16, delay: 200 },
      { color: 0x2dafb8, alpha: 0.30, h: 3, speed: 28,  delay: 400 },
      { color: 0x3dc4ce, alpha: 0.35, h: 4, speed: -20, delay: 150 },
      { color: 0xaaeef0, alpha: 0.20, h: 3, speed: 18,  delay: 300 },
      { color: 0x2dafb8, alpha: 0.28, h: 3, speed: -24, delay: 500 },
    ];
    configs.forEach((c, i) => {
      const y = WATER_TOP + 15 + i * 20;
      const rect = this.add.rectangle(W / 2, y, W, c.h, c.color, c.alpha);
      rect.setDepth(1);
      this.waveRects.push({ rect, speed: c.speed });
      // Subtle lateral tween for gentle wave motion
      this.tweens.add({
        targets: rect,
        x:     { from: W / 2 - 18, to: W / 2 + 18 },
        alpha: { from: c.alpha * 0.4, to: c.alpha },
        duration: 1100 + i * 280,
        yoyo:  true,
        repeat: -1,
        ease:  'Sine.easeInOut',
        delay: c.delay,
      });
    });

    // Foam dots at water's edge
    for (let i = 0; i < 22; i++) {
      const fx = (i / 22) * W + Math.random() * 40;
      const foam = this.add.circle(fx, WATER_TOP + 2, 2 + Math.floor(Math.random() * 3), 0xffffff, 0.55);
      foam.setDepth(2);
      this.tweens.add({
        targets: foam,
        alpha: { from: 0.55, to: 0.05 },
        scaleX: { from: 1, to: 1.8 },
        scaleY: { from: 1, to: 0.6 },
        duration: 700 + Math.random() * 1000,
        delay: Math.random() * 2500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BEACH SCENERY
  // ═══════════════════════════════════════════════════════════════════════════
  private drawBeachScenery() {
    // Palms
    this.add.image(100,  390, 'palm-tree').setDisplaySize(110, 190).setDepth(2).setAngle(-10);
    this.add.image(1175, 375, 'palm-tree').setDisplaySize(110, 190).setDepth(2).setAngle(12);
    this.add.image(1085, 395, 'palm-tree').setDisplaySize( 95, 165).setDepth(2).setAngle(-6);

    // Rock clusters
    this.drawRocks(215, 528);
    this.drawRocks(962, 518);
    this.drawRocks(585, 548);

    // Dock
    this.drawDock(620, 558);

    // Sand details (shells, pebbles, starfish, seaweed)
    this.drawSandDetails();
  }

  private drawRocks(cx: number, cy: number) {
    const rocks: [number, number, number, number, number][] = [
      [  0,  0, 28, 18, 0x9a8878],
      [ 18, -5, 20, 14, 0xa09888],
      [-12,  3, 16, 12, 0x887870],
    ];
    rocks.forEach(([ox, oy, rw, rh, col]) => {
      // Drop shadow
      this.add.ellipse(cx + ox + 2, cy + oy + 3, rw - 2, rh - 2, 0x6a5850, 0.35).setDepth(1);
      // Rock body
      this.add.ellipse(cx + ox, cy + oy, rw, rh, col).setDepth(2);
      // Highlight
      this.add.ellipse(cx + ox - 3, cy + oy - 3, Math.floor(rw * 0.38), Math.floor(rh * 0.4), 0xc8b8a8, 0.5).setDepth(2);
    });
  }

  private drawDock(cx: number, cy: number) {
    // Sand-level planks
    for (let i = 0; i < 7; i++) {
      const p = this.add.rectangle(cx - 90 + i * 30, cy, 26, 14, 0x8b5e3c);
      p.setStrokeStyle(1, 0x5a3a1a);
      p.setDepth(3);
    }
    // Posts
    [-80, -20, 40, 100].forEach(px => {
      this.add.rectangle(cx + px, cy + 18, 8, 30, 0x5a3a1a).setDepth(3);
    });
    // Water extension (lower depth — behind waves)
    for (let i = 0; i < 5; i++) {
      const p = this.add.rectangle(cx - 80 + i * 30, cy + 36, 26, 14, 0x7a5030, 0.82);
      p.setDepth(0.5);
    }
  }

  private drawSandDetails() {
    // Scattered shells
    [
      {x: 155, y: 542}, {x: 310, y: 556}, {x: 442, y: 522},
      {x: 695, y: 547}, {x: 782, y: 532}, {x: 912, y: 558},
      {x: 1030, y: 537}, {x: 1145, y: 549}, {x: 252, y: 565},
      {x: 490, y: 540}, {x: 860, y: 560}, {x: 1080, y: 522},
    ].forEach(({x, y}) => {
      this.add.ellipse(x, y, 8, 5, 0xe8d8c0).setDepth(2);
      this.add.ellipse(x + 1, y - 1, 4, 3, 0xd4b890, 0.7).setDepth(2);
    });

    // Pebble clusters
    [
      {cx: 375, cy: 562}, {cx: 718, cy: 542}, {cx: 955, cy: 560},
      {cx: 145, cy: 530}, {cx: 1120, cy: 540},
    ].forEach(({cx, cy}) => {
      [[0, 0, 3, 0xb0a090], [7, 1, 2, 0xa09080], [3, 5, 3, 0xc0b0a0], [10, 4, 2, 0x907060]].forEach(([px, py, r, c]) => {
        this.add.circle(cx + px, cy + py, r, c).setDepth(2);
      });
    });

    // Starfish near water edge
    [{x: 545, y: 568}, {x: 838, y: 570}, {x: 200, y: 572}].forEach(({x, y}) => {
      this.add.circle(x, y, 4, 0xe05828, 0.8).setDepth(2);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        this.add.circle(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 3, 0xe05828, 0.75).setDepth(2);
      }
    });

    // Seaweed patches at water edge
    [{x: 195, y: 572}, {x: 475, y: 574}, {x: 1005, y: 573}, {x: 1140, y: 571}].forEach(({x, y}) => {
      this.add.ellipse(x, y, 14, 6, 0x2a5a2a, 0.65).setDepth(2);
      this.add.ellipse(x + 9, y - 2, 10, 5, 0x1e4820, 0.5).setDepth(2);
    });

    // Driftwood logs
    [{x: 130, y: 508, a: -18}, {x: 1095, y: 525, a: 12}].forEach(({x, y, a}) => {
      this.add.rectangle(x, y, 32, 8, 0x7a4820, 0.7).setAngle(a).setDepth(2);
      this.add.rectangle(x, y, 28, 6, 0x9a6030, 0.5).setAngle(a).setDepth(2);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCK SIGN
  // ═══════════════════════════════════════════════════════════════════════════
  private createDockSign() {
    const sx = 530, sy = 548;
    this.add.rectangle(sx, sy + 10, 6, 30, 0x5a3a1a).setDepth(3);
    this.add.rectangle(sx, sy - 8, 80, 28, 0x8b6b4d)
      .setStrokeStyle(2, 0x5a3a1a)
      .setDepth(3);
    this.add.text(sx, sy - 8, 'DOCK', {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '7px',
      color: '#f0e8d8',
    }).setOrigin(0.5).setDepth(4);

    // Register as interactive sign
    const placeholder = this.add.container(sx, sy).setDepth(3);
    const sign: GroundItem = {
      id: 'sign_dock',
      name: 'Dock Sign',
      x: sx, y: sy,
      container: placeholder,
      collected: false,
      isSign: true,
      signLines: [
        "Old Pete's Fishing Dock",
        "Your fish crew awaits.",
        "Walk to the water's edge",
        "and press SPACE to fish!",
      ],
    };
    this.groundItems.push(sign);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STARTER CHEST
  // ═══════════════════════════════════════════════════════════════════════════
  private createStarterChest() {
    const cx = this.chestX;
    const cy = this.chestY;

    this.chestContainer = this.add.container(cx, cy).setDepth(3);

    // Drop shadow
    const shadow = this.add.ellipse(1, 14, 32, 8, 0x000000, 0.22);
    // Chest body (brown rectangle)
    const body = this.add.rectangle(0, 3, 28, 22, 0x7a4820);
    body.setStrokeStyle(1, 0x3a2008);
    // Golden lid
    const lid = this.add.rectangle(0, -8, 28, 10, 0xc8900a);
    lid.setStrokeStyle(1, 0x7a5500);
    // Lid highlight
    const lidHighlight = this.add.rectangle(0, -10, 22, 4, 0xffe066, 0.55);
    // Dark latch
    const latch = this.add.rectangle(0, 1, 6, 5, 0x3a2008);
    latch.setStrokeStyle(1, 0xc8900a);
    // Keyhole dot
    const keyhole = this.add.circle(0, 1, 1, 0xffe066);

    this.chestContainer.add([shadow, body, lid, lidHighlight, latch, keyhole]);

    // Pulsing glow to attract player
    const glow = this.add.ellipse(cx, cy, 44, 20, 0xffe066, 0.3).setDepth(2);
    this.tweens.add({
      targets: glow,
      alpha:  { from: 0.10, to: 0.55 },
      scaleX: { from: 0.8, to: 1.3 },
      duration: 900,
      yoyo:  true,
      repeat: -1,
      ease:  'Sine.easeInOut',
    });

    // "PRESS SPACE" hint text above chest
    const hintText = this.add.text(cx, cy - 28, 'PRESS SPACE', {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '7px',
      color:      '#ffe066',
    }).setOrigin(0.5).setDepth(4);
    this.tweens.add({
      targets: hintText,
      alpha:   { from: 0.3, to: 1.0 },
      duration: 700,
      yoyo:    true,
      repeat:  -1,
      ease:    'Sine.easeInOut',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STARTER PICKER UI
  // ═══════════════════════════════════════════════════════════════════════════
  private createStarterPickerUI() {
    this.starterOverlay = this.add.container(W / 2, H / 2).setDepth(30);

    // Full dark overlay
    const bg = this.add.rectangle(0, 0, W, H, 0x000000, 0.82);

    // Title
    const title = this.add.text(0, -280, 'CHOOSE YOUR STARTER', {
      fontFamily: 'PixelPirate, monospace',
      fontSize:   '36px',
      color:      '#ffe066',
    }).setOrigin(0.5);

    // Hint
    const hint = this.add.text(0, -240, 'Press 1  2  3  to choose', {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '14px',
      color:      '#f0e8d8',
    }).setOrigin(0.5);

    // Build 3 option cards
    const starters = [
      { num: 1, name: 'Clownfin',    type: 'FIRE',   color: 0xe05020, hp: 55, textureKey: 'fish-1-04', fallbackColor: 0xe05020 },
      { num: 2, name: 'Tidecrawler', type: 'WATER',  color: 0x2060c0, hp: 62, textureKey: 'fish-1-05', fallbackColor: 0x2060c0 },
      { num: 3, name: 'Mosscale',    type: 'NATURE', color: 0x208020, hp: 58, textureKey: 'fish-1-08', fallbackColor: 0x208020 },
    ];

    const cardObjs: Phaser.GameObjects.Container[] = [];

    starters.forEach((s, i) => {
      const offX = (i - 1) * 360;
      const card = this.add.container(offX, 20);

      // Card background
      const cardBg = this.add.rectangle(0, 0, 300, 360, 0x3d1a10);
      cardBg.setStrokeStyle(3, s.color);

      // Number label top-left
      const numTxt = this.add.text(-138, -162, `[${s.num}]`, {
        fontFamily: 'PokemonDP, monospace',
        fontSize:   '16px',
        color:      '#ffe066',
      }).setOrigin(0, 0);

      // Fish image or fallback circle
      let fishVisual: Phaser.GameObjects.GameObject;
      if (this.textures.exists(s.textureKey)) {
        fishVisual = this.add.image(0, -60, s.textureKey).setDisplaySize(180, 180);
      } else {
        fishVisual = this.add.circle(0, -60, 70, s.fallbackColor);
        (fishVisual as Phaser.GameObjects.Arc).setStrokeStyle(2, 0xffffff);
      }

      // Fish name
      const nameTxt = this.add.text(0, 70, s.name.toUpperCase(), {
        fontFamily: 'PixelPirate, monospace',
        fontSize:   '20px',
        color:      '#f0e8d8',
      }).setOrigin(0.5);

      // Type badge
      const badgeBg = this.add.rectangle(0, 120, 140, 28, s.color);
      const badgeTxt = this.add.text(0, 120, s.type, {
        fontFamily: 'PokemonDP, monospace',
        fontSize:   '14px',
        color:      '#ffffff',
      }).setOrigin(0.5);

      // HP/stats hint
      const statsTxt = this.add.text(0, 150, `HP: ${s.hp}  LV: 5`, {
        fontFamily: 'PokemonDP, monospace',
        fontSize:   '11px',
        color:      '#c8b890',
      }).setOrigin(0.5);

      card.add([cardBg, numTxt, fishVisual, nameTxt, badgeBg, badgeTxt, statsTxt]);
      cardObjs.push(card);
    });

    // Selection starts on option 1
    this.starterSelection = 1;

    this.starterOverlay.add([bg, title, hint, ...cardObjs]);
    this.starterOverlay.setVisible(false);

    // Stash card refs for highlight updates (bg is at index 0 in each card)
    this.starterOverlay.setData('cards', cardObjs);
  }

  private showStarterPicker() {
    this.starterPickerOpen = true;
    this.starterSelection  = 1;
    this.starterOverlay.setVisible(true);
    this.player.setVelocity(0, 0);
    this.updateStarterHighlight();
  }

  private updateStarterHighlight() {
    const cards = this.starterOverlay.getData('cards') as Phaser.GameObjects.Container[];
    if (!cards) return;
    cards.forEach((card, i) => {
      const cardBg = card.getAt(0) as Phaser.GameObjects.Rectangle;
      const selected = i === this.starterSelection - 1;
      cardBg.setStrokeStyle(selected ? 4 : 2, selected ? 0xffe066 : 0x5a3a1a);
      card.setScale(selected ? 1.06 : 0.94);
    });
  }

  private confirmStarterPick() {
    if (!this.starterPickerOpen) return;

    const starterDefs = [
      { name: 'Clownfin',    speciesId: 4,  moves: ['flame_jet', 'tackle'],    hp: 55, type: 'Fire'   },
      { name: 'Tidecrawler', speciesId: 5,  moves: ['bubble_burst', 'tackle'], hp: 62, type: 'Water'  },
      { name: 'Mosscale',    speciesId: 14, moves: ['coral_bloom', 'tackle'],  hp: 58, type: 'Nature' },
    ];
    const def = starterDefs[this.starterSelection - 1];

    const starterFish: FishInstance = {
      uid:       `starter_${Date.now()}`,
      speciesId: def.speciesId,
      nickname:  def.name,
      level:     5,
      xp:        0,
      currentHp: def.hp,
      maxHp:     def.hp,
      moves:     def.moves,
      iv:        { hp: 10, attack: 8, defense: 8, speed: 8 },
    };

    this.registry.set('party', [starterFish]);

    // Close the overlay
    this.starterPickerOpen = false;
    this.starterPicked     = true;
    this.starterOverlay.setVisible(false);

    // Remove chest
    this.chestContainer.setVisible(false);

    // Spawn crabs now that starter is picked
    this.spawnCrabs();

    // Show dialogue
    this.openDialogue([`${def.name} joined your crew!`, 'Watch out — crabs on the beach!']);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUND ITEMS
  // ═══════════════════════════════════════════════════════════════════════════
  private spawnGroundItems() {
    const defs = [
      { id: 'wood',  name: 'Driftwood', x: 360, y: 508 },
      { id: 'rope',  name: 'Old Rope',  x: 825, y: 490 },
      { id: 'bait',  name: 'Bait Bag',  x: 668, y: 522 },
    ];
    const hasItemSprites = this.textures.exists('item-wood');
    defs.forEach(def => {
      const container = this.add.container(def.x, def.y).setDepth(3);
      const glow = this.add.ellipse(0, 4, 38, 14, 0xffe066, 0.35);

      if (hasItemSprites) {
        const icon = this.add.image(0, -4, `item-${def.id}`).setScale(0.09);
        container.add([glow, icon]);
      } else {
        const xMark = this.add.text(0, 0, '✕', {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#ffe066',
        }).setOrigin(0.5);
        xMark.setShadow(0, 0, '#ffe066', 8, true, true);
        container.add([glow, xMark]);
      }

      this.tweens.add({
        targets: glow,
        alpha:  { from: 0.1, to: 0.6 },
        scaleX: { from: 0.85, to: 1.2 },
        duration: 900,
        yoyo:  true,
        repeat: -1,
        ease:  'Sine.easeInOut',
        delay: Math.random() * 400,
      });

      this.groundItems.push({ id: def.id, name: def.name, x: def.x, y: def.y, container, collected: false });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRABS  (only called after starter is picked)
  // ═══════════════════════════════════════════════════════════════════════════
  private spawnCrabs() {
    const defs = [
      { x: 285, y: 538, minX: 185, maxX: 445 },
      { x: 905, y: 522, minX: 780, maxX: 1055 },
    ];
    const hasSprites = this.textures.exists('crab-basic-east');

    defs.forEach(def => {
      const container = this.add.container(def.x, def.y).setDepth(4);
      let sprite: Phaser.GameObjects.Sprite | undefined;

      if (hasSprites) {
        sprite = this.add.sprite(0, 0, 'crab-basic-east');
        sprite.setScale(0.18);
        container.add([sprite]);
      } else {
        // Procedural fallback
        const body = this.add.ellipse(0, 0, 28, 20, 0xcc5500);
        body.setStrokeStyle(1, 0x882200);
        const eye1 = this.add.circle(-7, -7, 3, 0x111111);
        const eye2 = this.add.circle( 7, -7, 3, 0x111111);
        const legObjs: Phaser.GameObjects.Rectangle[] = [];
        for (let i = 0; i < 3; i++) {
          const ll = this.add.rectangle(-16 - i * 4, 5 + i * 2, 3, 12, 0xaa4400);
          ll.setAngle(-25 - i * 8);
          const rl = this.add.rectangle( 16 + i * 4, 5 + i * 2, 3, 12, 0xaa4400);
          rl.setAngle( 25 + i * 8);
          legObjs.push(ll, rl);
        }
        const clawL = this.add.ellipse(-18, -4, 12, 8, 0xcc5500);
        clawL.setStrokeStyle(1, 0x882200);
        const clawR = this.add.ellipse( 18, -4, 12, 8, 0xcc5500);
        clawR.setStrokeStyle(1, 0x882200);
        container.add([body, eye1, eye2, ...legObjs, clawL, clawR]);
      }

      this.crabs.push({
        container, sprite,
        x: def.x, y: def.y,
        minX: def.minX, maxX: def.maxX,
        dir: 1,
        speed: 50 + Math.random() * 25,
        defeated: false,
        animFrame: 0,
        animTimer: 0,
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DIALOGUE BOX
  // ═══════════════════════════════════════════════════════════════════════════
  private createDialogueBox() {
    const cx = W / 2;
    const cy = H - 95;
    const bw = W - 40;
    const bh = 120;

    this.dlgContainer = this.add.container(cx, cy).setDepth(20);

    const bg = this.add.rectangle(0, 0, bw, bh, 0xf0e8d8);
    bg.setStrokeStyle(4, 0x5a3a1a);

    // Wooden border strips (added to container so they move with it)
    const stripColor = 0x8b6b4d;
    const s1 = this.add.rectangle(0, -bh / 2 + 4, bw, 8, stripColor);
    const s2 = this.add.rectangle(0,  bh / 2 - 4, bw, 8, stripColor);
    const s3 = this.add.rectangle(-bw / 2 + 4, 0, 8, bh, stripColor);
    const s4 = this.add.rectangle( bw / 2 - 4, 0, 8, bh, stripColor);

    this.dlgText = this.add.text(-bw / 2 + 20, -bh / 2 + 16, '', {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '11px',
      color:      '#2c1011',
      wordWrap:   { width: bw - 48 },
      lineSpacing: 7,
    });

    const prompt = this.add.text(bw / 2 - 20, bh / 2 - 16, '▼', {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '10px',
      color:      '#8b6b4d',
    }).setOrigin(1, 1);

    this.dlgContainer.add([bg, s1, s2, s3, s4, this.dlgText, prompt]);
    this.dlgContainer.setVisible(false);

    this.tweens.add({
      targets: prompt,
      y: { from: bh / 2 - 16, to: bh / 2 - 10 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INVENTORY PANEL
  // ═══════════════════════════════════════════════════════════════════════════
  private createInventoryPanel() {
    this.invContainer = this.add.container(W / 2, H / 2).setDepth(25);

    const bg = this.add.rectangle(0, 0, 400, 360, 0xf0e8d8);
    bg.setStrokeStyle(4, 0x5a3a1a);
    const header = this.add.rectangle(0, -162, 400, 36, 0x8b6b4d);
    const title  = this.add.text(0, -162, 'INVENTORY', {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '10px',
      color:      '#f0e8d8',
    }).setOrigin(0.5);
    const hint = this.add.text(0, 162, '[I] CLOSE', {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '8px',
      color:      '#8b6b4d',
    }).setOrigin(0.5);

    this.invContainer.add([bg, header, title, hint]);
    this.invContainer.setVisible(false);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STARTER PARTY (fallback if no chest flow yet)
  // ═══════════════════════════════════════════════════════════════════════════
  private initParty() {
    // If party already set (e.g. via chest), don't overwrite
    if (this.registry.has('party')) {
      this.inventory = (this.registry.get('inventory') as Record<string, number>) || {};
      return;
    }
    // No party set — player will pick via chest; set empty party for now
    this.registry.set('party', []);
    this.inventory = (this.registry.get('inventory') as Record<string, number>) || {};
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════════════════════
  update(_time: number, delta: number) {
    if (!this.player) return;

    // Space just-pressed detection
    const spaceDown     = this.spaceKey.isDown;
    const spaceJustDown = spaceDown && !this.spacePrev;
    this.spacePrev = spaceDown;

    // ── Starter picker takes full control ──────────────────────────────────
    if (this.starterPickerOpen) {
      this.tickStarterPicker(spaceJustDown);
      return;
    }

    // I key — toggle inventory
    if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
      this.toggleInventory();
      return;
    }
    if (this.invOpen) return;

    // Dialogue takes over movement
    if (this.dlgOpen) {
      this.tickDialogue(delta, spaceJustDown);
      return;
    }

    if (this.isPickingUp) {
      this.tickPickup(delta);
      return;
    }

    this.handleMovement(delta);
    this.updateCrabs(delta);
    this.checkCrabCollisions();
    this.checkSpaceActions(spaceJustDown);
    this.depthSort();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STARTER PICKER TICK
  // ═══════════════════════════════════════════════════════════════════════════
  private tickStarterPicker(spaceJustDown: boolean) {
    // Number keys 1/2/3 for direct pick
    if (Phaser.Input.Keyboard.JustDown(this.oneKey)) {
      this.starterSelection = 1;
      this.updateStarterHighlight();
      this.confirmStarterPick();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.twoKey)) {
      this.starterSelection = 2;
      this.updateStarterHighlight();
      this.confirmStarterPick();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.threeKey)) {
      this.starterSelection = 3;
      this.updateStarterHighlight();
      this.confirmStarterPick();
      return;
    }

    // A/D to cycle selection
    if (Phaser.Input.Keyboard.JustDown(this.wasd.A) || Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      this.starterSelection = Math.max(1, this.starterSelection - 1);
      this.updateStarterHighlight();
    }
    if (Phaser.Input.Keyboard.JustDown(this.wasd.D) || Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      this.starterSelection = Math.min(3, this.starterSelection + 1);
      this.updateStarterHighlight();
    }

    // Space/Enter to confirm current selection
    if (spaceJustDown) {
      this.confirmStarterPick();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOVEMENT & ANIMATION
  // ═══════════════════════════════════════════════════════════════════════════
  private handleMovement(delta: number) {
    const speed = 150;
    let vx = 0, vy = 0;
    const L = this.cursors.left?.isDown  || this.wasd.A.isDown;
    const R = this.cursors.right?.isDown || this.wasd.D.isDown;
    const U = this.cursors.up?.isDown    || this.wasd.W.isDown;
    const D = this.cursors.down?.isDown  || this.wasd.S.isDown;

    if (L) vx = -speed; else if (R) vx = speed;
    if (U) vy = -speed; else if (D) vy = speed;

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

    this.player.setVelocity(vx, vy);
    this.tickAnim(vx !== 0 || vy !== 0, delta);

    // Shadow at bottom of sprite
    const feet = this.player.y + this.player.displayHeight * 0.45;
    this.shadow.setPosition(this.player.x, feet);
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

  private tickPickup(delta: number) {
    this.pickupTimer += delta;
    if (this.pickupTimer >= 90) {
      this.pickupTimer = 0;
      this.pickupFrame++;
    }
    const pDir = ['east', 'west'].includes(this.currentDir) ? this.currentDir : 'south';
    if (this.pickupFrame < 5) {
      this.player.setTexture(`pirate-pickup-${pDir}-${this.pickupFrame}`);
      this.player.setVelocity(0, 0);
    } else {
      this.isPickingUp  = false;
      this.pickupFrame  = 0;
      this.pickupTimer  = 0;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRAB PATROL
  // ═══════════════════════════════════════════════════════════════════════════
  private updateCrabs(delta: number) {
    for (const c of this.crabs) {
      if (c.defeated) continue;
      c.x += c.dir * c.speed * (delta / 1000);
      if (c.x >= c.maxX) { c.x = c.maxX; c.dir = -1; }
      if (c.x <= c.minX) { c.x = c.minX; c.dir =  1; }
      c.container.setPosition(c.x, c.y);

      if (c.sprite) {
        // Always use east texture; flip horizontally for west direction
        c.sprite.setTexture('crab-basic-east');
        c.sprite.setFlipX(c.dir < 0);
        c.container.setScale(1, 1);
      } else {
        c.container.setScale(c.dir < 0 ? -1 : 1, 1);
      }
    }
  }

  private checkCrabCollisions() {
    if (this.battlePending) return;
    if (!this.starterPicked) return; // no crabs before starter pick
    const px = this.player.x, py = this.player.y;
    for (const c of this.crabs) {
      if (c.defeated) continue;
      if (Math.hypot(c.x - px, c.y - py) < 38) {
        this.triggerBattle(c);
        return;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SPACE INTERACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  private checkSpaceActions(spaceJustDown: boolean) {
    if (!spaceJustDown) return;

    // Guard: starter picker is handled in tickStarterPicker, not here
    if (this.starterPickerOpen) return;

    const px = this.player.x, py = this.player.y;
    const RANGE = 68;

    // Chest interaction (only if starter not yet picked)
    if (!this.starterPicked) {
      if (Math.hypot(this.chestX - px, this.chestY - py) < RANGE) {
        this.showStarterPicker();
        return;
      }
    }

    // Ground items & signs
    for (const item of this.groundItems) {
      if (item.collected) continue;
      if (Math.hypot(item.x - px, item.y - py) < RANGE) {
        if (item.isSign && item.signLines) {
          this.openDialogue(item.signLines);
        } else {
          this.collectItem(item);
        }
        return;
      }
    }

    // Fishing zone
    if (py > WATER_TOP - 35) {
      this.openDialogue([
        'The ocean shimmers with life.',
        'Fishing minigame — coming soon!',
        'Your crew is waiting...',
      ]);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ITEM COLLECT
  // ═══════════════════════════════════════════════════════════════════════════
  private collectItem(item: GroundItem) {
    item.collected = true;
    item.container.setVisible(false);
    this.inventory[item.id] = (this.inventory[item.id] || 0) + 1;
    this.registry.set('inventory', this.inventory);
    this.player.setVelocity(0, 0);
    this.isPickingUp = true;
    this.pickupFrame = 0;
    this.pickupTimer = 0;
    this.openDialogue([`Found ${item.name}!`]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BATTLE TRIGGER
  // ═══════════════════════════════════════════════════════════════════════════
  private triggerBattle(crab: Crab) {
    this.battlePending = true;
    crab.defeated = true;
    crab.container.setVisible(false);

    const crabEnemy: FishInstance = {
      uid:       'crab_' + Date.now(),
      speciesId:  0,
      nickname:  'Beach Crab',
      level:      3,
      xp:         0,
      currentHp:  30,
      maxHp:      30,
      moves:      ['tackle'],
      iv:         { hp: 5, attack: 5, defense: 5, speed: 5 },
    };

    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.launch('Battle', {
        enemyName:  'Beach Crab',
        enemyParty: [crabEnemy],
        returnScene: 'Beach',
      });
      this.scene.pause();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DIALOGUE
  // ═══════════════════════════════════════════════════════════════════════════
  private openDialogue(lines: string[]) {
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
      if (this.dlgChars >= this.dlgFull.length) {
        this.dlgTyping = false;
      }
      if (spaceJustDown) { // Space skips typing
        this.dlgChars = this.dlgFull.length;
        this.dlgText.setText(this.dlgFull);
        this.dlgTyping = false;
      }
    } else if (spaceJustDown) {
      this.advanceDlg();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INVENTORY UI
  // ═══════════════════════════════════════════════════════════════════════════
  private toggleInventory() {
    this.invOpen = !this.invOpen;
    this.invContainer.setVisible(this.invOpen);
    if (this.invOpen) {
      this.player.setVelocity(0, 0);
      this.refreshInventoryUI();
    }
  }

  private refreshInventoryUI() {
    // Remove old item rows (keep first 4: bg, header, title, hint)
    while (this.invContainer.length > 4) {
      this.invContainer.removeAt(4, true);
    }
    const entries = Object.entries(this.inventory);
    if (entries.length === 0) {
      this.invContainer.add(
        this.add.text(0, 10, '(empty)', {
          fontFamily: 'PokemonDP, monospace',
          fontSize: '9px',
          color: '#8b6b4d',
        }).setOrigin(0.5)
      );
    } else {
      entries.forEach(([id, qty], i) => {
        this.invContainer.add(
          this.add.text(-160, -100 + i * 32, `${id.padEnd(8).toUpperCase()}  x${qty}`, {
            fontFamily: 'PokemonDP, monospace',
            fontSize: '9px',
            color: '#2c1011',
          })
        );
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPTH SORT
  // ═══════════════════════════════════════════════════════════════════════════
  private depthSort() {
    // Objects with higher y appear in front
    const d = 4 + this.player.y * 0.001;
    this.player.setDepth(d);
    this.shadow.setDepth(d - 0.1);
  }
}
