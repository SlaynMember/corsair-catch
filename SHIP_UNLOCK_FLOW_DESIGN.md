# Ship Unlock Flow Design — Agent 3 Deliverable

## Executive Summary

Ships are currently always available in the manifest (all 20 ships visible at once). This design proposes a **progression-based unlock system** where the player gradually unlocks new ships as they accomplish milestones. This creates:

- **Sense of progression** — each milestone feels like an achievement
- **Pacing** — prevents overwhelming the player with 20 choices at start
- **Motivation** — "X more fish to unlock the next ship" drives gameplay
- **Story beats** — unlock transitions can hint at deeper world (legendary captains, ghost ships, etc.)

---

## Unlock Strategy

### Anchor Condition: Fish Caught (Primary)

**Why fish caught?**
- Most accessible metric to players (automatic, rewarding)
- Aligns with core loop (sailing → fishing zones → casting → reeling)
- Scales naturally from early (easy zones) to late (difficult zones)
- All players are fishing constantly; no one misses this progression

**Alternative conditions considered (not adopted):**
- "Defeat X captains" — too gate-y, combat is optional/infrequent
- "Collect X ship parts" — adds new item type, unclear where parts drop
- "Dig X treasures" — treasure is inconsistent loot, not every docking yields treasure
- "Reach level X" — encourages grinding single fish, not fishing variety
- "Visit all islands" — frontloads exploration, doesn't reward core gameplay

### Unlock Tiers (Suggested)

| Milestone | Fish Caught | Ships Unlocked | Rationale |
|-----------|------------|---|---|
| **Game Start** | 0 | Driftwood Dory (shipId 1) | Starter ship, Common Merchant |
| **Tier 1** | 5 fish | +3 Common ships (2,3,4) | Introduce Merchant variants, choice within tier |
| **Tier 2** | 15 fish | +4 Uncommon ships (5,6,7,8) | First uncommon tier, better stats |
| **Tier 3** | 30 fish | +4 Rare ships (9,10,11,12) | Significant power jump, early specialization |
| **Tier 4** | 50 fish | +4 Legendary ships (13,14,15,16) | Top-tier vessels, special abilities |
| **Tier 5** | 75 fish | +4 Mythical ships (17,18,19,20) | End-game ships, legends of the seas |

**Total progression: 0 → 5 → 15 → 30 → 50 → 75 fish caught**

**Flexibility:**
- Thresholds can be tweaked after playtesting (10, 25, 40, 60, 90 if too grindy; 3, 8, 20, 35, 50 if too lenient)
- Unlock triggers on **per-session basis** — once 5 fish are caught, Tier 1 ships unlock *for that entire run*, persistent in save

---

## UX Flow (Where Ship Selection Appears)

### Option A: New Game Ship Picker (Recommended for First Play)

**Flow:**
```
MainMenuState
  ↓ (NEW GAME)
  ↓ [QUICK: Pick starting ship if unlocked]
  ↓ (Tier 0 only = Driftwood Dory, instant start)
  ↓
IslandState (Sunlit Cove docking menu)
```

**Rationale:** Tier 0 ship starts the game. No wait, no choice — player sails immediately. Keeps first 2 minutes tight.

**If wanted:** Could show a "Ship Manifest" tooltip on first docking, hinting that more ships unlock as you fish.

### Option B: Unlock Notification (Recommended Primary)

**Flow:**
```
FishingState (player catches 5th fish)
  ↓ [CATCH POPUP shows "Congratulations!"]
  ↓ [Adds line: "You've unlocked new ships!"]
  ↓ [Button: "View Fleet" or auto-dismiss]
  ↓ (If "View Fleet" → push ShipSelectionUI overlay, or note in log)
  ↓ (On dismiss → return to fishing)
```

**Rationale:** Moment of reward is immediate. Player knows right away a new tier is available.

### Option C: At Island Docking (Discovery-Based)

