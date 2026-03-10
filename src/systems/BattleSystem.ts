import { FishInstance, FISH_SPECIES, FishType, calcStat, getXpForLevel, getFishById } from '../data/fish-db';
import { MOVES, Move, MoveEffect } from '../data/move-db';
import { ITEMS } from '../data/item-db';
import { getEffectiveness } from '../data/type-chart';
import { STAB_BONUS, DAMAGE_RANDOM_MIN, DAMAGE_RANDOM_MAX, BURN_DAMAGE_FRACTION, PARALYZE_SKIP_CHANCE, XP_BASE_YIELD, MAX_LEVEL } from '../data/constants';
import { randomRange } from '../utils/math';

export type BattleAction =
  | { type: 'move'; moveId: string }
  | { type: 'swap'; fishIndex: number }
  | { type: 'flee' }
  | { type: 'item'; itemId: string; targetIndex: number };

export interface StatusEffect {
  type: 'burn' | 'paralyze';
  turnsRemaining: number;
}

export interface BattleFighter {
  fish: FishInstance;
  statMods: { attack: number; defense: number; speed: number };
  status: StatusEffect | null;
  movePp: Record<string, number>;
}

export interface BattleState {
  playerParty: FishInstance[];
  enemyParty: FishInstance[];
  playerActive: BattleFighter;
  enemyActive: BattleFighter;
  playerActiveIndex: number;
  enemyActiveIndex: number;
  log: string[];
  phase: 'select' | 'resolve' | 'faint_swap' | 'victory' | 'defeat' | 'fled';
  turnNumber: number;
}

function createFighter(fish: FishInstance): BattleFighter {
  const pp: Record<string, number> = {};
  for (const moveId of fish.moves) {
    const move = MOVES[moveId];
    if (move) pp[moveId] = move.pp;
  }
  return {
    fish,
    statMods: { attack: 0, defense: 0, speed: 0 },
    status: null,
    movePp: pp,
  };
}

function getEffectiveStat(fish: FishInstance, stat: 'attack' | 'defense' | 'speed', mod: number): number {
  const species = getFishById(fish.speciesId);
  if (!species) throw new Error(`Unknown species: ${fish.speciesId}`);

  // Map old stat names to new ones
  const statMap = { 'attack': 'atk', 'defense': 'def', 'speed': 'spd' };
  const mappedStat = statMap[stat as keyof typeof statMap] as 'atk' | 'def' | 'spd';
  const ivStat = stat as 'attack' | 'defense' | 'speed';

  const base = calcStat(species.baseStats[mappedStat], fish.iv[ivStat], fish.level);
  const multiplier = mod >= 0 ? (2 + mod) / 2 : 2 / (2 - mod);
  return Math.floor(base * multiplier);
}

function getEffectiveSpeed(fighter: BattleFighter): number {
  let speed = getEffectiveStat(fighter.fish, 'speed', fighter.statMods.speed);
  if (fighter.status?.type === 'paralyze') speed = Math.floor(speed * 0.5);
  return speed;
}

export function initBattle(playerParty: FishInstance[], enemyParty: FishInstance[]): BattleState {
  const pActive = playerParty.find(f => f.currentHp > 0)!;
  const eActive = enemyParty.find(f => f.currentHp > 0)!;
  const pi = playerParty.indexOf(pActive);
  const ei = enemyParty.indexOf(eActive);

  return {
    playerParty,
    enemyParty,
    playerActive: createFighter(pActive),
    enemyActive: createFighter(eActive),
    playerActiveIndex: pi,
    enemyActiveIndex: ei,
    log: [`Battle start! ${getFishById(pActive.speciesId).name} vs ${getFishById(eActive.speciesId).name}!`],
    phase: 'select',
    turnNumber: 1,
  };
}

