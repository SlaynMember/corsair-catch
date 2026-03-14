/**
 * BootScene — Stage 2 of two-stage boot.
 * Shows animated pirate running across a wooden loading bar
 * while all heavy game assets download.
 */
import { fetchTMX, TMXMapData } from '../systems/TMXLoader';

// Hardcoded fallback values (used if TMX fetch fails)
const BEACH1_FALLBACK: TMXMapData = {
  walkable:    [{ name: 'beach', x: 1, y: 321, width: 1372, height: 227 }],
  fishing:     [{ name: 'fishing south', x: 3, y: 532, width: 1223, height: 65 }],
  colliders:   [
    { name: 'palm-left', x: 101, y: 407, width: 38, height: 12 },
    { name: 'palm-mid-right', x: 1155, y: 402, width: 31, height: 17 },
    { name: 'rock1', x: 209, y: 509, width: 53, height: 20 },
    { name: 'rock2', x: 607, y: 522, width: 54, height: 15 },
    { name: 'rock3', x: 1009, y: 506, width: 56, height: 15 },
    { name: 'crate stack', x: 1218, y: 397, width: 89, height: 44 },
  ],
  transitions: [{ name: 'to-beach2', x: 1224, y: 319, width: 148, height: 230 }],
  dock: [],
};

const BEACH2_FALLBACK: TMXMapData = {
  walkable:    [{ name: 'sand-walkable', x: 211, y: 311, width: 689, height: 238 }],
  fishing:     [
    { name: 'fish shore', x: 169, y: 517, width: 732, height: 149 },
    { name: 'fish dock', x: 1279, y: 394, width: 96, height: 80 },
    { name: 'fish se nub', x: 857, y: 501, width: 157, height: 128 },
  ],
  colliders:   [
    { name: 'log2', x: 463, y: 345, width: 78, height: 15 },
    { name: 'log1', x: 277, y: 494, width: 76, height: 15 },
    { name: 'e cliff', x: 204, y: 243, width: 7, height: 234 },
    { name: 'n cliff', x: 2, y: 238, width: 209, height: 12 },
    { name: 's cliff', x: 169, y: 454, width: 41, height: 22 },
    { name: 'little rock', x: 93, y: 535, width: 41, height: 10 },
    { name: 'image palm cluster', x: 786, y: 308, width: 175, height: 63 },
    { name: 'top pole', x: 878, y: 485, width: 429, height: 15 },
    { name: 'dock poles and rope', x: 874, y: 371, width: 311, height: 15 },
    { name: 'dock poles and rope', x: 1186, y: 357, width: 127, height: 15 },
  ],
  transitions: [{ name: 'to-beach1', x: 0, y: 247, width: 90, height: 361 }],
  dock:        [{ name: '', x: 872, y: 393, width: 437, height: 82 }],
};

export default class BootScene extends Phaser.Scene {
  private pirate!: Phaser.GameObjects.Image;
  private barFill!: Phaser.GameObjects.Graphics;
  private loadText!: Phaser.GameObjects.Text;
  private pctText!: Phaser.GameObjects.Text;
  private frameIndex = 0;
  private frameTimer = 0;

  // Bar layout
  private readonly BAR_WIDTH = 480;
  private readonly BAR_HEIGHT = 28;
  private readonly BAR_X: number = 0; // set in create
  private readonly BAR_Y: number = 0;

  constructor() {
    super({ key: 'Boot' });
  }

