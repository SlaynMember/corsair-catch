import { describe, it, expect, beforeEach } from 'vitest';
import { InventoryManager } from '../src/core/InventoryManager';
import { createShip } from '../src/components/ShipComponent';
import type { FishInstance } from '../src/data/fish-db';

/**
 * Unit tests for InventoryManager
 * Tests: gold, items, bait, party, treasures
 */

describe('InventoryManager', () => {
  let inventory: InventoryManager;

  beforeEach(() => {
    // Create a fresh ship for each test
    const ship = createShip(1, 'Test Ship', true, 3);
    inventory = new InventoryManager(ship);
  });

  // ==================== GOLD TESTS ====================

  it('should add gold correctly', () => {
    inventory.addGold(100);
    expect(inventory.getGold()).toBe(100);

    inventory.addGold(50);
    expect(inventory.getGold()).toBe(150);
  });

  it('should remove gold if sufficient funds', () => {
    inventory.addGold(100);
    const success = inventory.removeGold(30);
    expect(success).toBe(true);
    expect(inventory.getGold()).toBe(70);
  });

  it('should not remove gold if insufficient funds', () => {
    inventory.addGold(100);
    const success = inventory.removeGold(200);
    expect(success).toBe(false);
    expect(inventory.getGold()).toBe(100); // Unchanged
  });

  it('should handle negative gold amounts (ignore them)', () => {
    inventory.addGold(100);
    inventory.addGold(-50); // Negative amounts become 0
    expect(inventory.getGold()).toBe(100);
  });

  // ==================== ITEM TESTS ====================

  it('should add items up to the soft cap of 99', () => {
    const success = inventory.addItem('small_potion', 50);
    expect(success).toBe(true);
    expect(inventory.getItem('small_potion')).toBe(50);
  });

  it('should cap items at 99', () => {
    inventory.addItem('small_potion', 80);
    const success = inventory.addItem('small_potion', 30); // Would be 110, capped at 99
    expect(success).toBe(true);
    expect(inventory.getItem('small_potion')).toBe(99);
  });

  it('should not add items when storage is full', () => {
    inventory.addItem('small_potion', 99);
    const success = inventory.addItem('small_potion', 1); // Can't add more
    expect(success).toBe(false);
    expect(inventory.getItem('small_potion')).toBe(99);
  });

  it('should remove items correctly', () => {
    inventory.addItem('small_potion', 50);
    const success = inventory.removeItem('small_potion', 20);
    expect(success).toBe(true);
    expect(inventory.getItem('small_potion')).toBe(30);
  });

  it('should not remove items if insufficient', () => {
    inventory.addItem('small_potion', 10);
    const success = inventory.removeItem('small_potion', 20);
    expect(success).toBe(false);
    expect(inventory.getItem('small_potion')).toBe(10);
  });

  it('should check if item exists', () => {
    expect(inventory.hasItem('small_potion')).toBe(false);
    inventory.addItem('small_potion', 1);
    expect(inventory.hasItem('small_potion')).toBe(true);
  });

  it('should reject unknown items', () => {
    const success = inventory.addItem('unknown_item_xyz', 1);
    expect(success).toBe(false);
    expect(inventory.getItem('unknown_item_xyz')).toBe(0);
  });

  it('should return all items as a copy', () => {
    inventory.addItem('small_potion', 5);
    inventory.addItem('big_potion', 3);
    const allItems = inventory.getAllItems();
    expect(allItems['small_potion']).toBe(5);
    expect(allItems['big_potion']).toBe(3);
    // Verify it's a copy (modifying returned object doesn't affect inventory)
    allItems['small_potion'] = 999;
    expect(inventory.getItem('small_potion')).toBe(5);
  });

  // ==================== BAIT TESTS ====================

  it('should add bait correctly', () => {
    const success = inventory.addBait('worm_bait', 10);
    expect(success).toBe(true);
    expect(inventory.getBait('worm_bait')).toBe(10);
  });

  it('should cap bait at 99', () => {
    inventory.addBait('worm_bait', 80);
    inventory.addBait('worm_bait', 30); // Would be 110, capped at 99
    expect(inventory.getBait('worm_bait')).toBe(99);
  });

  it('should remove bait correctly', () => {
    inventory.addBait('glitter_lure', 25);
    const success = inventory.removeBait('glitter_lure', 10);
    expect(success).toBe(true);
    expect(inventory.getBait('glitter_lure')).toBe(15);
  });

  it('should not remove bait if insufficient', () => {
    inventory.addBait('glitter_lure', 5);
    const success = inventory.removeBait('glitter_lure', 10);
    expect(success).toBe(false);
    expect(inventory.getBait('glitter_lure')).toBe(5);
  });

  it('should check if bait is available', () => {
    expect(inventory.hasBait('deep_hook')).toBe(false);
    inventory.addBait('deep_hook', 1);
    expect(inventory.hasBait('deep_hook')).toBe(true);
  });

  it('should reject unknown bait', () => {
    const success = inventory.addBait('unknown_bait_xyz', 1);
    expect(success).toBe(false);
    expect(inventory.getBait('unknown_bait_xyz')).toBe(0);
  });

  it('should return all baits as a copy', () => {
    inventory.addBait('worm_bait', 3);
    inventory.addBait('glitter_lure', 7);
    const allBaits = inventory.getAllBaits();
    expect(allBaits['worm_bait']).toBe(3);
    expect(allBaits['glitter_lure']).toBe(7);
  });

  it('should provide bait definitions', () => {
    const def = inventory.getBaitDefinition('worm_bait');
    expect(def).not.toBeNull();
    expect(def?.name).toBe('Worm Bait');
    expect(def?.rarityBoost).toBe(0.1);
  });

  it('should return null for unknown bait definition', () => {
    const def = inventory.getBaitDefinition('unknown_bait');
    expect(def).toBeNull();
  });

  // ==================== PARTY / FISH TESTS ====================

  it('should check if party has room', () => {
    const ship = inventory.getShip();
    expect(inventory.canAddFish()).toBe(true);
    expect(inventory.getPartySize()).toBe(0);
    expect(inventory.getMaxPartySize()).toBe(3);
  });

  it('should add fish to party', () => {
    const fish: FishInstance = {
      id: 1,
      nickname: 'Test Fish',
      level: 5,
      currentHp: 40,
      maxHp: 40,
      stats: { atk: 10, def: 10, spd: 10 },
      type: 'water',
    };

    const success = inventory.addFish(fish);
    expect(success).toBe(true);
    expect(inventory.getPartySize()).toBe(1);
  });

  it('should not add fish if party is full', () => {
    const fish: FishInstance = {
      id: 1,
      nickname: 'Fish',
      level: 5,
      currentHp: 40,
      maxHp: 40,
      stats: { atk: 10, def: 10, spd: 10 },
      type: 'water',
    };

    // Fill party to max (3)
    inventory.addFish(fish);
    inventory.addFish(fish);
    inventory.addFish(fish);
    expect(inventory.canAddFish()).toBe(false);

    // Try to add one more
    const success = inventory.addFish(fish);
    expect(success).toBe(false);
    expect(inventory.getPartySize()).toBe(3);
  });

  it('should remove fish by index', () => {
    const fish: FishInstance = {
      id: 1,
      nickname: 'Fish',
      level: 5,
      currentHp: 40,
      maxHp: 40,
      stats: { atk: 10, def: 10, spd: 10 },
      type: 'water',
    };

    inventory.addFish(fish);
    inventory.addFish(fish);

    const removed = inventory.removeFish(0);
    expect(removed).not.toBeNull();
    expect(inventory.getPartySize()).toBe(1);
  });

  it('should return null when removing invalid fish index', () => {
    const removed = inventory.removeFish(0);
    expect(removed).toBeNull();

    const removed2 = inventory.removeFish(-1);
    expect(removed2).toBeNull();
  });

  it('should return party as a defensive copy', () => {
    const fish: FishInstance = {
      id: 1,
      nickname: 'Fish',
      level: 5,
      currentHp: 40,
      maxHp: 40,
      stats: { atk: 10, def: 10, spd: 10 },
      type: 'water',
    };

    inventory.addFish(fish);
    const party = inventory.getParty();
    expect(party.length).toBe(1);

    // Modifying returned array shouldn't affect inventory
    party.pop();
    expect(inventory.getPartySize()).toBe(1);
  });

  // ==================== TREASURE TESTS ====================

  it('should discover treasure spots', () => {
    const key = 'home_spot1';
    inventory.discoverTreasure(key);
    expect(inventory.isTreasureDiscovered(key)).toBe(true);
  });

  it('should not add duplicate discovered treasures', () => {
    const key = 'home_spot1';
    inventory.discoverTreasure(key);
    inventory.discoverTreasure(key);
    inventory.discoverTreasure(key);

    const treasures = inventory.getDiscoveredTreasures();
    const count = treasures.filter((t) => t === key).length;
    expect(count).toBe(1);
  });

  it('should return discovered treasures as a copy', () => {
    inventory.discoverTreasure('spot1');
    inventory.discoverTreasure('spot2');

    const treasures = inventory.getDiscoveredTreasures();
    expect(treasures.length).toBe(2);

    // Modifying returned array shouldn't affect inventory
    treasures.pop();
    expect(inventory.getDiscoveredTreasures().length).toBe(2);
  });

  // ==================== UTILITY TESTS ====================

  it('should provide inventory summary', () => {
    inventory.addGold(100);
    inventory.addItem('small_potion', 5);
    inventory.addBait('worm_bait', 3);

    const summary = inventory.getInventorySummary();
    expect(summary.gold).toBe(100);
    expect(summary.itemCount).toBe(5);
    expect(summary.baitCount).toBe(3);
    expect(summary.partySize).toBe(0);
    expect(summary.maxPartySize).toBe(3);
  });

  it('should clear entire inventory', () => {
    inventory.addGold(100);
    inventory.addItem('small_potion', 5);
    inventory.addBait('worm_bait', 3);
    inventory.discoverTreasure('spot1');

    inventory.clearInventory();

    expect(inventory.getGold()).toBe(0);
    expect(inventory.getItem('small_potion')).toBe(0);
    expect(inventory.getBait('worm_bait')).toBe(0);
    expect(inventory.isTreasureDiscovered('spot1')).toBe(false);
    expect(inventory.getPartySize()).toBe(0);
  });

  it('should initialize undefined fields on construction', () => {
    const ship = createShip(1, 'Empty Ship', true, 3);
    // Intentionally clear fields to test initialization
    ship.gold = undefined;
    ship.items = undefined as any;
    ship.baitInventory = undefined;
    ship.discoveredTreasures = undefined;

    const inv = new InventoryManager(ship);

    // Should not throw errors and should return 0/empty
    expect(inv.getGold()).toBe(0);
    expect(inv.getAllItems()).toEqual({});
    expect(inv.getAllBaits()).toEqual({});
    expect(inv.getDiscoveredTreasures()).toEqual([]);
  });
});
