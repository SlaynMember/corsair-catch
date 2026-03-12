// XPSystem.ts — handles XP gain, leveling, and evolution checks after battle

import type { FishInstance, FishSpecies } from '../data/fish-db';
import { calcStat } from '../data/fish-db';
import { canEvolve, getEvolutionTarget } from './EvolutionSystem';

/** Maximum level a fish can reach */
const MAX_LEVEL = 100;

/** Base XP constant for the cubic curve */
const XP_CURVE_FACTOR = 0.8;

/**
 * XP required to reach a given level (cubic curve).
 * Level 1 = 0 XP. Level N total XP = floor(N^3 * 0.8).
 * To go FROM level N TO level N+1, you need getXPForLevel(N+1) - getXPForLevel(N).
 */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(level * level * level * XP_CURVE_FACTOR);
}

/**
 * XP needed to advance from `currentLevel` to `currentLevel + 1`.
 */
export function xpToNextLevel(currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) return Infinity;
  return getXPForLevel(currentLevel + 1) - getXPForLevel(currentLevel);
}

/**
 * Calculate battle XP reward.
 * Formula: base 50 + 10 * enemyLevel, with a bonus if the enemy is higher level.
 */
function calcBattleXP(fishLevel: number, enemyLevel: number): number {
  const base = 50 + 10 * enemyLevel;
  // Bonus for fighting stronger enemies, penalty for weaker ones
  const levelDiff = enemyLevel - fishLevel;
  const multiplier = Math.max(0.5, 1 + levelDiff * 0.1);
  return Math.max(1, Math.floor(base * multiplier));
}

export interface LevelUpResult {
  xp: number;
  leveledUp: boolean;
  newLevel: number;
  levelsGained: number;
}

/**
 * Award battle XP to a fish. Handles multi-level-ups from a single big XP gain.
 * Mutates the fish in place (updates xp, level, currentHp, maxHp) and returns a summary.
 */
export function addBattleXP(
  fish: FishInstance,
  enemyLevel: number,
  species: FishSpecies[]
): LevelUpResult {
  if (fish.level >= MAX_LEVEL) {
    return { xp: 0, leveledUp: false, newLevel: fish.level, levelsGained: 0 };
  }

  const xpGained = calcBattleXP(fish.level, enemyLevel);
  fish.xp += xpGained;

  const startLevel = fish.level;
  let leveledUp = false;

  // Check for level ups (could be multiple)
  while (fish.level < MAX_LEVEL) {
    const needed = xpToNextLevel(fish.level);
    if (fish.xp < needed) break;

    fish.xp -= needed;
    fish.level += 1;
    leveledUp = true;

    // Recalculate max HP — find the species for base stats
    const currentSpecies = findCurrentSpecies(fish, species);
    if (currentSpecies) {
      const oldMaxHp = fish.maxHp;
      fish.maxHp = calcStat(currentSpecies.baseStats.hp, fish.iv.hp, fish.level, true);
      // Heal by the HP gained from leveling
      const hpGain = fish.maxHp - oldMaxHp;
      fish.currentHp = Math.min(fish.maxHp, fish.currentHp + hpGain);
    }
  }

  return {
    xp: xpGained,
    leveledUp,
    newLevel: fish.level,
    levelsGained: fish.level - startLevel,
  };
}

/**
 * After leveling, check if the fish is ready to evolve.
 * Returns the target species if evolution is available, null otherwise.
 * Does NOT perform the evolution — call EvolutionSystem.evolveFish() for that.
 */
export function checkEvolution(fish: FishInstance, species: FishSpecies[]): FishSpecies | null {
  if (!canEvolve(fish, species)) return null;
  return getEvolutionTarget(fish, species);
}

/**
 * Resolve a FishInstance's current species from the database.
 */
function findCurrentSpecies(fish: FishInstance, species: FishSpecies[]): FishSpecies | undefined {
  if (typeof fish.speciesId === 'number') {
    return species.find((s) => s.id === fish.speciesId);
  }
  const normalized = (fish.speciesId as string).toLowerCase().replace(/[_\s]/g, '');
  return species.find((s) => s.name.toLowerCase().replace(/[_\s]/g, '') === normalized);
}
