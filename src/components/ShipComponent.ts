import type { Component } from '../core/ECS';
import type { FishInstance } from '../data/fish-db';
import { getShipById } from '../data/ship-db';

export interface ShipComponent extends Component {
  type: 'ship';
  shipId: number; // Reference to ship-db.ts
  name: string;
  hullHp: number;
  maxHullHp: number;
  party: FishInstance[];
  maxPartySize: number;
  isPlayer: boolean;
  items: Record<string, number>;
  gold?: number;
  baitInventory?: Record<string, number>;
  discoveredTreasures?: string[];
  fishCaught?: number; // Lifetime fish caught for ship unlocks
}

export function createShip(
  shipId: number,
  name: string,
  isPlayer: boolean,
  maxPartySize = 3
): ShipComponent {
  const shipBlueprint = getShipById(shipId);
  const maxHull = shipBlueprint?.baseStats.hull ?? 100;

  return {
    type: 'ship',
    shipId,
    name,
    hullHp: maxHull,
    maxHullHp: maxHull,
    party: [],
    maxPartySize,
    isPlayer,
    items: {},
    gold: 0,
    baitInventory: {},
    discoveredTreasures: [],
    fishCaught: 0,
  };
}
