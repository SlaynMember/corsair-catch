import type { Component } from '../core/ECS';
import type { FishInstance } from '../data/fish-db';

export interface ShipComponent extends Component {
  type: 'ship';
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
}

export function createShip(
  name: string,
  isPlayer: boolean,
  maxPartySize = 3
): ShipComponent {
  return {
    type: 'ship',
    name,
    hullHp: 100,
    maxHullHp: 100,
    party: [],
    maxPartySize,
    isPlayer,
    items: {},
    gold: 0,
    baitInventory: {},
    discoveredTreasures: [],
  };
}