**Flow:**
```
IslandState (player docks, opens DockingUI)
  ↓ [Tab: SHIP MANIFEST → scrollable list of unlocked/locked ships]
  ↓ [Locked ships shown as silhouettes, label "CATCH 10 MORE FISH TO UNLOCK"]
  ↓ [Player can browse, see what's coming]
  ↓ [Can swap current ship if they've caught N fish]
```

**Rationale:** Integrated into docking UI, no state machine change. Players can check progression anytime they dock.

### **Recommended Implementation: B + C**

1. **B (Notification):** On unlock milestone → show catch popup with "NEW SHIPS UNLOCKED" toast
2. **C (Discovery):** Add a `FLEET` or `MANIFEST` tab to `DockingUI.ts` that shows:
   - Green checkmark: unlocked ships you own (can select)
   - Gold border: unlocked ships you don't own (can select if you swap)
   - Dark/grayed: locked ships with progress bar "5/15 fish caught to unlock"

---

## Ship Selection UI Modifications

### Current State (`ShipSelectionUI.ts`)
- Shows ALL 20 ships in a scrollable list
- Each ship has stats, abilities, rarity color
- "SELECT" button to change to that ship
- "CURRENT SHIP" highlight panel

### Proposed Modifications

#### 1. **Filter Ships by Unlock Status**

```typescript
// In showShipSelection()
const unlockedShips = SHIPS.filter(s => {
  const unlockedIds = getUnlockedShipIds(playerData.fishCaught);
  return unlockedIds.includes(s.id);
});

// Only render unlockedShips in shipCardsHtml
const shipCardsHtml = unlockedShips.map((ship) => { ... }).join('');
```

#### 2. **Add Unlock Progress Section**

At the bottom of the manifest, add a "Next Milestone" card:

```html
<div style="
  background:#1A1410;
  border:2px solid #9D6113;
  padding:12px;
  margin-top:16px;
  font-family:var(--pixel-font);
  font-size:8px;
">
  <div style="color:var(--gold); margin-bottom:8px;">NEXT MILESTONE</div>
  <div style="color:var(--text); margin-bottom:6px;">Catch 8 more fish to unlock Uncommon ships</div>
  <div style="background:#0a0a18; height:4px; border:1px solid #3a3a4a; margin:6px 0;">
    <div style="
      height:100%;
      background:#9D6113;
      width:${(fishCaught / nextMilestone) * 100}%;
    "></div>
  </div>
  <div style="color:var(--text-dim); margin-top:4px;">
    ${fishCaught} / ${nextMilestone} fish
  </div>
</div>
```

#### 3. **Lock Visual for Unavailable Ships**

If browsing locked ships (optional): gray out card, add "LOCKED" badge, show milestone to unlock.

---

## Data Structure: Track Unlock Progress

### SaveData Extension (SaveManager.ts)

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

  // NEW:
  fishCaught?: number;           // Total lifetime fish caught
  unlockedShipIds?: number[];    // List of unlocked ship IDs (for UI filtering)
}
```

### ShipComponent Extension

```typescript
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

  // NEW:
  fishCaught?: number;  // Syncs with SaveData.fishCaught
}
```

---

## Implementation Pseudocode

### 1. Unlock Threshold Lookup

```typescript
// src/data/ship-unlock-db.ts (NEW FILE)

export interface UnlockTier {
  minFishCaught: number;
  shipIds: number[];
  tierName: string;
}

export const SHIP_UNLOCK_TIERS: UnlockTier[] = [
  {
    minFishCaught: 0,
    shipIds: [1],
    tierName: 'Starter',
  },
  {
    minFishCaught: 5,
    shipIds: [2, 3, 4],
    tierName: 'Common Merchant Fleet',
  },
  {
    minFishCaught: 15,
    shipIds: [5, 6, 7, 8],
    tierName: 'Uncommon Vessels',
  },
  {
    minFishCaught: 30,
    shipIds: [9, 10, 11, 12],
    tierName: 'Rare Captains\' Prizes',
  },
  {
    minFishCaught: 50,
    shipIds: [13, 14, 15, 16],
    tierName: 'Legendary Fleets',
  },
  {
    minFishCaught: 75,
    shipIds: [17, 18, 19, 20],
    tierName: 'Mythical Vessels',
  },
];

