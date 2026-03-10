/** Shared UI utilities used across BattleUI, FishingUI, InventoryUI, and HUD */

export const TYPE_COLORS: Record<string, string> = {
  fire: 'var(--fire)',
  water: 'var(--water)',
  electric: 'var(--electric)',
  coral: 'var(--coral)',
  abyssal: 'var(--abyssal)',
  storm: 'var(--storm)',
  normal: 'var(--normal)',
};

export const TYPE_ICONS: Record<string, string> = {
  fire: '\u{1F525}',
  water: '\u{1F4A7}',
  electric: '\u{26A1}',
  coral: '\u{1F338}',
  abyssal: '\u{1F30C}',
  storm: '\u{1F32A}',
  normal: '\u{2B50}',
};

export function typeIcon(type: string): string {
  return TYPE_ICONS[type] ?? '\u{2B50}';
}

// Type-specific fish body shapes for visual variety
const FISH_SHAPES: Record<string, (color: string) => string> = {
  // Fire: angular, aggressive swordfish shape
  fire: (c) => `
    <polygon points="8,25 30,12 55,18 65,25 55,32 30,38" fill="${c}" opacity="0.85" stroke="${c}" stroke-width="1"/>
    <polygon points="58,25 75,15 75,35" fill="${c}" opacity="0.6"/>
    <polygon points="35,13 42,5 42,17" fill="${c}" opacity="0.5"/>
    <line x1="8" y1="25" x2="20" y2="25" stroke="${c}" stroke-width="2" opacity="0.7"/>
    <circle cx="24" cy="22" r="3" fill="#fff" opacity="0.9"/><circle cx="23" cy="22" r="1.5" fill="#111"/>`,
  // Water: round, friendly pufferfish shape
  water: (c) => `
    <ellipse cx="35" cy="25" rx="20" ry="16" fill="${c}" opacity="0.85" stroke="${c}" stroke-width="1"/>
    <polygon points="58,25 72,14 72,36" fill="${c}" opacity="0.6"/>
    <ellipse cx="35" cy="25" rx="14" ry="10" fill="${c}" opacity="0.3" stroke="#fff" stroke-width="0.5" stroke-opacity="0.2"/>
    <polygon points="28,10 34,6 36,14" fill="${c}" opacity="0.45"/>
    <polygon points="28,40 34,44 36,36" fill="${c}" opacity="0.45"/>
    <circle cx="24" cy="22" r="4" fill="#fff" opacity="0.9"/><circle cx="23" cy="22" r="2" fill="#111"/>`,
  // Electric: sleek eel shape with zigzag pattern
  electric: (c) => `
    <ellipse cx="38" cy="25" rx="26" ry="10" fill="${c}" opacity="0.85" stroke="${c}" stroke-width="1"/>
    <polygon points="64,25 76,18 76,32" fill="${c}" opacity="0.55"/>
    <polyline points="18,25 24,20 30,30 36,20 42,30 48,20 54,25" fill="none" stroke="#fff" stroke-width="1" opacity="0.2"/>
    <polygon points="32,16 38,8 40,18" fill="${c}" opacity="0.5"/>
    <circle cx="18" cy="23" r="3" fill="#fff" opacity="0.9"/><circle cx="17" cy="23" r="1.5" fill="#111"/>`,
  // Coral: seahorse-like curved shape
  coral: (c) => `
    <ellipse cx="35" cy="22" rx="16" ry="14" fill="${c}" opacity="0.85" stroke="${c}" stroke-width="1"/>
    <polygon points="52,22 68,14 65,30" fill="${c}" opacity="0.55"/>
    <polygon points="28,9 34,3 36,13" fill="${c}" opacity="0.5"/>
    <polygon points="26,35 34,43 38,33" fill="${c}" opacity="0.5"/>
    <polygon points="40,9 46,5 44,15" fill="${c}" opacity="0.4"/>
    <ellipse cx="35" cy="22" rx="10" ry="8" fill="${c}" opacity="0.2" stroke="#fff" stroke-width="0.5" stroke-opacity="0.15"/>
    <circle cx="25" cy="20" r="3.5" fill="#fff" opacity="0.9"/><circle cx="24" cy="20" r="1.8" fill="#111"/>`,
  // Abyssal: anglerfish with lure
  abyssal: (c) => `
    <ellipse cx="38" cy="26" rx="20" ry="15" fill="${c}" opacity="0.85" stroke="${c}" stroke-width="1"/>
    <polygon points="60,26 74,16 74,36" fill="${c}" opacity="0.6"/>
    <path d="M28,12 Q22,2 18,6" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.7"/>
    <circle cx="18" cy="6" r="3" fill="#fff" opacity="0.6"/><circle cx="18" cy="6" r="1.5" fill="${c}" opacity="0.8"/>
    <polygon points="22,26 30,30 22,34" fill="#fff" opacity="0.15"/>
    <circle cx="26" cy="22" r="4" fill="#fff" opacity="0.9"/><circle cx="25" cy="22" r="2.2" fill="#111"/>`,
  // Storm: flying fish with wing-fins
  storm: (c) => `
    <ellipse cx="38" cy="25" rx="22" ry="11" fill="${c}" opacity="0.85" stroke="${c}" stroke-width="1"/>
    <polygon points="62,25 76,16 76,34" fill="${c}" opacity="0.55"/>
    <polygon points="25,15 18,2 42,14" fill="${c}" opacity="0.5"/>
    <polygon points="25,35 18,48 42,36" fill="${c}" opacity="0.5"/>
    <polygon points="44,16 40,6 52,14" fill="${c}" opacity="0.35"/>
    <circle cx="24" cy="23" r="3" fill="#fff" opacity="0.9"/><circle cx="23" cy="23" r="1.5" fill="#111"/>`,
};

