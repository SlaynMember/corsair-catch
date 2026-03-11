# Inventory System Design — Complete Documentation Index

**Mission:** Agent #2 designed the inventory system for Corsair Catch.

**Status:** ✅ Design Complete | ✅ Pseudocode Ready | ✅ Implementation Roadmap Clear

**Date:** March 10, 2026

---

## 📚 Four-Document Architecture

### 1. **INVENTORY_CURRENT_STATE.md** ← START HERE
**Purpose:** Understand exactly what exists vs. what's missing.

**Contents:**
- File-by-file analysis (SaveManager, ShipComponent, ItemDB, etc.)
- What's already built (60% complete)
- Critical gaps (SaveData.shipId, InventoryManager class, UI display)
- Implementation order (step-by-step roadmap)
- Priority matrix (high/medium/low)

**Best for:** Quick orientation, gap identification, task scheduling

**Time to read:** 10 minutes

---

### 2. **INVENTORY_SYSTEM_DESIGN.md** ← THE BIBLE
**Purpose:** Complete, authoritative design specification.

**Contents:**
- Executive summary
- Current state analysis
- Inventory architecture (5 resource types)
- Data structures (ShipComponent, SaveData)
- Item & bait definitions
- Acquisition sources (where things come from)
- Storage limits (hard caps, soft caps)
- UI integration plan (screens, mockups)
- Pseudocode (InventoryManager skeleton)
- Implementation checklist (4 phases)
- Design rationale (why we made each decision)
- Future extensions (v2 features)
- QA questions for Will

**Best for:** Deep understanding, design rationale, reference documentation

**Time to read:** 20-30 minutes

