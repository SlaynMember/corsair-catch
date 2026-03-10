import { describe, it, expect } from 'vitest';
import {
  FishingPhase,
  createFishingState,
  startCast,
  updateCast,
  releaseCast,
  updateWait,
  startReel,
  updateReel,
  resetFishing,
} from '../src/systems/FishingSystem';
import { ZONES } from '../src/data/zone-db';

const testZone = ZONES[0]; // Sunlit Shallows

describe('Fishing Cast Phase', () => {
  it('should start in idle phase', () => {
    const state = createFishingState();
    expect(state.phase).toBe('idle');
  });

  it('should transition to cast phase', () => {
    const state = createFishingState();
    startCast(state);
    expect(state.phase).toBe('cast');
    expect(state.castPower).toBe(0);
  });

  it('should increase cast power over time', () => {
    const state = createFishingState();
    startCast(state);
    updateCast(state, 0.5);
    expect(state.castPower).toBeGreaterThan(0);
  });

  it('should oscillate cast power between 0 and 1', () => {
    const state = createFishingState();
    startCast(state);
    // Run long enough to hit the ceiling
    for (let i = 0; i < 20; i++) updateCast(state, 0.1);
    expect(state.castPower).toBeLessThanOrEqual(1);
    expect(state.castPower).toBeGreaterThanOrEqual(0);
  });
});

describe('Fishing Wait Phase', () => {
  it('should transition to wait phase on release', () => {
    const state = createFishingState();
    startCast(state);
    updateCast(state, 0.3);
    releaseCast(state, testZone);
    expect(state.phase).toBe('wait');
    expect(state.waitDuration).toBeGreaterThan(0);
  });

  it('should transition to bite after wait duration', () => {
    const state = createFishingState();
    startCast(state);
    releaseCast(state, testZone);

    // Fast forward past wait duration
    for (let i = 0; i < 100; i++) {
      updateWait(state, 0.1);
      if (state.phase !== 'wait') break;
    }
    expect(state.phase).toBe('bite');
  });
});

describe('Fishing Reel Phase', () => {
  it('should transition to reel phase', () => {
    const state = createFishingState();
    startCast(state);
    releaseCast(state, testZone);
    // Skip to bite
    state.phase = 'bite';
    startReel(state);
    expect(state.phase).toBe('reel');
    expect(state.tension).toBeGreaterThan(0);
  });

  it('should increase tension over time', () => {
    const state = createFishingState();
    startCast(state);
    releaseCast(state, testZone);
    state.phase = 'bite';
    startReel(state);

    const startTension = state.tension;
    updateReel(state, 1.0, false);

    if ((state.phase as FishingPhase) === 'reel') {
      expect(state.tension).toBeGreaterThan(startTension);
    }
  });

  it('should decrease tension and fish HP when reeling', () => {
    const state = createFishingState();
    startCast(state);
    releaseCast(state, testZone);
    state.phase = 'bite';
    startReel(state);

    const startFishHp = state.fishHp;
    updateReel(state, 0.01, true); // Very small dt to avoid line snap

    expect(state.fishHp).toBeLessThan(startFishHp);
  });

  it('should snap line at max tension', () => {
    const state = createFishingState();
    startCast(state);
    releaseCast(state, testZone);
    state.phase = 'bite';
    startReel(state);

    // Let tension build to max
    for (let i = 0; i < 50; i++) {
      updateReel(state, 0.2, false);
      if ((state.phase as FishingPhase) !== 'reel') break;
    }
    expect(state.phase).toBe('escaped');
  });

  it('should catch fish when fish HP reaches 0', () => {
    const state = createFishingState();
    startCast(state);
    releaseCast(state, testZone);
    state.phase = 'bite';
    startReel(state);

    // Reel aggressively in very small time steps so tension stays low
    for (let i = 0; i < 200; i++) {
      updateReel(state, 0.001, true);
      if ((state.phase as FishingPhase) !== 'reel') break;
    }
    expect(state.phase).toBe('caught');
    expect(state.caughtFish).not.toBeNull();
  });
});

describe('Fishing Reset', () => {
  it('should reset to initial state', () => {
    const state = createFishingState();
    startCast(state);
    state.castPower = 0.8;
    resetFishing(state);
    expect(state.phase).toBe('idle');
    expect(state.castPower).toBe(0);
  });
});
