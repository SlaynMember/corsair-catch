/**
 * HUDManager — Shared HUD buttons (Inventory, Team, Volume) for all beach scenes.
 *
 * Create one per scene in create(). Buttons render at depth 20, top-right corner.
 * Pass onInventory/onTeam callbacks so each scene can toggle its own panels.
 *
 * Volume mute state persists via Phaser registry key 'muted'.
 */

import MobileInput from './MobileInput';
import { createHudButton, UI, TEXT } from '../ui/UIFactory';

export interface HUDCallbacks {
  onInventory: () => void;
  onTeam: () => void;
}

export default class HUDManager {
  private scene: Phaser.Scene;
  private volBtn?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, callbacks: HUDCallbacks) {
    this.scene = scene;
    this.build(callbacks);
  }

  private build(callbacks: HUDCallbacks) {
    const scene = this.scene;
    const W = scene.scale.width;
    const hudDepth = 20;
    const isMobile = MobileInput.IS_MOBILE;
    const btnSize = isMobile ? 64 : 44;
    const pad = 14;
    const topY = 22;
    const rightX = W - pad;
    const iconScale = isMobile ? 1.4 : 1.0;

    // ── Inventory bag button ──────────────────────────────────────────
    const { container: bagBtn } = createHudButton(
      scene, rightX - btnSize / 2, topY + btnSize / 2, btnSize,
      { depth: hudDepth, onClick: callbacks.onInventory },
    );
    const bagBody   = scene.add.rectangle(0, 3,   20 * iconScale, 16 * iconScale, 0x8b5e3c);
    const bagFlap   = scene.add.rectangle(0, -4,  22 * iconScale,  8 * iconScale, 0x6b4226);
    const bagStrap  = scene.add.rectangle(0, -10, 12 * iconScale,  4 * iconScale, 0x6b4226);
    const bagBuckle = scene.add.rectangle(0, -2,   6 * iconScale,  4 * iconScale, UI.GOLD);
    const bagHint   = scene.add.text(0, btnSize / 2 + 8, 'I', TEXT.hint({ fontSize: '11px' })).setOrigin(0.5);
    bagBtn.add([bagBody, bagFlap, bagStrap, bagBuckle, bagHint]);

    // ── Team bubble button ────────────────────────────────────────────
    const teamX = rightX - btnSize / 2 - (btnSize + pad);
    const { container: teamBtn } = createHudButton(
      scene, teamX, topY + btnSize / 2, btnSize,
      { depth: hudDepth, onClick: callbacks.onTeam },
    );
    const bubbleR    = isMobile ? 20 : 14;
    const bubble     = scene.add.circle(0, -1, bubbleR, UI.OCEAN, 0.3);
    const bubbleRing = scene.add.circle(0, -1, bubbleR);
    bubbleRing.setStrokeStyle(2, UI.OCEAN);
    const fishBody = scene.add.ellipse(0, -1, 14 * iconScale, 8 * iconScale, UI.OCEAN);
    const fishTail = scene.add.triangle(-9 * iconScale, -1, 0, -5, 0, 5, -6, 0, UI.OCEAN);
    const fishEye  = scene.add.circle(4 * iconScale, -2, 2, UI.PARCHMENT);
    const teamHint = scene.add.text(0, btnSize / 2 + 8, 'T', TEXT.hint({ fontSize: '11px' })).setOrigin(0.5);
    teamBtn.add([bubble, bubbleRing, fishBody, fishTail, fishEye, teamHint]);

    // ── Volume/Mute button ─────────────────────────────────────────────
    const volX = rightX - btnSize / 2 - 2 * (btnSize + pad);
    const { container: volBtn } = createHudButton(
      scene, volX, topY + btnSize / 2, btnSize,
      { depth: hudDepth, onClick: () => this.toggleMute() },
    );
    const s = iconScale * 0.8;
    const spkBody = scene.add.rectangle(-4 * s, 0, 6 * s, 8 * s, UI.PARCHMENT);
    const spkCone = scene.add.triangle(2 * s, 0, 0, -5, 0, 5, 6, 0, UI.PARCHMENT);
    const wave1 = scene.add.arc(7 * s, 0, 4 * s, -40, 40, false).setStrokeStyle(1.5, UI.GOLD);
    const wave2 = scene.add.arc(7 * s, 0, 7 * s, -40, 40, false).setStrokeStyle(1.5, UI.GOLD);
    const volHint = scene.add.text(0, btnSize / 2 + 8, 'VOL', TEXT.hint({ fontSize: '9px' })).setOrigin(0.5);
    volBtn.add([spkBody, spkCone, wave1, wave2, volHint]);
    volBtn.setData('wave1', wave1);
    volBtn.setData('wave2', wave2);
    volBtn.setData('volHint', volHint);

    // Restore mute state from registry
    if (scene.registry.get('muted')) {
      scene.sound.mute = true;
      wave1.setVisible(false);
      wave2.setVisible(false);
      volHint.setText('MUTE');
    }

    this.volBtn = volBtn;
  }

  private toggleMute() {
    const scene = this.scene;
    scene.sound.mute = !scene.sound.mute;
    scene.registry.set('muted', scene.sound.mute);
    if (!this.volBtn) return;
    const wave1 = this.volBtn.getData('wave1') as Phaser.GameObjects.Arc;
    const wave2 = this.volBtn.getData('wave2') as Phaser.GameObjects.Arc;
    const hint = this.volBtn.getData('volHint') as Phaser.GameObjects.Text;
    wave1?.setVisible(!scene.sound.mute);
    wave2?.setVisible(!scene.sound.mute);
    hint?.setText(scene.sound.mute ? 'MUTE' : 'VOL');
  }
}
