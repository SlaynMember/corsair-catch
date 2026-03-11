# Inventory System — Pseudocode Reference

Quick reference for implementing the InventoryManager and wiring it into states.

---

## 1. InventoryManager Class (Complete)

```typescript
// File: src/components/InventoryManager.ts

import type { ShipComponent } from './ShipComponent';
import type { FishInstance } from '../data/fish-db';
import { ITEMS } from '../data/item-db';

// Assume BAITS is imported or moved to item-db
export interface BaitDefinition {
  name: string;
  desc: string;
  price: number;
  rarityBoost: number;
}

export class InventoryManager {
  private ship: ShipComponent;

  constructor(ship: ShipComponent) {
    this.ship = ship;
    // Initialize undefined fields
    if (!this.ship.gold) this.ship.gold = 0;
    if (!this.ship.items) this.ship.items = {};
    if (!this.ship.baitInventory) this.ship.baitInventory = {};
    if (!this.ship.discoveredTreasures) this.ship.discoveredTreasures = [];
  }

  // ====== GOLD ======

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

  // ====== ITEMS (CONSUMABLES) ======

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

  // ====== BAIT ======

  /**
   * Add bait count. Capped at 99 per bait type.
   */
  public addBait(baitId: string, count: number = 1): boolean {
    // NOTE: Assume BAITS is passed as constructor dependency or global
    // For now, mock check: valid bait IDs are 'worm_bait', 'glitter_lure', 'deep_hook'
    const validBaits = ['worm_bait', 'glitter_lure', 'deep_hook'];
    if (!validBaits.includes(baitId)) {
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

  // ====== PARTY / FISH ======

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

  // ====== TREASURES (METADATA) ======

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

  // ====== UTILITY ======

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
  }
}
```

---

## 2. SaveData Update

```typescript
// File: src/core/SaveManager.ts (UPDATED)

import type { FishInstance } from '../data/fish-db';

const SAVE_KEY = 'corsair-catch-save';

/**
 * Complete SaveData interface with all inventory fields.
 */
export interface SaveData {
  // Position & time
  playerX: number;
  playerZ: number;
  playerRotation: number;
  playtime?: number;

  // Ship & crew
  shipId: number;             // ADDED: which ship player owns
  party: FishInstance[];
  maxPartySize?: number;
  hullHp?: number;            // ADDED: current hull durability

  // Inventory
  gold?: number;
  items?: Record<string, number>;
  baitInventory?: Record<string, number>;
  discoveredTreasures?: string[];
}

/**
 * Save game state to localStorage.
 * Call this from SailingState or appropriate places.
 */
export function saveGame(data: SaveData): void {
  try {
    const sanitized: SaveData = {
      playerX: data.playerX,
      playerZ: data.playerZ,
      playerRotation: data.playerRotation,
      shipId: data.shipId ?? 1,  // Default to starter ship
      party: data.party ?? [],
      maxPartySize: data.maxPartySize,
      hullHp: data.hullHp,
      playtime: data.playtime,
      gold: data.gold ?? 0,
      items: data.items ?? {},
      baitInventory: data.baitInventory ?? {},
      discoveredTreasures: data.discoveredTreasures ?? [],
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(sanitized));
  } catch (err) {
    console.error('Failed to save game:', err);
    // localStorage may be full or unavailable
  }
}

/**
 * Load game state from localStorage.
 * Returns null if no save found.
 */
export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    // Provide defaults for new fields
    return {
      shipId: data.shipId ?? 1,
      gold: data.gold ?? 0,
      items: data.items ?? {},
      baitInventory: data.baitInventory ?? {},
      discoveredTreasures: data.discoveredTreasures ?? [],
      ...data,
    };
  } catch (err) {
    console.error('Failed to load game:', err);
    return null;
  }
}

/**
 * Check if a save exists.
 */
export function hasSave(): boolean {
  return !!localStorage.getItem(SAVE_KEY);
}

/**
 * Delete save game.
 */
export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
```

