import { Sprite, Texture, Assets } from 'pixi.js';

/**
 * Manages directional sprite animation for the pirate character.
 * Loads individual frame PNGs from public/sprites/pirate/ and swaps
 * textures based on current direction + animation state.
 */

export type PirateDirection = 'south' | 'north' | 'east' | 'west';
export type PirateAnim = 'idle' | 'run' | 'pickup';

// Map game facing to sprite direction
const FACING_TO_DIR: Record<string, PirateDirection> = {
  down: 'south',
  up: 'north',
  right: 'east',
  left: 'west',
};

// Frame counts per animation
const FRAME_COUNTS: Record<PirateAnim, number> = {
  idle: 4,
  run: 4,
  pickup: 5,
};

// Directions that have idle frames (no north — we'll mirror south)
const IDLE_DIRS: PirateDirection[] = ['south', 'east', 'west'];
// Pickup only has south, east, west
const PICKUP_DIRS: PirateDirection[] = ['south', 'east', 'west'];

function framePath(anim: PirateAnim, dir: string, frameIdx: number): string {
  return `sprites/pirate/${anim}/${dir}_frame_${String(frameIdx).padStart(3, '0')}.png`;
}

function rotationPath(dir: string): string {
  return `sprites/pirate/rotations/${dir}.png`;
}

/** Collect all asset paths that need preloading */
export function getPirateAssetPaths(): string[] {
  const paths: string[] = [];

  // Rotations (all 4 cardinal)
  for (const dir of ['south', 'north', 'east', 'west']) {
    paths.push(rotationPath(dir));
  }

  // Idle frames (6 dirs available, we use 4 cardinal — fallback for missing)
  for (const dir of IDLE_DIRS) {
    for (let i = 0; i < FRAME_COUNTS.idle; i++) {
      paths.push(framePath('idle', dir, i));
    }
  }

  // Run frames (all 8 dirs available, we use 4 cardinal)
  for (const dir of ['south', 'north', 'east', 'west']) {
    for (let i = 0; i < FRAME_COUNTS.run; i++) {
      paths.push(framePath('run', dir, i));
    }
  }

  // Pickup frames (south, east, west only)
  for (const dir of PICKUP_DIRS) {
    for (let i = 0; i < FRAME_COUNTS.pickup; i++) {
      paths.push(framePath('pickup', dir, i));
    }
  }

  return paths;
}

export class PirateAnimator {
  public sprite: Sprite;

  private currentAnim: PirateAnim = 'idle';
  private currentDir: PirateDirection = 'south';
  private frameIndex = 0;
  private frameTimer = 0;
  private animSpeed = 0.18; // seconds per frame

  // Cache textures after first lookup
  private texCache = new Map<string, Texture>();

  constructor() {
    // Start with south rotation as initial texture
    const initialTex = this.getTexture(rotationPath('south'));
    this.sprite = new Sprite(initialTex);
    this.sprite.anchor.set(0.5, 1.0); // bottom-center
    // 32px source at 1:1 scale — adjust in IslandState via camera zoom
    this.sprite.scale.set(1.0);
  }

  private getTexture(path: string): Texture {
    let tex = this.texCache.get(path);
    if (tex) return tex;
    tex = Assets.get(path) as Texture | undefined ?? Texture.EMPTY;
    if (tex !== Texture.EMPTY) {
      tex.source.scaleMode = 'nearest';
      this.texCache.set(path, tex);
    }
    return tex;
  }

  /** Set which animation to play */
  setAnim(anim: PirateAnim): void {
    if (anim === this.currentAnim) return;
    this.currentAnim = anim;
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.applyFrame();
  }

  /** Set facing direction (uses game facing strings) */
  setFacing(facing: string): void {
    const dir = FACING_TO_DIR[facing] ?? 'south';
    if (dir === this.currentDir) return;
    this.currentDir = dir;
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.applyFrame();
  }

  /** Call every frame with delta time */
  update(dt: number): void {
    this.frameTimer += dt;
    const maxFrames = FRAME_COUNTS[this.currentAnim];
    if (this.frameTimer >= this.animSpeed) {
      this.frameTimer -= this.animSpeed;
      this.frameIndex = (this.frameIndex + 1) % maxFrames;
      this.applyFrame();
    }
  }

  private applyFrame(): void {
    // Determine effective direction for this anim
    // Idle: no north frames — use south rotation as fallback
    // Pickup: no north — use south
    // Run: has all 4 cardinal dirs
    let effectiveDir = this.currentDir;
    let flipX = false;

    if (this.currentAnim === 'idle') {
      if (!IDLE_DIRS.includes(this.currentDir)) {
        // north has no idle frames — use south rotation (static)
        this.sprite.texture = this.getTexture(rotationPath('north'));
        this.sprite.scale.x = Math.abs(this.sprite.scale.x);
        return;
      }
    }

    if (this.currentAnim === 'pickup') {
      if (!PICKUP_DIRS.includes(this.currentDir)) {
        // north pickup — use south facing away (static rotation)
        this.sprite.texture = this.getTexture(rotationPath('north'));
        this.sprite.scale.x = Math.abs(this.sprite.scale.x);
        return;
      }
    }

    const path = framePath(this.currentAnim, effectiveDir, this.frameIndex);
    const tex = this.getTexture(path);

    if (tex === Texture.EMPTY) {
      // Fallback to rotation static frame
      this.sprite.texture = this.getTexture(rotationPath(this.currentDir));
    } else {
      this.sprite.texture = tex;
    }

    // Handle horizontal flip (not needed — we have east + west separately)
    this.sprite.scale.x = flipX ? -Math.abs(this.sprite.scale.x) : Math.abs(this.sprite.scale.x);
  }

  destroy(): void {
    this.sprite.destroy();
    this.texCache.clear();
  }
}
