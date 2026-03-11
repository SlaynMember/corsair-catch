# Ship Unlock Implementation Guide — Quick Ref

This is the companion to `SHIP_UNLOCK_FLOW_DESIGN.md` — more detailed code sketches and wiring diagrams.

## File Creation: `src/data/ship-unlock-db.ts`

```typescript
/**
 * Ship unlock progression system
 * Players unlock ship tiers as they catch more fish
 */

export interface UnlockTier {
  minFishCaught: number;
  shipIds: number[];
  tierName: string;
  description?: string; // e.g., "Uncommon Merchant Vessels"
}

export const SHIP_UNLOCK_TIERS: UnlockTier[] = [
  {
    minFishCaught: 0,
    shipIds: [1],
    tierName: 'Starter Fleet',
    description: 'Every pirate\'s first vessel',
  },
  {
    minFishCaught: 5,
    shipIds: [2, 3, 4],
    tierName: 'Common Merchant Fleet',
    description: 'Steady traders and scouts',
  },
  {
    minFishCaught: 15,
    shipIds: [5, 6, 7, 8],
    tierName: 'Uncommon Vessels',
    description: 'Experienced sailors\' choice',
  },
  {
    minFishCaught: 30,
    shipIds: [9, 10, 11, 12],
    tierName: 'Rare Captains\' Prizes',
    description: 'The pride of the fleet',
  },
  {
    minFishCaught: 50,
    shipIds: [13, 14, 15, 16],
    tierName: 'Legendary Fleets',
    description: 'Ships of legend and renown',
  },
  {
    minFishCaught: 75,
    shipIds: [17, 18, 19, 20],
    tierName: 'Mythical Vessels',
    description: 'The greatest ships ever built',
  },
];

/**
 * Get all ship IDs that should be unlocked at the given fish count
 */
export function getUnlockedShipIds(fishCaught: number): number[] {
  const unlocked: number[] = [];
  for (const tier of SHIP_UNLOCK_TIERS) {
    if (fishCaught >= tier.minFishCaught) {
      unlocked.push(...tier.shipIds);
    }
  }
  return unlocked;
}

/**
 * Get the next unlock milestone the player hasn't reached
 * Returns null if all ships unlocked
 */
export function getNextUnlockMilestone(fishCaught: number): UnlockTier | null {
  for (const tier of SHIP_UNLOCK_TIERS) {
    if (fishCaught < tier.minFishCaught) {
      return tier;
    }
  }
  return null;
}

/**
 * Check if a specific ship is unlocked
 */
export function isShipUnlocked(shipId: number, fishCaught: number): boolean {
  const unlockedIds = getUnlockedShipIds(fishCaught);
  return unlockedIds.includes(shipId);
}

/**
 * Get the tier that just unlocked (if any)
 * Useful for showing notifications
 */
export function checkForNewUnlock(
  prevFishCaught: number,
  newFishCaught: number
): UnlockTier | null {
  for (const tier of SHIP_UNLOCK_TIERS) {
    if (prevFishCaught < tier.minFishCaught && newFishCaught >= tier.minFishCaught) {
      return tier;
    }
  }
  return null;
}
```

---

## File Modifications: `src/components/ShipComponent.ts`

```typescript
import type { Component } from '../core/ECS';
import type { FishInstance } from '../data/fish-db';
import { getShipById } from '../data/ship-db';

export interface ShipComponent extends Component {
  type: 'ship';
  shipId: number;
  name: string;
  hullHp: number;
  maxHullHp: number;
  party: FishInstance[];
  maxPartySize: number;
  isPlayer: boolean;
  items: Record<string, number>;
  gold?: number;
  baitInventory?: Record<string, number>;
  discoveredTreasures?: string[];
  fishCaught?: number;  // <-- NEW: Lifetime fish caught for ship unlocks
}

export function createShip(
  shipId: number,
  name: string,
  isPlayer: boolean,
  maxPartySize = 3
): ShipComponent {
  const shipBlueprint = getShipById(shipId);
  const maxHull = shipBlueprint?.baseStats.hull ?? 100;

  return {
    type: 'ship',
    shipId,
    name,
    hullHp: maxHull,
    maxHullHp: maxHull,
    party: [],
    maxPartySize,
    isPlayer,
    items: {},
    gold: 0,
    baitInventory: {},
    discoveredTreasures: [],
    fishCaught: 0,  // <-- NEW: Initialize at 0
  };
}
```