/**
 * Returns all ship IDs unlocked at or below the given fish count
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
 * Returns the next unlock milestone (fish count, tier name, new ship IDs)
 */
export function getNextUnlockMilestone(fishCaught: number): {
  threshold: number;
  tierName: string;
  shipIds: number[];
} | null {
  for (const tier of SHIP_UNLOCK_TIERS) {
    if (fishCaught < tier.minFishCaught) {
      return {
        threshold: tier.minFishCaught,
        tierName: tier.tierName,
        shipIds: tier.shipIds,
      };
    }
  }
  return null; // All ships unlocked
}
```

### 2. Increment Fish Caught on Catch

In `FishingState.ts`, when fish is caught:

```typescript
// In FishingState.onCatchSuccess() or similar
private onCatchSuccess(fish: FishInstance): void {
  // ...existing catch logic...

  // Track fish caught for ship unlock progression
  if (this.playerShip.fishCaught === undefined) {
    this.playerShip.fishCaught = 1;
  } else {
    this.playerShip.fishCaught++;
  }

  // Check for new unlock milestone
  const nextMilestone = getNextUnlockMilestone(this.playerShip.fishCaught - 1);
  if (nextMilestone && this.playerShip.fishCaught >= nextMilestone.threshold) {
    // Show unlock toast
    this.showUnlockNotification(nextMilestone.tierName, nextMilestone.shipIds);
  }
}

private showUnlockNotification(tierName: string, shipIds: number[]): void {
  // Toast notification or catch popup extension
  // "⚓ NEW SHIPS UNLOCKED: Uncommon Vessels (3 new ships)"
  // Persist to log so player doesn't miss it
}
```

### 3. Show Unlocked Ships in ShipSelectionUI

In `showShipSelection()`:

```typescript
export function showShipSelection(
  ui: UIManager,
  currentShip: ShipComponent,
  onSelectShip: (shipId: number) => void,
  onClose: () => void,
  fishCaught: number = 0  // NEW PARAM
): void {
  const unlockedIds = getUnlockedShipIds(fishCaught);

  // Filter to unlocked ships only
  const shipCardsHtml = SHIPS
    .filter(ship => unlockedIds.includes(ship.id))
    .map((ship) => {
      // ...existing card HTML, unchanged...
    })
    .join('');

  // Add next milestone card after ship list
  const nextMilestone = getNextUnlockMilestone(fishCaught);
  const milestoneHtml = nextMilestone
    ? `<div style="...">
        <div style="color:var(--gold);">NEXT MILESTONE</div>
        <div>${nextMilestone.tierName}</div>
        <div>Catch ${nextMilestone.threshold - fishCaught} more fish</div>
        <progress-bar ... />
      </div>`
    : `<div style="...">
        <div style="color:#FFD700;">⚓ ALL SHIPS UNLOCKED! ⚓</div>
        You've become a legendary fleet admiral!
      </div>`;

  // Rest of panel assembly...
}
```

### 4. Persist & Load Unlock Data

In `SailingState.ts` or `IslandState.ts`, when saving:

```typescript
// In saveGame() calls:
const saveData: SaveData = {
  party: this.playerShip.party,
  playerX: ...,
  // ...existing fields...
  fishCaught: this.playerShip.fishCaught ?? 0,
};
saveGame(saveData);

// On load:
const savedData = loadGame();
if (savedData) {
  this.playerShip.fishCaught = savedData.fishCaught ?? 0;
  // shipId changes persist naturally (player selected ship before save)
}
```

### 5. Add Fleet Tab to DockingUI (Optional but Recommended)

In `DockingUI.ts`, add new tab handler:

```typescript
// Bind to tab clicks
const tabFleet = document.getElementById('tab-fleet');
if (tabFleet) {
  tabFleet.addEventListener('click', () => {
    const fleetPanel = buildFleetPanel(
      ship,
      fishCaught,
      (shipId) => {
        // Handle ship selection
        ship.shipId = shipId;
        ui.hide('island-ui'); // Re-open with new ship
        showIslandUI(ui, island, ship, discoveredTreasures, onHeal, onClose);
      }
    );
    // Show fleet panel in place of explore/shop
  });
}

