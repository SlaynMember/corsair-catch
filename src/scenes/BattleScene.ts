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

// ─── Types ────────────────────────────────────────────────────────────────────
interface BattleInit {
  enemyName:   string;
  enemyParty:  FishInstance[];
  returnScene: string;
  isWildFish?:    boolean;
  fishSpriteData?: FishSpriteData;
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

  constructor() {
    super({ key: 'Battle' });
  }

  init(data: BattleInit) {
    this.enemyName   = data.enemyName   ?? 'Enemy';
    this.enemyParty  = data.enemyParty  ?? [];
    this.returnScene = data.returnScene ?? 'Beach';
    this.isWildFish     = data.isWildFish ?? false;
    this.fishSpriteData = data.fishSpriteData;
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

    this.menuCursor = 0;
    this.updateMenuCursor();

    const eName = this.fishDisplayName(enemyFish);
    this.setLog(`A wild ${eName} appeared!`);
    this.cameras.main.fadeIn(350, 0, 0, 0);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD UI
  // ═══════════════════════════════════════════════════════════════════════════
  private buildUI() {
    const W = 1280, H = 720;

    // ── Background ─────────────────────────────────────────────────────────
    // Sunset sky
    this.add.rectangle(W / 2, 120, W, 240, 0xffd59e);
    this.add.rectangle(W / 2, 50,  W, 100, 0xf4a76d);
    // Battle ground (sand)
    this.add.rectangle(W / 2, 380, W, 300, 0xf0e8d8);
    // Ground line
    this.add.rectangle(W / 2, 240, W, 4, 0xd4c4a0);

    // Opponent platform (raised, enemy stands on it)
    this.add.ellipse(920, 258, 220, 30, 0xc8b890, 0.6);
    // Player platform
    this.add.ellipse(340, 380, 220, 30, 0xb8a880, 0.6);

    // ── Bottom panel ───────────────────────────────────────────────────────
    this.add.rectangle(W / 2, 556, W, 2, 0x8b6b4d);
    this.add.rectangle(W / 2, 628, W, 185, 0x2c1011);

    // ── Battle log ─────────────────────────────────────────────────────────
    const logBg = this.add.rectangle(310, 545, 585, 92, 0xf0e8d8);
    logBg.setStrokeStyle(3, 0x8b6b4d);
    logBg.setDepth(9);
    this.logText = this.add.text(28, 502, '', {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '10px',
      color:      '#2c1011',
      wordWrap:   { width: 565 },
      lineSpacing: 6,
    }).setDepth(10);

    // ── Move buttons ───────────────────────────────────────────────────────
    this.buildMoveButtons();

    // ── HP cards ───────────────────────────────────────────────────────────
    this.buildHpCard(true);   // enemy  — top-left
    this.buildHpCard(false);  // player — bottom-right

    // ── Fish shapes ────────────────────────────────────────────────────────
    this.enemyShape  = this.buildFishShape(920, 210, this.state.enemyFish,  true);
    this.playerShape = this.buildFishShape(340, 335, this.state.playerFish, false);
  }

  // ─── HP card ──────────────────────────────────────────────────────────────
  private buildHpCard(isEnemy: boolean) {
    const cx = isEnemy ? 200 : 1060;
    const cy = isEnemy ? 158 :  408;

    const card = this.add.container(cx, cy).setDepth(8);

    const fish    = isEnemy ? this.state.enemyFish : this.state.playerFish;
    const species = FISH_SPECIES.find(s => s.id === fish.speciesId);
    const name    = this.fishDisplayName(fish).toUpperCase().slice(0, 14);
    const tColor  = TYPE_LABEL_COLOR[species?.type ?? 'Normal'] ?? '#606060';
    const border  = isEnemy ? 0x882222 : 0x226622;

    const bg = this.add.rectangle(0, 0, 340, 72, 0xf0e8d8);
    bg.setStrokeStyle(3, border);
    const hdr = this.add.rectangle(0, -29, 340, 14, border);

    const nameTxt = this.add.text(-158, -33, name, {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '9px',
      color:      '#f0e8d8',
    });
    const lvlTxt = this.add.text(158, -33, `Lv${fish.level}`, {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '8px',
      color:      '#f0e8d8',
    }).setOrigin(1, 0);

    // Type badge
    const badgeBg = this.add.rectangle(-138, 4, 52, 16, border);
    const badgeTxt = this.add.text(-138, 4, species?.type ?? '???', {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '7px',
      color:      '#ffffff',
    }).setOrigin(0.5);

    // HP bar track + fill
    const hpTrack = this.add.rectangle( 18, 20, 240, 10, 0x888888);
    const hpFill  = this.add.rectangle(-102, 20, 240, 10, 0x44cc44);
    hpFill.setOrigin(0, 0.5);

    const hpLabel = this.add.text(-155, 15, 'HP', {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '8px',
      color:      '#2c1011',
    });
    const hpNum = this.add.text(158, 15, `${fish.currentHp}/${fish.maxHp}`, {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '7px',
      color:      '#2c1011',
    }).setOrigin(1, 0);

    const statusTxt = this.add.text(-155, 3, '', {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '7px',
      color:      '#ff6600',
    });

    card.add([bg, hdr, nameTxt, lvlTxt, badgeBg, badgeTxt, hpTrack, hpFill, hpLabel, hpNum, statusTxt]);

    if (isEnemy) {
      this.enemyHpFill  = hpFill;
      this.enemyHpText  = hpNum;
      this.enemyStatus  = statusTxt;
    } else {
      this.playerHpFill  = hpFill;
      this.playerHpText  = hpNum;
      this.playerStatus  = statusTxt;
    }
  }

  // ─── Move buttons ─────────────────────────────────────────────────────────
  private buildMoveButtons() {
    const moves = this.state.playerFish.moves.slice(0, 4);
    const positions = [
      { x: 770,  y: 604 },
      { x: 1040, y: 604 },
      { x: 770,  y: 668 },
      { x: 1040, y: 668 },
    ];

    this.moveButtons = [];
    moves.forEach((moveId, i) => {
      const move = MOVES[moveId];
      if (!move) return;
      const pos   = positions[i];
      const tColor = TYPE_COLOR[move.type as string] ?? 0x505050;

      const btn = this.add.container(pos.x, pos.y).setDepth(10);
      const bg  = this.add.rectangle(0, 0, 248, 52, tColor);
      bg.setStrokeStyle(3, 0x2c1011);
      bg.setInteractive({ useHandCursor: true });

      const nameTxt = this.add.text(-112, -14, move.name.toUpperCase(), {
        fontFamily: 'PokemonDP, monospace',
        fontSize:   '9px',
        color:      '#ffffff',
      });
      const ppTxt = this.add.text(112, -14, `PP ${this.state.movePP[moveId]}/${move.pp}`, {
        fontFamily: 'PokemonDP, monospace',
        fontSize:   '7px',
        color:      '#ffffff',
      }).setOrigin(1, 0);
      const catTxt = this.add.text(-112, 4, move.category.toUpperCase(), {
        fontFamily: 'PokemonDP, monospace',
        fontSize:   '6px',
        color:      'rgba(255,255,255,0.65)',
      });

      btn.add([bg, nameTxt, ppTxt, catTxt]);

      bg.on('pointerover',  () => bg.setStrokeStyle(3, 0xffe066));
      bg.on('pointerout',   () => bg.setStrokeStyle(3, 0x2c1011));
      bg.on('pointerdown',  () => {
        if (this.phase === 'player_pick') this.playerMove(moveId, i);
      });

      this.moveButtons.push(btn);
    });

    // Cursor arrow indicator (sits to left of active button)
    this.cursorIndicator = this.add.text(0, 0, '▶', {
      fontFamily: 'PokemonDP, monospace',
      fontSize:   '10px',
      color:      '#ffe066',
    }).setDepth(11).setVisible(moves.length > 0);

    // ── CATCH button (wild fish battles only) ────────────────────────────
    if (this.isWildFish) {
      this.buildCatchButton();
    }
  }

  private buildCatchButton() {
    // Place catch button in the log area (left side, below log)
    const btn = this.add.container(310, 545).setDepth(12);
    const bg = this.add.rectangle(0, 0, 180, 40, 0x2060c0);
    bg.setStrokeStyle(3, 0xffe066);
    bg.setInteractive({ useHandCursor: true });

    const txt = this.add.text(0, 0, '🎣  CATCH', {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const hintTxt = this.add.text(0, 22, 'Weaken it first!', {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '7px',
      color: '#ffe066',
    }).setOrigin(0.5);

    btn.add([bg, txt, hintTxt]);
    this.catchButton = btn;

    bg.on('pointerover', () => bg.setStrokeStyle(3, 0xffffff));
    bg.on('pointerout',  () => bg.setStrokeStyle(3, 0xffe066));
    bg.on('pointerdown', () => {
      if (this.phase === 'player_pick') this.attemptCatch();
    });
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
    const confirm   = Phaser.Input.Keyboard.JustDown(this.cursors.space!) || Phaser.Input.Keyboard.JustDown(this.confirmKey);

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
      const moveId = validMoves[this.menuCursor];
      const btnIdx = this.state.playerFish.moves.indexOf(moveId);
      if (moveId) this.playerMove(moveId, btnIdx);
    }

    // C key = attempt catch (wild fish only)
    const cKey = this.input.keyboard!.keys[Phaser.Input.Keyboard.KeyCodes.C];
    if (cKey && Phaser.Input.Keyboard.JustDown(cKey) && this.isWildFish) {
      this.attemptCatch();
    }
  }

  private updateMenuCursor() {
    if (!this.cursorIndicator || this.moveButtons.length === 0) return;
    const btn = this.moveButtons[this.menuCursor];
    if (!btn) return;

    // Highlight active button border
    this.moveButtons.forEach((b, i) => {
      const bg = b.getAt(0) as Phaser.GameObjects.Rectangle;
      bg.setStrokeStyle(3, i === this.menuCursor ? 0xffe066 : 0x2c1011);
    });

    // Position the arrow to the left of the selected button
    this.cursorIndicator.setPosition(btn.x - 136, btn.y - 6);
  }

  // ─── Fish shape (sprite if available, else drawn from primitives) ─────────
  private buildFishShape(x: number, y: number, fish: FishInstance, facingLeft: boolean): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(7);

    // Special case: crab enemy (speciesId 0) — use crab-battle idle sprites
    const sid = fish.speciesId;
    if (sid === 0 && this.textures.exists('crab-battle-idle-0')) {
      const img = this.add.image(0, -20, 'crab-battle-idle-0').setDisplaySize(120, 120);
      container.add([img]);
      this.crabIdleSprite = img;
      this.crabIdleFrame = 0;
      this.crabIdleTimer = 0;
      return container;
    }

    // Derive texture key from speciesId
    // If speciesId is a string like 'fish-1-04', use it directly
    // Otherwise derive from numeric ID
    let textureKey: string;
    if (typeof sid === 'string' && sid.startsWith('fish-')) {
      textureKey = sid;
    } else {
      const numId = Number(sid);
      if (numId < 20) {
        textureKey = `fish-1-${String(numId).padStart(2, '0')}`;
      } else {
        textureKey = `fish-2-${String(numId - 20).padStart(2, '0')}`;
      }
    }

    // Try sprite first
    if (this.textures.exists(textureKey)) {
      const size = facingLeft ? 120 : 150;
      const img = this.add.image(0, -20, textureKey).setDisplaySize(size, size);
      if (!facingLeft) img.setFlipX(true);
      container.add([img]);
      return container;
    }

    // Fallback: geometric shapes
    const species   = FISH_SPECIES.find(s => s.id === fish.speciesId);
    const bodyColor = TYPE_COLOR[species?.type ?? 'Normal'] ?? 0x606060;
    const lightColor = Phaser.Display.Color.ValueToColor(bodyColor).lighten(25).color;

    const scale = facingLeft ? 1 : 1.2; // player fish slightly larger
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
    tail.setStrokeStyle(1, 0x000000);

    const fin = this.add.triangle(
      0, -(bh * 0.5 + 18 * scale),
      -14 * scale, 0, 14 * scale, 0, 0, -16 * scale,
      lightColor
    );

    const body = this.add.ellipse(0, 0, bw, bh, bodyColor);
    body.setStrokeStyle(2, 0x000000);

    const eye   = this.add.circle(eyeX, -8 * scale,  8 * scale, 0xffffff);
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
      const caughtFish: FishInstance = {
        uid: `caught_${Date.now()}`,
        speciesId: this.fishSpriteData.textureKey,
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
    this.enemyShape.setVisible(false);
    const xp = Math.max(1, Math.floor(50 * enemy.level / 7));
    this.qLog(`${this.fishDisplayName(enemy)} fainted!`);
    this.qLog(`${this.fishDisplayName(this.state.playerFish)} gained ${xp} XP!`);
    this.drainQueue(() => this.time.delayedCall(1200, () => this.endBattle(true)));
  }

  private playerFainted() {
    this.phase = 'result';
    this.playerShape.setVisible(false);
    this.qLog(`${this.fishDisplayName(this.state.playerFish)} fainted!`);
    this.qLog('You blacked out...');
    this.drainQueue(() => this.time.delayedCall(1500, () => this.endBattle(false)));
  }

  private endBattle(_won: boolean) {
    // Persist updated HP back to registry
    const party = this.registry.get('party') as FishInstance[];
    party[0].currentHp = Math.max(0, this.state.playerFish.currentHp);
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

    const atkSp = FISH_SPECIES.find(s => s.id === attacker.speciesId);
    const defSp = FISH_SPECIES.find(s => s.id === defender.speciesId);

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

    const pW = Math.max(0, Math.floor(240 * pRatio));
    const eW = Math.max(0, Math.floor(240 * eRatio));

    this.playerHpFill.setSize(pW, 10);
    this.playerHpFill.setFillStyle(pRatio > 0.5 ? 0x44cc44 : pRatio > 0.25 ? 0xffcc00 : 0xff4444);
    this.playerHpText.setText(`${p.currentHp}/${p.maxHp}`);

    this.enemyHpFill.setSize(eW, 10);
    this.enemyHpFill.setFillStyle(eRatio > 0.5 ? 0x44cc44 : eRatio > 0.25 ? 0xffcc00 : 0xff4444);
    this.enemyHpText.setText(`${e.currentHp}/${e.maxHp}`);

    const pSt = this.state.playerStatus;
    const eSt = this.state.enemyStatus;
    this.playerStatus.setText(pSt === 'burn' ? 'BRN' : pSt === 'paralyze' ? 'PRZ' : '');
    this.enemyStatus.setText( eSt === 'burn' ? 'BRN' : eSt === 'paralyze' ? 'PRZ' : '');
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
      const bg = btn.getAt(0) as Phaser.GameObjects.Rectangle;
      bg.setAlpha(on ? 1.0 : 0.45);
    }
    this.cursorIndicator?.setVisible(on);
    if (on) this.updateMenuCursor();
  }

  private refreshPPDisplay(btnIdx: number, moveId: string) {
    const btn  = this.moveButtons[btnIdx];
    const move = MOVES[moveId];
    if (!btn || !move) return;
    const ppTxt = btn.getAt(2) as Phaser.GameObjects.Text;
    ppTxt?.setText(`PP ${this.state.movePP[moveId]}/${move.pp}`);
  }

  private flashHit(shape: Phaser.GameObjects.Container) {
    this.tweens.add({
      targets:  shape,
      alpha:    { from: 0.15, to: 1 },
      duration: 100,
      yoyo:     true,
      repeat:   3,
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private fishDisplayName(fish: FishInstance): string {
    if (fish.nickname) return fish.nickname;
    const sp = FISH_SPECIES.find(s => s.id === fish.speciesId);
    return sp?.name ?? 'Unknown Fish';
  }
}
