/**
 * UIFactory — reusable procedural UI primitives for Corsair Catch.
 *
 * Extracts the repeated "wooden frame / parchment" patterns used across
 * BeachScene, BattleScene, SailingScene, etc. into composable helpers.
 * No new assets required — these build the same layered rectangles that
 * already exist in-line, just without the copy-paste.
 */
import Phaser from 'phaser';
import MobileInput from '../systems/MobileInput';

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
export const UI = {
  WOOD_DARK:  0x5a3a1a,
  WOOD_MED:   0x8b6b4d,
  PARCHMENT:  0xf0e8d8,
  GOLD:       0xffe066,
  TEXT_DARK:  0x2c1011,
  OCEAN:      0x2dafb8,
  BLACK:      0x000000,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TEXT STYLE PRESETS
// ═══════════════════════════════════════════════════════════════════════════════
export const TEXT = {
  title(overrides?: Partial<Phaser.Types.GameObjects.Text.TextStyle>): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'PixelPirate, monospace',
      fontSize: '30px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 4,
      ...overrides,
    };
  },
  body(overrides?: Partial<Phaser.Types.GameObjects.Text.TextStyle>): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '18px',
      color: '#2c1011',
      ...overrides,
    };
  },
  hint(overrides?: Partial<Phaser.Types.GameObjects.Text.TextStyle>): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '14px',
      color: '#f0e8d8',
      stroke: '#2c1011',
      strokeThickness: 2,
      ...overrides,
    };
  },
  label(overrides?: Partial<Phaser.Types.GameObjects.Text.TextStyle>): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      ...overrides,
    };
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// WOOD PANEL — the triple-border frame used everywhere
// ═══════════════════════════════════════════════════════════════════════════════
export interface WoodPanelOpts {
  borderColor?: number;   // inner border color (default WOOD_MED)
  bgColor?: number;       // background fill (default PARCHMENT)
  depth?: number;
  outerPad?: number;      // outer border expansion (default 8)
  innerPad?: number;      // inner border expansion (default 2)
  bgStroke?: number;      // optional stroke on bg rectangle
  bgStrokeWidth?: number;
}

export interface WoodPanelResult {
  container: Phaser.GameObjects.Container;
  outer: Phaser.GameObjects.Rectangle;
  inner: Phaser.GameObjects.Rectangle;
  bg: Phaser.GameObjects.Rectangle;
}

