// New Fish Database - Array-based with 60 species
// Organized by Type: Fire (10), Water (12), Electric (9), Nature (9), Abyssal (8), Storm (8), Normal (4)

// Backward compatibility enum for existing code
export enum FishType {
  WATER = 'Water',
  FIRE = 'Fire',
  ELECTRIC = 'Electric',
  NATURE = 'Nature',
  ABYSSAL = 'Abyssal',
  STORM = 'Storm',
  NORMAL = 'Normal',
}

export enum Rarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
}

export interface FishSpecies {
  id: number;
  name: string;
  type: string; // FishType value as string
  tier: 1 | 2 | 3;
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spd: number;
    // Also provide old names for backward compatibility
    attack?: number;
    defense?: number;
    speed?: number;
  };
  moves: string[];
  evolvesInto?: number;
  // Sprite metadata (which grid image and position)
  spriteGrid?: 1 | 2 | 3;    // Grid image number (1.png, 2.png, or 3.png)
  spriteIndex?: number;       // Position in 4x5 grid (0-19)
  // Backward compatibility fields for UI
  color?: string;
  rarity?: string;
  description?: string;
}

export interface FishInstance {
  uid: string;
  speciesId: string | number;
  nickname?: string;
  level: number;
  xp: number;
  currentHp: number;
  maxHp: number;
  moves: string[];
  iv: { hp: number; attack: number; defense: number; speed: number };
}

