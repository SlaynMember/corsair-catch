// Beach enemy type definitions for overworld encounters
// Each enemy type has its own sprite set, battle stats, and spawn config

export interface BeachEnemyDef {
  id: string;
  name: string;
  /** Texture key prefix for overworld sprite (e.g. 'crab-basic' → loads 'crab-basic-east') */
  spriteKey: string;
  /** Display scale for overworld sprite */
  spriteScale: number;
  /** Battle stats */
  level: number;
  hp: number;
  moves: string[];
  /** Procedural fallback color (used if sprite not loaded) */
  fallbackColor: number;
  /** Aggro radius in pixels */
  aggroRadius: number;
}

/** All beach enemy types. The spawner picks from this list. */
export const BEACH_ENEMIES: BeachEnemyDef[] = [
  {
    id: 'cannonball_crab',
    name: 'Cannonball Crab',
    spriteKey: 'crab-basic',
    spriteScale: 0.18,
    level: 3,
    hp: 30,
    moves: ['tackle'],
    fallbackColor: 0xcc5500,
    aggroRadius: 38,
  },
  {
    id: 'scallywag_gull',
    name: 'Scallywag Gull',
    spriteKey: 'gull',
    spriteScale: 1.2,
    level: 4,
    hp: 28,
    moves: ['peck', 'wing_gust'],
    fallbackColor: 0xdddddd,
    aggroRadius: 50,
  },
  {
    id: 'loot_jelly',
    name: 'Loot Jelly',
    spriteKey: 'jelly',
    spriteScale: 0.50,
    level: 5,
    hp: 35,
    moves: ['venom_sting', 'jelly_pulse'],
    fallbackColor: 0xaa44cc,
    aggroRadius: 42,
  },
  {
    id: 'loot_hermit',
    name: 'Loot Hermit',
    spriteKey: 'hermit',
    spriteScale: 0.50,
    level: 5,
    hp: 40,
    moves: ['shell_slam', 'gold_toss'],
    fallbackColor: 0xbb8833,
    aggroRadius: 36,
  },
  {
    id: 'evil_pirate',
    name: 'Blackhand Pete',
    spriteKey: 'evil-pirate',
    spriteScale: 1.2,
    level: 6,
    hp: 42,
    moves: ['cutlass_slash', 'plunder'],
    fallbackColor: 0x331111,
    aggroRadius: 55,
  },
];

/** Pick a random enemy type, weighted toward crabs early on */
export function rollBeachEnemy(): BeachEnemyDef {
  const roll = Math.random();
  if (roll < 0.40) return BEACH_ENEMIES[0]; // Cannonball Crab (40%)
  if (roll < 0.65) return BEACH_ENEMIES[1]; // Scallywag Gull (25%)
  if (roll < 0.85) return BEACH_ENEMIES[2]; // Loot Jelly (20%)
  return BEACH_ENEMIES[3];                   // Loot Hermit (15%)
}

/** Beach 1 — crabs, gulls, jellies, and rare evil pirates */
export function rollBeach1Enemy(): BeachEnemyDef {
  const roll = Math.random();
  if (roll < 0.40) return BEACH_ENEMIES[0]; // Cannonball Crab (40%)
  if (roll < 0.65) return BEACH_ENEMIES[1]; // Scallywag Gull (25%)
  if (roll < 0.80) return BEACH_ENEMIES[2]; // Loot Jelly (15%)
  return BEACH_ENEMIES[4];                   // Blackhand Pete (20%)
}

/** Beach 2 only — tougher enemies near the dock */
export function rollBeach2Enemy(): BeachEnemyDef {
  const roll = Math.random();
  if (roll < 0.55) return BEACH_ENEMIES[2]; // Loot Jelly (55%)
  return BEACH_ENEMIES[3];                   // Loot Hermit (45%)
}

/** Beach 3 — pirate cove, dangerous enemies */
export function rollBeach3Enemy(): BeachEnemyDef {
  const roll = Math.random();
  if (roll < 0.30) return BEACH_ENEMIES[2]; // Loot Jelly (30%)
  if (roll < 0.70) return BEACH_ENEMIES[4]; // Blackhand Pete (40%)
  return BEACH_ENEMIES[3];                   // Loot Hermit (30%)
}
