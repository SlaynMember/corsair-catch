import { FishInstance, FISH_SPECIES } from '../data/fish-db';
import { MOVES, Move } from '../data/move-db';
import { getTypeEffectiveness, getEffectivenessLabel } from '../data/type-chart';
import {
  STAB_BONUS,
  DAMAGE_RANDOM_MIN,
  DAMAGE_RANDOM_MAX,
  BURN_DAMAGE_FRACTION,
  PARALYZE_SKIP_CHANCE,
} from '../data/constants';
import { FishSpriteData } from '../data/fish-sprite-db';
import { addBattleXP, checkEvolution, xpToNextLevel } from '../systems/XPSystem';
import { evolveFish } from '../systems/EvolutionSystem';
import MobileInput from '../systems/MobileInput';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BattleInit {
  enemyName:   string;
  enemyParty:  FishInstance[];
  returnScene: string;
  isWildFish?:    boolean;
  fishSpriteData?: FishSpriteData;
  /** Overworld sprite key for beach enemies (e.g. 'jelly', 'gull', 'hermit'). Used as battle sprite fallback. */
  enemySpriteKey?: string;
}

type BattlePhase = 'player_pick' | 'animating' | 'result';
type Status      = 'none' | 'burn' | 'paralyze';

interface BattleState {
  playerFish:   FishInstance;
  enemyFish:    FishInstance;
  playerStatus: Status;
  enemyStatus:  Status;
  movePP:       Record<string, number>;
}

// ─── Type colors ──────────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, number> = {
  Fire:     0xb03020,
  Water:    0x1850a0,
  Electric: 0xa09010,
  Nature:   0x186018,
  Abyssal:  0x501090,
  Storm:    0x306090,
  Normal:   0x604030,
};
const TYPE_LABEL_COLOR: Record<string, string> = {
  Fire:     '#c03020',
  Water:    '#2060c0',
  Electric: '#c0a020',
  Nature:   '#208020',
  Abyssal:  '#6020a0',
  Storm:    '#4080a0',
  Normal:   '#806040',
};

// Status badge colors
const STATUS_BADGE_COLOR: Record<string, number> = {
  burn:     0xcc3300,
  paralyze: 0xccaa00,
};
const STATUS_BADGE_TEXT_COLOR: Record<string, string> = {
  burn:     '#ff6633',
  paralyze: '#ffdd33',
};

// ─── Scene ────────────────────────────────────────────────────────────────────
export default class BattleScene extends Phaser.Scene {
  private state!: BattleState;
  private enemyName!:   string;
  private enemyParty!:  FishInstance[];
  private returnScene!: string;
  private phase: BattlePhase = 'player_pick';

  // UI refs
  private logText!:       Phaser.GameObjects.Text;
  private logQueue:       string[] = [];
  private playerHpFill!:  Phaser.GameObjects.Rectangle;
  private enemyHpFill!:   Phaser.GameObjects.Rectangle;
  private playerHpText!:  Phaser.GameObjects.Text;
  private enemyHpText!:   Phaser.GameObjects.Text;
  private playerStatus!:  Phaser.GameObjects.Text;
  private enemyStatus!:   Phaser.GameObjects.Text;
  private playerStatusBadge!: Phaser.GameObjects.Rectangle;
  private enemyStatusBadge!:  Phaser.GameObjects.Rectangle;
  private moveButtons:    Phaser.GameObjects.Container[] = [];
  private playerShape!:   Phaser.GameObjects.Container;
  private enemyShape!:    Phaser.GameObjects.Container;

  // ── Keyboard menu navigation ─────────────────────────────────────────────
  private menuCursor = 0;
  private cursors!:   Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private confirmKey!: Phaser.Input.Keyboard.Key;
  private cursorIndicator!: Phaser.GameObjects.Text;

  // ── Crab idle animation ─────────────────────────────────────────────────
  private crabIdleSprite?: Phaser.GameObjects.Image;
  private crabIdleFrame = 0;
  private crabIdleTimer = 0;

  // ── Wild fish catch mechanic ──────────────────────────────────────────
  private isWildFish     = false;
  private fishSpriteData?: FishSpriteData;
  private catchButton?:  Phaser.GameObjects.Container;
  private catchGlowTween?: Phaser.Tweens.Tween;
  /** Overworld sprite key for beach enemies — used as battle sprite if no dedicated battle sprites */
  private enemySpriteKey?: string;

  // ── Mobile input ──────────────────────────────────────────────────────
  private mobileInput?: MobileInput;

  constructor() {
    super({ key: 'Battle' });
  }

  init(data: BattleInit) {
    this.enemyName   = data.enemyName   ?? 'Enemy';
    this.enemyParty  = data.enemyParty  ?? [];
    this.returnScene = data.returnScene ?? 'Beach';
    this.isWildFish     = data.isWildFish ?? false;
    this.fishSpriteData = data.fishSpriteData;
    this.enemySpriteKey = data.enemySpriteKey;

    // Reset stale refs from previous battle (scene instance is reused)
    this.crabIdleSprite = undefined;
    this.crabIdleFrame  = 0;
    this.crabIdleTimer  = 0;
    this.catchButton    = undefined;
    this.catchGlowTween = undefined;
    this.moveButtons    = [];
    this.logQueue       = [];
    this.phase          = 'player_pick';
  }

