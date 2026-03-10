// Ship Database - 20 unique ships organized by class
// Similar structure to fish-db.ts with stats, moves, and upgrades

export enum ShipClass {
  MERCHANT = 'Merchant',
  PIRATE = 'Pirate',
  NAVAL = 'Naval',
  TREASURE_HUNTER = 'TreasureHunter',
  GHOST = 'Ghost',
  STORM = 'Storm',
}

export enum ShipRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  LEGENDARY = 'legendary',
}

export interface ShipStats {
  hull: number; // Durability/HP
  speed: number; // Sailing speed
  cargo: number; // Fishing capacity
  maneuver: number; // Turn radius/agility
  cannon?: number; // Battle effectiveness (future)
}

export interface ShipAbility {
  name: string;
  description: string;
  type: 'sail' | 'combat' | 'utility';
}

export interface ShipBlueprint {
  id: number;
  name: string;
  class: ShipClass;
  rarity: ShipRarity;
  spriteIndex: number; // Row, Col in ships.png (0-19)
  baseStats: ShipStats;
  abilities: ShipAbility[];
  upgradesInto?: number;
  baseColor?: number; // Fallback hex color
}

export const SHIPS: ShipBlueprint[] = [
  // === ROW 1: TIER 1 MERCHANT SHIPS ===
  {
    id: 1,
    name: 'Driftwood Dory',
    class: ShipClass.MERCHANT,
    rarity: ShipRarity.COMMON,
    spriteIndex: 0, // Row 0, Col 0
    baseStats: { hull: 45, speed: 50, cargo: 80, maneuver: 65, cannon: 20 },
    abilities: [
      { name: 'Steady Course', description: 'Reduced fuel consumption', type: 'sail' },
      { name: 'Open Hold', description: 'Increased catch capacity', type: 'utility' },
    ],
    upgradesInto: 11,
  },
  {
    id: 2,
    name: 'Galleon Trader',
    class: ShipClass.MERCHANT,
    rarity: ShipRarity.COMMON,
    spriteIndex: 1, // Row 0, Col 1
    baseStats: { hull: 50, speed: 45, cargo: 95, maneuver: 50, cannon: 25 },
    abilities: [
      { name: 'Trade Winds', description: 'Faster cargo loading', type: 'utility' },
      { name: 'Broad Sails', description: 'Increased sail surface', type: 'sail' },
    ],
    upgradesInto: 12,
  },
  {
    id: 3,
    name: 'Brigantine Scout',
    class: ShipClass.MERCHANT,
    rarity: ShipRarity.UNCOMMON,
    spriteIndex: 2, // Row 0, Col 2
    baseStats: { hull: 42, speed: 65, cargo: 70, maneuver: 75, cannon: 30 },
    abilities: [
      { name: 'Swift Navigator', description: 'Faster travel between zones', type: 'sail' },
      { name: 'Keen Eyes', description: 'Better encounter detection', type: 'utility' },
    ],
    upgradesInto: 13,
  },
  {
    id: 4,
    name: 'Caravel Corsair',
    class: ShipClass.PIRATE,
    rarity: ShipRarity.UNCOMMON,
    spriteIndex: 3, // Row 0, Col 3
    baseStats: { hull: 55, speed: 60, cargo: 65, maneuver: 70, cannon: 50 },
    abilities: [
      { name: 'Plunder', description: 'Extra loot from encounters', type: 'utility' },
      { name: 'Swift Strike', description: 'First-turn advantage in battle', type: 'combat' },
    ],
    upgradesInto: 14,
  },

  // === ROW 2: TIER 1 PIRATE SHIPS ===
  {
    id: 5,
    name: 'Cutlass Cruiser',
    class: ShipClass.PIRATE,
    rarity: ShipRarity.COMMON,
    spriteIndex: 4, // Row 1, Col 0
    baseStats: { hull: 60, speed: 55, cargo: 60, maneuver: 65, cannon: 55 },
    abilities: [
      { name: 'Ramming Speed', description: 'Increased collision damage', type: 'combat' },
      { name: 'Skull Flag', description: 'Intimidate weaker ships', type: 'utility' },
    ],
    upgradesInto: 15,
  },
  {
    id: 6,
    name: 'Anchor Guard',
    class: ShipClass.NAVAL,
    rarity: ShipRarity.UNCOMMON,
    spriteIndex: 5, // Row 1, Col 1
    baseStats: { hull: 75, speed: 40, cargo: 75, maneuver: 45, cannon: 65 },
    abilities: [
      { name: 'Fortified Hull', description: 'Reduced incoming damage', type: 'combat' },
      { name: 'Anchored Defense', description: 'Stability bonus when stationary', type: 'sail' },
    ],
    upgradesInto: 16,
  },
  {
    id: 7,
    name: 'Star Runner',
    class: ShipClass.TREASURE_HUNTER,
    rarity: ShipRarity.UNCOMMON,
    spriteIndex: 6, // Row 1, Col 2
    baseStats: { hull: 48, speed: 70, cargo: 85, maneuver: 80, cannon: 40 },
    abilities: [
      { name: 'Treasure Compass', description: 'Enhanced resource detection', type: 'utility' },
      { name: 'Evasive Maneuvers', description: 'Dodge enemy encounters', type: 'sail' },
    ],
    upgradesInto: 17,
  },
  {
    id: 8,
    name: 'Reaper\'s Mark',
    class: ShipClass.PIRATE,
    rarity: ShipRarity.RARE,
    spriteIndex: 7, // Row 1, Col 3
    baseStats: { hull: 65, speed: 65, cargo: 70, maneuver: 75, cannon: 75 },
    abilities: [
      { name: 'Death From Above', description: 'Cannon attack bonus', type: 'combat' },
      { name: 'Feared Vessel', description: 'Increased pirate respect', type: 'utility' },
    ],
    upgradesInto: 18,
  },

  // === ROW 3: TIER 2 SHIPS ===
  {
    id: 9,
    name: 'Lunar Dancer',
    class: ShipClass.TREASURE_HUNTER,
    rarity: ShipRarity.RARE,
    spriteIndex: 8, // Row 2, Col 0
    baseStats: { hull: 50, speed: 75, cargo: 80, maneuver: 85, cannon: 45 },
    abilities: [
      { name: 'Night Navigator', description: 'Improved night vision', type: 'sail' },
      { name: 'Graceful Sailing', description: 'Reduced fatigue on long voyages', type: 'sail' },
    ],
    upgradesInto: 19,
  },
  {
    id: 10,
    name: 'Tempest Wrecker',
    class: ShipClass.STORM,
    rarity: ShipRarity.RARE,
    spriteIndex: 9, // Row 2, Col 1
    baseStats: { hull: 70, speed: 50, cargo: 75, maneuver: 55, cannon: 70 },
    abilities: [
      { name: 'Storm Rider', description: 'Favorable in bad weather', type: 'sail' },
      { name: 'Thunder Call', description: 'Summon storm effects in battle', type: 'combat' },
    ],
    upgradesInto: 20,
  },

  // === ROW 3 CONTINUED: TIER 2 (UPGRADES) ===
  {
    id: 11,
    name: 'Driftwood Galleon',
    class: ShipClass.MERCHANT,
    rarity: ShipRarity.UNCOMMON,
    spriteIndex: 10, // Row 2, Col 2
    baseStats: { hull: 55, speed: 55, cargo: 110, maneuver: 60, cannon: 35 },
    abilities: [
      { name: 'Expanded Cargo', description: 'Significantly increased hold', type: 'utility' },
      { name: 'Merchant\'s Luck', description: 'Better trade prices', type: 'utility' },
    ],
  },
  {
    id: 12,
    name: 'Grand Trader',
    class: ShipClass.MERCHANT,
    rarity: ShipRarity.UNCOMMON,
    spriteIndex: 11, // Row 2, Col 3
    baseStats: { hull: 60, speed: 50, cargo: 120, maneuver: 55, cannon: 40 },
    abilities: [
      { name: 'Empire Sails', description: 'Attract high-value fish', type: 'utility' },
      { name: 'Trade Master', description: 'Sell catches for more currency', type: 'utility' },
    ],
  },

  // === ROW 4: TIER 2 PIRATE UPGRADES ===
  {
    id: 13,
    name: 'Scout Prowler',
    class: ShipClass.PIRATE,
    rarity: ShipRarity.RARE,
    spriteIndex: 12, // Row 3, Col 0
    baseStats: { hull: 50, speed: 75, cargo: 75, maneuver: 85, cannon: 55 },
    abilities: [
      { name: 'Shadow Tactics', description: 'Escape from stronger enemies', type: 'combat' },
      { name: 'Scout Mastery', description: 'Detect hidden zones', type: 'utility' },
    ],
  },
  {
    id: 14,
    name: 'Crimson Corsair',
    class: ShipClass.PIRATE,
    rarity: ShipRarity.RARE,
    spriteIndex: 13, // Row 3, Col 1
    baseStats: { hull: 65, speed: 65, cargo: 70, maneuver: 75, cannon: 70 },
    abilities: [
      { name: 'Bloodlust', description: 'HP recovery from defeating enemies', type: 'combat' },
      { name: 'Pirate\'s Hunger', description: 'More aggressive encounters', type: 'utility' },
    ],
  },
  {
    id: 15,
    name: 'Thunderstrike',
    class: ShipClass.PIRATE,
    rarity: ShipRarity.RARE,
    spriteIndex: 14, // Row 3, Col 2
    baseStats: { hull: 68, speed: 62, cargo: 68, maneuver: 72, cannon: 80 },
    abilities: [
      { name: 'Cannon Barrage', description: 'Multi-hit attacks', type: 'combat' },
      { name: 'Pirate Savvy', description: 'Increased loot quality', type: 'utility' },
    ],
  },
  {
    id: 16,
    name: 'Serpent Slayer',
    class: ShipClass.NAVAL,
    rarity: ShipRarity.RARE,
    spriteIndex: 15, // Row 3, Col 3
    baseStats: { hull: 85, speed: 45, cargo: 80, maneuver: 50, cannon: 75 },
    abilities: [
      { name: 'Dragon Slayer', description: 'Bonuses vs boss creatures', type: 'combat' },
      { name: 'Naval Authority', description: 'Command respect from other ships', type: 'utility' },
    ],
  },

  // === ROW 5: TIER 3 LEGENDARY SHIPS ===
  {
    id: 17,
    name: 'Golden Pathfinder',
    class: ShipClass.TREASURE_HUNTER,
    rarity: ShipRarity.RARE,
    spriteIndex: 16, // Row 4, Col 0
    baseStats: { hull: 60, speed: 80, cargo: 100, maneuver: 90, cannon: 60 },
    abilities: [
      { name: 'Treasure Magnetism', description: 'Attract legendary catches', type: 'utility' },
      { name: 'Golden Fortune', description: 'Double rare encounter rate', type: 'utility' },
    ],
  },
  {
    id: 18,
    name: 'Dread Lord\'s Vessel',
    class: ShipClass.PIRATE,
    rarity: ShipRarity.LEGENDARY,
    spriteIndex: 17, // Row 4, Col 1
    baseStats: { hull: 80, speed: 70, cargo: 85, maneuver: 80, cannon: 95 },
    abilities: [
      { name: 'Cursed Sails', description: 'All attacks apply status effects', type: 'combat' },
      { name: 'Lord of the Seas', description: 'Dominance over all other ships', type: 'utility' },
    ],
  },
  {
    id: 19,
    name: 'Phantom Helm',
    class: ShipClass.GHOST,
    rarity: ShipRarity.LEGENDARY,
    spriteIndex: 18, // Row 4, Col 2
    baseStats: { hull: 70, speed: 85, cargo: 90, maneuver: 95, cannon: 70 },
    abilities: [
      { name: 'Phase Shift', description: 'Become invisible to enemies', type: 'sail' },
      { name: 'Spirit Guide', description: 'Access hidden zones', type: 'utility' },
    ],
  },
  {
    id: 20,
    name: 'Kraken Sovereign',
    class: ShipClass.STORM,
    rarity: ShipRarity.LEGENDARY,
    spriteIndex: 19, // Row 4, Col 3
    baseStats: { hull: 95, speed: 60, cargo: 95, maneuver: 65, cannon: 90 },
    abilities: [
      { name: 'Kraken\'s Blessing', description: 'Summon water allies in battle', type: 'combat' },
      { name: 'Oceanic Mastery', description: 'Full control over marine encounters', type: 'utility' },
    ],
  },
];

// Utility function to get ship by ID
export const getShipById = (id: number): ShipBlueprint | undefined => {
  return SHIPS.find(ship => ship.id === id);
};

// Utility function to get upgrade ship
export const getUpgradeShip = (shipId: number): ShipBlueprint | undefined => {
  const ship = getShipById(shipId);
  return ship?.upgradesInto ? getShipById(ship.upgradesInto) : undefined;
};

// Utility function to get ships by class
export const getShipsByClass = (shipClass: ShipClass): ShipBlueprint[] => {
  return SHIPS.filter(ship => ship.class === shipClass);
};

// Utility function to get ships by rarity
export const getShipsByRarity = (rarity: ShipRarity): ShipBlueprint[] => {
  return SHIPS.filter(ship => ship.rarity === rarity);
};
