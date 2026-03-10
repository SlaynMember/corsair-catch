"""
Extract individual fish from fish.png and fish2.png composite sheets.
Removes white/light background while preserving auras, glows, and anti-aliased edges.
Pure PIL — no numpy dependency.
"""
from PIL import Image
import os, math

OUT_DIR = "/Users/willp/Local Sites/corsair-catch/public/sprites/fish"
os.makedirs(OUT_DIR, exist_ok=True)

def remove_white_bg(img, tolerance=30):
    """
    Remove white background while preserving auras and anti-aliased edges.
    Uses distance-from-white to compute alpha so near-white pixels become
    semi-transparent instead of hard-cutoff. Preserves glows and soft edges.
    """
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    ramp_zone = tolerance + 45  # graduated alpha zone

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]

            # Distance from pure white
            dist = math.sqrt((255 - r)**2 + (255 - g)**2 + (255 - b)**2)

            if dist < tolerance:
                # Clearly white → fully transparent
                pixels[x, y] = (r, g, b, 0)
            elif dist < ramp_zone:
                # Transition zone → graduated alpha for anti-aliased edges
                new_alpha = int((dist - tolerance) / (ramp_zone - tolerance) * 255)
                new_alpha = min(new_alpha, a)  # respect original alpha
                pixels[x, y] = (r, g, b, new_alpha)
            # else: keep as-is (fully colored pixel)

    return rgba

def find_content_bbox(img, alpha_threshold=5):
    """Find bounding box of non-transparent content with padding."""
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
        return (0, 0, w, h)

    # Padding to not clip auras
    pad = 4
    min_x = max(0, min_x - pad)
    min_y = max(0, min_y - pad)
    max_x = min(w - 1, max_x + pad)
    max_y = min(h - 1, max_y + pad)

    return (min_x, min_y, max_x + 1, max_y + 1)

def extract_quadrant(img, row, col, grid_w, grid_h):
    """Extract one quadrant from a 2x2 grid."""
    x = col * grid_w
    y = row * grid_h
    return img.crop((x, y, x + grid_w, y + grid_h))

def process_and_save(img, name, tolerance=30):
    """Remove bg, trim, and save."""
    clean = remove_white_bg(img, tolerance=tolerance)
    bbox = find_content_bbox(clean)
    trimmed = clean.crop(bbox)

    outpath = os.path.join(OUT_DIR, f"{name}.png")
    trimmed.save(outpath, "PNG")
    print(f"  ✓ {name}.png  ({trimmed.width}×{trimmed.height})")

# ============================================================
# fish.png — 1024×1024, RGB, 2×2 grid, WHITE background
# ============================================================
print("=== fish.png (1024×1024) ===")
fish1 = Image.open("/Users/willp/Local Sites/corsair-catch/public/sprite_unedited/fish.png")
gw1, gh1 = fish1.width // 2, fish1.height // 2

fish1_map = [
    (0, 0, "goldfish-fire"),
    (0, 1, "fish-water"),
    (1, 0, "fish-coral"),
    (1, 1, "bass-electric"),
]

for row, col, name in fish1_map:
    quad = extract_quadrant(fish1, row, col, gw1, gh1)
    process_and_save(quad, name, tolerance=28)

# ============================================================
# fish2.png — 2048×2048, RGBA, 2×2 grid, WHITE background
# ============================================================
print("\n=== fish2.png (2048×2048) ===")
fish2 = Image.open("/Users/willp/Local Sites/corsair-catch/public/sprite_unedited/fish2.png")
gw2, gh2 = fish2.width // 2, fish2.height // 2

fish2_map = [
    (0, 0, "fish-stone"),
    (0, 1, "fish-abyssal"),
    (1, 0, "fish-storm"),
    (1, 1, "fish-ice"),
]

for row, col, name in fish2_map:
    quad = extract_quadrant(fish2, row, col, gw2, gh2)
    process_and_save(quad, name, tolerance=25)

print(f"\n✅ All fish extracted to {OUT_DIR}/")
