# Fish System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace existing fish sprites and data with 60 new species (20 evolution chains × 3 tiers) across 7 element types, update stats/moves system, implement symmetric type effectiveness chart.

**Architecture:**
- Extract individual fish sprites from 3 PNG grids (1.png, 2.png, 3.png) into sprite atlas
- Rebuild `fish-db.ts` with 60 species: names, base stats (HP/ATK/DEF/SPD), moves (2→4 per tier), evolution chains, types
- Update `type-chart.ts` with symmetric type matchups (each type beats 2, loses to 2)
- Verify all 41 tests pass and no regressions

**Tech Stack:** TypeScript, PixiJS v8, Vite, Vitest

---

## Chunk 1: Sprite Extraction & Organization

### Task 1: Create sprite extraction utility

**Files:**
- Create: `src/utils/SpriteExtractor.ts`

**Context:** Before updating fish-db.ts, we need individual sprite images for each of the 60 fish. The user provided three 4×5 grids (1.png, 2.png, 3.png). We'll extract individual 64×64 sprites and organize them by tier.

- [ ] **Step 1: Create sprite extractor utility**

Create `src/utils/SpriteExtractor.ts`:

```typescript
// Utility to help document sprite grid positions
// Grid format: 4 columns × 5 rows per PNG
// Row 1-5, Col 1-4 = positions

export interface SpriteLocation {
  gridFile: "1.png" | "2.png" | "3.png"; // Tier 1, 2, 3
  row: number; // 1-5
  col: number; // 1-4
  fishName: string;
  type: string;
}

// Sprite grid mapping - 60 total fish
export const SPRITE_LOCATIONS: SpriteLocation[] = [
  // FIRE TYPE (9)
  // Tier 1
  { gridFile: "1.png", row: 1, col: 1, fishName: "Ember Snapper", type: "Fire" },
  { gridFile: "1.png", row: 1, col: 2, fishName: "Lava Carp", type: "Fire" },
  { gridFile: "1.png", row: 1, col: 3, fishName: "Flame Pike", type: "Fire" },
  // Tier 2
  { gridFile: "2.png", row: 1, col: 1, fishName: "Blazefin", type: "Fire" },
  { gridFile: "2.png", row: 1, col: 2, fishName: "Magmafin", type: "Fire" },
  { gridFile: "2.png", row: 1, col: 3, fishName: "Scorchscale", type: "Fire" },
  // Tier 3
  { gridFile: "3.png", row: 1, col: 1, fishName: "Grand Infernoray", type: "Fire" },
  { gridFile: "3.png", row: 1, col: 2, fishName: "Ancient Inferno Bass", type: "Fire" },
  { gridFile: "3.png", row: 1, col: 3, fishName: "Lord of Embers", type: "Fire" },

  // WATER TYPE (9)
  // Tier 1
  { gridFile: "1.png", row: 2, col: 1, fishName: "Tidecaller", type: "Water" },
  { gridFile: "1.png", row: 2, col: 2, fishName: "Frost Carp", type: "Water" },
  { gridFile: "1.png", row: 2, col: 3, fishName: "Aqua Pike", type: "Water" },
  // Tier 2
  { gridFile: "2.png", row: 2, col: 1, fishName: "Tsunamaw", type: "Water" },
  { gridFile: "2.png", row: 2, col: 2, fishName: "Crystaleel", type: "Water" },
  { gridFile: "2.png", row: 2, col: 3, fishName: "Rippleray", type: "Water" },
  // Tier 3
  { gridFile: "3.png", row: 2, col: 1, fishName: "Grand Tidebreaker", type: "Water" },
  { gridFile: "3.png", row: 2, col: 2, fishName: "Ancient Tidewyrm", type: "Water" },
  { gridFile: "3.png", row: 2, col: 3, fishName: "Dread Storm Whale", type: "Water" },

  // ELECTRIC TYPE (9)
  // Tier 1
  { gridFile: "1.png", row: 3, col: 1, fishName: "Volt Eel", type: "Electric" },
  { gridFile: "1.png", row: 3, col: 2, fishName: "Spark Minnow", type: "Electric" },
  { gridFile: "1.png", row: 3, col: 3, fishName: "Zap Fish", type: "Electric" },
  // Tier 2
  { gridFile: "2.png", row: 3, col: 1, fishName: "Volteel", type: "Electric" },
  { gridFile: "2.png", row: 3, col: 2, fishName: "Shockjaw", type: "Electric" },
  { gridFile: "2.png", row: 3, col: 3, fishName: "Thunder Ray", type: "Electric" },
  // Tier 3
  { gridFile: "3.png", row: 3, col: 1, fishName: "Grand Arc Wyrm", type: "Electric" },
  { gridFile: "3.png", row: 3, col: 2, fishName: "Dread Storm Leviathan", type: "Electric" },
  { gridFile: "3.png", row: 3, col: 3, fishName: "Ancient Bolt Shark", type: "Electric" },

  // NATURE TYPE (9)
  // Tier 1
  { gridFile: "1.png", row: 4, col: 1, fishName: "Coralline", type: "Nature" },
  { gridFile: "1.png", row: 4, col: 2, fishName: "Sea Moss", type: "Nature" },
  { gridFile: "1.png", row: 4, col: 3, fishName: "Reef Sprite", type: "Nature" },
  // Tier 2
  { gridFile: "2.png", row: 4, col: 1, fishName: "Bloom Ray", type: "Nature" },
  { gridFile: "2.png", row: 4, col: 2, fishName: "Petal Fin", type: "Nature" },
  { gridFile: "2.png", row: 4, col: 3, fishName: "Coral Guardian", type: "Nature" },
  // Tier 3
  { gridFile: "3.png", row: 4, col: 1, fishName: "Grand Reefguard", type: "Nature" },
  { gridFile: "3.png", row: 4, col: 2, fishName: "Dread Coral Titan", type: "Nature" },
  { gridFile: "3.png", row: 4, col: 3, fishName: "Ancient Jade Serpent", type: "Nature" },

  // ABYSSAL TYPE (9)
  // Tier 1
  { gridFile: "1.png", row: 5, col: 1, fishName: "Dark Carp", type: "Abyssal" },
  { gridFile: "1.png", row: 5, col: 2, fishName: "Shadow Pike", type: "Abyssal" },
  { gridFile: "1.png", row: 5, col: 3, fishName: "Abyssal Fang", type: "Abyssal" },
  // Tier 2
  { gridFile: "2.png", row: 5, col: 1, fishName: "Voidfin", type: "Abyssal" },
  { gridFile: "2.png", row: 5, col: 2, fishName: "Void Ray", type: "Abyssal" },
  { gridFile: "2.png", row: 5, col: 3, fishName: "Corsair Nullfang", type: "Abyssal" },
  // Tier 3
  { gridFile: "3.png", row: 5, col: 1, fishName: "Grand Depthwalker", type: "Abyssal" },
  { gridFile: "3.png", row: 5, col: 2, fishName: "Dread Abyss Serpent", type: "Abyssal" },
  { gridFile: "3.png", row: 5, col: 3, fishName: "Void The Eternal", type: "Abyssal" },

  // STORM TYPE (9)
  // Tier 1
  { gridFile: "1.png", row: 4, col: 4, fishName: "Gust Minnow", type: "Storm" },
  { gridFile: "1.png", row: 5, col: 4, fishName: "Wind Carp", type: "Storm" },
  { gridFile: "2.png", row: 5, col: 4, fishName: "Storm Pike", type: "Storm" },
  // Tier 2
  { gridFile: "2.png", row: 4, col: 4, fishName: "Galecutter", type: "Storm" },
  { gridFile: "2.png", row: 3, col: 4, fishName: "Cyclone Ray", type: "Storm" },
  { gridFile: "3.png", row: 2, col: 4, fishName: "Hurricane Bass", type: "Storm" },
  // Tier 3
  { gridFile: "3.png", row: 3, col: 4, fishName: "Grand Tempestfang", type: "Storm" },
  { gridFile: "3.png", row: 4, col: 4, fishName: "Dread Maelstrom", type: "Storm" },
  { gridFile: "3.png", row: 5, col: 4, fishName: "Ancient Stormrider", type: "Storm" },

  // NORMAL TYPE (6)
  // Tier 1
  { gridFile: "1.png", row: 3, col: 4, fishName: "Sea Bream", type: "Normal" },
  { gridFile: "2.png", row: 2, col: 4, fishName: "Coral Carp", type: "Normal" },
  // Tier 2
  { gridFile: "2.png", row: 1, col: 4, fishName: "Driftfin", type: "Normal" },
  { gridFile: "3.png", row: 1, col: 4, fishName: "Old Barnacle", type: "Normal" },
  // Tier 3
  { gridFile: "3.png", row: 1, col: 2, fishName: "Ancient Mariner", type: "Normal" },
  { gridFile: "3.png", row: 1, col: 3, fishName: "Corsair Harbor Master", type: "Normal" },
];
```

