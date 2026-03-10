import Jimp from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates sway animation frames (oscillating side-to-side with subtle rotation)
 * @param {string} baseImagePath - Path to base image
 * @param {string} assetName - Asset name for output files
 * @param {number} frameCount - Number of frames to generate (default: 4)
 */
export async function generateSwayFrames(baseImagePath, assetName, frameCount = 4) {
  try {
    const image = await Jimp.read(baseImagePath);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    // Ensure output directory exists
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Generating ${frameCount} sway frames from ${baseImagePath}`);

    for (let i = 0; i < frameCount; i++) {
      // Create new image with padding for movement
      const padded = new Jimp(width + 8, height + 8, 0x00000000);

      // Calculate horizontal offset (sine wave: -2 to +2 pixels)
      const swayAmount = 2;
      const offsetX = Math.sin((i / frameCount) * Math.PI * 2) * swayAmount;

      // Blit original image in center with offset
      padded.blit(image, 4 + Math.round(offsetX), 4);

      // Save frame
      const outputPath = path.join(outputDir, `${assetName}_sway_frame_${String(i).padStart(3, '0')}.png`);
      await padded.write(outputPath);
      console.log(`✓ Created ${path.basename(outputPath)}`);
    }

    return { success: true, frameCount, type: 'sway' };
  } catch (error) {
    console.error(`Error generating sway frames: ${error.message}`);
    throw error;
  }
}

/**
 * Generates bob animation frames (vertical oscillation)
 * @param {string} baseImagePath - Path to base image
 * @param {string} assetName - Asset name for output files
 * @param {number} frameCount - Number of frames to generate (default: 2)
 */
export async function generateBobFrames(baseImagePath, assetName, frameCount = 2) {
  try {
    const image = await Jimp.read(baseImagePath);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    // Ensure output directory exists
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Generating ${frameCount} bob frames from ${baseImagePath}`);

    for (let i = 0; i < frameCount; i++) {
      // Create new image with padding for vertical movement
      const padded = new Jimp(width + 4, height + 4, 0x00000000);

      // Calculate vertical offset (sine wave: -2 to +2 pixels)
      const bobAmount = 2;
      const offsetY = Math.sin((i / frameCount) * Math.PI * 2) * bobAmount;

      // Blit original image in center with offset
      padded.blit(image, 2, 2 + Math.round(offsetY));

      // Save frame
      const outputPath = path.join(outputDir, `${assetName}_bob_frame_${String(i).padStart(3, '0')}.png`);
      await padded.write(outputPath);
      console.log(`✓ Created ${path.basename(outputPath)}`);
    }

    return { success: true, frameCount, type: 'bob' };
  } catch (error) {
    console.error(`Error generating bob frames: ${error.message}`);
    throw error;
  }
}

/**
 * Generates a static frame (copy of base image)
 * @param {string} baseImagePath - Path to base image
 * @param {string} assetName - Asset name for output files
 */
export async function generateStaticFrame(baseImagePath, assetName) {
  try {
    const image = await Jimp.read(baseImagePath);

    // Ensure output directory exists
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Generating static frame from ${baseImagePath}`);

    // Save as static frame
    const outputPath = path.join(outputDir, `${assetName}_static_frame_000.png`);
    await image.write(outputPath);
    console.log(`✓ Created ${path.basename(outputPath)}`);

    return { success: true, type: 'static' };
  } catch (error) {
    console.error(`Error generating static frame: ${error.message}`);
    throw error;
  }
}

/**
 * Generate all animation types for an asset
 * @param {string} baseImagePath - Path to base image
 * @param {string} assetName - Asset name for output files
 * @param {object} options - Animation options
 */
export async function generateAllFrames(baseImagePath, assetName, options = {}) {
  const {
    swayFrames = 4,
    bobFrames = 2,
    includeStatic = true
  } = options;

  const results = [];

  try {
    results.push(await generateSwayFrames(baseImagePath, assetName, swayFrames));
    results.push(await generateBobFrames(baseImagePath, assetName, bobFrames));
    if (includeStatic) {
      results.push(await generateStaticFrame(baseImagePath, assetName));
    }

    console.log(`\n✅ Generated all frames for ${assetName}`);
    return { success: true, results };
  } catch (error) {
    console.error(`Error generating all frames: ${error.message}`);
    throw error;
  }
}

// CLI support: allow running directly
if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: node generate-animation-frames.js <command> <imagePath> <assetName> [options]

Commands:
  sway <imagePath> <assetName>    Generate sway frames
  bob <imagePath> <assetName>     Generate bob frames
  static <imagePath> <assetName>  Generate static frame
  all <imagePath> <assetName>     Generate all frame types

Examples:
  node generate-animation-frames.js sway ./output/sample_0_snapped.png test_palm
  node generate-animation-frames.js all ./output/sample_0_snapped.png palm_tree
    `);
    process.exit(0);
  }

  const command = args[0];
  const imagePath = args[1];
  const assetName = args[2];

  if (!imagePath || !assetName) {
    console.error('Error: imagePath and assetName are required');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'sway':
        await generateSwayFrames(imagePath, assetName, 4);
        break;
      case 'bob':
        await generateBobFrames(imagePath, assetName, 2);
        break;
      case 'static':
        await generateStaticFrame(imagePath, assetName);
        break;
      case 'all':
        await generateAllFrames(imagePath, assetName);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    process.exit(1);
  }
}