export const FISH_SPECIES: FishSpecies[] = [
  // === TIER 1 FIRE (IDs 1-3) ===
  {
    id: 1,
    name: 'Ember Snapper',
    type: 'Fire',
    tier: 1,
    rarity: Rarity.COMMON,
    baseStats: { hp: 55, atk: 65, def: 50, spd: 58 },
    moves: ['tackle', 'flame_jet'],
    spriteGrid: 1, spriteIndex: 4,
    evolvesInto: 21,
  },
  {
    id: 2,
    name: 'Lava Carp',
    type: 'Fire',
    tier: 1,
    rarity: Rarity.COMMON,
    baseStats: { hp: 52, atk: 60, def: 50, spd: 55 },
    moves: ['tackle', 'scorch'],
    spriteGrid: 2, spriteIndex: 5,
    evolvesInto: 22,
  },
  {
    id: 3,
    name: 'Flame Pike',
    type: 'Fire',
    tier: 1,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 50, atk: 68, def: 50, spd: 62 },
    moves: ['tackle', 'ember_bite'],
    spriteGrid: 2, spriteIndex: 10,
    evolvesInto: 23,
  },

  // === TIER 1 WATER (IDs 4-7) ===
  {
    id: 4,
    name: 'Tidecaller',
    type: 'Water',
    tier: 1,
    rarity: Rarity.COMMON,
    baseStats: { hp: 58, atk: 52, def: 60, spd: 50 },
    moves: ['tackle', 'bubble_burst'],
    spriteGrid: 2, spriteIndex: 2,
    evolvesInto: 26,
  },
  {
    id: 5,
    name: 'Frost Carp',
    type: 'Water',
    tier: 1,
    rarity: Rarity.COMMON,
    baseStats: { hp: 54, atk: 58, def: 58, spd: 50 },
    moves: ['tackle', 'bubble_burst'],
    spriteGrid: 1, spriteIndex: 5,
    evolvesInto: 27,
  },
  {
    id: 6,
    name: 'Aqua Pike',
    type: 'Water',
    tier: 1,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 50, atk: 62, def: 50, spd: 68 },
    moves: ['tackle', 'aqua_fang'],
    spriteGrid: 3, spriteIndex: 4,
    evolvesInto: 28,
  },
  {
    id: 7,
    name: 'Sea Sprite',
    type: 'Water',
    tier: 1,
    rarity: Rarity.COMMON,
    baseStats: { hp: 52, atk: 50, def: 54, spd: 60 },
    moves: ['tackle', 'whirlpool'],
    spriteGrid: 3, spriteIndex: 2,
    evolvesInto: 29,
  },

  // === TIER 1 ELECTRIC (IDs 8-10) ===
  {
    id: 8,
    name: 'Volt Eel',
    type: 'Electric',
    tier: 1,
    rarity: Rarity.COMMON,
    baseStats: { hp: 50, atk: 72, def: 50, spd: 75 },
    moves: ['tackle', 'lightning_lash'],
    spriteGrid: 1, spriteIndex: 9,
    evolvesInto: 32,
  },
  {
    id: 9,
    name: 'Spark Minnow',
    type: 'Electric',
    tier: 1,
    rarity: Rarity.COMMON,
    baseStats: { hp: 50, atk: 58, def: 52, spd: 78 },
    moves: ['tackle', 'static_shock'],
    spriteGrid: 1, spriteIndex: 0,
    evolvesInto: 33,
  },
  {
    id: 10,
    name: 'Zap Fish',
    type: 'Electric',
    tier: 1,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 52, atk: 62, def: 50, spd: 72 },
    moves: ['tackle', 'thunder_fang'],
    spriteGrid: 3, spriteIndex: 6,
    evolvesInto: 34,
  },

  // === TIER 1 NATURE (IDs 11-13) ===
  {
    id: 11,
    name: 'Coral Guardian',
    type: 'Nature',
    tier: 1,
    rarity: Rarity.COMMON,
    baseStats: { hp: 60, atk: 50, def: 68, spd: 50 },
    moves: ['tackle', 'coral_bloom'],
    spriteGrid: 2, spriteIndex: 6,
    evolvesInto: 36,
  },
  {
    id: 12,
    name: 'Sea Moss',
    type: 'Nature',
    tier: 1,
    rarity: Rarity.COMMON,
    baseStats: { hp: 58, atk: 58, def: 65, spd: 50 },
    moves: ['tackle', 'thorn_wrap'],
    spriteGrid: 1, spriteIndex: 8,
    evolvesInto: 37,
  },
  {
    id: 13,
    name: 'Petal Fin',
    type: 'Nature',
    tier: 1,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 54, atk: 52, def: 58, spd: 55 },
    moves: ['tackle', 'petal_storm'],
    spriteGrid: 1, spriteIndex: 12,
    evolvesInto: 38,
  },

  // === TIER 1 ABYSSAL (IDs 14-15) ===
  {
    id: 14,
    name: 'Abyssal Fang',
    type: 'Abyssal',
    tier: 1,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 56, atk: 70, def: 52, spd: 60 },
    moves: ['tackle', 'shadow_bite'],
    spriteGrid: 1, spriteIndex: 3,
    evolvesInto: 40,
  },
  {
    id: 15,
    name: 'Dark Carp',
    type: 'Abyssal',
    tier: 1,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 54, atk: 62, def: 50, spd: 58 },
    moves: ['tackle', 'void_pulse'],
    spriteGrid: 1, spriteIndex: 13,
    evolvesInto: 40,
  },

  // === TIER 1 STORM (IDs 16-18) ===
  {
    id: 16,
    name: 'Galecutter',
    type: 'Storm',
    tier: 1,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 50, atk: 65, def: 50, spd: 82 },
    moves: ['tackle', 'gale_slash'],
    spriteGrid: 1, spriteIndex: 19,
    evolvesInto: 35,
  },
  {
    id: 17,
    name: 'Gust Minnow',
    type: 'Storm',
    tier: 1,
    rarity: Rarity.COMMON,
    baseStats: { hp: 50, atk: 58, def: 50, spd: 78 },
    moves: ['tackle', 'storm_surge'],
    spriteGrid: 2, spriteIndex: 4,
    evolvesInto: 35,
  },
  {
    id: 18,
    name: 'Wind Carp',
    type: 'Storm',
    tier: 1,
    rarity: Rarity.COMMON,
    baseStats: { hp: 52, atk: 60, def: 52, spd: 75 },
    moves: ['tackle', 'static_shock'],
    spriteGrid: 2, spriteIndex: 14,
    evolvesInto: 35,
  },

  // === TIER 1 NORMAL (IDs 19-20) ===
  {
    id: 19,
    name: 'Sea Bream',
    type: 'Normal',
    tier: 1,
    rarity: Rarity.COMMON,
    baseStats: { hp: 55, atk: 55, def: 55, spd: 55 },
    moves: ['tackle', 'aqua_shield'],
    spriteGrid: 1, spriteIndex: 7,
    evolvesInto: 57,
  },
  {
    id: 20,
    name: 'Coral Carp',
    type: 'Normal',
    tier: 1,
    rarity: Rarity.COMMON,
    baseStats: { hp: 58, atk: 52, def: 58, spd: 50 },
    moves: ['tackle', 'bubble_burst'],
    spriteGrid: 1, spriteIndex: 10,
    evolvesInto: 58,
  },

  // === TIER 2 FIRE (IDs 21-25) ===
  {
    id: 21,
    name: 'Infernoray',
    type: 'Fire',
    tier: 2,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 65, atk: 78, def: 60, spd: 68 },
    moves: ['flame_jet', 'scorch', 'inferno_dive'],
    spriteGrid: 1, spriteIndex: 4,
    evolvesInto: 41,
  },
  {
    id: 22,
    name: 'Magmafin',
    type: 'Fire',
    tier: 2,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 62, atk: 75, def: 62, spd: 65 },
    moves: ['scorch', 'ember_bite', 'inferno_dive'],
    spriteGrid: 2, spriteIndex: 5,
    evolvesInto: 42,
  },
  {
    id: 23,
    name: 'Scorchscale',
    type: 'Fire',
    tier: 2,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 58, atk: 82, def: 58, spd: 72 },
    moves: ['ember_bite', 'flame_jet', 'scorch'],
    spriteGrid: 2, spriteIndex: 10,
    evolvesInto: 43,
  },
  {
    id: 24,
    name: 'Blazefin',
    type: 'Fire',
    tier: 2,
    rarity: Rarity.RARE,
    baseStats: { hp: 60, atk: 85, def: 56, spd: 75 },
    moves: ['scorch', 'inferno_dive', 'flame_jet'],
    spriteGrid: 1, spriteIndex: 4,
    evolvesInto: 44,
  },
  {
    id: 25,
    name: 'Cinder Ray',
    type: 'Fire',
    tier: 2,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 62, atk: 68, def: 62, spd: 62 },
    moves: ['flame_jet', 'ember_bite', 'inferno_dive'],
    spriteGrid: 2, spriteIndex: 5,
    evolvesInto: 41,
  },

  // === TIER 2 WATER (IDs 26-31) ===
  {
    id: 26,
    name: 'Tsunamaw',
    type: 'Water',
    tier: 2,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 68, atk: 78, def: 65, spd: 60 },
    moves: ['tidal_wave', 'aqua_fang', 'bubble_burst'],
    spriteGrid: 1, spriteIndex: 6,
    evolvesInto: 45,
  },
  {
    id: 27,
    name: 'Rippleray',
    type: 'Water',
    tier: 2,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 65, atk: 65, def: 62, spd: 65 },
    moves: ['aqua_shield', 'whirlpool', 'tidal_wave'],
    spriteGrid: 2, spriteIndex: 3,
    evolvesInto: 46,
  },
  {
    id: 28,
    name: 'Tidebreaker',
    type: 'Water',
    tier: 2,
    rarity: Rarity.RARE,
    baseStats: { hp: 72, atk: 75, def: 68, spd: 58 },
    moves: ['tidal_wave', 'aqua_fang', 'whirlpool'],
    spriteGrid: 3, spriteIndex: 5,
    evolvesInto: 47,
  },
  {
    id: 29,
    name: 'Crystaleel',
    type: 'Water',
    tier: 2,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 62, atk: 80, def: 60, spd: 75 },
    moves: ['aqua_fang', 'bubble_burst', 'aqua_shield'],
    spriteGrid: 3, spriteIndex: 7,
    evolvesInto: 48,
  },
  {
    id: 30,
    name: 'Bubble Bass',
    type: 'Water',
    tier: 2,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 72, atk: 58, def: 75, spd: 50 },
    moves: ['bubble_burst', 'aqua_shield', 'whirlpool'],
    spriteGrid: 2, spriteIndex: 15,
    evolvesInto: 46,
  },
  {
    id: 31,
    name: 'Tidecaster',
    type: 'Water',
    tier: 2,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 75, atk: 62, def: 70, spd: 55 },
    moves: ['whirlpool', 'tidal_wave', 'aqua_shield'],
    spriteGrid: 1, spriteIndex: 5,
    evolvesInto: 45,
  },

  // === TIER 2 ELECTRIC (IDs 32-35) ===
  {
    id: 32,
    name: 'Volteel',
    type: 'Electric',
    tier: 2,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 58, atk: 85, def: 58, spd: 85 },
    moves: ['lightning_lash', 'thunder_fang', 'static_shock'],
    spriteGrid: 1, spriteIndex: 11,
    evolvesInto: 49,
  },
  {
    id: 33,
    name: 'Thunder Ray',
    type: 'Electric',
    tier: 2,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 62, atk: 80, def: 60, spd: 75 },
    moves: ['static_shock', 'surge_strike', 'lightning_lash'],
    spriteGrid: 1, spriteIndex: 17,
    evolvesInto: 50,
  },
  {
    id: 34,
    name: 'Bolt Shark',
    type: 'Electric',
    tier: 2,
    rarity: Rarity.RARE,
    baseStats: { hp: 68, atk: 88, def: 65, spd: 78 },
    moves: ['thunder_fang', 'lightning_lash', 'static_shock'],
    spriteGrid: 2, spriteIndex: 12,
    evolvesInto: 51,
  },
  {
    id: 35,
    name: 'Tempestfang',
    type: 'Storm',
    tier: 2,
    rarity: Rarity.RARE,
    baseStats: { hp: 62, atk: 85, def: 60, spd: 80 },
    moves: ['gale_slash', 'storm_surge', 'thunder_fang'],
    spriteGrid: 2, spriteIndex: 7,
    evolvesInto: 55,
  },

  // === TIER 2 NATURE (IDs 36-39) ===
  {
    id: 36,
    name: 'Coralline',
    type: 'Nature',
    tier: 2,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 68, atk: 62, def: 75, spd: 58 },
    moves: ['coral_bloom', 'thorn_wrap', 'reef_barrier'],
    spriteGrid: 1, spriteIndex: 14,
    evolvesInto: 52,
  },
  {
    id: 37,
    name: 'Bloom Ray',
    type: 'Nature',
    tier: 2,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 70, atk: 68, def: 75, spd: 60 },
    moves: ['petal_storm', 'coral_bloom', 'reef_barrier'],
    spriteGrid: 1, spriteIndex: 8,
    evolvesInto: 53,
  },
  {
    id: 38,
    name: 'Coral Titan',
    type: 'Nature',
    tier: 2,
    rarity: Rarity.RARE,
    baseStats: { hp: 82, atk: 72, def: 88, spd: 50 },
    moves: ['reef_barrier', 'thorn_wrap', 'petal_storm'],
    spriteGrid: 2, spriteIndex: 6,
    evolvesInto: 54,
  },
  {
    id: 39,
    name: 'Reefguard',
    type: 'Nature',
    tier: 2,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 80, atk: 70, def: 85, spd: 50 },
    moves: ['thorn_wrap', 'petal_storm', 'coral_bloom'],
    spriteGrid: 1, spriteIndex: 14,
    evolvesInto: 52,
  },

  // === TIER 2 ABYSSAL (ID 40) ===
  {
    id: 40,
    name: 'Voidfin',
    type: 'Abyssal',
    tier: 2,
    rarity: Rarity.RARE,
    baseStats: { hp: 62, atk: 82, def: 62, spd: 72 },
    moves: ['shadow_bite', 'void_pulse', 'dread_gaze'],
    spriteGrid: 1, spriteIndex: 2,
    evolvesInto: 58,
  },

  // === TIER 3 FIRE (IDs 41-44) ===
  {
    id: 41,
    name: 'Grand Infernoray',
    type: 'Fire',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 85, atk: 98, def: 75, spd: 85 },
    moves: ['inferno_dive', 'scorch', 'flame_jet', 'ember_bite'],
    spriteGrid: 1, spriteIndex: 15,
  },
  {
    id: 42,
    name: 'Inferno Bass',
    type: 'Fire',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 80, atk: 95, def: 75, spd: 80 },
    moves: ['flame_jet', 'scorch', 'inferno_dive', 'ember_bite'],
    spriteGrid: 2, spriteIndex: 0,
  },
  {
    id: 43,
    name: 'Lord of Embers',
    type: 'Fire',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 88, atk: 100, def: 78, spd: 82 },
    moves: ['scorch', 'inferno_dive', 'flame_jet', 'ember_bite'],
    spriteGrid: 3, spriteIndex: 1,
  },
  {
    id: 44,
    name: 'Volcanic Leviathan',
    type: 'Fire',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 92, atk: 98, def: 80, spd: 78 },
    moves: ['inferno_dive', 'ember_bite', 'flame_jet', 'scorch'],
    spriteGrid: 2, spriteIndex: 0,
  },

  // === TIER 3 WATER (IDs 45-48) ===
  {
    id: 45,
    name: 'Grand Tidecaster',
    type: 'Water',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 90, atk: 82, def: 88, spd: 75 },
    moves: ['tidal_wave', 'whirlpool', 'aqua_shield', 'aqua_fang'],
    spriteGrid: 2, spriteIndex: 17,
  },
  {
    id: 46,
    name: 'Storm Whale',
    type: 'Water',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 95, atk: 85, def: 90, spd: 65 },
    moves: ['whirlpool', 'aqua_fang', 'bubble_burst', 'aqua_shield'],
    spriteGrid: 2, spriteIndex: 17,
  },
  {
    id: 47,
    name: 'The Tidewyrm',
    type: 'Water',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 100, atk: 95, def: 85, spd: 80 },
    moves: ['tidal_wave', 'aqua_fang', 'whirlpool', 'aqua_shield'],
    spriteGrid: 2, spriteIndex: 19,
  },
  {
    id: 48,
    name: 'Abyssal Leviathan',
    type: 'Water',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 92, atk: 92, def: 88, spd: 78 },
    moves: ['aqua_fang', 'bubble_burst', 'whirlpool', 'tidal_wave'],
    spriteGrid: 2, spriteIndex: 18,
  },

  // === TIER 3 ELECTRIC (IDs 49-51) ===
  {
    id: 49,
    name: 'Arc Wyrm',
    type: 'Electric',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 82, atk: 100, def: 75, spd: 92 },
    moves: ['surge_strike', 'thunder_fang', 'lightning_lash', 'static_shock'],
    spriteGrid: 2, spriteIndex: 16,
  },
  {
    id: 50,
    name: 'Storm Leviathan',
    type: 'Electric',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 90, atk: 98, def: 80, spd: 88 },
    moves: ['thunder_fang', 'surge_strike', 'lightning_lash', 'static_shock'],
    spriteGrid: 2, spriteIndex: 16,
  },
  {
    id: 51,
    name: 'Lightning Emperor',
    type: 'Electric',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 88, atk: 100, def: 82, spd: 90 },
    moves: ['lightning_lash', 'surge_strike', 'thunder_fang', 'static_shock'],
    spriteGrid: 2, spriteIndex: 16,
  },

  // === TIER 3 NATURE (IDs 52-54) ===
  {
    id: 52,
    name: 'Jade Serpent',
    type: 'Nature',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 88, atk: 88, def: 85, spd: 75 },
    moves: ['petal_storm', 'coral_bloom', 'reef_barrier', 'thorn_wrap'],
    spriteGrid: 2, spriteIndex: 11,
  },
  {
    id: 53,
    name: 'Reef Colossus',
    type: 'Nature',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 92, atk: 90, def: 92, spd: 70 },
    moves: ['reef_barrier', 'thorn_wrap', 'petal_storm', 'coral_bloom'],
    spriteGrid: 2, spriteIndex: 13,
  },
  {
    id: 54,
    name: 'Primordial Grove',
    type: 'Nature',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 95, atk: 92, def: 95, spd: 65 },
    moves: ['thorn_wrap', 'petal_storm', 'coral_bloom', 'reef_barrier'],
    spriteGrid: 2, spriteIndex: 13,
  },

  // === TIER 3 STORM (ID 55) ===
  {
    id: 55,
    name: 'Hurricane Bass',
    type: 'Storm',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 85, atk: 95, def: 78, spd: 88 },
    moves: ['storm_surge', 'gale_slash', 'thunder_fang', 'static_shock'],
    spriteGrid: 1, spriteIndex: 16,
  },

  // === TIER 2 NORMAL (ID 56) ===
  {
    id: 56,
    name: 'Harbor Fish',
    type: 'Normal',
    tier: 2,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 70, atk: 60, def: 68, spd: 58 },
    moves: ['tackle', 'bubble_burst', 'aqua_shield'],
    spriteGrid: 1, spriteIndex: 1,
    evolvesInto: 60,
  },

  // === TIER 2 ABYSSAL (ID 57) — Lantern Angler ===
  {
    id: 57,
    name: 'Lantern Angler',
    type: 'Abyssal',
    tier: 2,
    rarity: Rarity.UNCOMMON,
    baseStats: { hp: 72, atk: 68, def: 62, spd: 48 },
    moves: ['tackle', 'void_pulse', 'abyss_drain'],
    spriteGrid: 3, spriteIndex: 0,
  },

  // === TIER 3 ABYSSAL (ID 58) ===
  {
    id: 58,
    name: 'Abyss Serpent',
    type: 'Abyssal',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 85, atk: 98, def: 78, spd: 75 },
    moves: ['void_pulse', 'abyss_drain', 'shadow_bite', 'dread_gaze'],
    spriteGrid: 1, spriteIndex: 18,
  },

  // === TIER 3 STORM (ID 59) ===
  {
    id: 59,
    name: 'The Maelstrom',
    type: 'Storm',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 90, atk: 98, def: 80, spd: 92 },
    moves: ['gale_slash', 'storm_surge', 'static_shock', 'thunder_fang'],
    spriteGrid: 3, spriteIndex: 3,
  },

  // === TIER 3 NORMAL (IDs 60-62) ===
  {
    id: 60,
    name: 'Old Barnacle',
    type: 'Normal',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 90, atk: 75, def: 85, spd: 65 },
    moves: ['tackle', 'reef_barrier', 'aqua_shield', 'thorn_wrap'],
    spriteGrid: 2, spriteIndex: 9,
  },
  {
    id: 61,
    name: 'Ancient Mariner',
    type: 'Normal',
    tier: 3,
    rarity: Rarity.RARE,
    baseStats: { hp: 92, atk: 82, def: 88, spd: 72 },
    moves: ['tackle', 'tidal_wave', 'gale_slash', 'aqua_shield'],
    spriteGrid: 2, spriteIndex: 1,
  },
];