export function calculateDamage(
  attacker: FishInstance,
  defender: FishInstance,
  move: Move,
  attackerMods: { attack: number; defense: number },
  defenderMods: { attack: number; defense: number }
): { damage: number; effectiveness: number; isCrit: boolean } {
  if (move.category === 'status') return { damage: 0, effectiveness: 1, isCrit: false };

  const level = attacker.level;
  const atkStat = getEffectiveStat(attacker, 'attack', attackerMods.attack);
  const defStat = getEffectiveStat(defender, 'defense', defenderMods.defense);

  const levelFactor = (2 * level / 5 + 2);
  let damage = (levelFactor * move.power * atkStat / defStat) / 50 + 2;

  // STAB
  const attackerSpecies = getFishById(attacker.speciesId);
  if (attackerSpecies && move.type === attackerSpecies.type) {
    damage *= STAB_BONUS;
  }

  // Type effectiveness
  const defenderSpecies = getFishById(defender.speciesId);
  const effectiveness = defenderSpecies ? getEffectiveness(move.type, defenderSpecies.type) : 1;
  damage *= effectiveness;

  // Critical hit check (6.25% = 1/16 chance)
  const isCrit = Math.random() < 0.0625;
  if (isCrit) {
    damage *= 1.5;
  }

  // Random roll
  damage *= randomRange(DAMAGE_RANDOM_MIN, DAMAGE_RANDOM_MAX);

  damage = Math.max(1, Math.floor(damage));

  return { damage, effectiveness, isCrit };
}

export function selectAIAction(state: BattleState): BattleAction {
  const enemy = state.enemyActive;
  const playerFish = state.playerActive.fish;
  const playerSpecies = getFishById(playerFish.speciesId);
  const enemySpecies = getFishById(enemy.fish.speciesId);

  // Consider swapping when at type disadvantage and healthy backup exists
  const typeDisadvantage = getEffectiveness(enemySpecies.type, playerSpecies.type) <= 0.5;
  if (typeDisadvantage && enemy.fish.currentHp > enemy.fish.maxHp * 0.4 && Math.random() < 0.4) {
    for (let i = 0; i < state.enemyParty.length; i++) {
      if (i === state.enemyActiveIndex) continue;
      const backup = state.enemyParty[i];
      if (backup.currentHp <= 0) continue;
      const backupSpecies = getFishById(backup.speciesId);
      const backupEff = getEffectiveness(backupSpecies.type, playerSpecies.type);
      if (backupEff >= 1.5 && backup.currentHp > backup.maxHp * 0.3) {
        return { type: 'swap', fishIndex: i };
      }
    }
  }

  type MoveScore = { moveId: string; score: number };
  const scores: MoveScore[] = [];

  for (const moveId of enemy.fish.moves) {
    const move = MOVES[moveId];
    if (!move || (enemy.movePp[moveId] ?? 0) <= 0) continue;

    let score = move.power;
    if (move.category === 'status') {
      score = 30;
      if (move.effect?.type === 'heal' && enemy.fish.currentHp < enemy.fish.maxHp * 0.5) {
        score = 80;
      }
    } else {
      if (move.type === enemySpecies.type) score *= STAB_BONUS;
      const eff = getEffectiveness(move.type, playerSpecies.type);
      score *= eff;

      const { damage } = calculateDamage(enemy.fish, playerFish, move, enemy.statMods, state.playerActive.statMods);
      if (damage >= playerFish.currentHp) score *= 2;
    }
    scores.push({ moveId, score });
  }

  if (scores.length === 0) return { type: 'move', moveId: 'struggle' };

  scores.sort((a, b) => b.score - a.score);

  // Add variety: 70% best move, 20% random move, 10% second-best (if available)
  const roll = Math.random();
  if (roll < 0.7 || scores.length === 1) {
    return { type: 'move', moveId: scores[0].moveId };
  } else if (roll < 0.9 && scores.length > 1) {
    return { type: 'move', moveId: scores[1].moveId };
  } else {
    const randomIndex = Math.floor(Math.random() * scores.length);
    return { type: 'move', moveId: scores[randomIndex].moveId };
  }
}

