// Fishing Zone definitions — each zone has a weighted pool of fish
// Used by BeachScene (dock) and future scenes (deep water, coral reef, storm)

export interface FishingZoneEntry {
  textureKey: string;
  weight: number;     // 1 = rare, 5 = common, 10 = very common
  minLevel: number;
  maxLevel: number;
}

export interface FishingZone {
  id: string;
  name: string;
  description: string;
  fishPool: FishingZoneEntry[];
}

// ── Zone definitions ──────────────────────────────────────────────────────────

const dock: FishingZone = {
  id: 'dock',
  name: 'Dock Shallows',
  description: 'Calm waters around the dock. Common fish hang out here.',
  fishPool: [
    { textureKey: 'fish-1-08', weight: 8,  minLevel: 3, maxLevel: 6 },  // Petalfin (flower leaf)
    { textureKey: 'fish-1-09', weight: 7,  minLevel: 3, maxLevel: 7 },  // Goldsplash (golden splash)
    { textureKey: 'fish-2-02', weight: 10, minLevel: 3, maxLevel: 5 },  // Corsair Gold (pirate goldfish)
    { textureKey: 'fish-2-09', weight: 5,  minLevel: 4, maxLevel: 7 },  // Anchor Golem (pufferfish)
    { textureKey: 'fish-2-14', weight: 6,  minLevel: 3, maxLevel: 6 },  // Isle Fish (palm tree fish)
  ],
};

const deep_water: FishingZone = {
  id: 'deep_water',
  name: 'The Deep',
  description: 'Dark open ocean. Dangerous creatures lurk below.',
  fishPool: [
    { textureKey: 'fish-1-02', weight: 4,  minLevel: 8,  maxLevel: 12 },  // Skull Jelly
    { textureKey: 'fish-1-03', weight: 3,  minLevel: 10, maxLevel: 15 },  // Void Goldfish (dark void)
    { textureKey: 'fish-1-14', weight: 5,  minLevel: 8,  maxLevel: 13 },  // Kelp Wraith
    { textureKey: 'fish-1-15', weight: 2,  minLevel: 12, maxLevel: 15 },  // Magma Brute (lava dark)
    { textureKey: 'fish-2-17', weight: 1,  minLevel: 12, maxLevel: 15 },  // Scarred Shark
  ],
};

const coral_reef: FishingZone = {
  id: 'coral_reef',
  name: 'Coral Reef',
  description: 'Vibrant reef teeming with colorful fish.',
  fishPool: [
    { textureKey: 'fish-1-06', weight: 6,  minLevel: 5, maxLevel: 9 },   // Crystal Shard
    { textureKey: 'fish-2-06', weight: 7,  minLevel: 5, maxLevel: 8 },   // Reef Crown (coral reef)
    { textureKey: 'fish-2-10', weight: 5,  minLevel: 6, maxLevel: 10 },  // Boom Puffer (coral reef 2)
    { textureKey: 'fish-3-06', weight: 4,  minLevel: 7, maxLevel: 10 },  // Compass Crab
    { textureKey: 'fish-3-07', weight: 5,  minLevel: 5, maxLevel: 9 },   // Tidal Swirl
  ],
};

const storm_zone: FishingZone = {
  id: 'storm_zone',
  name: 'Storm Waters',
  description: 'Lightning-struck seas. Only the bravest fish here.',
  fishPool: [
    { textureKey: 'fish-1-16', weight: 2,  minLevel: 14, maxLevel: 18 },  // Storm Dragon (lightning dragon)
    { textureKey: 'fish-2-07', weight: 5,  minLevel: 10, maxLevel: 15 },  // Storm Wisp (cloud storm)
    { textureKey: 'fish-3-03', weight: 3,  minLevel: 13, maxLevel: 18 },  // Thunder Shark
    { textureKey: 'fish-1-17', weight: 4,  minLevel: 10, maxLevel: 14 },  // Clockwork Gill (steampunk mech)
  ],
};

// ── Exported map for easy lookup ──────────────────────────────────────────────

export const FISHING_ZONES: Record<string, FishingZone> = {
  dock,
  deep_water,
  coral_reef,
  storm_zone,
};

// ── Helper: weighted random fish selection from a zone ────────────────────────

export function rollFishFromZone(zone: FishingZone): { textureKey: string; level: number } {
  const pool = zone.fishPool;

  // Calculate total weight
  const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);

  // Roll a random number in [0, totalWeight)
  let roll = Math.random() * totalWeight;

  // Walk through entries, subtracting weights until we find the winner
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) {
      const level = entry.minLevel + Math.floor(Math.random() * (entry.maxLevel - entry.minLevel + 1));
      return { textureKey: entry.textureKey, level };
    }
  }

  // Fallback (should never reach here, but just in case of floating point edge)
  const fallback = pool[pool.length - 1];
  return {
    textureKey: fallback.textureKey,
    level: fallback.minLevel + Math.floor(Math.random() * (fallback.maxLevel - fallback.minLevel + 1)),
  };
}
