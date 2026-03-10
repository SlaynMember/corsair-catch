import Jimp from 'jimp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'pixel-snapper-config.json'), 'utf-8'));

/**
 * Quantize image to 16-bit palette (565 RGB)
 * @param {Jimp} image - The image to quantize
 * @returns {Jimp} Quantized image
 */
function quantizeTo16Bit(image) {
  const quantized = image.clone();

  quantized.scan(0, 0, quantized.bitmap.width, quantized.bitmap.height, function(x, y, idx) {
    // Extract RGBA
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const a = this.bitmap.data[idx + 3];

    // Quantize to 5-6-5 bit (RGB565)
    const r5 = Math.round((r / 255) * 31) * 8; // 5 bits -> 8 levels
    const g6 = Math.round((g / 255) * 63) * 4; // 6 bits -> 4 levels
    const b5 = Math.round((b / 255) * 31) * 8; // 5 bits -> 8 levels

    this.bitmap.data[idx] = r5;
    this.bitmap.data[idx + 1] = g6;
    this.bitmap.data[idx + 2] = b5;
    this.bitmap.data[idx + 3] = a;
  });

  return quantized;
}

/**
 * Remove anti-aliasing by thresholding alpha channel
 * @param {Jimp} image - The image to process
 * @param {number} threshold - Alpha threshold (0-255)
 * @returns {Jimp} Image with hard alpha edges
 */
function removeAntialiasing(image, threshold = 128) {
  const processed = image.clone();

  processed.scan(0, 0, processed.bitmap.width, processed.bitmap.height, function(x, y, idx) {
    const a = this.bitmap.data[idx + 3];

    // Hard alpha: either fully opaque or fully transparent
    this.bitmap.data[idx + 3] = a >= threshold ? 255 : 0;
  });

  return processed;
}

/**
 * Snap pixel art to grid by downscaling and upscaling with nearest neighbor
 * @param {Jimp} image - The image to snap
 * @param {number} gridSize - Target grid size (e.g., 48)
 * @returns {Jimp} Grid-snapped image
 */
function snapToGrid(image, gridSize) {
  let snapped = image.clone();

  const { width, height } = snapped.bitmap;

  // Calculate scale factor to fit within grid while preserving aspect ratio
  const scale = Math.max(
    Math.round(width / gridSize),
    Math.round(height / gridSize)
  );

  if (scale > 1) {
    // Downscale to reduce detail
    const downWidth = Math.ceil(width / scale);
    const downHeight = Math.ceil(height / scale);
    snapped = snapped.resize(downWidth, downHeight, Jimp.RESIZE_NEAREST_NEIGHBOR);
  }

  // Upscale back to original size using nearest neighbor (creates crisp pixels)
  snapped = snapped.resize(width, height, Jimp.RESIZE_NEAREST_NEIGHBOR);

  return snapped;
}

/**
 * Process a single image: snap, quantize, clean up anti-aliasing
 * @param {string} inputPath - Path to input PNG
 * @param {string} outputPath - Path to output PNG
 */
export async function snapPixelArt(inputPath, outputPath) {
  try {
    // Load image
    let image = await Jimp.read(inputPath);

    // Apply processing pipeline
    if (config.snapThreshold !== undefined) {
      image = snapToGrid(image, config.gridSize);
    }

    if (config.removeAntialiasing) {
      image = removeAntialiasing(image, 200);
    }

    if (config.targetPalette === '16bit') {
      image = quantizeTo16Bit(image);
    }

    // Write output
    await image.write(outputPath);
    console.log(`✓ Snapped: ${inputPath} → ${outputPath}`);
  } catch (err) {
    console.error(`✗ Failed to snap ${inputPath}:`, err.message);
    throw err;
  }
}

/**
 * Process a batch of images
 * @param {string} inputDir - Directory containing PNG files
 * @param {string} outputDir - Directory for output PNGs
 */
export async function snapBatch(inputDir, outputDir) {
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.png'));

    if (files.length === 0) {
      console.warn(`⚠ No PNG files found in ${inputDir}`);
      return;
    }

    console.log(`Processing ${files.length} images...`);

    for (const file of files) {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file);
      await snapPixelArt(inputPath, outputPath);
    }

    console.log(`✓ Snapped ${files.length} images to ${outputDir}`);
  } catch (err) {
    console.error(`✗ Batch processing failed:`, err.message);
    throw err;
  }
}

export default {
  snapPixelArt,
  snapBatch
};
