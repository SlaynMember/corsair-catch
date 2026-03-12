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

    // Ground item icons
    this.load.image('item-wood', '/sprites/items/wood.png');
    this.load.image('item-rope', '/sprites/items/rope.png');
    this.load.image('item-bait', '/sprites/items/bait.png');

    // Backgrounds
    this.load.image('bg-beach',  '/backgrounds/beach-bg.png');
    this.load.image('bg-menu',   '/backgrounds/menu-bg.png');
    this.load.image('palm-tree', '/sprites/environment/palm-tree.png');

    // Fish sprites (sheets 1 + 2, 20 each)
    for (let s = 1; s <= 2; s++) {
      for (let i = 0; i < 20; i++) {
        const idx = String(i).padStart(2, '0');
        this.load.image(`fish-${s}-${idx}`, `/sprites/fish/fish-${s}-${idx}.png`);
      }
    }
  }

  create() {
    this.scene.start('MainMenu');
  }
}
