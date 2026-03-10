import { UIManager } from './UIManager';
import { audio } from '../core/AudioManager';
import { deleteSave, hasSave } from '../core/SaveManager';

function formatPlaytime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
}

export function showSettings(
  ui: UIManager,
  onClose: () => void,
  playtime = 0
): void {
  const masterVol = Math.round(audio.getMasterVolume() * 100);
  const sfxVol = Math.round(audio.getSfxVolume() * 100);
  const bgmVol = Math.round(audio.getBgmVolume() * 100);
  const saveExists = hasSave();

  const panel = ui.show(
    'settings',
    `<div class="settings-overlay">
      <div class="settings-box pixel-box panel-slide-in">
        <div class="settings-title">SETTINGS</div>
        <div class="settings-row">
          <label>MASTER</label>
          <input type="range" id="vol-master" min="0" max="100" value="${masterVol}" class="settings-slider">
          <span id="vol-master-val" class="settings-val">${masterVol}%</span>
        </div>
        <div class="settings-row">
          <label>SFX</label>
          <input type="range" id="vol-sfx" min="0" max="100" value="${sfxVol}" class="settings-slider">
          <span id="vol-sfx-val" class="settings-val">${sfxVol}%</span>
        </div>
        <div class="settings-row">
          <label>MUSIC</label>
          <input type="range" id="vol-bgm" min="0" max="100" value="${bgmVol}" class="settings-slider">
          <span id="vol-bgm-val" class="settings-val">${bgmVol}%</span>
        </div>
        <div style="font-family:var(--pixel-font); font-size:8px; color:var(--text-dim); margin-top:16px; letter-spacing:0.5px;">
          PLAYTIME: <span style="color:var(--gold);">${formatPlaytime(playtime)}</span>
        </div>
        ${saveExists ? '<button class="menu-btn settings-delete" id="settings-delete-save">DELETE SAVE</button>' : ''}
        <button class="menu-btn" id="settings-close">CLOSE [ESC]</button>
      </div>
    </div>`
  );

  // Wire up volume sliders
  const masterSlider = panel.querySelector('#vol-master') as HTMLInputElement;
  const sfxSlider = panel.querySelector('#vol-sfx') as HTMLInputElement;
  const bgmSlider = panel.querySelector('#vol-bgm') as HTMLInputElement;

  masterSlider?.addEventListener('input', () => {
    const v = parseInt(masterSlider.value) / 100;
    audio.setMasterVolume(v);
    const label = panel.querySelector('#vol-master-val');
    if (label) label.textContent = `${masterSlider.value}%`;
  });

  sfxSlider?.addEventListener('input', () => {
    const v = parseInt(sfxSlider.value) / 100;
    audio.setSFXVolume(v);
    const label = panel.querySelector('#vol-sfx-val');
    if (label) label.textContent = `${sfxSlider.value}%`;
  });

  bgmSlider?.addEventListener('input', () => {
    const v = parseInt(bgmSlider.value) / 100;
    audio.setBGMVolume(v);
    const label = panel.querySelector('#vol-bgm-val');
    if (label) label.textContent = `${bgmSlider.value}%`;
  });

  panel.querySelector('#settings-close')?.addEventListener('click', () => {
    audio.playSFX('menu_select');
    onClose();
  });

  panel.querySelector('#settings-delete-save')?.addEventListener('click', () => {
    if (!confirm('Delete your save data? This cannot be undone!')) return;
    deleteSave();
    const btn = panel.querySelector('#settings-delete-save') as HTMLElement;
    if (btn) {
      btn.textContent = 'SAVE DELETED';
      btn.style.opacity = '0.4';
      btn.style.pointerEvents = 'none';
    }
  });
}

export function hideSettings(ui: UIManager): void {
  ui.remove('settings');
}
