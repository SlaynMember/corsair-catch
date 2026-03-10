# Beach Asset Generator Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated generator for high-quality 48px 16-bit beach spawn assets using Stable Diffusion → Pixel Snapper → HashLips pipeline, then integrate into Corsair Catch.

**Architecture:**
- **Generation pipeline**: Local Stable Diffusion generates pixel art from text prompts → Sprite Fusion Pixel Snapper cleans and quantizes to 16-bit → HashLips procedurally generates animation frames.
- **Output structure**: Individual frame PNGs organized by asset type + JSON metadata for game consumption.
- **Game integration**: Asset loader reads JSON, registers sprites, plays animations via existing animation system.

**Tech Stack:**
- Node.js (generation scripts)
- Stable Diffusion (local inference via stable-diffusion.cpp or AUTOMATIC1111 WebUI)
- Sprite Fusion Pixel Snapper (post-processing)
- HashLips Art Engine (animation frame generation)
- PixiJS v8 (game rendering)

---

## Chunk 1: Setup & Infrastructure

### Task 1: Install Stable Diffusion Locally

**Files:**
- `.env` (environment variables)
- `scripts/sd-setup.md` (setup notes)

- [ ] **Step 1: Choose Stable Diffusion installation method**

Check if you have GPU (NVIDIA/AMD). For cost efficiency and local control:
- **Option A (Recommended)**: `stable-diffusion.cpp` — lightweight C/C++ binary, runs on CPU or GPU
- **Option B**: AUTOMATIC1111 WebUI — more features, heavier, but UI-based

For this plan, assume `stable-diffusion.cpp`.

Download from: https://github.com/leejet/stable-diffusion.cpp

- [ ] **Step 2: Download a quantized model**

Models are large (~2-4GB). Use a quantized version for speed:
- Download: `sd-v1-5-inpainting.gguf` or similar (quantized, pixel-art friendly)
- Place in: `scripts/models/` directory

- [ ] **Step 3: Test Stable Diffusion with a sample prompt**

```bash
cd scripts/models/
./sd-v1-5 -p "48px retro pixel art palm tree, Pokémon Diamond, chunky pixels, clear outlines" -n 1 -s 100 -t 4 -o ../output/
```

Expected output: `output/sample_0.png` (rough ~48x48 pixel art)

- [ ] **Step 4: Create `.env` with SD configuration**

```bash
# scripts/.env
SD_MODEL_PATH="./models/sd-v1-5-inpainting.gguf"
SD_STEPS=25
SD_CFG_SCALE=7.5
SD_SAMPLER="euler"
SD_THREADS=4
SD_SEED=12345
```

- [ ] **Step 5: Commit setup notes**

```bash
git add scripts/sd-setup.md .env
git commit -m "chore: add Stable Diffusion local setup notes"
```

---

### Task 2: Set Up Pixel Snapper Post-Processing

**Files:**
- Create: `scripts/pixel-snapper.js` (wrapper for Pixel Snapper)
- Create: `scripts/pixel-snapper-config.json` (snapping rules)

- [ ] **Step 1: Install Sprite Fusion Pixel Snapper via npm**

```bash
cd scripts/
npm install sprite-fusion-pixel-snapper
```

- [ ] **Step 2: Create Pixel Snapper configuration**

Create `scripts/pixel-snapper-config.json`:

```json
{
  "gridSize": 48,
  "targetPalette": "16bit",
  "colorQuantization": 256,
  "removeAntialiasing": true,
  "snapThreshold": 0.5,
  "preserveEdges": true,
  "outputFormat": "png"
}
```

- [ ] **Step 3: Write pixel-snapper.js wrapper**

Create `scripts/pixel-snapper.js`:

```javascript
import PixelSnapper from 'sprite-fusion-pixel-snapper';
import fs from 'fs';
import path from 'path';

const config = JSON.parse(fs.readFileSync('./pixel-snapper-config.json', 'utf-8'));

export async function snapPixelArt(inputPath, outputPath) {
  const snapper = new PixelSnapper(config);
  const cleaned = await snapper.process(inputPath);
  fs.writeFileSync(outputPath, cleaned);
  console.log(`✓ Snapped: ${inputPath} → ${outputPath}`);
}

export async function snapBatch(inputDir, outputDir) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.png'));
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);
    await snapPixelArt(inputPath, outputPath);
  }
  console.log(`✓ Snapped ${files.length} images`);
}
```

