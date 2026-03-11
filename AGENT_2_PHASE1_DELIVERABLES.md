# Agent 2: Phase 1 — Inventory System Implementation ✅

**Status:** COMPLETE
**Date:** March 10, 2026
**Tests:** 33/33 passing

---

## Overview

Phase 1 implements the **foundational inventory system** that all other systems depend on. This includes:
1. ✅ **InventoryManager class** — unified access layer for all inventory operations
2. ✅ **SaveData interface update** — added `shipId` and `hullHp` persistence
3. ✅ **SaveManager enhancements** — proper save/load with defaults
4. ✅ **Unit tests** — 33 comprehensive tests covering all operations

Agent 3 (Ship Unlock System) will depend on this foundation.

---

## Files Created/Modified

### New Files
| File | Purpose | Lines |
|------|---------|-------|
| `src/core/InventoryManager.ts` | Core inventory manager class | 413 |
| `tests/InventoryManager.test.ts` | Unit test suite | 413 |

### Modified Files
| File | Changes |
|------|---------|
| `src/core/SaveManager.ts` | Added `shipId`, `hullHp` to SaveData; improved save/load logic |

---

## InventoryManager Class

**Location:** `src/core/InventoryManager.ts`
**Exports:** `InventoryManager` class, `BaitDefinition` interface, `VALID_BAITS` constant

### Purpose
Single unified API for all inventory operations on a `ShipComponent`. Manages:
- **Gold** (currency)
- **Items** (consumables: potions, biscuits, antidotes, revives)
- **Bait** (fishing modifiers: worm_bait, glitter_lure, deep_hook)
- **Party** (fish crew, max 3)
- **Treasures** (discovered spot metadata)

### Key Methods

#### Gold Management
```typescript
addGold(amount: number): void
removeGold(amount: number): boolean  // Returns success
getGold(): number
```

#### Items (Consumables)
```typescript
addItem(itemId: string, count?: number): boolean    // Capped at 99
removeItem(itemId: string, count?: number): boolean
getItem(itemId: string): number
getAllItems(): Record<string, number>
hasItem(itemId: string): boolean
```

#### Bait (Fishing)
```typescript
addBait(baitId: string, count?: number): boolean    // Capped at 99
removeBait(baitId: string, count?: number): boolean
getBait(baitId: string): number
getAllBaits(): Record<string, number>
hasBait(baitId: string): boolean
getBaitDefinition(baitId: string): BaitDefinition | null
```

#### Party (Fish Crew)
```typescript
canAddFish(): boolean
addFish(fish: FishInstance): boolean
removeFish(index: number): FishInstance | null
getParty(): FishInstance[]
getPartySize(): number
getMaxPartySize(): number
```

#### Treasures (Metadata)
```typescript
discoverTreasure(key: string): void
isTreasureDiscovered(key: string): boolean
getDiscoveredTreasures(): string[]
```

#### Utility
```typescript
getInventorySummary(): { gold, itemCount, baitCount, partySize, maxPartySize }
clearInventory(): void  // Testing/reset only
getShip(): ShipComponent  // Direct access if needed
```

### Design Decisions

1. **Constructor initializes undefined fields** — Prevents null/undefined crashes throughout the API
2. **Soft caps (99) instead of hard caps** — UI can show "99+" without losing data; future upgrades can increase
3. **Bait definitions embedded** — Mirrors DockingUI structure; single source of truth
4. **Defensive copies** — `getParty()`, `getAllItems()`, etc. return copies, not references
5. **Validation on add** — Unknown items/baits return false, log warning

---

## SaveData Interface Update

**Location:** `src/core/SaveManager.ts`

### Added Fields
```typescript
shipId: number;        // Which ship player owns (default: 1)
hullHp?: number;       // Current hull durability
```

### Complete SaveData Structure
```typescript
export interface SaveData {
  // Position & player data
  playerX: number;
  playerZ: number;
  playerRotation: number;
  playtime?: number;

  // Ship & crew
  shipId: number;               // NEW: ship database ID
  party: FishInstance[];
  maxPartySize?: number;
  hullHp?: number;              // NEW: hull durability

  // Inventory
  gold?: number;
  items?: Record<string, number>;
  baitInventory?: Record<string, number>;
  discoveredTreasures?: string[];
}
```

### Save/Load Behavior
- **saveGame()** — Sanitizes data, applies defaults, persists to localStorage
- **loadGame()** — Loads from localStorage, applies defaults for missing fields (backwards compatibility)
- **hasSave()** — Check if save exists
- **deleteSave()** — Wipe save

### Default Values Applied on Load
```
shipId: 1 (starter ship)
gold: 0
items: {}
baitInventory: {}
discoveredTreasures: []
```

---

## Unit Tests

**Location:** `tests/InventoryManager.test.ts`
**Status:** ✅ 33/33 passing

### Test Coverage

#### Gold Tests (4)
- [x] Add gold correctly
- [x] Remove gold if sufficient funds
- [x] Reject removal if insufficient funds
- [x] Handle negative amounts (ignore)

#### Item Tests (7)
- [x] Add items up to soft cap (99)
- [x] Cap items at 99
- [x] Reject add when storage full
- [x] Remove items correctly
- [x] Reject removal if insufficient items
- [x] Check item existence
- [x] Reject unknown items
- [x] Return all items as defensive copy