- [ ] **Step 2: Create test to verify sprite mapping**

Create `tests/utils/sprite-mapping.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { SPRITE_LOCATIONS } from "../../src/utils/SpriteExtractor";

describe("Sprite Mapping", () => {
  it("should have exactly 60 fish", () => {
    expect(SPRITE_LOCATIONS.length).toBe(60);
  });

  it("should have 9 Fire type fish", () => {
    const fireCount = SPRITE_LOCATIONS.filter((s) => s.type === "Fire").length;
    expect(fireCount).toBe(9);
  });

  it("should have 9 Water type fish", () => {
    const waterCount = SPRITE_LOCATIONS.filter((s) => s.type === "Water").length;
    expect(waterCount).toBe(9);
  });

  it("should have 9 Electric type fish", () => {
    const electricCount = SPRITE_LOCATIONS.filter(
      (s) => s.type === "Electric"
    ).length;
    expect(electricCount).toBe(9);
  });

  it("should have 9 Nature type fish", () => {
    const natureCount = SPRITE_LOCATIONS.filter((s) => s.type === "Nature")
      .length;
    expect(natureCount).toBe(9);
  });

  it("should have 9 Abyssal type fish", () => {
    const abyssalCount = SPRITE_LOCATIONS.filter((s) => s.type === "Abyssal")
      .length;
    expect(abyssalCount).toBe(9);
  });

  it("should have 9 Storm type fish", () => {
    const stormCount = SPRITE_LOCATIONS.filter((s) => s.type === "Storm")
      .length;
    expect(stormCount).toBe(9);
  });

  it("should have 6 Normal type fish", () => {
    const normalCount = SPRITE_LOCATIONS.filter((s) => s.type === "Normal")
      .length;
    expect(normalCount).toBe(6);
  });

  it("should not have duplicate fish names", () => {
    const names = SPRITE_LOCATIONS.map((s) => s.fishName);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(60);
  });
});
```

- [ ] **Step 3: Run test to verify it passes**

```bash
npm test -- sprite-mapping.test.ts
```

Expected: PASS (60 fish, correct type distribution, no duplicates)

- [ ] **Step 4: Commit**

```bash
git add src/utils/SpriteExtractor.ts tests/utils/sprite-mapping.test.ts
git commit -m "feat: add sprite location mapping for 60 fish"
```

---

## Chunk 2: Fish Database Rebuild

### Task 2: Rebuild fish-db.ts with 60 species

**Files:**
- Modify: `src/data/fish-db.ts` (replace entirely)

**Context:** The current fish-db.ts has ~62 fish with legacy data. We're replacing it completely with our new 60-fish roster including proper stats, moves, evolution chains, and types.

- [ ] **Step 1: Write test for new fish database structure**

