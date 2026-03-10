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
