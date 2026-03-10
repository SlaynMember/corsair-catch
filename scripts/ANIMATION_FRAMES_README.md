# Animation Frame Generator

Procedural animation frame generation for beach asset pipeline. Converts static Stable Diffusion outputs into multi-frame animation sets using jimp.

## Overview

The animation frame generator creates three types of animation frames from base asset images:

1. **Sway Frames** (4 frames) — Horizontal oscillation (sine wave, ±2px)
2. **Bob Frames** (2 frames) — Vertical oscillation (sine wave, ±2px)
3. **Static Frame** (1 frame) — Copy of base image (no animation)

## Installation

```bash
cd scripts/
npm install  # jimp already included in package.json
```

## Usage

### Command Line

```bash
# Generate sway frames only
node generate-animation-frames.js sway <imagePath> <assetName> [frameCount]

# Generate bob frames only
node generate-animation-frames.js bob <imagePath> <assetName> [frameCount]

# Generate static frame only
node generate-animation-frames.js static <imagePath> <assetName>

# Generate all frame types
node generate-animation-frames.js all <imagePath> <assetName>
```

### Examples

```bash
# Create 4 sway frames from a snapped palm tree image
node generate-animation-frames.js sway ./output/sample_0_snapped.png palm_tree 4

# Create all animation types for a beach hut
node generate-animation-frames.js all ./output/hut_snapped.png beach_hut

# Create bob frames for floating debris
node generate-animation-frames.js bob ./output/debris_snapped.png debris 2
```

### Programmatic API

```javascript
import {
  generateSwayFrames,
  generateBobFrames,
  generateStaticFrame,
  generateAllFrames
} from './generate-animation-frames.js';

// Generate sway frames
await generateSwayFrames('./base.png', 'asset_name', 4);

// Generate bob frames
await generateBobFrames('./base.png', 'asset_name', 2);

// Generate static frame
await generateStaticFrame('./base.png', 'asset_name');

// Generate all types at once
await generateAllFrames('./base.png', 'asset_name', {
  swayFrames: 4,
  bobFrames: 2,
  includeStatic: true
});
```

## Output

All frames are saved to `scripts/output/` with naming convention:

```
{assetName}_sway_frame_000.png
{assetName}_sway_frame_001.png
{assetName}_sway_frame_002.png
{assetName}_sway_frame_003.png

{assetName}_bob_frame_000.png
{assetName}_bob_frame_001.png

{assetName}_static_frame_000.png
```

## Configuration

The `hashlips-config.json` file provides metadata about animation configurations:

```json
{
  "animationFrameConfigs": {
    "palm_sway": {
      "frameType": "sway",
      "frameCount": 4,
      "baseAsset": "palm_idle"
    }
  }
}
```

## Frame Specifications

### Sway Animation
- **Purpose**: Gentle side-to-side oscillation (wind swaying trees, grass, etc.)
- **Frames**: 4 (smooth sine wave cycle)
- **Offset**: Horizontal ±2px
- **Timing**: 4-frame cycle (typically 0.5-1.0s total duration)

### Bob Animation
- **Purpose**: Gentle vertical bobbing (floating objects, breathing)
- **Frames**: 2 (up/down cycle)
- **Offset**: Vertical ±2px
- **Timing**: 2-frame cycle (typically 1-2s total duration)

### Static Frame
- **Purpose**: Fallback for non-animated assets
- **Frames**: 1 (no animation)
- **Offset**: None
- **Timing**: Static

## Technical Details

- **Image Library**: jimp v0.16.3
- **Padding**: Added around base image to accommodate offset movement
- **Blend Mode**: All frames preserve transparency (PNG RGBA)
- **Resampling**: No resampling; pixel-perfect animation
- **Color Space**: sRGB

## Integration with Pipeline

1. **Input**: Snapped sprites from Pixel Snapper task (e.g., `output/sample_0_snapped.png`)
2. **Processing**: Frame generation creates multi-frame PNG sequences
3. **Output**: Animation frame PNGs saved to `scripts/output/`
4. **Next Step**: Frames can be imported into PixiJS AnimatedSprite for game rendering

## Testing

```bash
# Test frame generation
node generate-animation-frames.js all ./output/test_palm_base.png test_asset

# Verify output
ls -lh output/test_asset_*.png
```

## Performance Notes

- Typical generation time: <100ms per frame
- Memory overhead: ~5-10MB for typical sprite assets
- Suitable for batch generation of 100+ assets

## Error Handling

The generator includes error handling for:
- Missing input files
- Corrupted PNG files
- Insufficient disk space
- Invalid asset names

Errors are logged to console with descriptive messages.
