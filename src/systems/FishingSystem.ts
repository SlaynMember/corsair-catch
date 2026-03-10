import { FishInstance, FISH_SPECIES, createFishInstance, getFishById } from '../data/fish-db';
import { ZoneDefinition, EncounterEntry } from '../data/zone-db';
import { CAST_POWER_SPEED, WAIT_TIME_MIN, WAIT_TIME_MAX, TENSION_RISE_RATE, TENSION_DROP_PER_REEL, FISH_HP_DAMAGE_MIN, FISH_HP_DAMAGE_MAX, MAX_TENSION } from '../data/constants';
import { randomRange, weightedRandom, randomInt, clamp } from '../utils/math';

export type FishingPhase = 'cast' | 'wait' | 'bite' | 'reel' | 'caught' | 'escaped' | 'idle';

export interface FishingState {
  phase: FishingPhase;
  castPower: number;
  castDirection: 1 | -1;
  waitTimer: number;
  waitDuration: number;
  tension: number;
  fishHp: number;
  fishMaxHp: number;
  hookedSpecies: string | null;
  hookedLevel: number;
  caughtFish: FishInstance | null;
  message: string;
  finalCastPower: number; // Saved cast power for damage scaling
}

export function createFishingState(): FishingState {
  return {
    phase: 'idle',
    castPower: 0,
    castDirection: 1,
    waitTimer: 0,
    waitDuration: 0,
    tension: 0,
    fishHp: 1,
    fishMaxHp: 1,
    hookedSpecies: null,
    hookedLevel: 1,
    caughtFish: null,
    message: 'Press SPACE to cast your line!',
    finalCastPower: 0,
  };
}

export function startCast(state: FishingState): void {
  state.phase = 'cast';
  state.castPower = 0;
  state.castDirection = 1;
  state.message = 'Hold SPACE to charge... release to cast!';
}

export function updateCast(state: FishingState, dt: number): void {
  state.castPower += CAST_POWER_SPEED * dt * state.castDirection;
  if (state.castPower >= 1) {
    state.castPower = 1;
    state.castDirection = -1;
  } else if (state.castPower <= 0) {
    state.castPower = 0;
    state.castDirection = 1;
  }
}

export function releaseCast(state: FishingState, zone: ZoneDefinition): void {
  state.phase = 'wait';
  state.finalCastPower = state.castPower; // Save for damage scaling
  state.waitDuration = randomRange(WAIT_TIME_MIN, WAIT_TIME_MAX);
  // Better cast power = shorter wait, zone difficulty adds time
  state.waitDuration *= (1.5 - state.castPower * 0.5);
  state.waitDuration += (zone.difficulty - 1) * 0.5;
  state.waitTimer = 0;
  state.message = 'Waiting for a bite...';

  // Determine what fish is on this cast
  const encounter = rollEncounter(zone);
  if (encounter) {
    state.hookedSpecies = encounter.speciesId;
    state.hookedLevel = randomInt(encounter.minLevel, encounter.maxLevel);
    const difficulty = zone.difficulty;
    state.fishMaxHp = 1.0 + difficulty * 0.15;
    state.fishHp = state.fishMaxHp;
  }
}

function rollEncounter(zone: ZoneDefinition): EncounterEntry | null {
  if (zone.encounterTable.length === 0) return null;
  return weightedRandom(
    zone.encounterTable.map((e) => ({ item: e, weight: e.weight }))
  );
}

export function updateWait(state: FishingState, dt: number): void {
  state.waitTimer += dt;
  if (state.waitTimer >= state.waitDuration) {
    state.phase = 'bite';
    state.message = '!! A fish is biting! Press SPACE to reel!';
  }
}

export function startReel(state: FishingState): void {
  if (state.phase !== 'bite') return;
  state.phase = 'reel';
  state.tension = 0.3;
  state.message = 'Tap SPACE to reel in! Watch the tension!';
}

export function updateReel(state: FishingState, dt: number, isReeling: boolean): void {
  // Tension always rises (fish is fighting)
  state.tension += TENSION_RISE_RATE * dt;

  if (isReeling) {
    state.tension -= TENSION_DROP_PER_REEL;
    // Damage scales with cast power squared: weak cast barely scratches, perfect cast reels hard
    const powerCurve = state.finalCastPower * state.finalCastPower;
    const damage = FISH_HP_DAMAGE_MIN + (FISH_HP_DAMAGE_MAX - FISH_HP_DAMAGE_MIN) * powerCurve;
    state.fishHp -= damage;
  }

  state.tension = clamp(state.tension, 0, MAX_TENSION);

  if (state.tension >= MAX_TENSION) {
    state.phase = 'escaped';
    state.message = 'The line snapped! The fish got away...';
    return;
  }

  if (state.fishHp <= 0) {
    // Fish caught!
    if (state.hookedSpecies) {
      state.caughtFish = createFishInstance(state.hookedSpecies, state.hookedLevel);
      const species = getFishById(state.hookedSpecies);
      const name = species?.name || 'Unknown Fish';
      state.phase = 'caught';
      state.message = `You caught a ${name} (Lv. ${state.hookedLevel})!`;
    } else {
      state.phase = 'escaped';
      state.message = 'The fish got away...';
    }
  }
}

export function canReelAgain(state: FishingState): boolean {
  return state.phase === 'reel' && state.tension < MAX_TENSION && state.fishHp > 0;
}

export function resetFishing(state: FishingState): void {
  Object.assign(state, createFishingState());
}
