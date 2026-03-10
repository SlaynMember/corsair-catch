import type { GameState, StateMachine } from '../core/StateMachine';
import type { PixiContext } from '../rendering/PixiContext';
import type { UIManager } from '../ui/UIManager';
import type { ShipComponent } from '../components/ShipComponent';
import { FISH_SPECIES, getXpForLevel } from '../data/fish-db';
import {
  initBattle,
  resolveTurn,
  selectAIAction,
  awardXp,
  BattleState as BState,
  BattleAction,
} from '../systems/BattleSystem';
import { MOVES } from '../data/move-db';
import { ITEMS } from '../data/item-db';
import { showBattleUI, showBattleResult, hideBattleUI } from '../ui/BattleUI';
import { audio } from '../core/AudioManager';

const MOVE_TYPE_FLASH_COLORS: Record<string, string> = {
  fire: 'rgba(232,88,48,0.2)', water: 'rgba(48,144,208,0.2)',
  electric: 'rgba(232,200,32,0.2)', coral: 'rgba(224,104,160,0.2)',
  abyssal: 'rgba(120,72,184,0.2)', storm: 'rgba(96,184,224,0.2)',
  normal: 'rgba(160,160,120,0.15)',
};

export class BattleState implements GameState {
  private battle!: BState;
  private resolving = false;
  private resolveTimer = 0;

  constructor(
    private pixiCtx: PixiContext,
    private ui: UIManager,
    private stateMachine: StateMachine,
    private playerShip: ShipComponent,
    private enemyShip: ShipComponent,
    private onBattleEnd?: () => void
  ) {}

  enter(): void {
    this.battle = initBattle(this.playerShip.party, this.enemyShip.party);
    audio.playBGM('battle');
    this.showUI();
  }

  private showUI(): void {
    showBattleUI(
      this.ui,
      this.battle,
      (moveId) => this.onPlayerAction({ type: 'move', moveId }),
      (index) => this.onPlayerAction({ type: 'swap', fishIndex: index }),
      () => this.onPlayerAction({ type: 'flee' }),
      this.playerShip.items,
      (itemId, targetIndex) => this.onPlayerAction({ type: 'item', itemId, targetIndex })
    );
  }

  private onPlayerAction(action: BattleAction): void {
    if (this.resolving) return;

    if (this.battle.phase === 'faint_swap' && action.type === 'swap') {
      const newFish = this.battle.playerParty[action.fishIndex];
      if (newFish && newFish.currentHp > 0) {
        const movePp: Record<string, number> = {};
        for (const moveId of newFish.moves) {
          const move = MOVES[moveId];
          if (move) movePp[moveId] = move.pp;
        }
        this.battle.playerActive = {
          fish: newFish,
          statMods: { attack: 0, defense: 0, speed: 0 },
          status: null,
          movePp,
        };
        this.battle.playerActiveIndex = action.fishIndex;
        this.battle.log = [
          `Go, ${FISH_SPECIES[newFish.speciesId].name}!`,
        ];
        this.battle.phase = 'select';
        this.showUI();
      }
      return;
    }

    if (this.battle.phase !== 'select') return;

    // Consume item from inventory before resolving
    if (action.type === 'item') {
      const qty = this.playerShip.items[action.itemId] ?? 0;
      if (qty <= 0) return;
      this.playerShip.items[action.itemId]--;
    }

    // Capture HP before turn for damage number display
    const prevPlayerHp = this.battle.playerActive.fish.currentHp;
    const prevEnemyHp = this.battle.enemyActive.fish.currentHp;

    this.resolving = true;
    const enemyAction = selectAIAction(this.battle);
    resolveTurn(this.battle, action, enemyAction);

    // Show battle effects based on log entries
    this.showBattleEffects(prevPlayerHp, prevEnemyHp);

    // Update HP bars in-place so CSS transitions animate the drain
    this.updateHpBars();

    // Show result after a brief delay for effects to play
    this.resolveTimer = 0.8;
  }

