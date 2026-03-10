import { FishType } from './fish-db';

// type-chart[attacker][defender] = multiplier
const chart: Record<FishType, Record<FishType, number>> = {
  [FishType.WATER]: {
    [FishType.WATER]: 0.5,
    [FishType.FIRE]: 2.0,
    [FishType.ELECTRIC]: 0.5,
    [FishType.CORAL]: 0.5,
    [FishType.ABYSSAL]: 1.0,
    [FishType.STORM]: 1.0,
    [FishType.NORMAL]: 1.0,
  },
  [FishType.FIRE]: {
    [FishType.WATER]: 0.5,
    [FishType.FIRE]: 0.5,
    [FishType.ELECTRIC]: 1.0,
    [FishType.CORAL]: 2.0,
    [FishType.ABYSSAL]: 1.0,
    [FishType.STORM]: 1.0,
    [FishType.NORMAL]: 1.0,
  },
  [FishType.ELECTRIC]: {
    [FishType.WATER]: 2.0,
    [FishType.FIRE]: 1.0,
    [FishType.ELECTRIC]: 0.5,
    [FishType.CORAL]: 1.0,
    [FishType.ABYSSAL]: 1.0,
    [FishType.STORM]: 2.0,
    [FishType.NORMAL]: 1.0,
  },
  [FishType.CORAL]: {
    [FishType.WATER]: 1.0,
    [FishType.FIRE]: 0.5,
    [FishType.ELECTRIC]: 1.0,
    [FishType.CORAL]: 0.5,
    [FishType.ABYSSAL]: 2.0,
    [FishType.STORM]: 0.5,
    [FishType.NORMAL]: 1.0,
  },
  [FishType.ABYSSAL]: {
    [FishType.WATER]: 1.0,
    [FishType.FIRE]: 1.0,
    [FishType.ELECTRIC]: 1.0,
    [FishType.CORAL]: 0.5,
    [FishType.ABYSSAL]: 0.5,
    [FishType.STORM]: 1.0,
    [FishType.NORMAL]: 2.0,
  },
  [FishType.STORM]: {
    [FishType.WATER]: 1.0,
    [FishType.FIRE]: 1.0,
    [FishType.ELECTRIC]: 0.5,
    [FishType.CORAL]: 2.0,
    [FishType.ABYSSAL]: 1.0,
    [FishType.STORM]: 0.5,
    [FishType.NORMAL]: 1.0,
  },
  [FishType.NORMAL]: {
    [FishType.WATER]: 1.0,
    [FishType.FIRE]: 1.0,
    [FishType.ELECTRIC]: 1.0,
    [FishType.CORAL]: 1.0,
    [FishType.ABYSSAL]: 0.5,
    [FishType.STORM]: 1.0,
    [FishType.NORMAL]: 1.0,
  },
};

export function getEffectiveness(
  attackType: FishType,
  defenderType: FishType
): number {
  return chart[attackType]?.[defenderType] ?? 1.0;
}

export function getEffectivenessLabel(multiplier: number): string {
  if (multiplier >= 2.0) return "It's super effective!";
  if (multiplier <= 0.5) return "It's not very effective...";
  return '';
}
