/**
 * Fishing Scene Presets — Three context-aware backgrounds
 * shore, dock, boat each have distinct visual mood
 */

export interface FishingScenePreset {
  id: 'shore' | 'dock' | 'boat';
  background: {
    skyGradient: [string, string]; // [top, bottom]
    waterColor: string;
    foreground: string;
  };
  character: {
    pose: 'standing' | 'crouching' | 'seated';
    xOffset: number;
    yOffset: number;
  };
  elements: {
    showDock?: boolean;
    showShip?: boolean;
    showPalm?: boolean;
    showFoam?: boolean;
    showRipples?: boolean;
    atmosphereType: 'calm' | 'breeze' | 'storm';
    particleIntensity: number; // 0-1
  };
  lighting: {
    shadowIntensity: number;
    glowIntensity: number;
    timeOfDay: 'dawn' | 'day' | 'sunset' | 'night';
  };
}

export const FISHING_PRESETS: Record<string, FishingScenePreset> = {
  shore: {
    id: 'shore',
    background: {
      skyGradient: ['#e07856', '#ffd4b4'], // Warm coral to peach
      waterColor: '#2dafb8', // Teal shallow water
      foreground: '#8b5a3c', // Sandy beach
    },
    character: {
      pose: 'standing',
      xOffset: -120,
      yOffset: 20,
    },
    elements: {
      showPalm: true,
      showFoam: true,
      showRipples: true,
      atmosphereType: 'breeze',
      particleIntensity: 0.3,
    },
    lighting: {
      shadowIntensity: 0.4,
      glowIntensity: 0.6,
      timeOfDay: 'day',
    },
  },

  dock: {
    id: 'dock',
    background: {
      skyGradient: ['#fd574b', '#ffab91'], // Warm coral to primrose
      waterColor: '#1b8a96', // Deeper teal
      foreground: '#6b5438', // Wooden dock
    },
    character: {
      pose: 'crouching',
      xOffset: -100,
      yOffset: 40,
    },
    elements: {
      showDock: true,
      showFoam: true,
      showRipples: true,
      showPalm: false,
      atmosphereType: 'calm',
      particleIntensity: 0.2,
    },
    lighting: {
      shadowIntensity: 0.5,
      glowIntensity: 0.5,
      timeOfDay: 'day',
    },
  },

  boat: {
    id: 'boat',
    background: {
      skyGradient: ['#0d3b5c', '#1a5a7a'], // Deep blue to navy
      waterColor: '#1dffff', // Bioluminescent cyan
      foreground: '#2c3e50', // Ship hull
    },
    character: {
      pose: 'seated',
      xOffset: -140,
      yOffset: 60,
    },
    elements: {
      showShip: true,
      showFoam: false,
      showRipples: true,
      atmosphereType: 'storm',
      particleIntensity: 0.6,
    },
    lighting: {
      shadowIntensity: 0.8,
      glowIntensity: 0.9, // Bioluminescence glow
      timeOfDay: 'night',
    },
  },
};

export function getPreset(id: 'shore' | 'dock' | 'boat'): FishingScenePreset {
  return FISHING_PRESETS[id];
}

/**
 * Build gradient array for PixiJS gradient filter
 */
export function buildGradientColors(
  top: string,
  bottom: string
): { colors: number[]; stops: number[] } {
  const topRgb = parseHex(top);
  const bottomRgb = parseHex(bottom);

  // Smooth 10-step gradient for visual quality
  const colors: number[] = [];
  const stops: number[] = [];

  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const r = Math.round(topRgb.r + (bottomRgb.r - topRgb.r) * t);
    const g = Math.round(topRgb.g + (bottomRgb.g - topRgb.g) * t);
    const b = Math.round(topRgb.b + (bottomRgb.b - topRgb.b) * t);

    colors.push((r << 16) | (g << 8) | b);
    stops.push(t);
  }

  return { colors, stops };
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '');
  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  };
}

/**
 * Convert hex color string to 0xRRGGBB format
 */
export function hexToNumber(hex: string): number {
  const cleaned = hex.replace('#', '');
  return parseInt(cleaned, 16);
}