function applyMoveEffect(
  effect: MoveEffect,
  target: BattleFighter,
  user: BattleFighter,
  log: string[]
): void {
  if (Math.random() > effect.chance) return;

  const targetName = getFishById(target.fish.speciesId).name;
  const userName = getFishById(user.fish.speciesId).name;

  switch (effect.type) {
    case 'burn':
      if (!target.status) {
        target.status = { type: 'burn', turnsRemaining: 5 };
        log.push(`${targetName} was burned!`);
      }
      break;
    case 'paralyze':
      if (!target.status) {
        target.status = { type: 'paralyze', turnsRemaining: 4 };
        log.push(`${targetName} was paralyzed!`);
      }
      break;
    case 'heal': {
      const healAmount = Math.floor(user.fish.maxHp * (effect.magnitude ?? 0.3));
      user.fish.currentHp = Math.min(user.fish.maxHp, user.fish.currentHp + healAmount);
      log.push(`${userName} healed ${healAmount} HP!`);
      break;
    }
    case 'buff_attack':
      target.statMods.attack += effect.magnitude ?? 1;
      target.statMods.attack = Math.max(-6, Math.min(6, target.statMods.attack));
      log.push(`${targetName}'s attack ${(effect.magnitude ?? 1) > 0 ? 'rose' : 'fell'}!`);
      break;
    case 'buff_defense':
      user.statMods.defense += Math.abs(effect.magnitude ?? 1);
      user.statMods.defense = Math.max(-6, Math.min(6, user.statMods.defense));
      log.push(`${userName}'s defense rose!`);
      break;
    case 'debuff_defense':
      target.statMods.defense -= Math.abs(effect.magnitude ?? 1);
      target.statMods.defense = Math.max(-6, Math.min(6, target.statMods.defense));
      log.push(`${targetName}'s defense fell!`);
      break;
  }
}

function executeMove(
  attacker: BattleFighter,
  defender: BattleFighter,
  moveId: string,
  log: string[]
): void {
  const move = MOVES[moveId];
  if (!move) return;

  const attackerName = getFishById(attacker.fish.speciesId).name;
  const defenderName = getFishById(defender.fish.speciesId).name;

  // Check paralysis
  if (attacker.status?.type === 'paralyze' && Math.random() < PARALYZE_SKIP_CHANCE) {
    log.push(`${attackerName} is paralyzed and can't move!`);
    return;
  }

  log.push(`${attackerName} used ${move.name}!`);

  // PP
  if (attacker.movePp[moveId] !== undefined) {
    attacker.movePp[moveId]--;
  }

  // Accuracy check
  if (Math.random() * 100 > move.accuracy) {
    log.push(`${attackerName}'s attack missed!`);
    return;
  }

  if (move.category !== 'status') {
    const { damage, effectiveness, isCrit } = calculateDamage(
      attacker.fish, defender.fish, move, attacker.statMods, defender.statMods
    );
    defender.fish.currentHp = Math.max(0, defender.fish.currentHp - damage);
    log.push(`${defenderName} took ${damage} damage!`);

    if (isCrit) log.push('A critical hit!');
    if (effectiveness >= 2) log.push("It's super effective!");
    else if (effectiveness <= 0.5) log.push("It's not very effective...");
  }

  // Apply effects
  if (move.effect) {
    applyMoveEffect(move.effect, defender, attacker, log);
  }
}

function applyEndOfTurnEffects(fighter: BattleFighter, log: string[]): void {
  if (!fighter.status) return;
  const name = getFishById(fighter.fish.speciesId).name;

  if (fighter.status.type === 'burn') {
    const burnDamage = Math.max(1, Math.floor(fighter.fish.maxHp * BURN_DAMAGE_FRACTION));
    fighter.fish.currentHp = Math.max(0, fighter.fish.currentHp - burnDamage);
    log.push(`${name} was hurt by its burn! (${burnDamage} damage)`);
  }

  fighter.status.turnsRemaining--;
  if (fighter.status.turnsRemaining <= 0) {
    log.push(`${name} recovered from ${fighter.status.type}!`);
    fighter.status = null;
  }
}

