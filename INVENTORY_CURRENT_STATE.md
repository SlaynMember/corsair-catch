# Current Inventory State — File-by-File Analysis

**Date:** March 10, 2026 | **Purpose:** Gap analysis before implementation

---

## 1. SaveManager (`src/core/SaveManager.ts`)

### Current:
```typescript
interface SaveData {
  party: FishInstance[];
  playerX: number;
  playerZ: number;
  playerRotation: number;
  maxPartySize?: number;
  playtime?: number;
  items?: Record<string, number>;        // ✓ Have it
  gold?: number;                         // ✓ Have it
  baitInventory?: Record<string, number>; // ✓ Have it
  discoveredTreasures?: string[];        // ✓ Have it
}
```

### Missing:
```typescript
  shipId: number;  // ✗ MISSING — can't restore player's ship on load
  hullHp?: number; // ✗ MISSING — can't restore ship durability
```

### Action:
- Add `shipId: number` (required)
- Add `hullHp?: number` (optional, nice-to-have)
- Provide defaults in loadGame() for backward compat

**File location:** `/corsair-catch/src/core/SaveManager.ts`

---

## 2. ShipComponent (`src/components/ShipComponent.ts`)

### Current:
```typescript
export interface ShipComponent extends Component {
  type: 'ship';
  shipId: number;                        // ✓ Have it (added by Agent #3)
  name: string;
  hullHp: number;
  maxHullHp: number;
  party: FishInstance[];                 // ✓ Have it
  maxPartySize: number;
  isPlayer: boolean;
  items: Record<string, number>;         // ✓ Have it
  gold?: number;                         // ✓ Have it
  baitInventory?: Record<string, number>; // ✓ Have it
  discoveredTreasures?: string[];        // ✓ Have it
}
```

### Status:
✅ **All fields present and initialized in createShip().**

### Action:
- No changes needed
- Just use as-is with InventoryManager

**File location:** `/corsair-catch/src/components/ShipComponent.ts`

---

## 3. Item Database (`src/data/item-db.ts`)

### Current (5 items):
```typescript
ITEMS: {
  sea_biscuit:   { id, name, desc, effect: { heal: 0.15 }, icon: '🍪' }
  small_potion:  { id, name, desc, effect: { heal: 0.30 }, icon: '⚗️' }
  big_potion:    { id, name, desc, effect: { heal: 0.60 }, icon: '🍶' }
  antidote:      { id, name, desc, effect: { cureStatus: true }, icon: '💊' }
  revive:        { id, name, desc, effect: { revive: true }, icon: '✨' }
}

startingInventory(): Record<string, number> // Returns { small_potion: 3 }
```

### Status:
✅ **Complete. Ready to use.**

