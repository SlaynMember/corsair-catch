import type { ShipComponent } from '../components/ShipComponent';
import type { FishInstance } from '../data/fish-db';
import { ITEMS } from '../data/item-db';

/**
 * Bait definition interface (matches DockingUI BAITS structure)
 */
export interface BaitDefinition {
  name: string;
  desc: string;
  price: number;
  rarityBoost: number;
}

/**
 * Valid bait types in the game
 */
const VALID_BAITS: Record<string, BaitDefinition> = {
  worm_bait: {
    name: 'Worm Bait',
    desc: '+10% UNCOMMON chance',
    price: 50,
    rarityBoost: 0.1,
  },
  glitter_lure: {
    name: 'Glitter Lure',
    desc: '+15% RARE chance',
    price: 100,
    rarityBoost: 0.15,
  },
  deep_hook: {
    name: 'Deep Hook',
    desc: '+20% RARE, deeper fish',
    price: 150,
    rarityBoost: 0.2,
  },
};

/**
 * InventoryManager - unified access layer for all ship inventory operations
 * Manages: gold, items, bait, party (fish), discovered treasures
 */
export class InventoryManager {
  private ship: ShipComponent;

  constructor(ship: ShipComponent) {
    this.ship = ship;
    // Initialize undefined fields to prevent null checks everywhere
    if (!this.ship.gold) this.ship.gold = 0;
    if (!this.ship.items) this.ship.items = {};
    if (!this.ship.baitInventory) this.ship.baitInventory = {};
    if (!this.ship.discoveredTreasures) this.ship.discoveredTreasures = [];
    if (!this.ship.fishCaught) this.ship.fishCaught = 0;
  }

  // ==================== GOLD ====================

  /**
   * Add gold to ship inventory.
   * @param amount How much gold to add
   */
  public addGold(amount: number): void {
    this.ship.gold = (this.ship.gold ?? 0) + Math.max(0, amount);
  }

  /**
   * Remove gold from ship inventory.
   * @returns true if transaction successful, false if insufficient funds
   */
  public removeGold(amount: number): boolean {
    const current = this.ship.gold ?? 0;
    if (current < amount) return false;
    this.ship.gold = current - amount;
    return true;
  }

  /**
   * Get current gold balance.
   */
  public getGold(): number {
    return this.ship.gold ?? 0;
  }

  // ==================== ITEMS (CONSUMABLES) ====================

  /**
   * Add item count. Capped at 99 per item type.
   * @returns true if successful, false if storage full and no increase possible
   */
  public addItem(itemId: string, count: number = 1): boolean {
    if (!ITEMS[itemId]) {
      console.warn(`Unknown item: ${itemId}`);
      return false;
    }
    const current = this.ship.items[itemId] ?? 0;
    const newCount = Math.min(99, current + count);
    if (newCount === current && current >= 99) {
      return false; // Storage full, no change made
    }
    this.ship.items[itemId] = newCount;
    return true;
  }

  /**
   * Remove item count.
   * @returns true if successful, false if insufficient items
   */
  public removeItem(itemId: string, count: number = 1): boolean {
    const current = this.ship.items[itemId] ?? 0;
    if (current < count) return false;
    this.ship.items[itemId] = Math.max(0, current - count);
    return true;
  }

  /**
   * Get count of a specific item.
   */
  public getItem(itemId: string): number {
    return this.ship.items[itemId] ?? 0;
  }

  /**
   * Get all items as a copy.
   */
  public getAllItems(): Record<string, number> {
    return { ...this.ship.items };
  }

  /**
   * Check if item exists and is available.
   */
  public hasItem(itemId: string): boolean {
    return (this.ship.items[itemId] ?? 0) > 0;
  }

  // ==================== BAIT ====================

  /**
   * Add bait count. Capped at 99 per bait type.
   */
  public addBait(baitId: string, count: number = 1): boolean {
    if (!VALID_BAITS[baitId]) {
      console.warn(`Unknown bait: ${baitId}`);
      return false;
    }

    if (!this.ship.baitInventory) this.ship.baitInventory = {};
    const current = this.ship.baitInventory[baitId] ?? 0;
    const newCount = Math.min(99, current + count);
    if (newCount === current && current >= 99) {
      return false;
    }
    this.ship.baitInventory[baitId] = newCount;
    return true;
  }

