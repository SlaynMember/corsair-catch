/**
 * TMXDebug — Draw colored overlays for all TMX zones when ?debug=1 is in the URL.
 * Red = colliders, Green = walkable, Blue = fishing, Yellow = transitions, Purple = dock
 */
import { TMXMapData, TMXRect, TMXZone } from './TMXLoader';

export function isDebugMode(): boolean {
  return new URLSearchParams(window.location.search).has('debug');
}

export function drawTMXDebug(scene: Phaser.Scene, tmx: TMXMapData) {
  if (!isDebugMode()) return;

  const g = scene.add.graphics().setDepth(999).setAlpha(0.35);

  // Walkable — green
  g.fillStyle(0x00ff00, 0.25);
  for (const z of tmx.walkable) {
    g.fillRect(z.x, z.y, z.width, z.height);
    g.lineStyle(2, 0x00ff00, 0.8);
    g.strokeRect(z.x, z.y, z.width, z.height);
  }

  // Colliders — red
  g.fillStyle(0xff0000, 0.35);
  for (const z of tmx.colliders) {
    g.fillRect(z.x, z.y, z.width, z.height);
    g.lineStyle(2, 0xff0000, 0.8);
    g.strokeRect(z.x, z.y, z.width, z.height);
  }

  // Fishing — blue
  g.fillStyle(0x0088ff, 0.25);
  for (const z of tmx.fishing) {
    if ('width' in z && 'height' in z) {
      const r = z as TMXRect;
      g.fillRect(r.x, r.y, r.width, r.height);
      g.lineStyle(2, 0x0088ff, 0.8);
      g.strokeRect(r.x, r.y, r.width, r.height);
    }
  }

  // Transitions — yellow
  g.fillStyle(0xffff00, 0.25);
  for (const z of tmx.transitions) {
    g.fillRect(z.x, z.y, z.width, z.height);
    g.lineStyle(2, 0xffff00, 0.8);
    g.strokeRect(z.x, z.y, z.width, z.height);
  }

  // Dock — purple
  g.fillStyle(0xaa00ff, 0.25);
  for (const z of tmx.dock) {
    g.fillRect(z.x, z.y, z.width, z.height);
    g.lineStyle(2, 0xaa00ff, 0.8);
    g.strokeRect(z.x, z.y, z.width, z.height);
  }

  // Labels
  const labelStyle = { fontFamily: 'monospace', fontSize: '10px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 };
  for (const z of tmx.colliders) {
    scene.add.text(z.x + 2, z.y + 1, 'COL', labelStyle).setDepth(999);
  }
  for (const z of tmx.transitions) {
    scene.add.text(z.x + 2, z.y + 1, (z as any).name ?? 'TRANS', labelStyle).setDepth(999);
  }
}
