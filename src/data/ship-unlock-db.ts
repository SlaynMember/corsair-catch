/**
 * Ship unlock progression system
 * Players unlock ships tiers as they catch more fish
 */

export interface UnlockTier {
  minFishCaught: number;
  shipIds: number[];
  tierName: string;
  description?: string;
}

export const SHIP_UNLOCK_TIERS: UnlockTier[] = [
  {
    minFishCaught: 0,
    shipIds: [1],
    tierName: 'Starter Fleet',
    description: 'Every pirate\'s first vessel',
  },
  {
    minFishCaught: 5,
    shipIds: [2, 3, 4],
    tierName: 'Common Merchant Fleet',
    description: 'Steady traders and scouts',
  },
  {
    minFishCaught: 15,
    shipIds: [5, 6, 7, 8],
    tierName: 'Uncommon Vessels',
    description: 'Experienced sailors\' choice',
  },
  {
    minFishCaught: 30,
    shipIds: [9, 10, 11, 12],
    tierName: 'Rare Captains\' Prizes',
    description: 'The pride of the fleet',
  },
  {
    minFishCaught: 50,
    shipIds: [13, 14, 15, 16],
    tierName: 'Legendary Fleets',
    description: 'Ships of legend and renown',
  },
  {
    minFishCaught: 75,
    shipIds: [17, 18, 19, 20],
    tierName: 'Mythical Vessels',
    description: 'The greatest ships ever built',
  },
];

/**
 * Get all ship IDs that should be unlocked at the given fish count
 */
export function getUnlockedShipIds(fishCaught: number): number[] {
  const unlocked: number[] = [];
  for (const tier of SHIP_UNLOCK_TIERS) {
    if (fishCaught >= tier.minFishCaught) {
      unlocked.push(...tier.shipIds);
    }
  }
  return unlocked;
}

/**
 * Get the next unlock milestone the player hasn't reached
 * Returns null if all ships unlocked
 */
export function getNextUnlockMilestone(fishCaught: number): UnlockTier | null {
  for (const tier of SHIP_UNLOCK_TIERS) {
    if (fishCaught < tier.minFishCaught) {
      return tier;
    }
  }
  return null;
}

/**
 * Check if a specific ship is unlocked
 */
export function isShipUnlocked(shipId: number, fishCaught: number): boolean {
  const unlockedIds = getUnlockedShipIds(fishCaught);
  return unlockedIds.includes(shipId);
}

/**
 * Get the tier that just unlocked (if any)
 * Useful for showing notifications
 */
export function checkForNewUnlock(
  prevFishCaught: number,
  newFishCaught: number
): UnlockTier | null {
  for (const tier of SHIP_UNLOCK_TIERS) {
    if (prevFishCaught < tier.minFishCaught && newFishCaught >= tier.minFishCaught) {
      return tier;
    }
  }
  return null;
}
