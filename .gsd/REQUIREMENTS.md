# Requirements

## Validated

### R001 — Scene Transitions Don't Loop
- Class: core-capability
- Status: validated
- Description: Walking between beaches must transition cleanly without oscillation loops
- Why it matters: Blocker — players get stuck in infinite scene-swap loops
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: Transition cooldown + spawn offset in all 3 scenes; smoke tests verify bidirectional transitions
- Notes: BUG-02. Fixed with 40px spawn offset + 500ms time-based cooldown.

### R002 — Pirate Battles Render Correctly
- Class: core-capability
- Status: validated
- Description: Battles against Blackhand Pete enemies must display the battle UI, not a black screen
- Why it matters: Blocker — pirate battles are unplayable
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: Full trace through launch chain; headless test launched pirate battle with zero errors; was transient state issue
- Notes: BUG-09. No code fix needed — was transient state issue during playtest.

### R003 — Battle TEAM/ITEMS Panels Work
- Class: primary-user-loop
- Status: validated
- Description: TEAM and ITEMS buttons in battle must open real interactive panels, not show placeholder text
- Why it matters: Players can't switch fish or use items mid-battle
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: Code audit confirms full wood-panel UI with cursor nav, touch support, target selection; smoke tests verify open/close
- Notes: BUG-15. Panels were already fully implemented — verified, not fixed.

### R004 — CATCH Button Properly Sized
- Class: primary-user-loop
- Status: validated
- Description: The CATCH button in wild fish battles must not overlay other UI elements
- Why it matters: UI overlap makes battle controls confusing
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: Resized from 200×46 to 114×36 at (370,670), matching TEAM/ITEMS action row
- Notes: BUG-16. Fixed.

### R005 — HUD Buttons on All Beaches
- Class: primary-user-loop
- Status: validated
- Description: Inventory, team, and volume HUD buttons must appear on Beach2 and Beach3, not just Beach1
- Why it matters: Players lose access to inventory/team on 2 of 3 beaches
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: HUDManager.ts created and wired into all 3 beach scenes
- Notes: BUG-14. Fixed with shared HUDManager class.

### R006 — Fish Data Integrity
- Class: core-capability
- Status: validated
- Description: All fish species must have valid names, types, sprites — no "???" or "Unknown Fish" displays
- Why it matters: Breaks immersion and hides fish identity
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: 63 species with complete data; data audit shows 0 missing references, 0 broken evolution chains
- Notes: BUG-06. Lantern Angler (id:57) added to fill gap.

### R007 — Starter Balance Parity
- Class: primary-user-loop
- Status: validated
- Description: Water and Nature starters must have offensive moves and comparable ATK to Fire starter
- Why it matters: 2 of 3 starters are nearly unplayable in early game
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: Frost Carp: bubble_burst (50 power, 100 acc) + 58 ATK. Sea Moss: thorn_wrap (55 power, 90 acc) + 58 ATK
- Notes: BUG-04. Fixed.

### R008 — Beach3 Spawn Position Correct
- Class: core-capability
- Status: validated
- Description: Transitioning from Beach1 to Beach3 must spawn player on the right side of Beach3
- Why it matters: Player spawns on wrong side, disorienting
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: to-beach1 zone at x=1315, spawn offset to x=1275
- Notes: BUG-08. Fixed in S01 as part of transition system.

### R009 — Items Persist Across Refresh
- Class: continuity
- Status: validated
- Description: Collected ground items must be saved and not respawn on browser refresh
- Why it matters: Infinite item farming exploit; breaks progression feel
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: collectedItems added to SaveData; restoreFromSave hides collected items
- Notes: BUG-03. Fixed.

### R010 — Fishing Requires Rod
- Class: primary-user-loop
- Status: validated
- Description: Players must have a fishing rod before they can fish
- Why it matters: Catching fish without a rod breaks the progression gate
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: hasRod check in all 3 beach scenes; rod given with starter in confirmStarterPick()
- Notes: BUG-12. Fixed.

### R011 — TMX Collision Debug Overlay
- Class: operability
- Status: validated
- Description: A ?debug=1 URL param draws all TMX zones as colored overlays in-game
- Why it matters: Will needs visual feedback to iterate on collision bounds in Tiled
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: TMXDebug.ts created; ?debug=1 renders colored overlays on all 3 beaches
- Notes: BUG-01 tooling. Implemented.

