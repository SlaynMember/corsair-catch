"""
Extract fish from fish3.png — non-uniform layout.
Fish are positioned in different areas, not a clean 2x2 grid.
We'll cut specific regions based on visual inspection.

Layout (2048x2048):
- Top-right area (~1000-2048 x, 0-800 y): Fire eel/serpent
- Mid-right area (~900-2048 x, 700-1300 y): Water eel/dragon
- Bottom-left area (0-1100 x, 900-2048 y): Coral leaf fish
- Bottom-right area (1000-2048 x, 1200-2048 y): Sand/normal fish
"""
from PIL import Image
import os, math

OUT_DIR = "/Users/willp/Local Sites/corsair-catch/public/sprites/fish"
os.makedirs(OUT_DIR, exist_ok=True)

def remove_white_bg(img, tolerance=28):
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    ramp_zone = tolerance + 45

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            dist = math.sqrt((255 - r)**2 + (255 - g)**2 + (255 - b)**2)
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
        return (0, 0, w, h)
    pad = 4
    return (max(0, min_x - pad), max(0, min_y - pad),
            min(w - 1, max_x + pad) + 1, min(h - 1, max_y + pad) + 1)

def extract_region(img, box, name, tolerance=28):
    region = img.crop(box)
    clean = remove_white_bg(region, tolerance=tolerance)
    bbox = find_content_bbox(clean)
    trimmed = clean.crop(bbox)
    outpath = os.path.join(OUT_DIR, f"{name}.png")
    trimmed.save(outpath, "PNG")
    print(f"  ✓ {name}.png  ({trimmed.width}×{trimmed.height})")

print("=== fish3.png (2048×2048) ===")
img = Image.open("/Users/willp/Local Sites/corsair-catch/public/sprite_unedited/fish3.png")

# Regions based on visual layout — tightened to avoid neighbor bleed
extract_region(img, (900, 0, 2048, 780), "eel-fire", tolerance=26)
extract_region(img, (880, 720, 2048, 1180), "eel-water", tolerance=26)
extract_region(img, (0, 880, 1050, 2000), "fish-leaf", tolerance=26)
extract_region(img, (1020, 1250, 2048, 2048), "fish-sand", tolerance=26)

print(f"\n✅ fish3 extracted to {OUT_DIR}/")
