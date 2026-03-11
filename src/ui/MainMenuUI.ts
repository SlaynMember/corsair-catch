import { UIManager } from './UIManager';

/**
 * Main Menu UI — Staged opening sequence
 * Stage 1: Beach vista (1s)
 * Stage 2: Character wakes (1.5s) [PixiJS renders character]
 * Stage 3: Input prompt (2s)
 * Stage 4: Menu panel fades in
 */

let openingSequenceComplete = false;

export function showMainMenu(
  ui: UIManager,
  onNewGame: () => void,
  hasSave: boolean,
  onContinue?: () => void
): void {
  const continueBtn = hasSave
    ? `<button class="diegetic-btn" id="menu-continue">LOAD GAME</button>`
    : '';

  const panel = ui.show(
    'main-menu',
    `<div class="main-menu" style="
      position: fixed;
      inset: 0;
      background: linear-gradient(
        180deg,
        #f4a76d 0%,
        #e07856 30%,
        #a8703c 60%,
        #2dafb8 85%,
        #1b8a96 100%
      );
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      z-index: 1001;
      font-family: 'Crimson Text', serif;
      color: #e8e0d0;
      pointer-events: none;
    ">
      <!-- Pirate character placeholder (PixiJS will render here) -->
      <div id="pirate-render-zone" style="
        position: absolute;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        width: 200px;
        height: 300px;
        opacity: 0;
        display: none;
        animation: fadeInCharacter 1.2s ease-out 0.5s forwards;
      "></div>

      <!-- Input prompt (appears at t=2.3s) -->
      <div id="opening-prompt" style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(42, 20, 16, 0.92);
        border: 4px solid #8b6b4d;
        padding: 24px 32px;
        text-align: center;
        opacity: 0;
        display: none;
        pointer-events: none;
        animation: fadeInPrompt 0.6s ease-out 2.3s forwards, pulseBorder 2s ease-in-out 2.5s infinite;
        z-index: 20;
      " onclick="skipOpening()">
        <div style="
          font-family: 'Crimson Text', serif;
          font-size: 20px;
          color: #e8e0d0;
          margin-bottom: 12px;
          line-height: 1.4;
        ">You wake on the shore...</div>
        <div style="
          font-family: 'Inconsolata', monospace;
          font-size: 14px;
          color: #f0c040;
          letter-spacing: 1px;
        ">↑ MOVE • SPACE to interact</div>
      </div>

      <!-- Menu panel (appears at t=3.0s) -->
      <div class="diegetic-panel" id="menu-panel" style="
        max-width: 480px;
        width: 90%;
        margin-bottom: 40px;
        opacity: 0;
        pointer-events: none;
        animation: slideUpMenu 0.8s ease-out 3.0s forwards;
      ">
        <h1 style="
          font-family: 'Pirata One', cursive;
          font-size: 56px;
          letter-spacing: 3px;
          color: #f0c040;
          text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8), -1px -1px 0 #fd574b;
          margin-bottom: 12px;
          text-align: center;
          animation: glow-pulse 3s ease-in-out infinite;
        ">CORSAIR CATCH</h1>

        <p style="
          font-family: 'Crimson Text', serif;
          font-style: italic;
          font-size: 18px;
          color: #c0a070;
          text-align: center;
          margin-bottom: 32px;
          letter-spacing: 1px;
        ">Pokémon meets the Seven Seas</p>

        <div style="
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        ">
          <button class="diegetic-btn" id="menu-new-game" style="width: 100%;">
            NEW GAME
          </button>
          ${continueBtn}
          <button class="diegetic-btn" id="menu-controls" style="width: 100%; background: linear-gradient(135deg, #9d6113 0%, #7a4a0a 100%); border-color: #6b3a08;">
            CONTROLS
          </button>
        </div>

        <div style="
          height: 2px;
          background: linear-gradient(90deg, transparent, #8b6b4d 20%, #8b6b4d 80%, transparent);
          margin: 16px 0;
        "></div>

        <div style="
          font-family: 'Inconsolata', monospace;
          font-size: 11px;
          color: #6f6d6d;
          text-align: center;
          letter-spacing: 0.5px;
        ">Catch • Crew • Conquer</div>
      </div>

      <!-- Controls panel (hidden by default) -->
      <div id="controls-panel" style="
        display: none;
        position: absolute;
        bottom: 40px;
        max-width: 480px;
        width: 90%;
        font-family: 'Inconsolata', monospace;
        font-size: 11px;
        color: #E8DCC8;
        line-height: 2.0;
        background: rgba(42, 20, 16, 0.95);
        border: 4px solid #8b6b4d;
        padding: 16px;
        box-shadow:
          inset 2px 2px 0 rgba(210, 166, 120, 0.18),
          inset -2px -2px 0 rgba(0, 0, 0, 0.6),
          4px 4px 0 rgba(0, 0, 0, 0.5);
      ">
        <div style="color: #f0c040; font-size: 12px; margin-bottom: 8px; text-align: center; letter-spacing: 1px;">
          HOW TO PLAY
        </div>
        <div><span style="color: #FFD040;">WASD / ARROWS</span> — Walk around</div>
        <div><span style="color: #FFD040;">SPACE</span> — Cast / Reel / Interact</div>
        <div><span style="color: #FFD040;">TAB</span> — Open inventory</div>
        <div><span style="color: #FFD040;">C</span> — Craft (on island)</div>
        <div><span style="color: #FFD040;">ESC</span> — Settings / Back</div>
        <div><span style="color: #FFD040;">1-4</span> — Select moves in battle</div>
        <div style="color: #8898a8; font-size: 10px; margin-top: 8px; text-align: center; font-style: italic;">
          Explore islands, fish at hotspots, defeat pirate captains!
        </div>
        <button id="controls-back" style="
          margin-top: 12px;
          width: 100%;
          background: linear-gradient(135deg, #fd574b 0%, #e84030 100%);
          border: 2px solid #a02820;
          color: #fff;
          padding: 8px;
          cursor: pointer;
          font-family: 'Inconsolata', monospace;
          font-size: 10px;
          letter-spacing: 1px;
        ">BACK</button>
      </div>

      <!-- Version info -->
      <div style="
        position: absolute;
        bottom: 12px;
        right: 12px;
        font-family: 'Inconsolata', monospace;
        font-size: 8px;
        color: #8898a8;
        letter-spacing: 1px;
        text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.8);
      ">v0.2 DEMO</div>
    </div>`
  );

  // Inject animations into head
  injectOpeningAnimations();

  // Start opening sequence
  startOpeningSequence(panel);

  // Event listeners
  setTimeout(() => {
    const newGameBtn = panel.querySelector('#menu-new-game') as HTMLButtonElement;
    const continueBtn = panel.querySelector('#menu-continue') as HTMLButtonElement;
    const controlsBtn = panel.querySelector('#menu-controls') as HTMLButtonElement;
    const controlsPanel = panel.querySelector('#controls-panel') as HTMLElement;
    const controlsBack = panel.querySelector('#controls-back') as HTMLButtonElement;

    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => {
        panel.style.opacity = '0';
        setTimeout(onNewGame, 300);
      });
    }

    if (continueBtn && onContinue) {
      continueBtn.addEventListener('click', () => {
        panel.style.opacity = '0';
        setTimeout(onContinue, 300);
      });
    }

    if (controlsBtn && controlsPanel && controlsBack) {
      controlsBtn.addEventListener('click', () => {
        controlsPanel.style.display = controlsPanel.style.display === 'none' ? 'block' : 'none';
      });

      controlsBack.addEventListener('click', () => {
        controlsPanel.style.display = 'none';
      });
    }
  }, 100);
}

