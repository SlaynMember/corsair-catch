# Beach Asset Generator — Design Spec

**Date**: 2026-03-10
**Project**: Corsair Catch
**Approach**: AI-First + Snapper (Stable Diffusion → Pixel Snapper → HashLips)

## Overview

Build an automated generator for high-quality 48px 16-bit beach spawn assets. Pipeline:
1. Stable Diffusion (local) generates pixel art from text prompts
2. Sprite Fusion Pixel Snapper cleans output (grid-snaps, 16-bit quantization)
3. HashLips procedural system generates animation frames
4. Output individual PNGs + JSON metadata for game integration

## Target Aesthetic

Match existing pirate character sprites: chunky 48px retro pixel art, clear outlines, vibrant colors, Pokémon Diamond era (Gen 4). Reference: `public/sprites/pirate/idle/`.

## Asset Inventory (V1)

| Asset | Type | Animation | Frames | Cycle Time |
|-------|------|-----------|--------|------------|
| Palm tree | vegetation | idle sway | 4 | 0.5s |
| Grass tuft | vegetation | idle sway | 4 | 0.5s |
| Dock post (wood) | structure | static | 1 | — |
| Dock post (stone) | structure | static | 1 | — |
| Shell (conch) | decoration | water bob | 2 | 0.3s |
| Shell (scallop) | decoration | water bob | 2 | 0.3s |
| Seaweed | decoration | water bob | 2 | 0.3s |
| Rock (smooth) | obstacle | static | 1 | — |
| Rock (jagged) | obstacle | static | 1 | — |

**Total**: 9 assets, ~20 individual frame files

## Generation Pipeline

### Phase 1: Prompt → SD Output
```
Input: "48px retro Pokémon Diamond palm tree, chunky pixels, clear outlines, tropical beach"
Tool: Stable Diffusion (local, stable-diffusion.cpp or AUTOMATIC1111 WebUI)
Output: 3 variations (PNG, rough pixel art, ~48x48)
```

### Phase 2: Cleanup (Pixel Snapper)
```
Input: SD-generated PNGs
Tool: Sprite Fusion Pixel Snapper
- Snap to perfect 48px grid
- Quantize to 16-bit color palette (#RRGGBB, max 65,536 colors)
- Remove anti-aliasing artifacts
Output: Clean PNGs ready for game
```

### Phase 3: Animation Generation (HashLips)
```
Input: Cleaned base sprites + animation rules
Tool: HashLips Art Engine (procedural layer composition)
- Generate idle frames: sway/bob motion
- Create frame sequences (palm: 4 frames, shell: 2 frames)
- Assign timing metadata
Output: Individual PNGs + frame timing data
```

## Output Structure

```
src/assets/beach/
├── palm_idle_frame_000.png
├── palm_idle_frame_001.png
├── palm_idle_frame_002.png
├── palm_idle_frame_003.png
├── grass-tuft_idle_frame_000.png
├── grass-tuft_idle_frame_001.png
├── grass-tuft_idle_frame_002.png
├── grass-tuft_idle_frame_003.png
├── dock-post-wood_static.png
├── dock-post-stone_static.png
├── shell-conch_bob_frame_000.png
├── shell-conch_bob_frame_001.png
├── shell-scallop_bob_frame_000.png
├── shell-scallop_bob_frame_001.png
├── seaweed_bob_frame_000.png
├── seaweed_bob_frame_001.png
├── rock-smooth_static.png
├── rock-jagged_static.png
└── beach-assets.json
```

### beach-assets.json Structure
```json
{
  "assets": [
    {
      "id": "palm",
      "name": "Palm Tree",
      "type": "vegetation",
      "animation": "idle",
      "frames": 4,
      "frameTime": 0.125,
      "looping": true,
      "width": 48,
      "height": 48,
      "frameFiles": ["palm_idle_frame_000.png", ...]
    },
    {
      "id": "dock-post-wood",
      "name": "Wooden Dock Post",
      "type": "structure",
      "animation": "static",
      "frames": 1,
      "width": 48,
      "height": 48,
      "frameFiles": ["dock-post-wood_static.png"]
    }
  ]
}
```

## Integration with Corsair Catch

1. **Asset Loader**: Load `beach-assets.json` on game start
2. **Sprite Registry**: Register each asset by `id` in existing sprite system
3. **Animation System**: Use existing animation player with timing from JSON
4. **Placement**: Add assets to beach spawn scene via map data structure (not procedural, manual placement)
5. **Folder Structure**: Matches existing `public/sprites/pirate/` pattern → easy to extend

## Success Criteria

- [ ] All assets visually match pirate character aesthetic (chunky, clear outlines, vibrant)
- [ ] 16-bit color palette consistent across all assets
- [ ] Animation loops smooth (no frame jitter or pop)
- [ ] Generation time <5 minutes per asset from prompt to final PNG
- [ ] JSON metadata correctly specifies frame timing and file references
- [ ] Assets integrate into game without code changes (only JSON config)
- [ ] Beach spawn scene uses these assets and feels "complete" compared to reference art

## Tools & Dependencies

- **Stable Diffusion**: `stable-diffusion.cpp` (C/C++ lightweight, or AUTOMATIC1111 WebUI for ease)
- **Sprite Fusion Pixel Snapper**: Post-process SD output
- **HashLips Art Engine**: Procedural animation frame generation
- **ImageMagick or Node canvas**: Batch image operations (optional, if needed)

## Notes

- If Stable Diffusion output quality is low, fall back to manual pixel-pushing for 1-2 hero assets, then use as templates for variations
- 16-bit palette should match existing game colors (warm beach tones, deep water blues)
- Beach spawn is minimum viable (9 assets), can expand later with additional biomes

