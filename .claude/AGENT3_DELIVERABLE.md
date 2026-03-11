# Agent 3: Ship Unlock Flow Design — DELIVERABLE

**Completed:** 2026-03-10
**Agent:** 3 (Ship Unlock Flow Designer)
**Status:** READY FOR IMPLEMENTATION

---

## What Was Delivered

Two comprehensive design documents for the Ship Unlock System:

### 1. `SHIP_UNLOCK_FLOW_DESIGN.md` (Main Design Doc)
**Location:** `/corsair-catch/SHIP_UNLOCK_FLOW_DESIGN.md`

**Contents:**
- Executive summary of unlock strategy
- Anchor condition analysis (why "fish caught" is optimal)
- Unlock tier progression (0 → 5 → 15 → 30 → 50 → 75 fish)
- UX flow diagrams (notification-based + docking tab)
- Data structure extensions (SaveData, ShipComponent)
- Implementation pseudocode (5 major functions)
- State machine integration points (minimal changes)
- Pacing analysis (playtesting feedback ready)
- Complete testing checklist (17 items)
- File-by-file modification summary

### 2. `.claude/rules/ship-unlock-implementation.md` (Implementation Quick Ref)
**Location:** `/.claude/rules/ship-unlock-implementation.md`

**Contents:**
- Detailed code snippets for each file modification
- Complete function implementations (copy-paste ready)
- Import statement inventory
- Edge case validation
- Debug helpers for QA
- Step-by-step checklist (14 items)

---

## Key Design Decisions

### Unlock Condition: Fish Caught
Why this over alternatives:
- **Natural:** Automatic trigger from core gameplay loop
- **Rewarding:** Every catch inches player toward next milestone
- **Inclusive:** All player types fish; no one misses progression
- **Scalable:** 0 → 75 fish feels right for multi-session progression

### Unlock Notifications
**Moment of Unlock:** Show inline in catch popup when tier unlocks
- "🎉 NEW SHIPS UNLOCKED: Uncommon Vessels (3 ships)"
- Player sees immediately, knows what happened
- No new state machine needed

**Discovery Tab:** Add "FLEET" tab to DockingUI for browsing locked ships
- Shows what's coming: "Catch 8 more fish to unlock Storm Reach ships"
- Progress bar visualization
- Can swap ships at dock if already unlocked

### 6-Tier Progression

| Tier | Fish | Ships | Time | Context |
|------|------|-------|------|---------|
| Starter | 0 | 1 | Start | Driftwood Dory, immediate sail |
| Common | 5 | 4 | 2.5 min | Natural unlock mid-first-session |
| Uncommon | 15 | 8 | 7.5 min | More varied options |
| Rare | 30 | 12 | 15 min | Significant power jump |
| Legendary | 50 | 16 | 25 min | Late-game achievements |
| Mythical | 75 | 20 | 37.5 min | Completionists only |

**Flexibility:** Thresholds tunable post-playtesting. Current values are conservative.

---

## Zero New State Classes

All changes are **UI overlays + data tracking**. No new GameState needed:
- Notifications happen in existing catch popup
- Fleet tab is a DockingUI tab (like EXPLORE, SHOP, HEAL)
- Unlock tracking is just an incremented number in ShipComponent
- Save/load integrates seamlessly into existing SaveManager

---

## Files to Modify (7 Existing + 1 New)

### New File
- **`src/data/ship-unlock-db.ts`** — 6 utility functions, no dependencies

### Core Extensions
- **`src/components/ShipComponent.ts`** — +1 field: `fishCaught?: number`
- **`src/core/SaveManager.ts`** — +1 field in SaveData interface

### Game Logic
- **`src/states/FishingState.ts`** — Increment `fishCaught`, detect milestone, fire toast
- **`src/states/SailingState.ts`** — Persist/load `fishCaught` in saves

### UI Modifications
- **`src/ui/FishingUI.ts`** — Show unlock notification in catch popup
- **`src/ui/ShipSelectionUI.ts`** — Filter ships, show milestone progress
- **`src/ui/DockingUI.ts`** — Add FLEET tab to island UI

---

## Implementation Path (for next agent)

1. **Create** `ship-unlock-db.ts` with 6 utility functions (standalone, no blockers)
2. **Extend** ShipComponent + SaveData interfaces (+2 LOC each)
3. **Wire FishingState** to increment fish and detect milestones
4. **Update FishingUI** to show unlock toast in catch popup
5. **Filter ShipSelectionUI** to only show unlocked ships + progress
6. **Add FLEET tab** to DockingUI for browsing
7. **Persist/load** in SailingState saves
8. **Test** unlock progression end-to-end