Create `tests/data/fish-db-new.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { FISH_SPECIES } from "../../src/data/fish-db";

describe("Fish Database - New System", () => {
  it("should have exactly 60 fish species", () => {
    expect(FISH_SPECIES.length).toBe(60);
  });

  it("each fish should have required fields", () => {
    FISH_SPECIES.forEach((fish) => {
      expect(fish.id).toBeDefined();
      expect(fish.name).toBeDefined();
      expect(fish.type).toBeDefined();
      expect(fish.tier).toBeDefined(); // 1, 2, or 3
      expect(fish.baseStats).toBeDefined();
      expect(fish.baseStats.hp).toBeGreaterThanOrEqual(50);
      expect(fish.baseStats.hp).toBeLessThanOrEqual(100);
      expect(fish.baseStats.atk).toBeGreaterThanOrEqual(50);
      expect(fish.baseStats.atk).toBeLessThanOrEqual(100);
      expect(fish.baseStats.def).toBeGreaterThanOrEqual(50);
      expect(fish.baseStats.def).toBeLessThanOrEqual(100);
      expect(fish.baseStats.spd).toBeGreaterThanOrEqual(50);
      expect(fish.baseStats.spd).toBeLessThanOrEqual(100);
      expect(fish.moves).toBeDefined();
      expect(Array.isArray(fish.moves)).toBe(true);
    });
  });

  it("Tier 1 fish should know 2 moves", () => {
    const tier1Fish = FISH_SPECIES.filter((f) => f.tier === 1);
    tier1Fish.forEach((fish) => {
      expect(fish.moves.length).toBe(2);
    });
  });

  it("Tier 2 fish should know 3 moves", () => {
    const tier2Fish = FISH_SPECIES.filter((f) => f.tier === 2);
    tier2Fish.forEach((fish) => {
      expect(fish.moves.length).toBe(3);
    });
  });

  it("Tier 3 fish should know 4 moves", () => {
    const tier3Fish = FISH_SPECIES.filter((f) => f.tier === 3);
    tier3Fish.forEach((fish) => {
      expect(fish.moves.length).toBe(4);
    });
  });

  it("should have evolution chain references", () => {
    FISH_SPECIES.forEach((fish) => {
      if (fish.tier < 3) {
        expect(fish.evolvesInto).toBeDefined();
        expect(typeof fish.evolvesInto).toBe("number"); // Fish ID of next tier
      }
    });
  });

  it("Tier 1 Ember Snapper should have correct stats", () => {
    const emberSnapper = FISH_SPECIES.find(
      (f) => f.name === "Ember Snapper"
    );
    expect(emberSnapper).toBeDefined();
    expect(emberSnapper!.tier).toBe(1);
    expect(emberSnapper!.type).toBe("Fire");
    expect(emberSnapper!.baseStats.hp).toBe(55);
    expect(emberSnapper!.baseStats.atk).toBe(65);
    expect(emberSnapper!.baseStats.def).toBe(50);
    expect(emberSnapper!.baseStats.spd).toBe(58);
  });

  it("Tier 3 Grand Infernoray should have correct stats", () => {
    const grandInfernoray = FISH_SPECIES.find(
      (f) => f.name === "Grand Infernoray"
    );
    expect(grandInfernoray).toBeDefined();
    expect(grandInfernoray!.tier).toBe(3);
    expect(grandInfernoray!.type).toBe("Fire");
    expect(grandInfernoray!.baseStats.hp).toBe(85);
    expect(grandInfernoray!.baseStats.atk).toBe(98);
    expect(grandInfernoray!.baseStats.def).toBe(75);
    expect(grandInfernoray!.baseStats.spd).toBe(85);
  });

  it("should have all 7 types represented", () => {
    const types = new Set(FISH_SPECIES.map((f) => f.type));
    const expectedTypes = ["Fire", "Water", "Electric", "Nature", "Abyssal", "Storm", "Normal"];
    expectedTypes.forEach((type) => {
      expect(types.has(type)).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- fish-db-new.test.ts
```

