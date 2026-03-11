# Inventory System — Executive Summary for Will

**Date:** March 10, 2026 | **Agent:** #2 (Inventory Designer) | **Status:** Design Complete

---

## What You Asked For

Design a unified inventory system for collecting resources (fish, gold, bait, items, treasures), with clear data structures and implementation pseudocode.

---

## What We Found

### Good News:
✅ **You already have 60% of this built:**
- SaveData skeleton (gold, items, bait, treasures)
- ShipComponent fields (gold, items, baitInventory, discoveredTreasures)
- Item database (5 consumables: potions, antidote, revive)
- Bait system fully working (shop, loot drops, rarity boost)
- Treasure hunting (loot rolls, persistent spots)
- Party system (fish crew, max size)

### The Gap:
❌ **Missing pieces:**
1. **SaveData doesn't persist shipId** → Players lose their ship on reload
2. **No unified inventory manager** → Inventory operations scattered across UI/state files
3. **Bait selection UI** → No way to choose which bait to use when fishing
4. **Items not usable in battle** → Can collect potions but can't apply them mid-fight
5. **Inventory UI is fish-only** → Gold/bait/items not displayed to player
6. **No loot drops** → Fishing only gives fish, no materials or bonus gold

---

## The Design (3 Documents)

### 1. **INVENTORY_SYSTEM_DESIGN.md** (Main Design Doc)
- Comprehensive architecture overview
- All 5 resource types explained
- Current state analysis with gaps identified
- Data structure definitions (clean, final)
- UI mockups (inventory tabs, bait selection, item use in battle)
- Persistence strategy (SaveManager updates)
- Complete implementation checklist

### 2. **INVENTORY_PSEUDOCODE.md** (Code Reference)
- Ready-to-use InventoryManager class (full TypeScript)
- SaveManager updates with new SaveData interface
- FishingState integration (bait selection)
- BattleState integration (item usage)
- DockingUI integration (loot drops)
- InventoryUI tab builders (crew, bait, items)
- All code is pseudocode-to-production ready

### 3. **This Summary** (You Are Here)

---

## Architecture at a Glance

### Resource Types:
1. **Fish** (Party) — caught during fishing, used in battle
2. **Gold** (Currency) — earned from treasures & selling fish, spent on bait/items
3. **Bait** (Consumable) — used before fishing to boost rarity, max 99 per type
4. **Items** (Consumable) — potions/antidote/revive, used in battle, max 99 per type
5. **Treasures** (Metadata) — persistent dig spots, prevents re-digging

### Core Class:
**InventoryManager** — Unified access for all inventory operations:
```
inventory.addGold(50)
inventory.removeItem('small_potion')
inventory.getBait('worm_bait')
inventory.canAddFish()
inventory.getInventorySummary()
```