  /**
   * Remove bait count.
   */
  public removeBait(baitId: string, count: number = 1): boolean {
    if (!this.ship.baitInventory) this.ship.baitInventory = {};
    const current = this.ship.baitInventory[baitId] ?? 0;
    if (current < count) return false;
    this.ship.baitInventory[baitId] = Math.max(0, current - count);
    return true;
  }

  /**
   * Get count of a specific bait.
   */
  public getBait(baitId: string): number {
    return this.ship.baitInventory?.[baitId] ?? 0;
  }

  /**
   * Get all baits as a copy.
   */
  public getAllBaits(): Record<string, number> {
    return this.ship.baitInventory ? { ...this.ship.baitInventory } : {};
  }

  /**
   * Check if bait is available.
   */
  public hasBait(baitId: string): boolean {
    return this.getBait(baitId) > 0;
  }

  /**
   * Get bait definition by ID.
   */
  public getBaitDefinition(baitId: string): BaitDefinition | null {
    return VALID_BAITS[baitId] ?? null;
  }

  // ==================== PARTY / FISH ====================

  /**
   * Check if there's room to add another fish.
   */
  public canAddFish(): boolean {
    return this.ship.party.length < this.ship.maxPartySize;
  }

  /**
   * Add fish to party.
   * @returns true if successful, false if party is full
   */
  public addFish(fish: FishInstance): boolean {
    if (!this.canAddFish()) return false;
    this.ship.party.push(fish);
    return true;
  }

  /**
   * Remove fish by index.
   * @returns the removed fish, or null if index out of bounds
   */
  public removeFish(index: number): FishInstance | null {
    if (index < 0 || index >= this.ship.party.length) return null;
    const removed = this.ship.party.splice(index, 1);
    return removed[0] ?? null;
  }

  /**
   * Get current party (defensive copy).
   */
  public getParty(): FishInstance[] {
    return [...this.ship.party];
  }

  /**
   * Get party size.
   */
  public getPartySize(): number {
    return this.ship.party.length;
  }

  /**
   * Get max party size for this ship.
   */
  public getMaxPartySize(): number {
    return this.ship.maxPartySize;
  }

  // ==================== TREASURES (METADATA) ====================

  /**
   * Mark a treasure spot as discovered (prevent re-digging).
   */
  public discoverTreasure(key: string): void {
    if (!this.ship.discoveredTreasures) {
      this.ship.discoveredTreasures = [];
    }
    if (!this.ship.discoveredTreasures.includes(key)) {
      this.ship.discoveredTreasures.push(key);
    }
  }

  /**
   * Check if a treasure spot has been discovered.
   */
  public isTreasureDiscovered(key: string): boolean {
    return this.ship.discoveredTreasures?.includes(key) ?? false;
  }

  /**
   * Get all discovered treasure keys.
   */
  public getDiscoveredTreasures(): string[] {
    return this.ship.discoveredTreasures ? [...this.ship.discoveredTreasures] : [];
  }

  // ==================== FISH CAUGHT (SHIP UNLOCKS) ====================

  /**
   * Record a fish catch for unlock progression.
   */
  public recordFishCaught(): void {
    this.ship.fishCaught = (this.ship.fishCaught ?? 0) + 1;
  }

  /**
   * Get total fish caught (for ship unlock tier detection).
   */
  public getFishCaught(): number {
    return this.ship.fishCaught ?? 0;
  }

  /**
   * Set fish caught (used when loading saves).
   */
  public setFishCaught(count: number): void {
    this.ship.fishCaught = Math.max(0, count);
  }

  // ==================== UTILITY ====================

  /**
   * Get summary of all inventory contents.
   */
  public getInventorySummary() {
    const itemCount = Object.values(this.ship.items ?? {}).reduce((sum, c) => sum + c, 0);
    const baitCount = Object.values(this.ship.baitInventory ?? {}).reduce((sum, c) => sum + c, 0);
    return {
      gold: this.getGold(),
      itemCount,
      baitCount,
      partySize: this.ship.party.length,
      maxPartySize: this.ship.maxPartySize,
    };
  }

  /**
   * Clear all inventory (for testing or reset).
   */
  public clearInventory(): void {
    this.ship.gold = 0;
    this.ship.items = {};
    this.ship.baitInventory = {};
    this.ship.party = [];
    this.ship.discoveredTreasures = [];
    this.ship.fishCaught = 0;
  }

  /**
   * Get reference to underlying ship (for direct access if needed)
   */
  public getShip(): ShipComponent {
    return this.ship;
  }
}
