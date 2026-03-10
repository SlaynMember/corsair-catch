import { UIManager } from './UIManager';
import { audio } from '../core/AudioManager';

export function showTutorial(ui: UIManager, onDismiss: () => void): void {
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const controlsHtml = isMobile
    ? `<div class="tutorial-row"><span class="tutorial-key">JOYSTICK</span> Sail your ship</div>
       <div class="tutorial-row"><span class="tutorial-key">ACT</span> Interact / Cast / Hook</div>
       <div class="tutorial-row"><span class="tutorial-key">INV</span> Open inventory</div>
       <div class="tutorial-row"><span class="tutorial-key">ESC</span> Cancel fishing</div>`
    : `<div class="tutorial-row"><span class="tutorial-key">W A S D</span> Sail your ship</div>
       <div class="tutorial-row"><span class="tutorial-key">Q / E</span> Rotate camera</div>
       <div class="tutorial-row"><span class="tutorial-key">SPACE</span> Interact / Cast / Hook</div>
       <div class="tutorial-row"><span class="tutorial-key">I</span> Open inventory</div>
       <div class="tutorial-row"><span class="tutorial-key">ESC</span> Cancel fishing</div>`;

  const panel = ui.show('tutorial', `<div class="tutorial-overlay">
    <div class="tutorial-box">
      <h2 class="tutorial-title">AHOY, CAPTAIN!</h2>
      <div class="tutorial-content">
        ${controlsHtml}
        <div class="tutorial-divider"></div>
        <div class="tutorial-tip">Sail to <span style="color:var(--water)">blue fishing zones</span> and press ${isMobile ? 'ACT' : 'SPACE'} to fish.</div>
        <div class="tutorial-tip">Catch elemental fish to build your crew <span style="color:var(--gold)">(max 3)</span>.</div>
        <div class="tutorial-tip">Each fish has a type — use <span style="color:var(--gold)">type matchups</span> to win battles!</div>
        <div class="tutorial-tip">Beware of <span style="color:var(--hp-red)">pirate ships</span> — they'll challenge you to battle!</div>
        <div class="tutorial-tip">Visit the <span style="color:var(--hp-green)">island dock</span> to heal your crew!</div>
      </div>
      <button class="menu-btn tutorial-btn" id="tutorial-dismiss">SET SAIL!</button>
    </div>
  </div>`);

  panel.querySelector('#tutorial-dismiss')?.addEventListener('click', () => {
    ui.remove('tutorial');
    audio.playSFX('menu_select');
    onDismiss();
  });
}