- [ ] **Step 4: Test with a sample image**

```bash
node -e "import('./pixel-snapper.js').then(m => m.snapPixelArt('./output/sample_0.png', './output/sample_0_snapped.png'))"
```

Expected: `output/sample_0_snapped.png` (clean, grid-snapped, 16-bit palette)

- [ ] **Step 5: Commit**

```bash
git add scripts/pixel-snapper.js scripts/pixel-snapper-config.json
git commit -m "chore: add Pixel Snapper post-processor wrapper"
```

---

### Task 3: Set Up HashLips Art Engine for Animation

**Files:**
- Create: `scripts/hashlips-config.json` (layer definitions)
- Create: `scripts/generate-animation-frames.js` (frame generation)

- [ ] **Step 1: Install HashLips Art Engine**

```bash
cd scripts/
npm install hashlips_art_engine
```

- [ ] **Step 2: Create HashLips layer configuration**

Create `scripts/hashlips-config.json`:

```json
{
  "format": {
    "width": 48,
    "height": 48,
    "smoothing": false
  },
  "layers": [
    {
      "name": "trunk",
      "weight": 100,
      "blendMode": "source-over"
    },
    {
      "name": "fronds",
      "weight": 100,
      "blendMode": "source-over"
    }
  ],
  "rarity": {},
  "growEditionCount": 1,
  "layerConfigurations": [
    {
      "growEditionCount": 1,
      "namePrefix": "palm_idle",
      "layerConfigurations": [
        { "name": "trunk", "number": 1 },
        { "name": "fronds", "number": 4 }
      ]
    }
  ]
}
```

- [ ] **Step 3: Write animation frame generator**

Create `scripts/generate-animation-frames.js`:

```javascript
import Canvas from 'canvas';
import fs from 'fs';
import path from 'path';

export async function generateSwayFrames(baseImagePath, assetName, frameCount = 4) {
  const { createCanvas, loadImage } = Canvas;
  const baseImage = await loadImage(baseImagePath);

  const canvas = createCanvas(48, 48);
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < frameCount; i++) {
    ctx.clearRect(0, 0, 48, 48);

    // Calculate sway offset (sine wave oscillation)
    const swayAmount = Math.sin((i / frameCount) * Math.PI * 2) * 2; // ±2px
    ctx.save();
    ctx.translate(24, 24);
    ctx.rotate((swayAmount / 48) * 0.05); // small rotation
    ctx.translate(-24, -24);
    ctx.drawImage(baseImage, swayAmount, 0);
    ctx.restore();

    // Save frame
    const frameFileName = `${assetName}_idle_frame_${String(i).padStart(3, '0')}.png`;
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(frameFileName, buffer);
    console.log(`✓ Generated frame: ${frameFileName}`);
  }
}

export async function generateBobFrames(baseImagePath, assetName, frameCount = 2) {
  const { createCanvas, loadImage } = Canvas;
  const baseImage = await loadImage(baseImagePath);

  const canvas = createCanvas(48, 48);
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < frameCount; i++) {
    ctx.clearRect(0, 0, 48, 48);

    // Calculate bob offset (sine wave up/down)
    const bobAmount = Math.sin((i / frameCount) * Math.PI * 2) * 2; // ±2px vertical
    ctx.drawImage(baseImage, 0, bobAmount);

    // Save frame
    const frameFileName = `${assetName}_bob_frame_${String(i).padStart(3, '0')}.png`;
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(frameFileName, buffer);
    console.log(`✓ Generated frame: ${frameFileName}`);
  }
}

export async function generateStaticFrame(baseImagePath, assetName) {
  const { createCanvas, loadImage } = Canvas;
  const baseImage = await loadImage(baseImagePath);

  const canvas = createCanvas(48, 48);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(baseImage, 0, 0);

  const frameFileName = `${assetName}_static.png`;
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(frameFileName, buffer);
  console.log(`✓ Generated static frame: ${frameFileName}`);
}
```

- [ ] **Step 4: Test frame generation**

```bash
node -e "
import('./generate-animation-frames.js').then(m =>
  m.generateSwayFrames('./output/sample_0_snapped.png', 'test_palm', 4)
)
"
```

Expected: 4 PNG files in current directory named `test_palm_idle_frame_*.png`

- [ ] **Step 5: Commit**

