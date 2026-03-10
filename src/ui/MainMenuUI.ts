import { UIManager } from './UIManager';

// Sprite sheet config: 7x7 grid, 480x270 per frame, 45 valid frames (last 4 are black)
const SHEET_COLS = 7;
const SHEET_ROWS = 7;
const FRAME_W = 480;
const FRAME_H = 270;
const TOTAL_FRAMES = 45; // 7*7 - 4 black frames at end
const FRAME_DURATION = 100; // ms per frame (~10 FPS animation)

let animFrameId: number | null = null;

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
    `<div class="main-menu" style="background:#0a0a0a;">
      <!-- Animated sprite sheet canvas -->
      <canvas id="menu-anim-canvas" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"></canvas>

      <!-- Main content (buttons only — no text overlay) -->
      <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;padding-bottom:60px;">
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
          <div><span style="color:#FFD040;">WASD / ARROWS</span> — Walk around</div>
          <div><span style="color:#FFD040;">SPACE</span> — Cast / Reel / Interact</div>
          <div><span style="color:#FFD040;">I</span> — Open inventory</div>
          <div><span style="color:#FFD040;">ESC</span> — Settings / Back</div>
          <div><span style="color:#FFD040;">1-4</span> — Select moves in battle</div>
          <div><span style="color:#FFD040;">F</span> — Flee from battle</div>
          <div style="color:#8898a8;font-size:6px;margin-top:8px;text-align:center;">Explore islands, fish at glowing spots, defeat pirate captains!</div>
        </div>

        <div style="position:absolute; bottom:12px; font-family:var(--pixel-font); font-size:8px; color:#8898a8; letter-spacing:1px; text-shadow:1px 1px 0 rgba(0,0,0,0.8);">
          v0.1 DEMO
        </div>
      </div>
    </div>`
  );

  // Set up sprite sheet animation on canvas
  const canvas = panel.querySelector('#menu-anim-canvas') as HTMLCanvasElement;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Size canvas to container
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const sheetImg = new Image();
      sheetImg.src = 'sprites/menu-beach-anim.png';

      let currentFrame = 0;
      let lastTime = 0;

      const drawFrame = (timestamp: number) => {
        if (!lastTime) lastTime = timestamp;
        const elapsed = timestamp - lastTime;

        if (elapsed >= FRAME_DURATION) {
          lastTime = timestamp - (elapsed % FRAME_DURATION);
          currentFrame = (currentFrame + 1) % TOTAL_FRAMES; // loops!
        }

        // Resize canvas to match container (handles window resize)
        const parentRect = canvas.parentElement!.getBoundingClientRect();
        if (canvas.width !== parentRect.width || canvas.height !== parentRect.height) {
          canvas.width = parentRect.width;
          canvas.height = parentRect.height;
        }

        if (sheetImg.complete && sheetImg.naturalWidth > 0) {
          const col = currentFrame % SHEET_COLS;
          const row = Math.floor(currentFrame / SHEET_COLS);

          // Letterbox: fit frame to canvas preserving 16:9 aspect
          const frameAspect = FRAME_W / FRAME_H; // 480/270 = 16:9
          const canvasAspect = canvas.width / canvas.height;
          let dw: number, dh: number, dx: number, dy: number;
          if (canvasAspect > frameAspect) {
            // Canvas is wider — pillarbox (bars on sides)
            dh = canvas.height;
            dw = dh * frameAspect;
            dx = (canvas.width - dw) / 2;
            dy = 0;
          } else {
            // Canvas is taller — letterbox (bars top/bottom)
            dw = canvas.width;
            dh = dw / frameAspect;
            dx = 0;
            dy = (canvas.height - dh) / 2;
          }

          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(
            sheetImg,
            col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H,
            dx, dy, dw, dh
          );
        }

        animFrameId = requestAnimationFrame(drawFrame);
      };

      animFrameId = requestAnimationFrame(drawFrame);
    }
  }

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
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  ui.remove('main-menu');
}
