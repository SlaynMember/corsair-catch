/**
 * FishSpriteGenerator — canvas-based 32x32 pixel art fish sprite generator.
 * Generates type-colored elemental fish with body, eye, fins, and type effects.
 * Returns 3-frame animation canvases for swimming animation.
 */

import { FishType } from '../data/fish-db';

interface TypeColors {
  body: number;
  fins: number;
  effects: number;
}

const TYPE_COLORS: Record<string, TypeColors> = {
  [FishType.FIRE]:     { body: 0xE8521A, fins: 0xC23E0E, effects: 0xFF9B3D },
  [FishType.WATER]:    { body: 0x2E86DE, fins: 0x1A6BAD, effects: 0x8ED6FF },
  [FishType.ELECTRIC]: { body: 0xFFD700, fins: 0xD4A800, effects: 0xFFF87A },
  [FishType.NATURE]:   { body: 0x27AE60, fins: 0x1E8449, effects: 0x7FFFD4 },
  [FishType.ABYSSAL]:  { body: 0x6C3483, fins: 0x4A235A, effects: 0xD7BDE2 },
  [FishType.STORM]:    { body: 0x5D6D7E, fins: 0x4A5A6A, effects: 0xE8EAF6 },
  [FishType.NORMAL]:   { body: 0xD4AC0D, fins: 0xB7950B, effects: 0xFAD7A0 },
};

function hexToRgb(hex: number): [number, number, number] {
  return [(hex >> 16) & 0xFF, (hex >> 8) & 0xFF, hex & 0xFF];
}

function cssColor(hex: number, alpha = 1): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Draw a single 32x32 fish sprite frame.
 * @param type Fish type (determines color palette)
 * @param frame Animation frame 0-2
 * @param colorOverride Optional hex color to override body color
 */
export function drawFishFrame(
  ctx: CanvasRenderingContext2D,
  type: string,
  frame: 0 | 1 | 2,
  colorOverride?: string
): void {
  const colors = TYPE_COLORS[type] ?? TYPE_COLORS[FishType.NORMAL];
  const bodyColor = colorOverride ?? cssColor(colors.body);
  const finColor = cssColor(colors.fins);
  const effectColor = cssColor(colors.effects, 0.7);

  ctx.clearRect(0, 0, 32, 32);

  // === BODY ===
  // Base fish body (elongated ellipse via rectangles)
  ctx.fillStyle = bodyColor;
  // Main body
  ctx.fillRect(6, 12, 18, 8);
  ctx.fillRect(8, 10, 14, 12);
  ctx.fillRect(10, 9, 10, 14);
  ctx.fillRect(12, 8, 6, 16);

  // Body wiggle per frame
  const tailOffset = frame === 1 ? -1 : frame === 2 ? 1 : 0;

  // === TAIL FIN ===
  ctx.fillStyle = finColor;
  ctx.fillRect(4 + tailOffset, 10, 4, 4);  // top tail lobe
  ctx.fillRect(4 + tailOffset, 18, 4, 4);  // bottom tail lobe
  ctx.fillRect(6 + tailOffset, 14, 2, 4);  // center connection

  // === DORSAL FIN (top) ===
  ctx.fillStyle = finColor;
  ctx.fillRect(12, 6, 2, 4);
  ctx.fillRect(14, 5, 2, 5);
  ctx.fillRect(16, 6, 2, 4);
  ctx.fillRect(18, 7, 2, 3);

  // === PECTORAL FIN (side) ===
  ctx.fillStyle = finColor;
  ctx.fillRect(14, 18, 4, 2);
  ctx.fillRect(15, 20, 2, 2);

  // === EYE ===
  // 2x2 white
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(20, 12, 2, 2);
  // 1x1 black pupil
  ctx.fillStyle = '#000000';
  ctx.fillRect(21, 12, 1, 1);

  // === TYPE EFFECT PARTICLES ===
  ctx.fillStyle = effectColor;
  drawTypeEffects(ctx, type, frame, effectColor);
}

function drawTypeEffects(
  ctx: CanvasRenderingContext2D,
  type: string,
  frame: 0 | 1 | 2,
  effectColor: string
): void {
  const phase = frame * 2;

  switch (type) {
    case FishType.FIRE:
      // Flame flickers on tail
      ctx.fillRect(2 + phase % 2, 11 - phase % 2, 2, 3);
      ctx.fillRect(1, 17, 2, 2);
      ctx.fillRect(3, 13, 1, 2);
      break;
    case FishType.ELECTRIC:
      // Zigzag sparks
      ctx.fillRect(2, 10 + phase % 3, 1, 1);
      ctx.fillRect(3, 12, 1, 1);
      ctx.fillRect(2, 14, 1, 1);
      ctx.fillRect(1, 16 + phase % 2, 1, 1);
      break;
    case FishType.WATER:
      // Bubble dots
      ctx.fillRect(2, 9, 2, 2);
      ctx.fillRect(0, 14, 2, 2);
      ctx.fillRect(2, 19, 2, 2);
      ctx.fillRect(24 + phase % 2, 8, 2, 2);
      break;
    case FishType.NATURE:
      // Leaf-shaped pixels on back
      ctx.fillRect(14, 4, 1, 2);
      ctx.fillRect(16, 3, 2, 1);
      ctx.fillRect(12, 3, 1, 2);
      ctx.fillRect(20, 4, 1, 2);
      break;
    case FishType.ABYSSAL:
      // Dark particle cloud
      ctx.fillRect(1, 11, 1, 1);
      ctx.fillRect(0, 14 + phase % 2, 2, 1);
      ctx.fillRect(1, 17, 1, 2);
      ctx.fillRect(24, 11 + phase % 3, 1, 1);
      ctx.fillRect(25, 15, 1, 1);
      break;
    case FishType.STORM:
      // Cloud puffs
      ctx.fillRect(1, 10, 3, 2);
      ctx.fillRect(0, 12, 2, 2);
      ctx.fillRect(1, 17 + phase % 2, 3, 2);
      break;
    default: // NORMAL — subtle shimmer
      ctx.fillRect(24, 10 + phase % 2, 1, 1);
      ctx.fillRect(25, 14, 1, 1);
      break;
  }
}

/** Generate all 3 animation frames for a fish sprite. Returns array of canvases. */
export function generateFishSprite(type: string, colorOverride?: string): HTMLCanvasElement[] {
  return ([0, 1, 2] as const).map(frame => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    drawFishFrame(ctx, type, frame, colorOverride);
    return canvas;
  });
}

/**
 * Generate a fish sprite as a data URL (for use as img src or PIXI texture).
 * Returns frame 0 as a data URL.
 */
export function fishSpriteDataUrl(type: string, colorOverride?: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  drawFishFrame(ctx, type, 0, colorOverride);
  return canvas.toDataURL();
}

/**
 * Get the type colors for a fish type.
 */
export function getTypeColors(type: string): TypeColors {
  return TYPE_COLORS[type] ?? TYPE_COLORS[FishType.NORMAL];
}
