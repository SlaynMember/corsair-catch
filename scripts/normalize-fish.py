"""
Normalize all fish battle sprites to consistent resolution.

What it does:
1. Trims transparent padding around each fish
2. Scales so longest dimension = TARGET_SIZE (400px)
3. Uses NEAREST resampling (pixel art safe)
4. Saves back to the same file (RGBA PNG, transparent bg)

Run:  python scripts/normalize-fish.py
      python scripts/normalize-fish.py --dry-run   (preview only)
"""

import os
import sys
import glob
from PIL import Image

TARGET_SIZE = 400  # longest dimension in pixels
MIN_WIDTH   = 300  # minimum width in pixels
FISH_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'sprites', 'fish')
DRY_RUN = '--dry-run' in sys.argv


def trim_transparent(img: Image.Image) -> Image.Image:
    """Crop to bounding box of non-transparent pixels."""
    bbox = img.getbbox()
    if bbox:
        return img.crop(bbox)
    return img


def normalize_fish(path: str) -> dict:
    """Normalize a single fish sprite. Returns stats dict."""
    img = Image.open(path).convert('RGBA')
    orig_w, orig_h = img.size

    # Trim transparent edges
    trimmed = trim_transparent(img)
    trim_w, trim_h = trimmed.size

    # Calculate scale: longest side → TARGET_SIZE, but width must be ≥ MIN_WIDTH
    longest = max(trim_w, trim_h)
    if longest == 0:
        return {'file': os.path.basename(path), 'skipped': True, 'reason': 'empty'}

    scale = TARGET_SIZE / longest
    new_w = max(1, round(trim_w * scale))
    new_h = max(1, round(trim_h * scale))

    # Enforce minimum width
    if new_w < MIN_WIDTH:
        bump = MIN_WIDTH / new_w
        new_w = MIN_WIDTH
        new_h = max(1, round(new_h * bump))
        scale = scale * bump

    stats = {
        'file': os.path.basename(path),
        'orig': f'{orig_w}x{orig_h}',
        'trimmed': f'{trim_w}x{trim_h}',
        'output': f'{new_w}x{new_h}',
        'scale': f'{scale:.2f}x',
    }

    if not DRY_RUN:
        result = trimmed.resize((new_w, new_h), Image.NEAREST)
        # Pad to square canvas (centered, transparent)
        canvas_size = max(new_w, new_h)
        canvas = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
        paste_x = (canvas_size - new_w) // 2
        paste_y = (canvas_size - new_h) // 2
        canvas.paste(result, (paste_x, paste_y))
        canvas.save(path, 'PNG')

    return stats


def main():
    fish_files = sorted(glob.glob(os.path.join(FISH_DIR, 'fish-*.png')))
    if not fish_files:
        print(f'No fish sprites found in {FISH_DIR}')
        return

    print(f'{"DRY RUN — " if DRY_RUN else ""}Normalizing {len(fish_files)} fish to {TARGET_SIZE}px longest side\n')
    print(f'{"File":<20} {"Original":<12} {"Trimmed":<12} {"Output":<12} {"Scale"}')
    print('-' * 72)

    for path in fish_files:
        stats = normalize_fish(path)
        if stats.get('skipped'):
            print(f'{stats["file"]:<20} SKIPPED ({stats["reason"]})')
        else:
            print(f'{stats["file"]:<20} {stats["orig"]:<12} {stats["trimmed"]:<12} {stats["output"]:<12} {stats["scale"]}')

    action = 'Would save' if DRY_RUN else 'Saved'
    print(f'\n{action} {len(fish_files)} normalized sprites to {FISH_DIR}')


if __name__ == '__main__':
    main()
