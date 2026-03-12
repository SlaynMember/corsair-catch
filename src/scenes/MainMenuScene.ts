import { hasSave, loadGame, deleteSave } from '../systems/SaveSystem';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    const { width, height } = this.cameras.main;
    const saveExists = hasSave();

    // Animated wave background — play forward then reverse for seamless loop
    const fwd = this.anims.generateFrameNumbers('wave-sheet', { start: 0, end: 14 });
    const rev = this.anims.generateFrameNumbers('wave-sheet', { start: 13, end: 1 });
    this.anims.create({
      key: 'wave-loop',
      frames: [...fwd, ...rev],
      frameRate: 8,
      repeat: -1,
    });
    const waveBg = this.add.sprite(width / 2, height / 2, 'wave-sheet', 0)
      .setDisplaySize(width, height)
      .setDepth(-1);
    waveBg.play('wave-loop');

    // ── BGM ───────────────────────────────────────────────────────────────
    // Play if not already playing (persists across scenes)
    if (!this.sound.get('bgm-main')) {
      this.sound.play('bgm-main', { loop: true, volume: 0.45 });
    }

    // ── ANIMATED TITLE — letter-by-letter wave entrance ──────────────────
    const titleStr = 'CORSAIR CATCH';
    const titleY = height * 0.20;
    const letterStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'PixelPirate, monospace',
      fontSize: '56px',
      color: '#ffe066',
      stroke: '#1a0800',
      strokeThickness: 5,
    };

    // Measure total width so we can center the letters
    const measure = this.add.text(0, -200, titleStr, letterStyle);
    const totalWidth = measure.width;
    measure.destroy();

    // Create individual letter objects
    const letters: Phaser.GameObjects.Text[] = [];
    let xCursor = width / 2 - totalWidth / 2;

    for (let i = 0; i < titleStr.length; i++) {
      const ch = titleStr[i];
      // Measure each character width
      const charMeasure = this.add.text(0, -200, ch, letterStyle);
      const charW = charMeasure.width;
      charMeasure.destroy();

      const letter = this.add.text(xCursor + charW / 2, titleY - 80, ch, letterStyle)
        .setOrigin(0.5)
        .setAlpha(0)
        .setScale(0.3);

      letters.push(letter);
      xCursor += charW;

      // Drop-in animation: staggered, with overshoot bounce
      this.tweens.add({
        targets: letter,
        y: titleY,
        alpha: 1,
        scale: 1,
        duration: 500,
        delay: 80 * i,
        ease: 'Back.easeOut',
      });
    }

    // After all letters land, start a gentle floating wave loop
    const totalEntrance = 80 * titleStr.length + 500;
    this.time.delayedCall(totalEntrance, () => {
      letters.forEach((letter, i) => {
        this.tweens.add({
          targets: letter,
          y: titleY - 4,
          duration: 800,
          delay: 60 * i,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      });
    });

    // ── SUBTITLE — fades in after title lands ────────────────────────────
    const subtitle = this.add.text(width / 2, height * 0.32, 'Sail. Catch. Conquer.', {
      fontFamily: 'PokemonDP, sans-serif',
      fontSize: '20px',
      color: '#ffdcd1',
      fontStyle: 'italic',
      stroke: '#1a0800',
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 600,
      delay: totalEntrance + 200,
      ease: 'Power2',
    });

    // ── BUTTONS — fade in after subtitle ─────────────────────────────────
    const buttonDelay = totalEntrance + 600;
    const continueY = height * 0.43;
    const newGameY  = saveExists ? height * 0.52 : height * 0.46;

    // ── Build menu buttons ────────────────────────────────────────────────
    let transitioning = false;
    const menuButtons: { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text; action: string }[] = [];

    const activateBtn = (action: string) => {
      if (transitioning) return;
      transitioning = true;
      if (action === 'continue') {
        const save = loadGame();
        if (save) {
          this.registry.set('_pendingSave', save);
          this.registry.set('party', save.party);
          this.registry.set('inventory', save.inventory);
        }
      } else {
        deleteSave();
        this.registry.remove('party');
        this.registry.remove('inventory');
        this.registry.remove('_pendingSave');
      }
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Beach');
      });
    };

    const makeButton = (y: number, label: string, action: string) => {
      const bg = this.add.rectangle(width / 2, y, 260, 56, 0x2c1011)
        .setStrokeStyle(2, 0xffe066)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0);
      const txt = this.add.text(width / 2, y, label, {
        fontFamily: 'PokemonDP, monospace',
        fontSize: '18px',
        color: '#ffe066',
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: [bg, txt], alpha: 1, duration: 400, delay: buttonDelay });
      bg.on('pointerover', () => { bg.setFillStyle(0x5a1e1a); txt.setColor('#ffffff'); });
      bg.on('pointerout',  () => { bg.setFillStyle(0x2c1011); txt.setColor('#ffe066'); });
      bg.on('pointerdown', () => activateBtn(action));
      menuButtons.push({ bg, text: txt, action });
    };

    if (saveExists) makeButton(continueY, '\u25b6  CONTINUE', 'continue');
    makeButton(newGameY, '\u25b6  NEW GAME', 'new');

    // ── Keyboard navigation (WASD/Arrows + SPACE/ENTER) ─────────────────
    let selectedIdx = 0;

    const highlightBtn = (idx: number) => {
      menuButtons.forEach((b, i) => {
        if (i === idx) { b.bg.setFillStyle(0x5a1e1a); b.text.setColor('#ffffff'); }
        else           { b.bg.setFillStyle(0x2c1011); b.text.setColor('#ffe066'); }
      });
    };

    this.time.delayedCall(buttonDelay + 400, () => highlightBtn(selectedIdx));

    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (transitioning) return;
      const k = e.code;
      if ((k === 'KeyW' || k === 'ArrowUp') && menuButtons.length > 1) {
        selectedIdx = (selectedIdx - 1 + menuButtons.length) % menuButtons.length;
        highlightBtn(selectedIdx);
      } else if ((k === 'KeyS' || k === 'ArrowDown') && menuButtons.length > 1) {
        selectedIdx = (selectedIdx + 1) % menuButtons.length;
        highlightBtn(selectedIdx);
      } else if (k === 'Space' || k === 'Enter') {
        activateBtn(menuButtons[selectedIdx].action);
      }
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
