import { FishInstance } from '../data/fish-db';
import { FISH_SPRITE_DB, FishSpriteData } from '../data/fish-sprite-db';
import { FISHING_ZONES, rollFishFromZone } from '../data/fishing-zones';
import { BEACH_ENEMIES, rollBeach3Enemy } from '../data/beach-enemies';
import MobileInput from '../systems/MobileInput';
import { TMXMapData, TMXRect, computeBoundingRect, isInZone, findTransition } from '../systems/TMXLoader';

// ── Visual constants ──────────────────────────────────────────────────────────
const W = 1280;
const H = 720;
const WATER_TOP = 620;

// ── Pirate duel constants ─────────────────────────────────────────────────────
const DUEL_X = 700;      // center of the two pirates
const DUEL_Y = 440;      // sand area
const DUEL_SPACING = 60; // pixels between them
const DUEL_APPROACH = 70; // approach distance to trigger

export default class Beach3Scene extends Phaser.Scene {
  // ── TMX map data ───────────────────────────────────────────────────────────
  private tmx!: TMXMapData;
  private walkBounds!: { x: number; y: number; width: number; height: number };
  private colliderGroup!: Phaser.Physics.Arcade.StaticGroup;

  // ── Player ─────────────────────────────────────────────────────────────────
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

  // ── Dialogue ───────────────────────────────────────────────────────────────
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

  // ── Fishing ────────────────────────────────────────────────────────────────
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

  // ── Inventory ──────────────────────────────────────────────────────────────
  private invContainer!: Phaser.GameObjects.Container;
  private invOpen = false;
  private readonly INV_STATIC = 13;

  // ── Enemies ────────────────────────────────────────────────────────────────
  private enemies: {
    container: Phaser.GameObjects.Container;
    sprite?: Phaser.GameObjects.Sprite;
    x: number; y: number;
    minX: number; maxX: number;
    dir: 1 | -1; speed: number;
    defeated: boolean;
    animFrame: number; animTimer: number;
    enemyId: string; enemyName: string;
    spriteKey: string; level: number; hp: number;
    moves: string[]; aggroRadius: number;
  }[] = [];
  private battlePending = false;

  // ── Pirate duel (special NPC event) ────────────────────────────────────────
  private duelContainer!: Phaser.GameObjects.Container;
  private duelPirateA!: Phaser.GameObjects.Sprite; // left pirate (east-facing)
  private duelPirateB!: Phaser.GameObjects.Sprite; // right pirate (west-facing, flipX)
  private duelState: 'fighting' | 'dialogue' | 'battle' | 'done' = 'fighting';
  private duelAnimTimer = 0;
  private duelAnimFrame = 0;
  /** Which pirate is currently attacking (alternates) */
  private duelAttacker: 'A' | 'B' = 'A';
  private duelPhase: 'attack' | 'hurt' = 'attack';
  private duelPhaseClock = 0;

  // ── Mobile ─────────────────────────────────────────────────────────────────
  private mobileInput?: MobileInput;

  // ── Transition ─────────────────────────────────────────────────────────────
  private sceneTransitioning = false;
  private transitionCooldown = true;

  // ── Waves ──────────────────────────────────────────────────────────────────
  private waveRects: { rect: Phaser.GameObjects.Rectangle; speed: number }[] = [];

