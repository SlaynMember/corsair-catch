import { FishInstance, FISH_SPECIES } from '../data/fish-db';
import { FISH_SPRITE_DB, FishSpriteData } from '../data/fish-sprite-db';
import { FISHING_ZONES, rollFishFromZone } from '../data/fishing-zones';
import { loadGame, saveFromScene, startAutoSave, deleteSave, SaveData } from '../systems/SaveSystem';
import { SHIPS, ShipBlueprint } from '../data/ship-db';
import { rollBeach1Enemy } from '../data/beach-enemies';
import MobileInput from '../systems/MobileInput';

// ── Layout constants ─────────────────────────────────────────────────────────
const W = 1280;
const H = 720;
const SAND_TOP    = 320;   // y where sky ends / sand begins (stretched dreamy bg)
const WATER_TOP   = 540;   // y where sand ends / ocean begins
const WALK_MIN_X  = 70;
const WALK_MAX_X  = 1210;
const WALK_MIN_Y  = SAND_TOP + 30;   // 350 — player feet stay below horizon
const WALK_MAX_Y  = WATER_TOP - 15;  // 525 — player stays on sand

// ── Ship unlock tiers (fish caught thresholds) ────────────────────────────────
const SHIP_UNLOCK_TIERS: { minIndex: number; maxIndex: number; fishRequired: number }[] = [
  { minIndex: 0,  maxIndex: 0,  fishRequired: 0  },  // ship-00: free starter
  { minIndex: 1,  maxIndex: 4,  fishRequired: 5  },  // ship-01 to ship-04
  { minIndex: 5,  maxIndex: 9,  fishRequired: 15 },  // ship-05 to ship-09
  { minIndex: 10, maxIndex: 14, fishRequired: 30 },  // ship-10 to ship-14
  { minIndex: 15, maxIndex: 19, fishRequired: 50 },  // ship-15 to ship-19
];

function isShipUnlocked(spriteIndex: number, fishCaught: number): boolean {
  for (const tier of SHIP_UNLOCK_TIERS) {
    if (spriteIndex >= tier.minIndex && spriteIndex <= tier.maxIndex) {
      return fishCaught >= tier.fishRequired;
    }
  }
  return false;
}

function getUnlockRequirement(spriteIndex: number): number {
  for (const tier of SHIP_UNLOCK_TIERS) {
    if (spriteIndex >= tier.minIndex && spriteIndex <= tier.maxIndex) {
      return tier.fishRequired;
    }
  }
  return 999;
}

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

interface BeachEnemy {
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
  private pickupPendingMessage: string | null = null;

  // ── Waves ────────────────────────────────────────────────────────────────
  private waveRects: { rect: Phaser.GameObjects.Rectangle; speed: number }[] = [];

  // ── Ground items ─────────────────────────────────────────────────────────
  private groundItems: GroundItem[] = [];
  private inventory: Record<string, number> = {};

  // ── Crabs ────────────────────────────────────────────────────────────────
  private enemies: BeachEnemy[] = [];
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
  private dlgTapped  = false;
  private talkTapped = false;
  private fishTapped = false;

  // ── Inventory panel ──────────────────────────────────────────────────────
  private invContainer!: Phaser.GameObjects.Container;
  private invOpen = false;

  // ── Starter picker ───────────────────────────────────────────────────────
  private starterPicked      = false;
  private starterPickerOpen  = false;
  private starterOverlay!:   Phaser.GameObjects.Container;
  private starterSelection   = 1; // 1, 2, or 3
  private chestContainer!:   Phaser.GameObjects.Container;
  private readonly chestX    = 440;
  private readonly chestY    = 460;
  private chestGlow?:        Phaser.GameObjects.Ellipse;
  private chestHint?:        Phaser.GameObjects.Text;
  private sailHint?:         Phaser.GameObjects.Text;

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

  // ── "Completely Normal Crab" NPC ──────────────────────────────────────
  private captainContainer!: Phaser.GameObjects.Container;
  private captainSprite!: Phaser.GameObjects.Image;
  private readonly captainX = 280;
  private readonly captainY = 410;
  private captainTalked = false;
  private captainPaceDir: 'left' | 'right' | 'idle' = 'right';
  private captainPaceTimer = 0;
  private captainAnimFrame = 0;
  private captainAnimTimer = 0;

  // ── Talk overlay (portrait dialogue) ─────────────────────────────────
  private talkOpen = false;
  private talkOverlay!: Phaser.GameObjects.Container;
  private talkText!: Phaser.GameObjects.Text;
  private talkSpeaker!: Phaser.GameObjects.Text;
  private talkMenuItems: Phaser.GameObjects.Container[] = [];
  private talkMenuCursor = 0;
  private talkPhase: 'dialogue' | 'menu' = 'dialogue';
  private talkDlgQueue: string[] = [];
  private talkDlgFull = '';
  private talkDlgChars = 0;
  private talkDlgTimer = 0;
  private talkDlgTyping = false;
  private talkSpeakerName = '';
  private talkClosing = false;
  private talkPirateImg?: Phaser.GameObjects.Image;
  private talkCrabImg?: Phaser.GameObjects.Image;
  private talkActiveSpeaker: 'pirate' | 'crab' = 'crab';

  // ── Sailing transition ──────────────────────────────────────────────────
  private sailTransitioning = false;

  // ── Ship selection ──────────────────────────────────────────────────────
  private shipOverlay!: Phaser.GameObjects.Container;
  private shipOpen = false;
  private shipCursor = 0;
  private shipPage   = 0;
  private pKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  // ── Save system ────────────────────────────────────────────────────────
  private playtime       = 0;
  private f5Key!:        Phaser.Input.Keyboard.Key;
  private autoSaveTimer?: Phaser.Time.TimerEvent;
  private pendingSave?:  SaveData;

  // ── Palm tree colliders ──────────────────────────────────────────────────
  private palmColliders!: Phaser.Physics.Arcade.StaticGroup;

  // ── Mobile input ──────────────────────────────────────────────────────
  private mobileInput?: MobileInput;
  private mobileBackBtn?: Phaser.GameObjects.Container;

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
  private spawnFrom?: string;

  create(data?: { from?: string }) {
    this.battlePending     = false;
    this.starterPicked     = false;
    this.starterPickerOpen = false;
    this.sailTransitioning = false;
    this.isFishing         = false;
    this.dlgOpen           = false;
    this.isPickingUp       = false;
    this.invOpen           = false;
    this.shipOpen          = false;
    this.talkOpen          = false;
    this.enemies           = [];
    this.groundItems       = [];
    this.waveRects         = [];
    this.spawnFrom = data?.from;

    // ── Background image (sky + sand + ocean) ─────────────────────────────
    this.add.image(W / 2, H / 2, 'bg-beach').setDisplaySize(W, H).setDepth(0);
    // (horizon line mask removed — new dreamy bg has smooth gradient)

    // ── Animated water layers (spritesheet-matched style) ──────────────────
    this.createWaves();

    // ── Beach scenery (palms, rocks, shells) ───────────────────────────────
    this.drawBeachScenery();

    // ── Colliders (palms + right barricade) ─────────────────────────────
    this.palmColliders = this.physics.add.staticGroup();
    // Palm trunks
    const palmTrunks: { x: number; y: number }[] = [
      { x: 100,  y: 390 },
      { x: 1175, y: 380 },
      { x: 1085, y: 395 },
    ];
    palmTrunks.forEach(pt => {
      const box = this.add.rectangle(pt.x, pt.y, 20, 30, 0x000000, 0) as unknown as Phaser.Physics.Arcade.Image;
      this.physics.add.existing(box, true);
      this.palmColliders.add(box);
    });
    // Right barricade collider — upper crate wall only, open passage below
    const barricadeBlocks: { x: number; y: number; w: number; h: number }[] = [
      { x: 1170, y: 375, w: 90, h: 50 },   // upper wall (y 350-400)
    ];
    barricadeBlocks.forEach(b => {
      const box = this.add.rectangle(b.x, b.y, b.w, b.h, 0x000000, 0) as unknown as Phaser.Physics.Arcade.Image;
      this.physics.add.existing(box, true);
      this.palmColliders.add(box);
    });

    // ── Player ────────────────────────────────────────────────────────────
    const spawnX = this.spawnFrom === 'right' ? WALK_MAX_X - 40 : W / 2;
    this.player = this.physics.add.sprite(spawnX, 460, 'pirate-idle-south-0');
    this.player.setDisplaySize(64, 64);
    this.player.setDepth(5);

    // Physics body = small box at feet (16×8), offset to bottom of sprite
    // Native sprite is 32×32 displayed at 64×64. Feet are at ~row 28/32 = 56/64px
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(16, 8);        // small collision box at feet
    body.setOffset(8, 28);      // offset to bottom of native 32×32 sprite (feet area)

    // World bounds — top is higher so the player's HEAD (not feet) can overlap the horizon
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(WALK_MIN_X, WALK_MIN_Y, WALK_MAX_X - WALK_MIN_X, WALK_MAX_Y - WALK_MIN_Y);
    this.physics.add.collider(this.player, this.palmColliders);

    // ── Shadow (at character feet: sprite center + 16px) ──────────────────
    this.shadow = this.add.ellipse(this.player.x, this.player.y + 16, 28, 7, 0x000000, 0.20);
    this.shadow.setDepth(4);

    // ── Items ─────────────────────────────────────────────────────────────
    this.spawnGroundItems();

    // ── Starter chest (crabs are NOT spawned until starter is picked) ──────
    this.createStarterChest();

    // (No dock on Beach 1 — fishing and sailing happen on Beach 2)

    // ── Captain NPC ──────────────────────────────────────────────────────
    this.createCaptainNPC();

    // ── Dialogue box ──────────────────────────────────────────────────────
    this.createDialogueBox();

    // ── Talk overlay (portrait dialogue with crab NPC) ───────────────────
    this.createTalkOverlay();

    // ── Inventory panel ───────────────────────────────────────────────────
    this.createInventoryPanel();

    // ── Fishing overlay ───────────────────────────────────────────────────
    this.createFishingOverlay();

    // ── Starter picker overlay (hidden until chest is opened) ─────────────
    this.createStarterPickerUI();

    // ── Ship selection overlay ───────────────────────────────────────────
    this.createShipSelectionUI();

    // ── HUD buttons (top-right) ──────────────────────────────────────────
    this.createHUD();

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
    this.pKey      = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.escKey    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.f5Key     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F5);

    // ── Check for pending save data (passed from MainMenu CONTINUE) ─────
    this.pendingSave = this.registry.get('_pendingSave') as SaveData | undefined;
    if (this.pendingSave) {
      this.registry.remove('_pendingSave');
    }

    // ── Starter party ─────────────────────────────────────────────────────
    this.initParty();

    // ── Restore from save ──────────────────────────────────────────────────
    if (this.pendingSave) {
      this.restoreFromSave(this.pendingSave);
      this.pendingSave = undefined;
    }

    // ── Auto-save timer (every 60s) ─────────────────────────────────────
    this.autoSaveTimer = startAutoSave(
      this,
      () => ({ x: this.player.x, y: this.player.y }),
      () => this.starterPicked,
      () => this.playtime,
    );

