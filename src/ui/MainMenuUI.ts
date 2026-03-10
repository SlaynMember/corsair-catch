import { UIManager } from './UIManager';

export function showMainMenu(
  ui: UIManager,
  onNewGame: () => void,
  hasSave: boolean,
  onContinue?: () => void
): void {
  const continueBtn = hasSave
    ? `<button class="menu-btn" id="menu-continue">CONTINUE</button>`
    : '';

  const panel = ui.show(
    'main-menu',
    `<div class="main-menu" style="background-image:url('/sprite_unedited/opening scene.png');background-size:cover;background-position:center;">
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.35);"></div>
      <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;">
        <div class="main-menu-title">CORSAIR<br>CATCH</div>
        <div class="main-menu-subtitle">POKEMON MEETS THE SEVEN SEAS</div>
        <button class="menu-btn" id="menu-new-game">NEW GAME</button>
        ${continueBtn}
        <button class="menu-btn" id="menu-controls" style="font-size:8px;padding:8px 16px;margin-top:4px;opacity:0.7;">CONTROLS</button>
        <div id="controls-panel" style="display:none;font-family:var(--pixel-font);font-size:7px;color:var(--text-dim);line-height:2.2;margin-top:12px;text-align:left;max-width:280px;">
          <div style="color:var(--gold);font-size:8px;margin-bottom:6px;text-align:center;letter-spacing:1px;">HOW TO PLAY</div>
          <div><span style="color:var(--text);">WASD / ARROWS</span> — Sail your ship</div>
          <div><span style="color:var(--text);">SPACE</span> — Cast / Reel / Interact</div>
          <div><span style="color:var(--text);">I</span> — Open inventory</div>
          <div><span style="color:var(--text);">ESC</span> — Settings / Back</div>
          <div><span style="color:var(--text);">1-4</span> — Select moves in battle</div>
          <div><span style="color:var(--text);">F</span> — Flee from battle</div>
          <div style="color:var(--text-dim);font-size:6px;margin-top:8px;text-align:center;">Sail to glowing zones to fish. Defeat pirate captains to become the greatest corsair!</div>
        </div>
        <div style="position:absolute; bottom:20px; font-family:var(--pixel-font); font-size:8px; color:var(--text-dim); letter-spacing:1px;">
          v0.1 DEMO
        </div>
      </div>
    </div>`
  );

  panel.querySelector('#menu-new-game')?.addEventListener('click', onNewGame);
  if (hasSave && onContinue) {
    panel.querySelector('#menu-continue')?.addEventListener('click', onContinue);
  }
  panel.querySelector('#menu-controls')?.addEventListener('click', () => {
    const cp = panel.querySelector('#controls-panel') as HTMLElement;
    if (cp) cp.style.display = cp.style.display === 'none' ? 'block' : 'none';
  });
}

export function hideMainMenu(ui: UIManager): void {
  ui.remove('main-menu');
}
