import { FishType } from './fish-db';

export type MoveCategory = 'physical' | 'special' | 'status';

export interface MoveEffect {
  type: 'burn' | 'paralyze' | 'heal' | 'buff_attack' | 'buff_defense' | 'debuff_defense';
  chance: number;
  magnitude?: number;
}

export interface Move {
  id: string;
  name: string;
  type: FishType;
  category: MoveCategory;
  power: number;
  accuracy: number;
  pp: number;
  effect?: MoveEffect;
  description: string;
}

export const MOVES: Record<string, Move> = {
  struggle: {
    id: 'struggle',
    name: 'Struggle',
    type: FishType.NORMAL,
    category: 'physical',
    power: 50,
    accuracy: 100,
    pp: 999,
    description: 'A desperate attack used when all moves are exhausted.',
  },
  tackle: {
    id: 'tackle',
    name: 'Tackle',
    type: FishType.NORMAL,
    category: 'physical',
    power: 40,
    accuracy: 100,
    pp: 35,
    description: 'A basic charging attack.',
  },
  flame_jet: {
    id: 'flame_jet',
    name: 'Flame Jet',
    type: FishType.FIRE,
    category: 'special',
    power: 60,
    accuracy: 95,
    pp: 20,
    description: 'A jet of flame that may burn the target.',
    effect: { type: 'burn', chance: 0.2 },
  },
  scorch: {
    id: 'scorch',
    name: 'Scorch',
    type: FishType.FIRE,
    category: 'special',
    power: 80,
    accuracy: 85,
    pp: 10,
    description: 'An intense blast of heat.',
  },
  ember_bite: {
    id: 'ember_bite',
    name: 'Ember Bite',
    type: FishType.FIRE,
    category: 'physical',
    power: 50,
    accuracy: 100,
    pp: 25,
    description: 'Bites with flame-coated teeth.',
    effect: { type: 'burn', chance: 0.1 },
  },
  tidal_wave: {
    id: 'tidal_wave',
    name: 'Tidal Wave',
    type: FishType.WATER,
    category: 'special',
    power: 65,
    accuracy: 95,
    pp: 15,
    description: 'Summons a crashing wave.',
  },
  aqua_shield: {
    id: 'aqua_shield',
    name: 'Aqua Shield',
    type: FishType.WATER,
    category: 'status',
    power: 0,
    accuracy: 100,
    pp: 10,
    description: 'Raises defense with a water barrier.',
    effect: { type: 'buff_defense', chance: 1.0, magnitude: 1 },
  },
  bubble_burst: {
    id: 'bubble_burst',
    name: 'Bubble Burst',
    type: FishType.WATER,
    category: 'special',
    power: 50,
    accuracy: 100,
    pp: 25,
    description: 'Explosive bubbles hit the foe.',
  },
  lightning_lash: {
    id: 'lightning_lash',
    name: 'Lightning Lash',
    type: FishType.ELECTRIC,
    category: 'special',
    power: 70,
    accuracy: 90,
    pp: 15,
    description: 'A whip of lightning strikes the foe.',
    effect: { type: 'paralyze', chance: 0.3 },
  },
  static_shock: {
    id: 'static_shock',
    name: 'Static Shock',
    type: FishType.ELECTRIC,
    category: 'special',
    power: 45,
    accuracy: 100,
    pp: 30,
    description: 'A quick jolt of electricity.',
    effect: { type: 'paralyze', chance: 0.1 },
  },
  thunder_fang: {
    id: 'thunder_fang',
    name: 'Thunder Fang',
    type: FishType.ELECTRIC,
    category: 'physical',
    power: 65,
    accuracy: 95,
    pp: 15,
    description: 'Bites with electrically charged fangs.',
  },
  reef_barrier: {
    id: 'reef_barrier',
    name: 'Reef Barrier',
    type: FishType.NATURE,
    category: 'status',
    power: 0,
    accuracy: 100,
    pp: 10,
    description: 'Creates a coral wall that boosts defense.',
    effect: { type: 'buff_defense', chance: 1.0, magnitude: 1 },
  },
  coral_bloom: {
    id: 'coral_bloom',
    name: 'Coral Bloom',
    type: FishType.NATURE,
    category: 'status',
    power: 0,
    accuracy: 100,
    pp: 8,
    description: 'Blooming coral heals the user.',
    effect: { type: 'heal', chance: 1.0, magnitude: 0.3 },
  },
  thorn_wrap: {
    id: 'thorn_wrap',
    name: 'Thorn Wrap',
    type: FishType.NATURE,
    category: 'physical',
    power: 55,
    accuracy: 90,
    pp: 20,
    description: 'Thorny coral vines constrict the foe.',
  },
  shadow_bite: {
    id: 'shadow_bite',
    name: 'Shadow Bite',
    type: FishType.ABYSSAL,
    category: 'physical',
    power: 65,
    accuracy: 95,
    pp: 20,
    description: 'Bites from the shadows.',
  },
  void_pulse: {
    id: 'void_pulse',
    name: 'Void Pulse',
    type: FishType.ABYSSAL,
    category: 'special',
    power: 75,
    accuracy: 90,
    pp: 10,
    description: 'A pulse of dark energy from the abyss.',
  },
  dread_gaze: {
    id: 'dread_gaze',
    name: 'Dread Gaze',
    type: FishType.ABYSSAL,
    category: 'status',
    power: 0,
    accuracy: 100,
    pp: 15,
    description: 'A terrifying stare that lowers attack.',
    effect: { type: 'buff_attack', chance: 1.0, magnitude: -1 },
  },

  // === NEW MOVES ===

  // Fire
  inferno_dive: {
    id: 'inferno_dive',
    name: 'Inferno Dive',
    type: FishType.FIRE,
    category: 'physical',
    power: 90,
    accuracy: 85,
    pp: 5,
    description: 'Dives from above wreathed in flame. High power but risky accuracy.',
    effect: { type: 'burn', chance: 0.3 },
  },

  // Water
  aqua_fang: {
    id: 'aqua_fang',
    name: 'Aqua Fang',
    type: FishType.WATER,
    category: 'physical',
    power: 70,
    accuracy: 95,
    pp: 15,
    description: 'Bites with water-pressurized jaws.',
  },
  whirlpool: {
    id: 'whirlpool',
    name: 'Whirlpool',
    type: FishType.WATER,
    category: 'special',
    power: 80,
    accuracy: 85,
    pp: 8,
    description: 'Traps the foe in a swirling vortex of water.',
  },

  // Electric
  surge_strike: {
    id: 'surge_strike',
    name: 'Surge Strike',
    type: FishType.ELECTRIC,
    category: 'physical',
    power: 85,
    accuracy: 85,
    pp: 8,
    description: 'Charges with electromagnetic force. May paralyze.',
    effect: { type: 'paralyze', chance: 0.2 },
  },

  // Coral
  petal_storm: {
    id: 'petal_storm',
    name: 'Petal Storm',
    type: FishType.NATURE,
    category: 'special',
    power: 70,
    accuracy: 90,
    pp: 12,
    description: 'A storm of razor-sharp coral petals lacerates the foe.',
  },

  // Abyssal
  abyss_drain: {
    id: 'abyss_drain',
    name: 'Abyss Drain',
    type: FishType.ABYSSAL,
    category: 'special',
    power: 60,
    accuracy: 95,
    pp: 15,
    description: 'Drains life force from the void. Heals the user.',
    effect: { type: 'heal', chance: 1.0, magnitude: 0.25 },
  },

  // Storm
  gale_slash: {
    id: 'gale_slash',
    name: 'Gale Slash',
    type: FishType.STORM,
    category: 'physical',
    power: 65,
    accuracy: 95,
    pp: 20,
    description: 'Slices with wind-sharp fins at blinding speed.',
  },
  storm_surge: {
    id: 'storm_surge',
    name: 'Storm Surge',
    type: FishType.STORM,
    category: 'special',
    power: 85,
    accuracy: 85,
    pp: 8,
    description: 'Unleashes a devastating surge of storm energy.',
    effect: { type: 'paralyze', chance: 0.15 },
  },
};
