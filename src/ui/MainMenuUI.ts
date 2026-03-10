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
      <!-- Dark overlay for readability -->
      <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.4) 100%);"></div>

      <!-- Palm tree silhouettes (left and right) -->
      <div style="position:absolute;left:0;bottom:0;width:15%;height:100%;
        background:linear-gradient(to right, rgba(0,20,10,0.6), transparent);
        pointer-events:none;z-index:0;"></div>
      <div style="position:absolute;right:0;bottom:0;width:15%;height:100%;
        background:linear-gradient(to left, rgba(0,20,10,0.6), transparent);
        pointer-events:none;z-index:0;"></div>

      <!-- Main content -->
      <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;">
        <!-- Title: Gold serif with dark shadow -->
        <div style="
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 48px;
          font-weight: bold;
          color: #FFD040;
          text-shadow:
            3px 3px 0 #5A3010,
            6px 6px 0 rgba(0,0,0,0.5),
            0 0 30px rgba(255,208,64,0.3);
          letter-spacing: 4px;
          text-align: center;
          line-height: 1.1;
          margin-bottom: 8px;
          animation: titleFloat 3s ease-in-out infinite;
        ">CORSAIR<br>CATCH</div>

        <div style="
          font-family: var(--pixel-font);
          font-size: 8px;
          color: #E8DCC8;
          letter-spacing: 2px;
          margin-bottom: 48px;
          text-shadow: 1px 1px 0 rgba(0,0,0,0.8);
        ">POKEMON MEETS THE SEVEN SEAS</div>

        <!-- Wooden-frame buttons -->
        <button class="menu-btn" id="menu-new-game" style="
          min-width: 200px;
          font-size: 11px;
          padding: 16px 40px;
        ">NEW GAME</button>
        ${continueBtn}
        <button class="menu-btn" id="menu-controls" style="font-size:8px;padding:10px 24px;margin-top:4px;">CONTROLS</button>

        <div id="controls-panel" style="
          display:none;
          font-family:var(--pixel-font);
          font-size:7px;
          color:#E8DCC8;
          line-height:2.2;
          margin-top:12px;
          text-align:left;
          max-width:280px;
          background:#2A1810dd;
          border:4px solid #8B6B4D;
          padding:12px 16px;
          box-shadow: inset 2px 2px 0 rgba(210,166,120,0.18), 4px 4px 0 rgba(0,0,0,0.5);
        ">
          <div style="color:var(--gold);font-size:8px;margin-bottom:6px;text-align:center;letter-spacing:1px;">HOW TO PLAY</div>
          <div><span style="color:#FFD040;">WASD / ARROWS</span> — Sail your ship</div>
          <div><span style="color:#FFD040;">SPACE</span> — Cast / Reel / Interact</div>
          <div><span style="color:#FFD040;">I</span> — Open inventory</div>
          <div><span style="color:#FFD040;">ESC</span> — Settings / Back</div>
          <div><span style="color:#FFD040;">1-4</span> — Select moves in battle</div>
          <div><span style="color:#FFD040;">F</span> — Flee from battle</div>
          <div style="color:#8898a8;font-size:6px;margin-top:8px;text-align:center;">Sail to glowing zones to fish. Defeat pirate captains to become the greatest corsair!</div>
        </div>

        <div style="position:absolute; bottom:20px; font-family:var(--pixel-font); font-size:8px; color:#8898a8; letter-spacing:1px; text-shadow:1px 1px 0 rgba(0,0,0,0.8);">
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
