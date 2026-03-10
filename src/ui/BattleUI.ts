import { UIManager } from './UIManager';
import type { BattleState } from '../systems/BattleSystem';
import { FISH_SPECIES, FishType } from '../data/fish-db';
import { MOVES } from '../data/move-db';
import { ITEMS } from '../data/item-db';
import { getEffectiveness } from '../data/type-chart';
import { typeIcon, fishSvg, hpClass, fishBattleImg } from './ui-utils';
import { fishSpriteDataUrl } from '../utils/FishSpriteGenerator';

function weaknessBadges(defType: FishType): string {
  const types: FishType[] = [FishType.WATER, FishType.FIRE, FishType.ELECTRIC, FishType.CORAL, FishType.ABYSSAL, FishType.STORM];
  const weak = types.filter(t => getEffectiveness(t, defType) >= 2);
  const resist = types.filter(t => getEffectiveness(t, defType) <= 0.5);
  let html = '';
  if (weak.length > 0) {
    html += `<span style="font-size:6px;color:var(--hp-green);">WEAK: ${weak.map(t => typeIcon(t)).join(' ')}</span>`;
  }
  if (resist.length > 0) {
    html += `<span style="font-size:6px;color:var(--hp-red);margin-left:6px;">RESIST: ${resist.map(t => typeIcon(t)).join(' ')}</span>`;
  }
  return html ? `<div style="margin-top:3px;">${html}</div>` : '';
}

function statusBadge(status: { type: string } | null): string {
  if (!status) return '';
  if (status.type === 'burn') return '<span style="font-family:var(--pixel-font);font-size:7px;color:var(--fire);background:rgba(232,88,48,0.15);padding:2px 6px;border:1px solid var(--fire);margin-left:6px;">BRN</span>';
  if (status.type === 'paralyze') return '<span style="font-family:var(--pixel-font);font-size:7px;color:var(--electric);background:rgba(232,200,32,0.15);padding:2px 6px;border:1px solid var(--electric);margin-left:6px;">PAR</span>';
  return '';
}

function statModBadges(mods: { attack: number; defense: number; speed: number }): string {
  const badges: string[] = [];
  if (mods.attack !== 0) {
    const arrow = mods.attack > 0 ? '\u25B2' : '\u25BC';
    const color = mods.attack > 0 ? 'var(--fire)' : 'var(--water)';
    badges.push(`<span style="font-size:7px;color:${color};">${arrow}ATK${Math.abs(mods.attack) > 1 ? 'x' + Math.abs(mods.attack) : ''}</span>`);
  }
  if (mods.defense !== 0) {
    const arrow = mods.defense > 0 ? '\u25B2' : '\u25BC';
    const color = mods.defense > 0 ? 'var(--coral)' : 'var(--abyssal)';
    badges.push(`<span style="font-size:7px;color:${color};">${arrow}DEF${Math.abs(mods.defense) > 1 ? 'x' + Math.abs(mods.defense) : ''}</span>`);
  }
  if (mods.speed !== 0) {
    const arrow = mods.speed > 0 ? '\u25B2' : '\u25BC';
    const color = mods.speed > 0 ? 'var(--electric)' : 'var(--storm)';
    badges.push(`<span style="font-size:7px;color:${color};">${arrow}SPD${Math.abs(mods.speed) > 1 ? 'x' + Math.abs(mods.speed) : ''}</span>`);
  }
  return badges.length ? '<div style="margin-top:2px;">' + badges.join(' ') + '</div>' : '';
}

// Track keyboard handler to prevent listener leaks across UI rebuilds
let activeKeyHandler: ((e: KeyboardEvent) => void) | null = null;

