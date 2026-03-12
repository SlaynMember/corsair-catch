"""
Re-slice cannonball crab battle sprites from the original source sheet.
Aggressive text removal using region blanking + connected component filtering.
"""

from PIL import Image
import os
import numpy as np
from scipy import ndimage

SRC = "public/sprite_unedited/cannonball-crab-sprite-sheet.png"
OUT_DIR = "public/sprites/crab-battle"

img = Image.open(SRC).convert("RGBA")
W, H = img.size
print(f"Source: {W}x{H}")

col_w = W // 4  # 344
row_h = H // 4  # 192

ROWS = ["idle", "attack", "hurt", "walk"]
os.makedirs(OUT_DIR, exist_ok=True)

for row_idx, row_name in enumerate(ROWS):
    for col_idx in range(4):
        x1 = col_idx * col_w
        y1 = row_idx * row_h
        x2 = x1 + col_w
        y2 = y1 + row_h
        cell = img.crop((x1, y1, x2, y2)).convert("RGBA")
        arr = np.array(cell)
        h, w = arr.shape[:2]

        # Step 1: White/near-white → transparent
        r, g, b = arr[:,:,0].astype(int), arr[:,:,1].astype(int), arr[:,:,2].astype(int)
        white_mask = (r > 220) & (g > 220) & (b > 220)
        arr[white_mask] = [0, 0, 0, 0]

        # Step 2: Blank the top 20px strip entirely (number labels)
        arr[:20, :] = [0, 0, 0, 0]

        # Step 3: For col 0, blank left 70px entirely (row labels like "Idle", "Attack")
        if col_idx == 0:
            arr[:, :70] = [0, 0, 0, 0]

        # Step 4: Remove grid line artifacts (2px border on all edges)
        arr[:2, :] = [0, 0, 0, 0]
        arr[-2:, :] = [0, 0, 0, 0]
        arr[:, :2] = [0, 0, 0, 0]
        arr[:, -2:] = [0, 0, 0, 0]

        # Step 5: Connected component filtering — keep only the largest blob
        # This removes any leftover text fragments that are disconnected from the crab
        alpha = arr[:,:,3]
        opaque = alpha > 0
        labeled, num_features = ndimage.label(opaque)
        if num_features > 1:
            # Find the largest component (the crab)
            sizes = ndimage.sum(opaque, labeled, range(1, num_features + 1))
            largest_label = np.argmax(sizes) + 1
            # Remove all components that are < 5% of the largest
            threshold = sizes[largest_label - 1] * 0.02
            for label_id in range(1, num_features + 1):
                if sizes[label_id - 1] < threshold:
                    arr[labeled == label_id] = [0, 0, 0, 0]

        cell = Image.fromarray(arr)

        # Auto-crop to content
        bbox = cell.getbbox()
        if bbox:
            cell = cell.crop(bbox)

        # Make square
        cw2, ch2 = cell.size
        size = max(cw2, ch2)
        square = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        ox = (size - cw2) // 2
        oy = (size - ch2) // 2
        square.paste(cell, (ox, oy))

        out_path = os.path.join(OUT_DIR, f"{row_name}-{col_idx}.png")
        square.save(out_path)
        print(f"  {row_name}-{col_idx}: {square.size[0]}x{square.size[1]}")

print("Done!")
