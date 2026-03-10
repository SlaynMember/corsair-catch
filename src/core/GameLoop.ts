const FIXED_DT = 1 / 60; // 60Hz logic tick
const MAX_FRAME_TIME = 0.25; // Prevent spiral of death

export class GameLoop {
  private accumulator = 0;
  private lastTime = 0;
  private running = false;
  private paused = false;
  private rafId = 0;

  constructor(
    private onUpdate: (dt: number) => void,
    private onRender: (interpolation: number) => void
  ) {
    // Auto-pause when window loses focus
    window.addEventListener('blur', () => { this.paused = true; });
    window.addEventListener('focus', () => {
      if (this.paused) {
        this.paused = false;
        this.lastTime = performance.now() / 1000; // Reset timer to prevent time jump
      }
    });
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now() / 1000;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private tick = (nowMs: number): void => {
    if (!this.running) return;

    const now = nowMs / 1000;
    let frameTime = now - this.lastTime;
    this.lastTime = now;

    if (frameTime > MAX_FRAME_TIME) {
      frameTime = MAX_FRAME_TIME;
    }

    // Skip updates while paused, but still render so scene stays visible
    if (!this.paused) {
      this.accumulator += frameTime;

      while (this.accumulator >= FIXED_DT) {
        this.onUpdate(FIXED_DT);
        this.accumulator -= FIXED_DT;
      }
    }

    const interpolation = this.paused ? 0 : this.accumulator / FIXED_DT;
    this.onRender(interpolation);

    this.rafId = requestAnimationFrame(this.tick);
  };
}