// Default fish shape for normal type or unknown
function defaultFishShape(c: string): string {
  return `
    <ellipse cx="35" cy="25" rx="22" ry="14" fill="${c}" opacity="0.85" stroke="${c}" stroke-width="1"/>
    <polygon points="60,25 75,12 75,38" fill="${c}" opacity="0.6"/>
    <polygon points="30,12 38,4 38,16" fill="${c}" opacity="0.45"/>
    <polygon points="30,38 38,46 38,34" fill="${c}" opacity="0.45"/>
    <circle cx="22" cy="22" r="3.5" fill="#fff" opacity="0.9"/>
    <circle cx="21" cy="22" r="1.8" fill="#111"/>`;
}

export function fishSvg(color: string, opts?: { flip?: boolean; width?: number; height?: number; margin?: string; type?: string }): string {
  const w = opts?.width ?? 80;
  const h = opts?.height ?? 50;
  const margin = opts?.margin ?? '0 auto';
  const tx = opts?.flip ? ' transform="scale(-1,1) translate(-80,0)"' : '';
  const shapeFn = opts?.type ? FISH_SHAPES[opts.type] : undefined;
  const body = shapeFn ? shapeFn(color) : defaultFishShape(color);
  return `<svg width="${w}" height="${h}" viewBox="0 0 80 50"${tx} style="filter:drop-shadow(0 0 8px ${color}80);display:block;margin:${margin};">
    ${body}
  </svg>`;
}

/** Map fish type to preloaded PNG path (only types with available PNGs) */
const FISH_PNG_MAP: Record<string, string> = {
  fire: 'sprites/fish-fire.png',
  water: 'sprites/fish-water.png',
  electric: 'sprites/fish-electric.png',
  nature: 'sprites/fish-grass.png',
  coral: 'sprites/fish-grass.png', // reuse grass sprite for coral
};

/**
 * Returns an <img> tag for the fish sprite — uses real PNG if available,
 * falls back to the procedural fishSpriteDataUrl generator.
 */
export function fishBattleImg(type: string, opts?: { flip?: boolean; size?: number; alt?: string }): string {
  const size = opts?.size ?? 64;
  const flip = opts?.flip ? 'transform:scaleX(-1);' : '';
  const alt = opts?.alt ?? 'fish';
  const pngPath = FISH_PNG_MAP[type];
  if (pngPath) {
    return `<img src="/${pngPath}" style="image-rendering:pixelated;width:${size}px;height:${size}px;${flip}" alt="${alt}">`;
  }
  // No PNG available — caller should use fishSpriteDataUrl fallback
  return '';
}

export function hpBarColor(current: number, max: number): string {
  const pct = current / max;
  if (pct > 0.5) return 'var(--hp-green)';
  if (pct > 0.25) return 'var(--hp-yellow)';
  return 'var(--hp-red)';
}

export function hpClass(current: number, max: number): string {
  const pct = current / max;
  if (pct > 0.5) return 'hp-high';
  if (pct > 0.25) return 'hp-mid';
  return 'hp-low';
}