export function resolveTurn(
  state: BattleState,
  playerAction: BattleAction,
  enemyAction: BattleAction
): void {
  state.log = [];
  state.turnNumber++;

  // Determine order
  type ActionEntry = { action: BattleAction; isPlayer: boolean; priority: number };
  const actions: ActionEntry[] = [];

  const getPriority = (action: BattleAction, fighter: BattleFighter): number => {
    if (action.type === 'flee') return 100;
    if (action.type === 'item') return 95;
    if (action.type === 'swap') return 90;
    return getEffectiveSpeed(fighter);
  };

  actions.push({ action: playerAction, isPlayer: true, priority: getPriority(playerAction, state.playerActive) });
  actions.push({ action: enemyAction, isPlayer: false, priority: getPriority(enemyAction, state.enemyActive) });

  // Higher priority goes first; speed tie = random
  actions.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    return Math.random() > 0.5 ? 1 : -1;
  });

  for (const entry of actions) {
    // Check if the actor's fish already fainted
    const actor = entry.isPlayer ? state.playerActive : state.enemyActive;
    if (actor.fish.currentHp <= 0) continue;

    if (entry.action.type === 'flee') {
      if (entry.isPlayer) {
        // Flee chance based on speed comparison — faster fish escape more easily
        const playerSpeed = getEffectiveSpeed(state.playerActive);
        const enemySpeed = getEffectiveSpeed(state.enemyActive);
        const fleeChance = Math.min(0.95, 0.5 + (playerSpeed - enemySpeed) * 0.02 + state.turnNumber * 0.1);
        if (Math.random() < fleeChance) {
          state.log.push('You fled the battle!');
          state.phase = 'fled';
          return;
        }
        state.log.push("Couldn't escape!");
      } else {
        state.log.push('The enemy fled!');
        state.phase = 'victory';
        return;
      }
    }

    if (entry.action.type === 'item' && entry.isPlayer) {
      const item = ITEMS[entry.action.itemId];
      if (item) {
        const targetParty = state.playerParty;
        const target = targetParty[entry.action.targetIndex];
        if (target) {
          const name = getFishById(target.speciesId).name;
          if (item.effect.revive && target.currentHp <= 0) {
            target.currentHp = Math.max(1, Math.floor(target.maxHp * 0.25));
            state.log.push(`Used ${item.name}! ${name} was revived!`);
          } else if (item.effect.heal && target.currentHp > 0) {
            const heal = Math.floor(target.maxHp * item.effect.heal);
            target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
            state.log.push(`Used ${item.name}! ${name} restored ${heal} HP!`);
          } else if (item.effect.cureStatus) {
            const fighter = state.playerActiveIndex === entry.action.targetIndex ? state.playerActive : null;
            if (fighter?.status) {
              const statusName = fighter.status.type;
              fighter.status = null;
              state.log.push(`Used ${item.name}! Cured ${name}'s ${statusName}!`);
            } else {
              state.log.push(`Used ${item.name}! But it had no effect...`);
            }
          } else {
            state.log.push(`Used ${item.name}!`);
          }
        }
      }
      continue;
    }

    if (entry.action.type === 'swap') {
      const party = entry.isPlayer ? state.playerParty : state.enemyParty;
      const newFish = party[entry.action.fishIndex];
      if (newFish && newFish.currentHp > 0) {
        const oldName = getFishById(actor.fish.speciesId).name;
        const newName = getFishById(newFish.speciesId).name;
        state.log.push(`${oldName} was swapped out for ${newName}!`);
        const newFighter = createFighter(newFish);
        if (entry.isPlayer) {
          state.playerActive = newFighter;
          state.playerActiveIndex = entry.action.fishIndex;
        } else {
          state.enemyActive = newFighter;
          state.enemyActiveIndex = entry.action.fishIndex;
        }
      }
      continue;
    }

    if (entry.action.type === 'move') {
      const defender = entry.isPlayer ? state.enemyActive : state.playerActive;
      executeMove(actor, defender, entry.action.moveId, state.log);
    }
  }

  // End of turn effects
  if (state.playerActive.fish.currentHp > 0) {
    applyEndOfTurnEffects(state.playerActive, state.log);
  }
  if (state.enemyActive.fish.currentHp > 0) {
    applyEndOfTurnEffects(state.enemyActive, state.log);
  }

  // Check for faints
  const checkFaint = (isPlayer: boolean): boolean => {
    const active = isPlayer ? state.playerActive : state.enemyActive;
    const party = isPlayer ? state.playerParty : state.enemyParty;
    if (active.fish.currentHp <= 0) {
      const name = getFishById(active.fish.speciesId).name;
      state.log.push(`${name} fainted!`);
      const nextAlive = party.findIndex((f) => f.currentHp > 0 && f !== active.fish);
      if (nextAlive === -1) {
        state.phase = isPlayer ? 'defeat' : 'victory';
        return true;
      }
      if (!isPlayer) {
        // AI auto-swaps
        const newFighter = createFighter(party[nextAlive]);
        state.enemyActive = newFighter;
        state.enemyActiveIndex = nextAlive;
        state.log.push(`The enemy sent out ${getFishById(party[nextAlive].speciesId).name}!`);
      } else {
        state.phase = 'faint_swap';
        return true;
      }
    }
    return false;
  };

  if (checkFaint(false)) return; // Check enemy first
  if (checkFaint(true)) return;

  state.phase = 'select';
}

