// EvolutionSystem.ts — handles fish evolution checks and stat transitions

import type { FishInstance, FishSpecies } from '../data/fish-db';
import { calcStat } from '../data/fish-db';

/** Level thresholds for evolution */
const EVOLUTION_LEVEL_T1_TO_T2 = 16;
const EVOLUTION_LEVEL_T2_TO_T3 = 36;

/** Max moves a fish can know at once */
const MAX_MOVES = 4;

/**
 * Returns the evolution level threshold for a given tier.
 * Tier 1 evolves at 16, tier 2 at 36, tier 3 cannot evolve.
 */
export function getEvolutionLevel(tier: 1 | 2 | 3): number | null {
  if (tier === 1) return EVOLUTION_LEVEL_T1_TO_T2;
  if (tier === 2) return EVOLUTION_LEVEL_T2_TO_T3;
  return null; // tier 3 is final
}

/**
 * Find a species by its numeric ID from the species list.
 */
function findSpecies(id: number, species: FishSpecies[]): FishSpecies | undefined {
  return species.find((s) => s.id === id);
}

/**
 * Resolve the current species of a FishInstance.
 * Handles both numeric and string speciesId.
 */
function resolveSpecies(fish: FishInstance, species: FishSpecies[]): FishSpecies | undefined {
  if (typeof fish.speciesId === 'number') {
    return findSpecies(fish.speciesId, species);
  }
  // String ID — try matching by name (case-insensitive, collapse whitespace/underscores)
  const normalized = fish.speciesId.toLowerCase().replace(/[_\s]/g, '');
  return species.find((s) => s.name.toLowerCase().replace(/[_\s]/g, '') === normalized);
}

/**
 * Check whether a fish can evolve right now.
 * Requires: species has `evolvesInto`, fish meets the level threshold,
 * and the evolution target species exists in the database.
 */
export function canEvolve(fish: FishInstance, species: FishSpecies[]): boolean {
  const current = resolveSpecies(fish, species);
  if (!current) return false;
  if (current.evolvesInto == null) return false;

  const threshold = getEvolutionLevel(current.tier);
  if (threshold == null) return false;
  if (fish.level < threshold) return false;

  // Make sure the target species actually exists
  return findSpecies(current.evolvesInto, species) != null;
}

/**
 * Returns the species the fish will evolve into, or null if it cannot evolve.
 */
export function getEvolutionTarget(fish: FishInstance, species: FishSpecies[]): FishSpecies | null {
  const current = resolveSpecies(fish, species);
  if (!current) return null;
  if (current.evolvesInto == null) return null;

  const threshold = getEvolutionLevel(current.tier);
  if (threshold == null) return null;
  if (fish.level < threshold) return null;

  return findSpecies(current.evolvesInto, species) ?? null;
}

/**
 * Evolve a fish into its next form.
 * Returns a NEW FishInstance with:
 *   - speciesId updated to the evolution target
 *   - stats recalculated using the new species' base stats at the current level
 *   - existing moves preserved + first new move from the evolution target's move list
 *   - same uid, nickname, level, xp, and IVs
 *
 * If the fish cannot evolve, returns a copy of the original unchanged.
 */
export function evolveFish(fish: FishInstance, species: FishSpecies[]): FishInstance {
  const target = getEvolutionTarget(fish, species);
  if (!target) {
    // Return a defensive copy — no mutation
    return { ...fish, moves: [...fish.moves], iv: { ...fish.iv } };
  }

  // Recalculate HP with new base stats
  const newMaxHp = calcStat(target.baseStats.hp, fish.iv.hp, fish.level, true);

  // Scale currentHp proportionally so the fish doesn't lose/gain unfair HP
  const hpRatio = fish.maxHp > 0 ? fish.currentHp / fish.maxHp : 1;
  const newCurrentHp = Math.max(1, Math.round(newMaxHp * hpRatio));

  // Build move list: keep existing moves, add first new move from evolution target
  const existingMoves = [...fish.moves];
  const newMove = target.moves.find((m) => !existingMoves.includes(m));
  if (newMove) {
    if (existingMoves.length < MAX_MOVES) {
      existingMoves.push(newMove);
    } else {
      // Replace the last move slot with the new evolution move
      existingMoves[MAX_MOVES - 1] = newMove;
    }
  }

  return {
    uid: fish.uid,
    speciesId: target.id,
    nickname: fish.nickname,
    level: fish.level,
    xp: fish.xp,
    currentHp: newCurrentHp,
    maxHp: newMaxHp,
    moves: existingMoves,
    iv: { ...fish.iv },
  };
}
