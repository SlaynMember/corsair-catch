# Corsair Catch — Inventory System Design

**Author:** Agent #2 (Inventory System Designer)
**Date:** March 10, 2026
**Status:** Design + Pseudocode (Implementation TBD)

---

## Executive Summary

The game already has **skeleton structures** in place (SaveData, ShipComponent, item-db.ts, DockingUI), but they're **not fully wired together**. This document consolidates what exists, proposes a unified inventory architecture, and provides pseudocode for the missing pieces.

**Key insight:** The player's inventory is the `ShipComponent` on the player's ship. We need to formalize it, unify access patterns, and persist it cleanly.

---

## 1. Current State Analysis

### What Already Exists:

| Component | Location | Status |
|-----------|----------|--------|
| **SaveData** | `src/core/SaveManager.ts` | Partial — has `items`, `gold`, `baitInventory`, `discoveredTreasures`, but NOT `shipId` |
| **ShipComponent** | `src/components/ShipComponent.ts` | Has `items`, `gold`, `baitInventory`, `discoveredTreasures` fields |
| **Item Database** | `src/data/item-db.ts` | 5 consumable items with effects (heal, cure, revive) |
| **Bait System** | `src/ui/DockingUI.ts` | Bait shop fully implemented; items purchase/use not yet wired |
| **Fishing Rewards** | `src/states/FishingState.ts` | Adds caught fish to party; no loot drop system yet |
| **Treasure Hunting** | `src/ui/DockingUI.ts` | Rolling loot tables, rewards: gold, bait, items |
| **Inventory UI** | `src/ui/InventoryUI.ts` | Shows caught fish (party). NO items/bait/resources display |

### Gaps:

1. **SaveData doesn't include `shipId`** — player can't restore their current ship on load
2. **Fishing doesn't award loot** — catches are free; no risk/reward
3. **Items can't be used** — battle system doesn't consume items
4. **Loot probability isn't communicated** — players don't know what fishing/treasure gives
5. **Inventory UI is fish-only** — no display of gold, bait, items, materials
6. **Resource limits undefined** — can you hold 999 gold? 50 bait? Unlimited items?

---

## 2. Inventory System Architecture

### 2.1 Resource Types

The player manages **5 resource categories**:

#### A. Fish (Party)
- **Obtained:** Catch during fishing phase
- **Used:** Team in battle
- **Storage:** `ShipComponent.party[]` (limited by `maxPartySize`, default 3)
- **Persistence:** SaveData.party
- **Special:** Can be evolved, leveled, nicknamed

#### B. Gold (Currency)
- **Obtained:** Treasure hunting, selling fish, quest rewards
- **Used:** Buy bait/items at shops
- **Storage:** `ShipComponent.gold` (number, no limit)
- **Persistence:** SaveData.gold
- **Display:** HUD top-right corner

#### C. Bait (Consumables)
- **Obtained:** Treasure hunting rolls, shop purchases
- **Used:** Applied during fishing to increase rarity/depth
- **Storage:** `ShipComponent.baitInventory` (Record<baitId, count>)
- **Persistence:** SaveData.baitInventory
- **Types:** worm_bait, glitter_lure, deep_hook
- **Limit:** 99 per type (soft cap, can override)

#### D. Items (Consumables)
- **Obtained:** Treasure hunting rolls, quest rewards
- **Used:** Heal fish in battle, revive fainted fish, cure status
- **Storage:** `ShipComponent.items` (Record<itemId, count>)
- **Persistence:** SaveData.items
- **Types:** sea_biscuit, small_potion, big_potion, antidote, revive
- **Limit:** 99 per type (soft cap)

#### E. Discovered Treasures (Metadata)
- **Obtained:** Dig at treasure spots on islands
- **Used:** Prevents re-digging same spot (persistence)
- **Storage:** `ShipComponent.discoveredTreasures` (string[], treasure keys)
- **Persistence:** SaveData.discoveredTreasures
- **Format:** `{islandId}_spot{index}` (e.g., "home_spot1")

### 2.2 Data Structure (Current)

