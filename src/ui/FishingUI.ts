import { UIManager } from './UIManager';
import type { FishingState } from '../systems/FishingSystem';
import { fishSvg } from './ui-utils';

const HOOK_SVG = `<svg width="18" height="22" viewBox="0 0 18 22" style="display:block;margin:0 auto;">
  <path d="M9,2 C9,2 15,4 15,9 C15,15 9,17 9,17 L9,20"
    fill="none" stroke="#D2A678" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="6" y1="20" x2="12" y2="20" stroke="#D2A678" stroke-width="2" stroke-linecap="round"/>
  <circle cx="9" cy="2" r="1.5" fill="#D2A678"/>
</svg>`;

export function showFishingUI(ui: UIManager, state: FishingState): void {
  let contentHtml = '';

  if (state.phase === 'cast') {
    const pct = Math.round(state.castPower * 100);
    const powerLabel = pct > 85 ? 'PERFECT!' : pct > 60 ? 'GREAT' : pct > 30 ? 'GOOD' : 'WEAK';
    contentHtml = `
      <div class="fishing-dialog-box">
        <div class="fishing-dialog-icon">${HOOK_SVG}</div>
        <div class="fishing-message">${state.message}</div>
        <div class="fishing-cast-label">POWER ${pct}% — ${powerLabel}</div>
        <div class="power-bar">
          <div class="power-bar-fill" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  } else if (state.phase === 'reel') {
    const tensionPct = Math.round(state.tension * 100);
    const fishPct = Math.round(Math.max(0, state.fishHp / state.fishMaxHp) * 100);
    const tensionLabel =
      state.tension > 0.85 ? 'SNAP!!' :
      state.tension > 0.65 ? 'HIGH!' :
      state.tension > 0.4 ? 'RISING' : 'OK';
    contentHtml = `
      <div class="fishing-meter-vertical">
        <div class="fishing-meter-fish-icon">${fishSvg('var(--gold)', { width: 26, height: 16, type: 'water' })}</div>
        <div class="fishing-meter-track">
          <div class="fishing-meter-fill" style="height: ${tensionPct}%"></div>
        </div>
        <div class="fishing-meter-tension-label">${tensionLabel}</div>
      </div>
      <div class="fishing-dialog-box">
        <div class="fishing-message">${state.message}</div>
        <div class="fishing-stamina-label">STAMINA</div>
        <div class="fish-hp-bar">
          <div class="fish-hp-fill" style="width: ${fishPct}%"></div>
        </div>
      </div>
    `;
  } else if (state.phase === 'bite') {
    contentHtml = `
      <div class="fishing-dialog-box fishing-dialog-bite">
        <div class="fishing-message">${state.message}</div>
        <div class="bite-indicator">
          <span class="bite-exclaim">!</span>
        </div>
      </div>
    `;
  } else {
    contentHtml = `
      <div class="fishing-dialog-box">
        <div class="fishing-message">${state.message}</div>
      </div>
    `;
  }

  ui.show('fishing', `<div class="fishing-overlay">${contentHtml}</div>`);
}


export function showCatchPopup(ui: UIManager, name: string, level: number, type?: string, color?: string, partyFull = false, rarity?: string): void {
  const typeColor = color ?? 'var(--gold)';
  const typeLabel = type ? `<div style="font-family:var(--pixel-font); font-size:8px; color:${typeColor}; text-transform:uppercase; letter-spacing:2px; margin-bottom:4px;">${type}</div>` : '';
  const svg = color ? fishSvg(color, { margin: '8px auto', type }) : '';
  const actionText = partyFull
    ? 'CREW FULL! PRESS SPACE TO RELEASE'
    : 'PRESS SPACE TO ADD TO CREW';
  const rarityColors: Record<string, string> = { common: 'var(--text-dim)', uncommon: 'var(--hp-green)', rare: 'var(--gold)' };
  const rarityLabel = rarity
    ? `<div style="font-family:var(--pixel-font); font-size:7px; color:${rarityColors[rarity] ?? 'var(--text-dim)'}; letter-spacing:2px; margin-bottom:4px;">${rarity.toUpperCase()}</div>`
    : '';

  ui.show(
    'catch-popup',
    `<div class="catch-popup">
      <h2>CAUGHT!</h2>
      ${svg}
      ${rarityLabel}
      <p style="color:${typeColor}; font-size:12px;">${name}</p>
      ${typeLabel}
      <p style="font-family:var(--pixel-font); font-size:10px; color:var(--gold);">Lv.${level}</p>
      <p style="font-family:var(--pixel-font); font-size:8px; color:${partyFull ? 'var(--hp-red)' : 'var(--text-dim)'}; margin-top:14px;">${actionText}</p>
    </div>`
  );
}

export function hideFishingUI(ui: UIManager): void {
  ui.hide('fishing');
  ui.remove('catch-popup');
}
