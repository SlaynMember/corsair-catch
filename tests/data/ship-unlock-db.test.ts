import { describe, it, expect } from 'vitest';
import {
  getUnlockedShipIds,
  getNextUnlockMilestone,
  checkForNewUnlock,
  isShipUnlocked,
} from '../../src/data/ship-unlock-db';

describe('Ship Unlock System', () => {
  describe('getUnlockedShipIds', () => {
    it('should unlock ship 1 at 0 fish', () => {
      const unlockedIds = getUnlockedShipIds(0);
      expect(unlockedIds).toContain(1);
    });

    it('should unlock ships 1-4 at 5 fish', () => {
      const unlockedIds = getUnlockedShipIds(5);
      expect(unlockedIds).toContain(1);
      expect(unlockedIds).toContain(2);
      expect(unlockedIds).toContain(3);
      expect(unlockedIds).toContain(4);
    });

    it('should unlock ships 1-8 at 15 fish', () => {
      const unlockedIds = getUnlockedShipIds(15);
      expect(unlockedIds.length).toBeGreaterThanOrEqual(8);
      expect(unlockedIds).toContain(1);
      expect(unlockedIds).toContain(5);
      expect(unlockedIds).toContain(8);
    });

    it('should unlock all 20 ships at 75+ fish', () => {
      const unlockedIds = getUnlockedShipIds(75);
      expect(unlockedIds.length).toBe(20);
      for (let i = 1; i <= 20; i++) {
        expect(unlockedIds).toContain(i);
      }
    });

    it('should include all prior ships when unlocking new tier', () => {
      const tier0 = getUnlockedShipIds(0);
      const tier1 = getUnlockedShipIds(5);
      // tier1 should include all from tier0
      for (const shipId of tier0) {
        expect(tier1).toContain(shipId);
      }
    });
  });

  describe('getNextUnlockMilestone', () => {
    it('should return tier at 5 fish when player has 0', () => {
      const milestone = getNextUnlockMilestone(0);
      expect(milestone).toBeDefined();
      expect(milestone?.minFishCaught).toBe(5);
    });

    it('should return tier at 15 fish when player has 5', () => {
      const milestone = getNextUnlockMilestone(5);
      expect(milestone).toBeDefined();
      expect(milestone?.minFishCaught).toBe(15);
    });

    it('should return tier at 30 fish when player has 15', () => {
      const milestone = getNextUnlockMilestone(15);
      expect(milestone).toBeDefined();
      expect(milestone?.minFishCaught).toBe(30);
    });

    it('should return null when all ships unlocked (75+)', () => {
      const milestone = getNextUnlockMilestone(75);
      expect(milestone).toBeNull();
    });

    it('should have shipIds array in milestone', () => {
      const milestone = getNextUnlockMilestone(0);
      expect(milestone?.shipIds).toBeDefined();
      expect(Array.isArray(milestone?.shipIds)).toBe(true);
      expect(milestone!.shipIds.length).toBeGreaterThan(0);
    });
  });

  describe('checkForNewUnlock', () => {
    it('should detect unlock at 5 fish threshold', () => {
      const unlock = checkForNewUnlock(4, 5);
      expect(unlock).toBeDefined();
      expect(unlock?.minFishCaught).toBe(5);
    });

    it('should detect unlock at 15 fish threshold', () => {
      const unlock = checkForNewUnlock(14, 15);
      expect(unlock).toBeDefined();
      expect(unlock?.minFishCaught).toBe(15);
    });

    it('should detect unlock at 30 fish threshold', () => {
      const unlock = checkForNewUnlock(29, 30);
      expect(unlock).toBeDefined();
      expect(unlock?.minFishCaught).toBe(30);
    });

    it('should return null when no threshold crossed', () => {
      const unlock = checkForNewUnlock(5, 6);
      expect(unlock).toBeNull();
    });

    it('should return null when both values below threshold', () => {
      const unlock = checkForNewUnlock(1, 3);
      expect(unlock).toBeNull();
    });
  });

  describe('isShipUnlocked', () => {
    it('should unlock ship 1 at 0 fish', () => {
      expect(isShipUnlocked(1, 0)).toBe(true);
    });

    it('should keep ship 1 unlocked at any fish count', () => {
      expect(isShipUnlocked(1, 100)).toBe(true);
    });

    it('should not unlock ship 5 at 0 fish', () => {
      expect(isShipUnlocked(5, 0)).toBe(false);
    });

    it('should unlock ship 5 at 15 fish', () => {
      expect(isShipUnlocked(5, 15)).toBe(true);
    });

    it('should unlock ship 20 at 75 fish', () => {
      expect(isShipUnlocked(20, 75)).toBe(true);
    });

    it('should not unlock ship 20 at 74 fish', () => {
      expect(isShipUnlocked(20, 74)).toBe(false);
    });
  });
});