#### Bait Tests (7)
- [x] Add bait correctly
- [x] Cap bait at 99
- [x] Remove bait correctly
- [x] Reject removal if insufficient
- [x] Check bait availability
- [x] Reject unknown bait
- [x] Return all baits as defensive copy
- [x] Provide bait definitions
- [x] Return null for unknown bait definition

#### Party / Fish Tests (6)
- [x] Check if party has room
- [x] Add fish to party
- [x] Reject add if party is full
- [x] Remove fish by index
- [x] Return null when removing invalid index
- [x] Return party as defensive copy

#### Treasure Tests (3)
- [x] Discover treasure spots
- [x] Prevent duplicate discovered treasures
- [x] Return discovered treasures as defensive copy

#### Utility Tests (2)
- [x] Provide inventory summary
- [x] Clear entire inventory
- [x] Initialize undefined fields on construction

---

## How Agent 3 Uses This

Agent 3 (Ship Unlock System) will depend on:

### 1. Access the InventoryManager
```typescript
import { InventoryManager } from '../core/InventoryManager';

const inventory = new InventoryManager(playerShip);
```

### 2. Increment Fish Count
```typescript
// In FishingState or wherever fish are caught:
const ship = playerShip;  // ShipComponent
ship.fishCaught = (ship.fishCaught ?? 0) + 1;

// Agent 3 will check: getUnlockedShipIds(ship.fishCaught)
```

### 3. Persist Ship ID
```typescript
// In SailingState.saveGameState():
const saveData: SaveData = {
  // ... existing fields ...
  shipId: this.playerShip.shipId,  // NEW: persist which ship is selected
  gold: inventory.getGold(),
  items: inventory.getAllItems(),
  baitInventory: inventory.getAllBaits(),
};
saveGame(saveData);
```

### 4. Restore Ship ID on Load
```typescript
// In SailingState.enter() (game load):
const loadedData = loadGame();
if (loadedData && this.playerShip) {
  this.playerShip.shipId = loadedData.shipId ?? 1;
  this.playerShip.gold = loadedData.gold ?? 0;
  this.playerShip.items = loadedData.items ?? {};
  // ... etc
}
```

---

## Integration Checklist for Agent 3

- [ ] Wire `fishCaught` counter into FishingState (increment on catch)
- [ ] Create `src/data/ship-unlock-db.ts` with unlock tiers
- [ ] Add `getUnlockedShipIds(fishCaught)` logic to ShipSelectionUI
- [ ] Show unlock progress bar in ShipSelectionUI
- [ ] Update DockingUI with FLEET tab showing available ships
- [ ] Validate ship selection against `getUnlockedShipIds()`
- [ ] Update SailingState to persist/load `shipId` via SaveData
- [ ] Show unlock notifications in FishingUI catch popup

---

## Future Extensions (Phase 2+)

### Phase 2: Fishing Loot
- Add loot drops on successful catch (materials, bonus gold)
- Integrate with inventory: `inventory.addItem(lootId)`
- Update treasure dig system to use InventoryManager

### Phase 3: UI (Inventory Screen)
- Build tabbed inventory UI (CREW, BAIT, ITEMS, TREASURES)
- Wire item usage in battle via `inventory.removeItem()`
- Show gold/resource counts in HUD

### Phase 4: Battle Items
- Add ITEMS button to battle menu
- Item selection → target selection → apply effect
- Consume items: `inventory.removeItem(itemId)`

### Phase 5: Crafting (Optional)
- Combine materials: 10 Fire Scales + 5 Water Drops → Ring
- Extend InventoryManager with `craftItem()` method

---

## Known Limitations / Future Work

1. **No crafting system yet** — Item combinations not supported
2. **Storage limits not enforced in UI** — 99-item cap exists but UI may not communicate it clearly
3. **Treasure metadata only** — `discoveredTreasures` prevents re-digging but doesn't track what was found
4. **No item prices in InventoryManager** — Prices defined in item-db.ts and DockingUI separately
5. **No bait prices in InventoryManager** — Bait prices hardcoded in DockingUI (future: move to item-db)

---

## Test Execution

```bash
cd /Users/willp/Local\ Sites/corsair-catch
npm test -- InventoryManager

# Output:
# ✓ tests/InventoryManager.test.ts (33 tests) 9ms
# Test Files 1 passed (1)
# Tests 33 passed (33)
```

---

## Files Ready for Agent 3

| File | Status | Notes |
|------|--------|-------|
| `src/core/InventoryManager.ts` | ✅ Ready | Production-ready, fully tested |
| `src/core/SaveManager.ts` | ✅ Ready | Updated with shipId persistence |
| `src/components/ShipComponent.ts` | ✅ No change | Already has all inventory fields |
| `tests/InventoryManager.test.ts` | ✅ Ready | 33 tests, all passing |

---

## Summary

**Phase 1 is complete.** The inventory system foundation is solid:
- InventoryManager provides a clean API for all inventory operations
- SaveData properly persists ship selection and inventory state
- 33 comprehensive tests verify correctness
- All systems can build on this foundation with confidence

**Agent 3 can now safely implement Ship Unlock on top of this foundation.**

---

**Next:** Agent 3 implements Ship Unlock System (Phase 2)