function startOpeningSequence(container: HTMLElement): void {
  const wake = container.querySelector('#pirate-render-zone') as HTMLElement;
  const prompt = container.querySelector('#opening-prompt') as HTMLElement;
  const panel = container.querySelector('#menu-panel') as HTMLElement;

  // Hide PixiJS canvas during menu using class
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (canvas) {
    canvas.classList.add('menu-open');
  }

  // Stage 1: Vista (background gradient already visible)
  // Stage 2: Character wakes (1.5s delay)
  setTimeout(() => {
    if (wake) {
      wake.style.display = 'block';
      wake.style.animation = 'fadeInCharacter 1.2s ease-out forwards';
    }
  }, 1500);

  // Stage 3: Prompt appears (2.3s delay)
  setTimeout(() => {
    if (prompt) {
      prompt.style.display = 'block';
      prompt.style.pointerEvents = 'auto';
      prompt.style.animation = 'fadeInPrompt 0.6s ease-out forwards, pulseBorder 2s ease-in-out 2.5s infinite';
    }
  }, 2300);

  // Stage 4: Menu slides up (3.0s delay, or skip if user interacts)
  setTimeout(() => {
    if (panel) {
      panel.style.animation = 'slideUpMenu 0.8s ease-out forwards';
      panel.style.pointerEvents = 'auto';
    }
    openingSequenceComplete = true;
  }, 3000);
}

function skipOpening(): void {
  if (openingSequenceComplete) return;
  openingSequenceComplete = true;

  const prompt = document.querySelector('#opening-prompt') as HTMLElement;
  const panel = document.querySelector('#menu-panel') as HTMLElement;

  if (prompt) {
    prompt.style.display = 'none';
    prompt.style.pointerEvents = 'none';
  }
  if (panel) {
    panel.style.animation = 'slideUpMenu 0.3s ease-out forwards';
  }
}

function injectOpeningAnimations(): void {
  if (document.querySelector('#opening-animations')) return; // Already injected

  const style = document.createElement('style');
  style.id = 'opening-animations';
  style.textContent = `
    @keyframes fadeInCharacter {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }

    @keyframes fadeInPrompt {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }

    @keyframes slideUpMenu {
      0% {
        opacity: 0;
        transform: translateY(40px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes glow-pulse {
      0%, 100% { filter: drop-shadow(-1px -1px 0 #fd574b); }
      50% { filter: drop-shadow(-1px -1px 0 #fd574b) drop-shadow(0 0 15px rgba(253, 87, 75, 0.5)); }
    }

    @keyframes pulseBorder {
      0%, 100% { border-color: #8b6b4d; box-shadow: inset 1px 1px 0 rgba(210,166,120,0.1); }
      50% { border-color: #f0c040; box-shadow: inset 1px 1px 0 rgba(210,166,120,0.2), 0 0 12px rgba(240,192,64,0.3); }
    }
  `;

  document.head.appendChild(style);
}

export function hideMainMenu(ui: UIManager): void {
  ui.hide('main-menu');

  // Show PixiJS canvas again
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (canvas) {
    canvas.classList.remove('menu-open');
  }
}