---

## File Modifications: `src/core/SaveManager.ts`

```typescript
import type { FishInstance } from '../data/fish-db';

const SAVE_KEY = 'corsair-catch-save';

export interface SaveData {
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
  fishCaught?: number;  // <-- NEW: Track total fish caught for ship unlocks
}

export function saveGame(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be full or unavailable
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  return !!localStorage.getItem(SAVE_KEY);
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
```

---

## File Modifications: `src/states/FishingState.ts`

### Import additions (top of file)

```typescript
import { checkForNewUnlock, getNextUnlockMilestone } from '../data/ship-unlock-db';
```

### In the `enter()` method (no change needed)

### New private method for handling unlock

```typescript
/**
 * Called when player successfully catches a fish
 * Increments fish count and checks for ship unlock milestone
 */
private onFishCaught(fish: FishInstance): void {
  // Ensure fishCaught is initialized
  if (this.playerShip.fishCaught === undefined) {
    this.playerShip.fishCaught = 0;
  }

  const prevCount = this.playerShip.fishCaught;
  this.playerShip.fishCaught++;

  // Check if we hit a new unlock tier
  const newTier = checkForNewUnlock(prevCount, this.playerShip.fishCaught);
  if (newTier) {
    this.showUnlockNotification(newTier);
  }
}

private showUnlockNotification(tier: UnlockTier): void {
  // Show a toast or extend the catch popup
  // This gets called from showCatchPopup() logic
  // See FishingUI.ts modification below
  console.log(`Ships unlocked: ${tier.tierName}`);
  audio.playSFX('unlock'); // New SFX if available
}
```

### Integrate into existing catch flow

Look for where the fish is added to the party. Usually in a callback like `onCatchSuccess()`:

```typescript
private onCatchSuccess(caughtFish: FishInstance): void {
  // ... existing catch logic ...
  this.playerShip.party.push(caughtFish);

  // NEW: Track for ship unlocks
  this.onFishCaught(caughtFish);

  // ... show catch popup, award XP, etc. ...
  showCatchPopup(this.ui, caughtFish, this.playerShip.fishCaught);
}
```

---

## File Modifications: `src/ui/FishingUI.ts`

### Signature change

```typescript
export function showCatchPopup(
  ui: UIManager,
  fish: FishInstance,
  fishCaught?: number  // <-- NEW optional parameter
): void {
  // ... existing popup building ...

  // NEW: Check if we unlocked a tier
  const tierUnlocked = fishCaught !== undefined
    ? checkForNewUnlock(Math.max(0, fishCaught - 1), fishCaught)
    : null;

  const popupHtml = buildCatchPopupHtml(fish) +
    (tierUnlocked ? buildUnlockNotificationHtml(tierUnlocked) : '');

  ui.show('catch-popup', popupHtml);
  // ... rest of event listeners ...
}

function buildUnlockNotificationHtml(tier: UnlockTier): string {
  const newShipCount = tier.shipIds.length;
  return `
    <div style="
      background: rgba(253, 87, 75, 0.15);
      border-top: 2px solid #9D6113;
      padding: 12px;
      margin-top: 12px;
      text-align: center;
      font-family: var(--pixel-font);
    ">
      <div style="color: #FFD700; font-weight: bold; margin-bottom: 6px;">
        🎉 NEW SHIPS UNLOCKED! 🎉
      </div>
      <div style="color: var(--gold); font-size: 10px; margin-bottom: 4px;">
        ${tier.tierName}
      </div>
      <div style="color: var(--text-dim); font-size: 8px;">
        ${newShipCount} new vessel${newShipCount > 1 ? 's' : ''} added to your fleet
      </div>
      <div style="color: var(--text-dim); font-size: 7px; margin-top: 6px; font-style: italic;">
        Visit a dock to change ships
      </div>
    </div>
  `;
}
```

---

## File Modifications: `src/ui/ShipSelectionUI.ts`

### Import addition

```typescript
import { getUnlockedShipIds, getNextUnlockMilestone } from '../data/ship-unlock-db';
```

### Function signature change

```typescript
export function showShipSelection(
  ui: UIManager,
  currentShip: ShipComponent,
  onSelectShip: (shipId: number) => void,
  onClose: () => void,
  fishCaught: number = 0  // <-- NEW parameter (default 0)
): void {
```

### Filter ships by unlock status

