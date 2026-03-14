import { hasSave, loadGame, deleteSave } from '../systems/SaveSystem';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    const { width, height } = this.cameras.main;
    const saveExists = hasSave();

    // ── Dreamy palette ──────────────────────────────────────────────────
    // Warm ivory/cream title over teal ocean — ethereal watercolor sunrise
    const PAL = {
      title:       '#FFF8F0',   // warm ivory
      titleShadow: '#D4A574',   // golden sand glow
      subtitle:    '#E8D5C4',   // soft driftwood
      btnBg:       0x1B6E78,    // deep teal (matches ocean)
      btnBgHex:    '#1B6E78',
      btnBgHover:  0x2A8F9A,    // lighter teal hover
      btnText:     '#FFF8F0',   // warm ivory
      btnTextHover:'#FFE4C9',   // peachy highlight
      btnStroke:   0xD4A574,    // golden sand border
      versionText: '#C8B8A8',   // muted warm gray
      vignetteAlpha: 0.55,
    };

    // ── Animated wave background ────────────────────────────────────────
    this.anims.create({
      key: 'wave-loop',
      frames: this.anims.generateFrameNumbers('wave-sheet', { start: 0, end: 40 }),
      frameRate: 8,
      repeat: -1,
    });
    const waveBg = this.add.sprite(width / 2, height / 2, 'wave-sheet', 0)
      .setDisplaySize(width, height)
      .setDepth(-1);
    waveBg.play('wave-loop');

    // ── White/light vignette around edges ────────────────────────────────
    const vig = this.add.graphics().setDepth(0);
    // Four edge gradients — white fading inward
    const vEdge = 120; // vignette depth in px
    // Top
    for (let i = 0; i < vEdge; i++) {
      const a = PAL.vignetteAlpha * (1 - i / vEdge);
      vig.fillStyle(0xffffff, a);
      vig.fillRect(0, i, width, 1);
    }
    // Bottom
    for (let i = 0; i < vEdge; i++) {
      const a = PAL.vignetteAlpha * (1 - i / vEdge);
      vig.fillStyle(0xffffff, a);
      vig.fillRect(0, height - i, width, 1);
    }
    // Left
    for (let i = 0; i < vEdge; i++) {
      const a = PAL.vignetteAlpha * 0.7 * (1 - i / vEdge);
      vig.fillStyle(0xffffff, a);
      vig.fillRect(i, 0, 1, height);
    }
    // Right
    for (let i = 0; i < vEdge; i++) {
      const a = PAL.vignetteAlpha * 0.7 * (1 - i / vEdge);
      vig.fillStyle(0xffffff, a);
      vig.fillRect(width - i, 0, 1, height);
    }

    // ── BGM — unlock audio context on first user interaction ────────────
    // Mobile browsers block audio until a user gesture (tap/click).
    // We attempt playback now (works on desktop), then re-trigger on first input.
    const tryPlayBGM = () => {
      if (this.sound.get('bgm-main')) return; // already playing
      if ((this.sound as any).context?.state === 'suspended') {
        (this.sound as any).context.resume();
      }
      this.sound.play('bgm-main', { loop: true, volume: 0.45 });
    };
    tryPlayBGM();
    // Belt-and-suspenders: also unlock on first touch/click/key
    this.input.once('pointerdown', tryPlayBGM);
    this.input.keyboard?.once('keydown', tryPlayBGM);

    // ── TITLE — dreamy letter-by-letter entrance ────────────────────────
    const titleStr = 'Corsair Catch';
    const titleY = height * 0.22;
    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'PiratesBay, serif',
      fontSize: '72px',
      color: PAL.title,
      stroke: PAL.titleShadow,
      strokeThickness: 2,
    };

    // Measure total width for centering
    const measure = this.add.text(0, -200, titleStr, titleStyle);
    const totalWidth = measure.width;
    measure.destroy();

    // Create individual letter objects
    const letters: Phaser.GameObjects.Text[] = [];
    let xCursor = width / 2 - totalWidth / 2;

    for (let i = 0; i < titleStr.length; i++) {
      const ch = titleStr[i];
      const charMeasure = this.add.text(0, -200, ch, titleStyle);
      const charW = charMeasure.width;
      charMeasure.destroy();

      const letter = this.add.text(xCursor + charW / 2, titleY - 60, ch, titleStyle)
        .setOrigin(0.5)
        .setAlpha(0)
        .setScale(0.5)
        .setDepth(2);

      letters.push(letter);
      xCursor += charW;

      // Gentle fade-rise entrance — slower, dreamier than before
      this.tweens.add({
        targets: letter,
        y: titleY,
        alpha: 1,
        scale: 1,
        duration: 700,
        delay: 100 * i,
        ease: 'Sine.easeOut',
      });
    }

    // After all letters land, gentle floating wave
    const totalEntrance = 100 * titleStr.length + 700;
    this.time.delayedCall(totalEntrance, () => {
      letters.forEach((letter, i) => {
        this.tweens.add({
          targets: letter,
          y: titleY - 3,
          duration: 1200,
          delay: 80 * i,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      });
    });

    // ── Warm glow behind title (soft bloom) ─────────────────────────────
    const glow = this.add.graphics().setDepth(1);
    glow.fillStyle(0xD4A574, 0.12);
    glow.fillEllipse(width / 2, titleY, totalWidth + 120, 100);
    glow.fillStyle(0xFFF8F0, 0.06);
    glow.fillEllipse(width / 2, titleY, totalWidth + 200, 140);
    // Gentle pulse on the glow
    this.tweens.add({
      targets: glow,
      alpha: 0.6,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── SUBTITLE ────────────────────────────────────────────────────────
    const subtitle = this.add.text(width / 2, height * 0.34, 'Sail. Catch. Conquer.', {
      fontFamily: 'PokemonDP, sans-serif',
      fontSize: '18px',
      color: PAL.subtitle,
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0).setDepth(2);

    this.tweens.add({
      targets: subtitle,
      alpha: 0.85,
      duration: 800,
      delay: totalEntrance + 300,
      ease: 'Sine.easeOut',
    });

    // ── BUTTONS — soft teal pill shapes with golden border ──────────────
    const buttonDelay = totalEntrance + 800;
    const continueY = height * 0.48;
    const newGameY  = saveExists ? height * 0.58 : height * 0.52;

    let transitioning = false;
    const menuButtons: { bg: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; hitArea: Phaser.GameObjects.Rectangle; action: string }[] = [];

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
        this.registry.set('starterPicked', false);
      }
      // Dreamy white fade-out instead of black
      this.cameras.main.fadeOut(600, 255, 255, 255);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Beach');
      });
    };

    const makeButton = (y: number, label: string, action: string) => {
      const btnW = 240;
      const btnH = 48;
      const radius = 24;

      // Rounded pill background
      const bg = this.add.graphics().setDepth(2).setAlpha(0);
      const drawBtn = (fill: number, fillAlpha: number, strokeColor: number) => {
        bg.clear();
        bg.fillStyle(fill, fillAlpha);
        bg.fillRoundedRect(width / 2 - btnW / 2, y - btnH / 2, btnW, btnH, radius);
        bg.lineStyle(1.5, strokeColor, 0.6);
        bg.strokeRoundedRect(width / 2 - btnW / 2, y - btnH / 2, btnW, btnH, radius);
      };
      drawBtn(PAL.btnBg, 0.65, PAL.btnStroke);

      const txt = this.add.text(width / 2, y, label, {
        fontFamily: 'PiratesBay, serif',
        fontSize: '24px',
        color: PAL.btnText,
      }).setOrigin(0.5).setAlpha(0).setDepth(3);

      // Invisible hit area for interaction
      const hitArea = this.add.rectangle(width / 2, y, btnW, btnH)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.001); // near-invisible but interactive

      this.tweens.add({ targets: [bg, txt], alpha: 1, duration: 600, delay: buttonDelay, ease: 'Sine.easeOut' });

      hitArea.on('pointerover', () => {
        drawBtn(PAL.btnBgHover, 0.75, PAL.btnStroke);
        txt.setColor(PAL.btnTextHover);
      });
      hitArea.on('pointerout', () => {
        drawBtn(PAL.btnBg, 0.65, PAL.btnStroke);
        txt.setColor(PAL.btnText);
      });
      hitArea.on('pointerdown', () => activateBtn(action));
      menuButtons.push({ bg, text: txt, hitArea, action });
    };

    if (saveExists) makeButton(continueY, 'Continue', 'continue');
    makeButton(newGameY, 'New Game', 'new');

    // ── Keyboard navigation ─────────────────────────────────────────────
    let selectedIdx = 0;

    const highlightBtn = (idx: number) => {
      menuButtons.forEach((b, i) => {
        const btnW = 240, btnH = 48, radius = 24;
        if (i === idx) {
          b.bg.clear();
          b.bg.fillStyle(PAL.btnBgHover, 0.75);
          b.bg.fillRoundedRect(width / 2 - btnW / 2, (b.text.y) - btnH / 2, btnW, btnH, radius);
          b.bg.lineStyle(1.5, PAL.btnStroke, 0.8);
          b.bg.strokeRoundedRect(width / 2 - btnW / 2, (b.text.y) - btnH / 2, btnW, btnH, radius);
          b.text.setColor(PAL.btnTextHover);
        } else {
          b.bg.clear();
          b.bg.fillStyle(PAL.btnBg, 0.65);
          b.bg.fillRoundedRect(width / 2 - btnW / 2, (b.text.y) - btnH / 2, btnW, btnH, radius);
          b.bg.lineStyle(1.5, PAL.btnStroke, 0.6);
          b.bg.strokeRoundedRect(width / 2 - btnW / 2, (b.text.y) - btnH / 2, btnW, btnH, radius);
          b.text.setColor(PAL.btnText);
        }
      });
    };

    this.time.delayedCall(buttonDelay + 600, () => highlightBtn(selectedIdx));

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

    // ── Version tag ─────────────────────────────────────────────────────
    this.add.text(width - 16, height - 16, 'v0.1 alpha', {
      fontFamily: 'PokemonDP, sans-serif',
      fontSize: '12px',
      color: PAL.versionText,
    }).setOrigin(1, 1).setAlpha(0.35).setDepth(2);

    // ── Fade in (white, dreamy) ─────────────────────────────────────────
    this.cameras.main.fadeIn(800, 255, 255, 255);
  }
}
