import { Container, Graphics } from 'pixi.js';

// Color constants
const TEAL_BRIGHT = 0x3AB8C8;
const AQUA = 0x5DD4C8;
const TEAL_MID = 0x2D9FB5;
const TEAL_DEEP = 0x1A7A8C;
const DEEP = 0x1A3A5C;
const ABYSS = 0x0D2040;
const FOAM_COLOR = 0xFFFFFF;
const FOAM_TEAL = 0xB0E8EC;
const SHIMMER_COLOR = 0xFFF8D0;

const BAND_HEIGHT = 24;

/**
 * Ocean2D — Animated pixel art water for the oceanLayer (screen space).
 * Draws undulating wave bands with foam crests, shimmer patches, and depth gradient.
 */
export class Ocean2D {
  private container: Container;
  private bandGraphics: Graphics;
  private foamGraphics: Graphics;
  private shimmerGraphics: Graphics;
  private elapsed = 0;
  private w = 0;
  private h = 0;
  private shimmerPatches: { x: number; y: number; speed: number; phase: number; width: number }[] = [];

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
      this.initShimmer();
    });

    this.initShimmer();
  }

  private initShimmer(): void {
    this.shimmerPatches = [];
    const count = Math.floor((this.w * this.h) / 2000);
    for (let i = 0; i < count; i++) {
      this.shimmerPatches.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        speed: 8 + Math.random() * 12,
        phase: Math.random() * Math.PI * 2,
        width: 3 + Math.floor(Math.random() * 5),
      });
    }
  }

  get displayObject(): Container {
    return this.container;
  }

  update(dt: number): void {
    this.elapsed += dt;
    this.drawBands();
    this.drawFoam();
    this.drawShimmer(dt);
  }

  /** Gerstner-style wave height for a given x position and band index */
  getWaveHeight(x: number, bandIndex: number): number {
    const t = this.elapsed;
    // Multiple wave frequencies for organic look
    const wave1 = Math.sin(x * 0.008 + t * 1.2 + bandIndex * 0.7) * 4;
    const wave2 = Math.sin(x * 0.015 + t * 0.8 - bandIndex * 1.1) * 2.5;
    const wave3 = Math.sin(x * 0.003 + t * 0.5 + bandIndex * 0.3) * 6;
    return wave1 + wave2 + wave3;
  }

  private getDepthColor(depthT: number, bandEven: boolean): number {
    // Top 30%: bright teal/aqua
    if (depthT < 0.3) {
      const t = depthT / 0.3;
      const bright = bandEven ? TEAL_BRIGHT : AQUA;
      return lerpColor(bright, TEAL_MID, t * 0.5);
    }
    // Middle 40%: medium
    if (depthT < 0.7) {
      const t = (depthT - 0.3) / 0.4;
      const start = bandEven ? TEAL_MID : TEAL_DEEP;
      return lerpColor(start, DEEP, t * 0.7);
    }
    // Bottom 30%: deep to abyss
    const t = (depthT - 0.7) / 0.3;
    return lerpColor(DEEP, ABYSS, t);
  }

  private drawBands(): void {
    const g = this.bandGraphics;
    g.clear();

    const totalBands = Math.ceil(this.h / BAND_HEIGHT) + 4;
    const scrollOffset = (this.elapsed * 18) % (BAND_HEIGHT * 2);

    for (let i = 0; i < totalBands; i++) {
      const baseY = i * BAND_HEIGHT - scrollOffset;
      const depthT = Math.min(1, (i * BAND_HEIGHT) / this.h);
      const color = this.getDepthColor(depthT, i % 2 === 0);

      // Draw band as series of segments with wave deformation
      const segmentW = 8;
      const segments = Math.ceil(this.w / segmentW) + 1;
      for (let s = 0; s < segments; s++) {
        const x = s * segmentW;
        const waveY = this.getWaveHeight(x, i);
        const y = baseY + waveY;
        g.rect(x, y, segmentW + 1, BAND_HEIGHT + 2).fill({ color });
      }
    }

    // Horizontal ripple lines (thicker, slower, more visible)
    for (let i = 0; i < 16; i++) {
      const baseRippleY = ((i * 42 + this.elapsed * 12) % (this.h + 40)) - 20;
      const g2 = g;
      // Draw wavy ripple line
      g2.moveTo(0, baseRippleY + this.getWaveHeight(0, i * 3) * 0.5);
      for (let x = 0; x <= this.w; x += 16) {
        const wy = baseRippleY + this.getWaveHeight(x, i * 3) * 0.5;
        g2.lineTo(x, wy);
      }
      g2.stroke({ width: 2, color: 0x7EECED, alpha: 0.18 });
    }
  }

  private drawFoam(): void {
    const g = this.foamGraphics;
    g.clear();

    const totalBands = Math.ceil(this.h / BAND_HEIGHT) + 4;
    const scrollOffset = (this.elapsed * 18) % (BAND_HEIGHT * 2);

    // Foam lines along wave crests (top edge of darker bands)
    for (let i = 0; i < totalBands; i++) {
      if (i % 2 !== 0) continue; // foam on even bands (lighter ones)
      const baseY = i * BAND_HEIGHT - scrollOffset;
      const depthT = Math.min(1, (i * BAND_HEIGHT) / this.h);

      // Foam is stronger near surface, fades with depth
      const foamAlpha = Math.max(0, 0.5 - depthT * 0.4);
      if (foamAlpha < 0.05) continue;

      // Draw foam as a thick wavy line along the top of the band
      for (let x = 0; x < this.w; x += 4) {
        const waveY = this.getWaveHeight(x, i);
        const y = baseY + waveY;

        // Foam appears at wave peaks (when wave is negative = crest)
        const peakStrength = Math.max(0, -this.getWaveHeight(x, i) / 8);
        const alpha = foamAlpha * (0.4 + peakStrength * 0.6);

        if (alpha > 0.05) {
          // White foam core
          g.rect(x, y - 1, 4, 2).fill({ color: FOAM_COLOR, alpha: alpha * 0.7 });
          // Teal foam edge
          g.rect(x, y + 1, 4, 2).fill({ color: FOAM_TEAL, alpha: alpha * 0.5 });
        }
      }

      // Scattered foam dots near crest
      const dotCount = Math.floor(this.w / 60);
      for (let d = 0; d < dotCount; d++) {
        const dx = (d * 60 + Math.sin(this.elapsed * 0.8 + d * 2.3 + i) * 15) % this.w;
        const dy = baseY + this.getWaveHeight(dx, i) + Math.sin(this.elapsed + d) * 3;
        const dotAlpha = foamAlpha * (0.3 + Math.sin(this.elapsed * 1.5 + d * 1.7) * 0.2);
        if (dotAlpha > 0.05) {
          g.rect(dx, dy - 2, 3, 2).fill({ color: FOAM_COLOR, alpha: dotAlpha });
        }
      }
    }
  }

  private drawShimmer(dt: number): void {
    const g = this.shimmerGraphics;
    g.clear();
    const time = this.elapsed;

    for (const patch of this.shimmerPatches) {
      patch.x -= patch.speed * dt;
      if (patch.x < -10) {
        patch.x = this.w + 10;
        patch.y = Math.random() * this.h;
      }

      // Sun glint — bright patches that pulse
      const flicker = Math.sin(time * 2.0 + patch.phase) * 0.5 + 0.5;
      // Depth fade: brighter near top
      const depthFade = Math.max(0.2, 1 - (patch.y / this.h) * 0.6);

      if (flicker > 0.3) {
        const alpha = flicker * 0.35 * depthFade;
        g.rect(patch.x, patch.y, patch.width, 2).fill({ color: SHIMMER_COLOR, alpha });
        // Bright center pixel
        if (flicker > 0.6) {
          g.rect(patch.x + 1, patch.y, 2, 1).fill({ color: 0xFFFFFF, alpha: alpha * 0.8 });
        }
      }
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