function buildFleetPanel(
  ship: ShipComponent,
  fishCaught: number,
  onSelectShip: (shipId: number) => void
): string {
  const unlockedIds = getUnlockedShipIds(fishCaught);

  return `
    <div style="padding:12px;">
      <div style="font-size:9px; color:var(--gold); margin-bottom:12px;">YOUR FLEET</div>
      ${SHIPS.map(ship => {
        const isUnlocked = unlockedIds.includes(ship.id);
        const isCurrent = ship.id === ship.shipId;

        if (isUnlocked) {
          return `
            <div style="...ship card...">
              <button onclick="selectShip(${ship.id})">${isCurrent ? 'CURRENT' : 'SELECT'}</button>
            </div>
          `;
        } else {
          // Show locked ship with unlock progress
          const nextTier = getNextUnlockMilestone(fishCaught);
          return `
            <div style="...ship card...opacity:0.4;">
              <div style="color:var(--text-dim);">LOCKED</div>
              <div style="font-size:7px;">Catch ${nextTier?.threshold - fishCaught} more fish</div>
            </div>
          `;
        }
      }).join('')}
    </div>
  `;
}
```

---

## State Machine Integration Points

### Current Flow (No Changes)
```
MainMenuState
  ↓ onNewGame()
  ↓
IslandState (Sunlit Cove)
  ↓ (player walks around, fishes, battles, docks)
  ↓ pushes FishingState, BattleState, etc. as needed
  ↓
