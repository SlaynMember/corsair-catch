/**
 * PauseMenuScene — launched as overlay when ESC is pressed on any beach scene.
 * Uses UIFactory for consistent wooden panel styling.
 * Options: Resume, Save, New Game, Quit to Menu.
 */
import Phaser from 'phaser';
import {
  createWoodPanel, createOverlay, addCornerRivets, addPanelHeader,
  addPanelFooter, makeInteractive, UI, TEXT,
} from '../ui/UIFactory';
import { saveFromScene, deleteSave } from '../systems/SaveSystem';
import MobileInput from '../systems/MobileInput';

const PANEL_W = 320;
const PANEL_H = 300;
const BTN_W   = 240;
const BTN_H   = 44;
const BTN_GAP = 12;

interface PauseButton {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  action: string;
}

export default class PauseMenuScene extends Phaser.Scene {
  private overlay!: Phaser.GameObjects.Rectangle;
  private panel!: Phaser.GameObjects.Container;
  private buttons: PauseButton[] = [];
  private selectedIdx = 0;
  private escKey!: Phaser.Input.Keyboard.Key;
  private wKey!: Phaser.Input.Keyboard.Key;
  private sKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private callingScene = 'Beach';

  constructor() {
    super({ key: 'PauseMenu' });
  }

  init(data: { callingScene?: string }) {
    this.callingScene = data.callingScene ?? 'Beach';
  }

  create() {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    const cy = height / 2;

    // ── Dark overlay ────────────────────────────────────────────────────
    this.overlay = this.add.rectangle(cx, cy, width, height, UI.BLACK, 0.6)
      .setInteractive(); // absorb clicks

    // ── Wood panel ──────────────────────────────────────────────────────
    const { container } = createWoodPanel(this, cx, cy, PANEL_W, PANEL_H, { depth: 10 });
    this.panel = container;

    addPanelHeader(this, container, PANEL_W, PANEL_H, 'PAUSED', {
      fontSize: '26px',
      barColor: UI.WOOD_MED,
    });
    addCornerRivets(this, container, PANEL_W, PANEL_H);

    const hint = MobileInput.IS_MOBILE ? 'Tap to select' : 'W/S Navigate  |  SPACE Select  |  ESC Resume';
    addPanelFooter(this, container, PANEL_W, PANEL_H, hint);

    // ── Menu buttons ────────────────────────────────────────────────────
    const items = [
      { label: 'RESUME',    action: 'resume' },
      { label: 'SAVE GAME', action: 'save' },
      { label: 'NEW GAME',  action: 'new_game' },
      { label: 'QUIT TO MENU', action: 'quit' },
    ];

    const startY = -PANEL_H / 2 + 70; // below header
    this.buttons = [];

    items.forEach((item, i) => {
      const y = startY + i * (BTN_H + BTN_GAP);
      const btn = this.createMenuButton(0, y, item.label, item.action);
      container.add(btn.container);
      this.buttons.push(btn);
    });

    this.highlightButton(0);

    // ── Input ───────────────────────────────────────────────────────────
    this.escKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.wKey     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.sKey     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Entrance tween
    container.setAlpha(0).setScale(0.9);
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
    this.overlay.setAlpha(0);
    this.tweens.add({
      targets: this.overlay,
      alpha: 0.6,
      duration: 200,
    });
  }

  update() {
    // W/S or arrow keys to navigate
    if (Phaser.Input.Keyboard.JustDown(this.wKey)) {
      this.selectedIdx = (this.selectedIdx - 1 + this.buttons.length) % this.buttons.length;
      this.highlightButton(this.selectedIdx);
    }
    if (Phaser.Input.Keyboard.JustDown(this.sKey)) {
      this.selectedIdx = (this.selectedIdx + 1) % this.buttons.length;
      this.highlightButton(this.selectedIdx);
    }

    // SPACE to confirm
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.activateButton(this.buttons[this.selectedIdx].action);
    }

    // ESC to resume
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.activateButton('resume');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BUTTON FACTORY
  // ═══════════════════════════════════════════════════════════════════════
  private createMenuButton(x: number, y: number, label: string, action: string): PauseButton {
    const container = this.add.container(x, y);

    const outerFrame = this.add.rectangle(0, 0, BTN_W + 6, BTN_H + 6, UI.WOOD_DARK);
    const bg = this.add.rectangle(0, 0, BTN_W, BTN_H, 0x3d1a10);
    bg.setStrokeStyle(2, UI.WOOD_MED);

    const highlight = this.add.rectangle(0, -(BTN_H / 2 - 3), BTN_W - 8, 6, 0xffffff, 0.08);

    const txt = this.add.text(0, 0, label, TEXT.title({
      fontSize: '18px',
      color: '#f0e8d8',
      strokeThickness: 3,
    })).setOrigin(0.5);

    container.add([outerFrame, bg, highlight, txt]);

    // Pointer interaction
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      this.selectedIdx = this.buttons.findIndex(b => b.action === action);
      this.highlightButton(this.selectedIdx);
    });
    bg.on('pointerdown', () => this.activateButton(action));

    return { container, bg, label: txt, action };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HIGHLIGHT
  // ═══════════════════════════════════════════════════════════════════════
  private highlightButton(idx: number) {
    this.buttons.forEach((btn, i) => {
      if (i === idx) {
        btn.bg.setFillStyle(UI.WOOD_MED);
        btn.bg.setStrokeStyle(2, UI.GOLD);
        btn.label.setColor('#ffe066');
      } else {
        btn.bg.setFillStyle(0x3d1a10);
        btn.bg.setStrokeStyle(2, UI.WOOD_MED);
        btn.label.setColor('#f0e8d8');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════
  private activateButton(action: string) {
    switch (action) {
      case 'resume':
        this.closeAndResume();
        break;

      case 'save': {
        // Grab the calling scene and save
        const beach = this.scene.get(this.callingScene) as any;
        if (beach?.player && beach?.starterPicked !== undefined) {
          saveFromScene(beach, beach.player, beach.starterPicked, beach.playtime ?? 0);
          // Flash the save button gold briefly
          const btn = this.buttons.find(b => b.action === 'save');
          if (btn) {
            btn.label.setText('SAVED!');
            btn.label.setColor('#ffe066');
            this.time.delayedCall(1000, () => {
              btn.label.setText('SAVE GAME');
              this.highlightButton(this.selectedIdx);
            });
          }
        }
        break;
      }

      case 'new_game':
        deleteSave();
        this.registry.remove('party');
        this.registry.remove('inventory');
        this.registry.remove('_pendingSave');
        this.scene.stop(this.callingScene);
        this.scene.start('MainMenu');
        break;

      case 'quit':
        this.scene.stop(this.callingScene);
        this.scene.start('MainMenu');
        break;
    }
  }

  private closeAndResume() {
    this.tweens.add({
      targets: [this.panel, this.overlay],
      alpha: 0,
      duration: 150,
      onComplete: () => {
        this.scene.resume(this.callingScene);
        this.scene.stop('PauseMenu');
      },
    });
  }
}
