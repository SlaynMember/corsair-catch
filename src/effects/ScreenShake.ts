import type { Container } from 'pixi.js';

/**
 * Screen shake effect — displaces the app stage for a brief duration.
 * Call trigger() to start, update() each frame.
 */
export class ScreenShake {
  private intensity = 0;
  private duration = 0;
  private elapsed = 0;
  private active = false;
  private originalX = 0;
  private originalY = 0;

  constructor(private stage: Container) {}

  /** Trigger a screen shake */
  trigger(intensity = 4, duration = 0.2): void {
    this.intensity = intensity;
    this.duration = duration;
    this.elapsed = 0;
    this.active = true;
    this.originalX = this.stage.x;
    this.originalY = this.stage.y;
  }

  update(dt: number): void {
    if (!this.active) return;

    this.elapsed += dt;
    if (this.elapsed >= this.duration) {
      this.active = false;
      this.stage.x = this.originalX;
      this.stage.y = this.originalY;
      return;
    }

    // Taper intensity over duration
    const remaining = 1 - this.elapsed / this.duration;
    const shakeX = (Math.random() - 0.5) * 2 * this.intensity * remaining;
    const shakeY = (Math.random() - 0.5) * 2 * this.intensity * remaining;
    this.stage.x = this.originalX + shakeX;
    this.stage.y = this.originalY + shakeY;
  }

  get isActive(): boolean {
    return this.active;
  }
}