**No dependencies between steps.** Can be parallelized.

---

## Design Validation (Answers to Spec Questions)

### Q: What's the unlock condition?

**A:** Fish caught (0 → 5 → 15 → 30 → 50 → 75). Natural, rewarding, scalable.

### Q: Where does ship selection happen?

**A:**
1. **Primary:** Notification toast in catch popup when tier unlocks ("Visit a dock to change ships")
2. **Secondary:** FLEET tab in DockingUI for browsing/swapping unlocked ships
3. **Optional:** Could add to MainMenuUI for starting ship pick (deferred to later iteration)

### Q: How many ships can player unlock?

**A:** All 20 eventually. Progression: 1 → 4 → 8 → 12 → 16 → 20 ships as milestones hit. Clean tier-based structure.

### Q: Is it permanent or swappable?

**A:** **Swappable.** Player can swap to any unlocked ship at dock. Encourages variety. No "permanent choice" gating.

---

## Scope Boundaries

### In Scope (Delivered)
- Unlock progression design
- UX/notification flows
- Data persistence
- Implementation code sketches
- Testing checklist

### Out of Scope (Future Work)
- Actual sprite loading for ships (Agent 2)
- Ship shop/purchase system (requires gold cost logic)
- Ship abilities affecting gameplay (combat/sailing mechanics)
- Story integration (who are the legendary captains?)
- Inventory management (Agent 1)

---

## Playtesting Guidance

After implementation, test these scenarios:

1. **First Run:** Catch 5 fish → see Tier 1 unlock toast → dock → verify FLEET tab shows 4 ships
2. **Mid-Game:** Reach 30 fish → verify all 12 ships unlocked → can swap to any
3. **Late-Game:** Reach 75 fish → all 20 ships visible → "ALL UNLOCKED" message
4. **Save/Load:** Close at 25 fish, reload → fish count persists, Tier 3 locked ships still locked
5. **UI Polish:** Verify toast visibility (not obscured), progress bar smooth, fleet tab responsive

**Tuning:** If 5-15-30 feels too slow, adjust down (3-8-20). If too fast, adjust up (10-25-40).

---

## Key Files for Implementation Agent

| File | Purpose | Read First? |
|------|---------|------------|
| `SHIP_UNLOCK_FLOW_DESIGN.md` | Full design with rationale | ✅ Yes |
| `.claude/rules/ship-unlock-implementation.md` | Code snippets & checklists | ✅ Yes |
| `src/ui/ShipSelectionUI.ts` | Current ship UI (filter this) | ✓ Reference |
| `src/ui/DockingUI.ts` | Island docking (add tab here) | ✓ Reference |
| `src/states/FishingState.ts` | Fish catch logic (hook here) | ✓ Reference |
| `src/data/fish-db.ts` | Fish species (no changes) | ✗ No |

---

## Next Steps for Will

1. **Review** both design docs for clarity/feedback
2. **Schedule** implementation with next agent (likely multi-day task)
3. **QA Plan:** Playtesting checklist provided; adjust thresholds based on feel
4. **Future:** Ship abilities (combat/sailing), shop system, and story can follow

---

## Questions Answered

### "When does ship selection get unlocked?"
→ On first docking, after catching 5 fish. Tier 0 starts with Driftwood Dory (no wait).

### "Where does it happen in the game flow?"
→ 1) Notification toast on catch, 2) FLEET tab in DockingUI, 3) Optional: MainMenu ship picker (future).

### "How do we know what to unlock when?"
→ Data-driven tiers in `ship-unlock-db.ts`. Modify one array to retune all thresholds.

### "How does save/load work?"
→ `fishCaught` number persists like `gold` or `playtime`. On load, unlocks recompute from that number.

### "Can player lose progress?"
→ No. Once 15 fish caught, Tier 2 ships stay unlocked even if they lose fish (they can't).

---

## Delivery Artifacts

```
corsair-catch/
├── SHIP_UNLOCK_FLOW_DESIGN.md          [MAIN DESIGN DOC]
├── .claude/
│   └── rules/
│       └── ship-unlock-implementation.md [IMPLEMENTATION GUIDE]
└── .claude/
    └── AGENT3_DELIVERABLE.md           [THIS FILE]
```

All three docs are in the repo for future reference.

---

## Sign-Off

**Agent 3:** Ship Unlock Flow Designer
**Status:** ✅ COMPLETE
**Handoff:** Ready for implementation agent

Design is thorough, well-documented, and ready to code. No blocking questions. Implementation can begin immediately after review.