```bash
git add scripts/hashlips-config.json scripts/generate-animation-frames.js
git commit -m "chore: add HashLips animation frame generator"
```

---

## Chunk 2: Asset Generation Pipeline

### Task 4: Create Master Asset Generation Script

**Files:**
- Create: `scripts/sd-prompts.json` (asset descriptions)
- Create: `scripts/generate-beach-assets.js` (orchestrator)

- [ ] **Step 1: Define asset prompts**

Create `scripts/sd-prompts.json`:

```json
{
  "assets": [
    {
      "id": "palm",
      "name": "Palm Tree",
      "type": "vegetation",
      "animation": "sway",
      "frameCount": 4,
      "prompt": "48px retro Pokémon Diamond palm tree, chunky pixels, clear outlines, tropical beach, pixelated fronds, brown trunk"
    },
    {
      "id": "grass-tuft",
      "name": "Grass Tuft",
      "type": "vegetation",
      "animation": "sway",
      "frameCount": 4,
      "prompt": "48px retro Pokémon Diamond grass tuft, chunky pixels, green blades, beach grass, pixelated, swaying"
    },
    {
      "id": "dock-post-wood",
      "name": "Wooden Dock Post",
      "type": "structure",
      "animation": "static",
      "frameCount": 1,
      "prompt": "48px retro Pokémon Diamond wooden dock post, chunky pixels, brown wood, clear outlines, weathered"
    },
    {
      "id": "dock-post-stone",
      "name": "Stone Dock Post",
      "type": "structure",
      "animation": "static",
      "frameCount": 1,
      "prompt": "48px retro Pokémon Diamond stone dock post, chunky pixels, gray stone, clear outlines, solid"
    },
    {
      "id": "shell-conch",
      "name": "Conch Shell",
      "type": "decoration",
      "animation": "bob",
      "frameCount": 2,
      "prompt": "48px retro Pokémon Diamond conch shell, chunky pixels, spiral shell, beige and tan, beach decoration"
    },
    {
      "id": "shell-scallop",
      "name": "Scallop Shell",
      "type": "decoration",
      "animation": "bob",
      "frameCount": 2,
      "prompt": "48px retro Pokémon Diamond scallop shell, chunky pixels, ridged shell, orange and white, beach"
    },
    {
      "id": "seaweed",
      "name": "Seaweed",
      "type": "decoration",
      "animation": "bob",
      "frameCount": 2,
      "prompt": "48px retro Pokémon Diamond seaweed, chunky pixels, green tendrils, ocean plant, pixelated"
    },
    {
      "id": "rock-smooth",
      "name": "Smooth Rock",
      "type": "obstacle",
      "animation": "static",
      "frameCount": 1,
      "prompt": "48px retro Pokémon Diamond smooth rock, chunky pixels, gray stone, rounded, beach"
    },
    {
      "id": "rock-jagged",
      "name": "Jagged Rock",
      "type": "obstacle",
      "animation": "static",
      "frameCount": 1,
      "prompt": "48px retro Pokémon Diamond jagged rock, chunky pixels, dark gray stone, sharp edges, beach"
    }
  ]
}
```

- [ ] **Step 2: Write main generation orchestrator**

Create `scripts/generate-beach-assets.js`:

