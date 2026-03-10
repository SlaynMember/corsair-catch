import { Graphics, Container } from 'pixi.js';

export type TransitionType = 'fade' | 'radial' | 'iris-open' | 'wave-wipe' | 'diamond';

/**
 * Screen transition effects (Pokemon Diamond style).
 * Draws over everything using a full-screen graphics overlay.
 */
export class TransitionEffect {
  private graphics: Graphics;
  private progress = 0;
  private duration: number;
  private type: TransitionType;
  private direction: 'in' | 'out';
  private active = false;
  private onComplete?: () => void;
  private w = 0;
  private h = 0;

  constructor(parent: Container) {
    this.graphics = new Graphics();
    this.graphics.zIndex = 9999;
    parent.addChild(this.graphics);
    this.duration = 0.5;
    this.type = 'fade';
    this.direction = 'out';
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    window.addEventListener('resize', () => {
      this.w = window.innerWidth;
      this.h = window.innerHeight;
    });
  }

  /**
   * Play a transition.
   * 'out' = screen goes to black. 'in' = black reveals scene.
   */
  play(type: TransitionType, direction: 'in' | 'out', duration: number, onComplete?: () => void): void {
    this.type = type;
    this.direction = direction;
    this.duration = duration;
    this.progress = 0;
    this.active = true;
    this.onComplete = onComplete;
  }

  get isActive(): boolean {
    return this.active;
  }

  update(dt: number): void {
    if (!this.active) {
      this.graphics.clear();
      return;
    }

    this.progress += dt / this.duration;
    if (this.progress >= 1) {
      this.progress = 1;
      this.active = false;
      this.onComplete?.();
    }

    // t goes 0→1. For 'in', we reverse so the mask opens up.
    const t = this.direction === 'out' ? this.progress : 1 - this.progress;
    this.draw(t);
  }

  private draw(t: number): void {
    const g = this.graphics;
    g.clear();

    switch (this.type) {
      case 'fade':
        g.rect(0, 0, this.w, this.h).fill({ color: 0x000000, alpha: t });
        break;

      case 'radial': {
        // Radial collapse — circle shrinks to center
        const maxR = Math.sqrt(this.w * this.w + this.h * this.h) / 2;
        const radius = maxR * (1 - t);
        // Draw black with circle hole
        g.rect(0, 0, this.w, this.h).fill({ color: 0x000000 });
        if (radius > 0) {
          g.circle(this.w / 2, this.h / 2, radius)
            .cut();
        }
        break;
      }

      case 'iris-open': {
        // Iris open from center — inverse of radial
        const maxR2 = Math.sqrt(this.w * this.w + this.h * this.h) / 2;
        const radius2 = maxR2 * t;
        g.rect(0, 0, this.w, this.h).fill({ color: 0x000000 });
        if (radius2 > 0) {
          g.circle(this.w / 2, this.h / 2, radius2)
            .cut();
        }
        break;
      }

      case 'wave-wipe': {
        // Horizontal wave wipe
        const wipeX = this.w * t;
        const waveAmp = 30;
        const segments = 40;
        const segH = this.h / segments;

        // Draw black shape with wavy right edge
        g.moveTo(0, 0);
        for (let i = 0; i <= segments; i++) {
          const y = i * segH;
          const wave = Math.sin(i * 0.5 + t * 8) * waveAmp * Math.min(1, t * 3);
          g.lineTo(wipeX + wave, y);
        }
        g.lineTo(0, this.h);
        g.lineTo(0, 0);
        g.fill({ color: 0x000000 });
        break;
      }

      case 'diamond': {
        // Diamond wipe from center
        const maxD = Math.max(this.w, this.h);
        const size = maxD * (1 - t);
        const cx = this.w / 2;
        const cy = this.h / 2;
        g.rect(0, 0, this.w, this.h).fill({ color: 0x000000 });
        if (size > 0) {
          g.moveTo(cx, cy - size);
          g.lineTo(cx + size, cy);
          g.lineTo(cx, cy + size);
          g.lineTo(cx - size, cy);
          g.lineTo(cx, cy - size);
          g.cut();
        }
        break;
      }
    }
  }

  destroy(): void {
    this.graphics.destroy();
  }
}

/**
 * Helper: play a full out→callback→in transition sequence.
 */
export function playTransitionSequence(
  parent: Container,
  outType: TransitionType,
  inType: TransitionType,
  outDuration: number,
  inDuration: number,
  onMidpoint: () => void,
  onDone?: () => void
): TransitionEffect {
  const fx = new TransitionEffect(parent);
  fx.play(outType, 'out', outDuration, () => {
    onMidpoint();
    fx.play(inType, 'in', inDuration, () => {
      fx.destroy();
      onDone?.();
    });
  });
  return fx;
}