**Key sections:**
- Section 2: Current state gaps
- Section 3: Resource types (understand what's tracked)
- Section 5: Data structure (SaveData interface)
- Section 6: UI mockups (what players see)
- Section 8: Pseudocode (InventoryManager methods)
- Section 10: Checklist (what to implement)

---

### 3. **INVENTORY_PSEUDOCODE.md** ← COPY-PASTE READY
**Purpose:** Production-ready code for implementation.

**Contents:**
1. **InventoryManager class** (complete TypeScript, full methods)
   - Gold operations
   - Item operations
   - Bait operations
   - Party operations
   - Treasure operations
   - Utility methods

2. **SaveManager update** (new SaveData interface + functions)
   - saveGame() with defaults
   - loadGame() with backward compatibility
   - hasSave(), deleteSave()

3. **FishingState integration** (bait selection UI + consumption)
   - showBaitSelectionMenu()
   - confirmBaitSelection()
   - Bait consumption on cast

4. **BattleState integration** (item usage)
   - onItemButtonClicked()
   - useItem() logic
   - Item consumption

5. **DockingUI integration** (loot drops with InventoryManager)
   - Refactored bindTreasureTiles()
   - Gold/bait/item addition

6. **InventoryUI enhancement** (tabs for resources)
   - buildBaitTab()
   - buildItemsTab()
   - Gold display in header

**Best for:** Developers implementing the system

**Time to read:** 15 minutes (skim), 45 minutes (understand & adapt)

**How to use:**
1. Copy InventoryManager class directly (TypeScript ready)
2. Update SaveManager per section 2
3. Wire FishingState changes (section 3)
4. Wire BattleState changes (section 4)
5. Wire DockingUI changes (section 5)
6. Wire InventoryUI changes (section 6)

---

### 4. **INVENTORY_SYSTEM_SUMMARY.md** ← EXECUTIVE BRIEF
**Purpose:** High-level overview for decision-makers.

**Contents:**
- What you asked for (recap)
- What we found (good news: 60% built, bad news: 40% missing)
- The design (3-document structure)
- Architecture at a glance (resources, InventoryManager, storage)
- What Agents #1, #3 need to do
- Implementation roadmap (phases)
- Key design decisions (rationale)
- Questions to clarify before starting
- Files to implement (table)
- Testing checklist
- Time estimate

**Best for:** Will, project managers, quick reviews

**Time to read:** 5 minutes

---

## 🎯 Quick Navigation by Role

### For **Will** (Project Owner):
1. Read: INVENTORY_SYSTEM_SUMMARY.md
2. Skim: INVENTORY_CURRENT_STATE.md (quick wins section)
3. Decide: Answer the 5 questions in INVENTORY_DESIGN.md Section 13
4. Share: Pass INVENTORY_PSEUDOCODE.md to dev team

**Time:** 15 minutes

---

### For **Agent #2** (You, Inventory Designer):
1. Read: INVENTORY_CURRENT_STATE.md (full)
2. Study: INVENTORY_SYSTEM_DESIGN.md (sections 2, 8, 10)
3. Reference: INVENTORY_PSEUDOCODE.md (when implementing)

**Time:** 1 hour (design review), ongoing (implementation reference)

---

### For **Agent #1** (Fishing Debug):
1. Skim: INVENTORY_SYSTEM_SUMMARY.md (your section)
2. Read: INVENTORY_PSEUDOCODE.md (section 3: FishingState)
3. Reference: INVENTORY_DESIGN.md (section 4: Bait definitions)

**Tasks:**
- Add bait selection UI before cast
- Wire InventoryManager.removeBait() on confirmation
- Optional: Add loot drop on catch

**Time:** 4-6 hours

---

### For **Agent #3** (Ship Unlock / UI):
1. Skim: INVENTORY_SYSTEM_SUMMARY.md (your section)
2. Read: INVENTORY_PSEUDOCODE.md (section 6: InventoryUI)
3. Reference: INVENTORY_DESIGN.md (section 6: UI mockups)

**Tasks:**
- Update InventoryUI with BAIT, ITEMS tabs
- Add gold display to HUD
- Wire ship-db.ts shipId to ShipComponent

**Time:** 4-6 hours

---

### For **Developers** (Implementation):
1. Reference: INVENTORY_CURRENT_STATE.md (what exists)
2. Study: INVENTORY_SYSTEM_DESIGN.md (sections 3-8 for context)
3. Copy: INVENTORY_PSEUDOCODE.md (code is production-ready)

**Time:** Full implementation 8-12 hours (parallel work across phases)

---

## 📋 Implementation Checklist

Use this to track progress:

### Phase 1: Core Infrastructure (Immediate)
- [ ] Create `src/components/InventoryManager.ts` (copy from pseudocode)
- [ ] Update `src/core/SaveManager.ts` with shipId
- [ ] Test: Save/load cycle restores shipId and all inventory fields

### Phase 2: UI Display (Parallel)
- [ ] Update `src/ui/InventoryUI.ts` tabs (CREW, BAIT, ITEMS)
- [ ] Add gold display to `src/ui/HUD.ts` (top-right corner)
- [ ] Test: Inventory opens, shows all resources

### Phase 3: Fishing (Agent #1)
- [ ] Add bait selection UI to `src/states/FishingState.ts`
- [ ] Wire InventoryManager.removeBait() on cast
- [ ] Test: Select bait, cast, verify bait count decreases

### Phase 4: Battle Integration (Agent #2/Will)
- [ ] Add ITEMS button to battle menu (`src/states/BattleState.ts`)
- [ ] Implement item selection and usage
- [ ] Apply item effects (heal, revive, cure)
- [ ] Test: Use potion in battle, verify effect and item consumed

### Phase 5: Polish & Refactoring
- [ ] Refactor DockingUI to use InventoryManager for consistency
- [ ] Add SFX for inventory actions
- [ ] Add overflow messages for full storage
- [ ] Test: All inventory operations produce feedback (visual + audio)

---

## 🔑 Key Concepts (Glossary)

| Term | Definition | Example |
|------|-----------|---------|
| **InventoryManager** | Unified class for all inventory operations | `inventory.addGold(50)` |
| **ShipComponent** | Player's ship = inventory container | `player.ship.gold`, `player.ship.party` |
| **Resource** | Any collectible item (gold, fish, bait, items, treasures) | Gold, Sea Biscuit, Worm Bait |
| **Soft cap** | Limit that can be exceeded (UI truncates) | Max 99 items, displays as "99+" if more |
| **Hard cap** | Limit that cannot be exceeded (blocks action) | maxPartySize = 3 fish per ship |
| **Loot roll** | Random selection from weighted table | Roll treasure: 30% gold, 22% bait, 18% item |
| **Bait boost** | Rarity increase from using bait | Worm Bait +10%, Glitter Lure +15% |
| **Effect** | Item's in-game behavior | Heal: +30% HP, Revive: restore 25% HP |
| **SaveData** | Persistent game state in localStorage | All inventory, position, playtime saved |
| **Persistence** | Data survives game reload | Players don't lose gold/items on reload |

---

## 🎨 Architecture Diagram

```
USER (Will)
    |
    v
┌─────────────────────────────────────┐
│  INVENTORY_SYSTEM_SUMMARY.md        │ Quick reference
│  (Executive brief)                  │ ~5 min read
└─────────────────────────────────────┘
    |
    |-- Approves design, asks questions
    |
    v
┌─────────────────────────────────────┐
│  INVENTORY_SYSTEM_DESIGN.md         │ Deep dive
│  (Complete spec, rationale)         │ ~20-30 min read
└─────────────────────────────────────┘
    |
    |-- (Design review, clarify questions)
    |
    v
┌─────────────────────────────────────┐
│  INVENTORY_CURRENT_STATE.md         │ Gap analysis
│  (What exists vs. missing)          │ ~10 min read
└─────────────────────────────────────┘
    |
    |-- Identifies tasks for agents
    |
    v
┌─────────────────────────────────────┐
│  INVENTORY_PSEUDOCODE.md            │ Implementation guide
│  (Production-ready code)            │ ~45 min understand
└─────────────────────────────────────┘
    |
    |-- Agents #1, #2, #3 work in parallel
    |
    v
  CODE IMPLEMENTATION
    |
    |-- Phase 1: InventoryManager + SaveData
    |-- Phase 2: UI display (HUD, inventory tabs)
    |-- Phase 3: Fishing integration (bait selection)
    |-- Phase 4: Battle integration (item usage)
    |-- Phase 5: Polish (SFX, overflow messages)
    |
    v
  TESTING & DEPLOYMENT
```

---

## 📞 Questions? Reference These Sections

| Question | Document | Section |
|----------|----------|---------|
| "What's the architecture?" | DESIGN.md | Section 2 |
| "What needs to be built?" | CURRENT_STATE.md | Summary table |
| "How do I store resources?" | PSEUDOCODE.md | Section 1 (InventoryManager) |
| "How do I save/load?" | PSEUDOCODE.md | Section 2 (SaveManager) |
| "How do I add bait selection?" | PSEUDOCODE.md | Section 3 (FishingState) |
| "How do I use items in battle?" | PSEUDOCODE.md | Section 4 (BattleState) |
| "How do I show inventory UI?" | PSEUDOCODE.md | Section 6 (InventoryUI) |
| "What gets collected?" | DESIGN.md | Section 2.1 (Resource Types) |
| "Where do items come from?" | DESIGN.md | Section 4 (Acquisition Sources) |
| "How much storage?" | DESIGN.md | Section 5 (Storage Limits) |
| "Why this design?" | DESIGN.md | Section 11 (Design Decisions) |

---

## 💾 File Locations

All design documents saved to `/corsair-catch/`:

```
/corsair-catch/
├── INVENTORY_DESIGN_INDEX.md          ← YOU ARE HERE
├── INVENTORY_SYSTEM_SUMMARY.md        ← Executive brief
├── INVENTORY_SYSTEM_DESIGN.md         ← Complete spec (15 sections)
├── INVENTORY_PSEUDOCODE.md            ← Production code (6 sections)
└── INVENTORY_CURRENT_STATE.md         ← Gap analysis (file-by-file)
```

Implementation files (to be created):
```
/corsair-catch/src/
├── components/
│   └── InventoryManager.ts            ← NEW (copy from pseudocode)
├── core/
│   └── SaveManager.ts                 ← UPDATE (add shipId, hullHp)
├── states/
│   ├── FishingState.ts                ← UPDATE (bait selection UI)
│   └── BattleState.ts                 ← UPDATE (item usage menu)
└── ui/
    ├── InventoryUI.ts                 ← UPDATE (tabs for resources)
    ├── HUD.ts                         ← UPDATE (gold display)
    └── DockingUI.ts                   ← OPTIONAL (refactor to use InventoryManager)
```

---

## ⏱️ Time Estimates

| Task | Time | Who |
|------|------|-----|
| Read summary | 5 min | Will |
| Read design | 20-30 min | Will, Agents |
| Read current state | 10 min | All |
| Review pseudocode | 45 min | Developers |
| **Implement InventoryManager** | 1-2 hours | Agent #2 |
| **Update SaveManager** | 30 min | Agent #2 |
| **Bait selection UI** | 3-4 hours | Agent #1 |
| **Item usage in battle** | 3-4 hours | Agent #2 |
| **UI display (HUD + tabs)** | 3-4 hours | Agent #3 |
| **Testing & polish** | 2 hours | Will |
| **Total** | **15-19 hours** | All (parallel) |

---

## ✅ Final Checklist Before Implementation

- [ ] Will has reviewed INVENTORY_SYSTEM_SUMMARY.md
- [ ] Will has answered the 5 questions in DESIGN.md Section 13
- [ ] All agents have read their respective sections in PSEUDOCODE.md
- [ ] Team has agreed on schedule (Phase 1–5 timeline)
- [ ] InventoryManager class is ready to copy (verified pseudocode compiles)
- [ ] Test plan is clear (SUMMARY.md Section "Testing Checklist")
- [ ] No blockers identified

---

## 🚀 Next Step

**Will:** Review INVENTORY_SYSTEM_SUMMARY.md, approve design, answer questions.

**Agents:** Start Phase 1 (InventoryManager class + SaveManager update).

**Expected completion:** 2-3 days (parallel work).

---

**Good luck! ⛵⚓**

Questions? Check the relevant document, or ask Will to clarify via the 5 design questions.