```typescript
  const unlockedIds = getUnlockedShipIds(fishCaught);

  // ONLY render unlocked ships
  const shipCardsHtml = SHIPS
    .filter(ship => unlockedIds.includes(ship.id))
    .map((ship) => {
      // ... existing card HTML (unchanged) ...
    })
    .join('');
```

### Add milestone progress card after ship list

```typescript
  const nextMilestone = getNextUnlockMilestone(fishCaught);
  const milestoneCardHtml = nextMilestone
    ? `
      <div style="
        background: #1A1410;
        border: 2px solid #9D6113;
        border-radius: 2px;
        padding: 12px;
        margin-bottom: 12px;
        box-shadow: inset 1px 1px 0 rgba(210, 166, 120, 0.1), 0 4px 0 rgba(0, 0, 0, 0.4);
      ">
        <div style="
          font-family: var(--pixel-font);
          font-size: 9px;
          color: var(--gold);
          margin-bottom: 8px;
          letter-spacing: 1px;
        ">
          ⚓ NEXT MILESTONE
        </div>
        <div style="
          font-family: var(--pixel-font);
          font-size: 8px;
          color: var(--text);
          margin-bottom: 6px;
        ">
          ${nextMilestone.tierName}
        </div>
        <div style="
          font-family: var(--pixel-font);
          font-size: 7px;
          color: var(--text-dim);
          margin-bottom: 6px;
        ">
          Catch ${nextMilestone.minFishCaught - fishCaught} more fish to unlock ${nextMilestone.shipIds.length} new ships
        </div>
        <div style="background: #0a0a18; height: 4px; border: 1px solid #3a3a4a; margin: 6px 0; overflow: hidden;">
          <div style="
            height: 100%;
            background: #9D6113;
            width: ${(fishCaught / nextMilestone.minFishCaught) * 100}%;
            transition: width 0.3s ease;
          "></div>
        </div>
        <div style="
          font-family: var(--pixel-font);
          font-size: 7px;
          color: var(--text-dim);
          text-align: right;
        ">
          ${fishCaught} / ${nextMilestone.minFishCaught} fish
        </div>
      </div>
    `
    : `
      <div style="
        background: #1A1410;
        border: 2px solid #FFD700;
        border-radius: 2px;
        padding: 12px;
        margin-bottom: 12px;
        text-align: center;
        font-family: var(--pixel-font);
      ">
        <div style="color: #FFD700; font-weight: bold; font-size: 10px;">
          ⚓ ALL SHIPS UNLOCKED ⚓
        </div>
        <div style="color: var(--text-dim); font-size: 8px; margin-top: 4px;">
          You are a legendary fleet admiral!
        </div>
      </div>
    `;

  // Then in the panel assembly, insert milestoneCardHtml after ship list:
  const panelContent = `
    <!-- header ... -->
    <div style="padding:16px; max-height:calc(90vh - 120px); overflow-y:auto;">
      <!-- current ship info ... -->
      ${milestoneCardHtml}  <!-- <-- ADD HERE -->
      <!-- all ships ... -->
      ${shipCardsHtml}
    </div>
    <!-- footer ... -->
  `;
```

### In the UI, pass fishCaught when calling this function

In `IslandState.ts` and anywhere else `showShipSelection()` is called:

```typescript
// OLD
// showShipSelection(ui, this.shipData, onSelectShip, onClose);

// NEW
showShipSelection(
  ui,
  this.shipData,
  onSelectShip,
  onClose,
  this.shipData.fishCaught ?? 0  // Pass fish count
);
```

---

## File Modifications: `src/ui/DockingUI.ts`

### Add Fleet tab to island UI

In `showIslandUI()`, after the tabs row:

```typescript
const isShop = island.id === 'merchants_port';

ui.show('island-ui', `
  <div class="island-overlay">
    <div class="island-panel">
      <div class="island-header">
        <!-- ... existing header ... -->
      </div>
      <div class="island-tabs">
        <button class="island-tab island-tab-active" id="tab-explore">EXPLORE</button>
        ${isShop ? '<button class="island-tab" id="tab-shop">SHOP</button>' : ''}
        <button class="island-tab" id="tab-fleet">FLEET</button>  <!-- <-- NEW TAB -->
        <button class="island-tab" id="tab-heal">HEAL</button>
        <button class="island-tab island-tab-sail" id="tab-sail">SAIL OUT</button>
      </div>
      <!-- ... rest of HTML ... -->
    </div>
  </div>