// For backward compatibility, also export as a record-like object
export const FISH_SPECIES_RECORD: Record<string, FishSpecies> = {};
FISH_SPECIES.forEach(fish => {
  // Create entries for both numeric ID and name-based ID
  FISH_SPECIES_RECORD[fish.id] = fish;
  // Also add a kebab-case version of the name for compatibility with old tests
  const kebabName = fish.name.toLowerCase().replace(/\s+/g, '_');
  FISH_SPECIES_RECORD[kebabName] = fish;
});

// Helper functions
export function getFishById(id: number | string): FishSpecies | undefined {
  if (typeof id === 'number') {
    return FISH_SPECIES.find((f) => f.id === id);
  }
  // Handle string IDs (species names for backward compatibility)
  const normalized = id.toLowerCase().replace(/[_\s]/g, '');
  return FISH_SPECIES.find((f) => {
    const nameLower = f.name.toLowerCase().replace(/[_\s]/g, '');
    return nameLower === normalized;
  });
}

export function getFishByName(name: string): FishSpecies | undefined {
  return FISH_SPECIES.find((f) => f.name === name);
}

export function getFishByType(type: string | FishType): FishSpecies[] {
  const typeStr = typeof type === 'string' ? type : (type as any);
  return FISH_SPECIES.filter((f) => f.type === typeStr);
}