```typescript
// In ShipComponent (src/components/ShipComponent.ts)
export interface ShipComponent extends Component {
  type: 'ship';
  shipId: number;                      // References ship-db
  name: string;
  hullHp: number;
  maxHullHp: number;
  party: FishInstance[];               // A. Fish crew
  maxPartySize: number;
  isPlayer: boolean;

  // Inventory
  items: Record<string, number>;       // D. Consumable items
  gold?: number;                       // B. Currency
  baitInventory?: Record<string, number>; // C. Fishing baits
  discoveredTreasures?: string[];      // E. Treasure metadata
}

// In SaveData (src/core/SaveManager.ts)
interface SaveData {
  party: FishInstance[];
  playerX: number;
  playerZ: number;
  playerRotation: number;
  maxPartySize?: number;
  playtime?: number;

  // Inventory fields (PARTIAL — missing shipId!)
  items?: Record<string, number>;
  gold?: number;
  baitInventory?: Record<string, number>;
  discoveredTreasures?: string[];
}
```

---

## 3. Item & Bait Definitions

### 3.1 Items (Consumables, Battle/Healing)

```typescript
// From src/data/item-db.ts (CURRENT)
sea_biscuit: {
  id: 'sea_biscuit',
  name: 'Sea Biscuit',
  description: 'Restores 15% HP.',
  effect: { heal: 0.15 },
  icon: '🍪',
}
small_potion: { ... heal: 0.30 ... }
big_potion: { ... heal: 0.60 ... }
antidote: { ... cureStatus: true ... }
revive: { ... revive: true ... }
```

**Use Pattern:**
- Battle menu: "ITEMS" option shows available items
- Click item → select fish → apply (consume 1 of that item)
- Item effects apply immediately (heal %, cure status, revive at 25%)

### 3.2 Baits (Fishing Modifiers)

```typescript
// From src/ui/DockingUI.ts (CURRENT)
BAITS: {
  worm_bait: {
    name: 'Worm Bait',
    desc: '+10% UNCOMMON chance',
    price: 50,
    rarityBoost: 0.10,
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
    rarityBoost: 0.20,
  },
}
```

**Use Pattern:**
- Fishing minigame: select bait before casting (consumes 1 of that bait)
- Increases rarity roll weight by `rarityBoost` %
- Optional: +1 depth tier unlock (deep_hook allows access to Abyssal/Storm zones)

---

## 4. Acquisition Sources

### Where Does Everything Come From?

| Resource | Source 1 | Source 2 | Source 3 | Source 4 |
|----------|----------|----------|----------|----------|
| **Fish** | Fishing (main) | Quest rewards? | Trades/Gift? | Battle drops? |
| **Gold** | Treasure dig (25–100) | Sell fish (10 + 5×level) | Battle rewards | — |
| **Bait** | Treasure dig (1–2 rolls) | Shop purchase (50–150g) | Quest rewards | — |
| **Items** | Treasure dig (1 roll) | Shop purchase (future) | Quest rewards | — |
| **Treasures** | Dig at island spots | (Metadata only) | — | — |

### 4.1 Fishing Rewards (Missing!)

**Current behavior:** Catch fish → add to party. That's it.

**Proposed behavior:**
- Some fish have a loot drop table (e.g., Ember Snapper drops "Fire Scales", Tidecaller drops "Water Drops")
- On catch, roll: 70% party add, 20% crafting material drop, 10% gold bonus
- Materials tracked in `items` record (or new `materials` record)
- Example: Catch Ember Snapper → 2 Fire Scales → can craft with 10 Fire Scales → unlock Fire Sword bait

**Implementation detail:** Add optional `lootTable` to FishSpecies:
```typescript
export interface FishSpecies {
  id: number;
  name: string;
  // ... existing fields ...
  lootTable?: Array<{ itemId: string; weight: number }>; // e.g., fire_scales, gold_bonus
}
```

---

## 5. Storage Limits

### Hard Caps (Non-negotiable)

| Resource | Limit | Reason |
|----------|-------|--------|
| Party | `maxPartySize` (default 3) | Game balance; storage upgrade via ships |
| Gold | No hard cap | Sinks: bait, items, future ship upgrades |
| Bait (per type) | 99 | UI scalability |
| Items (per type) | 99 | UI scalability |