---

## 3. Integration: FishingState (Bait Selection)

```typescript
// File: src/states/FishingState.ts (ADDITIONS)

import { InventoryManager } from '../components/InventoryManager';

export class FishingState implements GameState {
  private inventory: InventoryManager;
  private selectedBait: string | null = null;

  enter(): void {
    // ... existing code ...
    this.inventory = new InventoryManager(this.playerShip);

    // Show bait selection UI BEFORE cast starts
    if (this.shouldShowBaitUI()) {
      this.showBaitSelectionMenu();
    } else {
      this.startCastPhase();
    }
  }

  private shouldShowBaitUI(): boolean {
    const allBaits = this.inventory.getAllBaits();
    return Object.keys(allBaits).length > 0;
  }

  private showBaitSelectionMenu(): void {
    const allBaits = this.inventory.getAllBaits();

    // Build bait options
    const options = [
      { id: null, name: 'None', desc: 'Standard catch rate', boost: 0 },
      ...Object.entries(allBaits).map(([id, count]) => {
        const baitDef = getBaitDef(id); // Your BAITS lookup
        return {
          id,
          name: baitDef.name,
          desc: `×${count} owned • +${Math.round(baitDef.rarityBoost * 100)}%`,
          boost: baitDef.rarityBoost,
        };
      }),
    ];

    // Show UI (pseudo-code; adjust to your UIManager)
    this.ui.show('bait-select', buildBaitMenuHtml(options));

    // Bind confirm handler
    document.querySelectorAll('[data-bait-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const baitId = (btn as HTMLElement).dataset.baitId ?? null;
        this.confirmBaitSelection(baitId);
      });
    });
  }

  private confirmBaitSelection(baitId: string | null): void {
    if (baitId) {
      // Try to consume bait
      if (!this.inventory.removeBait(baitId)) {
        this.ui.remove('bait-select');
        this.showMessage('Not enough bait!');
        return;
      }
      this.selectedBait = baitId;
      // Apply rarity boost to fishing system
      const baitDef = getBaitDef(baitId);
      this.state.rarityBoost = (this.state.rarityBoost ?? 0) + baitDef.rarityBoost;
    }

    this.ui.remove('bait-select');
    this.startCastPhase();
  }

  update(dt: number): void {
    // ... existing code ...
    // When fish is caught, bait is already consumed (done in confirmBaitSelection)
  }
}
```

---

## 4. Integration: BattleState (Item Usage)

