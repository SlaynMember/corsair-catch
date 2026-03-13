/**
 * PreloadScene — Stage 1 of two-stage boot.
 * Loads ONLY the pirate run-east frames (~4 tiny PNGs) so BootScene
 * can show an animated loading bar while the heavy assets download.
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Preload' });
  }

  preload() {
    // Only load what we need for the loading screen animation
    for (let i = 0; i < 4; i++) {
      this.load.image(
        `pirate-run-east-${i}`,
        `/sprites/pirate/running-4-frames/east/frame_00${i}.png`
      );
    }
  }

  create() {
    // Wait for fonts (PiratesBay for loading text) then hand off to Boot
    document.fonts.ready.then(() => {
      this.scene.start('Boot');
    });
  }
}
