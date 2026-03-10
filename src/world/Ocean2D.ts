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

const BIO_DARK = 0x0D3B5C;
const BIO_DARKER = 0x061825;
const BIO_GLOW = 0x0FFFFF;

const BAND_HEIGHT = 24;

/**
 * Ocean2D — Animated pixel art water for the oceanLayer (screen space).
 * Draws undulating wave bands with foam crests, shimmer patches, and depth gradient.
 */
// Bioluminescent glow curve
interface BioGlowCurve {
  points: { x: number; y: number }[];
  speed: number;
  width: number;
  phase: number;
  alpha: number;
}

// Creature silhouette drifting under the surface
interface CreatureSilhouette {
  x: number;
  y: number;
  speed: number;
  size: number;
  type: number; // 0=fish, 1=jellyfish, 2=serpent
}

export class Ocean2D {
  private container: Container;
  private bandGraphics: Graphics;
  private foamGraphics: Graphics;
  private shimmerGraphics: Graphics;
  private bioGraphics: Graphics;
  private elapsed = 0;
  private w = 0;
  private h = 0;
  private shimmerPatches: { x: number; y: number; speed: number; phase: number; width: number }[] = [];
  private bioMode = false;
  private bioTransition = 0; // 0 = normal, 1 = full bioluminescent
  private bioCurves: BioGlowCurve[] = [];
  private creatures: CreatureSilhouette[] = [];
  private resizeHandler = () => {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.initShimmer();
  };

  constructor() {
    this.container = new Container();
    this.bandGraphics = new Graphics();
    this.foamGraphics = new Graphics();
    this.shimmerGraphics = new Graphics();
    this.bioGraphics = new Graphics();
    this.container.addChild(this.bandGraphics);
    this.container.addChild(this.shimmerGraphics);
    this.container.addChild(this.foamGraphics);
    this.container.addChild(this.bioGraphics);

    this.w = window.innerWidth;
    this.h = window.innerHeight;
    window.addEventListener('resize', this.resizeHandler);

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

  /** Enable/disable bioluminescent deep water mode */
  setBioMode(active: boolean): void {
    this.bioMode = active;
    if (active && this.bioCurves.length === 0) {
      this.initBioCurves();
      this.initCreatures();
    }
  }

  update(dt: number): void {
    this.elapsed += dt;

    // Smooth transition to/from bio mode
    const targetBio = this.bioMode ? 1 : 0;
    this.bioTransition += (targetBio - this.bioTransition) * dt * 2;
    this.bioTransition = Math.max(0, Math.min(1, this.bioTransition));

    this.drawBands();
    if (this.bioTransition < 0.5) {
      this.drawFoam();
      this.drawShimmer(dt);
      this.bioGraphics.clear();
    } else {
      this.foamGraphics.clear();
      this.shimmerGraphics.clear();
      this.drawBioluminescence(dt);
    }
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
    let normalColor: number;
    // Top 30%: bright teal/aqua
    if (depthT < 0.3) {
      const t = depthT / 0.3;
      const bright = bandEven ? TEAL_BRIGHT : AQUA;
      normalColor = lerpColor(bright, TEAL_MID, t * 0.5);
    } else if (depthT < 0.7) {
      // Middle 40%: medium
      const t = (depthT - 0.3) / 0.4;
      const start = bandEven ? TEAL_MID : TEAL_DEEP;
      normalColor = lerpColor(start, DEEP, t * 0.7);
    } else {
      // Bottom 30%: deep to abyss
      const t = (depthT - 0.7) / 0.3;
      normalColor = lerpColor(DEEP, ABYSS, t);
    }

    // Bio mode: blend toward dark navy
    if (this.bioTransition > 0.01) {
      const bioColor = bandEven ? BIO_DARK : BIO_DARKER;
      return lerpColor(normalColor, bioColor, this.bioTransition);
    }
    return normalColor;
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

  private initBioCurves(): void {
    this.bioCurves = [];
    for (let i = 0; i < 8; i++) {
      const points: { x: number; y: number }[] = [];
      const startX = Math.random() * this.w;
      const startY = this.h * 0.2 + Math.random() * this.h * 0.7;
      for (let p = 0; p < 6; p++) {
        points.push({
          x: startX + p * (this.w * 0.25) + (Math.random() - 0.5) * 80,
          y: startY + (Math.random() - 0.5) * 120,
        });
      }
      this.bioCurves.push({
        points,
        speed: 15 + Math.random() * 25,
        width: 1 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.2 + Math.random() * 0.3,
      });
    }
  }

  private initCreatures(): void {
    this.creatures = [];
    for (let i = 0; i < 5; i++) {
      this.creatures.push({
        x: Math.random() * this.w * 1.5,
        y: this.h * 0.3 + Math.random() * this.h * 0.6,
        speed: 8 + Math.random() * 15,
        size: 15 + Math.random() * 30,
        type: Math.floor(Math.random() * 3),
      });
    }
  }

  private drawBioluminescence(dt: number): void {
    const g = this.bioGraphics;
    g.clear();
    const t = this.elapsed;

    // Draw glowing bezier curves
    for (const curve of this.bioCurves) {
      // Drift curves leftward
      for (const p of curve.points) {
        p.x -= curve.speed * dt;
        p.y += Math.sin(t * 0.5 + p.x * 0.01) * dt * 8;
      }
      // Reset when fully off-screen
      if (curve.points[curve.points.length - 1].x < -100) {
        const startX = this.w + 50;
        const startY = this.h * 0.2 + Math.random() * this.h * 0.6;
        for (let p = 0; p < curve.points.length; p++) {
          curve.points[p].x = startX + p * (this.w * 0.25) + (Math.random() - 0.5) * 80;
          curve.points[p].y = startY + (Math.random() - 0.5) * 120;
        }
      }

      // Pulsing glow intensity
      const pulse = 0.5 + Math.sin(t * 0.8 + curve.phase) * 0.5;
      const alpha = curve.alpha * pulse * this.bioTransition;

      if (alpha < 0.02) continue;

      // Draw the curve as connected line segments
      const pts = curve.points;
      if (pts.length < 2) continue;

      // Outer glow (wider, more transparent)
      g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        g.lineTo(pts[i].x, pts[i].y);
      }
      g.stroke({ width: curve.width * 4, color: BIO_GLOW, alpha: alpha * 0.2 });

      // Inner bright core
      g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        g.lineTo(pts[i].x, pts[i].y);
      }
      g.stroke({ width: curve.width, color: BIO_GLOW, alpha: alpha * 0.8 });

      // Bright white center
      g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        g.lineTo(pts[i].x, pts[i].y);
      }
      g.stroke({ width: Math.max(1, curve.width * 0.5), color: 0xFFFFFF, alpha: alpha * 0.4 });
    }

