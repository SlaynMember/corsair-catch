import type { Container } from 'pixi.js';

/**
 * Camera2D - Follow camera for the worldLayer container.
 * Maps world coordinates (x, z) to screen by translating worldLayer.
 * zoom: scale multiplier for the worldLayer (default 1.0 = 1 world unit = 1 pixel)
 */
export class Camera2D {
  private targetX = 0;
  private targetZ = 0;
  private currentX = 0;
  private currentZ = 0;
  private screenW = 0;
  private screenH = 0;
  public zoom: number;
  public readonly lerp: number;

  constructor(zoom = 1.0, lerp = 0.1) {
    this.zoom = zoom;
    this.lerp = lerp;
    this.screenW = window.innerWidth;
    this.screenH = window.innerHeight;
    window.addEventListener('resize', () => {
      this.screenW = window.innerWidth;
      this.screenH = window.innerHeight;
    });
  }

  setTarget(x: number, z: number): void {
    this.targetX = x;
    this.targetZ = z;
  }

  update(dt: number, worldLayer: Container): void {
    const speed = Math.min(1, this.lerp * dt * 60);
    this.currentX += (this.targetX - this.currentX) * speed;
    this.currentZ += (this.targetZ - this.currentZ) * speed;

    worldLayer.scale.set(this.zoom);
    worldLayer.x = this.screenW / 2 - this.currentX * this.zoom;
    worldLayer.y = this.screenH / 2 - this.currentZ * this.zoom;
  }

  /** Convert world coords to screen coords */
  worldToScreen(worldX: number, worldZ: number): { x: number; y: number } {
    return {
      x: (worldX - this.currentX) * this.zoom + this.screenW / 2,
      y: (worldZ - this.currentZ) * this.zoom + this.screenH / 2,
    };
  }

  /** Convert screen coords to world coords */
  screenToWorld(screenX: number, screenY: number): { x: number; z: number } {
    return {
      x: (screenX - this.screenW / 2) / this.zoom + this.currentX,
      z: (screenY - this.screenH / 2) / this.zoom + this.currentZ,
    };
  }
}
