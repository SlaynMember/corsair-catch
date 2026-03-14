#!/usr/bin/env python3
"""
Process Kling-generated fish sprites:
1. Detect background color from edges (fuzzy magenta)
2. Flood-fill remove background from corners → transparent
3. Auto-crop to content bounding box
4. Pad to square canvas (transparent)
5. Scale longest side to 400px (nearest-neighbor for pixel art)
6. Save as target fish ID
"""

from PIL import Image, ImageDraw
import numpy as np
from collections import deque
import os, sys, shutil

# ── Mapping: (batch_dir, kling_filename) → fish-X-XX ──────────────────────

MAPPING = [
    # Batch 1 (first10) — prefix: kling_20260314_IMAGE_Image1_STY_3019_0
    ("first10", "kling_20260314_IMAGE_Image1_STY_3019_0.png",     "fish-1-13"),
    ("first10", "kling_20260314_IMAGE_Image1_STY_3019_0_1.png",   "fish-1-12"),
    ("first10", "kling_20260314_IMAGE_Image1_STY_3019_0_2.png",   "fish-1-03"),
    ("first10", "kling_20260314_IMAGE_Image1_STY_3019_0_3.png",   "fish-1-01"),
    ("first10", "kling_20260314_IMAGE_Image1_STY_3019_0_4.png",   "fish-1-05"),
    ("first10", "kling_20260314_IMAGE_Image1_STY_3019_0_5.png",   "fish-1-02"),
    ("first10", "kling_20260314_IMAGE_Image1_STY_3019_0_6.png",   "fish-1-06"),
    ("first10", "kling_20260314_IMAGE_Image1_STY_3019_0_7.png",   "fish-1-11"),
    ("first10", "kling_20260314_IMAGE_Image1_STY_3019_0_8.png",   "fish-1-04"),
    ("first10", "kling_20260314_IMAGE_Image1_STY_3019_0_9.png",   "fish-1-00"),

    # Batch 2 (second10) — prefix: kling_20260314_IMAGE_Image1_STY_3024_0
    ("second10", "kling_20260314_IMAGE_Image1_STY_3024_0.png",     "fish-1-15"),
    ("second10", "kling_20260314_IMAGE_Image1_STY_3024_0_1.png",   "fish-1-17"),
    # _0_2 SKIP (duplicate steampunk)
    ("second10", "kling_20260314_IMAGE_Image1_STY_3024_0_3.png",   "fish-1-14"),
    ("second10", "kling_20260314_IMAGE_Image1_STY_3024_0_4.png",   "fish-1-08"),
    ("second10", "kling_20260314_IMAGE_Image1_STY_3024_0_5.png",   "fish-1-16"),
    # _0_6 SKIP (duplicate lantern anglerfish, batch4 #2 is better)

    # Batch 3 (third10) — prefix: kling_20260314_IMAGE_Image1_STY_3026_0
    ("third10", "kling_20260314_IMAGE_Image1_STY_3026_0.png",     "fish-2-03"),
    ("third10", "kling_20260314_IMAGE_Image1_STY_3026_0_1.png",   "fish-2-06"),
    ("third10", "kling_20260314_IMAGE_Image1_STY_3026_0_2.png",   "fish-2-05"),
    ("third10", "kling_20260314_IMAGE_Image1_STY_3026_0_3.png",   "fish-2-00"),
    ("third10", "kling_20260314_IMAGE_Image1_STY_3026_0_4.png",   "fish-2-04"),
    ("third10", "kling_20260314_IMAGE_Image1_STY_3026_0_5.png",   "fish-2-01"),
    # _0_6 SKIP (duplicate anchor fish)
    ("third10", "kling_20260314_IMAGE_Image1_STY_3026_0_7.png",   "fish-2-09"),
    ("third10", "kling_20260314_IMAGE_Image1_STY_3026_0_8.png",   "fish-2-07"),
    ("third10", "kling_20260314_IMAGE_Image1_STY_3026_0_9.png",   "fish-2-02"),

    # Batch 4 (fourth10) — prefix: kling_20260314_IMAGE_Image1_STY_3044_0
    # _0 SKIP (variant chain anglerfish, #8 is the real match)
    ("fourth10", "kling_20260314_IMAGE_Image1_STY_3044_0_1.png",   "fish-2-13"),
    ("fourth10", "kling_20260314_IMAGE_Image1_STY_3044_0_2.png",   "fish-3-00"),
    ("fourth10", "kling_20260314_IMAGE_Image1_STY_3044_0_3.png",   "fish-2-11"),
    ("fourth10", "kling_20260314_IMAGE_Image1_STY_3044_0_4.png",   "fish-1-10"),
    ("fourth10", "kling_20260314_IMAGE_Image1_STY_3044_0_5.png",   "fish-2-14"),
    ("fourth10", "kling_20260314_IMAGE_Image1_STY_3044_0_6.png",   "fish-2-15"),
    ("fourth10", "kling_20260314_IMAGE_Image1_STY_3044_0_7.png",   "fish-2-16"),
    ("fourth10", "kling_20260314_IMAGE_Image1_STY_3044_0_8.png",   "fish-2-18"),

    # Batch 5 (fifth10) — prefix: kling_20260314_IMAGE_Image1_STY_3080_0
    ("fifth10", "kling_20260314_IMAGE_Image1_STY_3080_0.png",     "fish-3-01"),
    ("fifth10", "kling_20260314_IMAGE_Image1_STY_3080_0_1.png",   "fish-3-03"),
    ("fifth10", "kling_20260314_IMAGE_Image1_STY_3080_0_2.png",   "fish-3-07"),
    ("fifth10", "kling_20260314_IMAGE_Image1_STY_3080_0_3.png",   "fish-3-05"),
    ("fifth10", "kling_20260314_IMAGE_Image1_STY_3080_0_4.png",   "fish-3-02"),
    ("fifth10", "kling_20260314_IMAGE_Image1_STY_3080_0_5.png",   "fish-3-06"),
    ("fifth10", "kling_20260314_IMAGE_Image1_STY_3080_0_6.png",   "fish-3-04"),
]