  create() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    // -- Sunset gradient background (matches game palette) --
    const bg = this.add.graphics();
    const h = this.cameras.main.height;
    const w = this.cameras.main.width;
    const topColor = Phaser.Display.Color.HexStringToColor('#E07856');
    const botColor = Phaser.Display.Color.HexStringToColor('#FFD59E');
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const r = Phaser.Math.Linear(topColor.red, botColor.red, t);
      const g = Phaser.Math.Linear(topColor.green, botColor.green, t);
      const b = Phaser.Math.Linear(topColor.blue, botColor.blue, t);
      bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
      bg.fillRect(0, y, w, 1);
    }

    // -- "LOADING" title in PiratesBay --
    this.loadText = this.add.text(cx, cy - 60, 'LOADING', {
      fontFamily: 'PiratesBay, serif',
      fontSize: '42px',
      color: '#F0E8D8',
      stroke: '#2C1011',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // -- Wooden bar frame (outer) --
    const barX = cx - this.BAR_WIDTH / 2;
    const barY = cy;
    (this as any)._barX = barX;
    (this as any)._barY = barY;

    const frame = this.add.graphics();
    // Outer dark wood border
    frame.fillStyle(0x2C1011, 1);
    frame.fillRoundedRect(barX - 6, barY - 6, this.BAR_WIDTH + 12, this.BAR_HEIGHT + 12, 6);
    // Inner wood frame
    frame.fillStyle(0x8B6B4D, 1);
    frame.fillRoundedRect(barX - 3, barY - 3, this.BAR_WIDTH + 6, this.BAR_HEIGHT + 6, 4);
    // Bar background (dark interior)
    frame.fillStyle(0x402728, 1);
    frame.fillRoundedRect(barX, barY, this.BAR_WIDTH, this.BAR_HEIGHT, 3);

    // -- Gold fill bar (will be redrawn on progress) --
    this.barFill = this.add.graphics();

    // -- Percentage text --
    this.pctText = this.add.text(cx, barY + this.BAR_HEIGHT + 24, '0%', {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '20px',
      color: '#F0E8D8',
      stroke: '#2C1011',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // -- Pirate sprite (running east across the bar) --
    this.pirate = this.add.image(barX - 20, barY - 16, 'pirate-run-east-0')
      .setScale(2)
      .setOrigin(0.5, 1);

    // -- Now queue all the heavy assets --
    this.loadAllAssets();

    // -- Progress callback --
    this.load.on('progress', (value: number) => {
      this.updateBar(value);
    });

    // ── TMX map loading (parallel with Phaser assets) ──────────────────────
    let tmxDone = false;
    let assetsDone = false;
    const tryTransition = () => {
      if (!tmxDone || !assetsDone) return;
      this.updateBar(1);
      this.time.delayedCall(400, () => {
        document.getElementById('rotate-prompt')?.classList.add('active');
        this.scene.start('MainMenu');
      });
    };

    // Fetch both TMX files in parallel
    Promise.all([
      fetchTMX('/maps/beach1bounds.tmx'),
      fetchTMX('/maps/beach2bounds.tmx'),
    ]).then(([beach1, beach2]) => {
      this.registry.set('tmx-beach1', beach1 ?? BEACH1_FALLBACK);
      this.registry.set('tmx-beach2', beach2 ?? BEACH2_FALLBACK);
      tmxDone = true;
      tryTransition();
    });

    this.load.on('complete', () => {
      assetsDone = true;
      tryTransition();
    });

    // Kick off the load
    this.load.start();
  }

  update(_time: number, delta: number) {
    // Animate pirate run cycle (4 frames, ~150ms per frame)
    this.frameTimer += delta;
    if (this.frameTimer >= 150) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % 4;
      this.pirate.setTexture(`pirate-run-east-${this.frameIndex}`);
    }
  }

  private updateBar(value: number) {
    const barX = (this as any)._barX as number;
    const barY = (this as any)._barY as number;
    const fillWidth = Math.floor(this.BAR_WIDTH * value);

    this.barFill.clear();
    if (fillWidth > 0) {
      // Gold fill gradient effect
      this.barFill.fillStyle(0xFFE066, 1);
      this.barFill.fillRoundedRect(barX, barY, fillWidth, this.BAR_HEIGHT, 3);
      // Bright highlight line on top
      this.barFill.fillStyle(0xFFF4B0, 0.6);
      this.barFill.fillRect(barX + 2, barY + 2, fillWidth - 4, 4);
    }

    // Move pirate across the bar
    this.pirate.x = barX - 20 + (this.BAR_WIDTH + 40) * value;

    // Update percentage
    this.pctText.setText(`${Math.floor(value * 100)}%`);
  }

  private loadAllAssets() {
    // Idle animations (breathing-idle) — no north direction
    // Skip east run frames — already loaded by PreloadScene
    const idleDirections = ['east', 'north-east', 'north-west', 'south-east', 'south-west', 'south', 'west'];
    idleDirections.forEach(dir => {
      for (let i = 0; i < 4; i++) {
        this.load.image(
          `pirate-idle-${dir}-${i}`,
          `/sprites/pirate/breathing-idle/${dir}/frame_00${i}.png`
        );
      }
    });

    // Run animations — all 8 directions (skip east, already loaded)
    const runDirections = ['north-east', 'north-west', 'north', 'south-east', 'south-west', 'south', 'west'];
    runDirections.forEach(dir => {
      for (let i = 0; i < 4; i++) {
        this.load.image(
          `pirate-run-${dir}-${i}`,
          `/sprites/pirate/running-4-frames/${dir}/frame_00${i}.png`
        );
      }
    });

    // Pickup animations
    const pickupDirs = ['east', 'south', 'west'];
    pickupDirs.forEach(dir => {
      for (let i = 0; i < 5; i++) {
        this.load.image(
          `pirate-pickup-${dir}-${i}`,
          `/sprites/pirate/picking-up/${dir}/frame_00${i}.png`
        );
      }
    });

    // Beach enemies — 8 directional static sprites
    const enemyTypes = ['crab-basic', 'gull', 'jelly', 'hermit'];
    enemyTypes.forEach(type => {
      ['east','west','north','south','north-east','north-west','south-east','south-west'].forEach(dir => {
        this.load.image(`${type}-${dir}`, `/sprites/${type}/${dir}.png`);
      });
    });

    // Gull walk animation (scary waddle — east, south, west × 8 frames)
    ['east', 'south', 'west'].forEach(dir => {
      for (let i = 0; i < 8; i++) {
        this.load.image(`gull-walk-${dir}-${i}`, `/sprites/gull/walk/${dir}/frame_00${i}.png`);
      }
    });

    // Hermit walk (east, west × 8 frames) + angry idle (south × 7 frames)
    ['east', 'west'].forEach(dir => {
      for (let i = 0; i < 8; i++) {
        this.load.image(`hermit-walk-${dir}-${i}`, `/sprites/hermit/walk/${dir}/frame_00${i}.png`);
      }
    });
    for (let i = 0; i < 7; i++) {
      this.load.image(`hermit-angry-${i}`, `/sprites/hermit/angry/south/frame_00${i}.png`);
    }

    // Jelly pounce animation (running slide — east, west × 6 frames)
    ['east', 'west'].forEach(dir => {
      for (let i = 0; i < 6; i++) {
        this.load.image(`jelly-walk-${dir}-${i}`, `/sprites/jelly/walk/${dir}/frame_00${i}.png`);
      }
    });

    // Crab battle sprites (idle, attack, hurt, walk × 4 frames)
    ['idle', 'attack', 'hurt', 'walk'].forEach(anim => {
      for (let i = 0; i < 4; i++) {
        this.load.image(`crab-battle-${anim}-${i}`, `/sprites/crab-battle/${anim}-${i}.png`);
      }
    });

    // Beach enemy battle sprites (static single image each)
    this.load.image('gull-battle', '/sprites/gull-battle/gull-battle.png');
    this.load.image('jelly-battle', '/sprites/jelly-battle/jelly-battle.png');
    this.load.image('hermit-battle', '/sprites/hermit-battle/hermit-battle.png');

    // Evil pirate — overworld rotations (4 dir) + walk (east, west × 4 frames)
    ['south', 'east', 'west', 'north'].forEach(dir => {
      this.load.image(`evil-pirate-${dir}`, `/sprites/evil-pirate/${dir}.png`);
    });
    ['east', 'west'].forEach(dir => {
      for (let i = 0; i < 4; i++) {
        this.load.image(`evil-pirate-walk-${dir}-${i}`, `/sprites/evil-pirate/walk/${dir}/frame_00${i}.png`);
      }
    });
    // Evil pirate — battle animations
    ['east', 'west'].forEach(dir => {
      for (let i = 0; i < 8; i++) {
        this.load.image(`evil-pirate-idle-${dir}-${i}`, `/sprites/evil-pirate/battle/idle/${dir}/frame_00${i}.png`);
      }
      for (let i = 0; i < 6; i++) {
        this.load.image(`evil-pirate-attack-${dir}-${i}`, `/sprites/evil-pirate/battle/attack/${dir}/frame_00${i}.png`);
        this.load.image(`evil-pirate-hurt-${dir}-${i}`, `/sprites/evil-pirate/battle/hurt/${dir}/frame_00${i}.png`);
      }
    });
    for (let i = 0; i < 7; i++) {
      this.load.image(`evil-pirate-death-${i}`, `/sprites/evil-pirate/battle/death/south/frame_00${i}.png`);
    }
    for (let i = 0; i < 5; i++) {
      this.load.image(`evil-pirate-getup-south-${i}`, `/sprites/evil-pirate/battle/getup/south/frame_00${i}.png`);
      this.load.image(`evil-pirate-getup-east-${i}`, `/sprites/evil-pirate/battle/getup/east/frame_00${i}.png`);
    }

    // Pirate fishing animation (east-facing, 2 frames — west is flipX in code)
    this.load.image('pirate-fish-east-0', '/sprites/pirate/fishing/east/frame_000.png');
    this.load.image('pirate-fish-east-1', '/sprites/pirate/fishing/east/frame_001.png');

    // Pirate fishing-cast animation (north, east, south, west × 16 frames)
    ['north', 'east', 'south', 'west'].forEach(dir => {
      for (let i = 0; i < 16; i++) {
        const idx = String(i).padStart(3, '0');
        this.load.image(`pirate-cast-${dir}-${i}`, `/sprites/pirate/fishing-cast/${dir}/frame_${idx}.png`);
      }
    });

    // Pirate drinking animation (south × 6 frames)
    for (let i = 0; i < 6; i++) {
      this.load.image(`pirate-drink-south-${i}`, `/sprites/pirate/drinking/south/frame_${String(i).padStart(3, '0')}.png`);
    }

    // Old Fisherman NPC — 8 directional statics
    ['east','west','north','south','north-east','north-west','south-east','south-west'].forEach(dir => {
      this.load.image(`fisherman-${dir}`, `/sprites/fisherman/${dir}.png`);
    });
    // Fisherman idle (south, north × 4 frames)
    ['south', 'north'].forEach(dir => {
      for (let i = 0; i < 4; i++) {
        this.load.image(`fisherman-idle-${dir}-${i}`, `/sprites/fisherman/idle/${dir}/frame_${String(i).padStart(3, '0')}.png`);
      }
    });
    // Fisherman drunk stumble (east, west × 16 frames)
    ['east', 'west'].forEach(dir => {
      for (let i = 0; i < 16; i++) {
        this.load.image(`fisherman-stumble-${dir}-${i}`, `/sprites/fisherman/stumble/${dir}/frame_${String(i).padStart(3, '0')}.png`);
      }
    });
    // Fisherman drinking (east, west × 6 frames)
    ['east', 'west'].forEach(dir => {
      for (let i = 0; i < 6; i++) {
        this.load.image(`fisherman-drink-${dir}-${i}`, `/sprites/fisherman/drinking/${dir}/frame_${String(i).padStart(3, '0')}.png`);
      }
    });

    // "Completely Normal Crab" NPC — idle + walk + static directions
    ['east','west','north','south','north-east','north-west','south-east','south-west'].forEach(dir => {
      this.load.image(`normal-crab-${dir}`, `/sprites/normal-crab/normal-crab-${dir}.png`);
    });
    for (let i = 0; i < 4; i++) {
      this.load.image(`normal-crab-idle-south-${i}`, `/sprites/normal-crab/normal-crab-idle-south-${i}.png`);
    }
    ['south','west','north','south-west','north-east'].forEach(dir => {
      for (let i = 0; i < 4; i++) {
        this.load.image(`normal-crab-walk-${dir}-${i}`, `/sprites/normal-crab/normal-crab-walk-${dir}-${i}.png`);
      }
    });

    // Ground item icons
    this.load.image('item-wood', '/sprites/items/wood.png');
    this.load.image('item-rope', '/sprites/items/rope.png');
    this.load.image('item-bait', '/sprites/items/bait.png');
    this.load.image('item-chest', '/sprites/items/chest.png');

    // Backgrounds
    this.load.image('bg-beach',  '/backgrounds/beach-bg.png');
    this.load.image('bg-beach2', '/backgrounds/beach2-bg.png');
    this.load.image('bg-menu',   '/backgrounds/menu-bg.png');
    this.load.image('palm-tree',  '/sprites/environment/palm-tree.png');
    this.load.image('env-dock',    '/sprites/environment/dock.png');
    this.load.image('env-south-dock', '/sprites/environment/south-dock.png');
    this.load.image('item-bottle', '/sprites/items/message-bottle.png');
    this.load.image('env-sail-sign', '/sprites/environment/sail-sign.png');
    this.load.image('env-shell-1', '/sprites/environment/shell-1.png');
    this.load.image('env-shell-2', '/sprites/environment/shell-2.png');
    this.load.image('env-shell-3', '/sprites/environment/shell-3.png');
    this.load.image('env-crate',   '/sprites/environment/crate.png');
    this.load.image('env-crate-stack', '/sprites/environment/crate-stack.png');
    this.load.image('env-anchor',  '/sprites/environment/anchor.png');
    this.load.image('env-rocks',     '/sprites/environment/rocks.png');
    this.load.image('env-starfish',  '/sprites/environment/starfish.png');
    this.load.image('env-seaweed',   '/sprites/environment/seaweed.png');
    this.load.image('env-driftwood', '/sprites/environment/driftwood.png');
    this.load.image('env-battle-deck', '/sprites/environment/battle-deck.png');

    // Fish sprites (sheets 1 + 2, 20 each; sheet 3, 8 fish)
    // fish-2-08 is missing (empty cell in source sheet) — skip it
    for (let s = 1; s <= 2; s++) {
      for (let i = 0; i < 20; i++) {
        if (s === 2 && i === 8) continue;
        const idx = String(i).padStart(2, '0');
        this.load.image(`fish-${s}-${idx}`, `/sprites/fish/fish-${s}-${idx}.png`);
      }
    }
    for (let i = 0; i < 8; i++) {
      const idx = String(i).padStart(2, '0');
      this.load.image(`fish-3-${idx}`, `/sprites/fish/fish-3-${idx}.png`);
    }

    // Ship sprites (20 ships)
    for (let i = 0; i < 20; i++) {
      const idx = String(i).padStart(2, '0');
      this.load.image(`ship-${idx}`, `/sprites/ships/ship-${idx}.png`);
    }

    // Portraits (talk scene)
    this.load.image('portrait-pirate', '/sprites/portraits/pirate-talk.png');
    this.load.image('portrait-crab-man', '/sprites/portraits/crab-man-talk.png');

    // Wave animation spritesheet (41 frames, 1376×768 each, 8 cols × 6 rows)
    this.load.spritesheet('wave-sheet', '/backgrounds/wave-sheet.jpg', {
      frameWidth: 1376,
      frameHeight: 768,
    });

    // Music
    this.load.audio('bgm-main', '/music_and_fx/beach-wave-corsair.mp3');
    this.load.audio('bgm-battle', '/music_and_fx/beach-wave-battle.mp3');

    // SFX
    this.load.audio('sfx-pickup', '/music_and_fx/sfx-pickup.wav');
    this.load.audio('sfx-cast', '/music_and_fx/sfx-cast.wav');
    this.load.audio('sfx-typewriter', '/music_and_fx/sfx-typewriter.wav');
    this.load.audio('sfx-battle-intro', '/music_and_fx/sfx-battle-intro.wav');
    this.load.audio('sfx-battle-hit', '/music_and_fx/sfx-battle-hit.wav');
    this.load.audio('sfx-faint', '/music_and_fx/sfx-faint.wav');
    this.load.audio('sfx-skill', '/music_and_fx/sfx-skill.wav');
    this.load.audio('sfx-levelup', '/music_and_fx/sfx-levelup.wav');
    this.load.audio('sfx-ui-click', '/music_and_fx/sfx-ui-click.wav');
  }
}