```javascript
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { snapBatch } from './pixel-snapper.js';
import { generateSwayFrames, generateBobFrames, generateStaticFrame } from './generate-animation-frames.js';

const execAsync = promisify(exec);
const prompts = JSON.parse(fs.readFileSync('./sd-prompts.json', 'utf-8'));

const OUTPUT_DIR = '../public/sprites/beach';
const SD_OUTPUT_DIR = './output/sd-raw';
const SD_SNAPPED_DIR = './output/sd-snapped';

async function generateAssetsFromSD() {
  console.log('🎨 Generating assets with Stable Diffusion...');

  if (!fs.existsSync(SD_OUTPUT_DIR)) fs.mkdirSync(SD_OUTPUT_DIR, { recursive: true });

  for (const asset of prompts.assets) {
    console.log(`\n→ Generating: ${asset.name}`);

    const outputFile = path.join(SD_OUTPUT_DIR, `${asset.id}.png`);

    // Run Stable Diffusion
    const command = `./models/sd-v1-5 -p "${asset.prompt}" -n 1 -s 50 -t 4 -o ${SD_OUTPUT_DIR}/`;
    try {
      await execAsync(command);
      console.log(`  ✓ Generated: ${asset.id}.png`);
    } catch (err) {
      console.error(`  ✗ Failed to generate ${asset.id}: ${err.message}`);
    }
  }
}

async function snapAllAssets() {
  console.log('\n🔧 Snapping assets to grid & 16-bit palette...');
  await snapBatch(SD_OUTPUT_DIR, SD_SNAPPED_DIR);
}

async function generateAnimationFrames() {
  console.log('\n✨ Generating animation frames...');

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const asset of prompts.assets) {
    const snappedPath = path.join(SD_SNAPPED_DIR, `${asset.id}.png`);

    if (!fs.existsSync(snappedPath)) {
      console.warn(`  ⚠ Missing snapped asset: ${asset.id}.png (skipping)`);
      continue;
    }

    console.log(`\n→ ${asset.name} (${asset.animation})`);

    switch (asset.animation) {
      case 'sway':
        await generateSwayFrames(snappedPath, `${OUTPUT_DIR}/${asset.id}`, asset.frameCount);
        break;
      case 'bob':
        await generateBobFrames(snappedPath, `${OUTPUT_DIR}/${asset.id}`, asset.frameCount);
        break;
      case 'static':
        await generateStaticFrame(snappedPath, `${OUTPUT_DIR}/${asset.id}`);
        break;
    }
  }
}

async function main() {
  try {
    console.log('🏖️  Beach Asset Generator\n');

    await generateAssetsFromSD();
    await snapAllAssets();
    await generateAnimationFrames();

    console.log('\n✅ All assets generated!\n');
  } catch (err) {
    console.error('❌ Generation failed:', err);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 3: Test generation pipeline (dry run)**

```bash
cd scripts/
node generate-beach-assets.js
```

Expected: Assets in `public/sprites/beach/` with frames named `palm_idle_frame_000.png`, etc.

- [ ] **Step 4: Verify output structure**

```bash
ls -la ../public/sprites/beach/ | head -20
```

Expected: ~40 PNG files (9 assets × ~4-5 frames average)

- [ ] **Step 5: Commit**

```bash
git add scripts/sd-prompts.json scripts/generate-beach-assets.js
git commit -m "feat: add master beach asset generation script"
```

---

## Chunk 3: JSON Metadata & Game Integration

### Task 5: Create Beach Assets Metadata

**Files:**
- Create: `src/assets/beach/beach-assets.json` (metadata manifest)

- [ ] **Step 1: Generate beach-assets.json programmatically**

Create a script to scan the generated files and build metadata. Add to `scripts/generate-beach-assets.js`:

```javascript
async function generateMetadata() {
  console.log('\n📋 Generating beach-assets.json...');

  const assets = [];

  for (const assetDef of prompts.assets) {
    const frames = [];

    // Find all frame files for this asset
    const pattern = new RegExp(`^${assetDef.id}_`);
    const allFiles = fs.readdirSync(OUTPUT_DIR);
    const assetFiles = allFiles.filter(f => pattern.test(f) && f.endsWith('.png'));

    assetFiles.sort(); // Ensure frame_000, frame_001, etc. order

    for (const file of assetFiles) {
      frames.push(file);
    }

    assets.push({
      id: assetDef.id,
      name: assetDef.name,
      type: assetDef.type,
      animation: assetDef.animation,
      frames: frames.length,
      frameTime: assetDef.animation === 'sway' ? 0.125 : (assetDef.animation === 'bob' ? 0.15 : 0),
      looping: true,
      width: 48,
      height: 48,
      frameFiles: frames
    });
  }

  const metadata = { assets };
  const metadataPath = path.join(OUTPUT_DIR, 'beach-assets.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  console.log(`  ✓ Metadata: ${metadataPath}`);
  console.log(`  ✓ ${assets.length} assets registered`);
}
```

- [ ] **Step 2: Call metadata generation at end of main()**

Update `generate-beach-assets.js` main():

```javascript
async function main() {
  try {
    console.log('🏖️  Beach Asset Generator\n');

    await generateAssetsFromSD();
    await snapAllAssets();
    await generateAnimationFrames();
    await generateMetadata();  // Add this line

    console.log('\n✅ All assets generated!\n');
  } catch (err) {
    console.error('❌ Generation failed:', err);
    process.exit(1);
  }
}
```

- [ ] **Step 3: Run full generation pipeline**

```bash
node generate-beach-assets.js
```

Expected: `public/sprites/beach/beach-assets.json` with all 9 assets listed

- [ ] **Step 4: Verify metadata structure**

```bash
cat ../public/sprites/beach/beach-assets.json | head -50
```

Expected: Valid JSON with asset definitions

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-beach-assets.js
git commit -m "feat: add metadata generation to asset pipeline"
```

---

### Task 6: Write Asset Loader (with TDD)

**Files:**
- Create: `src/systems/AssetLoader.ts` (asset loader)
- Create: `src/systems/__tests__/AssetLoader.test.ts` (tests)

- [ ] **Step 1: Write failing test for asset loading**

Create `src/systems/__tests__/AssetLoader.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { AssetLoader } from '../AssetLoader';

describe('AssetLoader', () => {
  let loader: AssetLoader;

  beforeEach(() => {
    loader = new AssetLoader();
  });

  it('should load beach assets metadata', async () => {
    const metadata = await loader.loadMetadata('beach');
    expect(metadata).toBeDefined();
    expect(metadata.assets).toBeInstanceOf(Array);
    expect(metadata.assets.length).toBeGreaterThan(0);
  });

  it('should have palm asset with 4 frames', async () => {
    const metadata = await loader.loadMetadata('beach');
    const palm = metadata.assets.find((a: any) => a.id === 'palm');
    expect(palm).toBeDefined();
    expect(palm.frames).toBe(4);
    expect(palm.animation).toBe('sway');
  });

  it('should register assets in sprite cache', async () => {
    await loader.loadAndRegister('beach');
    expect(loader.getAsset('palm')).toBeDefined();
    expect(loader.getAsset('dock-post-wood')).toBeDefined();
  });

  it('should have correct frame file paths', async () => {
    await loader.loadAndRegister('beach');
    const palm = loader.getAsset('palm');
    expect(palm.frameFiles).toContain('palm_idle_frame_000.png');
    expect(palm.frameFiles.length).toBe(4);
  });

  it('should return frame time for animated assets', async () => {
    await loader.loadAndRegister('beach');
    const palm = loader.getAsset('palm');
    expect(palm.frameTime).toBe(0.125);

    const rock = loader.getAsset('rock-smooth');
    expect(rock.frameTime).toBe(0); // static
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/systems/__tests__/AssetLoader.test.ts
```

Expected: FAIL (AssetLoader class doesn't exist)

- [ ] **Step 3: Implement AssetLoader**

Create `src/systems/AssetLoader.ts`:

```typescript
export interface AssetDefinition {
  id: string;
  name: string;
  type: string;
  animation: string;
  frames: number;
  frameTime: number;
  looping: boolean;
  width: number;
  height: number;
  frameFiles: string[];
}

export interface AssetMetadata {
  assets: AssetDefinition[];
}

export class AssetLoader {
  private assetCache: Map<string, AssetDefinition> = new Map();

  async loadMetadata(assetSet: string): Promise<AssetMetadata> {
    const response = await fetch(`/sprites/${assetSet}/beach-assets.json`);
    if (!response.ok) {
      throw new Error(`Failed to load asset metadata: ${response.statusText}`);
    }
    return response.json();
  }

  async loadAndRegister(assetSet: string): Promise<void> {
    const metadata = await this.loadMetadata(assetSet);

    for (const asset of metadata.assets) {
      this.assetCache.set(asset.id, asset);
    }
  }

  getAsset(assetId: string): AssetDefinition | undefined {
    return this.assetCache.get(assetId);
  }

  getAllAssets(): AssetDefinition[] {
    return Array.from(this.assetCache.values());
  }

  getAssetsByType(type: string): AssetDefinition[] {
    return Array.from(this.assetCache.values()).filter(a => a.type === type);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/systems/__tests__/AssetLoader.test.ts
```

Expected: PASS (all 5 tests pass)

- [ ] **Step 5: Commit**

```bash
git add src/systems/AssetLoader.ts src/systems/__tests__/AssetLoader.test.ts
git commit -m "feat: add AssetLoader with metadata parsing"
```

---

### Task 7: Integrate Asset Loader into Sprite System

**Files:**
- Modify: `src/rendering/PixiContext.ts` (initialize AssetLoader)
- Modify: `src/states/SailingState.ts` or beach spawn location (use assets)

- [ ] **Step 1: Add AssetLoader initialization to PixiContext**

Read `src/rendering/PixiContext.ts`:

```bash
head -50 src/rendering/PixiContext.ts
```

Then modify to load beach assets on initialization:

```typescript
import { AssetLoader } from '../systems/AssetLoader';

export class PixiContext {
  // ... existing code ...

  private assetLoader: AssetLoader;

  constructor() {
    // ... existing code ...
    this.assetLoader = new AssetLoader();
    this.initializeAssets();
  }

  private async initializeAssets(): Promise<void> {
    try {
      await this.assetLoader.loadAndRegister('beach');
      console.log('✓ Beach assets loaded');
    } catch (err) {
      console.error('Failed to load beach assets:', err);
    }
  }

  getAssetLoader(): AssetLoader {
    return this.assetLoader;
  }
}
```

- [ ] **Step 2: Create beach spawn scene component**

Create `src/world/BeachScene.ts`:

```typescript
import { Container, Sprite } from 'pixi.js';
import { AssetLoader, AssetDefinition } from '../systems/AssetLoader';

export class BeachScene extends Container {
  private assetLoader: AssetLoader;
  private scenery: Map<string, Sprite> = new Map();

  constructor(assetLoader: AssetLoader) {
    super();
    this.assetLoader = assetLoader;
  }

  init(): void {
    // Place palm trees
    this.placeAsset('palm', 100, 200);
    this.placeAsset('palm', 300, 150);

    // Place grass tufts
    this.placeAsset('grass-tuft', 150, 250);
    this.placeAsset('grass-tuft', 250, 280);

    // Place dock posts
    this.placeAsset('dock-post-wood', 400, 300);
    this.placeAsset('dock-post-stone', 450, 300);

    // Place shells and seaweed
    this.placeAsset('shell-conch', 120, 320);
    this.placeAsset('seaweed', 200, 330);

    // Place rocks
    this.placeAsset('rock-smooth', 350, 320);
    this.placeAsset('rock-jagged', 380, 320);
  }

  private placeAsset(assetId: string, x: number, y: number): void {
    const assetDef = this.assetLoader.getAsset(assetId);
    if (!assetDef) {
      console.warn(`Asset not found: ${assetId}`);
      return;
    }

    // Use first frame for display
    const firstFramePath = `/sprites/beach/${assetDef.frameFiles[0]}`;
    const sprite = Sprite.from(firstFramePath);
    sprite.position.set(x, y);
    sprite.anchor.set(0.5, 0.5); // Center on position

    this.addChild(sprite);
    this.scenery.set(`${assetId}_${this.scenery.size}`, sprite);
  }

  update(delta: number): void {
    // Animation updates handled by AnimationSystem
  }

  dispose(): void {
    this.removeChildren();
    this.scenery.clear();
  }
}
```

- [ ] **Step 3: Write test for BeachScene**

Create `src/world/__tests__/BeachScene.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { BeachScene } from '../BeachScene';
import { AssetLoader } from '../../systems/AssetLoader';

describe('BeachScene', () => {
  it('should create beach scene with assets', async () => {
    const loader = new AssetLoader();
    await loader.loadAndRegister('beach');

    const scene = new BeachScene(loader);
    scene.init();

    expect(scene.children.length).toBeGreaterThan(0);
  });

  it('should have palm trees', async () => {
    const loader = new AssetLoader();
    await loader.loadAndRegister('beach');

    const scene = new BeachScene(loader);
    scene.init();

    // BeachScene should have placed at least 2 palms
    expect(scene.children.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 4: Run BeachScene tests**

```bash
npm test -- src/world/__tests__/BeachScene.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/world/BeachScene.ts src/world/__tests__/BeachScene.test.ts
git commit -m "feat: add BeachScene with asset placement"
```

---

## Chunk 4: Integration & Validation

### Task 8: Wire BeachScene into Game States

**Files:**
- Modify: `src/states/MainMenuState.ts` or appropriate spawn location (use BeachScene)

- [ ] **Step 1: Identify where beach spawn is rendered**

Search for existing beach references:

```bash
grep -r "beach" src/states/ --include="*.ts"
```

Expected: Find reference to beach spawn or MainMenuState

- [ ] **Step 2: Update spawn state to use BeachScene**

Modify the appropriate state file (likely `src/states/MainMenuState.ts` or create new `src/states/BeachSpawnState.ts`):

```typescript
import { BeachScene } from '../world/BeachScene';

export class BeachSpawnState extends State {
  private beachScene!: BeachScene;

  async onEnter(): Promise<void> {
    const pixiContext = this.getPixiContext();
    const assetLoader = pixiContext.getAssetLoader();

    this.beachScene = new BeachScene(assetLoader);
    this.beachScene.init();

    // Add to world layer
    pixiContext.getWorldLayer().addChild(this.beachScene);
  }

  update(delta: number): void {
    this.beachScene.update(delta);
  }

  onExit(): void {
    this.beachScene.dispose();
  }
}
```

- [ ] **Step 3: Test integration in dev server**

```bash
npm run dev
```

Navigate to beach spawn and verify:
- ✓ Assets render without errors
- ✓ Palm trees appear at expected positions
- ✓ Shells, rocks, dock posts visible
- ✓ No console errors about missing sprites

- [ ] **Step 4: Verify asset file paths are correct**

Check browser DevTools Network tab:
- All `/sprites/beach/*.png` requests return 200 (loaded)
- beach-assets.json loads successfully

- [ ] **Step 5: Commit**

```bash
git add src/states/BeachSpawnState.ts
git commit -m "feat: integrate BeachScene into game spawn state"
```

---

### Task 9: Implement Animation System Integration

**Files:**
- Modify: `src/systems/AnimationSystem.ts` (existing animation system)
- Create: `src/systems/AssetAnimationPlayer.ts` (asset-specific animation logic)

- [ ] **Step 1: Write animation player test**

Create `src/systems/__tests__/AssetAnimationPlayer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { AssetAnimationPlayer } from '../AssetAnimationPlayer';
import { AssetLoader } from '../AssetLoader';

describe('AssetAnimationPlayer', () => {
  it('should play animation frames for sway asset', async () => {
    const loader = new AssetLoader();
    await loader.loadAndRegister('beach');

    const player = new AssetAnimationPlayer(loader);
    const frames = player.getFrameSequence('palm');

    expect(frames).toContain('palm_idle_frame_000.png');
    expect(frames.length).toBe(4);
  });

  it('should return single frame for static asset', async () => {
    const loader = new AssetLoader();
    await loader.loadAndRegister('beach');

    const player = new AssetAnimationPlayer(loader);
    const frames = player.getFrameSequence('rock-smooth');

    expect(frames.length).toBe(1);
    expect(frames[0]).toBe('rock-smooth_static.png');
  });

  it('should calculate correct frame time', async () => {
    const loader = new AssetLoader();
    await loader.loadAndRegister('beach');

    const player = new AssetAnimationPlayer(loader);
    const frameTime = player.getFrameTime('palm');

    expect(frameTime).toBe(0.125); // For sway animation
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/systems/__tests__/AssetAnimationPlayer.test.ts
```

Expected: FAIL (class doesn't exist)

- [ ] **Step 3: Implement AssetAnimationPlayer**

Create `src/systems/AssetAnimationPlayer.ts`:

```typescript
import { AssetLoader } from './AssetLoader';

export class AssetAnimationPlayer {
  constructor(private assetLoader: AssetLoader) {}

  getFrameSequence(assetId: string): string[] {
    const asset = this.assetLoader.getAsset(assetId);
    if (!asset) return [];

    return asset.frameFiles.map(f => `/sprites/beach/${f}`);
  }

  getFrameTime(assetId: string): number {
    const asset = this.assetLoader.getAsset(assetId);
    return asset?.frameTime ?? 0;
  }

  isLooping(assetId: string): boolean {
    const asset = this.assetLoader.getAsset(assetId);
    return asset?.looping ?? false;
  }

  getAssetDimensions(assetId: string): { width: number; height: number } {
    const asset = this.assetLoader.getAsset(assetId);
    return {
      width: asset?.width ?? 0,
      height: asset?.height ?? 0,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/systems/__tests__/AssetAnimationPlayer.test.ts
```

Expected: PASS

- [ ] **Step 5: Update BeachScene to use animations**

Modify `src/world/BeachScene.ts`:

```typescript
import { AssetAnimationPlayer } from '../systems/AssetAnimationPlayer';
import { AnimatedSprite } from 'pixi.js';

export class BeachScene extends Container {
  private assetLoader: AssetLoader;
  private animationPlayer: AssetAnimationPlayer;
  private animatedSprites: Map<string, AnimatedSprite> = new Map();

  constructor(assetLoader: AssetLoader) {
    super();
    this.assetLoader = assetLoader;
    this.animationPlayer = new AssetAnimationPlayer(assetLoader);
  }

  private placeAsset(assetId: string, x: number, y: number): void {
    const assetDef = this.assetLoader.getAsset(assetId);
    if (!assetDef) return;

    const frames = this.animationPlayer.getFrameSequence(assetId);
    const sprite = AnimatedSprite.fromFrames(frames);

    sprite.position.set(x, y);
    sprite.anchor.set(0.5, 0.5);

    // Set animation timing
    if (assetDef.animation !== 'static') {
      sprite.animationSpeed = this.animationPlayer.getFrameTime(assetId);
      sprite.play();
    }

    this.addChild(sprite);
    this.animatedSprites.set(`${assetId}_${this.animatedSprites.size}`, sprite);
  }

  update(delta: number): void {
    for (const sprite of this.animatedSprites.values()) {
      sprite.update(delta);
    }
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/systems/AssetAnimationPlayer.ts src/systems/__tests__/AssetAnimationPlayer.test.ts src/world/BeachScene.ts
git commit -m "feat: add asset animation player and integrate into beach scene"
```

---

### Task 10: Validation & Polish

**Files:**
- No new files, validation only

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests pass (41 existing + new asset loader tests)

- [ ] **Step 2: Build production bundle**

```bash
npm run build
```

Expected: No errors, `dist/` folder generated

- [ ] **Step 3: Verify asset paths in dist build**

```bash
ls -la dist/sprites/beach/ | head -20
```

Expected: All PNG and JSON files copied to dist

- [ ] **Step 4: Test in dev server**

```bash
npm run dev
```

Verify in browser:
- ✓ Beach spawn loads without errors
- ✓ All assets render correctly
- ✓ Animations loop smoothly (palms sway, shells bob)
- ✓ No console errors
- ✓ Network tab shows all assets loaded (200 status)

- [ ] **Step 5: Screenshot validation**

Open browser dev tools → Console:
```javascript
// Check that all beach assets are loaded
console.log('Beach assets:', window.__assetLoader?.getAllAssets?.());
```

Expected: 9 assets listed in console

- [ ] **Step 6: Performance check**

DevTools → Performance:
- FPS should remain 60+ while beach scene is rendered
- No memory leaks (check heap growth over 10 seconds)

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "test: validate beach asset generator integration (all tests passing)"
```

- [ ] **Step 8: Update CLAUDE.md**

Update `CLAUDE.md` with new asset system info:

```markdown
## Asset Generation (Beach)

**Pipeline:** Stable Diffusion → Pixel Snapper → HashLips → beach-assets.json
**Scripts:** `scripts/generate-beach-assets.js` orchestrates full pipeline
**Output:** `public/sprites/beach/` (PNGs) + `public/sprites/beach/beach-assets.json` (metadata)
**Integration:** AssetLoader + AssetAnimationPlayer + BeachScene
**Animations:** Palms/grass sway (4 frames), shells/seaweed bob (2 frames), rocks/posts static
```

- [ ] **Step 9: Final commit with documentation update**

```bash
git add CLAUDE.md
git commit -m "docs: add beach asset generation system documentation"
```

---

## Summary

**What you've built:**
1. ✅ Local Stable Diffusion setup (cost-efficient, no subscriptions)
2. ✅ Post-processing pipeline (Pixel Snapper for 16-bit quantization)
3. ✅ Animation frame generation (HashLips procedural animation)
4. ✅ Metadata system (beach-assets.json with timing, frame counts, paths)
5. ✅ Game integration (AssetLoader, AssetAnimationPlayer, BeachScene)
6. ✅ TDD approach (tests written first, all passing)
7. ✅ Production-ready (build tested, performance validated)

**Commits made:**
- Stable Diffusion setup notes
- Pixel Snapper configuration
- HashLips animation generator
- Master generation script + metadata
- AssetLoader with tests
- BeachScene with asset placement
- AssetAnimationPlayer with tests
- Integration into game states
- Final validation and docs

**Next steps (future improvements):**
- Expand to additional biomes (coral reef, volcanic island, etc.)
- Add color variant generation (different dock wood types, shell colors)
- Create admin UI for asset preview/reordering
- Integrate with Figma asset library for future updates

