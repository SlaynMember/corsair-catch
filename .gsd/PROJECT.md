# Corsair Catch

## What This Is

Browser-based pirate RPG — Pokémon Diamond clone set at sea. Built with Phaser 3 + TypeScript, deployed on Netlify and itch.io. Players walk beaches, fish, fight crabs/enemies in turn-based combat, catch fish for their battle crew, and sail between islands.

## Core Value

The catch-and-battle loop: encounter wild fish/enemies → turn-based Pokémon-style combat → catch fish → level up → evolve. Everything else (sailing, fishing minigame, exploration) feeds into this core loop.

## Current State

Phases 1-8 complete. M001 (Playtest Bug Fix Pass) complete — all 16 playtest bugs resolved (13 fixed, 3 deferred by design). The game is stable: 3 beach areas with clean transitions, fishing minigame with rod gate, 63 fish species with complete data, balanced starters, turn-based battle system with working TEAM/ITEMS/CATCH UI, item persistence, save/load, HUD on all beaches, TMX debug tooling, and mobile support with accurate device detection. ~14,000 lines across 8 scenes, 5 systems, 13 data files. Live at corsair-catch-demo.netlify.app and itch.io.

M002 (Boss Battles) is in progress — S01 (multi-fish battle engine + boss species) complete, S02-S03 pending.

## Architecture / Key Patterns

- **Engine:** Phaser 3 (v3.88+), Arcade Physics, gravity 0,0 (top-down)
- **Build:** Vite, TypeScript, port 3000
- **Scenes:** Boot → MainMenu → Beach/Beach2/Beach3 ↔ Battle, Sailing, PauseMenu
- **TMX collision system:** Tiled .tmx files in public/maps/, parsed by TMXLoader.ts, stored in registry
- **State:** Phaser registry for cross-scene state, localStorage for save/load
- **HUD:** HUDManager class instantiated per-scene (bag, team, volume buttons)
- **Mobile:** MobileInput.ts — floating joystick + context buttons, landscape-locked, pointer:coarse detection
- **Assets:** Hand-drawn sprites (pirate, fish, crabs), AI-generated backgrounds, PixelLab enemies
- **Deploy:** Netlify (auto-deploy from GitHub main) + itch.io (butler push)

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract.

## Milestone Sequence

- [x] M001: Playtest Bug Fix Pass — 15 requirements validated, 3 deferred (R014/R015/R016)
- [ ] M002: Boss Battles — S01 complete, S02-S03 pending
- [ ] M003: Battle Juice — queued
- [ ] M004: Sound Effects — queued
- [ ] M005: Fishing Depth — queued
- [ ] M006: Island Scenes — queued