export function showBattleUI(
  ui: UIManager,
  state: BattleState,
  onMoveSelect: (moveId: string) => void,
  onSwap: (index: number) => void,
  onFlee: () => void,
  inventory: Record<string, number> = {},
  onItemUse: (itemId: string, targetIndex: number) => void = () => {}
): void {
  // Clean up previous keyboard handler to prevent listener leaks
  if (activeKeyHandler) {
    window.removeEventListener('keydown', activeKeyHandler);
    activeKeyHandler = null;
  }

  const pFish = state.playerActive.fish;
  const eFish = state.enemyActive.fish;
  const pSpecies = FISH_SPECIES[pFish.speciesId];
  const eSpecies = FISH_SPECIES[eFish.speciesId];

  const pHpPct = Math.round((pFish.currentHp / pFish.maxHp) * 100);
  const eHpPct = Math.round((eFish.currentHp / eFish.maxHp) * 100);

  const logHtml = state.log.map((l) => {
    let styled = l;
    if (l.includes('super effective')) styled = `<span style="color:var(--hp-green);">${l}</span>`;
    else if (l.includes('not very effective')) styled = `<span style="color:var(--text-dim);">${l}</span>`;
    else if (l.includes('critical hit')) styled = `<span style="color:var(--fire);">${l}</span>`;
    else if (l.includes('was burned')) styled = `<span style="color:var(--fire);">${l}</span>`;
    else if (l.includes('was paralyzed')) styled = `<span style="color:var(--electric);">${l}</span>`;
    else if (l.includes('fainted')) styled = `<span style="color:var(--hp-red);">${l}</span>`;
    else if (l.includes('healed')) styled = `<span style="color:var(--hp-green);">${l}</span>`;
    else if (l.includes('defense rose') || l.includes('attack rose')) styled = `<span style="color:var(--coral);">${l}</span>`;
    else if (l.includes('defense fell') || l.includes('attack fell')) styled = `<span style="color:var(--abyssal);">${l}</span>`;
    return `<div>> ${styled}</div>`;
  }).join('');

  const itemTotal = Object.values(inventory).reduce((s, n) => s + n, 0);

  // Precompute move/swap HTML — reused by primary actionsHtml and sub-menus
  const allPpExhausted = state.phase === 'select' && pFish.moves.every(moveId => (state.playerActive.movePp[moveId] ?? 0) <= 0);
  const moveButtonsHtml = state.phase !== 'select' ? '' : (allPpExhausted
    ? `<button class="battle-btn type-normal" data-move="struggle">
        Struggle<br><span style="font-size:9px; opacity:0.6;">${typeIcon('normal')} NORMAL</span>
      </button>`
    : pFish.moves.map((moveId, idx) => {
        const move = MOVES[moveId];
        if (!move) return '';
        const pp = state.playerActive.movePp[moveId] ?? 0;
        const disabled = pp <= 0 ? ' style="opacity:0.4;pointer-events:none;"' : '';
        const ppWarning = pp > 0 && pp <= 2 ? ' style="color:var(--hp-red);font-weight:bold;"' : '';
        const powerLabel = move.category === 'status' ? 'STATUS' : `PWR:${move.power}`;
        const eff = getEffectiveness(move.type as FishType, eSpecies.type);
        const effLabel = eff >= 2 ? ' <span style="color:var(--hp-green);font-size:7px;">2x!</span>' : eff <= 0.5 ? ' <span style="color:var(--hp-red);font-size:7px;">½</span>' : '';
        const keyHint = `<span style="opacity:0.3;font-size:7px;">[${idx + 1}]</span> `;
        return `<button class="battle-btn type-${move.type}" data-move="${moveId}"${disabled}>
          ${keyHint}${move.name}${effLabel}<br><span style="font-size:8px; opacity:0.6;">${typeIcon(move.type)} ${powerLabel} <span${ppWarning}>PP:${pp}/${move.pp}</span></span>
        </button>`;
      }).join(''));
  const swapButtonsHtml = state.phase !== 'select' ? '' : state.playerParty.map((f, i) => {
    if (i === state.playerActiveIndex || f.currentHp <= 0) return '';
    const sp = FISH_SPECIES[f.speciesId];
    return `<button class="battle-btn battle-btn-swap" data-swap="${i}">
      ${sp.name}<br><span style="font-size:9px;">Lv.${f.level} HP:${f.currentHp}/${f.maxHp}</span>
    </button>`;
  }).join('');

  let actionsHtml = '';
  if (state.phase === 'select') {
    const itemLabel = itemTotal > 0 ? `ITEM(${itemTotal})` : 'ITEM';
    const itemDisabled = itemTotal === 0 ? ' style="opacity:0.4;pointer-events:none;"' : '';

    actionsHtml = `
      <div class="battle-primary-actions" id="battle-actions-root">
        <button class="battle-btn battle-btn-fight" data-action="fight"><span style="opacity:0.3;font-size:7px;">[F]</span> ⚔ FIGHT</button>
        <button class="battle-btn battle-btn-item" data-action="item"${itemDisabled}><span style="opacity:0.3;font-size:7px;">[I]</span> ${itemLabel}</button>
        <button class="battle-btn battle-btn-flee" data-action="run"><span style="opacity:0.3;font-size:7px;">[R]</span> RUN</button>
      </div>
    `;
  } else if (state.phase === 'faint_swap') {
    const swapButtons = state.playerParty
      .map((f, i) => {
        if (f.currentHp <= 0) return '';
        const sp = FISH_SPECIES[f.speciesId];
        return `<button class="battle-btn battle-btn-swap" data-swap="${i}">
          ${sp.name}<br><span style="font-size:9px;">Lv.${f.level} HP:${f.currentHp}/${f.maxHp}</span>
        </button>`;
      })
      .join('');

    actionsHtml = `
      <div style="text-align:center; margin-bottom:8px; font-family:var(--pixel-font); font-size:9px; color:var(--gold);">Choose your next fish!</div>
      <div class="battle-actions">${swapButtons}</div>
    `;
  }

  const panel = ui.show(
    'battle',
    `<div class="battle-overlay">
      <div style="position:absolute;top:4px;right:8px;font-family:var(--pixel-font);font-size:7px;color:var(--text-dim);z-index:5;">TURN ${state.turnNumber}</div>
      <div class="battle-top">
        <div class="battle-fish-info enemy-info">
          <div class="battle-fish-name" style="color: ${eSpecies.color}">${eFish.nickname ?? eSpecies.name}</div>
          <div class="battle-fish-level">Lv.${eFish.level} ${typeIcon(eSpecies.type)} ${eSpecies.type.toUpperCase()}</div>
          <div class="battle-hp-bar">
            <div class="battle-hp-fill ${hpClass(eFish.currentHp, eFish.maxHp)}" style="width: ${eHpPct}%"></div>
          </div>
          <div class="battle-hp-text">${eFish.currentHp}/${eFish.maxHp}${statusBadge(state.enemyActive.status)}</div>
          ${statModBadges(state.enemyActive.statMods)}
          ${weaknessBadges(eSpecies.type)}
        </div>
        <div class="battle-fish-info player-info">
          <div class="battle-fish-name" style="color: ${pSpecies.color}">${pFish.nickname ?? pSpecies.name}</div>
          <div class="battle-fish-level">Lv.${pFish.level} ${typeIcon(pSpecies.type)} ${pSpecies.type.toUpperCase()}</div>
          <div class="battle-hp-bar">
            <div class="battle-hp-fill ${hpClass(pFish.currentHp, pFish.maxHp)}" style="width: ${pHpPct}%"></div>
          </div>
          <div class="battle-hp-text">${pFish.currentHp}/${pFish.maxHp}${statusBadge(state.playerActive.status)}</div>
          ${statModBadges(state.playerActive.statMods)}
        </div>
      </div>
      <div class="battle-arena">
        <div class="battle-fish-sprite enemy-sprite">${fishBattleImg(eSpecies.type, { flip: true, alt: eSpecies.name }) || `<img src="${fishSpriteDataUrl(eSpecies.type)}" style="image-rendering:pixelated;width:64px;height:64px;transform:scaleX(-1);" alt="${eSpecies.name}">`}</div>
        <div class="battle-fish-sprite player-sprite">${fishBattleImg(pSpecies.type, { alt: pSpecies.name }) || `<img src="${fishSpriteDataUrl(pSpecies.type)}" style="image-rendering:pixelated;width:64px;height:64px;" alt="${pSpecies.name}">`}</div>
      </div>
      <div class="battle-bottom">
        <div class="battle-log">${logHtml}</div>
        ${actionsHtml}
      </div>
    </div>`
  );

  // Auto-scroll battle log to bottom
  const logEl = panel.querySelector('.battle-log');
  if (logEl) logEl.scrollTop = logEl.scrollHeight;

  // Bind events
  if (state.phase === 'select' || state.phase === 'faint_swap') {
    const setKeyHandler = (handler: (e: KeyboardEvent) => void) => {
      if (activeKeyHandler) window.removeEventListener('keydown', activeKeyHandler);
      activeKeyHandler = handler;
      window.addEventListener('keydown', handler);
    };

    const showFightSubMenu = () => {
      const root = panel.querySelector('#battle-actions-root');
      if (!root) return;
      const hasSwap = swapButtonsHtml.trim().length > 0;
      root.innerHTML = `
        <div style="width:100%;text-align:center;font-family:var(--pixel-font);font-size:8px;color:var(--text-dim);margin-bottom:4px;">CHOOSE MOVE</div>
        <div class="battle-actions">
          ${moveButtonsHtml}
          ${hasSwap ? `<button class="battle-btn battle-btn-swap" data-action="open-swap"><span style="opacity:0.3;font-size:7px;">[S]</span> SWAP</button>` : ''}
          <button class="battle-btn" id="fight-back-btn" style="border-color:var(--text-dim);color:var(--text-dim);font-size:8px;"><span style="opacity:0.3;font-size:7px;">[B]</span> BACK</button>
        </div>
      `;
      root.querySelectorAll('[data-move]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const moveId = (btn as HTMLElement).dataset.move!;
          const pp = state.playerActive.movePp[moveId] ?? 0;
          if (moveId !== 'struggle' && pp <= 0) return;
          onMoveSelect(moveId);
        });
      });
      root.querySelector('[data-action="open-swap"]')?.addEventListener('click', showSwapSubMenu);
      root.querySelector('#fight-back-btn')?.addEventListener('click', () => {
        showBattleUI(ui, state, onMoveSelect, onSwap, onFlee, inventory, onItemUse);
      });
      setKeyHandler((e: KeyboardEvent) => {
        const key = e.key;
        if (key === '1' && allPpExhausted) {
          onMoveSelect('struggle');
        } else if (key >= '1' && key <= '4' && !allPpExhausted) {
          const idx = parseInt(key) - 1;
          const btns = root.querySelectorAll('[data-move]');
          const btn = btns[idx] as HTMLElement | undefined;
          if (btn?.dataset.move) {
            const pp = state.playerActive.movePp[btn.dataset.move] ?? 0;
            if (pp > 0) onMoveSelect(btn.dataset.move);
          }
        } else if ((key === 's' || key === 'S') && hasSwap) {
          showSwapSubMenu();
        } else if (key === 'b' || key === 'B' || key === 'Escape') {
          showBattleUI(ui, state, onMoveSelect, onSwap, onFlee, inventory, onItemUse);
        }
      });
    };

    const showSwapSubMenu = () => {
      const root = panel.querySelector('#battle-actions-root');
      if (!root) return;
      root.innerHTML = `
        <div style="width:100%;text-align:center;font-family:var(--pixel-font);font-size:8px;color:var(--gold);margin-bottom:4px;">SWAP FISH</div>
        <div class="battle-actions">
          ${swapButtonsHtml || '<div style="font-family:var(--pixel-font);font-size:8px;color:var(--text-dim);padding:8px;">NO AVAILABLE FISH</div>'}
          <button class="battle-btn" id="swap-back-btn" style="border-color:var(--text-dim);color:var(--text-dim);font-size:8px;"><span style="opacity:0.3;font-size:7px;">[B]</span> BACK</button>
        </div>
      `;
      root.querySelectorAll('[data-swap]').forEach((btn) => {
        btn.addEventListener('click', () => {
          onSwap(parseInt((btn as HTMLElement).dataset.swap!, 10));
        });
      });
      root.querySelector('#swap-back-btn')?.addEventListener('click', showFightSubMenu);
      setKeyHandler((e: KeyboardEvent) => {
        if (e.key === 'b' || e.key === 'B' || e.key === 'Escape') showFightSubMenu();
      });
    };

    // faint_swap: direct swap bindings
    panel.querySelectorAll('[data-swap]').forEach((btn) => {
      btn.addEventListener('click', () => {
        onSwap(parseInt((btn as HTMLElement).dataset.swap!, 10));
      });
    });

    if (state.phase === 'select') {
      panel.querySelector('[data-action="fight"]')?.addEventListener('click', showFightSubMenu);

      // ITEM button — shows item sub-menu inline
      panel.querySelector('[data-action="item"]')?.addEventListener('click', () => {
        const root = panel.querySelector('#battle-actions-root');
        if (!root) return;
        const availableItems = Object.entries(inventory).filter(([, qty]) => qty > 0);
        const itemsHtml = availableItems.length > 0
          ? availableItems.map(([itemId, qty]) => {
              const item = ITEMS[itemId];
              if (!item) return '';
              return `<button class="battle-btn battle-btn-item-use" data-use-item="${itemId}">
                ${item.icon} ${item.name} <span style="opacity:0.5;font-size:8px;">x${qty}</span><br>
                <span style="font-size:7px;opacity:0.6;">${item.description}</span>
              </button>`;
            }).join('')
          : `<div style="font-family:var(--pixel-font);font-size:8px;color:var(--text-dim);padding:8px;">NO ITEMS</div>`;
        root.innerHTML = `
          <div style="width:100%;text-align:center;font-family:var(--pixel-font);font-size:8px;color:var(--gold);margin-bottom:4px;">USE ITEM</div>
          <div class="battle-actions">
            ${itemsHtml}
            <button class="battle-btn" id="item-back-btn" style="border-color:var(--text-dim);color:var(--text-dim);font-size:8px;"><span style="opacity:0.3;font-size:7px;">[B]</span> BACK</button>
          </div>
        `;
        root.querySelectorAll('[data-use-item]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const itemId = (btn as HTMLElement).dataset.useItem!;
            onItemUse(itemId, state.playerActiveIndex);
          });
        });
        root.querySelector('#item-back-btn')?.addEventListener('click', () => {
          showBattleUI(ui, state, onMoveSelect, onSwap, onFlee, inventory, onItemUse);
        });
        setKeyHandler((e: KeyboardEvent) => {
          if (e.key === 'b' || e.key === 'B' || e.key === 'Escape') {
            showBattleUI(ui, state, onMoveSelect, onSwap, onFlee, inventory, onItemUse);
          }
        });
      });

      panel.querySelector('[data-action="run"]')?.addEventListener('click', onFlee);

      // Primary keyboard: F=fight, I=item, R=run
      setKeyHandler((e: KeyboardEvent) => {
        const key = e.key;
        if (key === 'f' || key === 'F') {
          showFightSubMenu();
        } else if ((key === 'i' || key === 'I') && itemTotal > 0) {
          (panel.querySelector('[data-action="item"]') as HTMLElement)?.click();
        } else if (key === 'r' || key === 'R') {
          onFlee();
        }
      });
    }
  }
}