`);

// Then in the tab binding section (after setTimeout):
const tabFleet = document.getElementById('tab-fleet');
const content = document.getElementById('island-content');

if (tabFleet && content) {
  tabFleet.addEventListener('click', () => {
    // Build fleet panel
    const fleetHtml = buildFleetPanel(
      ship,
      ship.fishCaught ?? 0,
      (shipId) => {
        ship.shipId = shipId;
        // Refresh UI to show new current ship
        hideIslandUI(ui);
        showIslandUI(ui, island, ship, discoveredTreasures, onHeal, onClose);
      }
    );

    // Highlight tab and show content
    tabExplore?.classList.remove('island-tab-active');
    tabFleet?.classList.add('island-tab-active');
    content.innerHTML = fleetHtml;
  });
}
```

### New helper function

```typescript
function buildFleetPanel(
  ship: ShipComponent,
  fishCaught: number,
  onSelectShip: (shipId: number) => void
): string {
  const unlockedIds = getUnlockedShipIds(fishCaught);
  const nextMilestone = getNextUnlockMilestone(fishCaught);

  const shipGridHtml = SHIPS.map((blueprint) => {
    const isUnlocked = unlockedIds.includes(blueprint.id);
    const isCurrent = blueprint.id === ship.shipId;
    const classColor = CLASS_COLORS[blueprint.class] || 'var(--text)';

    if (isUnlocked) {
      return `
        <div style="
          background: #1A1410;
          border: 2px solid #8B6B4D;
          padding: 8px;
          margin-bottom: 8px;
          ${isCurrent ? 'border-color: #FFD700; background: rgba(253, 87, 75, 0.1);' : ''}
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 9px; font-weight: bold; color: var(--text);">
                ${blueprint.name}
              </div>
              <div style="font-size: 7px; color: var(--text-dim);">
                ${blueprint.rarity.toUpperCase()} • <span style="color: ${classColor};">${blueprint.class}</span>
              </div>
            </div>
            <button
              onclick="onSelectShip(${blueprint.id})"
              style="
                background: var(--button-bg);
                border: 1px solid #8B6B4D;
                color: var(--text);
                padding: 4px 8px;
                font-size: 7px;
                cursor: pointer;
                ${isCurrent ? 'opacity: 0.5; cursor: default;' : ''}
              "
              ${isCurrent ? 'disabled' : ''}
            >
              ${isCurrent ? 'CURRENT' : 'SELECT'}
            </button>
          </div>
        </div>
      `;
    } else {
      // Locked ship
      const fishNeeded = nextMilestone?.minFishCaught ?? 0;
      return `
        <div style="
          background: #1A1410;
          border: 2px solid #3a3a4a;
          padding: 8px;
          margin-bottom: 8px;
          opacity: 0.4;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 9px; font-weight: bold; color: var(--text-dim);">
                ${blueprint.name}
              </div>
              <div style="font-size: 7px; color: var(--text-dim);">
                LOCKED
              </div>
            </div>
            <div style="font-size: 7px; color: var(--text-dim); text-align: right;">
              Catch ${fishNeeded - fishCaught} more
            </div>
          </div>
        </div>
      `;
    }
  }).join('');

  return `
    <div style="padding: 12px;">
      <div style="
        font-family: var(--pixel-font);
        font-size: 10px;
        color: var(--gold);
        margin-bottom: 12px;
        letter-spacing: 1px;
      ">
        ⚓ YOUR FLEET
      </div>
      ${shipGridHtml}
    </div>
  `;
}
```

---

## File Modifications: `src/states/SailingState.ts`

### In `saveGame()` calls (e.g., periodic auto-save)

```typescript
private saveGameState(): void {
  const saveData: SaveData = {
    party: this.playerShip.party,
    playerX: this.playerEntity.position.x,
    playerZ: this.playerEntity.position.z,
    playerRotation: this.playerEntity.rotation,
    maxPartySize: this.playerShip.maxPartySize,
    playtime: this.playtime,
    items: this.playerShip.items,
    gold: this.playerShip.gold,
    baitInventory: this.playerShip.baitInventory,
    discoveredTreasures: this.playerShip.discoveredTreasures,
    fishCaught: this.playerShip.fishCaught,  // <-- NEW: Persist fish count
  };
  saveGame(saveData);
}
```

### On load (in constructor or `enter()`)