export function createWoodPanel(
  scene: Phaser.Scene,
  x: number, y: number,
  w: number, h: number,
  opts?: WoodPanelOpts,
): WoodPanelResult {
  const op = opts?.outerPad ?? 8;
  const ip = opts?.innerPad ?? 2;
  const outer = scene.add.rectangle(0, 0, w + op, h + op, UI.WOOD_DARK);
  const inner = scene.add.rectangle(0, 0, w + ip, h + ip, opts?.borderColor ?? UI.WOOD_MED);
  const bg    = scene.add.rectangle(0, 0, w, h, opts?.bgColor ?? UI.PARCHMENT);
  if (opts?.bgStroke !== undefined) {
    bg.setStrokeStyle(opts.bgStrokeWidth ?? 2, opts.bgStroke);
  }
  const container = scene.add.container(x, y, [outer, inner, bg]);
  if (opts?.depth !== undefined) container.setDepth(opts.depth);
  return { container, outer, inner, bg };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DARK OVERLAY — full-screen dim behind menus
// ═══════════════════════════════════════════════════════════════════════════════
export function createOverlay(
  scene: Phaser.Scene,
  alpha = 0.55,
): Phaser.GameObjects.Rectangle {
  const cam = scene.cameras.main;
  return scene.add.rectangle(0, 0, cam.width * 2, cam.height * 2, UI.BLACK, alpha);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORNER RIVETS — gold/dark dots at panel corners
// ═══════════════════════════════════════════════════════════════════════════════
export function addCornerRivets(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  w: number, h: number,
  opts?: { radius?: number; color?: number; alpha?: number; inset?: number },
): Phaser.GameObjects.Arc[] {
  const r     = opts?.radius ?? 5;
  const c     = opts?.color  ?? UI.WOOD_DARK;
  const a     = opts?.alpha  ?? 1;
  const inset = opts?.inset  ?? 12;
  const rx = w / 2 - inset;
  const ry = h / 2 - inset;
  const rivets = [
    scene.add.circle(-rx, -ry, r, c, a),
    scene.add.circle( rx, -ry, r, c, a),
    scene.add.circle(-rx,  ry, r, c, a),
    scene.add.circle( rx,  ry, r, c, a),
  ];
  container.add(rivets);
  return rivets;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL HEADER — colored bar + divider + centered title text
// ═══════════════════════════════════════════════════════════════════════════════
export interface PanelHeaderResult {
  bar: Phaser.GameObjects.Rectangle;
  divider: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

export function addPanelHeader(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  panelW: number, panelH: number,
  title: string,
  opts?: { height?: number; fontSize?: string; barColor?: number },
): PanelHeaderResult {
  const hh = opts?.height ?? 48;
  const bar     = scene.add.rectangle(0, -panelH / 2 + hh / 2, panelW, hh, opts?.barColor ?? UI.WOOD_MED);
  const divider = scene.add.rectangle(0, -panelH / 2 + hh, panelW - 8, 2, UI.WOOD_DARK);
  const text    = scene.add.text(0, -panelH / 2 + hh / 2, title,
    TEXT.title({ fontSize: opts?.fontSize ?? '30px' }),
  ).setOrigin(0.5);
  container.add([bar, divider, text]);
  return { bar, divider, text };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL FOOTER — semi-transparent bar + centered hint text
// ═══════════════════════════════════════════════════════════════════════════════
export interface PanelFooterResult {
  bar: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

export function addPanelFooter(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  panelW: number, panelH: number,
  hint: string,
  opts?: { height?: number; barAlpha?: number },
): PanelFooterResult {
  const fh = opts?.height ?? 36;
  const bar  = scene.add.rectangle(0, panelH / 2 - fh / 2, panelW, fh, UI.WOOD_MED, opts?.barAlpha ?? 0.4);
  const text = scene.add.text(0, panelH / 2 - fh / 2, hint, {
    fontFamily: 'PokemonDP, monospace',
    fontSize: '18px',
    color: '#5a3a1a',
    stroke: '#f0e8d8',
    strokeThickness: 2,
  }).setOrigin(0.5);
  container.add([bar, text]);
  return { bar, text };
}

// ═══════════════════════════════════════════════════════════════════════════════
// WOODEN BORDER STRIPS — 4 strips along panel edges (dialogue box style)
// ═══════════════════════════════════════════════════════════════════════════════
export function addBorderStrips(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  w: number, h: number,
  opts?: { thickness?: number; color?: number },
): Phaser.GameObjects.Rectangle[] {
  const t = opts?.thickness ?? 8;
  const c = opts?.color ?? UI.WOOD_MED;
  const strips = [
    scene.add.rectangle(0, -h / 2 + t / 2, w, t, c),     // top
    scene.add.rectangle(0,  h / 2 - t / 2, w, t, c),     // bottom
    scene.add.rectangle(-w / 2 + t / 2, 0, t, h, c),     // left
    scene.add.rectangle( w / 2 - t / 2, 0, t, h, c),     // right
  ];
  container.add(strips);
  return strips;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAKE INTERACTIVE — mobile-aware hit areas with optional click handler
// ═══════════════════════════════════════════════════════════════════════════════
export function makeInteractive(
  obj: Phaser.GameObjects.Rectangle,
  opts?: {
    mobilePad?: number;    // extra padding for touch (default 10)
    hitW?: number;         // explicit hit width (default obj.width)
    hitH?: number;         // explicit hit height (default obj.height)
    onClick?: () => void;
  },
): void {
  if (MobileInput.IS_MOBILE) {
    const p  = opts?.mobilePad ?? 10;
    const bw = opts?.hitW ?? obj.width;
    const bh = opts?.hitH ?? obj.height;
    obj.setInteractive(
      new Phaser.Geom.Rectangle(-p, -p, bw + p * 2, bh + p * 2),
      Phaser.Geom.Rectangle.Contains,
    );
  } else {
    obj.setInteractive({ useHandCursor: true });
  }
  if (opts?.onClick) obj.on('pointerdown', opts.onClick);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HUD BUTTON — small wood-framed square button (bag / team style)
// ═══════════════════════════════════════════════════════════════════════════════
export interface HudButtonResult {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
}

export function createHudButton(
  scene: Phaser.Scene,
  x: number, y: number,
  size: number,
  opts?: { depth?: number; onClick?: () => void; mobilePad?: number },
): HudButtonResult {
  const container = scene.add.container(x, y);
  if (opts?.depth !== undefined) container.setDepth(opts.depth);

  const outer = scene.add.rectangle(0, 0, size + 4, size + 4, UI.WOOD_DARK);
  const inner = scene.add.rectangle(0, 0, size, size, UI.WOOD_MED);
  const bg    = scene.add.rectangle(0, 0, size - 4, size - 4, UI.PARCHMENT);
  container.add([outer, inner, bg]);

  makeInteractive(bg, { hitW: size, hitH: size, mobilePad: opts?.mobilePad ?? 10, onClick: opts?.onClick });

  return { container, bg };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FRAMED ACTION BUTTON — outer frame + colored bg + highlight + label
// (used for battle TEAM/ITEMS buttons and similar)
// ═══════════════════════════════════════════════════════════════════════════════
export interface ActionButtonResult {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  highlight: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

export function createActionButton(
  scene: Phaser.Scene,
  x: number, y: number,
  w: number, h: number,
  label: string,
  opts?: {
    depth?: number;
    bgColor?: number;
    strokeColor?: number;
    hoverStroke?: number;
    keyHint?: string;
  },
): ActionButtonResult {
  const btn = scene.add.container(x, y);
  if (opts?.depth !== undefined) btn.setDepth(opts.depth);

  const outerFrame = scene.add.rectangle(0, 0, w + 6, h + 6, UI.WOOD_DARK);
  const bg = scene.add.rectangle(0, 0, w, h, opts?.bgColor ?? 0x3d1a10);
  const strokeColor = opts?.strokeColor ?? UI.WOOD_MED;
  bg.setStrokeStyle(2, strokeColor);
  bg.setInteractive({ useHandCursor: true });

  const highlight = scene.add.rectangle(0, -(h / 2 - 3), w - 8, 6, 0xffffff, 0.08);

  const txt = scene.add.text(-4, -1, label, TEXT.title({ fontSize: '16px', color: '#f0e8d8', strokeThickness: 3 })).setOrigin(0.5);

  const parts: Phaser.GameObjects.GameObject[] = [outerFrame, bg, highlight, txt];

  if (opts?.keyHint) {
    const keyTxt = scene.add.text(w / 2 - 7, -1, `[${opts.keyHint}]`, {
      fontFamily: 'PokemonDP, monospace',
      fontSize: '11px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0.5);
    parts.push(keyTxt);
  }

  btn.add(parts);

  const hoverStroke = opts?.hoverStroke ?? UI.GOLD;
  bg.on('pointerover', () => { bg.setStrokeStyle(2, hoverStroke); highlight.setAlpha(0.20); });
  bg.on('pointerout',  () => { bg.setStrokeStyle(2, strokeColor); highlight.setAlpha(0.08); });

  return { container: btn, bg, highlight, label: txt };
}