  private showBattleEffects(prevPlayerHp: number, prevEnemyHp: number): void {
    const playerDamage = prevPlayerHp - this.battle.playerActive.fish.currentHp;
    const enemyDamage = prevEnemyHp - this.battle.enemyActive.fish.currentHp;
    const log = this.battle.log;

    const hasCrit = log.some(l => l.includes('critical hit'));
    const hasSuperEffective = log.some(l => l.includes('super effective'));
    const hasNotEffective = log.some(l => l.includes('not very effective'));

    // Show damage numbers + sprite animations + type flash
    if (enemyDamage > 0) {
      const cls = hasCrit ? 'critical' : hasSuperEffective ? 'super-effective' : hasNotEffective ? 'not-effective' : '';
      this.showDamageNumber(enemyDamage, 'enemy', cls);
      this.animateSprite('.player-sprite', 'fish-attack');
      this.animateSprite('.enemy-sprite', 'fish-hit');
      // Type-colored flash on the arena
      const pSpecies = FISH_SPECIES[this.battle.playerActive.fish.speciesId];
      const flashColor = MOVE_TYPE_FLASH_COLORS[pSpecies.type] ?? MOVE_TYPE_FLASH_COLORS.normal;
      this.showTypeFlash(flashColor);
    }
    if (playerDamage > 0) {
      this.showDamageNumber(playerDamage, 'player', '');
      this.animateSprite('.enemy-sprite', 'fish-attack');
      this.animateSprite('.player-sprite', 'fish-hit');
      const eSpecies = FISH_SPECIES[this.battle.enemyActive.fish.speciesId];
      const flashColor = MOVE_TYPE_FLASH_COLORS[eSpecies.type] ?? MOVE_TYPE_FLASH_COLORS.normal;
      this.showTypeFlash(flashColor);
    }

    // Screen shake on hit + SFX
    if (enemyDamage > 0 || playerDamage > 0) {
      this.showScreenShake(hasCrit || hasSuperEffective ? 'heavy' : 'light');
      audio.playSFX(hasCrit ? 'critical' : 'battle_hit');
    }

    // Super effective text flash
    if (hasSuperEffective) {
      this.showEffectivenessText('SUPER EFFECTIVE!', 'var(--gold)');
    } else if (hasNotEffective) {
      this.showEffectivenessText('Not very effective...', 'var(--text-dim)');
    }
    if (hasCrit) {
      this.showEffectivenessText('CRITICAL HIT!', 'var(--fire)');
    }
  }

  private showDamageNumber(damage: number, target: 'player' | 'enemy', extraClass: string): void {
    const posStyle = target === 'enemy'
      ? 'top: 80px; left: 30%;'
      : 'top: 80px; right: 30%;';
    const panelId = `damage-${target}-${Date.now()}`;
    this.ui.show(
      panelId,
      `<div class="damage-number ${extraClass}" style="${posStyle}">${damage}</div>`
    );
    setTimeout(() => this.ui.remove(panelId), 1000);
  }

