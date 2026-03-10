import { describe, it, expect, vi, afterEach } from 'vitest';
import { calculateDamage, initBattle, resolveTurn, selectAIAction, awardXp } from '../src/systems/BattleSystem';
import { createFishInstance, FISH_SPECIES, FishType } from '../src/data/fish-db';
import { MOVES } from '../src/data/move-db';
import { getEffectiveness } from '../src/data/type-chart';

describe('Type Effectiveness', () => {
  it('water should be super effective against fire', () => {
    expect(getEffectiveness(FishType.WATER, FishType.FIRE)).toBe(2.0);
  });

  it('fire should be super effective against coral', () => {
    expect(getEffectiveness(FishType.FIRE, FishType.CORAL)).toBe(2.0);
  });

  it('electric should be super effective against water', () => {
    expect(getEffectiveness(FishType.ELECTRIC, FishType.WATER)).toBe(2.0);
  });

  it('water should resist water', () => {
    expect(getEffectiveness(FishType.WATER, FishType.WATER)).toBe(0.5);
  });

  it('normal should be neutral against most types', () => {
    expect(getEffectiveness(FishType.NORMAL, FishType.WATER)).toBe(1.0);
    expect(getEffectiveness(FishType.NORMAL, FishType.FIRE)).toBe(1.0);
  });

  it('normal should be resisted by abyssal', () => {
    expect(getEffectiveness(FishType.NORMAL, FishType.ABYSSAL)).toBe(0.5);
  });
});

describe('Damage Calculation', () => {
  it('should produce positive damage for damaging moves', () => {
    const attacker = createFishInstance('ember_snapper', 10, ['flame_jet', 'tackle']);
    const defender = createFishInstance('tidecaller', 10, ['tidal_wave', 'tackle']);
    const move = MOVES['tackle'];
    const { damage } = calculateDamage(
      attacker, defender, move,
      { attack: 0, defense: 0 },
      { attack: 0, defense: 0 }
    );
    expect(damage).toBeGreaterThan(0);
  });

  it('should return 0 damage for status moves', () => {
    const attacker = createFishInstance('coral_guardian', 10, ['reef_barrier', 'tackle']);
    const defender = createFishInstance('ember_snapper', 10, ['flame_jet', 'tackle']);
    const move = MOVES['reef_barrier'];
    const { damage } = calculateDamage(
      attacker, defender, move,
      { attack: 0, defense: 0 },
      { attack: 0, defense: 0 }
    );
    expect(damage).toBe(0);
  });

  it('should apply STAB bonus when move type matches fish type', () => {
    const fire = createFishInstance('ember_snapper', 10, ['flame_jet', 'tackle']);
    const target = createFishInstance('volt_eel', 10, ['lightning_lash', 'tackle']);

    // Fire move from fire fish (STAB)
    const fireMove = MOVES['flame_jet'];
    const normalMove = MOVES['tackle'];

    // Run multiple times to average out random variance
    let stabTotal = 0;
    let nonStabTotal = 0;
    for (let i = 0; i < 100; i++) {
      stabTotal += calculateDamage(fire, target, fireMove, { attack: 0, defense: 0 }, { attack: 0, defense: 0 }).damage;
      nonStabTotal += calculateDamage(fire, target, normalMove, { attack: 0, defense: 0 }, { attack: 0, defense: 0 }).damage;
    }
    // STAB move should average higher (accounting for power difference: 60 vs 40)
    // With STAB: 60 * 1.5 = 90 effective, without: 40 * 1.0 = 40 effective
    expect(stabTotal / 100).toBeGreaterThan(nonStabTotal / 100);
  });
});

describe('Battle Flow', () => {
  it('should initialize a battle correctly', () => {
    const player = [createFishInstance('ember_snapper', 10, ['flame_jet', 'tackle'])];
    const enemy = [createFishInstance('tidecaller', 10, ['tidal_wave', 'tackle'])];
    const battle = initBattle(player, enemy);

    expect(battle.phase).toBe('select');
    expect(battle.playerActive.fish).toBe(player[0]);
    expect(battle.enemyActive.fish).toBe(enemy[0]);
    expect(battle.turnNumber).toBe(1);
  });

  it('should resolve a turn and deal damage', () => {
    const player = [createFishInstance('volt_eel', 50, ['lightning_lash', 'tackle'])];
    const enemy = [createFishInstance('tidecaller', 5, ['tidal_wave', 'tackle'])];
    player[0].currentHp = player[0].maxHp;
    enemy[0].currentHp = enemy[0].maxHp;

    const battle = initBattle(player, enemy);
    const startHp = enemy[0].currentHp;

    resolveTurn(battle, { type: 'move', moveId: 'lightning_lash' }, { type: 'move', moveId: 'tackle' });

    // Electric vs Water = super effective, high level attacker should deal significant damage
    expect(enemy[0].currentHp).toBeLessThan(startHp);
  });

  it('should end battle when all enemy fish faint', () => {
    const player = [createFishInstance('volt_eel', 50, ['lightning_lash', 'tackle'])];
    const enemy = [createFishInstance('tidecaller', 3, ['tidal_wave', 'tackle'])];
    enemy[0].currentHp = 1; // One HP left

    const battle = initBattle(player, enemy);
    resolveTurn(battle, { type: 'move', moveId: 'lightning_lash' }, { type: 'move', moveId: 'tackle' });

    expect(battle.phase).toBe('victory');
  });

  it('should handle flee action', () => {
    // Force flee success (random < fleeChance always true when random = 0)
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const player = [createFishInstance('ember_snapper', 10, ['flame_jet', 'tackle'])];
    const enemy = [createFishInstance('tidecaller', 10, ['tidal_wave', 'tackle'])];

    const battle = initBattle(player, enemy);
    resolveTurn(battle, { type: 'flee' }, { type: 'move', moveId: 'tackle' });

    expect(battle.phase).toBe('fled');
    vi.restoreAllMocks();
  });
});

describe('AI Selection', () => {
  it('should select a move', () => {
    const player = [createFishInstance('ember_snapper', 10, ['flame_jet', 'tackle'])];
    const enemy = [createFishInstance('tidecaller', 10, ['tidal_wave', 'tackle'])];
    const battle = initBattle(player, enemy);

    const action = selectAIAction(battle);
    expect(action.type).toBe('move');
    if (action.type === 'move') {
      expect(enemy[0].moves).toContain(action.moveId);
    }
  });

  it('should prefer super-effective moves', () => {
    // Force best-move roll (< 0.7) to eliminate randomness
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const player = [createFishInstance('ember_snapper', 10, ['flame_jet', 'tackle'])];
    const enemy = [createFishInstance('tidecaller', 10, ['tidal_wave', 'tackle'])];
    const battle = initBattle(player, enemy);

    const action = selectAIAction(battle);
    // Tidecaller (Water) vs Ember Snapper (Fire): tidal_wave should be preferred (super effective)
    expect(action).toEqual({ type: 'move', moveId: 'tidal_wave' });
    vi.restoreAllMocks();
  });
});

describe('XP Award', () => {
  it('should award XP to winning fish', () => {
    const winner = [createFishInstance('ember_snapper', 5, ['flame_jet', 'tackle'])];
    const loser = [createFishInstance('tidecaller', 10, ['tidal_wave', 'tackle'])];
    winner[0].currentHp = winner[0].maxHp;

    const results = awardXp(winner, loser);
    expect(results.length).toBe(1);
    expect(results[0].xpGained).toBeGreaterThan(0);
  });
});