### Storage:
All data lives in `ShipComponent` (player's ship = inventory container):
```typescript
ship.party: FishInstance[]              // A. Fish
ship.gold: number                       // B. Gold
ship.baitInventory: Record<string, number>  // C. Bait
ship.items: Record<string, number>      // D. Items
ship.discoveredTreasures: string[]      // E. Treasure metadata
```

Persists via `SaveData` in localStorage, includes new `shipId` field.

---

## What Agents #1 and #3 Need to Do

### Agent #1 (Fishing Debug):
- Add bait selection UI before cast
- Wire InventoryManager.removeBait() when cast confirms
- Optional: add loot drop table to FishSpecies (10% gold bonus, 20% material drop on catch)

### Agent #3 (Ship Unlock Flow):
- Use InventoryManager to display player's current shipId
- Update MainMenuUI to show ship selection tied to inventory
- Display gold in HUD (top-right: "⬡ 250g")

---

## Implementation Roadmap

### Phase 1 (Immediate — You):
- [ ] Create `src/components/InventoryManager.ts` (copy from pseudocode)
- [ ] Update `src/core/SaveManager.ts` to include `shipId` in SaveData
- [ ] Test persist/restore cycle

### Phase 2 (Agents #1 & #3 — Parallel):
**Agent #1:**
- [ ] Add bait selection menu to FishingState
- [ ] Wire InventoryManager.removeBait() on cast

**Agent #3:**
- [ ] Update InventoryUI to show BAIT and ITEMS tabs
- [ ] Add gold counter to HUD
- [ ] Wire ship-db.ts shipId to ShipComponent

### Phase 3 (Polish):
- [ ] Wire item usage into BattleState
- [ ] Add SFX for inventory actions
- [ ] Tune treasure loot tables and shop prices

---

## Key Design Decisions (Rationale)

| Decision | Why |
|----------|-----|
| Inventory lives in ShipComponent | Your ship IS your cargo hold. Thematically consistent. |
| InventoryManager class | Single source of truth. Prevents bugs from scattered add/remove logic. |
| Soft caps at 99 items | No UI truncation complexity. Future: ship upgrades → bigger hold. |
| SaveData includes shipId | Let players restore their exact ship on reload, not just position. |
| No crafting yet | Keep v1 focused on fishing + treasure hunting. Add recipes in v2. |
| Items consumed in battle, not auto-equipped | Simpler state machine. Pokémon-style risk/reward. |

---

## Questions for You

If you want to refine the design before agents start:

1. **Fishing rewards:** Should rare fish drop bonus gold? Materials? Or just the fish?
2. **Bait depth:** Should Deep Hook unlock Abyssal/Storm zones, or just boost rarity %?
3. **Item prices:** If players find free items in treasure, should shop items cost gold? (e.g., 50g per potion)
4. **Inventory UI timing:** Show inventory as overlay on-demand (press I), or persistent HUD panel?
5. **Loot drop frequency:** What % chance for bonus gold/materials on catch?

---

## Files to Implement

| File | Status | Notes |
|------|--------|-------|
| `src/components/InventoryManager.ts` | Design → TODO | Copy from pseudocode, full TS |
| `src/core/SaveManager.ts` | Update | Add shipId, hullHp to SaveData |
| `src/states/FishingState.ts` | Wire | Add bait selection + InventoryManager |
| `src/states/BattleState.ts` | Wire | Add item usage + InventoryManager |
| `src/ui/DockingUI.ts` | Wire | Use InventoryManager for loot drops |
| `src/ui/InventoryUI.ts` | Enhance | Add BAIT, ITEMS tabs (not just CREW) |
| `src/ui/HUD.ts` | Enhance | Display gold counter (top-right) |

---

## What's NOT in v1

These are future extensions (v2+):

- **Crafting:** "10 Fire Scales + 5 Water Drops → Fire Sword"
- **Ship upgrades:** Expand cargo hold, buy better hull HP
- **NPC drops:** Defeated captains drop rare bait or blueprints
- **Status effects:** Burn, paralysis (item-curable)
- **Multi-save slots:** Only v1 has 1 save file

---

## Testing Checklist

Once implemented:

- [ ] Create InventoryManager, add gold/item/bait, verify counts update
- [ ] Save game, reload, verify all inventory fields persisted
- [ ] Fish in zone, select bait, verify bait count decreases
- [ ] Dig treasure, verify gold/items/bait awarded and UI updates
- [ ] Open inventory, verify all tabs display correctly
- [ ] Battle: use item on fish, verify item consumed and effect applied
- [ ] Party full: catch fish, verify overflow message and fish released

---

## Bottom Line

**Current state:** Scattered inventory data across SaveData, ShipComponent, DockingUI.

**After design:** Unified InventoryManager + updated SaveData = clean, maintainable system.

**Implementation complexity:** Medium. Most is already built; just needs wiring.

**Time estimate:** 4–6 hours for all three agents (parallel work).

---

## Documents Provided

1. **INVENTORY_SYSTEM_DESIGN.md** — Full design (15 sections, diagrams, Q&A)
2. **INVENTORY_PSEUDOCODE.md** — Production-ready code (6 sections, ready to copy)
3. **This summary** — Quick reference for decision-makers

All files saved to:
```
/corsair-catch/
├── INVENTORY_SYSTEM_DESIGN.md
├── INVENTORY_PSEUDOCODE.md
└── INVENTORY_SYSTEM_SUMMARY.md
```

---

**Next step:** Confirm the design with Will, then agents proceed in parallel. Agent #2 (you?) can start the InventoryManager class while Agents #1 and #3 work on their pieces.

Good luck! ⛵⚓

