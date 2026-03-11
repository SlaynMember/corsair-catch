/**
 * Beach Layout — Authored game world anchors
 * All gameplay points are fixed, not procedural
 */

export interface BeachAnchor {
  id: string;
  label: string;
  worldPos: { x: number; z: number };
  type: 'spawn' | 'gather' | 'fish' | 'dock' | 'shelter';
  displayName?: string;
  radius?: number; // interaction zone radius
}

export const BEACH_ANCHORS: BeachAnchor[] = [
  {
    id: 'spawn',
    label: 'Wake Point',
    worldPos: { x: 100, z: 150 },
    type: 'spawn',
    displayName: 'Sandy Shore',
  },
  {
    id: 'wood-1',
    label: 'Driftwood Cluster A',
    worldPos: { x: 50, z: 120 },
    type: 'gather',
    displayName: 'Driftwood',
    radius: 30,
  },
  {
    id: 'wood-2',
    label: 'Driftwood Cluster B',
    worldPos: { x: 150, z: 140 },
    type: 'gather',
    displayName: 'Driftwood',
    radius: 30,
  },
  {
    id: 'twine-1',
    label: 'Rope Scrap',
    worldPos: { x: 130, z: 100 },
    type: 'gather',
    displayName: 'Twine',
    radius: 25,
  },
  {
    id: 'shore-fish',
    label: 'Shore Fishing Point',
    worldPos: { x: 80, z: 30 },
    type: 'fish',
    displayName: 'Shoreline',
    radius: 40,
  },
  {
    id: 'dock-main',
    label: 'Main Dock',
    worldPos: { x: 120, z: 5 },
    type: 'dock',
    displayName: 'Dock',
    radius: 50,
  },
  {
    id: 'shelter',
    label: 'Beach Shelter',
    worldPos: { x: 200, z: 160 },
    type: 'shelter',
    displayName: 'Shelter',
    radius: 40,
  },
];

export function getBeachAnchor(id: string): BeachAnchor | undefined {
  return BEACH_ANCHORS.find(a => a.id === id);
}

export function getAnchorsByType(type: BeachAnchor['type']): BeachAnchor[] {
  return BEACH_ANCHORS.filter(a => a.type === type);
}

export function isInAnchorRadius(worldPos: { x: number; z: number }, anchorId: string): boolean {
  const anchor = getBeachAnchor(anchorId);
  if (!anchor || !anchor.radius) return false;

  const dx = worldPos.x - anchor.worldPos.x;
  const dz = worldPos.z - anchor.worldPos.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  return distance <= anchor.radius;
}
