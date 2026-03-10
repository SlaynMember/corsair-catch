import { Application, Container, Graphics, TextureSource } from 'pixi.js';

export interface PixiContext {
  app: Application;
  backgroundLayer: Container;
  oceanLayer: Container;
  worldLayer: Container;
  fxLayer: Container;
  uiLayer: Container;
}

let ctx: PixiContext | null = null;

export async function createPixiContext(canvas: HTMLCanvasElement): Promise<PixiContext> {
  // Pixel-perfect scaling — no blurry sprites
  TextureSource.defaultOptions.scaleMode = 'nearest';

  const app = new Application();

  await app.init({
    canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    resolution: 1,
    antialias: false,
    backgroundColor: 0x0a1628,
    autoDensity: true,
  });

  // 5-layer stack (bottom to top)
  const backgroundLayer = new Container();
  const oceanLayer = new Container();
  const worldLayer = new Container();
  const fxLayer = new Container();
  const uiLayer = new Container();

  app.stage.addChild(backgroundLayer);
  app.stage.addChild(oceanLayer);
  app.stage.addChild(worldLayer);
  app.stage.addChild(fxLayer);
  app.stage.addChild(uiLayer);

  // Draw initial sky gradient background
  drawSkyGradient(backgroundLayer, window.innerWidth, window.innerHeight);

  // Resize handler
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    app.renderer.resize(w, h);
    drawSkyGradient(backgroundLayer, w, h);
  });

  ctx = { app, backgroundLayer, oceanLayer, worldLayer, fxLayer, uiLayer };
  return ctx;
}

export function getPixiContext(): PixiContext {
  if (!ctx) throw new Error('PixiContext not initialized');
  return ctx;
}

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xFF, ag = (a >> 8) & 0xFF, ab = a & 0xFF;
  const br = (b >> 16) & 0xFF, bg = (b >> 8) & 0xFF, bb = b & 0xFF;
  const r = Math.round(ar + (br - ar) * t);
  const g2 = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g2 << 8) | bl;
}

// Multi-stage sunset color stops
const SKY_STOPS: [number, number][] = [
  [0.0, 0xE07856],   // Deep coral at top
  [0.25, 0xEA8A60],  // Warm coral-orange
  [0.45, 0xF4A76D],  // Soft orange
  [0.65, 0xFFCA80],  // Golden peach
  [0.80, 0xFFD890],  // Pale gold
  [0.90, 0xFFE8B8],  // Warm cream
  [1.0, 0xFFF5E8],   // Pale cream at horizon
];

function getSkyColor(t: number): number {
  for (let i = 1; i < SKY_STOPS.length; i++) {
    if (t <= SKY_STOPS[i][0]) {
      const prev = SKY_STOPS[i - 1];
      const curr = SKY_STOPS[i];
      const localT = (t - prev[0]) / (curr[0] - prev[0]);
      return lerpColor(prev[1], curr[1], localT);
    }
  }
  return SKY_STOPS[SKY_STOPS.length - 1][1];
}

function drawSkyGradient(layer: Container, w: number, h: number): void {
  layer.removeChildren();
  const g = new Graphics();

  // 120-step smooth gradient — no visible banding
  const steps = 120;
  const bandH = Math.ceil(h / steps) + 1;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const color = getSkyColor(t);
    g.rect(0, i * bandH, w, bandH).fill({ color });
  }
  layer.addChild(g);

  // Simple cloud shapes
  drawClouds(layer, w, h);
}

function drawClouds(layer: Container, w: number, h: number): void {
  const cg = new Graphics();

  // 3 cloud clusters at different heights
  const clouds = [
    { cx: w * 0.2, cy: h * 0.12, scale: 1.0 },
    { cx: w * 0.6, cy: h * 0.08, scale: 0.7 },
    { cx: w * 0.85, cy: h * 0.18, scale: 0.85 },
  ];

  for (const cloud of clouds) {
    const s = cloud.scale;
    // Cloud body (off-white with peachy shadow)
    // Bottom shadow
    cg.ellipse(cloud.cx, cloud.cy + 6 * s, 60 * s, 14 * s).fill({ color: 0xE8A090, alpha: 0.25 });
    // Main body
    cg.ellipse(cloud.cx, cloud.cy, 55 * s, 16 * s).fill({ color: 0xF5F0E8, alpha: 0.35 });
    cg.ellipse(cloud.cx - 25 * s, cloud.cy + 2 * s, 35 * s, 12 * s).fill({ color: 0xF5F0E8, alpha: 0.3 });
    cg.ellipse(cloud.cx + 30 * s, cloud.cy + 3 * s, 30 * s, 10 * s).fill({ color: 0xF5F0E8, alpha: 0.28 });
    // Top highlight
    cg.ellipse(cloud.cx - 10 * s, cloud.cy - 4 * s, 30 * s, 8 * s).fill({ color: 0xFFFFFF, alpha: 0.2 });
  }

  layer.addChild(cg);
}
