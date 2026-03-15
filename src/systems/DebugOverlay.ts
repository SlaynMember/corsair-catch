/**
 * DebugOverlay — Draw TMX zone rectangles on top of the game scene.
 *
 * Activated by `?debug=1` URL parameter. Draws colored semi-transparent
 * rectangles for each TMX zone layer with labels.
 *
 * Usage in any beach scene's create():
 *   import { drawDebugOverlay } from '../systems/DebugOverlay';
 *   drawDebugOverlay(this, tmxData);
 */

import { TMXMapData, TMXRect, TMXZone } from './TMXLoader';

/** Check if debug mode is active via URL parameter */
export function isDebugMode(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === '1';
}

interface ZoneStyle {
  color: number;
  alpha: number;
  label: string;
  strokeColor: number;
}

const ZONE_STYLES: Record<string, ZoneStyle> = {
  walkable:    { color: 0x00ff00, alpha: 0.15, label: 'WALK', strokeColor: 0x00ff00 },
  colliders:   { color: 0xff0000, alpha: 0.20, label: 'COLLIDER', strokeColor: 0xff0000 },
  transitions: { color: 0x0088ff, alpha: 0.25, label: 'TRANS', strokeColor: 0x0088ff },
  fishing:     { color: 0x00ffff, alpha: 0.15, label: 'FISH', strokeColor: 0x00ffff },
  dock:        { color: 0xffcc00, alpha: 0.15, label: 'DOCK', strokeColor: 0xffcc00 },
};

const DEBUG_DEPTH = 999;

function isPolygonZone(zone: TMXZone): zone is { name: string; points: { x: number; y: number }[]; bounds: { x: number; y: number; width: number; height: number } } {
  return 'points' in zone;
}

function drawZones(
  scene: Phaser.Scene,
  zones: (TMXRect | TMXZone)[],
  style: ZoneStyle,
  layerName: string,
) {
  const gfx = scene.add.graphics().setDepth(DEBUG_DEPTH);

  for (const zone of zones) {
    let x: number, y: number, w: number, h: number;

    if (isPolygonZone(zone)) {
      // Draw polygon outline + bounding rect
      const pts = zone.points;
      gfx.lineStyle(2, style.strokeColor, 0.8);
      gfx.beginPath();
      gfx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        gfx.lineTo(pts[i].x, pts[i].y);
      }
      gfx.closePath();
      gfx.strokePath();

      // Fill bounding rect
      x = zone.bounds.x;
      y = zone.bounds.y;
      w = zone.bounds.width;
      h = zone.bounds.height;
      gfx.fillStyle(style.color, style.alpha * 0.5);
      gfx.fillRect(x, y, w, h);
    } else {
      const rect = zone as TMXRect;
      x = rect.x;
      y = rect.y;
      w = rect.width;
      h = rect.height;

      // Fill
      gfx.fillStyle(style.color, style.alpha);
      gfx.fillRect(x, y, w, h);

      // Stroke
      gfx.lineStyle(2, style.strokeColor, 0.6);
      gfx.strokeRect(x, y, w, h);
    }

    // Label
    const name = (zone as TMXRect).name || layerName;
    const labelText = `${style.label}: ${name}`;
    scene.add.text(x + 3, y + 2, labelText, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: `#${style.strokeColor.toString(16).padStart(6, '0')}`,
      padding: { x: 2, y: 1 },
    }).setDepth(DEBUG_DEPTH + 1).setAlpha(0.85);
  }
}

/**
 * Draw all TMX zones as colored overlays on the current scene.
 * Call in scene's create() method after TMX data is loaded.
 * Only draws if `?debug=1` is in the URL.
 */
export function drawDebugOverlay(scene: Phaser.Scene, tmx: TMXMapData): void {
  if (!isDebugMode()) return;

  // Draw in order: walkable (bottom) → fishing → dock → colliders → transitions (top)
  drawZones(scene, tmx.walkable, ZONE_STYLES.walkable, 'walkable');
  drawZones(scene, tmx.fishing, ZONE_STYLES.fishing, 'fishing');
  drawZones(scene, tmx.dock, ZONE_STYLES.dock, 'dock');
  drawZones(scene, tmx.colliders, ZONE_STYLES.colliders, 'colliders');
  drawZones(scene, tmx.transitions, ZONE_STYLES.transitions, 'transitions');

  // Debug banner
  scene.add.text(10, 10, `DEBUG: ${scene.scene.key} — TMX overlay active`, {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#ffff00',
    backgroundColor: '#000000',
    padding: { x: 4, y: 2 },
  }).setDepth(DEBUG_DEPTH + 2).setScrollFactor(0);
}
