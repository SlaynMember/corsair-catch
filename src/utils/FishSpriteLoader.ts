/**
 * Fish Sprite Loader
 * Extracts individual fish sprites from grid images (1.png, 2.png, 3.png)
 * Each grid is 4 columns × 5 rows (20 fish per grid)
 */

const GRID_COLS = 4;
const GRID_ROWS = 5;

// Grid dimensions (measured from actual images)
const GRID_DIMENSIONS = {
  1: { width: 500, height: 625 }, // 1.png approximate dimensions
  2: { width: 500, height: 625 }, // 2.png approximate dimensions
  3: { width: 500, height: 625 }, // 3.png approximate dimensions
};

/**
 * Get sprite coordinates for a fish in the grid
 * @param spriteIndex Position in 4x5 grid (0-19)
 * @returns {row, col} within the grid
 */
export function getGridPosition(spriteIndex: number): { row: number; col: number } {
  return {
    row: Math.floor(spriteIndex / GRID_COLS),
    col: spriteIndex % GRID_COLS,
  };
}

/**
 * Create a data URL for a cropped fish sprite
 * Uses canvas to extract from the grid image on-the-fly
 * @param gridNumber Which grid image (1, 2, or 3)
 * @param spriteIndex Position in grid (0-19)
 * @returns Promise<string> Data URL of the cropped sprite
 */
export async function getFishSpriteDataUrl(
  gridNumber: 1 | 2 | 3,
  spriteIndex: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const gridPath = `/sprite_unedited/${gridNumber}.png`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const { row, col } = getGridPosition(spriteIndex);
        const spriteWidth = img.width / GRID_COLS;
        const spriteHeight = img.height / GRID_ROWS;

        const canvas = document.createElement('canvas');
        canvas.width = spriteWidth;
        canvas.height = spriteHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D context');

        ctx.drawImage(
          img,
          col * spriteWidth,
          row * spriteHeight,
          spriteWidth,
          spriteHeight,
          0,
          0,
          spriteWidth,
          spriteHeight
        );

        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load grid image: ${gridPath}`));
    img.src = gridPath;
  });
}

/**
 * Create an <img> tag for a fish sprite
 * @param gridNumber Which grid image (1, 2, or 3) - defaults to 1 if not provided
 * @param spriteIndex Position in grid (0-19) - defaults to 0 if not provided
 * @param options Optional styling/sizing
 * @returns HTML img tag string
 */
export function getFishSpriteImg(
  gridNumber: 1 | 2 | 3 | undefined,
  spriteIndex: number | undefined,
  options?: { width?: number; height?: number; alt?: string; flip?: boolean }
): string {
  const grid = gridNumber ?? 1;
  const index = spriteIndex ?? 0;
  const width = options?.width ?? 60;
  const height = options?.height ?? 60;
  const alt = options?.alt ?? 'fish';
  const transform = options?.flip ? 'scaleX(-1)' : 'none';

  // For now, return a placeholder that will be filled in via loadFishSprites
  // This enables progressive loading
  return `<img
    data-grid="${grid}"
    data-index="${index}"
    width="${width}"
    height="${height}"
    alt="${alt}"
    style="
      image-rendering: pixelated;
      transform: ${transform};
      display: block;
      margin: 0 auto;
      filter: drop-shadow(0 0 4px rgba(255,255,255,0.3));
    "
    class="fish-sprite"
  >`;
}

/**
 * Preload fish sprite data URLs into a cache
 * Useful for InventoryUI to show all fish without delay
 */
const spriteCache = new Map<string, string>();

export async function cacheFishSprite(gridNumber: 1 | 2 | 3, spriteIndex: number): Promise<string> {
  const key = `${gridNumber}_${spriteIndex}`;
  if (spriteCache.has(key)) {
    return spriteCache.get(key)!;
  }

  const dataUrl = await getFishSpriteDataUrl(gridNumber, spriteIndex);
  spriteCache.set(key, dataUrl);
  return dataUrl;
}

/**
 * Load all cached sprites into img elements
 * Call this after rendering fish images with getFishSpriteImg()
 */
export async function loadFishSprites(): Promise<void> {
  const images = document.querySelectorAll('img.fish-sprite[data-grid][data-index]');
  const promises: Promise<void>[] = [];

  images.forEach((img) => {
    const gridNumber = parseInt(img.getAttribute('data-grid')!, 10) as 1 | 2 | 3;
    const spriteIndex = parseInt(img.getAttribute('data-index')!, 10);

    promises.push(
      cacheFishSprite(gridNumber, spriteIndex).then((dataUrl) => {
        (img as HTMLImageElement).src = dataUrl;
      })
    );
  });

  await Promise.all(promises);
}
