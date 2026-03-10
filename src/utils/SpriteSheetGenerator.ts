/**
 * SpriteSheetGenerator — canvas-drawn pixel art for ships and islands.
 * Returns Texture objects via Texture.from(canvas) for use as PIXI.Sprite sources.
 * All sprites drawn at integer coordinates for crisp pixel art.
 */

import { Assets, Texture } from 'pixi.js';

function cssHex(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0');
}

// ── Ship sprites (32×32, top-down) ──────────────────────────────────

function drawShipBase(ctx: CanvasRenderingContext2D, hullColor: string, deckColor: string, sailColor: string): void {
  // Hull body (pointed bow at right)
  ctx.fillStyle = hullColor;
  // Main hull rect
  ctx.fillRect(4, 10, 22, 12);
  // Bow point
  ctx.fillRect(26, 12, 2, 8);
  ctx.fillRect(28, 13, 2, 6);
  ctx.fillRect(30, 14, 1, 4);
  // Stern (rounded)
  ctx.fillRect(2, 11, 2, 10);
  ctx.fillRect(3, 10, 1, 12);

  // Outline
  ctx.fillStyle = '#000000';
  ctx.fillRect(4, 9, 22, 1);   // top edge
  ctx.fillRect(4, 22, 22, 1);  // bottom edge
  ctx.fillRect(3, 10, 1, 12);  // left
  ctx.fillRect(26, 11, 1, 1);  // bow top
  ctx.fillRect(28, 12, 1, 1);
  ctx.fillRect(30, 13, 1, 1);
  ctx.fillRect(31, 14, 1, 4);  // bow tip
  ctx.fillRect(30, 18, 1, 1);
  ctx.fillRect(28, 19, 1, 1);
  ctx.fillRect(26, 20, 1, 1);

  // Deck planks
  ctx.fillStyle = deckColor;
  ctx.fillRect(6, 12, 18, 8);

  // Plank lines
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000000';
  ctx.fillRect(6, 14, 18, 1);
  ctx.fillRect(6, 17, 18, 1);
  ctx.globalAlpha = 1;

  // Mast
  ctx.fillStyle = '#5C3A1E';
  ctx.fillRect(15, 6, 2, 20);

  // Sail
  ctx.fillStyle = sailColor;
  ctx.fillRect(10, 8, 12, 16);
  ctx.globalAlpha = 0.9;
  ctx.fillRect(10, 8, 12, 16);
  ctx.globalAlpha = 1;
}

export function generatePlayerShipTexture(): Texture {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 32;
  const ctx = c.getContext('2d')!;

  drawShipBase(ctx, '#FFD700', '#DAA520', '#FFFAE0');

  // Gold trim
  ctx.fillStyle = '#FFA500';
  ctx.fillRect(5, 10, 20, 1);
  ctx.fillRect(5, 21, 20, 1);

  // Flag at stern
  ctx.fillStyle = '#FF4444';
  ctx.fillRect(4, 4, 6, 4);
  ctx.fillStyle = '#CC2222';
  ctx.fillRect(4, 6, 6, 1);

  return Texture.from({ resource: c, scaleMode: 'nearest' });
}

export function generateEnemyShipTexture(hullHex: number): Texture {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 32;
  const ctx = c.getContext('2d')!;

  drawShipBase(ctx, cssHex(hullHex), '#1A0E08', '#0A0A0A');

  // Red trim stripe
  ctx.fillStyle = '#8B1A1A';
  ctx.fillRect(6, 15, 18, 2);

  // Skull emblem on sail
  // Skull dome
  ctx.fillStyle = '#CCCCCC';
  ctx.fillRect(14, 10, 4, 3);
  ctx.fillRect(13, 11, 6, 2);
  // Eye sockets
  ctx.fillStyle = '#000000';
  ctx.fillRect(14, 11, 1, 1);
  ctx.fillRect(17, 11, 1, 1);
  // Jaw
  ctx.fillStyle = '#CCCCCC';
  ctx.fillRect(14, 13, 4, 2);
  // Teeth
  ctx.fillStyle = '#000000';
  ctx.fillRect(15, 14, 1, 1);
  ctx.fillRect(17, 14, 1, 1);

  // Crossbones
  ctx.fillStyle = '#CCCCCC';
  ctx.fillRect(12, 16, 1, 1);
  ctx.fillRect(13, 17, 1, 1);
  ctx.fillRect(18, 17, 1, 1);
  ctx.fillRect(19, 16, 1, 1);
  ctx.fillRect(12, 18, 1, 1);
  ctx.fillRect(19, 18, 1, 1);

  // Black flag at stern
  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(4, 3, 6, 4);
  // Tiny skull on flag
  ctx.fillStyle = '#CCCCCC';
  ctx.fillRect(6, 4, 2, 2);

  return Texture.from({ resource: c, scaleMode: 'nearest' });
}