    // ── Camera ────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // ── Resume handler (fade back in after returning from BattleScene) ───
    this.events.on('resume', () => this.onResume());

    // ── Shutdown cleanup ────────────────────────────────────────────────
    this.events.once('shutdown', () => {
      this.tweens.killAll();
      this.time.removeAllEvents();
      this.mobileInput?.destroy();
    });

    // ── Mobile input (joystick + action button) ─────────────────────────
    if (MobileInput.IS_MOBILE) {
      this.mobileInput = new MobileInput(this);
      this.mobileInput.showContextButtons('overworld');

      // Tap-to-advance for dialogue and talk overlay
      this.input.on('pointerdown', () => {
        if (this.dlgOpen)  this.dlgTapped  = true;
        if (this.talkOpen) this.talkTapped = true;
        if (this.isFishing) this.fishTapped = true;
      });

      this.buildMobileButtons();
    }

    // ── Cleanup on shutdown ─────────────────────────────────────────────
    this.events.on('shutdown', () => {
      this.mobileInput?.destroy();
      this.mobileInput = undefined;
    });
  }

  // ── Lifecycle: resume from Battle ───────────────────────────────────────
  private onResume() {
    this.battlePending = false;
    this.isFishing     = false;
    this.dlgOpen       = false;
    this.isPickingUp   = false;
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.mobileInput?.showContextButtons('overworld');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WAVE SETUP
  // ═══════════════════════════════════════════════════════════════════════════
  private createWaves() {
    const waterH = H - WATER_TOP; // total water height

    // ── Wet sand shadow (dark strip where water laps onto sand) ──────────
    const wetSand = this.add.rectangle(W / 2, WATER_TOP - 3, W, 8, 0xc4a882, 0.35);
    wetSand.setDepth(0.8);
    this.tweens.add({
      targets: wetSand,
      alpha: { from: 0.35, to: 0.15 },
      scaleY: { from: 1, to: 0.6 },
      duration: 2400,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // ── Wide gradient bands (spritesheet style: layered teal → deep blue) ─
    // Colors sampled from the reference spritesheet
    const bands: { color: number; alpha: number; yOff: number; h: number; delay: number }[] = [
      { color: 0x6dd4d8, alpha: 0.30, yOff: 0,   h: 18, delay: 0    },  // light cyan shore
      { color: 0x45bcc4, alpha: 0.35, yOff: 16,  h: 22, delay: 150  },  // mid teal
      { color: 0x2dafb8, alpha: 0.40, yOff: 36,  h: 26, delay: 300  },  // teal
      { color: 0x1f8a96, alpha: 0.45, yOff: 60,  h: 30, delay: 200  },  // dark teal
      { color: 0x1a6e80, alpha: 0.40, yOff: 88,  h: 32, delay: 400  },  // deep blue-teal
      { color: 0x155a6a, alpha: 0.35, yOff: 118, h: waterH - 118, delay: 100 }, // deepest
    ];

    bands.forEach((b, i) => {
      const y = WATER_TOP + b.yOff + b.h / 2;
      const rect = this.add.rectangle(W / 2, y, W + 40, b.h, b.color, b.alpha);
      rect.setDepth(1);
      this.waveRects.push({ rect, speed: (i % 2 === 0 ? 1 : -1) * (12 + i * 3) });

      // Gentle lateral drift + subtle vertical bob + alpha pulse
      this.tweens.add({
        targets: rect,
        x: { from: W / 2 - 10 - i * 2, to: W / 2 + 10 + i * 2 },
        y: { from: y - 2, to: y + 2 },
        alpha: { from: b.alpha * 0.65, to: b.alpha },
        duration: 2200 + i * 400,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: b.delay,
      });
    });

    // ── Foam edge (organic white line at waterline) ─────────────────────
    const foam = this.add.graphics().setDepth(2);
    const drawFoam = (offsetY: number, alpha: number) => {
      foam.clear();
      foam.fillStyle(0xffffff, alpha);
      foam.beginPath();
      foam.moveTo(0, WATER_TOP + offsetY + 4);
      // Jagged organic foam line across the screen
      for (let x = 0; x <= W; x += 16) {
        const jag = Math.sin(x * 0.04 + offsetY * 0.5) * 3
                  + Math.sin(x * 0.09) * 2
                  + Math.cos(x * 0.015 + offsetY * 0.3) * 2;
        foam.lineTo(x, WATER_TOP + offsetY + jag);
      }
      foam.lineTo(W, WATER_TOP + offsetY + 8);
      foam.lineTo(0, WATER_TOP + offsetY + 8);
      foam.closePath();
      foam.fillPath();

      // Thin secondary foam line
      foam.fillStyle(0xffffff, alpha * 0.4);
      foam.beginPath();
      foam.moveTo(0, WATER_TOP + offsetY + 12);
      for (let x = 0; x <= W; x += 20) {
        const jag = Math.sin(x * 0.06 + offsetY * 0.7 + 1.5) * 2
                  + Math.cos(x * 0.03) * 1.5;
        foam.lineTo(x, WATER_TOP + offsetY + 10 + jag);
      }
      foam.lineTo(W, WATER_TOP + offsetY + 16);
      foam.lineTo(0, WATER_TOP + offsetY + 16);
      foam.closePath();
      foam.fillPath();
    };

    // Animate foam with a slow sine offset
    let foamTime = 0;
    this.time.addEvent({
      delay: 80,
      loop: true,
      callback: () => {
        foamTime += 0.08;
        const yOff = Math.sin(foamTime * 0.4) * 3;
        const a = 0.5 + Math.sin(foamTime * 0.25) * 0.15;
        drawFoam(yOff, a);
      },
    });

    // ── Gentle shore foam animation (soft white lines lapping at the shore) ──
    for (let i = 0; i < 4; i++) {
      const foamY = WATER_TOP - 5 + i * 8;
      const foamLine = this.add.rectangle(
        W / 2 + (i % 2 ? 30 : -30), foamY,
        W * 0.7 - i * 80, 2,
        0xffffff, 0.3 - i * 0.05
      );
      foamLine.setDepth(1);
      this.tweens.add({
        targets: foamLine,
        x: foamLine.x + (i % 2 ? -40 : 40),
        alpha: foamLine.alpha * 0.5,
        duration: 3000 + i * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 400,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BEACH SCENERY
  // ═══════════════════════════════════════════════════════════════════════════
  private drawBeachScenery() {
    // Palms (with gentle sway animation)
    const palms = [
      this.add.image(100,  310, 'palm-tree').setDisplaySize(128, 190).setDepth(2).setAngle(-10),
      this.add.image(1175, 300, 'palm-tree').setDisplaySize(128, 190).setDepth(2).setAngle(12),
      this.add.image(1085, 320, 'palm-tree').setDisplaySize(111, 165).setDepth(2).setAngle(-6),
    ];
    palms.forEach((palm, i) => {
      const base = palm.angle;
      this.tweens.add({
        targets: palm,
        angle: base + 3,
        duration: 2200 + i * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 300,
      });
    });

    // Rock clusters
    this.drawRocks(215, 480);
    this.drawRocks(962, 475);
    this.drawRocks(585, 490);

    // "SAIL →" hint — hidden until starter fish is picked
    this.sailHint = this.add.text(1120, 460, 'SAIL \u2192', {
      fontFamily: 'PokemonDP, monospace', fontSize: '16px',
      color: '#ffe066', stroke: '#2c1011', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6).setVisible(false);

    // Sand details (shells, pebbles, starfish, seaweed)
    this.drawSandDetails();

    // ── Decorative sprite props ─────────────────────────────────────────
    // Shells scattered across the sand (dense scatter for beach feel)
    if (this.textures.exists('env-shell-1')) {
      // Left beach area
      this.add.image(120, 400, 'env-shell-1').setDisplaySize(16, 16).setDepth(2).setAngle(40);
      this.add.image(160, 420, 'env-shell-2').setDisplaySize(16, 16).setDepth(2).setAngle(-20);
      this.add.image(205, 445, 'env-shell-3').setDisplaySize(13, 18).setDepth(2).setAngle(12);
      this.add.image(240, 460, 'env-shell-3').setDisplaySize(16, 22).setDepth(2).setAngle(-5);
      this.add.image(310, 430, 'env-shell-1').setDisplaySize(20, 20).setDepth(2);
      this.add.image(370, 470, 'env-shell-2').setDisplaySize(15, 15).setDepth(2).setAngle(22);
      // Center-left
      this.add.image(420, 410, 'env-shell-3').setDisplaySize(13, 18).setDepth(2).setAngle(30);
      this.add.image(465, 480, 'env-shell-1').setDisplaySize(12, 12).setDepth(2).setAngle(-15);
      this.add.image(500, 450, 'env-shell-3').setDisplaySize(16, 22).setDepth(2).setAngle(-10);
      this.add.image(545, 435, 'env-shell-2').setDisplaySize(14, 14).setDepth(2).setAngle(50);
      // Center-right
      this.add.image(650, 465, 'env-shell-1').setDisplaySize(16, 16).setDepth(2).setAngle(-35);
      this.add.image(730, 415, 'env-shell-3').setDisplaySize(12, 17).setDepth(2).setAngle(18);
      this.add.image(780, 440, 'env-shell-2').setDisplaySize(18, 18).setDepth(2).setAngle(15);
      // Right beach area
      this.add.image(830, 475, 'env-shell-1').setDisplaySize(14, 14).setDepth(2).setAngle(-28);
      this.add.image(860, 405, 'env-shell-1').setDisplaySize(14, 14).setDepth(2).setAngle(45);
      this.add.image(910, 455, 'env-shell-1').setDisplaySize(18, 18).setDepth(2).setAngle(25);
      this.add.image(955, 490, 'env-shell-2').setDisplaySize(12, 12).setDepth(2).setAngle(-38);
      this.add.image(1000, 470, 'env-shell-3').setDisplaySize(14, 20).setDepth(2).setAngle(-18);
      this.add.image(1050, 425, 'env-shell-2').setDisplaySize(20, 20).setDepth(2).setAngle(10);
      this.add.image(1100, 485, 'env-shell-1').setDisplaySize(15, 15).setDepth(2).setAngle(33);
      // (shell at 1160,450 removed — replaced by gap-hint shells in barricade section)
      // Near water edge (smaller, partially buried look)
      this.add.image(180, 500, 'env-shell-2').setDisplaySize(10, 10).setDepth(2).setAngle(60).setAlpha(0.7);
      this.add.image(350, 495, 'env-shell-1').setDisplaySize(11, 11).setDepth(2).setAngle(-42).setAlpha(0.7);
      this.add.image(580, 505, 'env-shell-3').setDisplaySize(11, 15).setDepth(2).setAngle(25).setAlpha(0.65);
      this.add.image(750, 498, 'env-shell-2').setDisplaySize(10, 10).setDepth(2).setAngle(-55).setAlpha(0.7);
      this.add.image(940, 510, 'env-shell-1').setDisplaySize(11, 11).setDepth(2).setAngle(35).setAlpha(0.65);
    }
    // ── Right-side barricade (single crate-stack asset, open passage below to Beach2) ──
    if (this.textures.exists('env-crate-stack')) {
      this.add.image(1170, 375, 'env-crate-stack').setDisplaySize(100, 95).setDepth(4 + 375 * 0.001);
    } else if (this.textures.exists('env-crate')) {
      // Fallback to individual crates if stack asset missing
      this.add.image(1150, 390, 'env-crate').setDisplaySize(48, 45).setDepth(4 + 390 * 0.001);
      this.add.image(1192, 390, 'env-crate').setDisplaySize(48, 45).setDepth(4 + 390 * 0.001);
      this.add.image(1170, 352, 'env-crate').setDisplaySize(42, 39).setDepth(4 + 352 * 0.001);
    }

    // ── Left-side anchor (decorative, in front of left palm) ──
    if (this.textures.exists('env-anchor')) {
      this.add.image(155, 470, 'env-anchor').setDisplaySize(32, 38).setDepth(4 + 470 * 0.001).setAngle(-12);
    }
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

  private drawSandDetails() {
    // Scattered shells
    [
      {x: 155, y: 410}, {x: 310, y: 450}, {x: 442, y: 400},
      {x: 695, y: 465}, {x: 782, y: 430}, {x: 912, y: 490},
      {x: 1030, y: 440}, {x: 252, y: 500},
      {x: 490, y: 420}, {x: 860, y: 485}, {x: 1080, y: 405},
    ].forEach(({x, y}) => {
      this.add.ellipse(x, y, 8, 5, 0xe8d8c0).setDepth(2);
      this.add.ellipse(x + 1, y - 1, 4, 3, 0xd4b890, 0.7).setDepth(2);
    });

    // Pebble clusters
    [
      {cx: 375, cy: 470}, {cx: 718, cy: 440}, {cx: 955, cy: 500},
      {cx: 145, cy: 420}, {cx: 1120, cy: 460},
    ].forEach(({cx, cy}) => {
      [[0, 0, 3, 0xb0a090], [7, 1, 2, 0xa09080], [3, 5, 3, 0xc0b0a0], [10, 4, 2, 0x907060]].forEach(([px, py, r, c]) => {
        this.add.circle(cx + px, cy + py, r, c).setDepth(2);
      });
    });

    // Starfish near water edge
    [{x: 545, y: 505}, {x: 838, y: 510}, {x: 200, y: 515}].forEach(({x, y}) => {
      this.add.circle(x, y, 4, 0xe05828, 0.8).setDepth(2);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        this.add.circle(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 3, 0xe05828, 0.75).setDepth(2);
      }
    });

    // Seaweed patches at water edge
    [{x: 195, y: 512}, {x: 475, y: 516}, {x: 1005, y: 514}].forEach(({x, y}) => {
      this.add.ellipse(x, y, 14, 6, 0x2a5a2a, 0.65).setDepth(2);
      this.add.ellipse(x + 9, y - 2, 10, 5, 0x1e4820, 0.5).setDepth(2);
    });

    // Driftwood logs
    [{x: 130, y: 445, a: -18}, {x: 1095, y: 455, a: 12}].forEach(({x, y, a}) => {
      this.add.rectangle(x, y, 32, 8, 0x7a4820, 0.7).setAngle(a).setDepth(2);
      this.add.rectangle(x, y, 28, 6, 0x9a6030, 0.5).setAngle(a).setDepth(2);
    });
  }

  // (Dock removed from Beach 1 — fishing and sailing happen on Beach 2)

  // ═══════════════════════════════════════════════════════════════════════════
  // CAPTAIN NPC
  // ═══════════════════════════════════════════════════════════════════════════
  private createCaptainNPC() {
    const cx = this.captainX;
    const cy = this.captainY;

    this.captainContainer = this.add.container(cx, cy).setDepth(4);

    // Shadow — at feet (y=26 for 64×64 displayed crab sprite)
    const shadow = this.add.ellipse(0, 26, 28, 7, 0x000000, 0.20);

    // Crab sprite (displayed at 64×64 to match player scale)
    this.captainSprite = this.add.image(0, 0, 'normal-crab-idle-south-0');
    this.captainSprite.setDisplaySize(64, 64);

    this.captainContainer.add([shadow, this.captainSprite]);

    // Label above head
    const label = this.add.text(cx, cy - 42, 'Completely Normal Crab', {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '18px',
      color: '#f0e8d8',
      stroke: '#2c1011',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // Store label for pacing updates
    this.captainContainer.setData('label', label);
  }

  /** Tick the NPC pacing + animation in update loop */
  private tickCaptainNPC(delta: number) {
    this.captainPaceTimer += delta;
    this.captainAnimTimer += delta;

    // Pace cycle: idle 2s → walk right 2s → idle 2s → walk left 2s
    const cycle = this.captainPaceTimer % 8000;
    if (cycle < 2000)      this.captainPaceDir = 'idle';
    else if (cycle < 4000) this.captainPaceDir = 'right';
    else if (cycle < 6000) this.captainPaceDir = 'idle';
    else                   this.captainPaceDir = 'left';

    // Animate
    if (this.captainAnimTimer >= 160) {
      this.captainAnimTimer = 0;
      this.captainAnimFrame = (this.captainAnimFrame + 1) % 4;
    }

    // Set texture + move
    if (this.captainPaceDir === 'idle') {
      const key = `normal-crab-idle-south-${this.captainAnimFrame}`;
      if (this.textures.exists(key)) this.captainSprite.setTexture(key);
      this.captainSprite.setFlipX(false);
    } else if (this.captainPaceDir === 'right') {
      // Mirror the west walk for walking right
      const key = `normal-crab-walk-west-${this.captainAnimFrame}`;
      if (this.textures.exists(key)) this.captainSprite.setTexture(key);
      this.captainSprite.setFlipX(true);
      this.captainContainer.x += 0.4;
    } else {
      const key = `normal-crab-walk-west-${this.captainAnimFrame}`;
      if (this.textures.exists(key)) this.captainSprite.setTexture(key);
      this.captainSprite.setFlipX(false);
      this.captainContainer.x -= 0.4;
    }

    // Keep label above
    const label = this.captainContainer.getData('label') as Phaser.GameObjects.Text;
    if (label) label.setPosition(this.captainContainer.x, this.captainContainer.y - 38);
  }

  private talkToCaptain() {
    const greeting = !this.captainTalked
      ? [
          "*snaps claws together* Greetings, fellow crustacean!",
          "I am a completely normal crab, as you can see.",
          "Hatched from an egg and everything. Classic crab stuff.",
        ]
      : ["*adjusts crab suit* Oh hey! It's my favorite crab!"];

    this.captainTalked = true;

    if (!this.starterPicked) {
      this.openTalkOverlay('Completely Normal Crab', [
        ...greeting,
        "Hey, I think I saw a treasure chest wash up!",
        "Go check it out — might be something useful in there!",
      ]);
      this.talkClosing = true;  // no menu before starter is picked
    } else {
      this.openTalkOverlay('Completely Normal Crab', [
        ...greeting,
        "So what do you want to talk about?",
      ]);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STARTER CHEST
  // ═══════════════════════════════════════════════════════════════════════════
  private createStarterChest() {
    const cx = this.chestX;
    const cy = this.chestY;

    this.chestContainer = this.add.container(cx, cy).setDepth(3);

    // Chest sprite (AI-generated) or procedural fallback — smaller to fit beach
    if (this.textures.exists('item-chest')) {
      const chestImg = this.add.image(0, -4, 'item-chest').setDisplaySize(36, 33);
      this.chestContainer.add([chestImg]);
    } else {
      const shadow = this.add.ellipse(1, 14, 24, 6, 0x000000, 0.22);
      const body = this.add.rectangle(0, 3, 22, 18, 0x7a4820);
      body.setStrokeStyle(1, 0x3a2008);
      const lid = this.add.rectangle(0, -6, 22, 8, 0xc8900a);
      lid.setStrokeStyle(1, 0x7a5500);
      const latch = this.add.rectangle(0, 1, 5, 4, 0x3a2008);
      latch.setStrokeStyle(1, 0xc8900a);
      this.chestContainer.add([shadow, body, lid, latch]);
    }

    // Pulsing glow to attract player (stored for cleanup)
    this.chestGlow = this.add.ellipse(cx, cy, 36, 16, 0xffe066, 0.3).setDepth(2);
    this.tweens.add({
      targets: this.chestGlow,
      alpha:  { from: 0.10, to: 0.55 },
      scaleX: { from: 0.8, to: 1.3 },
      duration: 900,
      yoyo:  true,
      repeat: -1,
      ease:  'Sine.easeInOut',
    });

    // "PRESS SPACE" hint text above chest (stored for cleanup)
    this.chestHint = this.add.text(cx, cy - 30, 'PRESS SPACE', {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '18px',
      color: '#f0e8d8',
      stroke: '#2c1011',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4);
    this.tweens.add({
      targets: this.chestHint,
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
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Hint
    const pickerHintStr = MobileInput.IS_MOBILE
      ? 'TAP a card to choose'
      : 'Press 1  2  3  to choose';
    const hint = this.add.text(0, -240, pickerHintStr, {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '14px',
      color:      '#f0e8d8',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Build 3 option cards
    const starters = [
      { num: 1, name: 'Emberkoi',    type: 'FIRE',   color: 0xe05020, hp: 55, textureKey: 'fish-1-04', fallbackColor: 0xe05020 },
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

      // Fish image or fallback circle — with idle bob animation
      let fishVisual: Phaser.GameObjects.GameObject;
      if (this.textures.exists(s.textureKey)) {
        const fishImg = this.add.image(0, -60, s.textureKey);
        const ftw = fishImg.width, fth = fishImg.height;
        const fScale = Math.min(180 / ftw, 180 / fth);
        fishImg.setDisplaySize(ftw * fScale, fth * fScale);
        fishVisual = fishImg;
        // Idle bob
        this.tweens.add({
          targets: fishImg,
          y: fishImg.y - 8,
          duration: 1200 + i * 300,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        // Subtle breathing scale
        this.tweens.add({
          targets: fishImg,
          scaleX: fishImg.scaleX * 1.04,
          scaleY: fishImg.scaleY * 0.96,
          duration: 1600 + i * 200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: 300,
        });
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
      const statsTxt = this.add.text(0, 155, `HP: ${s.hp}  LV: 5`, {
        fontFamily: 'PokemonDP, monospace',
        fontSize:   '16px',
        color:      '#c8b890',
      }).setOrigin(0.5);

      card.add([cardBg, numTxt, fishVisual, nameTxt, badgeBg, badgeTxt, statsTxt]);

      // Mobile: single tap on any card to pick it directly
      if (MobileInput.IS_MOBILE) {
        cardBg.setInteractive(
          new Phaser.Geom.Rectangle(-150, -180, 300, 360),
          Phaser.Geom.Rectangle.Contains
        );
        cardBg.on('pointerdown', () => {
          if (!this.starterPickerOpen) return;
          this.starterSelection = i + 1;
          this.updateStarterHighlight();
          this.confirmStarterPick();
        });
      }

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
    // Disable MobileInput so joystick/action button don't steal taps from cards
    this.mobileInput?.setEnabled(false);
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
      { name: 'Emberkoi',    speciesId: 1,  moves: ['flame_jet', 'tackle'],    hp: 55, type: 'Fire'   },
      { name: 'Tidecrawler', speciesId: 5,  moves: ['bubble_burst', 'tackle'], hp: 62, type: 'Water'  },
      { name: 'Mosscale',    speciesId: 12, moves: ['coral_bloom', 'tackle'],  hp: 58, type: 'Nature' },
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
    // Re-enable MobileInput
    this.mobileInput?.setEnabled(true);

    // Remove chest + glow + hint
    this.chestContainer.setVisible(false);
    if (this.chestGlow)  { this.chestGlow.destroy();  this.chestGlow = undefined; }
    if (this.chestHint)  { this.chestHint.destroy();  this.chestHint = undefined; }

    // Spawn crabs now that starter is picked
    this.spawnEnemies();

    // Show SAIL hint now that starter is picked
    if (this.sailHint) this.sailHint.setVisible(true);

    // Show dialogue
    this.openDialogue([`${def.name} joined your crew!`, 'Watch out — crabs on the beach!']);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUND ITEMS
  // ═══════════════════════════════════════════════════════════════════════════
  private spawnGroundItems() {
    const defs = [
      { id: 'wood',   name: 'Driftwood',       x: 340, y: 390 },
      { id: 'rope',   name: 'Old Rope',        x: 680, y: 410 },
      { id: 'bait',   name: 'Bait Bag',        x: 560, y: 380 },
      { id: 'bottle', name: 'Message Bottle',   x: 180, y: 490 },
    ];
    const hasItemSprites = this.textures.exists('item-wood');
    defs.forEach(def => {
      const container = this.add.container(def.x, def.y).setDepth(3);
      const glow = this.add.ellipse(0, 4, 38, 14, 0xffe066, 0.35);

      if (hasItemSprites && this.textures.exists(`item-${def.id}`)) {
        const scale = def.id === 'bottle' ? 0.5 : 0.09;
        const icon = this.add.image(0, -4, `item-${def.id}`).setScale(scale);
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
  private spawnEnemies() {
    // Spawn positions — each gets a random enemy type
    const spawns = [
      { x: 285, y: 430, minX: 185, maxX: 445 },
      { x: 905, y: 460, minX: 780, maxX: 1055 },
      { x: 600, y: 420, minX: 500, maxX: 720 },
      { x: 750, y: 500, minX: 650, maxX: 870 },
    ];

    spawns.forEach(pos => {
      const def = rollBeach1Enemy();
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

      // Name label above enemy — offset based on scaled sprite height
      const labelY = sprite ? -(sprite.height * def.spriteScale * 0.5 + 8) : -22;
      const label = this.add.text(0, labelY, def.name, {
        fontFamily: 'PokemonDP, monospace',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
      container.add([label]);

      this.enemies.push({
        container, sprite,
        x: pos.x, y: pos.y,
        minX: pos.minX, maxX: pos.maxX,
        dir: 1,
        speed: 20 + Math.random() * 18,
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
      fontSize:   '22px',
      color:      '#2c1011',
      wordWrap:   { width: bw - 48 },
      lineSpacing: 6,
    });

    const promptStr = MobileInput.IS_MOBILE ? 'TAP \u25bc' : '\u25bc';
    const prompt = this.add.text(bw / 2 - 20, bh / 2 - 16, promptStr, {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '20px',
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
  // TALK OVERLAY (portrait dialogue with Normal Crab NPC)
  // ═══════════════════════════════════════════════════════════════════════════
  private readonly TALK_MENU_OPTIONS = [
    { label: 'How do I fish?', key: 'fish' },
    { label: 'What should I do next?', key: 'next' },
    { label: 'Tell me about yourself', key: 'about' },
    { label: 'Goodbye', key: 'bye' },
  ];

  private createTalkOverlay() {
    this.talkOverlay = this.add.container(0, 0).setDepth(30).setVisible(false);

    // Dark dim overlay
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6);
    this.talkOverlay.add(dim);

    // ── Portraits — BEHIND the text box, anchored to bottom ──────────
    // Both portraits scaled to same height, feet at bottom of screen
    const portraitH = 520;  // target height for both portraits
    const portraitBottomY = H - 10; // feet near bottom edge

    if (this.textures.exists('portrait-pirate')) {
      const pImg = this.add.image(0, 0, 'portrait-pirate');
      const pScale = portraitH / pImg.height;
      pImg.setScale(pScale);
      pImg.setOrigin(0.5, 1);  // anchor at bottom-center
      pImg.setPosition(200, portraitBottomY);
      this.talkOverlay.add(pImg);
      this.talkPirateImg = pImg;
    }
    if (this.textures.exists('portrait-crab-man')) {
      const cImg = this.add.image(0, 0, 'portrait-crab-man');
      const cScale = portraitH / cImg.height;
      cImg.setScale(cScale).setFlipX(true);
      cImg.setOrigin(0.5, 1);  // anchor at bottom-center
      cImg.setPosition(W - 200, portraitBottomY);
      this.talkOverlay.add(cImg);
      this.talkCrabImg = cImg;
    }

    // ── Dialogue box at bottom — parchment panel (OVER portraits) ────
    const boxW = W - 80;
    const boxH = 170;
    const boxX = W / 2;
    const boxY = H - 105;
    const boxBg = this.add.rectangle(boxX, boxY, boxW, boxH, 0xf0e8d8, 0.92);
    boxBg.setStrokeStyle(4, 0x5a3a1a);

    // Wooden border strips
    const sc = 0x8b6b4d;
    const t1 = this.add.rectangle(boxX, boxY - boxH / 2 + 4, boxW, 8, sc);
    const t2 = this.add.rectangle(boxX, boxY + boxH / 2 - 4, boxW, 8, sc);
    const t3 = this.add.rectangle(boxX - boxW / 2 + 4, boxY, 8, boxH, sc);
    const t4 = this.add.rectangle(boxX + boxW / 2 - 4, boxY, 8, boxH, sc);
    this.talkOverlay.add([boxBg, t1, t2, t3, t4]);

    // Speaker name — use PokemonDP (not PixelPirate, renders badly at small sizes)
    this.talkSpeaker = this.add.text(boxX - boxW / 2 + 24, boxY - boxH / 2 + 12, '', {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '16px',
      color: '#8b6b4d',
      fontStyle: 'bold',
    });
    this.talkOverlay.add(this.talkSpeaker);

    // Dialogue text
    this.talkText = this.add.text(boxX - boxW / 2 + 24, boxY - boxH / 2 + 36, '', {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '20px',
      color: '#2c1011',
      wordWrap: { width: boxW - 56 },
      lineSpacing: 5,
    });
    this.talkOverlay.add(this.talkText);

    // Advance prompt
    const advPrompt = this.add.text(boxX + boxW / 2 - 24, boxY + boxH / 2 - 20, '\u25bc', {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '18px',
      color: '#8b6b4d',
    }).setOrigin(1, 1);
    this.talkOverlay.add(advPrompt);
    this.tweens.add({
      targets: advPrompt,
      y: { from: boxY + boxH / 2 - 20, to: boxY + boxH / 2 - 14 },
      duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Menu items (created once, repositioned when shown)
    const menuX = boxX - boxW / 2 + 30;
    const menuStartY = boxY - boxH / 2 + 16;
    for (let i = 0; i < this.TALK_MENU_OPTIONS.length; i++) {
      const opt = this.TALK_MENU_OPTIONS[i];
      const row = this.add.container(menuX, menuStartY + i * 34);

      const cursor = this.add.text(0, 0, '\u25b6', {
        fontFamily: 'PokemonDP, monospace',
        fontSize: '18px',
        color: '#FD574B',
      });

      const label = this.add.text(22, 0, opt.label, {
        fontFamily: 'PokemonDP, monospace',
        fontSize: '18px',
        color: '#2c1011',
      });

      row.add([cursor, label]);
      row.setVisible(false);
      this.talkOverlay.add(row);
      this.talkMenuItems.push(row);
    }
  }

  /** Highlight the active speaker — scale up + full color; dim the other */
  private setTalkSpeakerHighlight(who: 'pirate' | 'crab') {
    this.talkActiveSpeaker = who;
    const activeScale = 1.0;   // normal (already sized to portraitH)
    const inactiveScale = 0.88; // slightly smaller
    if (this.talkPirateImg) {
      const baseScale = 520 / this.talkPirateImg.texture.getSourceImage().height;
      const isPirateActive = who === 'pirate';
      this.talkPirateImg.setScale(baseScale * (isPirateActive ? activeScale : inactiveScale));
      this.talkPirateImg.setTint(isPirateActive ? 0xffffff : 0x888888);
    }
    if (this.talkCrabImg) {
      const baseScale = 520 / this.talkCrabImg.texture.getSourceImage().height;
      const isCrabActive = who === 'crab';
      this.talkCrabImg.setScale(baseScale * (isCrabActive ? activeScale : inactiveScale));
      this.talkCrabImg.setFlipX(true);
      this.talkCrabImg.setTint(isCrabActive ? 0xffffff : 0x888888);
    }
  }

  private openTalkOverlay(speaker: string, lines: string[]) {
    this.player.setVelocity(0, 0);
    this.talkOpen = true;
    this.mobileInput?.showContextButtons('dialogue');
    this.talkPhase = 'dialogue';
    this.talkClosing = false;
    this.talkSpeakerName = speaker;
    this.talkSpeaker.setText(speaker);
    this.talkDlgQueue = [...lines];
    this.talkMenuCursor = 0;
    this.talkOverlay.setVisible(true);

    // Highlight crab as default speaker (NPC talks first)
    this.setTalkSpeakerHighlight('crab');

    // Hide menu items during dialogue
    for (const item of this.talkMenuItems) item.setVisible(false);

    // Start first dialogue line
    this.advanceTalkDlg();
  }

  private advanceTalkDlg() {
    if (this.talkDlgQueue.length === 0) {
      if (this.talkClosing) {
        this.talkClosing = false;
        this.closeTalkOverlay();
        return;
      }
      // Switch to menu phase — pirate is choosing
      this.talkPhase = 'menu';
      this.talkText.setText('');
      this.talkSpeaker.setText('');
      this.setTalkSpeakerHighlight('pirate');
      this.showTalkMenu();
      return;
    }
    this.talkDlgFull = this.talkDlgQueue.shift()!;
    this.talkDlgChars = 0;
    this.talkDlgTimer = 0;
    this.talkDlgTyping = true;
    this.talkText.setText('');
  }

  private showTalkMenu() {
    this.talkMenuCursor = 0;
    for (let i = 0; i < this.talkMenuItems.length; i++) {
      this.talkMenuItems[i].setVisible(true);
      // Show/hide cursor arrows
      const cursor = this.talkMenuItems[i].getAt(0) as Phaser.GameObjects.Text;
      cursor.setAlpha(i === 0 ? 1 : 0);
    }
  }

  private closeTalkOverlay() {
    this.talkOpen = false;
    this.talkOverlay.setVisible(false);
    for (const item of this.talkMenuItems) item.setVisible(false);
    this.mobileInput?.showContextButtons('overworld');
  }

  private selectTalkMenuOption(key: string) {
    // Hide menu, crab speaks again
    for (const item of this.talkMenuItems) item.setVisible(false);
    this.setTalkSpeakerHighlight('crab');

    switch (key) {
      case 'fish':
        this.talkPhase = 'dialogue';
        this.talkSpeaker.setText('Completely Normal Crab');
        this.talkDlgQueue = [
          "Ah yes, fishing! A very crab activity!",
          "Head right to the next beach — there's a dock there.",
          "Walk onto it and press SPACE near the water.",
          "You'll cast your line and wait for a bite...",
          "When the bar appears, press SPACE in the sweet spot!",
          "Nail the timing and you might catch it outright!",
          "Otherwise you'll have to battle it first.",
          "Weaken it, then press C to throw your net! Classic crab move.",
          "*wipes sweat from inside costume*",
        ];
        this.advanceTalkDlg();
        break;

      case 'next':
        this.talkPhase = 'dialogue';
        this.talkSpeaker.setText('Completely Normal Crab');
        if (!this.starterPicked) {
          this.talkDlgQueue = [
            "See that treasure chest? Go open it!",
            "Pick your first fish — every crab needs a crew!",
            "...Crabs have crews. Trust me on this.",
          ];
        } else {
          this.talkDlgQueue = [
            "Head right to find the dock — fish there to build your crew!",
            "The crabs around here are feisty — great for training!",
            "Wait. Did I say crabs? I meant the... wild ones.",
            "Not me. I'm one of you. Obviously.",
            "When you're ready, head right to the next beach!",
            "From there you can SET SAIL across the open sea!",
          ];
        }
        this.advanceTalkDlg();
        break;

      case 'about':
        this.talkPhase = 'dialogue';
        this.talkSpeaker.setText('Completely Normal Crab');
        this.talkDlgQueue = [
          "*strikes a crab pose*",
          "What's to tell? I'm just your average crab.",
          "Born in the ocean. Raised by the tides.",
          "I definitely did NOT grow up in a landlocked suburb.",
          "I have always had claws. These are real.",
          "*one of the claws falls off*",
          "...That happens sometimes. Molting. Very natural.",
          "Anyway, enough about me! I'm here to help!",
        ];
        this.advanceTalkDlg();
        break;

      case 'bye':
        this.talkPhase = 'dialogue';
        this.talkClosing = true;
        this.talkSpeaker.setText('Completely Normal Crab');
        this.talkDlgQueue = [
          "See you later! *does a little sideways walk*",
          "That's how we crabs say goodbye.",
          "I read that in a book. A crab book. For crabs.",
        ];
        this.advanceTalkDlg();
        break;
    }
  }

  private tickTalkOverlay(delta: number, spaceJustDown: boolean) {
    if (this.talkPhase === 'dialogue') {
      if (this.talkDlgTyping) {
        this.talkDlgTimer += delta;
        while (this.talkDlgTimer >= 38 && this.talkDlgChars < this.talkDlgFull.length) {
          this.talkDlgTimer -= 38;
          this.talkDlgChars++;
          this.talkText.setText(this.talkDlgFull.slice(0, this.talkDlgChars));
          if (this.talkDlgChars % 3 === 0) this.sound.play('sfx-typewriter', { volume: 0.15 });
        }
        if (this.talkDlgChars >= this.talkDlgFull.length) {
          this.talkDlgTyping = false;
        }
        if (spaceJustDown) {
          this.talkDlgChars = this.talkDlgFull.length;
          this.talkText.setText(this.talkDlgFull);
          this.talkDlgTyping = false;
        }
      } else if (spaceJustDown) {
        this.advanceTalkDlg();
      }
    } else if (this.talkPhase === 'menu') {
      // WASD navigation
      const wDown = Phaser.Input.Keyboard.JustDown(this.wasd.W);
      const sDown = Phaser.Input.Keyboard.JustDown(this.wasd.S);

      if (wDown && this.talkMenuCursor > 0) {
        this.talkMenuCursor--;
        this.updateTalkMenuCursor();
      }
      if (sDown && this.talkMenuCursor < this.TALK_MENU_OPTIONS.length - 1) {
        this.talkMenuCursor++;
        this.updateTalkMenuCursor();
      }
      if (spaceJustDown) {
        const key = this.TALK_MENU_OPTIONS[this.talkMenuCursor].key;
        if (key === 'bye') {
          // 'bye' shows final lines then closes
          this.selectTalkMenuOption(key);
        } else {
          this.selectTalkMenuOption(key);
        }
      }
    }
  }

  private updateTalkMenuCursor() {
    for (let i = 0; i < this.talkMenuItems.length; i++) {
      const cursor = this.talkMenuItems[i].getAt(0) as Phaser.GameObjects.Text;
      cursor.setAlpha(i === this.talkMenuCursor ? 1 : 0);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INVENTORY PANEL
  // ═══════════════════════════════════════════════════════════════════════════
  // Static child count in invContainer (everything before dynamic rows)
  private readonly INV_STATIC = 13;

  private createInventoryPanel() {
    this.invContainer = this.add.container(W / 2, H / 2).setDepth(25);
    const pw = 620, ph = 480, hh = 48;

    // [0] dark overlay
    const ov = this.add.rectangle(0, 0, W, H, 0x000000, 0.55);
    // [1-3] double-border wooden frame
    const of_ = this.add.rectangle(0, 0, pw + 8, ph + 8, 0x5a3a1a);
    const if_ = this.add.rectangle(0, 0, pw + 2, ph + 2, 0x8b6b4d);
    const bg  = this.add.rectangle(0, 0, pw, ph, 0xf0e8d8);
    // [4-5] header bar + divider
    const hd = this.add.rectangle(0, -ph / 2 + hh / 2, pw, hh, 0x8b6b4d);
    const hl = this.add.rectangle(0, -ph / 2 + hh, pw - 8, 2, 0x5a3a1a);
    // [6] title
    const ti = this.add.text(0, -ph / 2 + hh / 2, 'INVENTORY', {
      fontFamily: 'PixelPirate, monospace', fontSize: '30px',
      color: '#ffe066', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);
    // [7-8] footer
    const fb = this.add.rectangle(0, ph / 2 - 18, pw, 36, 0x8b6b4d, 0.4);
    const ht = this.add.text(0, ph / 2 - 18, '[I] CLOSE', {
      fontFamily: 'PokemonDP, monospace', fontSize: '18px',
      color: '#5a3a1a', stroke: '#f0e8d8', strokeThickness: 2,
    }).setOrigin(0.5);
    // [9-12] corner rivets
    const rr = 5, rc = 0x5a3a1a, rx = pw / 2 - 12, ry = ph / 2 - 12;
    this.invContainer.add([
      ov, of_, if_, bg, hd, hl, ti, fb, ht,
      this.add.circle(-rx, -ry, rr, rc), this.add.circle(rx, -ry, rr, rc),
      this.add.circle(-rx, ry, rr, rc),  this.add.circle(rx, ry, rr, rc),
    ]);
    this.invContainer.setVisible(false);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HUD BUTTONS (top-right corner — inventory bag + team bubble)
  // ═══════════════════════════════════════════════════════════════════════════
  private createHUD() {
    const hudDepth = 20;
    const isMobile = MobileInput.IS_MOBILE;
    const btnSize = isMobile ? 64 : 44;
    const pad = 14;
    const topY = 22;
    const rightX = W - pad;

    // ── Inventory bag button ──────────────────────────────────────────
    const bagBtn = this.add.container(rightX - btnSize / 2, topY + btnSize / 2).setDepth(hudDepth);
    // Wood frame
    const bagOuter = this.add.rectangle(0, 0, btnSize + 4, btnSize + 4, 0x5a3a1a);
    const bagInner = this.add.rectangle(0, 0, btnSize, btnSize, 0x8b6b4d);
    const bagBg    = this.add.rectangle(0, 0, btnSize - 4, btnSize - 4, 0xf0e8d8);
    // Procedural bag icon (leather satchel silhouette)
    const iconScale = isMobile ? 1.4 : 1.0;
    const bagBody = this.add.rectangle(0, 3, 20 * iconScale, 16 * iconScale, 0x8b5e3c);       // bag body
    const bagFlap = this.add.rectangle(0, -4, 22 * iconScale, 8 * iconScale, 0x6b4226);        // flap
    const bagStrap = this.add.rectangle(0, -10, 12 * iconScale, 4 * iconScale, 0x6b4226);      // strap/handle
    const bagBuckle = this.add.rectangle(0, -2, 6 * iconScale, 4 * iconScale, 0xffe066);       // gold buckle
    // "I" key hint
    const bagHint = this.add.text(0, btnSize / 2 + 8, 'I', {
      fontFamily: 'PokemonDP, monospace', fontSize: '11px',
      color: '#f0e8d8', stroke: '#2c1011', strokeThickness: 2,
    }).setOrigin(0.5);
    bagBtn.add([bagOuter, bagInner, bagBg, bagBody, bagFlap, bagStrap, bagBuckle, bagHint]);
    // Interactive — click to open inventory (padded hit area on mobile)
    if (isMobile) {
      bagBg.setInteractive(
        new Phaser.Geom.Rectangle(-10, -10, btnSize + 20, btnSize + 20),
        Phaser.Geom.Rectangle.Contains
      );
    } else {
      bagBg.setInteractive({ useHandCursor: true });
    }
    bagBg.on('pointerdown', () => { this.toggleInventory(); });

    // ── Team bubble button ────────────────────────────────────────────
    const teamX = rightX - btnSize / 2 - (btnSize + pad);
    const teamBtn = this.add.container(teamX, topY + btnSize / 2).setDepth(hudDepth);
    // Wood frame
    const teamOuter = this.add.rectangle(0, 0, btnSize + 4, btnSize + 4, 0x5a3a1a);
    const teamInner = this.add.rectangle(0, 0, btnSize, btnSize, 0x8b6b4d);
    const teamBg    = this.add.rectangle(0, 0, btnSize - 4, btnSize - 4, 0xf0e8d8);
    // Procedural fish-bubble icon (circle with fish silhouette)
    const bubbleR = isMobile ? 20 : 14;
    const bubble = this.add.circle(0, -1, bubbleR, 0x2dafb8, 0.3);
    const bubbleRing = this.add.circle(0, -1, bubbleR);
    bubbleRing.setStrokeStyle(2, 0x2dafb8);
    // Mini fish silhouette inside bubble
    const fishBody = this.add.ellipse(0, -1, 14 * iconScale, 8 * iconScale, 0x2dafb8);
    const fishTail = this.add.triangle(-9 * iconScale, -1, 0, -5, 0, 5, -6, 0, 0x2dafb8);
    const fishEye  = this.add.circle(4 * iconScale, -2, 2, 0xf0e8d8);
    // "T" key hint (T for Team)
    const teamHint = this.add.text(0, btnSize / 2 + 8, 'T', {
      fontFamily: 'PokemonDP, monospace', fontSize: '11px',
      color: '#f0e8d8', stroke: '#2c1011', strokeThickness: 2,
    }).setOrigin(0.5);
    teamBtn.add([teamOuter, teamInner, teamBg, bubble, bubbleRing, fishBody, fishTail, fishEye, teamHint]);
    // Interactive — click to open inventory (team tab, padded hit area on mobile)
    if (isMobile) {
      teamBg.setInteractive(
        new Phaser.Geom.Rectangle(-10, -10, btnSize + 20, btnSize + 20),
        Phaser.Geom.Rectangle.Contains
      );
    } else {
      teamBg.setInteractive({ useHandCursor: true });
    }
    teamBg.on('pointerdown', () => { this.toggleInventory(); });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE BUTTON BAR (top-left — bag, ship, back)
  // ═══════════════════════════════════════════════════════════════════════════
  private buildMobileButtons() {
    const bar = this.add.container(0, 0).setScrollFactor(0).setDepth(900);
    const btnR = 24;
    const spacing = 56;
    const startX = 40;
    const startY = 40;

    const makeBtn = (x: number, fill: number, label: string, fontSize: number) => {
      const c = this.add.container(x, startY);
      const circle = this.add.circle(0, 0, btnR, fill, 0.85);
      circle.setStrokeStyle(2, 0x2c1011);
      const txt = this.add.text(0, 0, label, {
        fontFamily: 'PokemonDP, monospace',
        fontSize: `${fontSize}px`,
        color: '#f0e8d8',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
      c.add([circle, txt]);
      circle.setInteractive(
        new Phaser.Geom.Circle(0, 0, btnR + 10),
        Phaser.Geom.Circle.Contains
      );
      return { container: c, circle };
    };

    // BAG button
    const bag = makeBtn(startX, 0x8b6b4d, 'BAG', 11);
    bag.circle.on('pointerdown', () => { this.toggleInventory(); });

    // SHIP button
    const ship = makeBtn(startX + spacing, 0x5a3a1a, 'SHIP', 11);
    ship.circle.on('pointerdown', () => { this.toggleShipSelection(); });

    // BACK button (only visible when an overlay is open)
    const back = makeBtn(startX + spacing * 2, 0x8b3a2a, 'X', 18);
    back.circle.on('pointerdown', () => {
      if (this.invOpen) this.toggleInventory();
      else if (this.shipOpen) this.toggleShipSelection();
    });
    this.mobileBackBtn = back.container;
    this.mobileBackBtn.setVisible(false);

    bar.add([bag.container, ship.container, back.container]);
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

  /** Restore game state from a SaveData object */
  private restoreFromSave(save: SaveData) {
    this.player.setPosition(save.playerX, save.playerY);
    this.shadow.setPosition(save.playerX, save.playerY + 16);

    this.registry.set('party', save.party);
    this.inventory = save.inventory;
    this.registry.set('inventory', this.inventory);

    if (save.starterChosen) {
      this.starterPicked = true;
      this.starterPickerOpen = false;
      this.starterOverlay.setVisible(false);
      this.chestContainer.setVisible(false);
      if (this.chestGlow) { this.chestGlow.destroy(); this.chestGlow = undefined; }
      if (this.chestHint) { this.chestHint.destroy(); this.chestHint = undefined; }
      if (this.sailHint) this.sailHint.setVisible(true);
      this.spawnEnemies();
    }

    this.playtime = save.playtime;
  }

  /** Manual save + flash notification */
  private manualSave() {
    const success = saveFromScene(
      this,
      { x: this.player.x, y: this.player.y },
      this.starterPicked,
      this.playtime,
    );
    const msg = this.add.text(W / 2, 40, success ? 'Game Saved!' : 'Save Failed!', {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '16px',
      color: success ? '#ffe066' : '#ff4444',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({
      targets: msg,
      alpha: { from: 1, to: 0 },
      y: msg.y - 20,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => msg.destroy(),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════════════════════
  update(_time: number, delta: number) {
    if (!this.player) return;

    // ── Playtime tracking ────────────────────────────────────────────────
    this.playtime += delta / 1000;

    // ── F5 — manual save ─────────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this.f5Key)) {
      this.manualSave();
    }

    // Space just-pressed detection (keyboard + mobile action button)
    const spaceDown     = this.spaceKey.isDown;
    const spaceJustDown = (spaceDown && !this.spacePrev) || (this.mobileInput?.isActionJustDown() ?? false) || this.dlgTapped || this.talkTapped || this.fishTapped;
    this.dlgTapped  = false;
    this.talkTapped = false;
    this.fishTapped = false;
    this.spacePrev  = spaceDown;

    // ── Starter picker takes full control ──────────────────────────────────
    if (this.starterPickerOpen) {
      this.tickStarterPicker(spaceJustDown);
      return;
    }

    // ESC closes talk overlay
    if (this.talkOpen && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.closeTalkOverlay();
      return;
    }

    // Talk overlay takes full control (blocks all other UI)
    if (this.talkOpen) {
      this.tickTalkOverlay(delta, spaceJustDown);
      return;
    }

    // I key — toggle inventory
    if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
      this.toggleInventory();
      return;
    }
    if (this.invOpen) return;

    // P key — toggle ship selection
    if (Phaser.Input.Keyboard.JustDown(this.pKey)) {
      this.toggleShipSelection();
      return;
    }
    if (this.shipOpen) {
      this.tickShipSelection(spaceJustDown);
      return;
    }

    // Fishing takes over everything
    if (this.isFishing) {
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
    this.updateEnemies(delta);
    this.tickCaptainNPC(delta);
    this.checkEnemyCollisions();
    this.checkSpaceActions(spaceJustDown);
    this.depthSort();

    // Right passage → Beach 2 (open passage below crate stack, y > 400)
    if (this.starterPicked && !this.sailTransitioning &&
        this.player.x >= 1130 && this.player.y > 400) {
      this.goToBeach2();
    }
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

    // Start with mobile joystick vector (0,0 on desktop or when idle)
    const joy = this.mobileInput?.getMovementVector() ?? { x: 0, y: 0 };
    let vx = joy.x * speed;
    let vy = joy.y * speed;

    // Keyboard overrides joystick when active
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

    // South boundary is enforced by physics.world.setBounds (WALK_MAX_Y).
    // No dock on Beach 1 — player simply can't walk into the water.

    this.tickAnim(vx !== 0 || vy !== 0, delta);

    // Shadow at character feet (sprite center + 16px for 32px native sprite at 2x)
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
      // Show dialogue AFTER animation finishes — player stays stopped while reading
      if (this.pickupPendingMessage) {
        this.openDialogue([this.pickupPendingMessage]);
        this.pickupPendingMessage = null;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENEMY PATROL
  // ═══════════════════════════════════════════════════════════════════════════
  private updateEnemies(delta: number) {
    for (const e of this.enemies) {
      if (e.defeated) continue;
      e.x += e.dir * e.speed * (delta / 1000);
      if (e.x >= e.maxX) { e.x = e.maxX; e.dir = -1; }
      if (e.x <= e.minX) { e.x = e.minX; e.dir =  1; }
      e.container.setPosition(e.x, e.y);

      if (e.sprite) {
        const texKey = `${e.spriteKey}-east`;
        if (this.textures.exists(texKey)) {
          e.sprite.setTexture(texKey);
        }
        e.sprite.setFlipX(e.dir < 0);
        e.container.setScale(1, 1);
      } else {
        e.container.setScale(e.dir < 0 ? -1 : 1, 1);
      }
    }
  }

  private checkEnemyCollisions() {
    if (this.battlePending) return;
    if (!this.starterPicked) return;
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

  // ═══════════════════════════════════════════════════════════════════════════
  // SPACE INTERACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  private checkSpaceActions(spaceJustDown: boolean) {
    if (!spaceJustDown) return;

    // Guard: starter picker is handled in tickStarterPicker, not here
    if (this.starterPickerOpen) return;

    const px = this.player.x;
    const py = this.player.y + 16;  // use feet position for interaction range checks
    const RANGE = 50;
    const SIGN_RANGE = 40;

    // Chest interaction (only if starter not yet picked)
    if (!this.starterPicked) {
      if (Math.hypot(this.chestX - px, this.chestY - py) < RANGE) {
        this.showStarterPicker();
        return;
      }
    }

    // Captain NPC interaction (use live container position since NPC paces)
    if (Math.hypot(this.captainContainer.x - px, this.captainContainer.y - py) < RANGE) {
      this.talkToCaptain();
      return;
    }

    // Ground items & signs
    for (const item of this.groundItems) {
      if (item.collected) continue;
      const r = item.isSign ? SIGN_RANGE : RANGE;
      if (Math.hypot(item.x - px, item.y - py) < r) {
        if (item.isSign && item.signLines) {
          this.openDialogue(item.signLines);
        } else {
          this.collectItem(item);
        }
        return;
      }
    }

    // Fishing disabled on Beach 1 (no dock) — fish from Beach 2's dock instead
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ITEM COLLECT
  // ═══════════════════════════════════════════════════════════════════════════
  private collectItem(item: GroundItem) {
    item.collected = true;
    item.container.setVisible(false);
    this.inventory[item.id] = (this.inventory[item.id] || 0) + 1;
    this.registry.set('inventory', this.inventory);
    this.sound.play('sfx-pickup', { volume: 0.5 });
    this.player.setVelocity(0, 0);
    this.isPickingUp = true;
    this.pickupFrame = 0;
    this.pickupTimer = 0;
    // Dialogue shows AFTER pickup animation completes (not simultaneously)
    this.pickupPendingMessage = `Found ${item.name}!`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BATTLE TRIGGER
  // ═══════════════════════════════════════════════════════════════════════════
  private triggerBattle(enemy: BeachEnemy) {
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
        returnScene: 'Beach',
        enemySpriteKey: enemy.spriteKey,
      });
      this.scene.pause();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DIALOGUE
  // ═══════════════════════════════════════════════════════════════════════════
  private openDialogue(lines: string[]) {
    this.player.setVelocity(0, 0);
    this.dlgQueue = [...lines];
    this.dlgOpen  = true;
    this.dlgContainer.setVisible(true);
    this.mobileInput?.showContextButtons('dialogue');
    this.advanceDlg();
  }

  private advanceDlg() {
    if (this.dlgQueue.length === 0) {
      this.dlgOpen = false;
      this.dlgContainer.setVisible(false);
      this.mobileInput?.showContextButtons('overworld');
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
    this.mobileBackBtn?.setVisible(this.invOpen || this.shipOpen);
  }

  private refreshInventoryUI() {
    // Remove old dynamic rows (keep first INV_STATIC static elements)
    while (this.invContainer.length > this.INV_STATIC) {
      this.invContainer.removeAt(this.INV_STATIC, true);
    }

    const party   = (this.registry.get('party') as FishInstance[]) || [];
    const entries = Object.entries(this.inventory);
    const startY  = -140;
    let curY      = startY;

    const textStyle = (size: number, color: string) => ({
      fontFamily: 'PokemonDP, monospace',
      fontSize:   `${size}px`,
      color,
    });
    const sectionStyle = () => ({
      fontFamily: 'PixelPirate, monospace',
      fontSize:   '20px',
      color:      '#8b6b4d',
      stroke:     '#f0e8d8',
      strokeThickness: 1,
    });

    // ── CREW section ──────────────────────────────────────────────────────
    // Section header with divider line
    this.invContainer.add(this.add.text(-270, curY, 'CREW', sectionStyle()));
    this.invContainer.add(this.add.rectangle(0, curY + 18, 540, 2, 0x8b6b4d, 0.4));
    curY += 30;

    if (party.length === 0) {
      this.invContainer.add(
        this.add.text(0, curY + 10, 'No fish yet — open the chest!', textStyle(18, '#8b6b4d')).setOrigin(0.5)
      );
      curY += 40;
    } else {
      party.forEach((fish, fi) => {
        const fy = curY + fi * 52;
        const name = String(fish.nickname || fish.speciesId);

        // Fish card row background (alternating subtle tint)
        const rowBg = this.add.rectangle(0, fy + 10, 540, 46, fi % 2 === 0 ? 0xe8dcc8 : 0xf0e8d8, 0.6);
        this.invContainer.add(rowBg);

        // Fish sprite thumbnail (if available)
        const sid = fish.speciesId;
        let texKey: string | undefined;
        if (typeof sid === 'string' && sid.startsWith('fish-')) {
          texKey = sid;
        } else {
          const species = FISH_SPECIES.find(s => s.id === sid);
          if (species?.spriteGrid && species?.spriteIndex !== undefined) {
            texKey = `fish-${species.spriteGrid}-${String(species.spriteIndex).padStart(2, '0')}`;
          }
        }
        if (texKey && this.textures.exists(texKey)) {
          this.invContainer.add(this.add.image(-246, fy + 10, texKey).setDisplaySize(38, 33));
        } else {
          // Colored circle fallback
          this.invContainer.add(this.add.circle(-246, fy + 10, 16, 0x8b6b4d, 0.5));
        }

        // Name + Level
        this.invContainer.add(
          this.add.text(-218, fy - 2, `${name.toUpperCase()}`, textStyle(18, '#2c1011'))
        );
        this.invContainer.add(
          this.add.text(-218, fy + 18, `Lv ${fish.level}`, textStyle(14, '#6a5850'))
        );

        // HP bar (mini, 160px wide)
        const hpRatio = Math.max(0, fish.currentHp / fish.maxHp);
        const barW = 160, barH = 10;
        const barX = 60;
        const hpColor = hpRatio > 0.5 ? 0x44cc44 : hpRatio > 0.25 ? 0xffcc00 : 0xff4444;
        this.invContainer.add(this.add.rectangle(barX + barW / 2, fy + 6, barW, barH, 0x555555));
        this.invContainer.add(
          this.add.rectangle(barX, fy + 6, Math.max(1, Math.floor(barW * hpRatio)), barH, hpColor).setOrigin(0, 0.5)
        );
        this.invContainer.add(
          this.add.text(barX - 24, fy, 'HP', textStyle(12, '#5a3a1a'))
        );
        this.invContainer.add(
          this.add.text(barX + barW + 6, fy, `${fish.currentHp}/${fish.maxHp}`, textStyle(14, '#2c1011'))
        );
      });
      curY += party.length * 52 + 10;
    }

    // ── ITEMS section ────────────────────────────────────────────────────
    curY = Math.max(curY, startY + 40);
    this.invContainer.add(this.add.text(-270, curY, 'ITEMS', sectionStyle()));
    this.invContainer.add(this.add.rectangle(0, curY + 18, 540, 2, 0x8b6b4d, 0.4));
    curY += 30;

    if (entries.length === 0) {
      this.invContainer.add(
        this.add.text(0, curY + 10, 'No items — explore the beach!', textStyle(18, '#8b6b4d')).setOrigin(0.5)
      );
    } else {
      entries.forEach(([id, qty], i) => {
        const iy = curY + i * 32;
        // Item icon (sprite if available)
        const itemKey = `item-${id}`;
        if (this.textures.exists(itemKey)) {
          this.invContainer.add(this.add.image(-246, iy + 8, itemKey).setScale(0.06));
        } else {
          this.invContainer.add(this.add.circle(-246, iy + 8, 8, 0x8b6b4d));
        }
        // Name + qty
        this.invContainer.add(
          this.add.text(-218, iy, `${id.toUpperCase()}`, textStyle(18, '#2c1011'))
        );
        this.invContainer.add(
          this.add.text(200, iy, `x${qty}`, textStyle(18, '#5a3a1a')).setOrigin(1, 0)
        );
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FISHING
  // ═══════════════════════════════════════════════════════════════════════════
  private createFishingOverlay() {
    this.fishingOverlay = this.add.container(W / 2, H / 2).setDepth(28);

    // Dark backdrop
    const bg = this.add.rectangle(0, 0, W, H, 0x000000, 0.75);

    // Status text
    this.fishingText = this.add.text(0, -120, '', {
      fontFamily: 'PixelPirate, monospace',
      fontSize: '28px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Reel bar background
    const barBg = this.add.rectangle(0, 30, 500, 40, 0x3d1a10);
    barBg.setStrokeStyle(3, 0x8b6b4d);

    // Green sweet-spot zone (positioned randomly each cast)
    this.fishingZone = this.add.rectangle(0, 30, 100, 36, 0x44cc44, 0.5);

    // Moving marker
    this.fishingMarker = this.add.rectangle(-240, 30, 12, 36, 0xffe066);

    // The full bar track (for reference)
    this.fishingBar = barBg;

    // Hint text
    const fishHintStr = MobileInput.IS_MOBILE
      ? 'TAP when the marker is in the green zone!'
      : 'Press SPACE when the marker is in the green zone!';
    const hint = this.add.text(0, 80, fishHintStr, {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '20px',
      color: '#f0e8d8',
    }).setOrigin(0.5);

    this.fishingOverlay.add([bg, this.fishingText, barBg, this.fishingZone, this.fishingMarker, hint]);
    this.fishingOverlay.setVisible(false);
  }

  private startFishing() {
    if (!this.starterPicked) return;
    this.isFishing = true;
    this.fishingPhase = 'cast';
    this.fishingTimer = 0;
    this.player.setVelocity(0, 0);
    this.mobileInput?.showContextButtons('fishing');

    // Pick a fish from the dock fishing zone (weighted random)
    const roll = rollFishFromZone(FISHING_ZONES.dock);
    this.hookedFish = FISH_SPRITE_DB.find(f => f.textureKey === roll.textureKey)
      ?? FISH_SPRITE_DB.filter(f => f.evolutionStage <= 2)[0];
    this.fishingRolledLevel = roll.level;

    // Show overlay in cast phase
    this.fishingOverlay.setVisible(true);
    this.fishingText.setText('CASTING...');
    this.sound.play('sfx-cast', { volume: 0.5 });
    this.fishingMarker.setVisible(false);
    this.fishingZone.setVisible(false);

    // Random wait before bite (1.5 - 3.5 seconds)
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
      // Bobbing dots animation
      const dots = '.'.repeat(Math.floor(this.fishingTimer / 400) % 4);
      this.fishingText.setText(`Waiting${dots}`);

      if (this.fishingTimer >= this.fishingBiteTime) {
        this.fishingPhase = 'bite';
        this.fishingTimer = 0;
        this.fishingText.setText('!! BITE !!');

        // Show the reel bar
        this.fishingMarker.setVisible(true);
        this.fishingZone.setVisible(true);
        this.fishingMarkerX = -240;
        this.fishingMarkerDir = 1;

        // Randomize sweet-spot position
        const zoneX = -100 + Math.random() * 200;
        this.fishingZone.setX(zoneX);
      }

      // Player can cancel during wait
      if (spaceJustDown) {
        this.endFishing();
        return;
      }
    } else if (this.fishingPhase === 'bite') {
      // Move marker back and forth
      const speed = 400; // pixels per second
      this.fishingMarkerX += this.fishingMarkerDir * speed * (delta / 1000);
      if (this.fishingMarkerX > 240) { this.fishingMarkerX = 240; this.fishingMarkerDir = -1; }
      if (this.fishingMarkerX < -240) { this.fishingMarkerX = -240; this.fishingMarkerDir = 1; }
      this.fishingMarker.setX(this.fishingMarkerX);

      // Bite window: 4 seconds before it gets away
      if (this.fishingTimer > 4000) {
        this.fishingPhase = 'done';
        this.fishingTimer = 0;
        this.fishingText.setText('It got away...');
        this.fishingMarker.setVisible(false);
        this.fishingZone.setVisible(false);
        this.time.delayedCall(1200, () => this.endFishing());
        return;
      }

      // SPACE = attempt to reel
      if (spaceJustDown) {
        this.fishingMarker.setVisible(false);
        this.fishingZone.setVisible(false);

        // Check if marker is in the green zone
        const markerX = this.fishingMarkerX;
        const zoneX = this.fishingZone.x;
        const zoneHalfW = 50; // zone is 100px wide
        const inZone = Math.abs(markerX - zoneX) < zoneHalfW;

        if (inZone && this.hookedFish) {
          // Great timing! Chance of direct catch vs battle
          const directCatchRoll = Math.random();
          const perfectHit = Math.abs(markerX - zoneX) < 15;
          const fish = this.hookedFish; // capture ref for delayed callbacks

          if (perfectHit && directCatchRoll < 0.30) {
            // Direct catch! (30% on perfect)
            this.fishingPhase = 'done';
            this.fishingText.setText(`Caught ${fish.name}!`);
            this.time.delayedCall(1500, () => {
              if (!this.scene.isActive()) return;
              this.endFishing();
              this.addCaughtFish(fish);
            });
          } else {
            // Battle!
            this.fishingPhase = 'done';
            this.fishingText.setText(`${fish.name} fights back!`);
            this.time.delayedCall(1200, () => {
              if (!this.scene.isActive()) return;
              this.endFishing();
              this.triggerFishBattle(fish);
            });
          }
        } else {
          // Missed the zone
          this.fishingPhase = 'done';
          this.fishingText.setText('Missed! It got away...');
          this.time.delayedCall(1200, () => this.endFishing());
        }
      }
    }
    // 'done' phase: just wait for delayed calls
  }

  private endFishing() {
    this.isFishing = false;
    this.fishingPhase = 'cast';
    this.fishingTimer = 0;
    this.fishingOverlay.setVisible(false);
    this.mobileInput?.showContextButtons('overworld');
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
      speciesId: fishData.textureKey, // use texture key as species ID for sprite lookup
      nickname: fishData.name,
      level,
      xp: 0,
      currentHp: fishData.baseHP,
      maxHp: fishData.baseHP,
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
    this.battlePending = true;
    const level = this.fishingRolledLevel;

    const wildFish: FishInstance = {
      uid: `wild_${Date.now()}`,
      speciesId: fishData.textureKey,
      nickname: fishData.name,
      level,
      xp: 0,
      currentHp: fishData.baseHP,
      maxHp: fishData.baseHP,
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
        returnScene: 'Beach',
        isWildFish: true,
        fishSpriteData: fishData,
      });
      this.scene.pause();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE TRANSITIONS
  // ═══════════════════════════════════════════════════════════════════════════
  private goToBeach2() {
    if (this.sailTransitioning) return;
    this.sailTransitioning = true;
    this.player.setVelocity(0, 0);
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Beach2', { from: 'left' });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHIP SELECTION UI
  // ═══════════════════════════════════════════════════════════════════════════
  private createShipSelectionUI() {
    this.shipOverlay = this.add.container(W / 2, H / 2).setDepth(30);

    const bg = this.add.rectangle(0, 0, W, H, 0x000000, 0.85);
    const title = this.add.text(0, -310, 'SELECT YOUR SHIP', {
      fontFamily: 'PixelPirate, monospace',
      fontSize:   '36px',
      color:      '#ffe066',
    }).setOrigin(0.5);
    const shipHintStr = MobileInput.IS_MOBILE
      ? 'Swipe to browse  |  TAP to select'
      : 'A/D Navigate  |  W/S Page  |  SPACE Select  |  ESC Close';
    const hint = this.add.text(0, -270, shipHintStr, {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '12px',
      color:      '#c8b890',
    }).setOrigin(0.5);
    const pageText = this.add.text(0, 280, 'Page 1 / 5', {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '13px',
      color:      '#f0e8d8',
    }).setOrigin(0.5);

    this.shipOverlay.add([bg, title, hint, pageText]);
    this.shipOverlay.setData('pageText', pageText);

    const cardSlots: Phaser.GameObjects.Container[] = [];
    for (let i = 0; i < 4; i++) {
      const offX = (i - 1.5) * 280;
      const card = this.add.container(offX, 0);
      cardSlots.push(card);
      this.shipOverlay.add(card);
    }
    this.shipOverlay.setData('cardSlots', cardSlots);

    if (!this.registry.has('selectedShip')) {
      this.registry.set('selectedShip', 0);
    }
    if (!this.registry.has('fishCaughtTotal')) {
      this.registry.set('fishCaughtTotal', 0);
    }

    this.shipOverlay.setVisible(false);
  }

  private toggleShipSelection() {
    this.shipOpen = !this.shipOpen;
    this.shipOverlay.setVisible(this.shipOpen);
    if (this.shipOpen) {
      this.player.setVelocity(0, 0);
      const selected = this.registry.get('selectedShip') as number || 0;
      this.shipCursor = selected;
      this.shipPage = Math.floor(selected / 4);
      this.refreshShipCards();
    }
    this.mobileBackBtn?.setVisible(this.invOpen || this.shipOpen);
  }

  private refreshShipCards() {
    const cardSlots = this.shipOverlay.getData('cardSlots') as Phaser.GameObjects.Container[];
    const pageText  = this.shipOverlay.getData('pageText') as Phaser.GameObjects.Text;
    if (!cardSlots) return;

    const fishCaught = (this.registry.get('fishCaughtTotal') as number) || 0;
    const selectedShip = (this.registry.get('selectedShip') as number) || 0;
    const startIdx = this.shipPage * 4;

    pageText.setText(`Page ${this.shipPage + 1} / 5`);

    for (let slot = 0; slot < 4; slot++) {
      const card = cardSlots[slot];
      card.removeAll(true);

      const shipIndex = startIdx + slot;
      if (shipIndex >= SHIPS.length) continue;

      const ship = SHIPS[shipIndex];
      const spriteIdx = ship.spriteIndex;
      const unlocked = isShipUnlocked(spriteIdx, fishCaught);
      const isCursor = shipIndex === this.shipCursor;
      const isSelected = spriteIdx === selectedShip;

      const cardW = 240;
      const cardH = 440;
      const bgColor = unlocked ? 0x3d1a10 : 0x1a1a1a;
      const cardBg = this.add.rectangle(0, 0, cardW, cardH, bgColor);
      const borderColor = isCursor ? 0xffe066 : (isSelected ? 0x44cc44 : 0x5a3a1a);
      const borderWidth = isCursor ? 4 : 2;
      cardBg.setStrokeStyle(borderWidth, borderColor);

      const texKey = `ship-${String(spriteIdx).padStart(2, '0')}`;
      let shipVisual: Phaser.GameObjects.GameObject;
      if (unlocked && this.textures.exists(texKey)) {
        shipVisual = this.add.image(0, -80, texKey).setDisplaySize(160, 160);
      } else if (this.textures.exists(texKey)) {
        const img = this.add.image(0, -80, texKey).setDisplaySize(160, 160);
        img.setTint(0x222222);
        img.setAlpha(0.5);
        shipVisual = img;
      } else {
        shipVisual = this.add.rectangle(0, -80, 120, 100, 0x333333);
      }

      const nameStr = unlocked ? ship.name.toUpperCase() : 'LOCKED';
      const nameColor = unlocked ? '#f0e8d8' : '#666666';
      const nameTxt = this.add.text(0, 20, nameStr, {
        fontFamily: 'PixelPirate, monospace',
        fontSize:   '16px',
        color:      nameColor,
      }).setOrigin(0.5);

      const classColor = unlocked ? 0x8b6b4d : 0x444444;
      const classBg = this.add.rectangle(0, 52, 180, 22, classColor);
      const classTxt = this.add.text(0, 52, unlocked ? ship.class.toUpperCase() : '???', {
        fontFamily: 'PokemonDP, monospace',
        fontSize:   '10px',
        color:      unlocked ? '#f0e8d8' : '#555555',
      }).setOrigin(0.5);

      const children: Phaser.GameObjects.GameObject[] = [cardBg, shipVisual, nameTxt, classBg, classTxt];

      if (unlocked) {
        const stats = ship.baseStats;
        const statLines = [
          `HULL: ${stats.hull}`,
          `SPEED: ${stats.speed}`,
          `CARGO: ${stats.cargo}`,
          `MANEUVER: ${stats.maneuver}`,
        ];
        statLines.forEach((line, li) => {
          const st = this.add.text(0, 80 + li * 22, line, {
            fontFamily: 'PokemonDP, monospace',
            fontSize:   '10px',
            color:      '#c8b890',
          }).setOrigin(0.5);
          children.push(st);
        });

        const rarityColors: Record<string, string> = {
          common: '#aaaaaa', uncommon: '#44cc44', rare: '#4488ff', legendary: '#ffe066',
        };
        const rarityTxt = this.add.text(0, 168, ship.rarity.toUpperCase(), {
          fontFamily: 'PokemonDP, monospace',
          fontSize:   '10px',
          color:      rarityColors[ship.rarity] || '#aaaaaa',
        }).setOrigin(0.5);
        children.push(rarityTxt);

        if (isSelected) {
          const eqBg  = this.add.rectangle(0, 195, 120, 22, 0x44cc44);
          const eqTxt = this.add.text(0, 195, 'EQUIPPED', {
            fontFamily: 'PokemonDP, monospace',
            fontSize:   '10px',
            color:      '#ffffff',
          }).setOrigin(0.5);
          children.push(eqBg, eqTxt);
        }
      } else {
        const req = getUnlockRequirement(spriteIdx);
        const lockIcon = this.add.text(0, -80, 'LOCKED', {
          fontFamily: 'PixelPirate, monospace',
          fontSize: '22px',
          color: '#888888',
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5);
        const reqTxt = this.add.text(0, 100, `Catch ${req} fish\nto unlock`, {
          fontFamily: 'PokemonDP, monospace',
          fontSize:   '11px',
          color:      '#888888',
          align:      'center',
        }).setOrigin(0.5);
        const progressTxt = this.add.text(0, 145, `(${fishCaught} / ${req})`, {
          fontFamily: 'PokemonDP, monospace',
          fontSize:   '10px',
          color:      '#666666',
        }).setOrigin(0.5);
        children.push(lockIcon, reqTxt, progressTxt);
      }

      card.add(children);
      card.setScale(isCursor ? 1.04 : 0.95);
    }
  }

  private tickShipSelection(spaceJustDown: boolean) {
    const totalShips = SHIPS.length;
    const totalPages = Math.ceil(totalShips / 4);

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.shipOpen = false;
      this.shipOverlay.setVisible(false);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.wasd.A) || Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      if (this.shipCursor > 0) {
        this.shipCursor--;
        const newPage = Math.floor(this.shipCursor / 4);
        if (newPage !== this.shipPage) this.shipPage = newPage;
        this.refreshShipCards();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.wasd.D) || Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      if (this.shipCursor < totalShips - 1) {
        this.shipCursor++;
        const newPage = Math.floor(this.shipCursor / 4);
        if (newPage !== this.shipPage) this.shipPage = newPage;
        this.refreshShipCards();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.wasd.W) || Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      if (this.shipPage > 0) {
        this.shipPage--;
        this.shipCursor = this.shipPage * 4;
        this.refreshShipCards();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.wasd.S) || Phaser.Input.Keyboard.JustDown(this.cursors.down!)) {
      if (this.shipPage < totalPages - 1) {
        this.shipPage++;
        this.shipCursor = Math.min(this.shipPage * 4, totalShips - 1);
        this.refreshShipCards();
      }
    }

    if (spaceJustDown) {
      const ship = SHIPS[this.shipCursor];
      if (!ship) return;
      const fishCaught = (this.registry.get('fishCaughtTotal') as number) || 0;
      if (isShipUnlocked(ship.spriteIndex, fishCaught)) {
        this.registry.set('selectedShip', ship.spriteIndex);
        this.openDialogue([`${ship.name} equipped!`, 'Set sail when you are ready, Captain.']);
        this.shipOpen = false;
        this.shipOverlay.setVisible(false);
      } else {
        this.openDialogue([`This ship is locked.`, `Catch ${getUnlockRequirement(ship.spriteIndex)} fish to unlock it.`]);
        this.shipOpen = false;
        this.shipOverlay.setVisible(false);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPTH SORT
  // ═══════════════════════════════════════════════════════════════════════════
  private depthSort() {
    // Objects with higher y appear in front — use FEET position for player
    const playerFeetY = this.player.y + 16;
    const d = 4 + playerFeetY * 0.001;
    this.player.setDepth(d);
    this.shadow.setDepth(d - 0.1);

    // Captain NPC depth sorting
    const cd = 4 + this.captainContainer.y * 0.001;
    this.captainContainer.setDepth(cd);

    // Ground items
    for (const item of this.groundItems) {
      if (!item.collected) {
        item.container.setDepth(4 + item.y * 0.001);
      }
    }

    // Enemies
    for (const enemy of this.enemies) {
      if (!enemy.defeated) {
        enemy.container.setDepth(4 + enemy.y * 0.001);
      }
    }

    // Chest
    if (!this.starterPicked) {
      this.chestContainer.setDepth(4 + this.chestY * 0.001);
    }
  }
}
