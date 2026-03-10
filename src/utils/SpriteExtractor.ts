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
  { gridFile: "1.png", row: 3, col: 4, fishName: "Gust Minnow", type: "Storm" },
  { gridFile: "1.png", row: 4, col: 4, fishName: "Wind Carp", type: "Storm" },
  { gridFile: "1.png", row: 5, col: 4, fishName: "Storm Pike", type: "Storm" },
  // Tier 2
  { gridFile: "2.png", row: 3, col: 4, fishName: "Galecutter", type: "Storm" },
  { gridFile: "2.png", row: 4, col: 4, fishName: "Cyclone Ray", type: "Storm" },
  { gridFile: "2.png", row: 5, col: 4, fishName: "Hurricane Bass", type: "Storm" },
  // Tier 3
  { gridFile: "3.png", row: 3, col: 4, fishName: "Grand Tempestfang", type: "Storm" },
  { gridFile: "3.png", row: 4, col: 4, fishName: "Dread Maelstrom", type: "Storm" },
  { gridFile: "3.png", row: 5, col: 4, fishName: "Ancient Stormrider", type: "Storm" },

  // NORMAL TYPE (6)
  // Tier 1
  { gridFile: "1.png", row: 1, col: 4, fishName: "Sea Bream", type: "Normal" },
  { gridFile: "1.png", row: 2, col: 4, fishName: "Corsair Harbor Master", type: "Normal" },
  // Tier 2
  { gridFile: "2.png", row: 1, col: 4, fishName: "Coral Carp", type: "Normal" },
  { gridFile: "2.png", row: 2, col: 4, fishName: "Driftfin", type: "Normal" },
  // Tier 3
  { gridFile: "3.png", row: 1, col: 4, fishName: "Old Barnacle", type: "Normal" },
  { gridFile: "3.png", row: 2, col: 4, fishName: "Ancient Mariner", type: "Normal" },
];