```typescript
// File: src/states/BattleState.ts (ADDITIONS)

import { InventoryManager } from '../components/InventoryManager';
import { ITEMS } from '../data/item-db';

export class BattleState implements GameState {
  private inventory: InventoryManager;

  enter(): void {
    // ... existing code ...
    this.inventory = new InventoryManager(this.playerShip);
  }

  update(dt: number): void {
    // ... existing code ...
    // When player opens battle menu, add ITEMS option:
    const menuOptions = ['FIGHT', 'FISH', 'ITEMS', 'FLEE'];
    if (this.inventory.getAllItems().length === 0) {
      // Remove ITEMS from menu if no items available
      menuOptions.splice(2, 1);
    }
  }

  onItemMenuOpened(): void {
    const allItems = this.inventory.getAllItems();

    if (Object.keys(allItems).length === 0) {
      this.showMessage('No items available!');
      return;
    }

    // Show item selection menu
    const itemOptions = Object.entries(allItems).map(([id, count]) => {
      const itemDef = ITEMS[id];
      return {
        id,
        name: itemDef.name,
        count,
        desc: itemDef.description,
      };
    });

    this.ui.show('item-select', buildItemMenuHtml(itemOptions));

    // Bind click to item
    document.querySelectorAll('[data-item-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const itemId = (btn as HTMLElement).dataset.itemId!;
        this.showTargetSelection(itemId);
      });
    });
  }

  private showTargetSelection(itemId: string): void {
    const itemDef = ITEMS[itemId];
    const party = this.inventory.getParty();

    // Show which fish to apply item to
    this.ui.show('target-select', buildTargetMenuHtml(party, itemDef.name));

    document.querySelectorAll('[data-target-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt((btn as HTMLElement).dataset.targetIdx!);
        this.useItem(itemId, idx);
      });
    });
  }

  private useItem(itemId: string, targetIndex: number): void {
    const itemDef = ITEMS[itemId];
    if (!itemDef) return;

    // Try to consume item
    if (!this.inventory.removeItem(itemId)) {
      this.showMessage('Item unavailable!');
      return;
    }

    const targetFish = this.playerShip.party[targetIndex];
    if (!targetFish) return;

    // Apply effect
    if (itemDef.effect.heal) {
      const healAmount = Math.floor(targetFish.maxHp * itemDef.effect.heal);
      targetFish.currentHp = Math.min(targetFish.maxHp, targetFish.currentHp + healAmount);
      this.showMessage(`Used ${itemDef.name}! +${healAmount} HP`);
      this.audio.playSFX('heal');
    } else if (itemDef.effect.cureStatus) {
      // Assuming fish has a status field
      // targetFish.status = null;
      this.showMessage(`Used ${itemDef.name}! Status cured!`);
      this.audio.playSFX('cure');
    } else if (itemDef.effect.revive) {
      targetFish.currentHp = Math.floor(targetFish.maxHp * 0.25);
      this.showMessage(`Used ${itemDef.name}! Revived!`);
      this.audio.playSFX('revive');
    }

    // Close menus and continue battle
    this.ui.remove('item-select');
    this.ui.remove('target-select');
    this.updatePartyDisplay();
    this.resumeBattle();
  }
}
```

---

## 5. Integration: DockingUI (Treasure Loot)

```typescript
// File: src/ui/DockingUI.ts (UPDATED bindTreasureTiles)

function bindTreasureTiles(
  island: IslandData,
  discoveredTreasures: string[],
  ship: ShipComponent,
  ui: UIManager
): void {
  const inventory = new InventoryManager(ship);

  setTimeout(() => {
    document.querySelectorAll('.treasure-tile').forEach((tile) => {
      tile.addEventListener('click', () => {
        const idx = parseInt((tile as HTMLElement).dataset.idx ?? '0');
        const key = `${island.id}_spot${idx}`;

        // Check if already discovered
        if (inventory.isTreasureDiscovered(key)) return;

        const hasX = idx === 1 || idx === 7; // Your treasure pattern

        // Mark as discovered
        inventory.discoverTreasure(key);
        tile.classList.add('treasure-dug');

        if (hasX) {
          const loot = rollLoot(); // Your existing rollLoot function
          audio.playSFX('catch');

          if (loot.type === 'gold') {
            // Use inventory manager
            inventory.addGold(loot.amount ?? 0);
            tile.textContent = '💰';
          } else if (loot.type === 'bait' && loot.id) {
            // Use inventory manager
            if (!inventory.addBait(loot.id)) {
              // Bait storage full; drop excess
              console.warn(`Bait storage full: ${loot.id}`);
            }
            tile.textContent = '🎣';
          } else if (loot.type === 'item' && loot.id) {
            // Use inventory manager
            if (!inventory.addItem(loot.id)) {
              // Item storage full
              console.warn(`Item storage full: ${loot.id}`);
            }
            tile.textContent = '🧪';
          }

          const result = document.getElementById('treasure-result');
          if (result) {
            result.innerHTML = `<div class="loot-popup">FOUND: ${loot.label}</div>`;
            setTimeout(() => {
              result.innerHTML = '';
            }, 3000);
          }
        } else {
          tile.textContent = '·';
          audio.playSFX('splash');
        }
      });
    });
  }, 30);
}
```