export function getFishByTier(tier: 1 | 2 | 3): FishSpecies[] {
  return FISH_SPECIES.filter((f) => f.tier === tier);
}

// Backward compatibility: createFishInstance for old code
let uidCounter = 0;

export function createFishInstance(
  speciesId: string | number,
  level: number,
  moves?: string[]
): FishInstance {
  // Handle both string IDs (old) and numeric IDs (new)
  let species: FishSpecies | undefined;

  if (typeof speciesId === 'number') {
    species = getFishById(speciesId);
  } else {
    // Try as exact name first, then try as a slug/ID
    species = getFishByName(speciesId);
    if (!species) {
      species = getFishById(speciesId);
    }
  }

  if (!species) throw new Error(`Unknown species: ${speciesId}`);

  const iv = {
    hp: Math.floor(Math.random() * 16),
    attack: Math.floor(Math.random() * 16),
    defense: Math.floor(Math.random() * 16),
    speed: Math.floor(Math.random() * 16),
  };

  const maxHp = calcStat(species.baseStats.hp, iv.hp, level, true);

  // Higher level fish know more moves (2 at low level, up to 4 at higher levels)
  const moveCount = moves ? moves.length : Math.min(species.moves.length, level >= 10 ? 4 : level >= 5 ? 3 : 2);
  const selectedMoves = moves ?? species.moves.slice(0, moveCount);

  return {
    uid: `fish_${++uidCounter}_${Date.now()}`,
    speciesId,
    level,
    xp: 0,
    currentHp: maxHp,
    maxHp,
    moves: selectedMoves,
    iv,
  };
}

export function calcStat(
  base: number,
  iv: number,
  level: number,
  isHp = false
): number {
  const core = Math.floor(((2 * base + iv) * level) / 100);
  return isHp ? core + level + 10 : core + 5;
}

export function getXpForLevel(level: number): number {
  return Math.floor(level * level * level * 0.8);
}

export function getStatAtLevel(
  species: FishSpecies,
  iv: FishInstance['iv'],
  level: number
): { hp: number; attack: number; defense: number; speed: number } {
  return {
    hp: calcStat(species.baseStats.hp, iv.hp, level, true),
    attack: calcStat(species.baseStats.atk, iv.attack, level),
    defense: calcStat(species.baseStats.def, iv.defense, level),
    speed: calcStat(species.baseStats.spd, iv.speed, level),
  };
}
