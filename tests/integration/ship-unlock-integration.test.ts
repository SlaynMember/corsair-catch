import { describe, it, expect, beforeEach } from 'vitest';
import { createShip } from '../../src/components/ShipComponent';
import { InventoryManager } from '../../src/core/InventoryManager';
import { createFishInstance } from '../../src/data/fish-db';
import {
  getUnlockedShipIds,
  getNextUnlockMilestone,
  checkForNewUnlock,
  isShipUnlocked,
} from '../../src/data/ship-unlock-db';

describe('Ship Unlock Integration', () => {
  let inventory: InventoryManager;

  beforeEach(() => {
    const ship = createShip(1, 'Test Ship', true, 6);
    inventory = new InventoryManager(ship);
  });

  describe('Catching fish and tracking progress', () => {
    it('should start with 0 fish caught', () => {
      expect(inventory.getFishCaught()).toBe(0);
    });

    it('should increment fish caught on recordFishCaught()', () => {
      inventory.recordFishCaught();
      expect(inventory.getFishCaught()).toBe(1);

      inventory.recordFishCaught();
      expect(inventory.getFishCaught()).toBe(2);
    });

    it('should track multiple catches in sequence', () => {
      for (let i = 0; i < 5; i++) {
        inventory.recordFishCaught();
      }
      expect(inventory.getFishCaught()).toBe(5);
    });

    it('should unlock ship 1 at start', () => {
      const unlockedIds = getUnlockedShipIds(inventory.getFishCaught());
      expect(unlockedIds).toContain(1);
    });
  });

  describe('Unlock progression milestones', () => {
    it('should have next milestone at 5 fish when starting', () => {
      const milestone = getNextUnlockMilestone(inventory.getFishCaught());
      expect(milestone).toBeDefined();
      expect(milestone?.minFishCaught).toBe(5);
    });

    it('should unlock tier 1 ships (2-4) after catching 5 fish', () => {
      for (let i = 0; i < 5; i++) {
        inventory.recordFishCaught();
      }
      const unlockedIds = getUnlockedShipIds(inventory.getFishCaught());
      expect(unlockedIds).toContain(1);
      expect(unlockedIds).toContain(2);
      expect(unlockedIds).toContain(3);
      expect(unlockedIds).toContain(4);
    });

    it('should have next milestone at 15 fish after unlocking tier 1', () => {
      for (let i = 0; i < 5; i++) {
        inventory.recordFishCaught();
      }
      const milestone = getNextUnlockMilestone(inventory.getFishCaught());
      expect(milestone).toBeDefined();
      expect(milestone?.minFishCaught).toBe(15);
    });

    it('should unlock tier 2 ships (5-8) after catching 15 fish', () => {
      for (let i = 0; i < 15; i++) {
        inventory.recordFishCaught();
      }
      const unlockedIds = getUnlockedShipIds(inventory.getFishCaught());
      expect(unlockedIds).toContain(5);
      expect(unlockedIds).toContain(6);
      expect(unlockedIds).toContain(7);
      expect(unlockedIds).toContain(8);
    });

    it('should detect unlock milestone crossing at 5 fish', () => {
      inventory.recordFishCaught(); // 1
      inventory.recordFishCaught(); // 2
      inventory.recordFishCaught(); // 3
      inventory.recordFishCaught(); // 4

      const prevCount = 4;
      inventory.recordFishCaught(); // 5
      const newCount = inventory.getFishCaught();

      const unlock = checkForNewUnlock(prevCount, newCount);
      expect(unlock).toBeDefined();
      expect(unlock?.minFishCaught).toBe(5);
    });

    it('should detect unlock milestone crossing at 15 fish', () => {
      for (let i = 0; i < 14; i++) {
        inventory.recordFishCaught();
      }

      const prevCount = 14;
      inventory.recordFishCaught(); // 15
      const newCount = inventory.getFishCaught();

      const unlock = checkForNewUnlock(prevCount, newCount);
      expect(unlock).toBeDefined();
      expect(unlock?.minFishCaught).toBe(15);
    });

    it('should detect unlock milestone crossing at 30 fish', () => {
      for (let i = 0; i < 29; i++) {
        inventory.recordFishCaught();
      }

      const prevCount = 29;
      inventory.recordFishCaught(); // 30
      const newCount = inventory.getFishCaught();

      const unlock = checkForNewUnlock(prevCount, newCount);
      expect(unlock).toBeDefined();
      expect(unlock?.minFishCaught).toBe(30);
    });
  });

  describe('Ship availability based on fish count', () => {
    it('should block ship 5 until 15 fish caught', () => {
      expect(isShipUnlocked(5, 0)).toBe(false);
      expect(isShipUnlocked(5, 14)).toBe(false);
      expect(isShipUnlocked(5, 15)).toBe(true);
    });

    it('should allow swapping to unlocked ship', () => {
      const ship = inventory.getShip();
      expect(ship.shipId).toBe(1); // Starts with ship 1

      // Catch 5 fish to unlock tier 1
      for (let i = 0; i < 5; i++) {
        inventory.recordFishCaught();
      }

      // Should be able to swap to ship 2
      expect(isShipUnlocked(2, inventory.getFishCaught())).toBe(true);
      ship.shipId = 2;
      expect(ship.shipId).toBe(2);
    });

    it('should prevent swapping to locked ship', () => {
      const ship = inventory.getShip();
      // Should not be able to swap to ship 5 without 15 fish
      expect(isShipUnlocked(5, inventory.getFishCaught())).toBe(false);
    });
  });

  describe('Full progression path', () => {
    it('should unlock all 20 ships at 75+ fish', () => {
      for (let i = 0; i < 75; i++) {
        inventory.recordFishCaught();
      }

      const unlockedIds = getUnlockedShipIds(inventory.getFishCaught());
      expect(unlockedIds.length).toBe(20);
      for (let shipId = 1; shipId <= 20; shipId++) {
        expect(isShipUnlocked(shipId, inventory.getFishCaught())).toBe(true);
      }
    });

    it('should have no next milestone when all ships unlocked', () => {
      for (let i = 0; i < 75; i++) {
        inventory.recordFishCaught();
      }

      const milestone = getNextUnlockMilestone(inventory.getFishCaught());
      expect(milestone).toBeNull();
    });
  });

  describe('Save and load persistence', () => {
    it('should restore fish caught from save', () => {
      for (let i = 0; i < 15; i++) {
        inventory.recordFishCaught();
      }

      const savedCount = inventory.getFishCaught();
      expect(savedCount).toBe(15);

      // Simulate loading a save
      const newShip = createShip(1, 'Loaded Ship', true, 6);
      const newInventory = new InventoryManager(newShip);
      newInventory.setFishCaught(savedCount);

      expect(newInventory.getFishCaught()).toBe(15);
      expect(getUnlockedShipIds(newInventory.getFishCaught())).toContain(5);
    });

    it('should handle setFishCaught with negative values', () => {
      inventory.setFishCaught(-5);
      expect(inventory.getFishCaught()).toBe(0);
    });

    it('should handle setFishCaught with large values', () => {
      inventory.setFishCaught(1000);
      expect(inventory.getFishCaught()).toBe(1000);
      expect(getUnlockedShipIds(1000).length).toBe(20);
    });
  });

  describe('Party management with fish caught', () => {
    it('should add fish to party and track catch count', () => {
      const fish1 = createFishInstance('ember_snapper', 5, ['tackle', 'flame_jet']);
      const fish2 = createFishInstance('tidecaller', 5, ['tackle', 'tidal_wave']);

      inventory.addFish(fish1);
      inventory.recordFishCaught();

      inventory.addFish(fish2);
      inventory.recordFishCaught();

      expect(inventory.getPartySize()).toBe(2);
      expect(inventory.getFishCaught()).toBe(2);
    });

    it('should clear fish caught on inventory reset', () => {
      for (let i = 0; i < 10; i++) {
        inventory.recordFishCaught();
      }
      expect(inventory.getFishCaught()).toBe(10);

      inventory.clearInventory();
      expect(inventory.getFishCaught()).toBe(0);
    });
  });
});