SailingState (if player sails out)
```

### New Flow (Minimal Changes)

**In `IslandState.ts` → docking menu:**
- Add "FLEET" tab alongside EXPLORE, SHOP, HEAL, SAIL OUT
- Tab opens filtered `showShipSelection()` with unlock progress

**In `FishingState.ts` → on catch:**
- Increment `playerShip.fishCaught`
- Check for milestone, show toast if reached
- (Optional) Auto-open ship selection UI if Tier 0→1 unlock (hype moment)

**In `SailingState.ts` → save/load:**
- Persist `fishCaught` to SaveData
- Load it back on game restore

**No new State classes needed.** All changes are UI overlays + data tracking.

---

## Unlock Moment: Toast/Notification Design

When a ship tier unlocks, show a brief notification:

**Visual 1: Catch Popup Extension**
```
┌─────────────────────────────────────┐
│  ⚓ CAUGHT: Tidecaller (Lvl 5)       │
│                                     │
│  🎉 NEW SHIPS UNLOCKED!             │
│     "Uncommon Vessels" tier         │
│     (3 new ships added to fleet)    │
│                                     │
│        [View Fleet]  [Continue]     │
└─────────────────────────────────────┘
```

**Visual 2: Toast (Bottom Right)**
```
┌────────────────────────┐
│ ⚓ UNCOMMON SHIPS      │
│   UNLOCKED!           │
│                       │
│ 3 new vessels ready   │
│ to sail               │
│                       │
│ Visit a dock to       │
│ change ships          │
└────────────────────────┘
(auto-dismiss 3s)
```

### Implementation

```typescript
// In showCatchPopup() in FishingUI.ts:
function buildCatchPopup(fish: FishInstance, milestone?: UnlockTier): string {
  const baseHtml = `...existing catch popup...`;

  if (milestone) {
    const milestoneHtml = `
      <div style="
        background:rgba(253,87,75,0.15);
        border-top:2px solid #9D6113;
        padding:12px;
        margin-top:12px;
        color:var(--gold);
        text-align:center;
        font-weight:bold;
      ">
        🎉 NEW SHIPS UNLOCKED: ${milestone.tierName}
      </div>
    `;
    return baseHtml + milestoneHtml;
  }

  return baseHtml;
}
```

---

## Unlock Condition: Alternative Approaches (Considered)

| Approach | Pros | Cons | Status |
|----------|------|------|--------|
| **Fish Caught (Chosen)** | Natural, automatic, rewarding | Requires fishing focus | ✅ RECOMMENDED |
| Ship Parts Collected | Feels like RPG upgrade | Requires new item system; unclear drop rates | ❌ Complexity |
| Captains Defeated | Milestone-driven | Combat is optional; some players avoid battles | ❌ Gatekeeping |
| Treasure Dug | Encourages docking | Treasure RNG is unreliable; not guaranteed | ❌ Inconsistent |
| Story Progression | Narrative weight | No story system yet; requires writing | ❌ Scope |
| Level 5+ Fish | Encourages breeding/grinding | Favors single fish, not variety | ❌ Anti-fun |

---

## Progression Pacing Analysis

**Assuming ~30 seconds per fishing encounter (cast + wait + reel):**

| Tier | Fish Needed | Est. Time | Gameplay | Notes |
|------|------------|-----------|----------|-------|
| Starter → T1 | 5 fish | ~2.5 min | 1st session | Immediate reward after first few casts |
| T1 → T2 | 15 fish total | ~7.5 min | Early play | Roughly 5 more minutes of fishing |
| T2 → T3 | 30 fish total | ~15 min | Mid-session | 22 encounters total, explores multiple zones |
| T3 → T4 | 50 fish total | ~25 min | Late-session | Significant progression, 40 encounters |
| T4 → T5 | 75 fish total | ~37.5 min | End-game | Achieved only by dedicated long runs |

**Verdict:** Pacing feels good. T1 unlock happens naturally in first session. T2 in 10 min. By mid-session, player has unlocked 3 tiers and has meaningful choice.

---

## Testing Checklist (for implementation phase)

- [ ] Fish caught increments correctly on every catch
- [ ] Unlock threshold fires at correct milestones (5, 15, 30, 50, 75)
- [ ] Toast/notification shows on unlock
- [ ] ShipSelectionUI filters to only unlocked ships
- [ ] Milestone progress bar renders correctly
- [ ] DockingUI FLEET tab shows locked ships with progress
- [ ] Ship swap persists across save/load
- [ ] Fish caught persists across save/load
- [ ] All 20 ships eventually unlock (test with override flag)
- [ ] Unlocked ships stay unlocked after reload (no regression)
- [ ] UI doesn't crash with 1 ship vs 20 ships available
- [ ] Mobile responsiveness (if target platform)

---

## Summary: What Gets Wired Where

| File | Change | Type |
|------|--------|------|
| `src/data/ship-unlock-db.ts` | NEW: Unlock tiers, helper functions | New File |
| `src/ui/ShipSelectionUI.ts` | Modify: Filter ships, add milestone card | Enhancement |
| `src/ui/DockingUI.ts` | Modify: Add FLEET tab | Enhancement |
| `src/states/FishingState.ts` | Modify: Increment fish caught, fire unlock toast | Enhancement |
| `src/states/IslandState.ts` | Modify: Hook FLEET tab to ship selection | Enhancement |
| `src/states/SailingState.ts` | Modify: Persist/load fishCaught in save | Enhancement |
| `src/components/ShipComponent.ts` | Modify: Add fishCaught field | Extension |
| `src/core/SaveManager.ts` | Modify: Extend SaveData interface | Extension |
| `src/ui/FishingUI.ts` | Modify: Show unlock toast on milestone | Enhancement |

**No new state classes.** All changes are UI, data, and event hooks.

---

## Next Steps (For Implementation Agents)

1. **Agent 3** (this deliverable): Design ✅
2. **Agent 1/2**: Finish fishing/inventory while this is queued
3. **Implementation Agent**: Wire up in order:
   - `ship-unlock-db.ts` (data)
   - Modify `ShipComponent` + `SaveData`
   - Modify `FishingState` (increment + toast)
   - Modify `ShipSelectionUI` (filter + progress)
   - Modify `DockingUI` (add FLEET tab)
   - Test unlock flow end-to-end
4. **Playtesting**: Adjust thresholds (5/15/30/50/75) based on feel