export function showBattleResult(
  ui: UIManager,
  isVictory: boolean,
  xpResults: { name: string; xpGained: number; levelsGained: number; newMoves?: string[]; level?: number; currentXp?: number; xpToNext?: number; statGrowth?: { hp: number; attack: number; defense: number; speed: number } }[],
  onContinue: () => void
): void {
  const resultsHtml = xpResults
    .map(
      (r) => {
        let html = `<div class="xp-result">${r.name} <span style="color:var(--text-dim);">Lv.${r.level ?? '?'}</span>: +${r.xpGained} XP`;
        if (r.levelsGained > 0) {
          html += ` <span class="level-up">LEVEL UP! (+${r.levelsGained})</span>`;
        }
        html += `</div>`;
        // XP progress bar
        if (r.currentXp !== undefined && r.xpToNext !== undefined && r.xpToNext > 0) {
          const xpPct = Math.min(100, Math.round((r.currentXp / r.xpToNext) * 100));
          html += `<div style="width:200px; margin:2px auto 8px; height:6px; background:#0a0a18; border:1px solid #3a3a4a;">
            <div style="width:${xpPct}%; height:100%; background:var(--water); transition:width 0.4s;"></div>
          </div>`;
        }
        // Stat growth on level-up
        if (r.statGrowth && r.levelsGained > 0) {
          html += `<div class="stat-growth">
            <span style="color:var(--hp-green);">HP +${r.statGrowth.hp}</span>
            <span style="color:var(--fire);">ATK +${r.statGrowth.attack}</span>
            <span style="color:var(--water);">DEF +${r.statGrowth.defense}</span>
            <span style="color:var(--electric);">SPD +${r.statGrowth.speed}</span>
          </div>`;
        }
        if (r.newMoves && r.newMoves.length > 0) {
          html += r.newMoves.map(m =>
            `<div class="xp-result" style="color:var(--electric); font-size:9px;">
              ${r.name} learned ${m}!
            </div>`
          ).join('');
        }
        return html;
      }
    )
    .join('');

  const panel = ui.show(
    'battle-result',
    `<div class="battle-result ${isVictory ? 'victory' : 'defeat'}">
      <h1>${isVictory ? 'VICTORY!' : 'DEFEAT'}</h1>
      ${isVictory ? resultsHtml : '<p style="font-family:var(--pixel-font);font-size:9px;">Your crew was defeated...<br><span style="color:var(--text-dim);font-size:8px;margin-top:8px;display:block;">Your fish have been healed to fight again!</span></p>'}
      <button class="menu-btn" id="battle-continue">CONTINUE</button>
    </div>`
  );

  panel.querySelector('#battle-continue')?.addEventListener('click', onContinue);

  // Space or Enter to continue
  const continueHandler = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      window.removeEventListener('keydown', continueHandler);
      onContinue();
    }
  };
  activeKeyHandler = continueHandler;
  window.addEventListener('keydown', continueHandler);
}

export function hideBattleUI(ui: UIManager): void {
  if (activeKeyHandler) {
    window.removeEventListener('keydown', activeKeyHandler);
    activeKeyHandler = null;
  }
  ui.remove('battle');
  ui.remove('battle-result');
}
