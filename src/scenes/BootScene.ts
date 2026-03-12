export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload() {
    // Load all assets here before the game starts
    // Idle animations (breathing-idle) — no north direction
    const idleDirections = ['east', 'north-east', 'north-west', 'south-east', 'south-west', 'south', 'west'];
    idleDirections.forEach(dir => {
      for (let i = 0; i < 4; i++) {
        this.load.image(
          `pirate-idle-${dir}-${i}`,
          `/sprites/pirate/breathing-idle/${dir}/frame_00${i}.png`
        );
      }
    });

    // Run animations (running-4-frames) — all 8 directions (includes north)
    const runDirections = ['east', 'north-east', 'north-west', 'north', 'south-east', 'south-west', 'south', 'west'];
    runDirections.forEach(dir => {
      for (let i = 0; i < 4; i++) {
        this.load.image(
          `pirate-run-${dir}-${i}`,
          `/sprites/pirate/running-4-frames/${dir}/frame_00${i}.png`
        );
      }
    });

    // Load pickup frames (picking-up) — limited directions
    const pickupDirs = ['east', 'south', 'west'];
    pickupDirs.forEach(dir => {
      for (let i = 0; i < 5; i++) {
        this.load.image(
          `pirate-pickup-${dir}-${i}`,
          `/sprites/pirate/picking-up/${dir}/frame_00${i}.png`
        );
      }
    });

    // Crab enemy — 8 directional static sprites
    ['east','west','north','south','north-east','north-west','south-east','south-west'].forEach(dir => {
      this.load.image(`crab-basic-${dir}`, `/sprites/crab-basic/${dir}.png`);
    });

    // Crab battle sprites (idle, attack, hurt, walk × 4 frames)
    ['idle', 'attack', 'hurt', 'walk'].forEach(anim => {
      for (let i = 0; i < 4; i++) {
        this.load.image(`crab-battle-${anim}-${i}`, `/sprites/crab-battle/${anim}-${i}.png`);
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
    this.load.image('bg-menu',   '/backgrounds/menu-bg.png');
    this.load.image('palm-tree',  '/sprites/environment/palm-tree.png');
    this.load.image('env-dock',    '/sprites/environment/dock.png');
    this.load.image('env-sail-sign', '/sprites/environment/sail-sign.png');
    this.load.image('env-shell-1', '/sprites/environment/shell-1.png');
    this.load.image('env-shell-2', '/sprites/environment/shell-2.png');
    this.load.image('env-shell-3', '/sprites/environment/shell-3.png');
    this.load.image('env-crate',   '/sprites/environment/crate.png');
    this.load.image('env-anchor',  '/sprites/environment/anchor.png');

    // Fish sprites (sheets 1 + 2, 20 each; sheet 3, 8 fish)
    for (let s = 1; s <= 2; s++) {
      for (let i = 0; i < 20; i++) {
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

    // Music
    this.load.audio('bgm-main', '/music_and_fx/catch-pixel.mp3');
  }

  create() {
    // Wait for custom fonts to finish loading before showing title screen
    document.fonts.ready.then(() => {
      this.scene.start('MainMenu');
    });
  }
}
