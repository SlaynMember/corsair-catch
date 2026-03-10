import { Container, Graphics, Ticker } from 'pixi.js';

const BAND_HEIGHT = 12;
const TEAL = 0x3AB8C8;
const AQUA = 0x5DD4C8;
const DEEP = 0x1A3A5C;
const ABYSS = 0x0d2040;
const FOAM_COLOR = 0xffffff;
const SHIMMER_COLOR = 0x7EECED;

/**
 * Ocean2D — Animated pixel art water for the oceanLayer (screen space).
 * Draws horizontal bands of teal/aquamarine that scroll leftward.
 */
export class Ocean2D {
  private container: Container;
  private bandGraphics: Graphics;
  private foamGraphics: Graphics;
  private shimmerGraphics: Graphics;
  private scrollOffset = 0;
  private foamDots: { x: number; y: number; size: number; speed: number }[] = [];
  private shimmerDots: { x: number; y: number; speed: number; phase: number }[] = [];
  private w = 0;
  private h = 0;

  constructor() {
    this.container = new Container();
    this.bandGraphics = new Graphics();
    this.foamGraphics = new Graphics();
    this.shimmerGraphics = new Graphics();
    this.container.addChild(this.bandGraphics);
    this.container.addChild(this.shimmerGraphics);
    this.container.addChild(this.foamGraphics);

    this.w = window.innerWidth;
    this.h = window.innerHeight;
    window.addEventListener('resize', () => {
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      this.initFoam();
      this.initShimmer();
    });

    this.initFoam();
    this.initShimmer();
  }

  private initFoam(): void {
    this.foamDots = [];
    const count = Math.floor((this.w * this.h) / 4000);
    for (let i = 0; i < count; i++) {
      this.foamDots.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        size: Math.random() < 0.3 ? 3 : 2,
        speed: 15 + Math.random() * 20,
      });
    }
  }

  private initShimmer(): void {
    this.shimmerDots = [];
    const count = Math.floor((this.w * this.h) / 8000);
    for (let i = 0; i < count; i++) {
      this.shimmerDots.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        speed: 30 + Math.random() * 15,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  get displayObject(): Container {
    return this.container;
  }

  update(dt: number): void {
    this.scrollOffset += dt * 25;
    if (this.scrollOffset > BAND_HEIGHT * 2) this.scrollOffset -= BAND_HEIGHT * 2;

    this.drawBands();
    this.updateShimmer(dt);
    this.updateFoam(dt);
  }

  private drawBands(): void {
    const g = this.bandGraphics;
    g.clear();

    const totalBands = Math.ceil(this.h / BAND_HEIGHT) + 2;
    for (let i = 0; i < totalBands; i++) {
      const y = i * BAND_HEIGHT - this.scrollOffset;
      const depthT = (i * BAND_HEIGHT) / this.h;
      let color: number;
      if (depthT > 0.75) {
        // Bottom 25%: significantly darker (abyss)
        const abyssT = (depthT - 0.75) / 0.25;
        color = lerpColor(DEEP, ABYSS, abyssT);
      } else if (i % 2 === 0) {
        color = lerpColor(TEAL, DEEP, depthT * 0.7);
      } else {
        color = lerpColor(AQUA, DEEP, depthT * 0.7);
      }
      g.rect(0, y, this.w, BAND_HEIGHT).fill({ color });
    }

    // Subtle horizontal ripple lines
    for (let i = 0; i < 10; i++) {
      const y = ((i * 36 + this.scrollOffset * 0.5) % this.h);
      g.moveTo(0, y).lineTo(this.w, y)
        .stroke({ width: 1, color: 0x7EECED, alpha: 0.20 });
    }
  }

  private updateShimmer(dt: number): void {
    const g = this.shimmerGraphics;
    g.clear();
    const time = performance.now() / 1000;

    for (const dot of this.shimmerDots) {
      dot.x -= dot.speed * 1.5 * dt; // 1.5x band speed
      if (dot.x < -6) dot.x = this.w + 6;

      // Flicker based on sin wave
      const flicker = Math.sin(time * 2.5 + dot.phase) * 0.5 + 0.5;
      if (flicker > 0.5) {
        const w = 3 + Math.floor(flicker * 4); // 3-6px wide
        g.rect(dot.x, dot.y, w, 1).fill({ color: SHIMMER_COLOR, alpha: flicker * 0.3 });
      }
    }
  }

  private updateFoam(dt: number): void {
    const g = this.foamGraphics;
    g.clear();

    for (const dot of this.foamDots) {
      dot.x -= dot.speed * dt;
      if (dot.x < -4) dot.x = this.w + 4;

      g.rect(dot.x, dot.y, dot.size, dot.size).fill({ color: FOAM_COLOR, alpha: 0.3 });
    }
  }
}

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xFF, ag = (a >> 8) & 0xFF, ab = a & 0xFF;
  const br = (b >> 16) & 0xFF, bg = (b >> 8) & 0xFF, bb = b & 0xFF;
  const r = Math.round(ar + (br - ar) * t);
  const g2 = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g2 << 8) | bl;
}
