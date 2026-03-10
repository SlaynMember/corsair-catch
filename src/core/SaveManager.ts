import type { FishInstance } from '../data/fish-db';

const SAVE_KEY = 'corsair-catch-save';

/**
 * Complete SaveData interface with all inventory and ship fields.
 */
export interface SaveData {
  // Position & player data
  playerX: number;
  playerZ: number;
  playerRotation: number;
  playtime?: number;

  // Ship & crew
  shipId: number;               // Which ship the player owns
  party: FishInstance[];
  maxPartySize?: number;
  hullHp?: number;              // Current hull durability

  // Inventory
  gold?: number;
  items?: Record<string, number>;
  baitInventory?: Record<string, number>;
  discoveredTreasures?: string[];
}

/**
 * Save game state to localStorage.
 * @param data Complete SaveData with all required fields
 */
export function saveGame(data: SaveData): void {
  try {
    const sanitized: SaveData = {
      playerX: data.playerX,
      playerZ: data.playerZ,
      playerRotation: data.playerRotation,
      shipId: data.shipId ?? 1,  // Default to starter ship if not specified
      party: data.party ?? [],
      maxPartySize: data.maxPartySize,
      hullHp: data.hullHp,
      playtime: data.playtime,
      gold: data.gold ?? 0,
      items: data.items ?? {},
      baitInventory: data.baitInventory ?? {},
      discoveredTreasures: data.discoveredTreasures ?? [],
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(sanitized));
  } catch (err) {
    console.error('Failed to save game:', err);
    // localStorage may be full or unavailable
  }
}

/**
 * Load game state from localStorage.
 * @returns Parsed SaveData with defaults applied, or null if no save found
 */
export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;

    // Provide defaults for new fields (backwards compatibility)
    return {
      shipId: data.shipId ?? 1,
      gold: data.gold ?? 0,
      items: data.items ?? {},
      baitInventory: data.baitInventory ?? {},
      discoveredTreasures: data.discoveredTreasures ?? [],
      ...data,  // Spread to preserve all other fields
    };
  } catch (err) {
    console.error('Failed to load game:', err);
    return null;
  }
}

export function hasSave(): boolean {
  return !!localStorage.getItem(SAVE_KEY);
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