### Soft Caps (Can be overridden)

- Display truncates >999 gold as "999+"
- If fishing overflow: "Party Full! Fish released back to sea."
- If bait overflow: "Bait storage full! Excess discarded."

---

## 6. UI Integration Plan

### 6.1 Inventory Screen (Main Menu / HUD Toggle)

**Current:** InventoryUI shows only fish party.

**Proposed:** Tab-based layout (like Island UI):

```
┌─────────────────────────────────────┐
│ YOUR RESOURCES                 123g ⬡│
├─────────────────────────────────────┤
│  [CREW]  [BAIT]  [ITEMS]  [CLOSE]   │
├─────────────────────────────────────┤
│                                     │
│  CREW TAB:                          │
│  ┌─────────────────────────────┐   │
│  │ Ember Snapper Lv.5         │   │
│  │ Fire - HP 40/45            │   │
│  │ [SET LEAD] [RENAME] [REL.] │   │
│  └─────────────────────────────┘   │
│                                     │
│  BAIT TAB:                          │
│  Worm Bait ×3       [USE]           │
│  Glitter Lure ×1    [USE]           │
│  Deep Hook ×0       [BUY] 150g      │
│                                     │
│  ITEMS TAB:                         │
│  Small Potion ×5    [USE]           │
│  Sea Biscuit ×2     [USE]           │
│  Revive ×0          [BUY] future    │
│                                     │
└─────────────────────────────────────┘
```

**Access points:**
- Main Menu: "INVENTORY" button
- HUD: Press "I" to toggle inventory overlay
- Island UI: Tabs already include SHOP, EXPLORE, HEAL (no inventory tab yet)

### 6.2 Bait Selection (Fishing Minigame)

**Current:** No bait selection UI.

**Proposed:** Before cast phase, show bait menu:

```
┌──────────────────────────────┐
│ SELECT BAIT (or SKIP)        │
├──────────────────────────────┤
│ ○ None                       │
│ ○ Worm Bait ×3   +10%        │
│ ○ Glitter Lure ×1 +15%       │
│ ○ Deep Hook ×0   LOCKED      │
│                              │
│ [CONFIRM] [CANCEL]           │
└──────────────────────────────┘
```

- Selected bait consumed immediately on cast
- UI shows live count (x3 → x2 after use)

### 6.3 Items in Battle

**Current:** BattleSystem doesn't support item use.

**Proposed:** Battle menu adds "ITEMS" option:

```
BATTLE MENU:
[FIGHT] [FISH] [ITEMS] [FLEE]

ITEMS MENU (if opened):
Small Potion ×5    [USE]
Revive ×0          [DISABLED]
Antidote ×1        [USE]
[BACK]
```

- Select item → select target fish → apply effect → consume item
- Unavailable items greyed out or show "x0"

---

## 7. Persistence (SaveManager)

### Current SaveData (Incomplete)

```typescript
interface SaveData {
  party: FishInstance[];
  playerX: number;
  playerZ: number;
  playerRotation: number;
  maxPartySize?: number;
  playtime?: number;
  items?: Record<string, number>;
  gold?: number;
  baitInventory?: Record<string, number>;
  discoveredTreasures?: string[];
  // MISSING: shipId
}
```

### Proposed SaveData (Complete)

```typescript
interface SaveData {
  // Position & player data
  playerX: number;
  playerZ: number;
  playerRotation: number;
  playtime?: number;

  // Ship & crew
  shipId: number;               // ADDED: which ship the player owns
  party: FishInstance[];
  maxPartySize?: number;
  hullHp?: number;              // Current hull durability

  // Inventory
  gold?: number;
  items?: Record<string, number>;
  baitInventory?: Record<string, number>;
  discoveredTreasures?: string[];

  // Future: other ships, achievements, etc.
}
```

### Save/Load Flow