export interface XpResult {
  fish: FishInstance;
  xpGained: number;
  levelsGained: number;
  newMoves: string[];
  statGrowth?: { hp: number; attack: number; defense: number; speed: number };
}

export function awardXp(winner: FishInstance[], loserParty: FishInstance[]): XpResult[] {
  const results: XpResult[] = [];

  const totalEnemyLevel = loserParty.reduce((sum, f) => sum + f.level, 0);
  const baseXp = XP_BASE_YIELD * totalEnemyLevel / loserParty.length;

  for (const fish of winner) {
    if (fish.currentHp <= 0) continue;
    const xpGained = Math.floor(baseXp / winner.filter(f => f.currentHp > 0).length);
    fish.xp += xpGained;

    let levelsGained = 0;
    const newMoves: string[] = [];
    // Capture stats before leveling for delta display
    const species = getFishById(fish.speciesId);
    const prevHp = fish.maxHp;
    const prevAtk = calcStat(species.baseStats.atk, fish.iv.attack, fish.level);
    const prevDef = calcStat(species.baseStats.def, fish.iv.defense, fish.level);
    const prevSpd = calcStat(species.baseStats.spd, fish.iv.speed, fish.level);
    while (fish.level < MAX_LEVEL && fish.xp >= getXpForLevel(fish.level + 1)) {
      fish.xp -= getXpForLevel(fish.level + 1);
      fish.level++;
      levelsGained++;
      // Recalculate max HP
      const newMaxHp = calcStat(species.baseStats.hp, fish.iv.hp, fish.level, true);
      const hpIncrease = newMaxHp - fish.maxHp;
      fish.maxHp = newMaxHp;
      fish.currentHp = Math.min(fish.maxHp, fish.currentHp + hpIncrease);

      // Learn new moves from pool on level-up
      const unlearnedMoves = species.moves.filter(m => !fish.moves.includes(m));
      if (unlearnedMoves.length > 0) {
        const newMove = unlearnedMoves[0];
        if (fish.moves.length < 4) {
          fish.moves.push(newMove);
          newMoves.push(newMove);
        } else {
          // Replace weakest move — score status moves as 40 so they aren't
          // permanently stuck behind any physical move with power > 0
          const moveScore = (m: typeof MOVES[string] | undefined) =>
            !m ? 0 : m.category === 'status' ? 40 : (m.power ?? 0);
          let weakestIdx = 0;
          let weakestScore = Infinity;
          for (let i = 0; i < fish.moves.length; i++) {
            const s = moveScore(MOVES[fish.moves[i]]);
            if (s < weakestScore) {
              weakestScore = s;
              weakestIdx = i;
            }
          }
          const candidateScore = moveScore(MOVES[newMove]);
          if (candidateScore > weakestScore) {
            fish.moves[weakestIdx] = newMove;
            newMoves.push(newMove);
          }
        }
      }
    }

    const statGrowth = levelsGained > 0 ? {
      hp: fish.maxHp - prevHp,
      attack: calcStat(species.baseStats.atk, fish.iv.attack, fish.level) - prevAtk,
      defense: calcStat(species.baseStats.def, fish.iv.defense, fish.level) - prevDef,
      speed: calcStat(species.baseStats.spd, fish.iv.speed, fish.level) - prevSpd,
    } : undefined;
    results.push({ fish, xpGained, levelsGained, newMoves, statGrowth });
  }

  return results;
}