### Missing in codebase:
- No code consumes these items in battle (BattleState doesn't have item-use logic)
- No code shows items in inventory UI (InventoryUI only shows fish party)

### Action:
- Use as-is
- Implement item consumption in BattleState (Agent #2/Will)
- Display items in InventoryUI tabs (Agent #3)

**File location:** `/corsair-catch/src/data/item-db.ts`

---

## 4. Bait System (`src/ui/DockingUI.ts`)

### Current:
```typescript
BAITS: {
  worm_bait:    { name, desc: '+10% UNCOMMON', price: 50,  rarityBoost: 0.10 }
  glitter_lure: { name, desc: '+15% RARE',     price: 100, rarityBoost: 0.15 }
  deep_hook:    { name, desc: '+20% RARE',     price: 150, rarityBoost: 0.20 }
}

// Treasure loot table includes bait rolls
// Shop tab allows buying bait (uses gold)
// Players can own bait (counted in baitInventory)
```

### Status:
✅ **Bait purchase & storage fully working.**
✅ **Treasure loot gives bait.**
❌ **No bait selection UI before fishing.**
❌ **FishingState doesn't know about bait when casting.**

### Action:
- Add bait selection UI in FishingState (before cast phase)
- Wire FishingSystem to apply rarityBoost when bait selected
- Consume bait on cast confirm

**File locations:**
- `/corsair-catch/src/ui/DockingUI.ts` (BAITS definition)
- `/corsair-catch/src/states/FishingState.ts` (needs bait UI)
- `/corsair-catch/src/systems/FishingSystem.ts` (needs rarityBoost field)

---

## 5. Fishing Rewards (`src/states/FishingState.ts`)

### Current (line 164-199):
```typescript
case 'caught':
  if (this.input.wasPressed('Space')) {
    if (this.state.caughtFish && this.playerShip.party.length < this.playerShip.maxPartySize) {
      this.playerShip.party.push(this.state.caughtFish);  // Add fish to party
      audio.playSFX('catch');
    } else {
      audio.playSFX('splash');  // Party full → fish released
    }
  }
```

### Status:
✅ **Fish caught and added to party.**
❌ **No gold awarded.**
❌ **No loot drops (materials, consumables).**
❌ **No bait selection before casting.**

### Missing:
```typescript
// What SHOULD happen on catch:
const loot = rollLootTable(this.state.caughtFish);  // 70% party, 20% materials, 10% gold
if (loot.type === 'party') {
  // add to party
} else if (loot.type === 'gold') {
  this.playerShip.gold += loot.amount;  // Bonus gold
} else if (loot.type === 'material') {
  this.playerShip.items[loot.id] = (this.playerShip.items[loot.id] ?? 0) + loot.amount;
}

// And bait selection BEFORE cast:
this.showBaitSelectionUI();  // Choose which bait to use
```

### Action:
- Add bait selection UI (calls showBaitSelectionMenu())
- Consume bait on cast confirmation
- Optional: Add loot roll on catch (can be Phase 2)

**File location:** `/corsair-catch/src/states/FishingState.ts`

---

## 6. Treasure Hunting (`src/ui/DockingUI.ts`)

### Current (bindTreasureTiles function):
```typescript
// Rolls loot from TREASURE_LOOT table
const loot = rollLoot();  // Returns { type, amount/id, label, weight }

if (loot.type === 'gold') {
  ship.gold = (ship.gold ?? 0) + (loot.amount ?? 0);  // ✓ Works
} else if (loot.type === 'bait' && loot.id) {
  if (!ship.baitInventory) ship.baitInventory = {};
  ship.baitInventory[loot.id] = (ship.baitInventory[loot.id] ?? 0) + 1;  // ✓ Works
} else if (loot.type === 'item' && loot.id) {
  ship.items[loot.id] = (ship.items[loot.id] ?? 0) + 1;  // ✓ Works
}
```

### Status:
✅ **Loot rolls.**
✅ **Gold awarded.**
✅ **Bait awarded.**
✅ **Items awarded.**
✅ **Treasures marked as discovered (prevents re-dig).**

### Missing:
- No InventoryManager abstraction (direct ship.gold, ship.items manipulation)
- Could add overflow warnings if hitting 99-count cap

### Action:
- Refactor to use InventoryManager (cleaner code, better bounds-checking)
- Add messages if item/bait storage full

**File location:** `/corsair-catch/src/ui/DockingUI.ts` (bindTreasureTiles function)

---

## 7. Battle System (`src/states/BattleState.ts`)

### Current:
```typescript
// Battle menu has options: FIGHT, FISH, FLEE
// No ITEMS option
// No item consumption logic
```

### Status:
❌ **Items collected but never used.**
❌ **No item menu in battle.**
❌ **No item effect application (heal, revive, cure).**

### Missing:
```typescript
// Should have:
const battleMenu = ['FIGHT', 'FISH', 'ITEMS', 'FLEE'];  // Add ITEMS
onItemSelected(itemId: string) {
  const itemDef = ITEMS[itemId];
  const fish = selectTargetFish();
  if (itemDef.effect.heal) {
    fish.currentHp += itemDef.effect.heal * fish.maxHp;
  }
  inventory.removeItem(itemId);
  updatePartyDisplay();
}
```

### Action:
- Add ITEMS button to battle menu (only if inventory.getAllItems() > 0)
- Show item selection UI (lists available items with counts)
- Show target selection (pick which fish to heal/revive)
- Apply item effect and consume item

**File location:** `/corsair-catch/src/states/BattleState.ts`

---

## 8. Inventory UI (`src/ui/InventoryUI.ts`)

### Current (showInventory function):
```typescript
// Shows ONLY fish party:
// - Fish cards with HP, XP, moves
// - TYPE CHART tab
// - COLLECTION tab (caught species tracker)
// - RENAME, SET LEAD, RELEASE buttons

// NO display of:
// - Gold
// - Bait counts
// - Item counts
// - Material counts
```

### Status:
✅ **Fish crew display complete.**
❌ **Missing gold display.**
❌ **Missing bait tab.**
❌ **Missing items tab.**
❌ **Missing materials tab (future).**

### Action:
- Add "YOUR RESOURCES" header showing gold (e.g., "⬡ 250g")
- Add BAIT tab showing all bait types and counts
- Add ITEMS tab showing all items and counts
- Keep existing CREW tab, TYPE CHART, COLLECTION tabs

**File location:** `/corsair-catch/src/ui/InventoryUI.ts`

---

## 9. HUD (`src/ui/HUD.ts`)

### Current:
- Likely shows fish party, current fish HP, zone info
- No gold counter

### Status:
❌ **Missing gold display in HUD.**

### Action:
- Add gold counter to top-right (e.g., "⬡ 150g")
- Update every frame or on gold change event

**File location:** `/corsair-catch/src/ui/HUD.ts` (or wherever HUD rendered)

---

## Summary: What's Missing vs. Present

| Feature | Present? | Where | Notes |
|---------|----------|-------|-------|
| **Gold storage** | ✅ | ShipComponent.gold | Just need to display in UI |
| **Gold earn (treasure)** | ✅ | DockingUI.bindTreasureTiles | Works; refactor for InventoryManager |
| **Items storage** | ✅ | ShipComponent.items | Just need to display & use in battle |
| **Items earn (treasure)** | ✅ | DockingUI.bindTreasureTiles | Works; refactor for InventoryManager |
| **Items use (battle)** | ❌ | BattleState | NEED TO BUILD |
| **Bait storage** | ✅ | ShipComponent.baitInventory | Just need UI for selection |
| **Bait buy (shop)** | ✅ | DockingUI shop panel | Works |
| **Bait earn (treasure)** | ✅ | DockingUI.bindTreasureTiles | Works; refactor for InventoryManager |
| **Bait use (fishing)** | ❌ | FishingState | NEED UI + consumption logic |
| **Party storage** | ✅ | ShipComponent.party | Full system works |
| **Fish catch** | ✅ | FishingState | Works; just add bait UI |
| **Treasure persistence** | ✅ | ShipComponent.discoveredTreasures | Works |
| **Save/load gold** | ⚠️ | SaveManager | Field exists but shipId missing |
| **Save/load shipId** | ❌ | SaveManager | NEED TO ADD |
| **InventoryManager** | ❌ | (doesn't exist) | NEED TO CREATE |
| **Gold in HUD** | ❌ | HUD | NEED TO DISPLAY |
| **Gold in inventory UI** | ❌ | InventoryUI | NEED TO DISPLAY |
| **Bait tab** | ❌ | InventoryUI | NEED TO BUILD |
| **Items tab** | ❌ | InventoryUI | NEED TO BUILD |

---

## Implementation Order (Recommended)

### Step 1: Core (No dependencies)
1. Create InventoryManager class (`src/components/InventoryManager.ts`)
2. Update SaveManager with shipId field

### Step 2: UI Display (Low risk, visible progress)
3. Update InventoryUI with bait & items tabs
4. Add gold display to HUD

### Step 3: Fishing (Agent #1)
5. Add bait selection UI to FishingState
6. Wire bait consumption

### Step 4: Battle (Agent #2/Will)
7. Add ITEMS menu to BattleState
8. Implement item usage logic

### Step 5: Refactoring (Polish)
9. Refactor DockingUI treasure loot to use InventoryManager
10. Add overflow messages for storage limits

### Step 6: Polish (Nice-to-have)
11. Add sounds for inventory actions
12. Add tutorial messages for new systems
13. Balance treasure loot tables and shop prices

---

## Critical Files Summary

| File | Action | Priority |
|------|--------|----------|
| `src/core/SaveManager.ts` | Add shipId | HIGH |
| `src/components/InventoryManager.ts` | Create | HIGH |
| `src/states/FishingState.ts` | Add bait UI | HIGH |
| `src/ui/InventoryUI.ts` | Add tabs | MEDIUM |
| `src/ui/HUD.ts` | Show gold | MEDIUM |
| `src/states/BattleState.ts` | Add item use | MEDIUM |
| `src/ui/DockingUI.ts` | Refactor to InventoryManager | LOW |

---

**Bottom line:** You have 70% of the system built. You're just missing the manager class, the UI displays, and the wiring. The pseudocode document has all the code ready to go.

