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
  x: number;
  y: number;
  minX: number;
  maxX: number;
  dir: 1 | -1;
  speed: number;
  defeated: boolean;
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

  constructor() {
    super({ key: 'Beach' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════════════════════
  create() {
    this.battlePending = false;

    // ── Sky gradient (layered rects, lightest near horizon) ────────────────
    this.add.rectangle(W / 2, H * 0.08,  W, H * 0.16, 0xd96040); // deep coral
    this.add.rectangle(W / 2, H * 0.22,  W, H * 0.18, 0xec8855); // mid coral
    this.add.rectangle(W / 2, H * 0.35,  W, H * 0.18, 0xf4a76d); // orange
    this.add.rectangle(W / 2, H * 0.46,  W, H * 0.14, 0xffc88a); // warm peach
    this.add.rectangle(W / 2, SAND_TOP - 30, W, 60, 0xffd59e);   // pale near horizon

    // ── Distant ocean strip (horizon) ──────────────────────────────────────
    this.add.rectangle(W / 2, SAND_TOP - 5, W, 18, 0x1b8a96);

    // ── Sand ───────────────────────────────────────────────────────────────
    this.add.rectangle(W / 2, (SAND_TOP + WATER_TOP) / 2, W, WATER_TOP - SAND_TOP, 0xf0e8d8);

    // ── Surf edge highlight ────────────────────────────────────────────────
    this.add.rectangle(W / 2, WATER_TOP,     W, 3, 0xffffff, 0.6).setDepth(1);
    this.add.rectangle(W / 2, WATER_TOP + 7, W, 2, 0xffffff, 0.3).setDepth(1);

    // ── Ocean base ────────────────────────────────────────────────────────
    this.add.rectangle(W / 2, (WATER_TOP + H) / 2, W, H - WATER_TOP, 0x2dafb8);
    this.add.rectangle(W / 2, H - 30, W, 60, 0x1b8a96);

    // ── Sand horizon edge ─────────────────────────────────────────────────
    this.add.rectangle(W / 2, SAND_TOP + 2, W, 4, 0xe0d4b0, 0.5);

    // ── Animated wave bands ────────────────────────────────────────────────
    this.createWaves();

    // ── Beach scenery (palms, rocks, dock) ────────────────────────────────
    this.drawBeachScenery();

    // ── Player ────────────────────────────────────────────────────────────
    this.player = this.physics.add.sprite(W / 2, 480, 'pirate-idle-south-0');
    this.player.setDepth(5);
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(WALK_MIN_X, WALK_MIN_Y, WALK_MAX_X - WALK_MIN_X, WALK_MAX_Y - WALK_MIN_Y);

    // ── Shadow ────────────────────────────────────────────────────────────
    this.shadow = this.add.ellipse(this.player.x, this.player.y + 24, 36, 9, 0x000000, 0.22);
    this.shadow.setDepth(4);

    // ── Items ─────────────────────────────────────────────────────────────
    this.spawnGroundItems();

    // ── Crabs ─────────────────────────────────────────────────────────────
    this.spawnCrabs();

    // ── Dock sign ─────────────────────────────────────────────────────────
    this.createDockSign();

    // ── Dialogue box ──────────────────────────────────────────────────────
    this.createDialogueBox();

    // ── Inventory panel ───────────────────────────────────────────────────
    this.createInventoryPanel();

    // ── Input ─────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.iKey     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);

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
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BEACH SCENERY
  // ═══════════════════════════════════════════════════════════════════════════
  private drawBeachScenery() {
    // Palms
    this.drawPalm(100,  490, -10);
    this.drawPalm(1175, 480,  12);
    this.drawPalm(1085, 510,  -6);

    // Rock clusters
    this.drawRocks(215, 528);
    this.drawRocks(962, 518);
    this.drawRocks(585, 548);

    // Dock
    this.drawDock(620, 558);
  }

  private drawPalm(x: number, baseY: number, lean: number) {
    const trunk = this.add.rectangle(x, baseY - 40, 10, 100, 0x5a3a1a);
    trunk.setAngle(lean);
    trunk.setDepth(2);
    const fronds: [number, number, number, number][] = [
      [-30, -82, 68, 18],
      [  6, -88, 78, 20],
      [ 36, -76, 62, 16],
      [-14, -92, 52, 14],
    ];
    fronds.forEach(([ox, oy, fw, fh]) => {
      this.add.ellipse(x + ox, baseY + oy, fw, fh, 0x1a5025, 0.85).setDepth(2);
    });
  }

  private drawRocks(cx: number, cy: number) {
    const sizes: [number, number, number, number][] = [
      [  0,  0, 28, 18],
      [ 18, -5, 20, 14],
      [-12,  3, 16, 12],
    ];
    sizes.forEach(([ox, oy, rw, rh]) => {
      this.add.ellipse(cx + ox, cy + oy, rw, rh, 0xa09080).setDepth(2);
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
      fontFamily: '"Press Start 2P", monospace',
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
  // GROUND ITEMS
  // ═══════════════════════════════════════════════════════════════════════════
  private spawnGroundItems() {
    const defs = [
      { id: 'wood',  name: 'Driftwood', x: 360, y: 508 },
      { id: 'rope',  name: 'Old Rope',  x: 825, y: 490 },
      { id: 'bait',  name: 'Bait Bag',  x: 668, y: 522 },
    ];
    defs.forEach(def => {
      const container = this.add.container(def.x, def.y).setDepth(3);
      const glow = this.add.ellipse(0, 4, 38, 14, 0xffe066, 0.35);
      const xMark = this.add.text(0, 0, '✕', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffe066',
      }).setOrigin(0.5);
      xMark.setShadow(0, 0, '#ffe066', 8, true, true);
      container.add([glow, xMark]);

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
  // CRABS
  // ═══════════════════════════════════════════════════════════════════════════
  private spawnCrabs() {
    const defs = [
      { x: 285, y: 538, minX: 185, maxX: 445 },
      { x: 905, y: 522, minX: 780, maxX: 1055 },
    ];
    defs.forEach(def => {
      const container = this.add.container(def.x, def.y).setDepth(4);
      // Body
      const body = this.add.ellipse(0, 0, 28, 20, 0xcc5500);
      body.setStrokeStyle(1, 0x882200);
      // Eyes
      const eye1 = this.add.circle(-7, -7, 3, 0x111111);
      const eye2 = this.add.circle( 7, -7, 3, 0x111111);
      // Legs (3 per side)
      const legObjs: Phaser.GameObjects.Rectangle[] = [];
      for (let i = 0; i < 3; i++) {
        const ll = this.add.rectangle(-16 - i * 4, 5 + i * 2, 3, 12, 0xaa4400);
        ll.setAngle(-25 - i * 8);
        const rl = this.add.rectangle( 16 + i * 4, 5 + i * 2, 3, 12, 0xaa4400);
        rl.setAngle( 25 + i * 8);
        legObjs.push(ll, rl);
      }
      // Claws
      const clawL = this.add.ellipse(-18, -4, 12, 8, 0xcc5500);
      clawL.setStrokeStyle(1, 0x882200);
      const clawR = this.add.ellipse( 18, -4, 12, 8, 0xcc5500);
      clawR.setStrokeStyle(1, 0x882200);
      container.add([body, eye1, eye2, ...legObjs, clawL, clawR]);

      this.crabs.push({
        container,
        x: def.x, y: def.y,
        minX: def.minX, maxX: def.maxX,
        dir: 1,
        speed: 50 + Math.random() * 25,
        defeated: false,
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

    // Wooden border strips
    const stripColor = 0x8b6b4d;
    this.add.rectangle(0, -bh / 2 + 4, bw, 8, stripColor);
    this.add.rectangle(0,  bh / 2 - 4, bw, 8, stripColor);
    this.add.rectangle(-bw / 2 + 4, 0, 8, bh, stripColor);
    this.add.rectangle( bw / 2 - 4, 0, 8, bh, stripColor);

    this.dlgText = this.add.text(-bw / 2 + 20, -bh / 2 + 16, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '11px',
      color:      '#2c1011',
      wordWrap:   { width: bw - 48 },
      lineSpacing: 7,
    });

    const prompt = this.add.text(bw / 2 - 20, bh / 2 - 16, '▼', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '10px',
      color:      '#8b6b4d',
    }).setOrigin(1, 1);

    this.dlgContainer.add([bg, this.dlgText, prompt]);
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
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '10px',
      color:      '#f0e8d8',
    }).setOrigin(0.5);
    const hint = this.add.text(0, 162, '[I] CLOSE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '8px',
      color:      '#8b6b4d',
    }).setOrigin(0.5);

    this.invContainer.add([bg, header, title, hint]);
    this.invContainer.setVisible(false);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STARTER PARTY
  // ═══════════════════════════════════════════════════════════════════════════
  private initParty() {
    if (!this.registry.has('party')) {
      const starter: FishInstance = {
        uid:       'starter_001',
        speciesId:  4, // Tidecaller (Water)
        level:      5,
        xp:         0,
        currentHp:  62,
        maxHp:      62,
        moves:      ['tackle', 'bubble_burst'],
        iv:         { hp: 10, attack: 8, defense: 12, speed: 6 },
      };
      this.registry.set('party', [starter]);
    }
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
    const feet = this.player.y + this.player.displayHeight * 0.48;
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
      // Mirror on direction change
      c.container.setScale(c.dir < 0 ? -1 : 1, 1);
    }
  }

  private checkCrabCollisions() {
    if (this.battlePending) return;
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
    const px = this.player.x, py = this.player.y;
    const RANGE = 68;

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
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '9px',
          color: '#8b6b4d',
        }).setOrigin(0.5)
      );
    } else {
      entries.forEach(([id, qty], i) => {
        this.invContainer.add(
          this.add.text(-160, -100 + i * 32, `${id.padEnd(8).toUpperCase()}  x${qty}`, {
            fontFamily: '"Press Start 2P", monospace',
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
