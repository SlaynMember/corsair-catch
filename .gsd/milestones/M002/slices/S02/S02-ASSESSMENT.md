# S02 Assessment — Roadmap Reassessment

## Verdict: Roadmap updated — S03 expanded to absorb deferred boss ship work

## Success Criterion Coverage

- Player encounters a boss captain ship while sailing and triggers a boss fight → **S03** (was supposed to be S02, deferred by re-scope)
- Boss intro shows captain name, ship, and taunt dialogue before battle → **S03** (same)
- BattleScene handles 3-fish enemy parties — when one faints, the next enters with a transition → **S01** ✅ (complete)
- Existing single-fish battles (beach enemies, wild fish) work exactly as before → **S01** ✅ (complete)
- All 3 bosses (Barnacle lv7-9, Ironhook lv10-12, Dread Corsair lv13-15) are fightable → **S03** (trigger + intro + battle flow)
- Defeating a boss grants rewards and marks them as beaten → **S03**
- Boss defeat state persists across save/load — beaten bosses don't respawn → **S03**

All criteria have at least one remaining owner. Coverage check passes.

## What Changed

S02 was re-scoped from "Boss Ships in Sailing" to "Fix Beach Bounds" (per D002). This means the boss ship trigger mechanism and intro overlay — originally S02's deliverables consumed by S03 — were never built. S03 as originally written ("Victory, Rewards & Persistence" at `risk:low`) assumed those existed.

**Changes made:**
1. **S03 expanded** from "Victory, Rewards & Persistence" to "Boss Ships, Intro & Rewards" — absorbs the sailing encounter, intro overlay, victory screen, and persistence into one slice
2. **S03 risk raised** from `low` to `medium` — it now includes SailingScene interaction work, not just post-battle bookkeeping
3. **S03 dependency simplified** from `depends:[S01,S02]` to `depends:[S01]` — S02's beach bounds work is useful but not a direct prerequisite for boss ship content
4. **Boundary map updated** — S03 now only consumes from S01, and the S01→S02 boundary was removed (S02 is complete and didn't produce boss-related artifacts)
5. **Proof strategy updated** — S01 risks marked retired, new risk added for boss trigger in sailing

## Why not split into two slices?

Considered S03 (Boss Ships + Intro) + S04 (Rewards + Persistence). Rejected because:
- Boss ship encounter → intro → battle → victory is one coherent user flow
- Splitting would create an awkward half-state where you can fight bosses but nothing happens when you win
- The sailing ship placement and approach detection are straightforward UI work, not high-risk engine changes

## Requirement Coverage

No requirement changes. M002 doesn't own any requirements from REQUIREMENTS.md — all 15 validated requirements belong to M001. The 3 deferred requirements (R014, R015, R016) remain deferred to future milestones. No new requirements surfaced by S02.