---

## 6. Helper: Inventory UI Tab (Pseudocode)

```typescript
// Pseudocode for updated InventoryUI.ts

export function showInventory(
  ui: UIManager,
  ship: ShipComponent,
  onClose: () => void
): void {
  const inventory = new InventoryManager(ship);
  const summary = inventory.getInventorySummary();

  const tabHtml = `
    <div class="inventory-overlay panel-slide-in">
      <div class="inventory-header">
        YOUR RESOURCES
        <span class="gold-display">⬡ ${summary.gold}g</span>
      </div>

      <div class="inventory-tabs">
        <button class="inv-tab inv-tab-active" id="tab-crew">CREW</button>
        <button class="inv-tab" id="tab-bait">BAIT</button>
        <button class="inv-tab" id="tab-items">ITEMS</button>
        <button class="inv-tab" id="tab-close">CLOSE [I]</button>
      </div>

      <div class="inventory-content" id="inv-content">
        <!-- Tabs injected here -->
      </div>
    </div>
  `;

  const panel = ui.show('inventory', tabHtml);

  // Tab handling
  const tabButtons = panel.querySelectorAll('.inv-tab');
  const contentArea = panel.querySelector('#inv-content');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabName = btn.textContent?.toLowerCase();
      tabButtons.forEach((b) => b.classList.remove('inv-tab-active'));
      btn.classList.add('inv-tab-active');

      if (tabName === 'crew') {
        contentArea!.innerHTML = buildCrewTab(inventory);
      } else if (tabName === 'bait') {
        contentArea!.innerHTML = buildBaitTab(inventory);
      } else if (tabName === 'items') {
        contentArea!.innerHTML = buildItemsTab(inventory);
      } else if (tabName === 'close [i]') {
        onClose();
      }
    });
  });

  // Initial crew tab
  contentArea!.innerHTML = buildCrewTab(inventory);
}

function buildBaitTab(inventory: InventoryManager): string {
  const baits = inventory.getAllBaits();
  const baitDefs = getBaitDefinitions(); // Your BAITS lookup

  const rows = Object.entries(baits).map(([id, count]) => {
    const def = baitDefs[id];
    return `
      <div class="bait-row">
        <div class="bait-name">${def.name}</div>
        <div class="bait-desc">${def.desc}</div>
        <div class="bait-count">×${count}</div>
      </div>
    `;
  });

  return `
    <div class="bait-panel">
      ${rows.length > 0 ? rows.join('') : '<div>No bait collected yet.</div>'}
    </div>
  `;
}

function buildItemsTab(inventory: InventoryManager): string {
  const items = inventory.getAllItems();

  const rows = Object.entries(items).map(([id, count]) => {
    const def = ITEMS[id];
    return `
      <div class="item-row">
        <div class="item-icon">${def.icon}</div>
        <div class="item-name">${def.name}</div>
        <div class="item-desc">${def.description}</div>
        <div class="item-count">×${count}</div>
      </div>
    `;
  });

  return `
    <div class="items-panel">
      ${rows.length > 0 ? rows.join('') : '<div>No items collected yet.</div>'}
    </div>
  `;
}
```

---

## Summary

These pseudocode snippets show:

1. **InventoryManager**: Full class with all operations for gold, items, bait, fish, treasures
2. **SaveData**: Updated interface + persistence functions
3. **FishingState**: Bait selection before cast
4. **BattleState**: Item selection and usage
5. **DockingUI**: Integration with treasure loot system
6. **InventoryUI**: Tab-based resource display

**Implementation order:**
1. Create InventoryManager class
2. Update SaveManager with new SaveData fields
3. Wire InventoryManager into FishingState (bait selection)
4. Wire InventoryManager into DockingUI (loot drops)
5. Wire InventoryManager into BattleState (item usage)
6. Update InventoryUI with tabs for items/bait/gold

