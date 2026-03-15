# Requirements

## Active

### R001 — Scene Transitions Don't Loop
- Class: core-capability
- Status: active
- Description: Walking between beaches must transition cleanly without oscillation loops
- Why it matters: Blocker — players get stuck in infinite scene-swap loops
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: unmapped
- Notes: BUG-02. Cooldown + spawn position fix needed.

### R002 — Pirate Battles Render Correctly
- Class: core-capability
- Status: active
- Description: Battles against Blackhand Pete enemies must display the battle UI, not a black screen
- Why it matters: Blocker — pirate battles are unplayable
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: unmapped
- Notes: BUG-09. Evil pirate sprites exist but may not render.

### R003 — Battle TEAM/ITEMS Panels Work
- Class: primary-user-loop
- Status: active
- Description: TEAM and ITEMS buttons in battle must open real interactive panels, not show placeholder text
- Why it matters: Players can't switch fish or use items mid-battle
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: unmapped
- Notes: BUG-15. Item panel code exists (commit 21779fa) but may not be wired.

### R004 — CATCH Button Properly Sized
- Class: primary-user-loop
- Status: active
- Description: The CATCH button in wild fish battles must not overlay other UI elements
- Why it matters: UI overlap makes battle controls confusing
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: unmapped
- Notes: BUG-16.

### R005 — HUD Buttons on All Beaches
- Class: primary-user-loop
- Status: active
- Description: Inventory, team, and volume HUD buttons must appear on Beach2 and Beach3, not just Beach1
- Why it matters: Players lose access to inventory/team on 2 of 3 beaches
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: unmapped
- Notes: BUG-14.

### R006 — Fish Data Integrity
- Class: core-capability
- Status: active
- Description: All 62 fish species must have valid names, types, sprites — no "???" or "Unknown Fish" displays
- Why it matters: Breaks immersion and hides fish identity
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: BUG-06.

### R007 — Starter Balance Parity
- Class: primary-user-loop
- Status: active
- Description: Water and Nature starters must have offensive moves and comparable ATK to Fire starter
- Why it matters: 2 of 3 starters are nearly unplayable in early game
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: BUG-04.

### R008 — Beach3 Spawn Position Correct
- Class: core-capability
- Status: active
- Description: Transitioning from Beach1 to Beach3 must spawn player on the right side of Beach3
- Why it matters: Player spawns on wrong side, disorienting
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: BUG-08.

### R009 — Items Persist Across Refresh
- Class: continuity
- Status: active
- Description: Collected ground items must be saved and not respawn on browser refresh
- Why it matters: Infinite item farming exploit; breaks progression feel
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: unmapped
- Notes: BUG-03.

### R010 — Fishing Requires Rod
- Class: primary-user-loop
- Status: active
- Description: Players must have a fishing rod before they can fish
- Why it matters: Catching fish without a rod breaks the progression gate
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: unmapped
- Notes: BUG-12.

### R011 — TMX Collision Debug Overlay
- Class: operability
- Status: active
- Description: A ?debug=1 URL param draws all TMX zones as colored overlays in-game
- Why it matters: Will needs visual feedback to iterate on collision bounds in Tiled
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: unmapped
- Notes: BUG-01 tooling.

### R012 — Fish Catch Overlay
- Class: primary-user-loop
- Status: active
- Description: After catching a fish, show an overlay with sprite, name, type, rarity, and level
- Why it matters: No feedback on what was caught
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: unmapped
- Notes: BUG-13.

### R013 — Dialogue Accuracy
- Class: quality-attribute
- Status: active
- Description: NPC dialogue must give correct directional references (Beach1 is west of Beach2, not east)
- Why it matters: Misleading navigation instructions
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: unmapped
- Notes: BUG-11.

### R017 — Mobile Detection Accuracy
- Class: core-capability
- Status: active
- Description: Mobile UI (joystick, touch buttons, larger hit areas) must only activate on actual mobile devices, not on touch-capable PCs. Desktop must never show mobile UI.
- Why it matters: PC players get mobile joystick overlay and wrong hint text; mobile edits break desktop
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Current detection `'ontouchstart' in window || navigator.maxTouchPoints > 0` false-positives on Windows touch laptops/desktops.

### R018 — Mobile Layout Parity
- Class: quality-attribute
- Status: active
- Description: All new UI added in this milestone (TEAM/ITEMS panels, catch overlay, HUD, debug overlay) must work correctly on mobile — proper sizing, touch targets, landscape orientation
- Why it matters: Past edits repeatedly broke mobile layout
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: M001/S04
- Validation: unmapped
- Notes: Every UI change must be tested at mobile viewport. Dual-target rule from CLAUDE.md.

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
- Notes: BUG-10. Medium priority, deferred to keep milestone focused on blockers/high.

### R015 — Fishing Minigame Depth
- Class: differentiator
- Status: deferred
- Description: Rarity-scaled difficulty, multi-axis challenges, rod quality affecting green zone
- Why it matters: Current fishing feels flat
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: BUG-05. Medium priority, deferred.

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
| R001 | core-capability | active | M001/S01 | none | unmapped |
| R002 | core-capability | active | M001/S01 | none | unmapped |
| R003 | primary-user-loop | active | M001/S02 | none | unmapped |
| R004 | primary-user-loop | active | M001/S02 | none | unmapped |
| R005 | primary-user-loop | active | M001/S02 | none | unmapped |
| R006 | core-capability | active | M001/S03 | none | unmapped |
| R007 | primary-user-loop | active | M001/S03 | none | unmapped |
| R008 | core-capability | active | M001/S03 | none | unmapped |
| R009 | continuity | active | M001/S04 | none | unmapped |
| R010 | primary-user-loop | active | M001/S04 | none | unmapped |
| R011 | operability | active | M001/S01 | none | unmapped |
| R012 | primary-user-loop | active | M001/S04 | none | unmapped |
| R013 | quality-attribute | active | M001/S01 | none | unmapped |
| R014 | quality-attribute | deferred | none | none | unmapped |
| R015 | differentiator | deferred | none | none | unmapped |
| R016 | quality-attribute | deferred | none | none | unmapped |
| R017 | core-capability | active | M001/S02 | none | unmapped |
| R018 | quality-attribute | active | M001/S02 | M001/S04 | unmapped |

## Coverage Summary

- Active requirements: 15
- Mapped to slices: 15
- Validated: 0
- Unmapped active requirements: 0
