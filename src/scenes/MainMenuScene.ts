import { hasSave, loadGame, deleteSave } from '../systems/SaveSystem';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    const { width, height } = this.cameras.main;
    const saveExists = hasSave();

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

    // --- BUTTONS ---
    // If a save exists, show CONTINUE above NEW GAME; otherwise just NEW GAME
    const continueY = height * 0.43;
    const newGameY  = saveExists ? height * 0.52 : height * 0.46;

    // ── CONTINUE button (only when save exists) ──────────────────────────
    if (saveExists) {
      const contBg = this.add.rectangle(width / 2, continueY, 260, 56, 0x2c1011)
        .setStrokeStyle(2, 0xffe066)
        .setInteractive({ useHandCursor: true });

      const contText = this.add.text(width / 2, continueY, '▶  CONTINUE', {
        fontFamily: 'PokemonDP, monospace',
        fontSize: '18px',
        color: '#ffe066',
      }).setOrigin(0.5);

      contBg.on('pointerover', () => {
        contBg.setFillStyle(0x5a1e1a);
        contText.setColor('#ffffff');
      });
      contBg.on('pointerout', () => {
        contBg.setFillStyle(0x2c1011);
        contText.setColor('#ffe066');
      });
      contBg.on('pointerdown', () => {
        const save = loadGame();
        if (save) {
          // Store save data in registry for BeachScene to pick up
          this.registry.set('_pendingSave', save);
          // Pre-set party and inventory so initParty doesn't overwrite
          this.registry.set('party', save.party);
          this.registry.set('inventory', save.inventory);
        }
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('Beach');
        });
      });
    }

    // ── NEW GAME button ──────────────────────────────────────────────────
    const btnBg = this.add.rectangle(width / 2, newGameY, 260, 56, 0x2c1011)
      .setStrokeStyle(2, 0xffe066)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add.text(width / 2, newGameY, '▶  NEW GAME', {
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
      // Clear any existing save + registry state for a fresh start
      deleteSave();
      this.registry.remove('party');
      this.registry.remove('inventory');
      this.registry.remove('_pendingSave');

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
