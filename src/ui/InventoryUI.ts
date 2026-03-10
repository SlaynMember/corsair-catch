import { UIManager } from './UIManager';
import { FishInstance, FishType, FISH_SPECIES, getFishById, Rarity, calcStat, getXpForLevel } from '../data/fish-db';
import { MOVES } from '../data/move-db';
import { TYPE_COLORS, fishSvg } from './ui-utils';
import { getEffectiveness } from '../data/type-chart';

const RARITY_COLORS: Record<string, string> = {
  [Rarity.COMMON]: 'var(--text-dim)',
  [Rarity.UNCOMMON]: 'var(--hp-green)',
  [Rarity.RARE]: 'var(--gold)',
};

function buildTypeChartHtml(): string {
  const types = ['fire', 'water', 'electric', 'coral', 'abyssal', 'storm', 'normal'];
  const labels = ['FIR', 'WAT', 'ELC', 'COR', 'ABY', 'STR', 'NRM'];

  const headerCells = labels.map((l, i) =>
    '<th style="padding:4px; color:' + TYPE_COLORS[types[i]] + ';">' + l + '</th>'
  ).join('');

  const rows = types.map(atk => {
    const cells = types.map(def => {
      const mult = getEffectiveness(atk as FishType, def as FishType);
      const color = mult >= 2 ? 'var(--hp-green)' : mult <= 0.5 ? 'var(--hp-red)' : 'var(--text-dim)';
      const label = mult >= 2 ? '2x' : mult <= 0.5 ? '½' : '1x';
      return '<td style="padding:4px; text-align:center; color:' + color + ';">' + label + '</td>';
    }).join('');
    return '<tr><td style="padding:4px; color:' + TYPE_COLORS[atk] + ';">' + atk.slice(0, 3).toUpperCase() + '</td>' + cells + '</tr>';
  }).join('');

  return '<div id="type-chart-panel" style="display:none; margin-top:16px; max-width:560px; width:100%;">'
    + '<div style="font-family:var(--pixel-font); font-size:10px; color:var(--gold); margin-bottom:12px; letter-spacing:1px;">TYPE CHART</div>'
    + '<table style="border-collapse:collapse; font-family:var(--pixel-font); font-size:7px; width:100%;">'
    + '<tr><th style="padding:4px; color:var(--text-dim);">ATK\\DEF</th>' + headerCells + '</tr>'
    + rows
    + '</table>'
    + '<div style="font-family:var(--pixel-font); font-size:7px; color:var(--text-dim); margin-top:8px;">'
    + '<span style="color:var(--hp-green);">2x</span> = Super Effective &nbsp;'
    + '<span style="color:var(--hp-red);">½</span> = Not Very Effective'
    + '</div></div>';
}

