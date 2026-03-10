# Corsair Catch Fish System Design
**Date:** March 10, 2026
**Status:** Approved for implementation

## Overview
Complete fish system with 60 species across 7 element types, 3 evolution tiers, stats, moves, and type effectiveness matchups.

## Evolution Structure
- **Linear chains**: Tier 1 → Tier 2 → Tier 3
- **20 chains total**: ~3 chains per type (except Normal = 2)
- **Sprite source**: Public/sprite_unedited/ grids (1.png, 2.png, 3.png)

## Stat System
- **Range**: 50–100 per stat (HP, ATK, DEF, SPD)
- **Progression**: Tier 1 ~60 avg → Tier 2 ~75 avg → Tier 3 ~90 avg
- **All stats increase on evolution** (no stat drop)
- **Type focus**: Fire=ATK, Water=DEF, Electric=SPD, Nature=balanced, Abyssal=ATK+SPD, Storm=SPD, Normal=balanced

## Move System
- **Tier 1**: 2 moves (learn L1, L8)
- **Tier 2**: 3 moves (learn #3 at evolution L16)
- **Tier 3**: 4 moves (learn #4 at evolution L28)
- **No TM system**

## Type Effectiveness (Symmetric)
Each type beats 2, loses to 2:
- FIRE beats: NATURE, NORMAL | loses to: WATER, ELECTRIC
- WATER beats: FIRE, ELECTRIC | loses to: NATURE, ABYSSAL
- ELECTRIC beats: WATER, STORM | loses to: FIRE, NORMAL
- NATURE beats: WATER, ABYSSAL | loses to: FIRE, STORM
- ABYSSAL beats: STORM, NORMAL | loses to: WATER, NATURE
- STORM beats: NORMAL, ELECTRIC | loses to: NATURE, ABYSSAL
- NORMAL beats: ELECTRIC, ABYSSAL | loses to: FIRE, STORM

## Complete Fish Roster (60 total)

### FIRE (9)
Tier 1: Ember Snapper, Lava Carp, Flame Pike
Tier 2: Blazefin, Magmafin, Scorchscale
Tier 3: Grand Infernoray, Ancient Inferno Bass, Lord of Embers

### WATER (9)
Tier 1: Tidecaller, Frost Carp, Aqua Pike
Tier 2: Tsunamaw, Crystaleel, Rippleray
Tier 3: Grand Tidebreaker, Ancient Tidewyrm, Dread Storm Whale

### ELECTRIC (9)
Tier 1: Volt Eel, Spark Minnow, Zap Fish
Tier 2: Volteel, Shockjaw, Thunder Ray
Tier 3: Grand Arc Wyrm, Dread Storm Leviathan, Ancient Bolt Shark

### NATURE (9)
Tier 1: Coralline, Sea Moss, Reef Sprite
Tier 2: Bloom Ray, Petal Fin, Coral Guardian
Tier 3: Grand Reefguard, Dread Coral Titan, Ancient Jade Serpent

### ABYSSAL (9)
Tier 1: Dark Carp, Shadow Pike, Abyssal Fang
Tier 2: Voidfin, Void Ray, Corsair Nullfang
Tier 3: Grand Depthwalker, Dread Abyss Serpent, Void The Eternal

### STORM (9)
Tier 1: Gust Minnow, Wind Carp, Storm Pike
Tier 2: Galecutter, Cyclone Ray, Hurricane Bass
Tier 3: Grand Tempestfang, Dread Maelstrom, Ancient Stormrider

### NORMAL (6)
Tier 1: Sea Bream, Coral Carp
Tier 2: Driftfin, Old Barnacle
Tier 3: Ancient Mariner, Corsair Harbor Master

## Next Steps
1. Extract individual fish sprites from grids into sprite atlas
2. Update `src/data/fish-db.ts` with 60 fish + stats + moves + type data
3. Update `src/data/type-chart.ts` with symmetric matchups
4. Update battle/UI systems to render new fish data
5. Test with 41 test suite (must pass)
