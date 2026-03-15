import { FISH_SPECIES, FishInstance } from './fish-db';

export interface EnemyTemplate {
  id: string;
  name: string;
  party: { speciesId: string; level: number; moves: string[] }[];
  patrolWaypoints: { x: number; z: number }[];
  aggroRadius: number;
  shipColor?: number;
  shipScale?: number;
}

export const ENEMIES: EnemyTemplate[] = [
  {
    id: 'rival_captain',
    name: 'Captain Barnacle',
    party: [
      { speciesId: 'ember_snapper', level: 8, moves: ['flame_jet', 'tackle'] },
      { speciesId: 'tidecaller', level: 7, moves: ['tidal_wave', 'tackle'] },
      { speciesId: 'volt_eel', level: 9, moves: ['lightning_lash', 'static_shock'] },
    ],
    patrolWaypoints: [
      { x: 525, z: -375 },
      { x: 675, z: -225 },
      { x: 600, z: -525 },
      { x: 450, z: -450 },
    ],
    aggroRadius: 200,
    shipColor: 0x1a0e08,
  },
  {
    id: 'admiral_ironhook',
    name: 'Admiral Ironhook',
    party: [
      { speciesId: 'infernoray', level: 11, moves: ['flame_jet', 'inferno_dive', 'scorch'] },
      { speciesId: 'tsunamaw', level: 10, moves: ['tidal_wave', 'aqua_fang', 'bubble_burst'] },
      { speciesId: 'shockjaw', level: 12, moves: ['thunder_fang', 'surge_strike', 'static_shock'] },
    ],
    patrolWaypoints: [
      { x: -600, z: 300 },
      { x: -450, z: 525 },
      { x: -300, z: 375 },
      { x: -525, z: 225 },
    ],
    aggroRadius: 250,
    shipColor: 0x0a1428,
    shipScale: 1.2,
  },
  {
    id: 'dread_corsair',
    name: 'The Dread Corsair',
    party: [
      { speciesId: 'depthwalker', level: 14, moves: ['shadow_bite', 'void_pulse', 'abyss_drain', 'dread_gaze'] },
      { speciesId: 'tempestfang', level: 13, moves: ['gale_slash', 'storm_surge', 'thunder_fang'] },
      { speciesId: 'blazefin', level: 15, moves: ['scorch', 'inferno_dive', 'ember_bite', 'flame_jet'] },
    ],
    patrolWaypoints: [
      { x: 1200, z: 1200 },
      { x: -1000, z: 900 },
      { x: -900, z: -900 },
      { x: 1000, z: -1000 },
    ],
    aggroRadius: 300,
    shipColor: 0x1a0808,
    shipScale: 1.4,
  },
];

// ── Species name → numeric ID resolver ──────────────────────────────────────

/** Map of lowercase_underscore species name → numeric ID */
const SPECIES_NAME_MAP: Record<string, number> = {};
FISH_SPECIES.forEach(s => {
  const key = s.name.toLowerCase().replace(/\s+/g, '_');
  SPECIES_NAME_MAP[key] = s.id;
});

/** Resolve a string speciesId (e.g. 'ember_snapper') to a numeric fish-db ID. Returns 0 if not found. */
export function resolveSpeciesId(name: string): number {
  return SPECIES_NAME_MAP[name.toLowerCase()] ?? 0;
}

/** Build a FishInstance[] party from an EnemyTemplate for BattleScene consumption. */
export function buildBossParty(template: EnemyTemplate): FishInstance[] {
  return template.party.map((entry, i) => {
    const numericId = resolveSpeciesId(entry.speciesId);
    const species = FISH_SPECIES.find(s => s.id === numericId);
    const baseHp = species ? species.baseStats.hp + entry.level * 2 : 50 + entry.level * 2;
    return {
      uid: `boss_${template.id}_${i}_${Date.now()}`,
      speciesId: numericId,
      nickname: species?.name ?? entry.speciesId,
      level: entry.level,
      xp: 0,
      currentHp: baseHp,
      maxHp: baseHp,
      moves: entry.moves,
      iv: { hp: 12, attack: 12, defense: 12, speed: 12 },
    };
  });
}