// ── Island sprites (64×64, top-down) ────────────────────────────────

function drawIslandBase(ctx: CanvasRenderingContext2D, baseColor: string, shoreColor: string, radius: number): void {
  const cx = 32, cy = 32;
  // Main island body (filled circle approximation via rounded rect)
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Shore ring (slightly smaller)
  ctx.fillStyle = shoreColor;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawDock(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(x, y, 8, 18);
  // Plank lines
  ctx.fillStyle = '#5C3A1E';
  ctx.fillRect(x, y + 4, 8, 1);
  ctx.fillRect(x, y + 9, 8, 1);
  ctx.fillRect(x, y + 14, 8, 1);
  // Posts
  ctx.fillStyle = '#6B4020';
  ctx.fillRect(x - 1, y, 1, 18);
  ctx.fillRect(x + 8, y, 1, 18);
}

function drawPalmTree(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  // Trunk
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(x, y, 2, 10);
  // Fronds
  ctx.fillStyle = '#27AE60';
  ctx.fillRect(x - 4, y - 2, 10, 3);
  ctx.fillRect(x - 3, y - 4, 8, 2);
  ctx.fillRect(x - 1, y - 5, 4, 2);
}

export function generateIslandTexture(biome: string): Texture {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d')!;

  switch (biome) {
    case 'tropical': {
      drawIslandBase(ctx, '#E8B86D', '#F4C87A', 22);
      drawPalmTree(ctx, 22, 18);
      drawPalmTree(ctx, 38, 20);
      drawPalmTree(ctx, 30, 14);
      drawDock(ctx, 28, 46);
      break;
    }
    case 'volcanic': {
      drawIslandBase(ctx, '#3D2B1F', '#5C3A2E', 24);
      // Volcano cone
      ctx.fillStyle = '#2A1A10';
      ctx.beginPath();
      ctx.moveTo(22, 38); ctx.lineTo(32, 12); ctx.lineTo(42, 38);
      ctx.fill();
      // Lava glow at peak
      ctx.fillStyle = '#FF4400';
      ctx.fillRect(30, 14, 4, 3);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#FF6600';
      ctx.fillRect(28, 16, 8, 2);
      ctx.globalAlpha = 1;
      // Smoke puffs
      ctx.fillStyle = '#666666';
      ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.arc(32, 10, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(34, 7, 2, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      drawDock(ctx, 28, 50);
      break;
    }
    case 'coral': {
      drawIslandBase(ctx, '#F0A090', '#FFB8A8', 20);
      // Coral reef rings around island
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(20, 28, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#FF9B9B';
      ctx.beginPath(); ctx.arc(42, 34, 6, 0, Math.PI * 2); ctx.stroke();
      // Small fish silhouettes
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(14, 30, 3, 1); ctx.fillRect(16, 29, 1, 1); // tail
      ctx.fillRect(44, 38, 3, 1); ctx.fillRect(46, 37, 1, 1);
      drawDock(ctx, 28, 46);
      break;
    }
    case 'storm': {
      drawIslandBase(ctx, '#4A5A6A', '#5D6D7E', 22);
      // Dark clouds overhead
      ctx.fillStyle = '#3A4A5A';
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.arc(26, 20, 10, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(38, 22, 8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(32, 18, 7, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      // Lightning bolt
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(30, 26, 1, 3);
      ctx.fillRect(31, 29, 1, 2);
      ctx.fillRect(30, 31, 1, 3);
      drawDock(ctx, 28, 48);
      break;
    }
    case 'harbor': {
      drawIslandBase(ctx, '#C4854A', '#D4955A', 26);
      // Market tent 1 (blue roof)
      ctx.fillStyle = '#3A7FBD';
      ctx.beginPath(); ctx.moveTo(18, 24); ctx.lineTo(24, 18); ctx.lineTo(30, 24); ctx.fill();
      ctx.fillStyle = '#C4854A';
      ctx.fillRect(20, 24, 8, 6);
      // Market tent 2 (red roof)
      ctx.fillStyle = '#CC4444';
      ctx.beginPath(); ctx.moveTo(34, 22); ctx.lineTo(39, 16); ctx.lineTo(44, 22); ctx.fill();
      ctx.fillStyle = '#C4854A';
      ctx.fillRect(35, 22, 8, 6);
      // Crates
      ctx.fillStyle = '#8B5E3C';
      ctx.fillRect(26, 32, 4, 3);
      ctx.fillRect(31, 31, 3, 4);
      drawDock(ctx, 28, 50);
      break;
    }
    case 'abyss': {
      drawIslandBase(ctx, '#1A1A2E', '#2A2040', 24);
      // Tall dark spires
      ctx.fillStyle = '#0A0A1E';
      ctx.beginPath(); ctx.moveTo(22, 40); ctx.lineTo(26, 8); ctx.lineTo(30, 40); ctx.fill();
      ctx.beginPath(); ctx.moveTo(34, 40); ctx.lineTo(38, 6); ctx.lineTo(42, 40); ctx.fill();
      // Purple glow at base
      ctx.fillStyle = '#4B0082';
      ctx.globalAlpha = 0.3;
      ctx.beginPath(); ctx.arc(32, 40, 14, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      // Purple flag on tallest spire
      ctx.fillStyle = '#4B0082';
      ctx.fillRect(38, 4, 6, 4);
      ctx.fillStyle = '#6B20A2';
      ctx.fillRect(38, 5, 6, 1);
      drawDock(ctx, 28, 52);
      break;
    }
  }

  return Texture.from({ resource: c, scaleMode: 'nearest' });
}

// ── Texture cache ───────────────────────────────────────────────────

const textureCache = new Map<string, Texture>();

// Map ship keys to preloaded PNG asset paths
const SHIP_PNG_MAP: Record<string, string> = {
  'player':       'sprites/ship-sun.png',
  'enemy-red':    'sprites/ship-skull.png',
  'enemy-purple': 'sprites/ship-blue.png',
  'enemy-black':  'sprites/ship-anchor.png',
};

export function getShipTexture(key: 'player' | 'enemy-red' | 'enemy-purple' | 'enemy-black'): Texture {
  if (textureCache.has(key)) return textureCache.get(key)!;

  // Try preloaded PNG first, fall back to canvas-drawn
  const pngPath = SHIP_PNG_MAP[key];
  const pngTex = pngPath ? Assets.get(pngPath) : null;
  if (pngTex) {
    textureCache.set(key, pngTex);
    return pngTex;
  }

  let tex: Texture;
  switch (key) {
    case 'player':       tex = generatePlayerShipTexture(); break;
    case 'enemy-red':    tex = generateEnemyShipTexture(0xDC143C); break;
    case 'enemy-purple': tex = generateEnemyShipTexture(0x4B0082); break;
    case 'enemy-black':  tex = generateEnemyShipTexture(0x1A0E08); break;
  }
  textureCache.set(key, tex);
  return tex;
}

export function getIslandTexture(biome: string): Texture {
  const key = `island-${biome}`;
  if (textureCache.has(key)) return textureCache.get(key)!;
  const tex = generateIslandTexture(biome);
  textureCache.set(key, tex);
  return tex;
}