    // Draw creature silhouettes
    for (const creature of this.creatures) {
      creature.x -= creature.speed * dt;
      creature.y += Math.sin(t * 0.3 + creature.x * 0.005) * dt * 3;
      if (creature.x < -creature.size * 3) {
        creature.x = this.w + creature.size * 3;
        creature.y = this.h * 0.3 + Math.random() * this.h * 0.6;
      }

      const alpha = 0.12 * this.bioTransition;
      const s = creature.size;

      if (creature.type === 0) {
        // Fish silhouette — simple ellipse + tail
        g.ellipse(creature.x, creature.y, s, s * 0.4).fill({ color: 0x000000, alpha });
        g.moveTo(creature.x + s, creature.y);
        g.lineTo(creature.x + s * 1.5, creature.y - s * 0.3);
        g.lineTo(creature.x + s * 1.5, creature.y + s * 0.3);
        g.lineTo(creature.x + s, creature.y);
        g.fill({ color: 0x000000, alpha });
      } else if (creature.type === 1) {
        // Jellyfish silhouette — dome + tendrils
        g.ellipse(creature.x, creature.y, s * 0.6, s * 0.4).fill({ color: 0x000000, alpha });
        for (let t2 = 0; t2 < 4; t2++) {
          const tx = creature.x + (t2 - 1.5) * s * 0.3;
          const tendrilWave = Math.sin(this.elapsed * 2 + t2) * 5;
          g.moveTo(tx, creature.y + s * 0.3);
          g.lineTo(tx + tendrilWave, creature.y + s * 1.2);
          g.stroke({ width: 1, color: 0x000000, alpha: alpha * 0.7 });
        }
      } else {
        // Serpent silhouette — wavy line
        g.moveTo(creature.x - s, creature.y);
        for (let seg = 0; seg <= 8; seg++) {
          const sx = creature.x - s + seg * (s * 0.5);
          const sy = creature.y + Math.sin(this.elapsed * 1.5 + seg * 0.8) * s * 0.3;
          g.lineTo(sx, sy);
        }
        g.stroke({ width: s * 0.15, color: 0x000000, alpha });
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

  /**
   * Cleanup: Remove event listeners and destroy graphics.
   * Call this when the Ocean2D instance is no longer needed.
   */
  dispose(): void {
    window.removeEventListener('resize', this.resizeHandler);
    this.bandGraphics.destroy();
    this.foamGraphics.destroy();
    this.shimmerGraphics.destroy();
    this.bioGraphics.destroy();
    this.container.destroy();
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
