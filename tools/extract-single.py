"""Extract a single cell from fish5 with adjusted tolerance for dark-on-dark."""
from PIL import Image
import os, math

OUT_DIR = "/Users/willp/Local Sites/corsair-catch/public/sprites/fish"

def remove_bg_black(img, tolerance=18):
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    ramp_zone = tolerance + 35
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            dist = math.sqrt(r**2 + g**2 + b**2)
            if dist < tolerance:
                pixels[x, y] = (r, g, b, 0)
            elif dist < ramp_zone:
                new_alpha = int((dist - tolerance) / (ramp_zone - tolerance) * 255)
                new_alpha = min(new_alpha, a)
                pixels[x, y] = (r, g, b, new_alpha)
    return rgba

def find_bbox(img, threshold=3):
    pixels = img.load()
    w, h = img.size
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            if pixels[x, y][3] > threshold:
                min_x = min(min_x, x); min_y = min(min_y, y)
                max_x = max(max_x, x); max_y = max(max_y, y)
    if max_x <= min_x: return None
    pad = 4
    return (max(0,min_x-pad), max(0,min_y-pad), min(w-1,max_x+pad)+1, min(h-1,max_y+pad)+1)

img = Image.open("/Users/willp/Local Sites/corsair-catch/public/sprite_unedited/fish5.png")
cell_w, cell_h = img.width // 5, img.height // 5

# Row 0, Col 2 = anglerfish-fire
cell = img.crop((2 * cell_w, 0, 3 * cell_w, cell_h))
clean = remove_bg_black(cell, tolerance=15)
bbox = find_bbox(clean)
if bbox:
    trimmed = clean.crop(bbox)
    trimmed.save(os.path.join(OUT_DIR, "anglerfish-fire.png"), "PNG")
    print(f"✓ anglerfish-fire.png ({trimmed.width}×{trimmed.height})")
else:
    print("⚠ still empty")
