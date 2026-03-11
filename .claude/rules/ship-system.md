# Ship System Setup — Agent #3

## What's Been Done

### 1. **Ship Database (src/data/ship-db.ts)**
- ✅ 20 unique ships mapped to ships.png sprite grid (4 rows × 5 cols)
- ✅ 6 ship classes: Merchant, Pirate, Naval, Treasure Hunter, Ghost, Storm
- ✅ 4 rarity tiers: Common → Uncommon → Rare → Legendary
- ✅ 5-stat system: hull, speed, cargo, maneuver, cannon
- ✅ 2 abilities per ship (sail, combat, utility)
- ✅ Evolution chains: Tier 1 ships upgrade to Tier 2 variants
- ✅ Utility functions: getShipById, getUpgradeShip, getShipsByClass, getShipsByRarity

### 2. **ShipComponent Updates (src/components/ShipComponent.ts)**
- ✅ Added `shipId` field (references ship-db.ts ID)
- ✅ Updated `createShip()` signature: `(shipId, name, isPlayer, maxPartySize)`
- ✅ Hull HP automatically set from ship blueprint stats

### 3. **World Integration (src/world/WorldManager2D.ts)**
- ✅ Player starts with shipId 1 (Driftwood Dory, Common Merchant)
- ✅ Enemy captains mapped to legendary ships:
  - Captain Barnacle → ID 8 (Reaper's Mark, Rare Pirate)
  - Admiral Ironhook → ID 16 (Serpent Slayer, Rare Naval)
  - The Dread Corsair → ID 18 (Dread Lord's Vessel, Legendary Pirate)

### 4. **Ship Selection UI (src/ui/ShipSelectionUI.ts)**
- ✅ Diegetic design: wooden frames (#8B6B4D), parchment backgrounds (#1A1410)
- ✅ Ship grid with stat cards (hull, speed, cargo, maneuver)
- ✅ Rarity color coding (matches fish UI)
- ✅ Class color coding (per-class visual identity)
- ✅ Ability display with descriptions
- ✅ Current ship highlight panel
- ✅ Select/upgrade buttons
- ✅ buildShipStatsPanel() for HUD display

## Waiting on Agent #2

Agent #2 is building the Asset Loader pipeline. Once that's complete:

1. **Sprite Loading**: getShipTexture() will load from ships.png sprite sheet
   - Currently uses canvas-drawn fallbacks
   - Will load actual pixel art from public/sprite_unedited/ships.png
   - Sprite index mapped via ship.spriteIndex (0-19)

2. **Animation System**: If ships have sail animations
   - Handled by Asset Loader + Animation System Integration (Task 9)

3. **Particle Effects**: Wake trails, anchor drops, etc.
   - Handled by beach asset pipeline

## What Still Needs Wiring

### In-Game Integration:
- [ ] Add ship selection to MainMenuUI (NEW GAME → pick starting ship)
- [ ] Add ship shop to DockingUI (upgrade at harbors)
- [ ] Wire showShipSelection() into game state flow
- [ ] Handle ship purchase transactions (gold cost)
- [ ] Update HUD to display current ship stats via buildShipStatsPanel()

### Battle System (Optional):
- [ ] Add ship abilities to combat (cannon stat could matter)
- [ ] Ship type matchups (Merchant vs Pirate, Naval vs Pirate, etc.)

### Save/Load:
- [ ] Persist `shipId` in SaveData
- [ ] Load ship data on game restore

## File Locations

| File | Purpose |
|------|---------|
| `src/data/ship-db.ts` | Ship blueprints (20 ships, stats, abilities) |
| `src/components/ShipComponent.ts` | ShipComponent with shipId field |
| `src/ui/ShipSelectionUI.ts` | Ship selection/upgrade UI with diegetic design |
| `src/world/WorldManager2D.ts` | World spawning (updated to use shipId) |

## Ship IDs Reference

### Tier 1 (IDs 1-10)
- 1-4: Merchant ships (upgrade to 11-12)
- 5-8: Pirate ships (upgrade to 14-15)
- 9-10: Treasure Hunter/Storm (upgrade to 19-20)

### Tier 2 (IDs 11-20)
- 11-12: Merchant upgrades
- 13-17: Pirate/Naval/Treasure Hunter tier 2
- 18-20: Legendary ships (Dread Lord, Phantom Helm, Kraken Sovereign)

## UI Design System

**Colors:**
- Rarity: Common (dim), Uncommon (green), Rare (gold), Legendary (bright gold)
- Classes: Merchant (blue), Pirate (red), Naval (steel), Hunter (gold), Ghost (purple), Storm (gray)

**Diegetic Elements:**
- Wooden frames: `border:#8B6B4D`
- Parchment bg: `#1A1410`
- Shadow depth: `box-shadow: inset 2px 2px 0 rgba(210,166,120,0.15), 0 8px 0 rgba(0,0,0,0.8)`
- Serif headers: "▸ Ability Name" with class color

## Next Steps (Agent #3)

1. Wire ShipSelectionUI into MainMenuUI (new game ship picker)
2. Create ShipShopUI for docking/harbor screens
3. Update SaveData to persist shipId
4. Add ship stats to HUD display
5. (Wait for Agent #2) Integrate actual sprite loading