export function showInventory(
  ui: UIManager,
  party: FishInstance[],
  onClose: () => void
): void {
  const cardsHtml =
    party.length > 0
      ? party
          .map((fish, idx) => {
            const species = getFishById(fish.speciesId);
            const hpPct = Math.round((fish.currentHp / fish.maxHp) * 100);
            const hpColor = hpPct > 50 ? 'var(--hp-green)' : hpPct > 25 ? 'var(--hp-yellow)' : 'var(--hp-red)';
            const typeColor = TYPE_COLORS[species.type] ?? 'var(--text)';

            // Calculate current stats
            const atk = calcStat(species.baseStats.attack, fish.iv.attack, fish.level);
            const def = calcStat(species.baseStats.defense, fish.iv.defense, fish.level);
            const spd = calcStat(species.baseStats.speed, fish.iv.speed, fish.level);

            const movesHtml = fish.moves
              .map((m) => {
                const move = MOVES[m];
                if (!move) return '';
                const moveColor = TYPE_COLORS[move.type] ?? 'var(--text-dim)';
                const powerText = move.category === 'status' ? 'STS' : `${move.power}`;
                return `<div style="font-family:var(--pixel-font); font-size:7px; color:${moveColor}; padding:2px 0; display:flex; justify-content:space-between;">
                  <span>${move.name}</span><span style="opacity:0.6">${powerText}</span>
                </div>`;
              })
              .join('');

            const hpBarHtml = `
              <div style="width:100%; height:6px; background:#0a0a18; border:1px solid #3a3a4a; margin-top:6px;">
                <div style="width:${hpPct}%; height:100%; background:${hpColor};"></div>
              </div>
            `;

            const statsHtml = `
              <div style="display:flex; justify-content:space-between; margin-top:8px; font-family:var(--pixel-font); font-size:7px; color:var(--text-dim);">
                <span style="color:var(--fire);">ATK ${atk}</span>
                <span style="color:var(--water);">DEF ${def}</span>
                <span style="color:var(--electric);">SPD ${spd}</span>
              </div>
            `;

            const fishIcon = fishSvg(species.color, { width: 60, height: 38, margin: '4px auto', type: species.type });

            const nameLabel = fish.nickname
              ? `${fish.nickname} <span style="font-size:6px;color:var(--text-dim);">(${species.name})</span>`
              : species.name;

            // XP bar
            const xpToNext = getXpForLevel(fish.level + 1);
            const xpPct = xpToNext > 0 ? Math.min(100, Math.round((fish.xp / xpToNext) * 100)) : 100;
            const xpBarHtml = `
              <div style="width:100%; height:4px; background:#0a0a18; border:1px solid #3a3a4a; margin-top:3px;">
                <div style="width:${xpPct}%; height:100%; background:var(--water);"></div>
              </div>
              <div style="font-family:var(--pixel-font); font-size:6px; color:var(--text-dim); text-align:right; margin-top:1px;">XP ${fish.xp}/${xpToNext}</div>
            `;

            // Rarity badge
            const rarityColor = RARITY_COLORS[species.rarity] ?? 'var(--text-dim)';
            const rarityLabel = species.rarity === Rarity.COMMON ? '' : `<span style="font-family:var(--pixel-font);font-size:5px;color:${rarityColor};letter-spacing:1px;">${species.rarity.toUpperCase()}</span>`;

            return `<div class="inventory-card" style="border-color: ${species.color}60">
              ${rarityLabel}
              ${fishIcon}
              <div class="inventory-card-name" style="color: ${species.color}">${nameLabel}</div>
              <div class="inventory-card-type" style="color:${typeColor}">${species.type.toUpperCase()}</div>
              <div class="inventory-card-level">Lv.${fish.level}</div>
              <div class="inventory-card-hp">HP ${fish.currentHp}/${fish.maxHp}</div>
              ${hpBarHtml}
              ${xpBarHtml}
              ${statsHtml}
              <div style="margin-top:8px; border-top:1px solid rgba(255,255,255,0.06); padding-top:6px;">${movesHtml}</div>
              <div style="font-family:var(--body-font); font-size:8px; color:var(--text-dim); margin-top:6px; line-height:1.4; font-style:italic;">${species.description}</div>
              <div style="display:flex;gap:4px;margin-top:6px;">
                <button class="battle-btn" data-rename="${idx}" style="font-size:7px;padding:4px 6px;flex:1;">RENAME</button>
                ${idx > 0 ? `<button class="battle-btn" data-lead="${idx}" style="font-size:7px;padding:4px 6px;flex:1;color:var(--gold);">SET LEAD</button>` : '<span style="font-size:6px;color:var(--gold);padding:4px;text-align:center;flex:1;font-family:var(--pixel-font);">LEAD</span>'}
              </div>
              ${party.length > 1 ? `<button class="battle-btn" data-release="${idx}" style="font-size:6px;padding:3px 6px;margin-top:4px;width:100%;color:var(--hp-red);border-color:var(--hp-red);">RELEASE</button>` : ''}
            </div>`;
          })
          .join('')
      : `<div style="grid-column:1/-1; text-align:center; font-family:var(--pixel-font); font-size:8px; color:var(--text-dim);">
          NO FISH CAUGHT YET<br>
          <span style="font-size:7px; margin-top:8px; display:block;">FIND A FISHING ZONE!</span>
        </div>`;

  const typeChartHtml = buildTypeChartHtml();

  // Collection tracker
  const allSpecies = FISH_SPECIES;
  const caughtIds = new Set(party.map(f => f.speciesId));
  const collectionHtml = `<div id="collection-panel" style="display:none; margin-top:16px; max-width:560px; width:100%;">
    <div style="font-family:var(--pixel-font); font-size:10px; color:var(--gold); margin-bottom:12px; letter-spacing:1px;">
      COLLECTION ${caughtIds.size}/${allSpecies.length}
    </div>
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(90px, 1fr)); gap:6px;">
      ${allSpecies.map(sp => {
        const caught = caughtIds.has(sp.id);
        const color = caught ? sp.color : '#333';
        const name = caught ? sp.name : '???';
        const typeLabel = caught ? sp.type.toUpperCase() : '';
        const rarityCol = caught ? (RARITY_COLORS[sp.rarity] ?? 'var(--text-dim)') : '#333';
        const rarityTag = caught && sp.rarity !== Rarity.COMMON ? `<div style="font-family:var(--pixel-font); font-size:4px; color:${rarityCol}; letter-spacing:0.5px;">${sp.rarity.toUpperCase()}</div>` : '';
        return `<div style="background:${caught ? 'var(--panel-bg)' : '#0a0a12'}; border:2px solid ${color}40; padding:6px; text-align:center;">
          ${fishSvg(color, { width: 40, height: 25, margin: '2px auto', type: caught ? sp.type : undefined })}
          <div style="font-family:var(--pixel-font); font-size:6px; color:${color}; margin-top:2px;">${name}</div>
          <div style="font-family:var(--pixel-font); font-size:5px; color:var(--text-dim);">${typeLabel}</div>
          ${rarityTag}
        </div>`;
      }).join('')}
    </div>
  </div>`;

  const panel = ui.show(
    'inventory',
    `<div class="inventory-overlay panel-slide-in">
      <div class="inventory-title">YOUR CREW</div>
      <div class="inventory-grid">${cardsHtml}</div>
      ${typeChartHtml}
      ${collectionHtml}
      <div style="display:flex; gap:8px; margin-top:28px; flex-wrap:wrap; justify-content:center;">
        <button class="menu-btn" id="inv-type-chart">TYPE CHART</button>
        <button class="menu-btn" id="inv-collection">COLLECTION</button>
        <button class="menu-btn" id="inv-close">CLOSE [I]</button>
      </div>
    </div>`
  );

  panel.querySelector('#inv-close')?.addEventListener('click', onClose);
  panel.querySelector('#inv-type-chart')?.addEventListener('click', () => {
    const chartPanel = panel.querySelector('#type-chart-panel') as HTMLElement;
    if (chartPanel) {
      chartPanel.style.display = chartPanel.style.display === 'none' ? 'block' : 'none';
    }
  });
  panel.querySelector('#inv-collection')?.addEventListener('click', () => {
    const colPanel = panel.querySelector('#collection-panel') as HTMLElement;
    if (colPanel) {
      colPanel.style.display = colPanel.style.display === 'none' ? 'block' : 'none';
    }
  });
  panel.querySelectorAll('[data-rename]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt((btn as HTMLElement).dataset.rename!, 10);
      const fish = party[idx];
      if (!fish) return;
      const species = getFishById(fish.speciesId);
      const current = fish.nickname ?? species.name;
      const name = prompt(`Rename ${species.name}:`, current);
      if (name !== null) {
        const trimmed = name.trim().slice(0, 12);
        fish.nickname = trimmed || undefined;
        // Re-render inventory
        showInventory(ui, party, onClose);
      }
    });
  });
  panel.querySelectorAll('[data-release]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt((btn as HTMLElement).dataset.release!, 10);
      const fish = party[idx];
      if (!fish || party.length <= 1) return;
      const species = getFishById(fish.speciesId);
      const name = fish.nickname ?? species.name;
      if (confirm(`Release ${name} back to the sea? This cannot be undone.`)) {
        party.splice(idx, 1);
        showInventory(ui, party, onClose);
      }
    });
  });
  panel.querySelectorAll('[data-lead]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt((btn as HTMLElement).dataset.lead!, 10);
      if (idx > 0 && idx < party.length) {
        // Swap to front
        const fish = party[idx];
        party.splice(idx, 1);
        party.unshift(fish);
        showInventory(ui, party, onClose);
      }
    });
  });
}

export function hideInventory(ui: UIManager): void {
  ui.remove('inventory');
}