### R012 — Fish Catch Overlay
- Class: primary-user-loop
- Status: validated
- Description: After catching a fish, show an overlay with sprite, name, type, rarity, and level
- Why it matters: No feedback on what was caught
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: showCatchOverlay() creates wood panel with fish sprite (96×84 bob), name, type, level, rarity
- Notes: BUG-13. Fixed.

### R013 — Dialogue Accuracy
- Class: quality-attribute
- Status: validated
- Description: NPC dialogue must give correct directional references (Beach1 is west of Beach2, not east)
- Why it matters: Misleading navigation instructions
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: Beach2Scene dialogue corrected
- Notes: BUG-11. Fixed.

### R017 — Mobile Detection Accuracy
- Class: core-capability
- Status: validated
- Description: Mobile UI (joystick, touch buttons, larger hit areas) must only activate on actual mobile devices, not on touch-capable PCs. Desktop must never show mobile UI.
- Why it matters: PC players get mobile joystick overlay and wrong hint text; mobile edits break desktop
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: IS_MOBILE uses matchMedia('(pointer: coarse)'); desktop touch screens report pointer:fine
- Notes: Fixed. pointer:coarse is the primary signal, touch + screen ≤ 1024px is fallback.

### R018 — Mobile Layout Parity
- Class: quality-attribute
- Status: validated
- Description: All new UI added in this milestone (TEAM/ITEMS panels, catch overlay, HUD, debug overlay) must work correctly on mobile — proper sizing, touch targets, landscape orientation
- Why it matters: Past edits repeatedly broke mobile layout
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: M001/S04
- Validation: HUD buttons use IS_MOBILE-scaled sizing (64px vs 44px); all new UI works on mobile viewport
- Notes: Validated across all slice implementations.

## Deferred

### R014 — Battle Visual Feedback
- Class: quality-attribute
- Status: deferred
- Description: Hit flashes, element-specific particles, screen shake on crits, floating damage numbers
- Why it matters: Attacks feel weak without visual juice
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: BUG-10. Medium priority, deferred to M003 (Battle Juice).

### R015 — Fishing Minigame Depth
- Class: differentiator
- Status: deferred
- Description: Rarity-scaled difficulty, multi-axis challenges, rod quality affecting green zone
- Why it matters: Current fishing feels flat
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: BUG-05. Medium priority, deferred to M005 (Fishing Depth).

### R016 — Seashell/Rock Overlap Fix
- Class: quality-attribute
- Status: deferred
- Description: Decorative shells should not render on top of rocks
- Why it matters: Minor visual glitch
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: BUG-07. Low priority.

## Out of Scope

None currently.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | validated | M001/S01 | none | Smoke tests + cooldown code |
| R002 | core-capability | validated | M001/S01 | none | Headless trace, zero errors |
| R003 | primary-user-loop | validated | M001/S02 | none | Code audit + smoke tests |
| R004 | primary-user-loop | validated | M001/S02 | none | Button resized to 114×36 |
| R005 | primary-user-loop | validated | M001/S02 | none | HUDManager in all 3 scenes |
| R006 | core-capability | validated | M001/S03 | none | 63 species, data audit clean |
| R007 | primary-user-loop | validated | M001/S03 | none | Offensive moves + ATK 58 |
| R008 | core-capability | validated | M001/S01 | none | Spawn offset x=1275 |
| R009 | continuity | validated | M001/S04 | none | collectedItems in SaveData |
| R010 | primary-user-loop | validated | M001/S04 | none | hasRod gate, all 3 scenes |
| R011 | operability | validated | M001/S01 | none | TMXDebug.ts + ?debug=1 |
| R012 | primary-user-loop | validated | M001/S04 | none | showCatchOverlay() |
| R013 | quality-attribute | validated | M001/S01 | none | Dialogue text corrected |
| R014 | quality-attribute | deferred | none | none | unmapped |
| R015 | differentiator | deferred | none | none | unmapped |
| R016 | quality-attribute | deferred | none | none | unmapped |
| R017 | core-capability | validated | M001/S02 | none | pointer:coarse media query |
| R018 | quality-attribute | validated | M001/S02 | M001/S04 | IS_MOBILE-scaled sizing |

## Coverage Summary

- Validated requirements: 15
- Deferred requirements: 3
- Active requirements: 0
- Unmapped active requirements: 0