```typescript
// In src/core/SaveManager.ts

export function saveGame(ship: ShipComponent, playerPos: { x: number; z: number; rot: number }): void {
  const data: SaveData = {
    // Ship
    shipId: ship.shipId,           // NEW
    hullHp: ship.hullHp,           // NEW

    // Player position
    playerX: playerPos.x,
    playerZ: playerPos.z,
    playerRotation: playerPos.rot,

    // Crew
    party: ship.party,
    maxPartySize: ship.maxPartySize,

    // Inventory
    gold: ship.gold,
    items: ship.items,
    baitInventory: ship.baitInventory,
    discoveredTreasures: ship.discoveredTreasures,
    playtime: getGameplayClock(), // track total playtime
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function loadGame(): SaveData | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;

  const data = JSON.parse(raw) as SaveData;

  // Validate and provide defaults
  return {
    shipId: data.shipId ?? 1,    // Default to starter ship
    gold: data.gold ?? 0,
    items: data.items ?? {},
    baitInventory: data.baitInventory ?? {},
    discoveredTreasures: data.discoveredTreasures ?? [],
    ...data,
  };
}
```

---

## 8. Resource Flow Diagram

```
SAILING STATE
    ↓
Encounter fishing zone → FISHING STATE
    ↓
Cast (with optional bait) → Wait for bite
    ↓
Reel minigame → Success!
    ↓
Catch fish:
  - Add to party (if room)
  - Or store in temporary "caught" list
  - Roll loot table? (fire_scales, etc.)
    ↓
Return to SAILING STATE
    ↓
Dock at island → ISLAND STATE
    ↓
Treasure dig:
  - Roll TREASURE_LOOT table
  - Add gold, bait, items to ship inventory
    ↓
Shop:
  - Buy bait (gold → bait)
  - Sell fish (party → gold)
    ↓
Battle:
  - Use items mid-fight (item → effect → consumed)
  - Items don't auto-use; player must select
    ↓
Save game:
  - Persist party, gold, bait, items, treasures, shipId
```

---

## 9. Pseudocode: Core Inventory Operations

### 9.1 InventoryManager Class (New)

```typescript
// src/components/InventoryManager.ts (NEW)

import type { ShipComponent } from './ShipComponent';
import { ITEMS } from '../data/item-db';
import { BAITS } from '../ui/DockingUI'; // or move to item-db

export class InventoryManager {
  constructor(private ship: ShipComponent) {}

  // ===== GOLD =====
  addGold(amount: number): void {
    this.ship.gold = (this.ship.gold ?? 0) + amount;
  }

  removeGold(amount: number): boolean {
    const current = this.ship.gold ?? 0;
    if (current < amount) return false;
    this.ship.gold = current - amount;
    return true;
  }

  getGold(): number {
    return this.ship.gold ?? 0;
  }

  // ===== ITEMS =====
  addItem(itemId: string, count: number = 1): boolean {
    if (!ITEMS[itemId]) return false; // Unknown item
    const current = this.ship.items[itemId] ?? 0;
    const newCount = Math.min(99, current + count); // Soft cap at 99
    if (newCount === current && current >= 99) return false; // Storage full
    this.ship.items[itemId] = newCount;
    return true;
  }

  removeItem(itemId: string, count: number = 1): boolean {
    const current = this.ship.items[itemId] ?? 0;
    if (current < count) return false;
    this.ship.items[itemId] = Math.max(0, current - count);
    return true;
  }

  getItem(itemId: string): number {
    return this.ship.items[itemId] ?? 0;
  }

  getAllItems(): Record<string, number> {
    return { ...this.ship.items };
  }

  // ===== BAIT =====
  addBait(baitId: string, count: number = 1): boolean {
    if (!BAITS[baitId]) return false;
    const current = this.ship.baitInventory?.[baitId] ?? 0;
    const newCount = Math.min(99, current + count);
    if (!this.ship.baitInventory) this.ship.baitInventory = {};
    if (newCount === current && current >= 99) return false;
    this.ship.baitInventory[baitId] = newCount;
    return true;
  }

  removeBait(baitId: string, count: number = 1): boolean {
    const current = this.ship.baitInventory?.[baitId] ?? 0;
    if (current < count) return false;
    if (!this.ship.baitInventory) this.ship.baitInventory = {};
    this.ship.baitInventory[baitId] = Math.max(0, current - count);
    return true;
  }

  getBait(baitId: string): number {
    return this.ship.baitInventory?.[baitId] ?? 0;
  }

  getAllBaits(): Record<string, number> {
    return this.ship.baitInventory ? { ...this.ship.baitInventory } : {};
  }

  // ===== FISH PARTY =====
  canAddFish(): boolean {
    return this.ship.party.length < this.ship.maxPartySize;
  }

  addFish(fish: FishInstance): boolean {
    if (!this.canAddFish()) return false;
    this.ship.party.push(fish);
    return true;
  }

  removeFish(index: number): FishInstance | null {
    if (index < 0 || index >= this.ship.party.length) return null;
    return this.ship.party.splice(index, 1)[0] ?? null;
  }

  getParty(): FishInstance[] {
    return [...this.ship.party];
  }

  // ===== TREASURES =====
  discoverTreasure(key: string): void {
    if (!this.ship.discoveredTreasures) this.ship.discoveredTreasures = [];
    if (!this.ship.discoveredTreasures.includes(key)) {
      this.ship.discoveredTreasures.push(key);
    }
  }

  isTreasureDiscovered(key: string): boolean {
    return this.ship.discoveredTreasures?.includes(key) ?? false;
  }

  // ===== UTILITY =====
  getInventorySummary(): {
    gold: number;
    itemCount: number;
    baitCount: number;
    partySize: number;
  } {
    const itemCount = Object.values(this.ship.items).reduce((s, c) => s + c, 0);
    const baitCount = Object.values(this.ship.baitInventory ?? {}).reduce((s, c) => s + c, 0);
    return {
      gold: this.getGold(),
      itemCount,
      baitCount,
      partySize: this.ship.party.length,
    };
  }
}
```

