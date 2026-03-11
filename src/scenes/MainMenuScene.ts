export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Sky gradient — warm coral sunset (layered rectangles to fake gradient)
    this.add.rectangle(width / 2, height * 0.15, width, height * 0.3, 0xe07856);
    this.add.rectangle(width / 2, height * 0.35, width, height * 0.2, 0xf4a76d);
    this.add.rectangle(width / 2, height * 0.52, width, height * 0.14, 0xffd59e);

    // Ocean
    this.add.rectangle(width / 2, height * 0.72, width, height * 0.26, 0x2dafb8);
    // Darker deep water strip
    this.add.rectangle(width / 2, height * 0.88, width, height * 0.1, 0x1b8a96);

    // Wave bands
    for (let i = 0; i < 4; i++) {
      const y = height * 0.63 + i * 22;
      this.add.rectangle(width / 2, y, width, 6, 0x3dc4ce, 0.35);
    }

    // Beach sand strip
    this.add.rectangle(width / 2, height * 0.61, width, height * 0.05, 0xf0d8a0);

    // Sun
    this.add.circle(width * 0.72, height * 0.18, 48, 0xffdb6e);
    this.add.circle(width * 0.72, height * 0.18, 44, 0xffe890);

    // Sun glow
    const sunGlow = this.add.circle(width * 0.72, height * 0.18, 72, 0xffdb6e, 0.18);
    sunGlow.setDepth(-1);

    // Palm silhouette left — trunk
    const trunk1 = this.add.rectangle(width * 0.08, height * 0.68, 10, 140, 0x3d2010);
    trunk1.setAngle(-8);
    // Palm fronds
    this.add.ellipse(width * 0.04, height * 0.47, 90, 28, 0x1a4020, 0.9).setAngle(-30);
    this.add.ellipse(width * 0.10, height * 0.44, 100, 24, 0x1a4020, 0.9).setAngle(10);
    this.add.ellipse(width * 0.14, height * 0.48, 80, 22, 0x1a4020, 0.9).setAngle(40);

    // Palm silhouette right — trunk
    const trunk2 = this.add.rectangle(width * 0.93, height * 0.66, 10, 120, 0x3d2010);
    trunk2.setAngle(10);
    this.add.ellipse(width * 0.88, height * 0.47, 85, 24, 0x1a4020, 0.9).setAngle(-20);
    this.add.ellipse(width * 0.95, height * 0.45, 90, 22, 0x1a4020, 0.9).setAngle(15);

    // Dock planks extending to water
    for (let i = 0; i < 6; i++) {
      this.add.rectangle(width * 0.5 + i * 36 - 90, height * 0.63, 32, 12, 0x8b5e3c);
    }
    // Dock posts
    this.add.rectangle(width * 0.38, height * 0.68, 8, 28, 0x5a3a1a);
    this.add.rectangle(width * 0.50, height * 0.68, 8, 28, 0x5a3a1a);
    this.add.rectangle(width * 0.62, height * 0.68, 8, 28, 0x5a3a1a);

    // Island silhouette on horizon
    this.add.ellipse(width * 0.2, height * 0.62, 180, 40, 0x2a5c2a, 0.7);
    this.add.ellipse(width * 0.82, height * 0.63, 140, 32, 0x2a5c2a, 0.6);

    // --- TITLE ---
    // Shadow
    this.add.text(width / 2 + 4, height * 0.22 + 4, 'CORSAIR CATCH', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '42px',
      color: '#3d1a00',
    }).setOrigin(0.5).setAlpha(0.6);

    // Main title
    this.add.text(width / 2, height * 0.22, 'CORSAIR CATCH', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '42px',
      color: '#ffe066',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height * 0.33, '"Pokémon meets the Seven Seas"', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '20px',
      color: '#ffdcd1',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // --- NEW GAME BUTTON ---
    const btnBg = this.add.rectangle(width / 2, height * 0.48, 260, 56, 0x2c1011)
      .setStrokeStyle(2, 0xffe066)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add.text(width / 2, height * 0.48, '▶  NEW GAME', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
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
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
    }).setOrigin(1, 1).setAlpha(0.4);

    // Fade in
    this.cameras.main.fadeIn(600, 0, 0, 0);
  }
}