  constructor() {
    super({ key: 'Beach3' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════════════════════
  create(data?: { from?: string }) {
    this.sceneTransitioning = false;
    this.battlePending = false;
    this.enemies = [];
    this.duelState = 'fighting';

    // ── TMX map data ──────────────────────────────────────────────────────
    this.tmx = this.registry.get('tmx-beach3') as TMXMapData;
    this.walkBounds = computeBoundingRect(this.tmx.walkable);

    // ── Background ────────────────────────────────────────────────────────
    this.add.image(W / 2, H / 2, 'bg-beach3').setDisplaySize(W, H).setDepth(0);

    // ── Waves ─────────────────────────────────────────────────────────────
    this.createWaves();

    // ── Colliders (from TMX) ──────────────────────────────────────────────
    this.colliderGroup = this.physics.add.staticGroup();
    for (const c of this.tmx.colliders) {
      const cx = c.x + c.width / 2;
      const cy = c.y + c.height / 2;
      const box = this.add.rectangle(cx, cy, c.width, c.height, 0x000000, 0) as unknown as Phaser.Physics.Arcade.Image;
      this.physics.add.existing(box, true);
      this.colliderGroup.add(box);
    }

    // ── Transition hints ──────────────────────────────────────────────────
    const wb = this.walkBounds;
    this.add.text(wb.x + 20, wb.y + wb.height / 2, '\u2190 BEACH', {
      fontFamily: 'PokemonDP, monospace', fontSize: '14px',
      color: '#f0e8d8', stroke: '#2c1011', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4);

    // ── Player ────────────────────────────────────────────────────────────
    // Use the to-beach1 transition zone to find where the player should enter
    const b1zone = findTransition('to-beach1', this.tmx.transitions);
    let spawnX: number, spawnY: number;
    if (b1zone) {
      // Spawn inside the transition zone (near its center) so player is at the exit
      spawnX = b1zone.x + b1zone.width / 2;
      spawnY = b1zone.y + b1zone.height / 2;
    } else {
      // Fallback — center of main sand area
      spawnX = 616;
      spawnY = 400;
    }
    this.player = this.physics.add.sprite(spawnX, spawnY, 'pirate-idle-south-0');
    this.player.setDisplaySize(64, 64).setDepth(5).setCollideWorldBounds(true);
    // Clamp player to the walkable bounding rect (not full scene — prevents cliff stuck)
    this.physics.world.setBounds(this.walkBounds.x, this.walkBounds.y, this.walkBounds.width, this.walkBounds.height);
    this.physics.add.collider(this.player, this.colliderGroup);

    // ── Shadow ────────────────────────────────────────────────────────────
    this.shadow = this.add.ellipse(this.player.x, this.player.y + 16, 28, 7, 0x000000, 0.20).setDepth(4);

    // ── Dialogue box ──────────────────────────────────────────────────────
    this.createDialogueBox();

    // ── Fishing overlay ───────────────────────────────────────────────────
    this.createFishingOverlay();

    // ── Inventory panel ───────────────────────────────────────────────────
    this.createInventoryPanel();

    // ── Pirate duel NPC ───────────────────────────────────────────────────
    this.createPirateDuel();

    // ── Roaming enemies ───────────────────────────────────────────────────
    this.spawnEnemies();

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
    this.escKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // ── Camera ────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // ── Mobile ────────────────────────────────────────────────────────────
    if (MobileInput.IS_MOBILE) {
      this.mobileInput = new MobileInput(this);
      this.mobileInput.showContextButtons('overworld');
      this.input.on('pointerdown', () => {
        if (this.dlgOpen) this.dlgTapped = true;
        if (this.isFishing) this.fishTapped = true;
      });
    }

    // ── Resume from battle ────────────────────────────────────────────────
    this.events.on('resume', () => this.onResume());
    this.events.on('shutdown', () => this.mobileInput?.destroy());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WAVES
  // ═══════════════════════════════════════════════════════════════════════════
  private createWaves() {
    const waterH = H - WATER_TOP;
    const wetSand = this.add.rectangle(W / 2, WATER_TOP - 3, W, 8, 0xc4a882, 0.30).setDepth(0.8);
    this.tweens.add({
      targets: wetSand, alpha: { from: 0.30, to: 0.12 }, scaleY: { from: 1, to: 0.6 },
      duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

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
        duration: 2200 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: b.delay,
      });
    });

    const foam = this.add.graphics().setDepth(2);
    let foamTime = 0;
    this.time.addEvent({
      delay: 80, loop: true,
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
  // PIRATE DUEL (two pirates fighting — special NPC event)
  // ═══════════════════════════════════════════════════════════════════════════
  private createPirateDuel() {
    this.duelContainer = this.add.container(DUEL_X, DUEL_Y).setDepth(4 + DUEL_Y * 0.001);

    // Left pirate (A) — facing east (toward B)
    const texA = this.textures.exists('evil-pirate-idle-east-0') ? 'evil-pirate-idle-east-0' : 'evil-pirate-east';
    this.duelPirateA = this.add.sprite(-DUEL_SPACING / 2, 0, texA).setScale(2.0);
    // Right pirate (B) — facing west (toward A, use east + flipX)
    const texB = this.textures.exists('evil-pirate-idle-east-0') ? 'evil-pirate-idle-east-0' : 'evil-pirate-east';
    this.duelPirateB = this.add.sprite(DUEL_SPACING / 2, 0, texB).setScale(2.0).setFlipX(true);

    // "VS" spark between them
    const vs = this.add.text(0, -30, '\u2694', {
      fontFamily: 'PixelPirate, monospace', fontSize: '20px',
      color: '#ffe066', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);
    this.tweens.add({
      targets: vs, alpha: { from: 1, to: 0.3 },
      duration: 400, yoyo: true, repeat: -1,
    });

    // Name labels
    const nameStyle = {
      fontFamily: 'PokemonDP, monospace', fontSize: '11px',
      color: '#ffffff', stroke: '#000000', strokeThickness: 2,
    };
    const nameA = this.add.text(-DUEL_SPACING / 2, -28, 'Scurvybeard', nameStyle).setOrigin(0.5);
    const nameB = this.add.text(DUEL_SPACING / 2, -28, 'Bonecrusher', nameStyle).setOrigin(0.5);

    this.duelContainer.add([this.duelPirateA, this.duelPirateB, vs, nameA, nameB]);
  }

  private tickPirateDuel(delta: number) {
    if (this.duelState !== 'fighting' || !this.duelPirateA || !this.duelPirateB) return;

    this.duelPhaseClock += delta;
    this.duelAnimTimer += delta;

    // Alternate attack/hurt every ~600ms
    if (this.duelPhaseClock >= 600) {
      this.duelPhaseClock = 0;
      if (this.duelPhase === 'attack') {
        this.duelPhase = 'hurt';
      } else {
        this.duelPhase = 'attack';
        this.duelAttacker = this.duelAttacker === 'A' ? 'B' : 'A';
      }
      this.duelAnimFrame = 0;
      this.duelAnimTimer = 0;
    }

    // Animate frames
    if (this.duelAnimTimer >= 100) {
      this.duelAnimTimer = 0;
      this.duelAnimFrame = (this.duelAnimFrame + 1) % 6;
    }

    // Set textures — attacker does attack anim, defender does hurt anim
    const attackFrame = Math.min(this.duelAnimFrame, 5);
    const hurtFrame = Math.min(this.duelAnimFrame, 5);

    if (this.duelAttacker === 'A') {
      const atkTex = `evil-pirate-attack-east-${attackFrame}`;
      const hrtTex = `evil-pirate-hurt-east-${hurtFrame}`;
      if (this.textures.exists(atkTex)) this.duelPirateA.setTexture(atkTex);
      if (this.textures.exists(hrtTex)) this.duelPirateB.setTexture(hrtTex);
    } else {
      const atkTex = `evil-pirate-attack-east-${attackFrame}`;
      const hrtTex = `evil-pirate-hurt-east-${hurtFrame}`;
      if (this.textures.exists(atkTex)) this.duelPirateB.setTexture(atkTex);
      if (this.textures.exists(hrtTex)) this.duelPirateA.setTexture(hrtTex);
    }
    this.duelPirateA.setFlipX(false);
    this.duelPirateB.setFlipX(true);
  }

  private checkDuelApproach(spaceJustDown: boolean) {
    if (this.duelState !== 'fighting') return;
    const dist = Math.hypot(this.player.x - DUEL_X, this.player.y - DUEL_Y);
    if (dist < DUEL_APPROACH && spaceJustDown) {
      this.startDuelDialogue();
    }
  }

  private startDuelDialogue() {
    this.duelState = 'dialogue';
    this.player.setVelocity(0, 0);

    // Stop fighting — both go to idle
    const idleTex = 'evil-pirate-idle-east-0';
    if (this.textures.exists(idleTex)) {
      this.duelPirateA.setTexture(idleTex).setFlipX(false);
      this.duelPirateB.setTexture(idleTex).setFlipX(true);
    }

    // Funny dialogue sequence
    this.dlgQueue = [
      'Scurvybeard: "OI! We\'re havin\' a PRIVATE duel here!"',
      'Bonecrusher: "Yeah! He stole me lucky parrot!"',
      'Scurvybeard: "I did NOT steal it! It flew to me!"',
      'Bonecrusher: "Parrots don\'t just FLY to people, mate!"',
      'Scurvybeard: "This one did! It hated yer breath!"',
    ];
    this.dlgOpen = true;
    this.dlgContainer.setVisible(true);
    this.advanceDlg();

    // After dialogue ends, play death sequence
    this.events.once('duelDialogueDone', () => {
      this.playDuelDeath();
    });
  }

  private playDuelDeath() {
    // Bonecrusher punches Scurvybeard one last time
    let deathFrame = 0;
    const deathTimer = this.time.addEvent({
      delay: 120, repeat: 6,
      callback: () => {
        const tex = `evil-pirate-death-${deathFrame}`;
        if (this.textures.exists(tex)) this.duelPirateA.setTexture(tex).setFlipX(false);
        deathFrame++;
      },
    });
    // Bonecrusher goes to idle, looking smug
    const idleTex = 'evil-pirate-idle-east-0';
    if (this.textures.exists(idleTex)) {
      this.duelPirateB.setTexture(idleTex).setFlipX(true);
    }

    this.time.delayedCall(1000, () => {
      // Second dialogue — winner taunts
      this.dlgQueue = [
        'Bonecrusher: *dusts off hands*',
        'Bonecrusher: "Where was I? Oh right..."',
        'Bonecrusher: "YOUR TURN, landlubber!"',
      ];
      this.dlgOpen = true;
      this.dlgContainer.setVisible(true);
      this.advanceDlg();
      this.events.once('duelBattleStart', () => {
        this.triggerDuelBattle();
      });
    });
  }

  private triggerDuelBattle() {
    this.duelState = 'battle';
    this.duelContainer.setVisible(false);
    this.battlePending = true;

    const def = BEACH_ENEMIES[4]; // Blackhand Pete
    const enemyFish: FishInstance = {
      uid: `duel_pirate_${Date.now()}`,
      speciesId: 0,
      nickname: 'Bonecrusher',
      level: 8,
      xp: 0,
      currentHp: 55,
      maxHp: 55,
      moves: ['cutlass_slash', 'plunder'],
      iv: { hp: 8, attack: 8, defense: 6, speed: 7 },
    };

    this.sound.play('sfx-battle-intro', { volume: 0.4 });
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.launch('Battle', {
        enemyName: 'Bonecrusher',
        enemyParty: [enemyFish],
        returnScene: 'Beach3',
        enemySpriteKey: 'evil-pirate',
      });
      this.scene.pause();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENEMIES (roaming)
  // ═══════════════════════════════════════════════════════════════════════════
  private spawnEnemies() {
    // Place enemies in the main sandy area (TMX rect ~434-798, 258-497)
    // Left enemy patrols the left-center sand, right enemy patrols mid-right sand
    const spawns = [
      { x: 500, y: 400, minX: 450, maxX: 620, enemy: rollBeach3Enemy() },
      { x: 700, y: 360, minX: 630, maxX: 780, enemy: rollBeach3Enemy() },
    ];

    spawns.forEach(pos => {
      const def = pos.enemy;
      const container = this.add.container(pos.x, pos.y).setDepth(4);
      let sprite: Phaser.GameObjects.Sprite | undefined;

      const texKey = `${def.spriteKey}-east`;
      if (this.textures.exists(texKey)) {
        sprite = this.add.sprite(0, 0, texKey).setScale(def.spriteScale);
        container.add([sprite]);
      } else {
        const body = this.add.ellipse(0, 0, 28, 20, def.fallbackColor).setStrokeStyle(1, 0x000000);
        const eye1 = this.add.circle(-6, -6, 3, 0x111111);
        const eye2 = this.add.circle( 6, -6, 3, 0x111111);
        container.add([body, eye1, eye2]);
      }

      const labelY = sprite ? -(sprite.height * def.spriteScale * 0.5 + 8) : -22;
      const label = this.add.text(0, labelY, def.name, {
        fontFamily: 'PokemonDP, monospace', fontSize: '12px',
        color: '#ffffff', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);
      container.add([label]);

      const speed = def.spriteKey === 'jelly' ? 55 + Math.random() * 20
                  : def.spriteKey === 'hermit' ? 40 + Math.random() * 15
                  : 20 + Math.random() * 18;
      this.enemies.push({
        container, sprite,
        x: pos.x, y: pos.y,
        minX: pos.minX, maxX: pos.maxX,
        dir: 1, speed, defeated: false,
        animFrame: 0, animTimer: 0,
        enemyId: def.id, enemyName: def.name,
        spriteKey: def.spriteKey,
        level: def.level, hp: def.hp,
        moves: [...def.moves], aggroRadius: def.aggroRadius,
      });
    });
  }

  private updateEnemies(delta: number) {
    for (const e of this.enemies) {
      if (e.defeated) continue;

      e.x += e.dir * e.speed * (delta / 1000);
      if (e.x >= e.maxX) { e.x = e.maxX; e.dir = -1; }
      if (e.x <= e.minX) { e.x = e.minX; e.dir =  1; }
      e.container.setPosition(e.x, e.y);

      if (e.sprite) {
        const dirKey = e.dir > 0 ? 'east' : 'west';
        e.animTimer += delta;

        if (e.spriteKey === 'jelly') {
          if (e.animTimer >= 80) { e.animTimer = 0; e.animFrame = (e.animFrame + 1) % 6; }
          const tex = `jelly-walk-${dirKey}-${e.animFrame}`;
          if (this.textures.exists(tex)) e.sprite.setTexture(tex);
        } else if (e.spriteKey === 'hermit') {
          if (e.animTimer >= 100) { e.animTimer = 0; e.animFrame = (e.animFrame + 1) % 8; }
          const tex = `hermit-walk-${dirKey}-${e.animFrame}`;
          if (this.textures.exists(tex)) e.sprite.setTexture(tex);
        } else if (e.spriteKey === 'evil-pirate') {
          if (e.animTimer >= 150) { e.animTimer = 0; e.animFrame = (e.animFrame + 1) % 4; }
          const tex = `evil-pirate-walk-${dirKey}-${e.animFrame}`;
          if (this.textures.exists(tex)) e.sprite.setTexture(tex);
        } else {
          const tex = `${e.spriteKey}-${dirKey}`;
          if (this.textures.exists(tex)) e.sprite.setTexture(tex);
        }
        e.sprite.setFlipX(false);
        e.container.setScale(1, 1);
      } else {
        e.container.setScale(e.dir < 0 ? -1 : 1, 1);
      }
    }
  }

  private checkEnemyCollisions() {
    if (this.battlePending || !this.player || !this.enemies) return;
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

  private triggerBattle(enemy: typeof this.enemies[0]) {
    this.battlePending = true;
    enemy.defeated = true;
    enemy.container.setVisible(false);

    const enemyFish: FishInstance = {
      uid: `${enemy.enemyId}_${Date.now()}`,
      speciesId: 0,
      nickname: enemy.enemyName,
      level: enemy.level,
      xp: 0,
      currentHp: enemy.hp,
      maxHp: enemy.hp,
      moves: enemy.moves,
      iv: { hp: 5, attack: 5, defense: 5, speed: 5 },
    };

    this.sound.play('sfx-battle-intro', { volume: 0.4 });
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.launch('Battle', {
        enemyName: enemy.enemyName,
        enemyParty: [enemyFish],
        returnScene: 'Beach3',
        enemySpriteKey: enemy.spriteKey,
      });
      this.scene.pause();
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
    this.dlgOpen = true;
    this.dlgContainer.setVisible(true);
    this.advanceDlg();
  }

  private advanceDlg() {
    if (this.dlgQueue.length === 0) {
      this.dlgOpen = false;
      this.dlgContainer.setVisible(false);
      // Fire events for duel sequence
      if (this.duelState === 'dialogue') {
        this.events.emit('duelDialogueDone');
      } else if (this.duelState === 'battle') {
        this.events.emit('duelBattleStart');
      }
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
  // FISHING (same pattern as Beach2Scene — deep_water zone)
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

    this.fishingPhase = 'castAnim';
    this.castAnimFrame = 0;
    this.castAnimTimer = 0;
    this.fishingTimer = 0;

    const castDir = this.getCastDirection();
    this.player.setTexture(`pirate-cast-${castDir}-0`);
    this.player.setDisplaySize(64, 64);
    this.sound.play('sfx-cast', { volume: 0.5 });
  }

  private getCastDirection(): string {
    const dir = this.currentDir;
    if (dir.includes('east')) return 'east';
    if (dir.includes('west')) return 'west';
    if (dir === 'north') return 'north';
    return 'south';
  }

  private tickFishing(delta: number, spaceJustDown: boolean) {
    this.fishingTimer += delta;

    if (this.fishingPhase === 'castAnim') {
      this.castAnimTimer += delta;
      if (this.castAnimTimer >= 80) { this.castAnimTimer = 0; this.castAnimFrame++; }
      if (this.castAnimFrame < 16) {
        const castDir = this.getCastDirection();
        const key = `pirate-cast-${castDir}-${this.castAnimFrame}`;
        if (this.textures.exists(key)) this.player.setTexture(key);
      } else {
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
        returnScene: 'Beach3',
        isWildFish: true,
        fishSpriteData: fishData,
      });
      this.scene.pause();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INVENTORY PANEL
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
      this.scene.start('Beach', { from: 'left' });
    });
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

    // Check duel approach first
    this.checkDuelApproach(true);
    if (this.duelState !== 'fighting') return;

    // Fishing — use +32 (bottom of 64px sprite) for generous zone overlap
    const px = this.player.x;
    const feetY = this.player.y + 32;
    if (isInZone(px, feetY, this.tmx.fishing)) {
      this.startFishing();
      return;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPTH SORT
  // ═══════════════════════════════════════════════════════════════════════════
  private depthSort() {
    if (!this.player) return;
    const d = 4 + this.player.y * 0.001;
    this.player.setDepth(d);
    this.shadow?.setDepth(d - 0.1);
    // Duel container depth
    if (this.duelContainer) {
      this.duelContainer.setDepth(4 + DUEL_Y * 0.001);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════════════════════
  update(_time: number, delta: number) {
    if (!this.player) return;

    const spaceDown = this.spaceKey.isDown;
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

    // Fishing
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
      // If closing duel dialogue via ESC, fire the appropriate event
      if (this.duelState === 'dialogue') this.events.emit('duelDialogueDone');
      else if (this.duelState === 'battle') this.events.emit('duelBattleStart');
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
      this.scene.pause('Beach3');
      this.scene.launch('PauseMenu', { callingScene: 'Beach3' });
      return;
    }

    // Pirate duel animation
    this.tickPirateDuel(delta);

    this.handleMovement(delta);
    this.checkSpaceActions(spaceJustDown);
    this.updateEnemies(delta);
    this.checkEnemyCollisions();
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

  // ── Resume from Battle ─────────────────────────────────────────────────
  private onResume() {
    this.battlePending = false;
    this.cameras.main.fadeIn(400, 0, 0, 0);
    if (this.duelState === 'battle') {
      this.duelState = 'done';
    }
  }
}