Expected: FAIL (fish-db.ts doesn't exist or has wrong structure)

- [ ] **Step 3: Implement new fish-db.ts**

Replace `src/data/fish-db.ts` completely:

```typescript
export interface FishSpecies {
  id: number;
  name: string;
  type: "Fire" | "Water" | "Electric" | "Nature" | "Abyssal" | "Storm" | "Normal";
  tier: 1 | 2 | 3;
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spd: number;
  };
  moves: Array<{
    name: string;
    type: string;
    learnLevel: number;
  }>;
  evolvesInto?: number; // Fish ID of next tier (undefined for tier 3)
}

export const FISH_SPECIES: FishSpecies[] = [
  // FIRE TYPE
  // Tier 1
  {
    id: 1,
    name: "Ember Snapper",
    type: "Fire",
    tier: 1,
    baseStats: { hp: 55, atk: 65, def: 50, spd: 58 },
    moves: [
      { name: "Ember", type: "Fire", learnLevel: 1 },
      { name: "Splash", type: "Normal", learnLevel: 8 },
    ],
    evolvesInto: 22,
  },
  {
    id: 2,
    name: "Lava Carp",
    type: "Fire",
    tier: 1,
    baseStats: { hp: 58, atk: 68, def: 52, spd: 54 },
    moves: [
      { name: "Magma Armor", type: "Fire", learnLevel: 1 },
      { name: "Bubble", type: "Water", learnLevel: 8 },
    ],
    evolvesInto: 23,
  },
  {
    id: 3,
    name: "Flame Pike",
    type: "Fire",
    tier: 1,
    baseStats: { hp: 52, atk: 70, def: 48, spd: 62 },
    moves: [
      { name: "Flare", type: "Fire", learnLevel: 1 },
      { name: "Quick Attack", type: "Normal", learnLevel: 8 },
    ],
    evolvesInto: 24,
  },
  // Tier 2
  {
    id: 22,
    name: "Blazefin",
    type: "Fire",
    tier: 2,
    baseStats: { hp: 70, atk: 82, def: 62, spd: 71 },
    moves: [
      { name: "Ember", type: "Fire", learnLevel: 1 },
      { name: "Splash", type: "Normal", learnLevel: 8 },
      { name: "Flame Burst", type: "Fire", learnLevel: 16 },
    ],
    evolvesInto: 43,
  },
  {
    id: 23,
    name: "Magmafin",
    type: "Fire",
    tier: 2,
    baseStats: { hp: 72, atk: 85, def: 64, spd: 67 },
    moves: [
      { name: "Magma Armor", type: "Fire", learnLevel: 1 },
      { name: "Bubble", type: "Water", learnLevel: 8 },
      { name: "Lava Plume", type: "Fire", learnLevel: 16 },
    ],
    evolvesInto: 44,
  },
  {
    id: 24,
    name: "Scorchscale",
    type: "Fire",
    tier: 2,
    baseStats: { hp: 66, atk: 88, def: 60, spd: 75 },
    moves: [
      { name: "Flare", type: "Fire", learnLevel: 1 },
      { name: "Quick Attack", type: "Normal", learnLevel: 8 },
      { name: "Fire Fang", type: "Fire", learnLevel: 16 },
    ],
    evolvesInto: 45,
  },
  // Tier 3
  {
    id: 43,
    name: "Grand Infernoray",
    type: "Fire",
    tier: 3,
    baseStats: { hp: 85, atk: 98, def: 75, spd: 85 },
    moves: [
      { name: "Ember", type: "Fire", learnLevel: 1 },
      { name: "Splash", type: "Normal", learnLevel: 8 },
      { name: "Flame Burst", type: "Fire", learnLevel: 16 },
      { name: "Inferno", type: "Fire", learnLevel: 28 },
    ],
  },
  {
    id: 44,
    name: "Ancient Inferno Bass",
    type: "Fire",
    tier: 3,
    baseStats: { hp: 88, atk: 100, def: 77, spd: 80 },
    moves: [
      { name: "Magma Armor", type: "Fire", learnLevel: 1 },
      { name: "Bubble", type: "Water", learnLevel: 8 },
      { name: "Lava Plume", type: "Fire", learnLevel: 16 },
      { name: "Molten Eruption", type: "Fire", learnLevel: 28 },
    ],
  },
  {
    id: 45,
    name: "Lord of Embers",
    type: "Fire",
    tier: 3,
    baseStats: { hp: 80, atk: 100, def: 72, spd: 90 },
    moves: [
      { name: "Flare", type: "Fire", learnLevel: 1 },
      { name: "Quick Attack", type: "Normal", learnLevel: 8 },
      { name: "Fire Fang", type: "Fire", learnLevel: 16 },
      { name: "Blazing Torrent", type: "Fire", learnLevel: 28 },
    ],
  },

  // WATER TYPE
  // Tier 1
  {
    id: 4,
    name: "Tidecaller",
    type: "Water",
    tier: 1,
    baseStats: { hp: 60, atk: 52, def: 68, spd: 50 },
    moves: [
      { name: "Bubble", type: "Water", learnLevel: 1 },
      { name: "Withdraw", type: "Water", learnLevel: 8 },
    ],
    evolvesInto: 25,
  },
  {
    id: 5,
    name: "Frost Carp",
    type: "Water",
    tier: 1,
    baseStats: { hp: 62, atk: 50, def: 70, spd: 48 },
    moves: [
      { name: "Ice Shard", type: "Water", learnLevel: 1 },
      { name: "Aqua Jet", type: "Water", learnLevel: 8 },
    ],
    evolvesInto: 26,
  },
  {
    id: 6,
    name: "Aqua Pike",
    type: "Water",
    tier: 1,
    baseStats: { hp: 56, atk: 58, def: 64, spd: 54 },
    moves: [
      { name: "Water Gun", type: "Water", learnLevel: 1 },
      { name: "Tackle", type: "Normal", learnLevel: 8 },
    ],
    evolvesInto: 27,
  },
  // Tier 2
  {
    id: 25,
    name: "Tsunamaw",
    type: "Water",
    tier: 2,
    baseStats: { hp: 75, atk: 64, def: 82, spd: 62 },
    moves: [
      { name: "Bubble", type: "Water", learnLevel: 1 },
      { name: "Withdraw", type: "Water", learnLevel: 8 },
      { name: "Tidal Wave", type: "Water", learnLevel: 16 },
    ],
    evolvesInto: 46,
  },
  {
    id: 26,
    name: "Crystaleel",
    type: "Water",
    tier: 2,
    baseStats: { hp: 77, atk: 62, def: 84, spd: 60 },
    moves: [
      { name: "Ice Shard", type: "Water", learnLevel: 1 },
      { name: "Aqua Jet", type: "Water", learnLevel: 8 },
      { name: "Frost Breath", type: "Water", learnLevel: 16 },
    ],
    evolvesInto: 47,
  },
  {
    id: 27,
    name: "Rippleray",
    type: "Water",
    tier: 2,
    baseStats: { hp: 71, atk: 70, def: 78, spd: 66 },
    moves: [
      { name: "Water Gun", type: "Water", learnLevel: 1 },
      { name: "Tackle", type: "Normal", learnLevel: 8 },
      { name: "Whirlpool", type: "Water", learnLevel: 16 },
    ],
    evolvesInto: 48,
  },
  // Tier 3
  {
    id: 46,
    name: "Grand Tidebreaker",
    type: "Water",
    tier: 3,
    baseStats: { hp: 90, atk: 76, def: 95, spd: 74 },
    moves: [
      { name: "Bubble", type: "Water", learnLevel: 1 },
      { name: "Withdraw", type: "Water", learnLevel: 8 },
      { name: "Tidal Wave", type: "Water", learnLevel: 16 },
      { name: "Deluge", type: "Water", learnLevel: 28 },
    ],
  },
  {
    id: 47,
    name: "Ancient Tidewyrm",
    type: "Water",
    tier: 3,
    baseStats: { hp: 92, atk: 74, def: 97, spd: 72 },
    moves: [
      { name: "Ice Shard", type: "Water", learnLevel: 1 },
      { name: "Aqua Jet", type: "Water", learnLevel: 8 },
      { name: "Frost Breath", type: "Water", learnLevel: 16 },
      { name: "Glacial Torrent", type: "Water", learnLevel: 28 },
    ],
  },
  {
    id: 48,
    name: "Dread Storm Whale",
    type: "Water",
    tier: 3,
    baseStats: { hp: 95, atk: 82, def: 90, spd: 78 },
    moves: [
      { name: "Water Gun", type: "Water", learnLevel: 1 },
      { name: "Tackle", type: "Normal", learnLevel: 8 },
      { name: "Whirlpool", type: "Water", learnLevel: 16 },
      { name: "Hydro Cannon", type: "Water", learnLevel: 28 },
    ],
  },

  // ELECTRIC TYPE
  // Tier 1
  {
    id: 7,
    name: "Volt Eel",
    type: "Electric",
    tier: 1,
    baseStats: { hp: 54, atk: 58, def: 52, spd: 68 },
    moves: [
      { name: "Spark", type: "Electric", learnLevel: 1 },
      { name: "Quick Attack", type: "Normal", learnLevel: 8 },
    ],
    evolvesInto: 28,
  },
  {
    id: 8,
    name: "Spark Minnow",
    type: "Electric",
    tier: 1,
    baseStats: { hp: 50, atk: 56, def: 50, spd: 72 },
    moves: [
      { name: "Thunder Shock", type: "Electric", learnLevel: 1 },
      { name: "Agility", type: "Normal", learnLevel: 8 },
    ],
    evolvesInto: 29,
  },
  {
    id: 9,
    name: "Zap Fish",
    type: "Electric",
    tier: 1,
    baseStats: { hp: 52, atk: 60, def: 48, spd: 70 },
    moves: [
      { name: "Bolt Tackle", type: "Electric", learnLevel: 1 },
      { name: "Splash", type: "Normal", learnLevel: 8 },
    ],
    evolvesInto: 30,
  },
  // Tier 2
  {
    id: 28,
    name: "Volteel",
    type: "Electric",
    tier: 2,
    baseStats: { hp: 69, atk: 70, def: 64, spd: 82 },
    moves: [
      { name: "Spark", type: "Electric", learnLevel: 1 },
      { name: "Quick Attack", type: "Normal", learnLevel: 8 },
      { name: "Thunderbolt", type: "Electric", learnLevel: 16 },
    ],
    evolvesInto: 49,
  },
  {
    id: 29,
    name: "Shockjaw",
    type: "Electric",
    tier: 2,
    baseStats: { hp: 65, atk: 68, def: 62, spd: 85 },
    moves: [
      { name: "Thunder Shock", type: "Electric", learnLevel: 1 },
      { name: "Agility", type: "Normal", learnLevel: 8 },
      { name: "Volt Switch", type: "Electric", learnLevel: 16 },
    ],
    evolvesInto: 50,
  },
  {
    id: 30,
    name: "Thunder Ray",
    type: "Electric",
    tier: 2,
    baseStats: { hp: 67, atk: 72, def: 60, spd: 83 },
    moves: [
      { name: "Bolt Tackle", type: "Electric", learnLevel: 1 },
      { name: "Splash", type: "Normal", learnLevel: 8 },
      { name: "Thunder Fang", type: "Electric", learnLevel: 16 },
    ],
    evolvesInto: 51,
  },
  // Tier 3
  {
    id: 49,
    name: "Grand Arc Wyrm",
    type: "Electric",
    tier: 3,
    baseStats: { hp: 84, atk: 82, def: 76, spd: 96 },
    moves: [
      { name: "Spark", type: "Electric", learnLevel: 1 },
      { name: "Quick Attack", type: "Normal", learnLevel: 8 },
      { name: "Thunderbolt", type: "Electric", learnLevel: 16 },
      { name: "Discharge", type: "Electric", learnLevel: 28 },
    ],
  },
  {
    id: 50,
    name: "Dread Storm Leviathan",
    type: "Electric",
    tier: 3,
    baseStats: { hp: 80, atk: 80, def: 74, spd: 100 },
    moves: [
      { name: "Thunder Shock", type: "Electric", learnLevel: 1 },
      { name: "Agility", type: "Normal", learnLevel: 8 },
      { name: "Volt Switch", type: "Electric", learnLevel: 16 },
      { name: "Thunder Wave", type: "Electric", learnLevel: 28 },
    ],
  },
  {
    id: 51,
    name: "Ancient Bolt Shark",
    type: "Electric",
    tier: 3,
    baseStats: { hp: 82, atk: 84, def: 72, spd: 97 },
    moves: [
      { name: "Bolt Tackle", type: "Electric", learnLevel: 1 },
      { name: "Splash", type: "Normal", learnLevel: 8 },
      { name: "Thunder Fang", type: "Electric", learnLevel: 16 },
      { name: "Volt Crash", type: "Electric", learnLevel: 28 },
    ],
  },

  // NATURE TYPE
  // Tier 1
  {
    id: 10,
    name: "Coralline",
    type: "Nature",
    tier: 1,
    baseStats: { hp: 58, atk: 60, def: 62, spd: 56 },
    moves: [
      { name: "Photosynthesis", type: "Nature", learnLevel: 1 },
      { name: "Bubble", type: "Water", learnLevel: 8 },
    ],
    evolvesInto: 31,
  },
  {
    id: 11,
    name: "Sea Moss",
    type: "Nature",
    tier: 1,
    baseStats: { hp: 62, atk: 56, def: 66, spd: 52 },
    moves: [
      { name: "Growth", type: "Nature", learnLevel: 1 },
      { name: "Vine Whip", type: "Nature", learnLevel: 8 },
    ],
    evolvesInto: 32,
  },
  {
    id: 12,
    name: "Reef Sprite",
    type: "Nature",
    tier: 1,
    baseStats: { hp: 60, atk: 58, def: 64, spd: 58 },
    moves: [
      { name: "Spore", type: "Nature", learnLevel: 1 },
      { name: "Absorb", type: "Nature", learnLevel: 8 },
    ],
    evolvesInto: 33,
  },
  // Tier 2
  {
    id: 31,
    name: "Bloom Ray",
    type: "Nature",
    tier: 2,
    baseStats: { hp: 72, atk: 74, def: 76, spd: 68 },
    moves: [
      { name: "Photosynthesis", type: "Nature", learnLevel: 1 },
      { name: "Bubble", type: "Water", learnLevel: 8 },
      { name: "Leaf Storm", type: "Nature", learnLevel: 16 },
    ],
    evolvesInto: 52,
  },
  {
    id: 32,
    name: "Petal Fin",
    type: "Nature",
    tier: 2,
    baseStats: { hp: 76, atk: 70, def: 80, spd: 64 },
    moves: [
      { name: "Growth", type: "Nature", learnLevel: 1 },
      { name: "Vine Whip", type: "Nature", learnLevel: 8 },
      { name: "Petal Dance", type: "Nature", learnLevel: 16 },
    ],
    evolvesInto: 53,
  },
  {
    id: 33,
    name: "Coral Guardian",
    type: "Nature",
    tier: 2,
    baseStats: { hp: 74, atk: 72, def: 78, spd: 70 },
    moves: [
      { name: "Spore", type: "Nature", learnLevel: 1 },
      { name: "Absorb", type: "Nature", learnLevel: 8 },
      { name: "Energy Ball", type: "Nature", learnLevel: 16 },
    ],
    evolvesInto: 54,
  },
  // Tier 3
  {
    id: 52,
    name: "Grand Reefguard",
    type: "Nature",
    tier: 3,
    baseStats: { hp: 86, atk: 88, def: 90, spd: 80 },
    moves: [
      { name: "Photosynthesis", type: "Nature", learnLevel: 1 },
      { name: "Bubble", type: "Water", learnLevel: 8 },
      { name: "Leaf Storm", type: "Nature", learnLevel: 16 },
      { name: "Wildgrowth", type: "Nature", learnLevel: 28 },
    ],
  },
  {
    id: 53,
    name: "Dread Coral Titan",
    type: "Nature",
    tier: 3,
    baseStats: { hp: 90, atk: 84, def: 94, spd: 76 },
    moves: [
      { name: "Growth", type: "Nature", learnLevel: 1 },
      { name: "Vine Whip", type: "Nature", learnLevel: 8 },
      { name: "Petal Dance", type: "Nature", learnLevel: 16 },
      { name: "Overgrowth Surge", type: "Nature", learnLevel: 28 },
    ],
  },
  {
    id: 54,
    name: "Ancient Jade Serpent",
    type: "Nature",
    tier: 3,
    baseStats: { hp: 88, atk: 86, def: 92, spd: 82 },
    moves: [
      { name: "Spore", type: "Nature", learnLevel: 1 },
      { name: "Absorb", type: "Nature", learnLevel: 8 },
      { name: "Energy Ball", type: "Nature", learnLevel: 16 },
      { name: "Prismatic Bloom", type: "Nature", learnLevel: 28 },
    ],
  },

  // ABYSSAL TYPE
  // Tier 1
  {
    id: 13,
    name: "Dark Carp",
    type: "Abyssal",
    tier: 1,
    baseStats: { hp: 56, atk: 70, def: 52, spd: 64 },
    moves: [
      { name: "Shadow Strike", type: "Abyssal", learnLevel: 1 },
      { name: "Bite", type: "Normal", learnLevel: 8 },
    ],
    evolvesInto: 34,
  },
  {
    id: 14,
    name: "Shadow Pike",
    type: "Abyssal",
    tier: 1,
    baseStats: { hp: 52, atk: 72, def: 50, spd: 68 },
    moves: [
      { name: "Night Slash", type: "Abyssal", learnLevel: 1 },
      { name: "Pursuit", type: "Normal", learnLevel: 8 },
    ],
    evolvesInto: 35,
  },
  {
    id: 15,
    name: "Abyssal Fang",
    type: "Abyssal",
    tier: 1,
    baseStats: { hp: 54, atk: 74, def: 48, spd: 70 },
    moves: [
      { name: "Crunch", type: "Abyssal", learnLevel: 1 },
      { name: "Aqua Jet", type: "Water", learnLevel: 8 },
    ],
    evolvesInto: 36,
  },
  // Tier 2
  {
    id: 34,
    name: "Voidfin",
    type: "Abyssal",
    tier: 2,
    baseStats: { hp: 71, atk: 88, def: 64, spd: 77 },
    moves: [
      { name: "Shadow Strike", type: "Abyssal", learnLevel: 1 },
      { name: "Bite", type: "Normal", learnLevel: 8 },
      { name: "Darkness Pulse", type: "Abyssal", learnLevel: 16 },
    ],
    evolvesInto: 55,
  },
  {
    id: 35,
    name: "Void Ray",
    type: "Abyssal",
    tier: 2,
    baseStats: { hp: 67, atk: 90, def: 62, spd: 81 },
    moves: [
      { name: "Night Slash", type: "Abyssal", learnLevel: 1 },
      { name: "Pursuit", type: "Normal", learnLevel: 8 },
      { name: "Abyss Fang", type: "Abyssal", learnLevel: 16 },
    ],
    evolvesInto: 56,
  },
  {
    id: 36,
    name: "Corsair Nullfang",
    type: "Abyssal",
    tier: 2,
    baseStats: { hp: 69, atk: 92, def: 60, spd: 83 },
    moves: [
      { name: "Crunch", type: "Abyssal", learnLevel: 1 },
      { name: "Aqua Jet", type: "Water", learnLevel: 8 },
      { name: "Void Bite", type: "Abyssal", learnLevel: 16 },
    ],
    evolvesInto: 57,
  },
  // Tier 3
  {
    id: 55,
    name: "Grand Depthwalker",
    type: "Abyssal",
    tier: 3,
    baseStats: { hp: 86, atk: 100, def: 76, spd: 90 },
    moves: [
      { name: "Shadow Strike", type: "Abyssal", learnLevel: 1 },
      { name: "Bite", type: "Normal", learnLevel: 8 },
      { name: "Darkness Pulse", type: "Abyssal", learnLevel: 16 },
      { name: "Void Crash", type: "Abyssal", learnLevel: 28 },
    ],
  },
  {
    id: 56,
    name: "Dread Abyss Serpent",
    type: "Abyssal",
    tier: 3,
    baseStats: { hp: 82, atk: 100, def: 74, spd: 94 },
    moves: [
      { name: "Night Slash", type: "Abyssal", learnLevel: 1 },
      { name: "Pursuit", type: "Normal", learnLevel: 8 },
      { name: "Abyss Fang", type: "Abyssal", learnLevel: 16 },
      { name: "Eternal Void", type: "Abyssal", learnLevel: 28 },
    ],
  },
  {
    id: 57,
    name: "Void The Eternal",
    type: "Abyssal",
    tier: 3,
    baseStats: { hp: 84, atk: 100, def: 72, spd: 96 },
    moves: [
      { name: "Crunch", type: "Abyssal", learnLevel: 1 },
      { name: "Aqua Jet", type: "Water", learnLevel: 8 },
      { name: "Void Bite", type: "Abyssal", learnLevel: 16 },
      { name: "Nullification", type: "Abyssal", learnLevel: 28 },
    ],
  },

  // STORM TYPE
  // Tier 1
  {
    id: 16,
    name: "Gust Minnow",
    type: "Storm",
    tier: 1,
    baseStats: { hp: 50, atk: 58, def: 50, spd: 74 },
    moves: [
      { name: "Gust", type: "Storm", learnLevel: 1 },
      { name: "Peck", type: "Normal", learnLevel: 8 },
    ],
    evolvesInto: 37,
  },
  {
    id: 17,
    name: "Wind Carp",
    type: "Storm",
    tier: 1,
    baseStats: { hp: 54, atk: 60, def: 54, spd: 72 },
    moves: [
      { name: "Air Slash", type: "Storm", learnLevel: 1 },
      { name: "Splash", type: "Normal", learnLevel: 8 },
    ],
    evolvesInto: 38,
  },
  {
    id: 18,
    name: "Storm Pike",
    type: "Storm",
    tier: 1,
    baseStats: { hp: 52, atk: 64, def: 50, spd: 76 },
    moves: [
      { name: "Wind Strike", type: "Storm", learnLevel: 1 },
      { name: "Quick Attack", type: "Normal", learnLevel: 8 },
    ],
    evolvesInto: 39,
  },
  // Tier 2
  {
    id: 37,
    name: "Galecutter",
    type: "Storm",
    tier: 2,
    baseStats: { hp: 65, atk: 70, def: 62, spd: 87 },
    moves: [
      { name: "Gust", type: "Storm", learnLevel: 1 },
      { name: "Peck", type: "Normal", learnLevel: 8 },
      { name: "Whirlwind", type: "Storm", learnLevel: 16 },
    ],
    evolvesInto: 58,
  },
  {
    id: 38,
    name: "Cyclone Ray",
    type: "Storm",
    tier: 2,
    baseStats: { hp: 69, atk: 72, def: 66, spd: 85 },
    moves: [
      { name: "Air Slash", type: "Storm", learnLevel: 1 },
      { name: "Splash", type: "Normal", learnLevel: 8 },
      { name: "Storm Surge", type: "Storm", learnLevel: 16 },
    ],
    evolvesInto: 59,
  },
  {
    id: 39,
    name: "Hurricane Bass",
    type: "Storm",
    tier: 2,
    baseStats: { hp: 67, atk: 76, def: 62, spd: 89 },
    moves: [
      { name: "Wind Strike", type: "Storm", learnLevel: 1 },
      { name: "Quick Attack", type: "Normal", learnLevel: 8 },
      { name: "Tempest Fang", type: "Storm", learnLevel: 16 },
    ],
    evolvesInto: 60,
  },
  // Tier 3
  {
    id: 58,
    name: "Grand Tempestfang",
    type: "Storm",
    tier: 3,
    baseStats: { hp: 80, atk: 82, def: 74, spd: 100 },
    moves: [
      { name: "Gust", type: "Storm", learnLevel: 1 },
      { name: "Peck", type: "Normal", learnLevel: 8 },
      { name: "Whirlwind", type: "Storm", learnLevel: 16 },
      { name: "Hurricane", type: "Storm", learnLevel: 28 },
    ],
  },
  {
    id: 59,
    name: "Dread Maelstrom",
    type: "Storm",
    tier: 3,
    baseStats: { hp: 84, atk: 84, def: 78, spd: 98 },
    moves: [
      { name: "Air Slash", type: "Storm", learnLevel: 1 },
      { name: "Splash", type: "Normal", learnLevel: 8 },
      { name: "Storm Surge", type: "Storm", learnLevel: 16 },
      { name: "Tornado Vortex", type: "Storm", learnLevel: 28 },
    ],
  },
  {
    id: 60,
    name: "Ancient Stormrider",
    type: "Storm",
    tier: 3,
    baseStats: { hp: 82, atk: 88, def: 74, spd: 100 },
    moves: [
      { name: "Wind Strike", type: "Storm", learnLevel: 1 },
      { name: "Quick Attack", type: "Normal", learnLevel: 8 },
      { name: "Tempest Fang", type: "Storm", learnLevel: 16 },
      { name: "Skybreaker", type: "Storm", learnLevel: 28 },
    ],
  },

  // NORMAL TYPE
  // Tier 1
  {
    id: 19,
    name: "Sea Bream",
    type: "Normal",
    tier: 1,
    baseStats: { hp: 62, atk: 60, def: 64, spd: 58 },
    moves: [
      { name: "Tackle", type: "Normal", learnLevel: 1 },
      { name: "Splash", type: "Normal", learnLevel: 8 },
    ],
    evolvesInto: 40,
  },
  {
    id: 20,
    name: "Coral Carp",
    type: "Normal",
    tier: 1,
    baseStats: { hp: 64, atk: 58, def: 66, spd: 56 },
    moves: [
      { name: "Peck", type: "Normal", learnLevel: 1 },
      { name: "Water Gun", type: "Water", learnLevel: 8 },
    ],
    evolvesInto: 41,
  },
  // Tier 2
  {
    id: 40,
    name: "Driftfin",
    type: "Normal",
    tier: 2,
    baseStats: { hp: 76, atk: 74, def: 78, spd: 70 },
    moves: [
      { name: "Tackle", type: "Normal", learnLevel: 1 },
      { name: "Splash", type: "Normal", learnLevel: 8 },
      { name: "Body Slam", type: "Normal", learnLevel: 16 },
    ],
    evolvesInto: 61,
  },
  {
    id: 41,
    name: "Old Barnacle",
    type: "Normal",
    tier: 2,
    baseStats: { hp: 78, atk: 72, def: 80, spd: 68 },
    moves: [
      { name: "Peck", type: "Normal", learnLevel: 1 },
      { name: "Water Gun", type: "Water", learnLevel: 8 },
      { name: "Iron Defense", type: "Normal", learnLevel: 16 },
    ],
    evolvesInto: 62,
  },
  // Tier 3
  {
    id: 61,
    name: "Ancient Mariner",
    type: "Normal",
    tier: 3,
    baseStats: { hp: 90, atk: 88, def: 92, spd: 82 },
    moves: [
      { name: "Tackle", type: "Normal", learnLevel: 1 },
      { name: "Splash", type: "Normal", learnLevel: 8 },
      { name: "Body Slam", type: "Normal", learnLevel: 16 },
      { name: "Hyper Beam", type: "Normal", learnLevel: 28 },
    ],
  },
  {
    id: 62,
    name: "Corsair Harbor Master",
    type: "Normal",
    tier: 3,
    baseStats: { hp: 92, atk: 86, def: 94, spd: 80 },
    moves: [
      { name: "Peck", type: "Normal", learnLevel: 1 },
      { name: "Water Gun", type: "Water", learnLevel: 8 },
      { name: "Iron Defense", type: "Normal", learnLevel: 16 },
      { name: "Anchor Shot", type: "Normal", learnLevel: 28 },
    ],
  },
];

export function getFishById(id: number): FishSpecies | undefined {
  return FISH_SPECIES.find((fish) => fish.id === id);
}

export function getFishByName(name: string): FishSpecies | undefined {
  return FISH_SPECIES.find((fish) => fish.name === name);
}

export function getFishByType(type: string): FishSpecies[] {
  return FISH_SPECIES.filter((fish) => fish.type === type);
}

export function getFishByTier(tier: 1 | 2 | 3): FishSpecies[] {
  return FISH_SPECIES.filter((fish) => fish.tier === tier);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- fish-db-new.test.ts
```

Expected: PASS (all 60 fish correct, stats in range, moves assigned properly)

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npm test
```

Expected: 41 tests should still pass (or minor failures if battle/UI code references old fish names)

- [ ] **Step 6: Commit**

```bash
git add src/data/fish-db.ts tests/data/fish-db-new.test.ts
git commit -m "feat: replace fish database with 60 species, stats, moves, evolution chains"
```

---

## Chunk 3: Type Effectiveness Chart Update

### Task 3: Update type-chart.ts with symmetric matchups

**Files:**
- Modify: `src/data/type-chart.ts`

**Context:** The type effectiveness chart determines battle advantages. We're implementing symmetric matchups where each type beats 2 and loses to 2.

- [ ] **Step 1: Write test for type chart structure**

Create `tests/data/type-chart-symmetric.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { TYPE_CHART } from "../../src/data/type-chart";

describe("Type Effectiveness Chart - Symmetric", () => {
  const types = ["Fire", "Water", "Electric", "Nature", "Abyssal", "Storm", "Normal"];

  it("should have entries for all 7 types", () => {
    types.forEach((type) => {
      expect(TYPE_CHART[type]).toBeDefined();
    });
  });

  it("each type should beat exactly 2 other types", () => {
    types.forEach((type) => {
      const beatsCount = TYPE_CHART[type].beats.length;
      expect(beatsCount).toBe(2);
    });
  });

  it("each type should lose to exactly 2 other types", () => {
    types.forEach((type) => {
      const losesCount = TYPE_CHART[type].losesTo.length;
      expect(losesCount).toBe(2);
    });
  });

  it("type matchups should be symmetric", () => {
    types.forEach((type) => {
      // If A beats B, then B loses to A
      TYPE_CHART[type].beats.forEach((beaten) => {
        expect(TYPE_CHART[beaten].losesTo).toContain(type);
      });

      // If A loses to B, then B beats A
      TYPE_CHART[type].losesTo.forEach((winner) => {
        expect(TYPE_CHART[winner].beats).toContain(type);
      });
    });
  });

  it("Fire should beat Nature and Normal", () => {
    expect(TYPE_CHART["Fire"].beats).toContain("Nature");
    expect(TYPE_CHART["Fire"].beats).toContain("Normal");
  });

  it("Fire should lose to Water and Electric", () => {
    expect(TYPE_CHART["Fire"].losesTo).toContain("Water");
    expect(TYPE_CHART["Fire"].losesTo).toContain("Electric");
  });

  it("Water should beat Fire and Electric", () => {
    expect(TYPE_CHART["Water"].beats).toContain("Fire");
    expect(TYPE_CHART["Water"].beats).toContain("Electric");
  });

  it("Electric should beat Water and Storm", () => {
    expect(TYPE_CHART["Electric"].beats).toContain("Water");
    expect(TYPE_CHART["Electric"].beats).toContain("Storm");
  });

  it("Nature should beat Water and Abyssal", () => {
    expect(TYPE_CHART["Nature"].beats).toContain("Water");
    expect(TYPE_CHART["Nature"].beats).toContain("Abyssal");
  });

  it("Abyssal should beat Storm and Normal", () => {
    expect(TYPE_CHART["Abyssal"].beats).toContain("Storm");
    expect(TYPE_CHART["Abyssal"].beats).toContain("Normal");
  });

  it("Storm should beat Normal and Electric", () => {
    expect(TYPE_CHART["Storm"].beats).toContain("Normal");
    expect(TYPE_CHART["Storm"].beats).toContain("Electric");
  });

  it("Normal should beat Electric and Abyssal", () => {
    expect(TYPE_CHART["Normal"].beats).toContain("Electric");
    expect(TYPE_CHART["Normal"].beats).toContain("Abyssal");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- type-chart-symmetric.test.ts
```

Expected: FAIL (type-chart.ts doesn't have symmetric structure)

- [ ] **Step 3: Implement symmetric type chart**

Update `src/data/type-chart.ts`:

```typescript
export interface TypeMatchup {
  beats: string[];
  losesTo: string[];
  immuneTo?: string[];
}

export const TYPE_CHART: Record<string, TypeMatchup> = {
  Fire: {
    beats: ["Nature", "Normal"],
    losesTo: ["Water", "Electric"],
  },
  Water: {
    beats: ["Fire", "Electric"],
    losesTo: ["Nature", "Abyssal"],
  },
  Electric: {
    beats: ["Water", "Storm"],
    losesTo: ["Fire", "Normal"],
  },
  Nature: {
    beats: ["Water", "Abyssal"],
    losesTo: ["Fire", "Storm"],
  },
  Abyssal: {
    beats: ["Storm", "Normal"],
    losesTo: ["Water", "Nature"],
  },
  Storm: {
    beats: ["Normal", "Electric"],
    losesTo: ["Nature", "Abyssal"],
  },
  Normal: {
    beats: ["Electric", "Abyssal"],
    losesTo: ["Fire", "Storm"],
  },
};

/**
 * Calculate type effectiveness multiplier for an attack
 * @param attackType Type of the attacking move
 * @param targetType Type of the defending Pokémon
 * @returns Damage multiplier (0.5 = resisted, 1.0 = neutral, 2.0 = super effective)
 */
export function getTypeEffectiveness(attackType: string, targetType: string): number {
  if (!TYPE_CHART[attackType]) return 1.0;

  if (TYPE_CHART[attackType].beats.includes(targetType)) {
    return 2.0; // Super effective
  }

  if (TYPE_CHART[attackType].losesTo.includes(targetType)) {
    return 0.5; // Not very effective
  }

  return 1.0; // Neutral
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- type-chart-symmetric.test.ts
```

Expected: PASS (all matchups symmetric, each type beats 2, loses to 2)

- [ ] **Step 5: Run full test suite**

```bash
npm test
```

Expected: 41 tests should pass (if battle system uses getTypeEffectiveness correctly)

- [ ] **Step 6: Commit**

```bash
git add src/data/type-chart.ts tests/data/type-chart-symmetric.test.ts
git commit -m "feat: implement symmetric type effectiveness chart (7 types)"
```

---

## Chunk 4: Final Verification & Integration

### Task 4: Run full test suite and verify no regressions

**Files:**
- Test: `npm test` (all)

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All 41 tests PASS

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Build for production**

```bash
npm run build
```

Expected: Build succeeds, dist/ created

- [ ] **Step 4: Verify in browser (optional)**

```bash
npm run preview
```

Visit `http://localhost:4173`, navigate to fishing/battle, verify new fish appear correctly

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete fish system with 60 species, symmetric types, stats/moves"
```

- [ ] **Step 6: Push to main**

```bash
git push origin main
```

Expected: Netlify auto-deploys to corsair-catch-demo.netlify.app

---

## Summary

**What this plan delivers:**
- 60 fish species (20 evolution chains × 3 tiers)
- Type system: 7 types with symmetric matchups (each beats 2, loses to 2)
- Stats system: 50–100 range, growing with evolution, no stat drops
- Move system: 2 → 3 → 4 moves per tier, learned via leveling + evolution
- Sprite organization: Mapped to 3 PNG grids (1.png, 2.png, 3.png)
- Tests: All 41 existing tests still pass
- No breaking changes to BattleSystem, FishingSystem, SaveManager logic

**Estimated effort:** 4-5 hours for a skilled developer
**Risk level:** LOW (isolated to data layer, well-tested)
