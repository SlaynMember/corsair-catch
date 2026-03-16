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

  /** Play a UI click sound if available */
  private clickSfx() {
    if (this.scene.cache.audio.exists('sfx-ui-click')) {
      this.scene.sound.play('sfx-ui-click', { volume: 0.25 });
    }
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
      { depth: hudDepth, onClick: () => { this.clickSfx(); callbacks.onInventory(); } },
    );
    // Simple bag icon — cleaner, less cluttered
    const bagIcon = scene.add.graphics();
    const bs = iconScale;
    bagIcon.fillStyle(0x8b5e3c);
    bagIcon.fillRoundedRect(-10 * bs, -4 * bs, 20 * bs, 16 * bs, 3);
    bagIcon.fillStyle(0x6b4226);
    bagIcon.fillRoundedRect(-11 * bs, -8 * bs, 22 * bs, 8 * bs, 2);
    bagIcon.fillStyle(UI.GOLD);
    bagIcon.fillRect(-3 * bs, -4 * bs, 6 * bs, 4 * bs);
    const bagHint = scene.add.text(0, btnSize / 2 + 8, 'BAG', TEXT.hint({ fontSize: '10px' })).setOrigin(0.5);
    bagBtn.add([bagIcon, bagHint]);

    // ── Team bubble button ────────────────────────────────────────────
    const teamX = rightX - btnSize / 2 - (btnSize + pad);
    const { container: teamBtn } = createHudButton(
      scene, teamX, topY + btnSize / 2, btnSize,
      { depth: hudDepth, onClick: () => { this.clickSfx(); callbacks.onTeam(); } },
    );
    // Fish silhouette icon — cleaner
    const teamIcon = scene.add.graphics();
    const ts = iconScale;
    teamIcon.fillStyle(UI.OCEAN);
    teamIcon.fillEllipse(0, 0, 18 * ts, 10 * ts);
    teamIcon.fillTriangle(-11 * ts, 0, -16 * ts, -5 * ts, -16 * ts, 5 * ts);
    teamIcon.fillStyle(UI.PARCHMENT);
    teamIcon.fillCircle(4 * ts, -2, 2 * ts);
    const teamHint = scene.add.text(0, btnSize / 2 + 8, 'CREW', TEXT.hint({ fontSize: '10px' })).setOrigin(0.5);
    teamBtn.add([teamIcon, teamHint]);

    // ── Volume/Mute button ─────────────────────────────────────────────
    const volX = rightX - btnSize / 2 - 2 * (btnSize + pad);
    const { container: volBtn } = createHudButton(
      scene, volX, topY + btnSize / 2, btnSize,
      { depth: hudDepth, onClick: () => { this.clickSfx(); this.toggleMute(); } },
    );
    const s = iconScale * 0.8;
    const spkBody = scene.add.rectangle(-3 * s, 0, 8 * s, 10 * s, UI.PARCHMENT);
    const spkCone = scene.add.triangle(4 * s, 0, 0, -6 * s, 0, 6 * s, 7 * s, 0, UI.PARCHMENT);
    // Sound wave arcs — drawn as open arcs facing right from the speaker cone
    const wave1 = scene.add.graphics();
    wave1.lineStyle(2, UI.GOLD);
    wave1.beginPath();
    wave1.arc(6 * s, 0, 5 * s, -0.7, 0.7, false);
    wave1.strokePath();
    const wave2 = scene.add.graphics();
    wave2.lineStyle(2, UI.GOLD);
    wave2.beginPath();
    wave2.arc(6 * s, 0, 9 * s, -0.7, 0.7, false);
    wave2.strokePath();
    const volHint = scene.add.text(0, btnSize / 2 + 8, 'VOL', TEXT.hint({ fontSize: '10px' })).setOrigin(0.5);
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
    const wave1 = this.volBtn.getData('wave1') as Phaser.GameObjects.Graphics;
    const wave2 = this.volBtn.getData('wave2') as Phaser.GameObjects.Graphics;
    const hint = this.volBtn.getData('volHint') as Phaser.GameObjects.Text;
    wave1?.setVisible(!scene.sound.mute);
    wave2?.setVisible(!scene.sound.mute);
    hint?.setText(scene.sound.mute ? 'MUTE' : 'VOL');
  }
}
