"""
Extract fish from fish4.png (5x5, white bg) and fish5.png (5x5, black bg).
Grid-based extraction with per-cell naming.
"""
from PIL import Image
import os, math

OUT_DIR = "/Users/willp/Local Sites/corsair-catch/public/sprites/fish"
os.makedirs(OUT_DIR, exist_ok=True)

def remove_bg(img, bg_type="white", tolerance=26):
    """Remove white or black background."""
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    ramp_zone = tolerance + 45

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if bg_type == "white":
                dist = math.sqrt((255 - r)**2 + (255 - g)**2 + (255 - b)**2)
            else:  # black
                dist = math.sqrt(r**2 + g**2 + b**2)

            if dist < tolerance:
                pixels[x, y] = (r, g, b, 0)
            elif dist < ramp_zone:
                new_alpha = int((dist - tolerance) / (ramp_zone - tolerance) * 255)
                new_alpha = min(new_alpha, a)
                pixels[x, y] = (r, g, b, new_alpha)
    return rgba

def find_content_bbox(img, alpha_threshold=5):
    pixels = img.load()
    w, h = img.size
    min_x, min_y = w, h
    max_x, max_y = 0, 0
    for y in range(h):
        for x in range(w):
            if pixels[x, y][3] > alpha_threshold:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x <= min_x or max_y <= min_y:
        return None
    pad = 4
    return (max(0, min_x - pad), max(0, min_y - pad),
            min(w - 1, max_x + pad) + 1, min(h - 1, max_y + pad) + 1)

def extract_grid(img_path, grid_cols, grid_rows, names, bg_type="white", tolerance=26):
    img = Image.open(img_path)
    cell_w = img.width // grid_cols
    cell_h = img.height // grid_rows

    for row in range(grid_rows):
        for col in range(grid_cols):
            idx = row * grid_cols + col
            name = names[idx] if idx < len(names) else None
            if not name or name == "DUPE":
                continue

            x1 = col * cell_w
            y1 = row * cell_h
            cell = img.crop((x1, y1, x1 + cell_w, y1 + cell_h))
            clean = remove_bg(cell, bg_type=bg_type, tolerance=tolerance)
            bbox = find_content_bbox(clean)
            if not bbox:
                print(f"  ⚠ {name} — empty cell, skipping")
                continue
            trimmed = clean.crop(bbox)
            outpath = os.path.join(OUT_DIR, f"{name}.png")
            trimmed.save(outpath, "PNG")
            print(f"  ✓ {name}.png  ({trimmed.width}×{trimmed.height})")

# ============================================================
# fish4.png — 5×5 grid, white background, 2048x2048
# ============================================================
print("=== fish4.png (5×5, white bg) ===")

fish4_names = [
    # Row 1: fire eel, water eel, stone fish, abyssal fish (DUPES), + mech variant
    "DUPE",              "DUPE",              "DUPE",              "DUPE",              "fish-mech",
    # Row 2: fire goldfish, water fish, storm fish, ice fish (DUPES), + abyssal shark
    "DUPE",              "DUPE",              "DUPE",              "DUPE",              "shark-abyssal",
    # Row 3: coral (DUPE), bass-electric (DUPE), leaf (DUPE), sand (DUPE), steampunk fish
    "DUPE",              "DUPE",              "DUPE",              "DUPE",              "fish-steampunk",
    # Row 4: treasure fish, anglerfish, steampunk gold, octopus dark, lava shark
    "fish-treasure",     "anglerfish-abyssal","goldfish-steampunk","octopus-abyssal",   "shark-fire",
    # Row 5: pirate goldfish, bomb fish, coral reef, stingray, anchor fish
    "goldfish-pirate",   "fish-bomb",         "fish-reef",         "ray-sand",          "fish-anchor",
]

extract_grid(
    "/Users/willp/Local Sites/corsair-catch/public/sprite_unedited/fish4.png",
    5, 5, fish4_names, bg_type="white", tolerance=26
)

# ============================================================
# fish5.png — 5×5 grid, BLACK background, 2048x2048
# ============================================================
print("\n=== fish5.png (5×5, black bg) ===")

fish5_names = [
    # Row 1
    "dragon-storm",      "serpent-abyssal",   "anglerfish-fire",   "octopus-water",     None,
    # Row 2
    "clownfish-coral",   "worm-coral",        "shark-abyssal",     "pufferfish-water",  "seahorse-fire",
    # Row 3
    "octopus-mech",      "fish-mech2",        "ray-steampunk",     "fish-potion",       "worm-sand",
    # Row 4
    "toadfish-coral",    "clownfish-normal",  "fish-ghost",        "piranha-abyssal",   "anglerfish-electric",
    # Row 5
    "mermaid-water",     "narwhal-ice",       "jellyfish-electric","dragon-ice",        "kraken-abyssal",
]

extract_grid(
    "/Users/willp/Local Sites/corsair-catch/public/sprite_unedited/fish5.png",
    5, 5, fish5_names, bg_type="black", tolerance=22
)

# Summary
print("\n✅ All extracted. Listing all sprites:")
files = sorted(os.listdir(OUT_DIR))
for f in files:
    if f.endswith('.png'):
        img = Image.open(os.path.join(OUT_DIR, f))
        print(f"  {f:35s} {img.width}×{img.height}")
print(f"\nTotal: {len([f for f in files if f.endswith('.png')])} sprites")