### 9.2 Item Usage in Battle (Pseudocode)

```typescript
// In src/states/BattleState.ts (pseudocode)

class BattleState {
  private inventory: InventoryManager;

  onItemButtonClicked(): void {
    const availableItems = this.inventory.getAllItems();
    if (Object.keys(availableItems).length === 0) {
      this.showMessage("No items available!");
      return;
    }
    this.showItemSelectionMenu(availableItems);
  }

  useItem(itemId: string, targetFishIndex: number): void {
    if (!this.inventory.removeItem(itemId)) {
      this.showMessage("Item not available!");
      return;
    }

    const targetFish = this.playerShip.party[targetFishIndex];
    if (!targetFish) return;

    const itemDef = ITEMS[itemId];
    if (!itemDef) return;

    // Apply effect
    if (itemDef.effect.heal) {
      const healAmount = Math.floor(targetFish.maxHp * itemDef.effect.heal);
      targetFish.currentHp = Math.min(targetFish.maxHp, targetFish.currentHp + healAmount);
      this.showMessage(`${itemDef.name} used! +${healAmount} HP`);
    } else if (itemDef.effect.cureStatus) {
      // targetFish.status = null; (if status system exists)
      this.showMessage(`${itemDef.name} used! Status cured!`);
    } else if (itemDef.effect.revive) {
      targetFish.currentHp = Math.floor(targetFish.maxHp * 0.25);
      this.showMessage(`${itemDef.name} used! ${targetFish.nickname ?? 'Fish'} revived!`);
    }

    // Update battle UI
    this.updatePartyDisplay();
  }
}
```

### 9.3 Bait Selection (Fishing Minigame, Pseudocode)

```typescript
// In src/states/FishingState.ts (pseudocode)

class FishingState {
  private selectedBait: string | null = null;

  showBaitSelectionUI(): void {
    const baits = this.inventory.getAllBaits();
    const baitOptions = [
      { id: null, name: 'None', desc: 'Standard catch rate' },
      ...Object.entries(baits).map(([id, count]) => ({
        id,
        name: BAITS[id].name,
        desc: `${count}x owned • +${BAITS[id].rarityBoost * 100}%`,
      })),
    ];
    this.ui.show('bait-menu', buildBaitMenuHtml(baitOptions));
    // Bind click handlers to select bait
  }

  confirmBait(baitId: string | null): void {
    if (baitId && !this.inventory.removeBait(baitId)) {
      this.showMessage("Not enough bait!");
      return;
    }
    this.selectedBait = baitId;
    this.state.rarityBoost = baitId ? (BAITS[baitId].rarityBoost ?? 0) : 0;
    this.ui.remove('bait-menu');
    this.startCast(); // Proceed with fishing
  }
}
```

