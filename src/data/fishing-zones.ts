// Fishing Zone definitions — each zone has a weighted pool of fish
//
// Zone → Scene mapping:
//   dock        → Beach 1 (dock fishing)
//   deep_water  → Beach 2 (dock fishing)
//   coral_reef  → Coral Atoll island (via SailingScene)
//   storm_zone  → Storm Reef island (via SailingScene)
//
// Every catchable type should appear in at least one early zone (dock or deep_water).
// Tier 3 (rare) fish are evolution-only — they don't spawn in wild pools.

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
    // Water — most common at the dock
    { textureKey: 'fish-2-02', weight: 10, minLevel: 3, maxLevel: 5 },  // Corsair Gold (Water, common)
    { textureKey: 'fish-3-07', weight: 5,  minLevel: 4, maxLevel: 7 },  // Tidal Swirl (Water, uncommon)
    // Nature
    { textureKey: 'fish-1-08', weight: 8,  minLevel: 3, maxLevel: 6 },  // Petalfin (Nature, common)
    { textureKey: 'fish-2-06', weight: 4,  minLevel: 4, maxLevel: 7 },  // Reef Crown (Nature, uncommon)
    // Electric
    { textureKey: 'fish-1-09', weight: 7,  minLevel: 3, maxLevel: 7 },  // Goldsplash (Electric, common)
    // Normal
    { textureKey: 'fish-2-14', weight: 6,  minLevel: 3, maxLevel: 6 },  // Isle Fish (Normal, uncommon)
    { textureKey: 'fish-1-07', weight: 7,  minLevel: 3, maxLevel: 5 },  // Sand Ray (Normal, common)
    // Fire — rare at dock, but catchable
    { textureKey: 'fish-2-05', weight: 3,  minLevel: 4, maxLevel: 7 },  // Powder Keg (Fire, common)
    // Storm — rare at dock
    { textureKey: 'fish-1-19', weight: 2,  minLevel: 5, maxLevel: 8 },  // Zephyr Angel (Storm, uncommon)
  ],
};

const deep_water: FishingZone = {
  id: 'deep_water',
  name: 'The Deep',
  description: 'Dark open ocean. Dangerous creatures lurk below.',
  fishPool: [
    { textureKey: 'fish-1-02', weight: 4,  minLevel: 8,  maxLevel: 12 },  // Skull Jelly (Abyssal)
    { textureKey: 'fish-1-03', weight: 3,  minLevel: 10, maxLevel: 15 },  // Void Goldfish (Abyssal)
    { textureKey: 'fish-1-14', weight: 5,  minLevel: 8,  maxLevel: 13 },  // Kelp Wraith (Nature)
    { textureKey: 'fish-1-15', weight: 2,  minLevel: 12, maxLevel: 15 },  // Magma Brute (Fire, rare)
    { textureKey: 'fish-2-17', weight: 1,  minLevel: 12, maxLevel: 15 },  // Scarred Shark (Water, rare)
    { textureKey: 'fish-2-09', weight: 3,  minLevel: 8,  maxLevel: 12 },  // Anchor Golem (Normal, rare)
    { textureKey: 'fish-1-13', weight: 3,  minLevel: 9,  maxLevel: 14 },  // Lure Angler (Abyssal)
  ],
};

const coral_reef: FishingZone = {
  id: 'coral_reef',
  name: 'Coral Reef',
  description: 'Vibrant reef teeming with colorful fish.',
  fishPool: [
    { textureKey: 'fish-1-06', weight: 6,  minLevel: 5, maxLevel: 9 },   // Crystal Shard (Water)
    { textureKey: 'fish-2-06', weight: 7,  minLevel: 5, maxLevel: 8 },   // Reef Crown (Nature)
    { textureKey: 'fish-2-10', weight: 5,  minLevel: 6, maxLevel: 10 },  // Boom Puffer (Fire)
    { textureKey: 'fish-3-06', weight: 4,  minLevel: 7, maxLevel: 10 },  // Compass Crab (Normal)
    { textureKey: 'fish-3-07', weight: 5,  minLevel: 5, maxLevel: 9 },   // Tidal Swirl (Water)
    { textureKey: 'fish-3-00', weight: 3,  minLevel: 7, maxLevel: 11 },  // Lantern Angler (Abyssal)
    { textureKey: 'fish-1-11', weight: 2,  minLevel: 8, maxLevel: 12 },  // Iron Steamer (Electric)
  ],
};

const storm_zone: FishingZone = {
  id: 'storm_zone',
  name: 'Storm Waters',
  description: 'Lightning-struck seas. Only the bravest fish here.',
  fishPool: [
    { textureKey: 'fish-1-16', weight: 2,  minLevel: 14, maxLevel: 18 },  // Storm Dragon (Storm, rare)
    { textureKey: 'fish-2-07', weight: 5,  minLevel: 10, maxLevel: 15 },  // Storm Wisp (Storm)
    { textureKey: 'fish-3-03', weight: 3,  minLevel: 13, maxLevel: 18 },  // Thunder Shark (Storm)
    { textureKey: 'fish-1-17', weight: 4,  minLevel: 10, maxLevel: 14 },  // Clockwork Gill (Electric)
    { textureKey: 'fish-2-18', weight: 2,  minLevel: 12, maxLevel: 16 },  // Astral Squid (Abyssal)
    { textureKey: 'fish-3-01', weight: 2,  minLevel: 13, maxLevel: 17 },  // Magma Tuna (Fire)
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
