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

function drawSkyGradient(layer: Container, w: number, h: number): void {
  layer.removeChildren();
  const g = new Graphics();
  // Warm sunset gradient: coral top → peach horizon
  const steps = 20;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    // Interpolate from #FF7849 (coral) to #FFD4A8 (peach)
    const r = Math.round(0xFF + (0xFF - 0xFF) * t);
    const g2 = Math.round(0x78 + (0xD4 - 0x78) * t);
    const b = Math.round(0x49 + (0xA8 - 0x49) * t);
    const color = (r << 16) | (g2 << 8) | b;
    const bandH = Math.ceil(h / steps) + 1;
    g.rect(0, i * bandH, w, bandH).fill({ color });
  }
  layer.addChild(g);
}