  create() {
    const party      = this.registry.get('party') as FishInstance[];
    const playerFish = { ...party[0] };
    const enemyFish  = { ...this.enemyParty[0] };

    // Build move PP map
    const movePP: Record<string, number> = {};
    for (const id of playerFish.moves) {
      movePP[id] = MOVES[id]?.pp ?? 10;
    }

    this.state = {
      playerFish,
      enemyFish,
      playerStatus: 'none',
      enemyStatus:  'none',
      movePP,
    };

    this.phase = 'player_pick';
    this.logQueue = [];

    this.buildUI();
    this.updateHpBars();

    // ── Keyboard input ───────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.confirmKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    this.menuCursor = 0;
    this.updateMenuCursor();

    // ── Mobile input ───────────────────────────────────────────────────
    if (MobileInput.IS_MOBILE) {
      this.mobileInput = new MobileInput(this);
      this.mobileInput.showContextButtons('battle');
    }
    this.events.once('shutdown', () => {
      this.tweens.killAll();
      this.time.removeAllEvents();
      this.mobileInput?.destroy();
      this.mobileInput = undefined;
    });

    const eName = this.fishDisplayName(enemyFish);
    this.setLog(`A wild ${eName} appeared!`);
    this.cameras.main.fadeIn(350, 0, 0, 0);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD UI
  // ═══════════════════════════════════════════════════════════════════════════
  private buildUI() {
    const W = 1280, H = 720;

    // ── Background — sunset sky gradient (richer, more bands) ───────────
    this.add.rectangle(W / 2, 15,  W, 30,  0xd06040);   // deep sunset top
    this.add.rectangle(W / 2, 40,  W, 30,  0xe07856);
    this.add.rectangle(W / 2, 70,  W, 30,  0xe88a62);
    this.add.rectangle(W / 2, 100, W, 30,  0xf4a76d);
    this.add.rectangle(W / 2, 130, W, 30,  0xf8b87a);
    this.add.rectangle(W / 2, 155, W, 20,  0xffd59e);
    this.add.rectangle(W / 2, 175, W, 20,  0xffeac0);
    this.add.rectangle(W / 2, 195, W, 20,  0xfff2d8);

    // ── Subtle cloud shapes (ellipses in sky) ───────────────────────────
    this.add.ellipse(200, 50, 180, 28, 0xffc898, 0.18);
    this.add.ellipse(500, 35, 140, 20, 0xffc898, 0.12);
    this.add.ellipse(900, 60, 200, 24, 0xffb880, 0.15);
    this.add.ellipse(1100, 40, 160, 22, 0xffc898, 0.10);
    this.add.ellipse(350, 80, 120, 16, 0xffd8b0, 0.10);
    this.add.ellipse(750, 70, 100, 14, 0xffd8b0, 0.08);

    // ── Ocean horizon band ──────────────────────────────────────────────
    this.add.rectangle(W / 2, 212, W, 14, 0x2dafb8, 0.55);
    this.add.rectangle(W / 2, 222, W, 8,  0x1b8a96, 0.35);

    // ── Battle ground (warm sand) ───────────────────────────────────────
    this.add.rectangle(W / 2, 370, W, 310, 0xf0e8d8);
    this.add.rectangle(W / 2, 228, W, 4,   0xd4c4a0);
    // Sand texture lines
    this.add.rectangle(W / 2, 280, W, 1, 0xe8dcc8, 0.4);
    this.add.rectangle(W / 2, 320, W, 1, 0xe8dcc8, 0.5);
    this.add.rectangle(W / 2, 370, W, 1, 0xe8dcc8, 0.3);
    this.add.rectangle(W / 2, 430, W, 1, 0xe8dcc8, 0.4);
    this.add.rectangle(W / 2, 475, W, 1, 0xe8dcc8, 0.3);

    // ── Opponent platform (wooden deck with rope border) ────────────────
    // Shadow under platform
    this.add.ellipse(920, 270, 260, 30, 0x000000, 0.10);
    // Main deck
    this.add.ellipse(920, 262, 250, 38, 0x6b4b2d, 0.7);  // dark wood edge
    this.add.ellipse(920, 258, 240, 34, 0x8b6b4d, 0.85);  // wood deck
    this.add.ellipse(920, 255, 220, 28, 0xc8b890, 0.6);    // deck highlight
    // Rope border (dashed look with small circles)
    for (let angle = 0; angle < Math.PI * 2; angle += 0.25) {
      const rx = 125 * Math.cos(angle);
      const ry = 18 * Math.sin(angle);
      this.add.circle(920 + rx, 258 + ry, 2.5, 0x8b7355, 0.5);
    }

    // ── Player platform ─────────────────────────────────────────────────
    this.add.ellipse(340, 395, 260, 30, 0x000000, 0.10);
    this.add.ellipse(340, 388, 250, 38, 0x6b4b2d, 0.7);
    this.add.ellipse(340, 384, 240, 34, 0x8b6b4d, 0.85);
    this.add.ellipse(340, 381, 220, 28, 0xb8a880, 0.6);
    for (let angle = 0; angle < Math.PI * 2; angle += 0.25) {
      const rx = 125 * Math.cos(angle);
      const ry = 18 * Math.sin(angle);
      this.add.circle(340 + rx, 384 + ry, 2.5, 0x8b7355, 0.5);
    }

    // ── Parchment texture overlay on battle field ───────────────────────
    // Subtle noise effect with scattered tiny dots
    for (let i = 0; i < 40; i++) {
      const dx = 100 + Math.random() * 1080;
      const dy = 240 + Math.random() * 280;
      this.add.circle(dx, dy, 1, 0xd4c4a0, 0.15 + Math.random() * 0.1);
    }

    // ── Bottom panel — wooden frame with parchment ─────────────────────
    // Top border of panel (rope-like)
    this.add.rectangle(W / 2, 534, W, 3, 0x8b7355);
    this.add.rectangle(W / 2, 537, W, 3, 0x5a3a1a);
    this.add.rectangle(W / 2, 540, W, 3, 0x8b7355);
    // Panel background (dark wood)
    this.add.rectangle(W / 2, 630, W, 180, 0x2c1011);
    // Wood plank lines
    this.add.rectangle(W / 2, 570, W, 1, 0x3d1a10, 0.4);
    this.add.rectangle(W / 2, 600, W, 1, 0x3d1a10, 0.3);
    this.add.rectangle(W / 2, 635, W, 1, 0x3d1a10, 0.4);
    this.add.rectangle(W / 2, 670, W, 1, 0x3d1a10, 0.3);
    this.add.rectangle(W / 2, 700, W, 1, 0x3d1a10, 0.2);
    // Subtle wood color variation
    this.add.rectangle(200, 630, 400, 180, 0x351510, 0.15);
    this.add.rectangle(900, 630, 300, 180, 0x3a1a12, 0.10);

    // ── Battle log — parchment with ornate wooden border ────────────────
    const logFrameOuter = this.add.rectangle(310, 544, 606, 112, 0x5a3a1a);
    logFrameOuter.setDepth(9);
    const logFrame = this.add.rectangle(310, 544, 598, 104, 0x8b6b4d);
    logFrame.setDepth(9);
    const logBg = this.add.rectangle(310, 544, 586, 92, 0xf5efe2);
    logBg.setStrokeStyle(1, 0xd4c4a0);
    logBg.setDepth(9);
    // Corner accents on log frame
    const cornerSize = 6;
    const logCorners = [
      { x: 310 - 293, y: 544 - 46 }, { x: 310 + 293, y: 544 - 46 },
      { x: 310 - 293, y: 544 + 46 }, { x: 310 + 293, y: 544 + 46 },
    ];
    logCorners.forEach(c => {
      this.add.rectangle(c.x, c.y, cornerSize, cornerSize, 0xffe066, 0.6).setDepth(9);
    });

    this.logText = this.add.text(28, 506, '', {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '22px',
      color:      '#2c1011',
      wordWrap:   { width: 555 },
      lineSpacing: 5,
      stroke:     '#d4c4a0',
      strokeThickness: 2,
    }).setDepth(10);

    // ── Move buttons ───────────────────────────────────────────────────────
    this.buildMoveButtons();

    // ── HP cards ───────────────────────────────────────────────────────────
    this.buildHpCard(true);   // enemy  — top-left
    this.buildHpCard(false);  // player — bottom-right

    // ── Team & Item buttons ──────────────────────────────────────────────
    this.buildActionButton(90, 670, 'TEAM', 'T', () => this.onTeamButton());
    this.buildActionButton(230, 670, 'ITEMS', 'I', () => this.onItemButton());

    // ── Fish shapes ────────────────────────────────────────────────────────
    this.enemyShape  = this.buildFishShape(920, 200, this.state.enemyFish,  true);
    this.playerShape = this.buildFishShape(340, 330, this.state.playerFish, false);
  }

  // ─── HP card ──────────────────────────────────────────────────────────────
  private buildHpCard(isEnemy: boolean) {
    const cx = isEnemy ? 200 : 1060;
    const cy = isEnemy ? 150 :  415;

    const card = this.add.container(cx, cy).setDepth(8);

    const fish    = isEnemy ? this.state.enemyFish : this.state.playerFish;
    const species = FISH_SPECIES.find(s => s.id === fish.speciesId);
    const name    = this.fishDisplayName(fish).toUpperCase().slice(0, 14);
    const tColor  = TYPE_COLOR[species?.type ?? 'Normal'] ?? 0x606060;
    const tLabel  = TYPE_LABEL_COLOR[species?.type ?? 'Normal'] ?? '#606060';
    const borderColor = isEnemy ? 0x882222 : 0x226622;
    const borderHighlight = isEnemy ? 0xaa3333 : 0x33aa33;

    // Card dimensions
    const cardW = 360, cardH = 110;

    // Outer wood border
    const outerBorder = this.add.rectangle(0, 0, cardW + 8, cardH + 8, 0x5a3a1a);
    // Main border
    const mainBorder = this.add.rectangle(0, 0, cardW + 4, cardH + 4, borderColor);
    // Parchment background
    const bg = this.add.rectangle(0, 0, cardW, cardH, 0xf0e8d8);
    bg.setStrokeStyle(2, 0xd4c4a0);
    // Header strip
    const hdr = this.add.rectangle(0, -(cardH / 2 - 16), cardW, 32, borderColor);

    // Name text with stroke
    const nameTxt = this.add.text(-(cardW / 2 - 12), -(cardH / 2 - 6), name, {
      fontFamily: 'PixelPirate, monospace',
      fontSize:   '20px',
      color:      '#ffe066',
      stroke:     '#000000',
      strokeThickness: 3,
    });

    // Level text
    const lvlTxt = this.add.text(cardW / 2 - 12, -(cardH / 2 - 6), `Lv ${fish.level}`, {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '18px',
      color:      '#f0e8d8',
      stroke:     '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0);

    // Type badge - more prominent
    const badgeW = 82, badgeH = 24;
    const badgeX = -(cardW / 2 - badgeW / 2 - 10);
    const badgeY = 6;
    const badgeBorder = this.add.rectangle(badgeX, badgeY, badgeW + 4, badgeH + 4, 0x2c1011);
    badgeBorder.setAlpha(0.7);
    const badgeBg = this.add.rectangle(badgeX, badgeY, badgeW, badgeH, tColor);
    const badgeTxt = this.add.text(badgeX, badgeY, (species?.type ?? '???').toUpperCase(), {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '14px',
      color:      '#ffffff',
      stroke:     '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // HP label
    const hpLabelX = -(cardW / 2 - 14);
    const hpBarY = 35;
    const hpLabel = this.add.text(hpLabelX, hpBarY - 6, 'HP', {
      fontFamily: 'PixelPirate, monospace',
      fontSize:   '16px',
      color:      '#2c1011',
      stroke:     '#f0e8d8',
      strokeThickness: 1,
    });

    // HP bar track + fill - wider
    const hpBarX = hpLabelX + 36;
    const hpBarW = 250;
    const hpBarH = 16;
    const hpTrackBorder = this.add.rectangle(hpBarX + hpBarW / 2, hpBarY, hpBarW + 4, hpBarH + 4, 0x2c1011);
    const hpTrack = this.add.rectangle(hpBarX + hpBarW / 2, hpBarY, hpBarW, hpBarH, 0x555555);
    const hpFill  = this.add.rectangle(hpBarX, hpBarY, hpBarW, hpBarH, 0x44cc44);
    hpFill.setOrigin(0, 0.5);

    // HP number text - bigger
    const hpNum = this.add.text(cardW / 2 - 12, hpBarY + 10, `${fish.currentHp}/${fish.maxHp}`, {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '16px',
      color:      '#2c1011',
      stroke:     '#f0e8d8',
      strokeThickness: 1,
    }).setOrigin(1, 0);

    // Status effect badge (hidden by default)
    const statusBadgeX = badgeX + badgeW + 16;
    const statusBadge = this.add.rectangle(statusBadgeX, badgeY, 52, 24, 0xcc3300);
    statusBadge.setVisible(false);
    statusBadge.setStrokeStyle(2, 0x000000);
    const statusTxt = this.add.text(statusBadgeX, badgeY, '', {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '13px',
      color:      '#ffffff',
      stroke:     '#000000',
      strokeThickness: 2,
      letterSpacing: 1,
    }).setOrigin(0.5);

    // Corner accents (gold dots)
    const cardCorners = [
      { x: -(cardW / 2 + 2), y: -(cardH / 2 + 2) },
      { x:  (cardW / 2 + 2), y: -(cardH / 2 + 2) },
      { x: -(cardW / 2 + 2), y:  (cardH / 2 + 2) },
      { x:  (cardW / 2 + 2), y:  (cardH / 2 + 2) },
    ];
    const corners = cardCorners.map(c =>
      this.add.circle(c.x, c.y, 4, 0xffe066, 0.8)
    );

    card.add([
      outerBorder, mainBorder, bg, hdr,
      nameTxt, lvlTxt,
      badgeBorder, badgeBg, badgeTxt,
      hpLabel, hpTrackBorder, hpTrack, hpFill, hpNum,
      statusBadge, statusTxt,
      ...corners,
    ]);

    if (isEnemy) {
      this.enemyHpFill   = hpFill;
      this.enemyHpText   = hpNum;
      this.enemyStatus   = statusTxt;
      this.enemyStatusBadge = statusBadge;
    } else {
      this.playerHpFill   = hpFill;
      this.playerHpText   = hpNum;
      this.playerStatus   = statusTxt;
      this.playerStatusBadge = statusBadge;
    }
  }

  // ─── Move buttons ─────────────────────────────────────────────────────────
  private buildMoveButtons() {
    const moves = this.state.playerFish.moves.slice(0, 4);
    const positions = [
      { x: 770,  y: 590 },
      { x: 1050, y: 590 },
      { x: 770,  y: 660 },
      { x: 1050, y: 660 },
    ];

    this.moveButtons = [];
    moves.forEach((moveId, i) => {
      const move = MOVES[moveId];
      if (!move) return;
      const pos   = positions[i];
      const tColor = TYPE_COLOR[move.type as string] ?? 0x505050;

      const btn = this.add.container(pos.x, pos.y).setDepth(10);

      // Outer wood frame
      const outerFrame = this.add.rectangle(0, 0, 258, 58, 0x5a3a1a);
      // Main button background
      const bg  = this.add.rectangle(0, 0, 252, 52, tColor);
      bg.setStrokeStyle(3, 0x2c1011);
      if (MobileInput.IS_MOBILE) {
        bg.setInteractive(
          new Phaser.Geom.Rectangle(-136, -36, 272, 72),
          Phaser.Geom.Rectangle.Contains
        );
      } else {
        bg.setInteractive({ useHandCursor: true });
      }

      // Inner highlight (top edge lighter)
      const highlight = this.add.rectangle(0, -18, 244, 8, 0xffffff, 0.12);

      // Move name — bigger with stroke
      const nameTxt = this.add.text(-114, -18, move.name.toUpperCase(), {
        fontFamily: 'PokemonDP, monospace',
        fontSize:   '18px',
        color:      '#ffffff',
        stroke:     '#000000',
        strokeThickness: 3,
      });

      // PP text — bigger with stroke
      const ppTxt = this.add.text(114, -18, `PP ${this.state.movePP[moveId]}/${move.pp}`, {
        fontFamily: 'PokemonDP, monospace',
        fontSize:   '14px',
        color:      '#ffe066',
        stroke:     '#000000',
        strokeThickness: 2,
      }).setOrigin(1, 0);

      // Category label — more visible
      const catLabel = move.category === 'physical' ? 'PHY' :
                       move.category === 'special'  ? 'SPC' : 'STS';
      const catTxt = this.add.text(-114, 6, catLabel, {
        fontFamily: 'PokemonDP, monospace',
        fontSize:   '13px',
        color:      '#ffffff',
        stroke:     '#000000',
        strokeThickness: 2,
      }).setAlpha(0.8);

      // Power display
      const pwrTxt = this.add.text(114, 6, `PWR ${move.power}`, {
        fontFamily: 'PokemonDP, monospace',
        fontSize:   '13px',
        color:      '#ffffff',
        stroke:     '#000000',
        strokeThickness: 2,
      }).setOrigin(1, 0).setAlpha(0.7);

      btn.add([outerFrame, bg, highlight, nameTxt, ppTxt, catTxt, pwrTxt]);

      bg.on('pointerover',  () => {
        bg.setStrokeStyle(3, 0xffe066);
        highlight.setAlpha(0.25);
      });
      bg.on('pointerout',   () => {
        bg.setStrokeStyle(3, i === this.menuCursor ? 0xffe066 : 0x2c1011);
        highlight.setAlpha(0.12);
      });
      bg.on('pointerdown',  () => {
        if (this.phase === 'player_pick') this.playerMove(moveId, i);
      });

      this.moveButtons.push(btn);
    });

    // Cursor arrow indicator — gold, bigger, more visible (hidden on mobile)
    const showCursor = moves.length > 0 && !MobileInput.IS_MOBILE;
    this.cursorIndicator = this.add.text(0, 0, '\u25b6', {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '24px',
      color:      '#ffe066',
      stroke:     '#000000',
      strokeThickness: 3,
    }).setDepth(11).setVisible(showCursor);

    // Animate the cursor indicator with a subtle pulse
    if (showCursor) {
      this.tweens.add({
        targets:  this.cursorIndicator,
        scaleX:   { from: 1.0, to: 1.25 },
        scaleY:   { from: 1.0, to: 1.25 },
        duration: 600,
        yoyo:     true,
        repeat:   -1,
        ease:     'Sine.easeInOut',
      });
    }

    // ── CATCH button (wild fish battles only) ────────────────────────────
    if (this.isWildFish) {
      this.buildCatchButton();
    }
  }

  private buildCatchButton() {
    // Place catch button below the log area
    const btn = this.add.container(310, 616).setDepth(12);

    // Outer glow rectangle (animated)
    const glow = this.add.rectangle(0, 0, 210, 54, 0xffe066, 0.35);
    glow.setStrokeStyle(2, 0xffe066);

    // Main button background (deep ocean blue)
    const outerFrame = this.add.rectangle(0, 0, 200, 46, 0x5a3a1a);
    const bg = this.add.rectangle(0, 0, 194, 40, 0x1850a0);
    bg.setStrokeStyle(3, 0xffe066);
    if (MobileInput.IS_MOBILE) {
      bg.setInteractive(
        new Phaser.Geom.Rectangle(-107, -30, 214, 60),
        Phaser.Geom.Rectangle.Contains
      );
    } else {
      bg.setInteractive({ useHandCursor: true });
    }

    // Highlight bar
    const highlight = this.add.rectangle(0, -14, 186, 6, 0xffffff, 0.15);

    // Net icon made of text/shapes (no emoji)
    // Simple net shape: diamond with cross lines
    const netG = this.add.graphics().setDepth(12);
    netG.lineStyle(2, 0xffe066, 0.9);
    // Net diamond outline
    netG.strokeRect(-82, -8, 16, 16);
    // Net cross lines
    netG.lineBetween(-82, -0, -66, -0);
    netG.lineBetween(-74, -8, -74, 8);
    // Handle
    netG.lineStyle(2, 0xc8a050, 0.8);
    netG.lineBetween(-82, 8, -86, 16);

    // "CATCH" text — big, bold, with stroke
    const txt = this.add.text(4, -2, 'CATCH', {
      fontFamily: 'PixelPirate, monospace',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Hint text below
    const hintTxt = this.add.text(0, 32, '[C] Weaken it first!', {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '14px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    btn.add([glow, outerFrame, bg, highlight, txt, hintTxt]);
    // Note: netG is added to scene directly since Graphics doesn't parent well in containers
    // Position net relative to button
    netG.setPosition(310, 616);

    this.catchButton = btn;

    // Pulsing gold border animation
    this.catchGlowTween = this.tweens.add({
      targets: glow,
      alpha:  { from: 0.15, to: 0.50 },
      scaleX: { from: 1.0, to: 1.05 },
      scaleY: { from: 1.0, to: 1.05 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    bg.on('pointerover', () => {
      bg.setStrokeStyle(3, 0xffffff);
      highlight.setAlpha(0.30);
    });
    bg.on('pointerout',  () => {
      bg.setStrokeStyle(3, 0xffe066);
      highlight.setAlpha(0.15);
    });
    bg.on('pointerdown', () => {
      if (this.phase === 'player_pick') this.attemptCatch();
    });
  }

  // ─── Action buttons (Team / Items) ──────────────────────────────────────
  private buildActionButton(x: number, y: number, label: string, key: string, onClick: () => void) {
    const btn = this.add.container(x, y).setDepth(10);

    const outerFrame = this.add.rectangle(0, 0, 120, 42, 0x5a3a1a);
    const bg = this.add.rectangle(0, 0, 114, 36, 0x3d1a10);
    bg.setStrokeStyle(2, 0x8b6b4d);
    bg.setInteractive({ useHandCursor: true });

    const highlight = this.add.rectangle(0, -12, 106, 6, 0xffffff, 0.08);

    const txt = this.add.text(-4, -1, label, {
      fontFamily: 'PixelPirate, monospace',
      fontSize: '16px',
      color: '#f0e8d8',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const keyHint = this.add.text(50, -1, `[${key}]`, {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '11px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0.5);

    btn.add([outerFrame, bg, highlight, txt, keyHint]);

    bg.on('pointerover', () => { bg.setStrokeStyle(2, 0xffe066); highlight.setAlpha(0.20); });
    bg.on('pointerout',  () => { bg.setStrokeStyle(2, 0x8b6b4d); highlight.setAlpha(0.08); });
    bg.on('pointerdown', () => { if (this.phase === 'player_pick') onClick(); });
  }

  private onTeamButton() {
    const party = this.registry.get('party') as FishInstance[];
    if (!party || party.length <= 1) {
      this.qLog('No other fish in your crew!');
      return;
    }
    this.qLog('Team swap coming soon...');
  }

  private onItemButton() {
    const inv = this.registry.get('inventory') as Record<string, number> | undefined;
    if (!inv || Object.keys(inv).length === 0) {
      this.qLog('No items to use!');
      return;
    }
    this.qLog('Item use coming soon...');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE — keyboard menu navigation
  // ═══════════════════════════════════════════════════════════════════════════
  update(_time: number, delta: number) {
    // Cycle crab idle animation (runs in all phases)
    if (this.crabIdleSprite) {
      this.crabIdleTimer += delta;
      if (this.crabIdleTimer >= 200) {
        this.crabIdleTimer = 0;
        this.crabIdleFrame = (this.crabIdleFrame + 1) % 4;
        this.crabIdleSprite.setTexture(`crab-battle-idle-${this.crabIdleFrame}`);
      }
    }

    if (this.phase !== 'player_pick') return;
    const numMoves = this.moveButtons.length;
    if (numMoves === 0) return;

    const upJust    = Phaser.Input.Keyboard.JustDown(this.cursors.up!)    || Phaser.Input.Keyboard.JustDown(this.wasdKeys.W);
    const downJust  = Phaser.Input.Keyboard.JustDown(this.cursors.down!)  || Phaser.Input.Keyboard.JustDown(this.wasdKeys.S);
    const leftJust  = Phaser.Input.Keyboard.JustDown(this.cursors.left!)  || Phaser.Input.Keyboard.JustDown(this.wasdKeys.A);
    const rightJust = Phaser.Input.Keyboard.JustDown(this.cursors.right!) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.D);
    const confirm   = Phaser.Input.Keyboard.JustDown(this.cursors.space!) || Phaser.Input.Keyboard.JustDown(this.confirmKey) || (this.mobileInput?.isActionJustDown() ?? false);

    // Layout: 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right
    // Left/Right move between columns; Up/Down move between rows
    let moved = false;
    if (rightJust) { if (this.menuCursor % 2 === 0 && this.menuCursor + 1 < numMoves) { this.menuCursor += 1; moved = true; } }
    if (leftJust)  { if (this.menuCursor % 2 === 1) { this.menuCursor -= 1; moved = true; } }
    if (downJust)  { if (this.menuCursor < 2 && this.menuCursor + 2 < numMoves) { this.menuCursor += 2; moved = true; } }
    if (upJust)    { if (this.menuCursor >= 2) { this.menuCursor -= 2; moved = true; } }

    if (moved) this.updateMenuCursor();

    if (confirm) {
      // Use the valid moves list (matching button order) not raw moves array
      const validMoves = this.state.playerFish.moves.filter(id => !!MOVES[id]);
      // Clamp cursor to valid range
      if (this.menuCursor >= validMoves.length) this.menuCursor = Math.max(0, validMoves.length - 1);
      const moveId = validMoves[this.menuCursor];
      if (moveId) {
        const btnIdx = this.menuCursor;
        this.playerMove(moveId, btnIdx);
      }
    }

    // C key = attempt catch (wild fish only)
    const cKey = this.input.keyboard!.keys[Phaser.Input.Keyboard.KeyCodes.C];
    if (cKey && Phaser.Input.Keyboard.JustDown(cKey) && this.isWildFish) {
      this.attemptCatch();
    }

    // T key = team, I key = items
    const tKey = this.input.keyboard!.keys[Phaser.Input.Keyboard.KeyCodes.T];
    if (tKey && Phaser.Input.Keyboard.JustDown(tKey)) this.onTeamButton();
    const iKey = this.input.keyboard!.keys[Phaser.Input.Keyboard.KeyCodes.I];
    if (iKey && Phaser.Input.Keyboard.JustDown(iKey)) this.onItemButton();
  }

  private updateMenuCursor() {
    if (!this.cursorIndicator || this.moveButtons.length === 0) return;
    const btn = this.moveButtons[this.menuCursor];
    if (!btn) return;

    // Highlight active button border (gold), deactivate others
    this.moveButtons.forEach((b, i) => {
      const outerFrame = b.getAt(0) as Phaser.GameObjects.Rectangle;
      const bg = b.getAt(1) as Phaser.GameObjects.Rectangle;
      if (i === this.menuCursor) {
        bg.setStrokeStyle(3, 0xffe066);
        outerFrame.setFillStyle(0xffe066, 0.6);
      } else {
        bg.setStrokeStyle(3, 0x2c1011);
        outerFrame.setFillStyle(0x5a3a1a);
      }
    });

    // Position the arrow to the left of the selected button
    this.cursorIndicator.setPosition(btn.x - 142, btn.y - 8);
  }

  // ─── Fish shape (sprite if available, else drawn from primitives) ─────────
  private buildFishShape(x: number, y: number, fish: FishInstance, facingLeft: boolean): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(7);

    // Special case: beach enemy (speciesId 0) — use enemy-specific sprite
    const sid = fish.speciesId;
    if (sid === 0) {
      // Non-crab beach enemies: use dedicated battle sprite, fall back to overworld south
      if (this.enemySpriteKey && this.enemySpriteKey !== 'crab-basic') {
        const battleKey = `${this.enemySpriteKey}-battle`;
        const overworldKey = `${this.enemySpriteKey}-south`;
        const spriteKey = this.textures.exists(battleKey) ? battleKey : overworldKey;
        if (this.textures.exists(spriteKey)) {
          const img = this.add.image(0, -30, spriteKey);
          const tw = img.width, th = img.height;
          const scale = Math.min(190 / tw, 190 / th);
          img.setDisplaySize(tw * scale, th * scale);
          container.add([img]);
          // Idle bob animation
          this.tweens.add({
            targets: img, y: img.y - 6,
            duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          });
          return container;
        }
      }
      // Cannonball Crab: use dedicated battle sprites
      if (this.textures.exists('crab-battle-idle-0')) {
        const img = this.add.image(0, -30, 'crab-battle-idle-0').setDisplaySize(190, 190);
        container.add([img]);
        this.crabIdleSprite = img;
        this.crabIdleFrame = 0;
        this.crabIdleTimer = 0;
        return container;
      }
    }

    // Derive texture key from species spriteGrid/spriteIndex
    let textureKey: string | undefined;
    if (typeof sid === 'string' && sid.startsWith('fish-')) {
      textureKey = sid;
    } else {
      const numId = Number(sid);
      const species = FISH_SPECIES.find(s => s.id === numId);
      if (species?.spriteGrid && species?.spriteIndex !== undefined) {
        textureKey = `fish-${species.spriteGrid}-${String(species.spriteIndex).padStart(2, '0')}`;
      }
    }

    // Try sprite first — BIGGER sizes for visibility + idle animation
    if (textureKey && this.textures.exists(textureKey)) {
      const maxSize = facingLeft ? 140 : 170;
      const img = this.add.image(0, -30, textureKey);
      // Preserve aspect ratio — fit within maxSize box without squashing
      const tw = img.width;
      const th = img.height;
      const scale = Math.min(maxSize / tw, maxSize / th);
      img.setDisplaySize(tw * scale, th * scale);
      if (!facingLeft) img.setFlipX(true);
      container.add([img]);

      // Idle bob — gentle float up/down like swimming in place
      this.tweens.add({
        targets: img,
        y: img.y - 6,
        duration: 1400 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Breathing scale — subtle rhythmic pulse
      this.tweens.add({
        targets: img,
        scaleX: img.scaleX * 1.03,
        scaleY: img.scaleY * 0.97,
        duration: 1800 + Math.random() * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: 200,
      });

      // Entrance — slide in from the side + fade
      const slideFrom = facingLeft ? -80 : 80;
      img.x += slideFrom;
      img.alpha = 0;
      this.tweens.add({
        targets: img,
        x: img.x - slideFrom,
        alpha: 1,
        duration: 500,
        ease: 'Back.easeOut',
      });

      return container;
    }

    // Fallback: geometric shapes
    const species   = FISH_SPECIES.find(s => s.id === fish.speciesId || s.id === Number(fish.speciesId));
    const bodyColor = TYPE_COLOR[species?.type ?? 'Normal'] ?? 0x606060;
    const lightColor = Phaser.Display.Color.ValueToColor(bodyColor).lighten(25).color;

    const scale = facingLeft ? 1.15 : 1.4; // player fish larger
    const bw = Math.round(90 * scale);
    const bh = Math.round(55 * scale);

    const tailX = facingLeft ? 52 * scale : -52 * scale;
    const eyeX  = facingLeft ? -28 * scale :  28 * scale;
    const pupilOffX = facingLeft ? -2 : 2;

    const shadow = this.add.ellipse(0, bh * 0.5 + 10, bw * 0.9, 14, 0x000000, 0.12);

    const tail = this.add.triangle(
      tailX, 0,
      0, -20 * scale, 0, 20 * scale,
      facingLeft ? 28 * scale : -28 * scale, 0,
      bodyColor
    );
    tail.setStrokeStyle(2, 0x000000);

    const fin = this.add.triangle(
      0, -(bh * 0.5 + 18 * scale),
      -14 * scale, 0, 14 * scale, 0, 0, -16 * scale,
      lightColor
    );
    fin.setStrokeStyle(1, 0x000000);

    const body = this.add.ellipse(0, 0, bw, bh, bodyColor);
    body.setStrokeStyle(2, 0x000000);

    const eye   = this.add.circle(eyeX, -8 * scale,  8 * scale, 0xffffff);
    eye.setStrokeStyle(1, 0x000000);
    const pupil = this.add.circle(eyeX + pupilOffX, -8 * scale, 4 * scale, 0x111111);

    // Stripe detail
    const stripe = this.add.ellipse(tailX * 0.35, 0, bw * 0.28, bh * 0.55, lightColor, 0.35);

    container.add([shadow, tail, fin, body, stripe, eye, pupil]);
    return container;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CATCH MECHANIC
  // ═══════════════════════════════════════════════════════════════════════════
  private attemptCatch() {
    if (!this.isWildFish || !this.fishSpriteData) return;
    this.phase = 'animating';
    this.setButtonsEnabled(false);

    const enemy = this.state.enemyFish;
    const hpRatio = enemy.currentHp / enemy.maxHp;

    // Catch chance: base 15% + up to 75% based on how low HP is
    // At full HP: 15%, at 50%: ~52%, at 25%: ~71%, at 1HP: ~90%
    const catchChance = 0.15 + (1 - hpRatio) * 0.75;
    const roll = Math.random();

    this.qLog('You throw a net!');

    if (roll < catchChance) {
      // Caught!
      this.qLog(`Gotcha! ${this.fishDisplayName(enemy)} was caught!`);
      this.drainQueue(() => {
        this.time.delayedCall(800, () => {
          this.catchFish();
        });
      });
    } else {
      // Failed — fish attacks back
      this.qLog('Oh no! It broke free!');
      this.drainQueue(() => {
        this.updateHpBars();
        this.flashHit(this.enemyShape);
        this.time.delayedCall(500, () => this.enemyTurn());
      });
    }
  }

  private catchFish() {
    if (!this.fishSpriteData) return;
    const party = (this.registry.get('party') as FishInstance[]) || [];

    if (party.length < 6) {
      const enemy = this.state.enemyFish;
      // Use numeric speciesId from enemy fish (not textureKey string)
      const caughtFish: FishInstance = {
        uid: `caught_${Date.now()}`,
        speciesId: enemy.speciesId,
        nickname: this.fishSpriteData.name,
        level: enemy.level,
        xp: 0,
        currentHp: enemy.currentHp,
        maxHp: enemy.maxHp,
        moves: enemy.moves,
        iv: enemy.iv,
      };
      party.push(caughtFish);
      this.registry.set('party', party);
      this.qLog(`${this.fishSpriteData.name} joined your crew! (${party.length}/6)`);
    } else {
      this.qLog('Your party is full! It swam away...');
    }

    this.drainQueue(() => {
      this.time.delayedCall(1000, () => this.endBattle(true));
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMBAT LOGIC
  // ═══════════════════════════════════════════════════════════════════════════
  private playerMove(moveId: string, btnIdx: number) {
    if (this.state.movePP[moveId] <= 0) {
      this.setLog('No PP left for that move!');
      return;
    }

    this.phase = 'animating';
    this.setButtonsEnabled(false);
    this.state.movePP[moveId]--;
    this.refreshPPDisplay(btnIdx, moveId);

    // Paralyze skip
    if (this.state.playerStatus === 'paralyze' && Math.random() < PARALYZE_SKIP_CHANCE) {
      this.qLog(`${this.fishDisplayName(this.state.playerFish)} is paralyzed!`);
      this.qLog('Can\'t move this turn!');
      this.drainQueue(() => this.time.delayedCall(400, () => this.enemyTurn()));
      return;
    }

    const move = MOVES[moveId];
    if (!move) {
      this.qLog('Move failed!');
      this.drainQueue(() => this.time.delayedCall(400, () => this.enemyTurn()));
      return;
    }
    const { damage, effLabel, missed } = this.calcDamage(this.state.playerFish, this.state.enemyFish, move);

    this.qLog(`${this.fishDisplayName(this.state.playerFish)} used ${move.name}!`);
    if (missed) {
      this.qLog('But it missed!');
    } else {
      if (effLabel) this.qLog(effLabel);
      this.state.enemyFish.currentHp = Math.max(0, this.state.enemyFish.currentHp - damage);
      this.tryApplyStatus(move, this.state.enemyFish, 'enemy');
    }

    this.drainQueue(() => {
      this.updateHpBars();
      this.flashHit(this.enemyShape);
      if (!missed) this.sound.play('sfx-battle-hit', { volume: 0.35 });
      if (this.state.enemyFish.currentHp <= 0) {
        this.time.delayedCall(500, () => this.enemyFainted());
      } else {
        this.time.delayedCall(500, () => this.enemyTurn());
      }
    });
  }

  private enemyTurn() {
    const enemy  = this.state.enemyFish;
    const player = this.state.playerFish;

    // Burn tick on enemy
    if (this.state.enemyStatus === 'burn') {
      const dmg = Math.max(1, Math.floor(enemy.maxHp * BURN_DAMAGE_FRACTION));
      enemy.currentHp = Math.max(0, enemy.currentHp - dmg);
      this.qLog(`${this.fishDisplayName(enemy)} is hurt by its burn!`);
      if (enemy.currentHp <= 0) {
        this.drainQueue(() => { this.updateHpBars(); this.time.delayedCall(400, () => this.enemyFainted()); });
        return;
      }
    }

    // Paralyze skip for enemy
    if (this.state.enemyStatus === 'paralyze' && Math.random() < PARALYZE_SKIP_CHANCE) {
      this.qLog(`${this.fishDisplayName(enemy)} is paralyzed — can't move!`);
      this.drainQueue(() => { this.updateHpBars(); this.time.delayedCall(400, () => this.nextPlayerTurn()); });
      return;
    }

    // Enemy picks random available move
    const available = enemy.moves.filter(id => MOVES[id]);
    const moveId    = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : 'struggle';
    const move = MOVES[moveId] ?? MOVES['struggle'];

    const { damage, effLabel, missed } = this.calcDamage(enemy, player, move);
    this.qLog(`${this.fishDisplayName(enemy)} used ${move.name}!`);
    if (missed) {
      this.qLog('But it missed!');
    } else {
      if (effLabel) this.qLog(effLabel);
      player.currentHp = Math.max(0, player.currentHp - damage);
      this.tryApplyStatus(move, player, 'player');
    }

    // Burn tick on player end-of-round
    if (this.state.playerStatus === 'burn') {
      const dmg = Math.max(1, Math.floor(player.maxHp * BURN_DAMAGE_FRACTION));
      player.currentHp = Math.max(0, player.currentHp - dmg);
      this.qLog(`${this.fishDisplayName(player)} is hurt by its burn!`);
    }

    this.drainQueue(() => {
      this.updateHpBars();
      this.flashHit(this.playerShape);
      if (!missed) this.sound.play('sfx-battle-hit', { volume: 0.35 });
      if (player.currentHp <= 0) {
        this.time.delayedCall(500, () => this.playerFainted());
      } else {
        this.time.delayedCall(500, () => this.nextPlayerTurn());
      }
    });
  }

  private nextPlayerTurn() {
    this.phase = 'player_pick';
    this.setButtonsEnabled(true);
    this.setLog('What will you do?');
  }

  // ─── Outcome ──────────────────────────────────────────────────────────────
  private enemyFainted() {
    this.phase = 'result';
    const enemy = this.state.enemyFish;
    const player = this.state.playerFish;
    this.enemyShape.setVisible(false);
    this.sound.play('sfx-faint', { volume: 0.35 });

    // Award real XP via XPSystem
    const result = addBattleXP(player, enemy.level, FISH_SPECIES);

    this.qLog(`${this.fishDisplayName(enemy)} fainted!`);
    this.qLog(`${this.fishDisplayName(player)} gained ${result.xp} XP!`);

    if (result.leveledUp) {
      this.sound.play('sfx-levelup', { volume: 0.4 });
      for (let i = 0; i < result.levelsGained; i++) {
        this.qLog(`${this.fishDisplayName(player)} grew to level ${player.level - result.levelsGained + i + 1}!`);
      }

      // Check for evolution
      const evoTarget = checkEvolution(player, FISH_SPECIES);
      if (evoTarget) {
        const oldName = this.fishDisplayName(player);
        this.qLog('');
        this.qLog(`What? ${oldName} is evolving!`);
        this.drainQueue(() => {
          this.showEvolutionSequence(player, evoTarget.name);
        });
        return;
      }
    }

    // Show XP progress toward next level
    const needed = xpToNextLevel(player.level);
    if (needed !== Infinity) {
      this.qLog(`XP: ${player.xp}/${needed} to next level`);
    }

    this.drainQueue(() => this.time.delayedCall(1200, () => this.endBattle(true)));
  }

  private showEvolutionSequence(fish: FishInstance, evolvedName: string) {
    const W = 1280, H = 720;

    // Dark overlay
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(50);

    // Evolution flash container
    const evoContainer = this.add.container(W / 2, H / 2 - 40).setDepth(51);

    // Glow circle behind the fish
    const glow = this.add.circle(0, 0, 80, 0xffe066, 0.0);
    evoContainer.add(glow);

    // "Evolving..." text
    const evoText = this.add.text(W / 2, H / 2 + 100, 'Evolving...', {
      fontFamily: 'PixelPirate, monospace',
      fontSize: '32px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(51);

    // Phase 1: glow pulses (1.5s)
    this.tweens.add({
      targets: glow,
      alpha: { from: 0, to: 0.8 },
      scaleX: { from: 0.5, to: 2.5 },
      scaleY: { from: 0.5, to: 2.5 },
      duration: 1500,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        // Phase 2: white flash
        const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.9).setDepth(52);

        // Perform the actual evolution
        const oldName = this.fishDisplayName(fish);
        const evolved = evolveFish(fish, FISH_SPECIES);

        // Update fish in-place for the battle state
        Object.assign(fish, evolved);

        this.tweens.add({
          targets: flash,
          alpha: 0,
          duration: 800,
          ease: 'Sine.easeOut',
          onComplete: () => {
            flash.destroy();

            // Phase 3: show result
            evoText.setText(`${oldName} evolved into\n${evolvedName}!`);
            evoText.setAlign('center');

            // Show new level text
            const lvlText = this.add.text(W / 2, H / 2 + 170, `Level ${fish.level}`, {
              fontFamily: 'PokemonDP, monospace',
              fontSize: '22px',
              color: '#ffffff',
              stroke: '#000000',
              strokeThickness: 3,
            }).setOrigin(0.5).setDepth(51);

            // Fade out after 2.5s
            this.time.delayedCall(2500, () => {
              this.tweens.add({
                targets: [overlay, evoContainer, evoText, lvlText, glow],
                alpha: 0,
                duration: 500,
                onComplete: () => {
                  overlay.destroy();
                  evoContainer.destroy();
                  evoText.destroy();
                  lvlText.destroy();
                  this.endBattle(true);
                },
              });
            });
          },
        });
      },
    });
  }

  private playerFainted() {
    this.phase = 'result';
    this.playerShape.setVisible(false);
    this.sound.play('sfx-faint', { volume: 0.35 });
    this.qLog(`${this.fishDisplayName(this.state.playerFish)} fainted!`);
    this.qLog('You blacked out...');
    this.drainQueue(() => this.time.delayedCall(1500, () => this.endBattle(false)));
  }

  private endBattle(_won: boolean) {
    // Persist full fish state back to registry (XP, level, HP, moves, speciesId)
    const party = this.registry.get('party') as FishInstance[];
    const p = this.state.playerFish;
    party[0].currentHp = Math.max(0, p.currentHp);
    party[0].maxHp     = p.maxHp;
    party[0].level     = p.level;
    party[0].xp        = p.xp;
    party[0].moves     = p.moves;
    party[0].speciesId = p.speciesId;
    party[0].nickname  = p.nickname;
    // Restore to 1 HP minimum so game doesn't softlock
    if (party[0].currentHp === 0) party[0].currentHp = 1;
    this.registry.set('party', party);

    this.cameras.main.fadeOut(450, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.resume(this.returnScene);
    });
  }

  // ─── Damage calculation ───────────────────────────────────────────────────
  private calcDamage(
    attacker: FishInstance,
    defender: FishInstance,
    move: Move
  ): { damage: number; effLabel: string; missed: boolean } {
    if (Math.random() * 100 > move.accuracy) {
      return { damage: 0, effLabel: '', missed: true };
    }

    const atkSp = FISH_SPECIES.find(s => s.id === attacker.speciesId || s.id === Number(attacker.speciesId));
    const defSp = FISH_SPECIES.find(s => s.id === defender.speciesId || s.id === Number(defender.speciesId));

    const atk = (atkSp?.baseStats.atk ?? 50) + attacker.level * 2 + (attacker.iv?.attack ?? 5);
    const def = (defSp?.baseStats.def ?? 50) + defender.level * 2 + (defender.iv?.defense ?? 5);

    let dmg = Math.floor(((2 * attacker.level / 5 + 2) * move.power * (atk / def)) / 50 + 2);

    // STAB
    if (atkSp && atkSp.type === (move.type as string)) {
      dmg = Math.floor(dmg * STAB_BONUS);
    }

    // Type effectiveness
    const multi    = getTypeEffectiveness(move.type as string, defSp?.type ?? 'Normal');
    dmg            = Math.floor(dmg * multi);

    // Random roll
    const roll = DAMAGE_RANDOM_MIN + Math.random() * (DAMAGE_RANDOM_MAX - DAMAGE_RANDOM_MIN);
    dmg = Math.max(1, Math.floor(dmg * roll));

    return { damage: dmg, effLabel: getEffectivenessLabel(multi), missed: false };
  }

  // ─── Status effects ───────────────────────────────────────────────────────
  private tryApplyStatus(move: Move, target: FishInstance, who: 'player' | 'enemy') {
    if (!move.effect) return;
    if (Math.random() > move.effect.chance) return;

    const currentStatus = who === 'player' ? this.state.playerStatus : this.state.enemyStatus;
    if (currentStatus !== 'none') return;

    const name = this.fishDisplayName(target);
    if (move.effect.type === 'burn') {
      if (who === 'player') this.state.playerStatus = 'burn';
      else                  this.state.enemyStatus  = 'burn';
      this.qLog(`${name} was burned!`);
    } else if (move.effect.type === 'paralyze') {
      if (who === 'player') this.state.playerStatus = 'paralyze';
      else                  this.state.enemyStatus  = 'paralyze';
      this.qLog(`${name} was paralyzed!`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UI UPDATES
  // ═══════════════════════════════════════════════════════════════════════════
  private updateHpBars() {
    const p = this.state.playerFish;
    const e = this.state.enemyFish;

    const pRatio = Math.max(0, p.currentHp / p.maxHp);
    const eRatio = Math.max(0, e.currentHp / e.maxHp);

    const hpBarW = 250;
    const pW = Math.max(0, Math.floor(hpBarW * pRatio));
    const eW = Math.max(0, Math.floor(hpBarW * eRatio));

    this.playerHpFill.setSize(pW, 16);
    this.playerHpFill.setFillStyle(pRatio > 0.5 ? 0x44cc44 : pRatio > 0.25 ? 0xffcc00 : 0xff4444);
    this.playerHpText.setText(`${p.currentHp}/${p.maxHp}`);

    this.enemyHpFill.setSize(eW, 16);
    this.enemyHpFill.setFillStyle(eRatio > 0.5 ? 0x44cc44 : eRatio > 0.25 ? 0xffcc00 : 0xff4444);
    this.enemyHpText.setText(`${e.currentHp}/${e.maxHp}`);

    // Status badges with colored backgrounds
    const pSt = this.state.playerStatus;
    const eSt = this.state.enemyStatus;

    if (pSt !== 'none') {
      const label = pSt === 'burn' ? 'BURN' : 'PARA';
      this.playerStatus.setText(label);
      this.playerStatus.setColor(STATUS_BADGE_TEXT_COLOR[pSt] ?? '#ffffff');
      this.playerStatusBadge.setFillStyle(STATUS_BADGE_COLOR[pSt] ?? 0x666666);
      this.playerStatusBadge.setVisible(true);
    } else {
      this.playerStatus.setText('');
      this.playerStatusBadge.setVisible(false);
    }

    if (eSt !== 'none') {
      const label = eSt === 'burn' ? 'BURN' : 'PARA';
      this.enemyStatus.setText(label);
      this.enemyStatus.setColor(STATUS_BADGE_TEXT_COLOR[eSt] ?? '#ffffff');
      this.enemyStatusBadge.setFillStyle(STATUS_BADGE_COLOR[eSt] ?? 0x666666);
      this.enemyStatusBadge.setVisible(true);
    } else {
      this.enemyStatus.setText('');
      this.enemyStatusBadge.setVisible(false);
    }
  }

  private setLog(msg: string) {
    this.logText.setText(msg);
    this.logQueue = [];
  }

  private qLog(msg: string) {
    this.logQueue.push(msg);
  }

  private drainQueue(onDone: () => void) {
    if (this.logQueue.length === 0) { onDone(); return; }
    const msg = this.logQueue.shift()!;
    if (msg === '') {
      this.time.delayedCall(350, () => this.drainQueue(onDone));
      return;
    }
    this.logText.setText(msg);
    this.time.delayedCall(1100, () => this.drainQueue(onDone));
  }

  private setButtonsEnabled(on: boolean) {
    for (const btn of this.moveButtons) {
      const bg = btn.getAt(1) as Phaser.GameObjects.Rectangle;
      bg.setAlpha(on ? 1.0 : 0.45);
      if (on) bg.setInteractive({ useHandCursor: true });
      else    bg.disableInteractive();
    }
    this.cursorIndicator?.setVisible(on && !MobileInput.IS_MOBILE);
    if (on) this.updateMenuCursor();

    // Also dim/disable catch button
    if (this.catchButton) {
      this.catchButton.setAlpha(on ? 1.0 : 0.45);
      const catchBg = this.catchButton.getAt(2) as Phaser.GameObjects.Rectangle;
      if (catchBg) {
        if (on) catchBg.setInteractive({ useHandCursor: true });
        else    catchBg.disableInteractive();
      }
    }
  }

  private refreshPPDisplay(btnIdx: number, moveId: string) {
    const btn  = this.moveButtons[btnIdx];
    const move = MOVES[moveId];
    if (!btn || !move) return;
    const ppTxt = btn.getAt(4) as Phaser.GameObjects.Text;
    ppTxt?.setText(`PP ${this.state.movePP[moveId]}/${move.pp}`);
  }

  private flashHit(shape: Phaser.GameObjects.Container) {
    this.tweens.add({
      targets:  shape,
      alpha:    { from: 0.15, to: 1 },
      duration: 100,
      yoyo:     true,
      repeat:   2,
      onComplete: () => { shape.setAlpha(1); },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private fishDisplayName(fish: FishInstance): string {
    if (fish.nickname) return fish.nickname;
    const sp = FISH_SPECIES.find(s => s.id === fish.speciesId || s.id === Number(fish.speciesId));
    return sp?.name ?? 'Unknown Fish';
  }
}
