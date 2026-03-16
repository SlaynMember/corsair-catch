import { FishInstance } from '../data/fish-db';

// ── Save Data Interface ────────────────────────────────────────────────────────
export interface SaveData {
  playerX: number;
  playerY: number;
  party: FishInstance[];
  inventory: Record<string, number>;
  collectedItems: string[];    // IDs of ground items already picked up
  defeatedBosses: string[];    // IDs of defeated boss captains
  hasRod: boolean;             // player has a fishing rod
  starterChosen: boolean;
  playtime: number;          // seconds
  savedAt: number;           // Date.now() timestamp
}

const SAVE_KEY = 'corsair-catch-save';
const AUTO_SAVE_INTERVAL = 60_000; // 60 seconds

// ── Pure functions (no Phaser dependency) ──────────────────────────────────────

/** Check if a save exists in localStorage */
export function hasSave(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

/** Load save data from localStorage. Returns null if no save or corrupt data. */
export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    // Basic validation
    if (typeof data.playerX !== 'number' || typeof data.playerY !== 'number') return null;
    if (!Array.isArray(data.party)) return null;
    // Backward compatibility defaults
    data.defeatedBosses = data.defeatedBosses ?? [];
    return data;
  } catch {
    return null;
  }
}

/** Serialize and write save data to localStorage */
export function saveGame(data: SaveData): boolean {
  try {
    data.savedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** Delete save data */
export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // silently fail
  }
}

// ── Phaser scene helper: gather state + save ───────────────────────────────────

/** Collect current game state from a BeachScene and save it */
export function saveFromScene(scene: Phaser.Scene, player: { x: number; y: number }, starterChosen: boolean, playtime: number): boolean {
  const party = (scene.registry.get('party') as FishInstance[]) || [];
  const inventory = (scene.registry.get('inventory') as Record<string, number>) || {};
  const collectedItems = (scene.registry.get('collectedItems') as string[]) || [];
  const defeatedBosses = (scene.registry.get('defeatedBosses') as string[]) || [];
  const hasRod = scene.registry.get('hasRod') === true;

  const data: SaveData = {
    playerX: player.x,
    playerY: player.y,
    party,
    inventory,
    collectedItems,
    defeatedBosses,
    hasRod,
    starterChosen,
    playtime,
    savedAt: Date.now(),
  };

  return saveGame(data);
}

// ── Auto-save timer management ─────────────────────────────────────────────────

/**
 * Start the auto-save timer on a Phaser scene.
 * Returns the timer event so it can be cancelled if needed.
 */
export function startAutoSave(
  scene: Phaser.Scene,
  getPlayer: () => { x: number; y: number },
  getStarterChosen: () => boolean,
  getPlaytime: () => number,
): Phaser.Time.TimerEvent {
  return scene.time.addEvent({
    delay: AUTO_SAVE_INTERVAL,
    loop: true,
    callback: () => {
      const p = getPlayer();
      saveFromScene(scene, p, getStarterChosen(), getPlaytime());
    },
  });
}
