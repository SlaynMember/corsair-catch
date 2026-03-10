/**
 * ParticleEffects2D — Real PixiJS v8 particle effects.
 * ParticleBurst: colored squares flying outward with fade.
 * RippleEffect: expanding concentric ring circles with fade.
 */

import { Graphics, Container } from 'pixi.js';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export class ParticleBurst {
  private alive = true;
  private timer = 0;
  private readonly lifetime: number;
  private readonly gfx: Graphics;
  private readonly container: Container;
  private readonly particles: Particle[];
  private readonly color: number;
  private readonly friction = 0.96;

  constructor(
    container: Container,
    origin: { x: number; y: number },
    count: number,
    color: number,
    speed = 3,
    lifetime = 0.8
  ) {
    this.lifetime = lifetime;
    this.color = color;
    this.container = container;
    this.gfx = new Graphics();
    this.container.addChild(this.gfx);

    // Spawn particles with random outward velocities
    this.particles = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.4 + Math.random() * 0.6);
      const size = 2 + Math.random() * 3;
      this.particles.push({
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size,
        alpha: 1,
      });
    }
  }

  update(dt: number): boolean {
    if (!this.alive) return false;
    this.timer += dt;
    if (this.timer >= this.lifetime) {
      this.alive = false;
      this.cleanup();
      return false;
    }

    const progress = this.timer / this.lifetime;
    const globalAlpha = 1 - progress;

    this.gfx.clear();
    for (const p of this.particles) {
      // Apply velocity with friction
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vx *= this.friction;
      p.vy *= this.friction;
      p.alpha = globalAlpha;

      const half = p.size * 0.5;
      this.gfx.rect(p.x - half, p.y - half, p.size, p.size)
        .fill({ color: this.color, alpha: p.alpha });
    }

    return true;
  }

  dispose(_container?: Container): void {
    this.alive = false;
    this.cleanup();
  }

  private cleanup(): void {
    this.gfx.clear();
    if (this.gfx.parent) {
      this.gfx.parent.removeChild(this.gfx);
    }
    this.gfx.destroy();
  }

  get isAlive(): boolean {
    return this.alive;
  }
}

export class RippleEffect {
  private alive = true;
  private timer = 0;
  private readonly lifetime: number;
  private readonly gfx: Graphics;
  private readonly container: Container;
  private readonly origin: { x: number; y: number };
  private readonly ringCount: number;
  private readonly maxRadius: number;
  private readonly color: number;
  private readonly loop: boolean;

  constructor(
    container: Container,
    origin: { x: number; y: number },
    ringCount = 3,
    maxRadius = 2.5,
    lifetime = 1.2,
    color = 0x44ddff,
    loop = false
  ) {
    this.lifetime = lifetime;
    this.container = container;
    this.origin = { x: origin.x, y: origin.y };
    this.ringCount = ringCount;
    // Scale maxRadius to pixel units (the original used world units)
    this.maxRadius = maxRadius * 20;
    this.color = color;
    this.loop = loop;

    this.gfx = new Graphics();
    this.container.addChild(this.gfx);
  }

  update(dt: number): boolean {
    if (!this.alive) return false;
    this.timer += dt;

    if (this.timer >= this.lifetime) {
      if (this.loop) {
        this.timer = this.timer % this.lifetime;
      } else {
        this.alive = false;
        this.cleanup();
        return false;
      }
    }

    const progress = this.timer / this.lifetime;

    this.gfx.clear();
    for (let i = 0; i < this.ringCount; i++) {
      // Stagger each ring so they expand in sequence
      const ringOffset = i / this.ringCount;
      const ringProgress = Math.min(1, Math.max(0, (progress - ringOffset * 0.3) / (1 - ringOffset * 0.3)));

      if (ringProgress <= 0) continue;

      const radius = ringProgress * this.maxRadius;
      const alpha = (1 - ringProgress) * 0.8;

      if (alpha <= 0.01) continue;

      this.gfx.circle(this.origin.x, this.origin.y, radius)
        .stroke({ color: this.color, alpha, width: 2 - ringProgress });
    }

    return true;
  }

  dispose(): void {
    this.alive = false;
    this.cleanup();
  }

  private cleanup(): void {
    this.gfx.clear();
    if (this.gfx.parent) {
      this.gfx.parent.removeChild(this.gfx);
    }
    this.gfx.destroy();
  }

  get isAlive(): boolean {
    return this.alive;
  }
}

/**
 * Blue/white water splash — droplets flying upward and outward.
 */
export function spawnSplash(
  container: Container,
  position: { x: number; y: number },
  color = 0x88ccff,
  count = 15
): ParticleBurst {
  return new ParticleBurst(container, position, count, color, 2.5, 0.7);
}

/**
 * Cyan rings expanding on water surface.
 */
export function spawnRipple(
  container: Container,
  position: { x: number; y: number },
  color = 0x44ddff,
  aggressive = false
): RippleEffect {
  return new RippleEffect(container, position, 3, aggressive ? 3.5 : 2.0, aggressive ? 0.9 : 1.4, color);
}

/**
 * Golden sparkle burst — celebration particles flying outward.
 */
export function spawnCatchCelebration(
  container: Container,
  position: { x: number; y: number }
): ParticleBurst {
  return new ParticleBurst(container, position, 30, 0xffd700, 4, 1.2);
}