---

## 10. Implementation Checklist

### Phase 1: Core (Agent #2 — Now)
- [ ] Update SaveData to include `shipId`
- [ ] Create InventoryManager class with all operations
- [ ] Wire SaveManager to persist/restore shipId + inventory

### Phase 2: Fishing (Agent #1 — Parallel)
- [ ] Add bait selection UI before cast
- [ ] Integrate bait consumption into FishingSystem
- [ ] Add loot roll on catch (optional materials)

### Phase 3: UI (Agent #3 / UI Work)
- [ ] Update InventoryUI to show tabs: CREW, BAIT, ITEMS, TREASURES
- [ ] Add gold display to HUD
- [ ] Wire item selection into BattleUI

### Phase 4: Battle Integration (Later)
- [ ] Add "ITEMS" button to battle menu
- [ ] Implement item consumption in BattleSystem
- [ ] Test item effects (heal, revive, cure)

### Phase 5: Refinement (Polish)
- [ ] Add SFX for inventory actions
- [ ] Tutorial: explain bait, items, gold
- [ ] Balance: adjust treasure loot tables, shop prices

---

## 11. Key Design Decisions

### Why not separate inventory from ShipComponent?
- **The ship IS the inventory container.** Thematically, your cargo holds are on the ship.
- NPC ships will also have inventory (they might drop loot or have shields).
- Avoids dual-source-of-truth bugs.

### Why soft caps instead of hard caps on items?
- Players won't feel locked out if they find 3 full Potions at once.
- UI can truncate display ("99+") without culling data.
- Future: Ship upgrades can increase capacity.

### Why consumable items in battle instead of equip?
- Simpler state machine; no equip/unequip UI.
- Risk/reward: use item now vs. save for later.
- Consistent with Pokémon mechanics (player expects item menus).

### Why no "ship parts" system?
- Hull HP is durable; don't add crafting complexity yet.
- Can be added later (scale_of_fire + 10 → Fire Shield ability).
- Keep v1 focused on fishing, treasure, crew.

---

## 12. Future Extensions

### 12.1 Crafting System (v2)
```
Combine items: 10 Fire Scales + 5 Water Drops → Fire/Water Ring (passive +atk)
Would need: recipes, crafting UI, material inventory subsystem
```

### 12.2 Ship Upgrades (v2)
```
Upgrade cargo: Default 3 party → Buy Cargo Bay II → 5 party
Would increase maxPartySize; cost in gold or quest reward
```

### 12.3 Rival/NPC Ships (v2)
```
Captain NPCs also have inventory; on defeat, loot drops
Pirates might drop rare bait; Merchants drop gold; Naval ships drop blueprints
```

### 12.4 Playtime Tracking (v2)
```
Already in SaveData skeleton; hook game clock to accumulate `playtime`
Display "Total playtime: 45h 30m" on game over / stats screen
```

---

## 13. Questions for Will

1. **Fishing rewards:** Should catching a rare fish grant bonus gold or materials? Or just the fish itself?
2. **Item prices:** Should Grog Potion cost 50g? 100g? Currently no shop has items (only baits).
3. **Capacity feedback:** What's the max useful inventory size? Is "99 items" too much? Too little?
4. **Bait depth tiers:** Should Deep Hook unlock new zones, or just increase rarity chance?
5. **Treasure hunting frequency:** Should islands have different loot tables? (e.g., Fire island → more potions)

---

## 14. Summary

**Current State:**
- Skeleton inventory in SaveData, ShipComponent, item-db
- Some systems (treasure, shop) partially working
- No unified access layer

**After This Design:**
- Clear separation: resources (gold, items, bait, fish, metadata)
- InventoryManager class for all operations
- Complete SaveData with shipId persistence
- UI roadmap for showing/using resources

**Next Steps:**
1. Agent #2 implements InventoryManager + SaveData fixes
2. Agent #1 wires bait selection into fishing
3. Agent #3 updates UI to display inventory tabs
4. Battle system integrates item consumption

---

**End of Design Document**
