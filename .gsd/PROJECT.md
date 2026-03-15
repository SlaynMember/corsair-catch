# Corsair Catch

## What This Is

Browser-based pirate RPG — Pokémon Diamond clone set at sea. Built with Phaser 3 + TypeScript, deployed on Netlify and itch.io. Players walk beaches, fish, fight crabs/enemies in turn-based combat, catch fish for their battle crew, and sail between islands.

## Core Value

The catch-and-battle loop: encounter wild fish/enemies → turn-based Pokémon-style combat → catch fish → level up → evolve. Everything else (sailing, fishing minigame, exploration) feeds into this core loop.

## Current State

Phases 1-8 complete. The game is playable end-to-end: 3 beach areas with transitions, fishing minigame, 62 fish species, turn-based battle system with XP/evolution, sailing to 5 islands, ship selection, save/load, mobile support. ~14,000 lines across 8 scenes, 5 systems, 13 data files. Live at corsair-catch-demo.netlify.app and itch.io.

Post-playtest: 16 bugs filed (4 blockers, 6 high, 4 medium, 2 low) covering collision bounds, transition loops, battle UI gaps, data integrity holes, and missing persistence.

## Architecture / Key Patterns

- **Engine:** Phaser 3 (v3.88+), Arcade Physics, gravity 0,0 (top-down)
- **Build:** Vite, TypeScript, port 3000
- **Scenes:** Boot → MainMenu → Beach/Beach2/Beach3 ↔ Battle, Sailing, PauseMenu
- **TMX collision system:** Tiled .tmx files in public/maps/, parsed by TMXLoader.ts, stored in registry
- **State:** Phaser registry for cross-scene state, localStorage for save/load
- **Mobile:** MobileInput.ts — floating joystick + context buttons, landscape-locked
- **Assets:** Hand-drawn sprites (pirate, fish, crabs), AI-generated backgrounds, PixelLab enemies
- **Deploy:** Netlify (auto-deploy from GitHub main) + itch.io (butler push)

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract.

## Milestone Sequence

- [ ] M001: Playtest Bug Fix Pass — Fix all 16 playtest bugs, from blockers through polish
