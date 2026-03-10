export interface EncounterEntry {
  speciesId: string;
  weight: number;
  minLevel: number;
  maxLevel: number;
}

export interface ZoneDefinition {
  id: string;
  name: string;
  position: { x: number; z: number };
  radius: number;
  color: string;
  encounterTable: EncounterEntry[];
  difficulty: number;
  islandId?: string; // Which island this zone belongs to
}

export const ZONES: ZoneDefinition[] = [
  {
    id: 'zone_shallows',
    name: 'Sunlit Shallows',
    position: { x: 300, z: -225 },
    radius: 120,
    color: '#4682B4',
    difficulty: 1,
    islandId: 'sunlit_cove',
    encounterTable: [
      { speciesId: 'tidecaller', weight: 35, minLevel: 3, maxLevel: 7 },
      { speciesId: 'tidecaster', weight: 25, minLevel: 3, maxLevel: 6 },
      { speciesId: 'coralline', weight: 20, minLevel: 4, maxLevel: 7 },
      { speciesId: 'coral_guardian', weight: 10, minLevel: 5, maxLevel: 8 },
      { speciesId: 'tsunamaw', weight: 5, minLevel: 5, maxLevel: 8 },
      { speciesId: 'voidfin', weight: 3, minLevel: 6, maxLevel: 9 },
      { speciesId: 'galecutter', weight: 2, minLevel: 6, maxLevel: 10 },
    ],
  },
  {
    id: 'zone_volcanic',
    name: 'Volcanic Vent',
    position: { x: -375, z: 150 },
    radius: 110,
    color: '#FF6347',
    difficulty: 2,
    islandId: 'volcanic_isle',
    encounterTable: [
      { speciesId: 'ember_snapper', weight: 30, minLevel: 5, maxLevel: 10 },
      { speciesId: 'infernoray', weight: 20, minLevel: 7, maxLevel: 11 },
      { speciesId: 'voidfin', weight: 15, minLevel: 7, maxLevel: 11 },
      { speciesId: 'tidecaller', weight: 10, minLevel: 6, maxLevel: 9 },
      { speciesId: 'depthwalker', weight: 8, minLevel: 8, maxLevel: 12 },
      { speciesId: 'blazefin', weight: 5, minLevel: 9, maxLevel: 13 },
      { speciesId: 'abyssal_fang', weight: 5, minLevel: 8, maxLevel: 12 },
      { speciesId: 'reefguard', weight: 7, minLevel: 7, maxLevel: 10 },
    ],
  },
  {
    id: 'zone_storm',
    name: 'Storm Reach',
    position: { x: 750, z: 450 },
    radius: 135,
    color: '#FFD700',
    difficulty: 3,
    islandId: 'storm_reach',
    encounterTable: [
      { speciesId: 'volt_eel', weight: 20, minLevel: 8, maxLevel: 12 },
      { speciesId: 'volteel', weight: 15, minLevel: 9, maxLevel: 13 },
      { speciesId: 'galecutter', weight: 15, minLevel: 8, maxLevel: 12 },
      { speciesId: 'tempestfang', weight: 10, minLevel: 10, maxLevel: 14 },
      { speciesId: 'shockjaw', weight: 8, minLevel: 10, maxLevel: 14 },
      { speciesId: 'ember_snapper', weight: 10, minLevel: 8, maxLevel: 12 },
      { speciesId: 'coral_guardian', weight: 8, minLevel: 8, maxLevel: 12 },
      { speciesId: 'depthwalker', weight: 5, minLevel: 10, maxLevel: 15 },
      { speciesId: 'abyssal_fang', weight: 5, minLevel: 10, maxLevel: 15 },
      { speciesId: 'blazefin', weight: 4, minLevel: 11, maxLevel: 15 },
    ],
  },
];
