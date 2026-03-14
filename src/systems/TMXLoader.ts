/**
 * TMXLoader — Parse Tiled .tmx files and extract object layers.
 *
 * Returns typed TMXMapData with walkable, fishing, colliders, transitions,
 * and dock zones. Handles rects, capsules (as bounding rects), and polygons
 * (with point-in-polygon ray-cast test). No Phaser dependency.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface TMXRect {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TMXPolygon {
  name: string;
  /** Absolute polygon vertices (object origin + relative dx,dy) */
  points: { x: number; y: number }[];
  /** Bounding rect for fast rejection */
  bounds: { x: number; y: number; width: number; height: number };
}

export type TMXZone = TMXRect | TMXPolygon;

export interface TMXMapData {
  walkable: TMXRect[];
  fishing: TMXZone[];
  colliders: TMXRect[];
  transitions: TMXRect[];
  dock: TMXRect[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isPolygon(zone: TMXZone): zone is TMXPolygon {
  return 'points' in zone;
}

/** Compute a bounding rect that encloses all walkable rects */
export function computeBoundingRect(rects: TMXRect[]): { x: number; y: number; width: number; height: number } {
  if (rects.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rects) {
    if (r.x < minX) minX = r.x;
    if (r.y < minY) minY = r.y;
    if (r.x + r.width > maxX) maxX = r.x + r.width;
    if (r.y + r.height > maxY) maxY = r.y + r.height;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Point-in-polygon test using ray-casting algorithm */
function pointInPolygon(px: number, py: number, points: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Check if a point is inside any zone (rect or polygon) */
export function isInZone(px: number, py: number, zones: TMXZone[]): boolean {
  for (const zone of zones) {
    if (isPolygon(zone)) {
      // Fast bounding-box rejection
      const b = zone.bounds;
      if (px < b.x || px > b.x + b.width || py < b.y || py > b.y + b.height) continue;
      if (pointInPolygon(px, py, zone.points)) return true;
    } else {
      if (px >= zone.x && px <= zone.x + zone.width &&
          py >= zone.y && py <= zone.y + zone.height) {
        return true;
      }
    }
  }
  return false;
}

/** Find a transition zone by name prefix (e.g. 'to-beach2') */
export function findTransition(name: string, transitions: TMXRect[]): TMXRect | undefined {
  return transitions.find(t => t.name === name);
}

// ── Parser ─────────────────────────────────────────────────────────────────

function parseObjectGroup(group: Element): TMXZone[] {
  const zones: TMXZone[] = [];
  const objects = group.querySelectorAll('object');

  for (const obj of objects) {
    const name = obj.getAttribute('name') ?? '';
    const ox = parseFloat(obj.getAttribute('x') ?? '0');
    const oy = parseFloat(obj.getAttribute('y') ?? '0');
    const w = parseFloat(obj.getAttribute('width') ?? '0');
    const h = parseFloat(obj.getAttribute('height') ?? '0');

    // Check for polygon child
    const polyEl = obj.querySelector('polygon');
    if (polyEl) {
      const pointsStr = polyEl.getAttribute('points') ?? '';
      const points = pointsStr.split(' ').map(pair => {
        const [dx, dy] = pair.split(',').map(Number);
        return { x: ox + dx, y: oy + dy };
      });
      // Compute bounding rect
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      zones.push({
        name,
        points,
        bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      });
      continue;
    }

    // Capsule or plain rectangle — both treated as bounding rect
    zones.push({ name, x: ox, y: oy, width: w, height: h });
  }

  return zones;
}

function parseObjectGroupAsRects(group: Element): TMXRect[] {
  return parseObjectGroup(group).map(zone => {
    if (isPolygon(zone)) {
      // Convert polygon to its bounding rect
      return { name: zone.name, ...zone.bounds };
    }
    return zone as TMXRect;
  });
}

/** Parse a TMX XML string into typed map data */
export function parseTMX(xmlString: string): TMXMapData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  const result: TMXMapData = {
    walkable: [],
    fishing: [],
    colliders: [],
    transitions: [],
    dock: [],
  };

  const groups = doc.querySelectorAll('objectgroup');
  for (const group of groups) {
    const layerName = (group.getAttribute('name') ?? '').toLowerCase();
    switch (layerName) {
      case 'walkable':
        result.walkable = parseObjectGroupAsRects(group);
        break;
      case 'fishing':
        // Keep polygons for accurate hit-testing
        result.fishing = parseObjectGroup(group);
        break;
      case 'colliders':
        result.colliders = parseObjectGroupAsRects(group);
        break;
      case 'transitions':
        result.transitions = parseObjectGroupAsRects(group);
        break;
      case 'dock':
        result.dock = parseObjectGroupAsRects(group);
        break;
    }
  }

  return result;
}

/** Fetch and parse a TMX file. Returns null on failure. */
export async function fetchTMX(url: string): Promise<TMXMapData | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const text = await resp.text();
    return parseTMX(text);
  } catch {
    return null;
  }
}