TARGET_SIZE = 400  # longest side after processing


def detect_bg_color(img_rgba):
    """Sample edges to find dominant background color."""
    arr = np.array(img_rgba.convert('RGB'))
    h, w = arr.shape[:2]
    margin = min(30, h // 10, w // 10)

    # Collect edge pixels
    edges = np.concatenate([
        arr[0:margin, :, :].reshape(-1, 3),
        arr[-margin:, :, :].reshape(-1, 3),
        arr[:, 0:margin, :].reshape(-1, 3),
        arr[:, -margin:, :].reshape(-1, 3),
    ])
    # Median is robust against sprite pixels that touch edges
    return tuple(np.median(edges, axis=0).astype(int))


def flood_fill_transparent(img_rgba, bg_color, tolerance=60):
    """
    Flood-fill from all 4 corners, making background transparent.
    Uses BFS to only remove connected background pixels.
    Works on numpy array for speed.
    """
    arr = np.array(img_rgba)
    h, w = arr.shape[:2]
    rgb = arr[:, :, :3].astype(np.int16)
    bg = np.array(bg_color, dtype=np.int16)

    # Pre-compute which pixels are "close enough" to bg
    diff = np.abs(rgb - bg).sum(axis=2)
    bg_mask = diff <= tolerance

    # BFS from corners
    visited = np.zeros((h, w), dtype=bool)
    queue = deque()

    # Seed from all 4 corners
    for sy, sx in [(0, 0), (0, w-1), (h-1, 0), (h-1, w-1)]:
        if bg_mask[sy, sx] and not visited[sy, sx]:
            visited[sy, sx] = True
            queue.append((sy, sx))

    # Also seed from edge pixels
    for x in range(0, w, 4):
        for sy in [0, h-1]:
            if bg_mask[sy, x] and not visited[sy, x]:
                visited[sy, x] = True
                queue.append((sy, x))
    for y in range(0, h, 4):
        for sx in [0, w-1]:
            if bg_mask[y, sx] and not visited[y, sx]:
                visited[y, sx] = True
                queue.append((y, sx))

    while queue:
        cy, cx = queue.popleft()
        arr[cy, cx, 3] = 0  # Make transparent

        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and bg_mask[ny, nx]:
                visited[ny, nx] = True
                queue.append((ny, nx))

    return Image.fromarray(arr)


def auto_crop(img_rgba, padding=4):
    """Crop to content bounding box with small padding."""
    arr = np.array(img_rgba)
    alpha = arr[:, :, 3]
    rows = np.any(alpha > 0, axis=1)
    cols = np.any(alpha > 0, axis=0)

    if not rows.any():
        return img_rgba  # Fully transparent — shouldn't happen

    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]

    # Add padding
    h, w = arr.shape[:2]
    rmin = max(0, rmin - padding)
    rmax = min(h - 1, rmax + padding)
    cmin = max(0, cmin - padding)
    cmax = min(w - 1, cmax + padding)

    return img_rgba.crop((cmin, rmin, cmax + 1, rmax + 1))


