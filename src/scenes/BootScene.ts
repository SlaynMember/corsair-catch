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

    // Load background
    this.load.image('island-bg', '/sprites/island-bg.png');
    this.load.image('menu-beach-anim', '/sprites/menu-beach-anim.png');
  }

  create() {
    this.scene.start('MainMenu');
  }
}
