export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background image (sky + ocean + palms + ship + dock baked in)
    this.add.image(width / 2, height / 2, 'bg-menu').setDisplaySize(width, height).setDepth(-1);

    // --- TITLE ---
    // Shadow
    this.add.text(width / 2 + 4, height * 0.20 + 4, 'CORSAIR CATCH', {
      fontFamily: 'PixelPirate, monospace',
      fontSize: '56px',
      color: '#1a0800',
    }).setOrigin(0.5).setAlpha(0.75);

    // Main title
    this.add.text(width / 2, height * 0.20, 'CORSAIR CATCH', {
      fontFamily: 'PixelPirate, monospace',
      fontSize: '56px',
      color: '#ffe066',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height * 0.32, 'Sail. Catch. Conquer.', {
      fontFamily: 'PokemonDP, sans-serif',
      fontSize: '20px',
      color: '#ffdcd1',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // --- NEW GAME BUTTON ---
    const btnBg = this.add.rectangle(width / 2, height * 0.46, 260, 56, 0x2c1011)
      .setStrokeStyle(2, 0xffe066)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add.text(width / 2, height * 0.46, '▶  NEW GAME', {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '18px',
      color: '#ffe066',
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x5a1e1a);
      btnText.setColor('#ffffff');
    });
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x2c1011);
      btnText.setColor('#ffe066');
    });
    btnBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Beach');
      });
    });

    // Version tag
    this.add.text(width - 12, height - 12, 'v0.1 alpha', {
      fontFamily: 'PokemonDP, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
    }).setOrigin(1, 1).setAlpha(0.4);

    // Fade in
    this.cameras.main.fadeIn(600, 0, 0, 0);
  }
}