def pad_to_square(img_rgba):
    """Center on a square transparent canvas."""
    w, h = img_rgba.size
    size = max(w, h)
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    x = (size - w) // 2
    y = (size - h) // 2
    canvas.paste(img_rgba, (x, y))
    return canvas


def scale_to_target(img_rgba, target=TARGET_SIZE):
    """Scale so longest side = target, using nearest-neighbor for pixel art."""
    w, h = img_rgba.size
    if max(w, h) <= target:
        return img_rgba
    ratio = target / max(w, h)
    new_w = round(w * ratio)
    new_h = round(h * ratio)
    return img_rgba.resize((new_w, new_h), Image.NEAREST)


def process_one(src_path, dst_path, fish_id):
    """Full pipeline for one sprite."""
    img = Image.open(src_path).convert('RGBA')

    # 1. Detect bg color
    bg = detect_bg_color(img)

    # 2. Flood-fill remove background
    img = flood_fill_transparent(img, bg, tolerance=60)

    # 3. Auto-crop
    img = auto_crop(img, padding=2)

    # 4. Pad to square
    img = pad_to_square(img)

    # 5. Scale to target
    img = scale_to_target(img, TARGET_SIZE)

    # 6. Save
    img.save(dst_path, 'PNG')
    w, h = img.size
    return w, h


def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    tmp_dir = os.path.join(base, 'tmp')
    out_dir = os.path.join(base, 'tmp', 'processed')
    os.makedirs(out_dir, exist_ok=True)

    # Also backup originals
    backup_dir = os.path.join(base, 'tmp', 'fish_originals_backup')
    fish_dir = os.path.join(base, 'public', 'sprites', 'fish')
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir, exist_ok=True)
        for f in os.listdir(fish_dir):
            if f.endswith('.png'):
                shutil.copy2(os.path.join(fish_dir, f), os.path.join(backup_dir, f))
        print(f"Backed up {len(os.listdir(backup_dir))} original fish to {backup_dir}")

    success = 0
    errors = []

    for batch_dir, kling_file, fish_id in MAPPING:
        src = os.path.join(tmp_dir, batch_dir, kling_file)
        dst = os.path.join(out_dir, f"{fish_id}.png")

        if not os.path.exists(src):
            errors.append(f"MISSING: {batch_dir}/{kling_file}")
            continue

        try:
            w, h = process_one(src, dst, fish_id)
            print(f"  OK  {fish_id}.png  ({w}x{h})  <-- {batch_dir}/{kling_file[:30]}...")
            success += 1
        except Exception as e:
            errors.append(f"FAIL: {fish_id} — {e}")
            print(f"  FAIL  {fish_id}: {e}")

    print(f"\n{'='*50}")
    print(f"Processed: {success}/{len(MAPPING)}")
    if errors:
        print(f"Errors ({len(errors)}):")
        for e in errors:
            print(f"  {e}")

    print(f"\nOutput: {out_dir}/")
    print(f"Backup: {backup_dir}/")
    print(f"\nTo deploy: copy {out_dir}/*.png --> {fish_dir}/")


if __name__ == '__main__':
    main()