```typescript
// If loading a save:
const loadedData = loadGame();
if (loadedData && this.playerShip) {
  // ... restore existing fields ...
  this.playerShip.fishCaught = loadedData.fishCaught ?? 0;  // <-- NEW
}
```

---

## Imports Summary

### `ship-unlock-db.ts` (new file — no imports needed beyond stdlib)

### `ShipComponent.ts`

```typescript
// No new imports
```

### `SaveManager.ts`

```typescript
// No new imports
```

### `FishingState.ts`

```typescript
import { checkForNewUnlock, getNextUnlockMilestone, UnlockTier } from '../data/ship-unlock-db';
```

### `FishingUI.ts`

```typescript
import { checkForNewUnlock, UnlockTier } from '../data/ship-unlock-db';
```

### `ShipSelectionUI.ts`

```typescript
import { getUnlockedShipIds, getNextUnlockMilestone } from '../data/ship-unlock-db';
```

### `DockingUI.ts`

```typescript
import { getUnlockedShipIds, getNextUnlockMilestone, UnlockTier } from '../data/ship-unlock-db';
```

### `SailingState.ts`

```typescript
// No new imports (already imports SaveData and saveGame)
```

---

## Validation & Edge Cases

### Edge Case 1: Load save with fishCaught = 0

```typescript
if (loadedData.fishCaught === undefined) {
  this.playerShip.fishCaught = 0;
}
```

**Status:** Handled in SaveManager (default to 0)

### Edge Case 2: Player has 10 fish caught, catches 11th

```typescript
prevCount = 10
newCount = 11
checkForNewUnlock(10, 11) // Returns null (no tier at 11)
// Only shows notification if threshold crossed
```

**Status:** Handled in `checkForNewUnlock()`

### Edge Case 3: Player manually sets shipId to locked ship

```typescript
// In DockingUI or ShipSelectionUI, validate before accept:
const isUnlocked = getUnlockedShipIds(ship.fishCaught).includes(shipId);
if (!isUnlocked) {
  ui.warn('That ship is locked. Catch more fish!');
  return;
}
ship.shipId = shipId;
```

**Status:** Add validation to button onclick handlers

### Edge Case 4: All ships unlocked, milestone = null

```typescript
const nextMilestone = getNextUnlockMilestone(fishCaught);
if (!nextMilestone) {
  // Show "ALL UNLOCKED" message
}
```

**Status:** Handled in `ShipSelectionUI.ts` with conditional HTML

---

## Testing Helpers (Optional)

For QA/playtesting, add debug commands:

```typescript
// In Game.ts or main.ts (only in dev build):
if (process.env.NODE_ENV === 'development') {
  (window as any).__CORSAIR_DEBUG = {
    addFish: (count: number) => {
      // Find player ship, increment fishCaught
      const player = game.playerShip;
      if (player) {
        player.fishCaught = (player.fishCaught ?? 0) + count;
        console.log(`Added ${count} fish. Total: ${player.fishCaught}`);
      }
    },
    setFish: (count: number) => {
      const player = game.playerShip;
      if (player) {
        player.fishCaught = count;
        console.log(`Set fish to ${count}`);
      }
    },
    getUnlocked: () => {
      const player = game.playerShip;
      if (player) {
        const ids = getUnlockedShipIds(player.fishCaught ?? 0);
        console.log(`Unlocked ships (${ids.length}):`, ids);
      }
    },
  };
}

// Usage in browser console:
// __CORSAIR_DEBUG.addFish(50);
// __CORSAIR_DEBUG.getUnlocked();
```

---

## Summary Checklist

- [ ] Create `src/data/ship-unlock-db.ts` with all utility functions
- [ ] Add `fishCaught?: number;` to `ShipComponent`
- [ ] Add `fishCaught?: number;` to `SaveData` interface
- [ ] Modify `FishingState.ts` to increment `fishCaught` on catch and detect unlocks
- [ ] Modify `FishingUI.ts` to show unlock notification in catch popup
- [ ] Modify `ShipSelectionUI.ts` to filter by `getUnlockedShipIds()` and show milestone progress
- [ ] Modify `DockingUI.ts` to add FLEET tab with `buildFleetPanel()`
- [ ] Modify `SailingState.ts` to persist/load `fishCaught` in saves
- [ ] Update all callers of `showShipSelection()` to pass `fishCaught` parameter
- [ ] Validate ship selections against unlock status
- [ ] Test unlock flow end-to-end (0→5→15→30→50→75)

