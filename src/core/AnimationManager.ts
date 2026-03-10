/**
 * AnimationManager — manages canvas-drawn sprite sheet animations using PixiJS.
 * Creates animated pirate character sprites for idle, walk, and fish states.
 * Each sprite is 32x32, drawn programmatically, 3 frames per animation.
 */

import { Texture, AnimatedSprite, Rectangle } from 'pixi.js';

export type AnimationState = 'idle' | 'walk' | 'fish';

/** Draw a single character animation frame onto a canvas. */
function drawCharFrame(
  ctx: CanvasRenderingContext2D,
  frame: number,
  state: AnimationState
): void {
  ctx.clearRect(0, 0, 32, 32);

  // Pixel offsets based on state and frame for animation
  const bodyBob = (state === 'idle' && frame === 1) ? 1 : 0;
  const legL = (state === 'walk') ? (frame === 0 ? -2 : frame === 1 ? 2 : 0) : 0;
  const legR = -legL;
  const armL = (state === 'fish') ? (frame === 0 ? -3 : -4) : 0;
  const rodAngle = (state === 'fish') ? (frame === 0 ? 0 : 1) : 0;

  const baseY = 12 + bodyBob;

  // === HAT ===
  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(8, baseY - 12, 16, 8);   // brim
  ctx.fillRect(10, baseY - 20, 12, 10); // crown
  // Hat band
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(10, baseY - 12, 12, 2);

  // === HEAD ===
  ctx.fillStyle = '#F5CBA7';
  ctx.fillRect(10, baseY - 10, 12, 10);
  // Eye (right side)
  ctx.fillStyle = '#2244AA';
  ctx.fillRect(18, baseY - 7, 2, 2);
  // Eye patch (left)
  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(12, baseY - 7, 4, 3);

  // === BODY ===
  ctx.fillStyle = '#1E3A7A'; // blue pirate shirt
  ctx.fillRect(10, baseY, 12, 10);

  // === LEFT ARM (rod-holding arm in fish state) ===
  ctx.fillStyle = '#1E3A7A';
  if (state === 'fish') {
    ctx.fillRect(4, baseY + armL, 6, 8);
  } else {
    ctx.fillRect(6, baseY + 2, 4, 7);
  }

  // === RIGHT ARM ===
  ctx.fillStyle = '#1E3A7A';
  ctx.fillRect(22, baseY + 2, 4, 7);

  // === LEGS ===
  ctx.fillStyle = '#3A2010';
  ctx.fillRect(12, baseY + 10, 4, 8 + legL); // left leg
  ctx.fillRect(16, baseY + 10, 4, 8 + legR); // right leg
  // Boots
  ctx.fillStyle = '#1A0E06';
  ctx.fillRect(11, baseY + 18 + legL, 5, 3);
  ctx.fillRect(16, baseY + 18 + legR, 5, 3);

  // === FISHING ROD (in fish state) ===
  if (state === 'fish') {
    ctx.fillStyle = '#8B4513';
    // Rod extends upper-left from left hand
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(3 - i, baseY - 2 - i - rodAngle, 2, 2);
    }
    // Line droop
    ctx.fillStyle = 'rgba(200,200,200,0.7)';
    ctx.fillRect(0, baseY + 2, 1, 8);
  }
}

/** Generate a sprite sheet canvas with 3 frames side-by-side (96x32). */
function generateSpriteSheet(state: AnimationState): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  for (let f = 0; f < 3; f++) {
    ctx.save();
    ctx.translate(f * 32, 0);
    drawCharFrame(ctx, f, state);
    ctx.restore();
  }
  return canvas;
}

/** Cache for generated textures to avoid recomputing each session. */
const textureCache: Partial<Record<AnimationState, Texture[]>> = {};

/** Get PIXI Textures for a given animation state (cached). */
export function getAnimationTextures(state: AnimationState): Texture[] {
  if (textureCache[state]) return textureCache[state]!;

  const sheet = generateSpriteSheet(state);
  const baseTexture = Texture.from(sheet);

  const textures = [0, 1, 2].map(f =>
    new Texture({
      source: baseTexture.source,
      frame: new Rectangle(f * 32, 0, 32, 32),
    })
  );

  textureCache[state] = textures;
  return textures;
}

/** Create an AnimatedSprite for a given state with appropriate FPS. */
export function createCharSprite(state: AnimationState): AnimatedSprite {
  const textures = getAnimationTextures(state);
  const sprite = new AnimatedSprite(textures);
  sprite.animationSpeed = state === 'walk' ? 8 / 60 : 4 / 60;
  sprite.play();
  sprite.scale.set(2); // scale up 2x for visibility
  sprite.anchor.set(0.5, 1.0); // anchor at feet
  return sprite;
}

/** Switch a sprite's animation state. Reuses textures from cache. */
export function setCharAnimation(sprite: AnimatedSprite, state: AnimationState): void {
  sprite.textures = getAnimationTextures(state);
  sprite.animationSpeed = state === 'walk' ? 8 / 60 : 4 / 60;
  sprite.play();
}
