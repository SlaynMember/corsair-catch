export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    // Placeholder main menu
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1410);

    // Title
    this.add.text(width / 2, height / 3, 'CORSAIR CATCH', {
      font: 'bold 48px Arial',
      color: '#fd574b',
      align: 'center',
    }).setOrigin(0.5);

    // Buttons
    const newGameButton = this.add
      .text(width / 2, height / 2, 'NEW GAME', {
        font: 'bold 32px Arial',
        color: '#ffffff',
        backgroundColor: '#2c1011',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('Beach');
      });

    newGameButton.setStyle({ color: '#ffab91' });
  }
}
