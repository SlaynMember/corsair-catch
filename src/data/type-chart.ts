import { FishType } from './fish-db';

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

// Legacy function for backward compatibility
export function getEffectiveness(
  attackType: FishType,
  defenderType: FishType
): number {
  return getTypeEffectiveness(String(attackType), String(defenderType));
}

export function getEffectivenessLabel(multiplier: number): string {
  if (multiplier >= 2.0) return "It's super effective!";
  if (multiplier <= 0.5) return "It's not very effective...";
  return '';
}