  private showScreenShake(intensity: 'light' | 'heavy'): void {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.classList.add('screen-shake');
      const duration = intensity === 'heavy' ? 400 : 200;
      setTimeout(() => canvas.classList.remove('screen-shake'), duration);
    }
  }

  private showEffectivenessText(text: string, color: string): void {
    const panelId = `effectiveness-${Date.now()}`;
    this.ui.show(
      panelId,
      `<div style="
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        font-family: var(--pixel-font); font-size: 14px; color: ${color};
        text-shadow: 2px 2px 0 rgba(0,0,0,0.8); z-index: 60; pointer-events: none;
        animation: damageFloat 1.2s steps(12) forwards;
      ">${text}</div>`
    );
    setTimeout(() => this.ui.remove(panelId), 1200);
  }

  private showTypeFlash(color: string): void {
    const panelId = `type-flash-${Date.now()}`;
    this.ui.show(
      panelId,
      `<div style="
        position: absolute; inset: 0; pointer-events: none; z-index: 55;
        background: ${color};
        animation: catchFlash 0.3s steps(3) forwards;
      "></div>`
    );
    setTimeout(() => this.ui.remove(panelId), 300);
  }

  private updateHpBars(): void {
    const pFish = this.battle.playerActive.fish;
    const eFish = this.battle.enemyActive.fish;
    // Update existing HP bar fills in-place so CSS transition animates
    const playerFill = document.querySelector('.player-info .battle-hp-fill') as HTMLElement;
    const enemyFill = document.querySelector('.enemy-info .battle-hp-fill') as HTMLElement;
    if (playerFill) {
      const pPct = Math.round((pFish.currentHp / pFish.maxHp) * 100);
      playerFill.style.width = `${pPct}%`;
      playerFill.className = `battle-hp-fill ${pPct > 50 ? 'hp-high' : pPct > 25 ? 'hp-mid' : 'hp-low'}`;
    }
    if (enemyFill) {
      const ePct = Math.round((eFish.currentHp / eFish.maxHp) * 100);
      enemyFill.style.width = `${ePct}%`;
      enemyFill.className = `battle-hp-fill ${ePct > 50 ? 'hp-high' : ePct > 25 ? 'hp-mid' : 'hp-low'}`;
    }
    // Update HP text too
    const playerText = document.querySelector('.player-info .battle-hp-text');
    const enemyText = document.querySelector('.enemy-info .battle-hp-text');
    if (playerText) playerText.textContent = `${pFish.currentHp}/${pFish.maxHp}`;
    if (enemyText) enemyText.textContent = `${eFish.currentHp}/${eFish.maxHp}`;
  }

  private animateSprite(selector: string, animClass: string): void {
    const el = document.querySelector(selector);
    if (el) {
      el.classList.add(animClass);
      setTimeout(() => el.classList.remove(animClass), 400);
    }
  }

  update(dt: number): void {
    if (this.resolving && this.resolveTimer > 0) {
      this.resolveTimer -= dt;
      if (this.resolveTimer <= 0) {
        this.resolving = false;
        this.handlePostTurn();
      }
    }
  }

  private handlePostTurn(): void {
    if (this.battle.phase === 'victory') {
      audio.playSFX('catch'); // victory fanfare
      // Random item drop (40% chance)
      if (Math.random() < 0.4) {
        const roll = Math.random();
        const dropId = roll < 0.5 ? 'sea_biscuit' : roll < 0.8 ? 'small_potion' : 'antidote';
        this.playerShip.items[dropId] = (this.playerShip.items[dropId] ?? 0) + 1;
        this.battle.log.push(`Found a ${ITEMS[dropId].name}!`);
      }
      // Heal surviving party members 30% of max HP
      for (const fish of this.battle.playerParty) {
        if (fish.currentHp > 0) {
          fish.currentHp = Math.min(fish.maxHp, fish.currentHp + Math.floor(fish.maxHp * 0.3));
        }
      }
      const xpResults = awardXp(this.battle.playerParty, this.battle.enemyParty);
      // Play level up sound + flash if any fish leveled
      if (xpResults.some(r => r.levelsGained > 0)) {
        audio.playSFX('level_up');
        const flashId = `level-up-flash-${Date.now()}`;
        this.ui.show(flashId, '<div class="level-up-flash"></div>');
        setTimeout(() => this.ui.remove(flashId), 600);
      }
      showBattleResult(
        this.ui,
        true,
        xpResults.map((r) => ({
          name: FISH_SPECIES[r.fish.speciesId].name,
          xpGained: r.xpGained,
          levelsGained: r.levelsGained,
          newMoves: r.newMoves.map(m => MOVES[m]?.name ?? m),
          level: r.fish.level,
          currentXp: r.fish.xp,
          xpToNext: getXpForLevel(r.fish.level + 1),
          statGrowth: r.statGrowth,
        })),
        () => this.exitBattle()
      );
      return;
    }

    if (this.battle.phase === 'defeat') {
      // Heal party to 50% so the player can continue playing
      for (const fish of this.battle.playerParty) {
        fish.currentHp = Math.max(1, Math.floor(fish.maxHp * 0.5));
      }
      showBattleResult(this.ui, false, [], () => this.exitBattle());
      return;
    }

    if (this.battle.phase === 'fled') {
      // Just exit — no penalty for fleeing
      this.exitBattle();
      return;
    }

    this.showUI();
  }

  private exitBattle(): void {
    this.onBattleEnd?.();
    this.stateMachine.pop();
  }

  render(): void {
    this.pixiCtx.app.renderer.render(this.pixiCtx.app.stage);
  }

  exit(): void {
    hideBattleUI(this.ui);
    audio.playBGM('sailing');
  }
}
