import { UIManager } from './UIManager';
import type { IslandData } from '../world/WorldManager2D';
import type { ShipComponent } from '../components/ShipComponent';
import { FISH_SPECIES } from '../data/fish-db';
import { audio } from '../core/AudioManager';

// Bait types available in the game
export const BAITS: Record<string, { name: string; desc: string; price: number; rarityBoost: number }> = {
  worm_bait:    { name: 'Worm Bait',    desc: '+10% UNCOMMON chance', price: 50,  rarityBoost: 0.10 },
  glitter_lure: { name: 'Glitter Lure', desc: '+15% RARE chance',     price: 100, rarityBoost: 0.15 },
  deep_hook:    { name: 'Deep Hook',    desc: '+20% RARE, deeper fish', price: 150, rarityBoost: 0.20 },
};

// Treasure loot table per dig
const TREASURE_LOOT = [
  { type: 'gold',  amount: 25,  label: '25 Gold Coins!',    weight: 30 },
  { type: 'gold',  amount: 50,  label: '50 Gold Coins!',    weight: 20 },
  { type: 'gold',  amount: 100, label: '100 Gold Coins!',   weight: 8  },
  { type: 'bait',  id: 'worm_bait',    label: 'Worm Bait!',    weight: 22 },
  { type: 'bait',  id: 'glitter_lure', label: 'Glitter Lure!', weight: 12 },
  { type: 'bait',  id: 'deep_hook',    label: 'Deep Hook!',    weight: 5  },
  { type: 'item',  id: 'small_potion', label: 'Small Potion!', weight: 18 },
  { type: 'item',  id: 'sea_biscuit',  label: 'Sea Biscuit!',  weight: 15 },
];

function rollLoot() {
  const total = TREASURE_LOOT.reduce((s, l) => s + l.weight, 0);
  let roll = Math.random() * total;
  for (const loot of TREASURE_LOOT) {
    roll -= loot.weight;
    if (roll <= 0) return loot;
  }
  return TREASURE_LOOT[0];
}

export function showIslandUI(
  ui: UIManager,
  island: IslandData,
  ship: ShipComponent,
  discoveredTreasures: string[],
  onHeal: () => void,
  onClose: () => void
): void {
  // Generate persistent treasure spots per island (2 spots per island, key = islandId+index)
  const treasureSpots = Array.from({ length: 9 }, (_, i) => {
    const key = `${island.id}_spot${i}`;
    const hasX = !discoveredTreasures.includes(key) && i % 3 === Math.floor(i / 3);
    return { key, hasX: i === 1 || i === 7, found: discoveredTreasures.includes(`${island.id}_spot${i}`) };
  });

  const isShop = island.id === 'merchants_port';

  const gridHtml = treasureSpots.map((spot, i) => {
    if (spot.found) {
      return `<div class="treasure-tile treasure-dug" data-idx="${i}">✓</div>`;
    } else if (spot.hasX) {
      return `<div class="treasure-tile treasure-x" data-idx="${i}">✕</div>`;
    } else {
      return `<div class="treasure-tile" data-idx="${i}">~</div>`;
    }
  }).join('');

  const goldDisplay = `<span style="color:var(--gold);">⬡ ${ship.gold ?? 0}g</span>`;

  ui.show('island-ui', `
    <div class="island-overlay">
      <div class="island-panel">
        <div class="island-header">
          <div class="island-title">${island.name.toUpperCase()}</div>
          <div class="island-gold">${goldDisplay}</div>
        </div>
        <div class="island-tabs">
          <button class="island-tab island-tab-active" id="tab-explore">EXPLORE</button>
          ${isShop ? '<button class="island-tab" id="tab-shop">SHOP</button>' : ''}
          <button class="island-tab" id="tab-heal">HEAL</button>
          <button class="island-tab island-tab-sail" id="tab-sail">SAIL OUT</button>
        </div>
        <div class="island-content" id="island-content">
          <div id="explore-panel">
            <div class="treasure-label">DIG FOR TREASURE</div>
            <div class="treasure-grid" id="treasure-grid">
              ${gridHtml}
            </div>
            <div class="treasure-result" id="treasure-result"></div>
          </div>
        </div>
      </div>
    </div>
  `);

  // Inject CSS
  injectIslandStyles();

  // Bind tab buttons
  setTimeout(() => {
    const tabExplore = document.getElementById('tab-explore');
    const tabShop = document.getElementById('tab-shop');
    const tabHeal = document.getElementById('tab-heal');
    const tabSail = document.getElementById('tab-sail');
    const content = document.getElementById('island-content');

    function setActiveTab(id: string) {
      document.querySelectorAll('.island-tab').forEach(t => t.classList.remove('island-tab-active'));
      document.getElementById(id)?.classList.add('island-tab-active');
    }

    tabExplore?.addEventListener('click', () => {
      setActiveTab('tab-explore');
      if (content) content.innerHTML = buildExplorePanel(island, discoveredTreasures, ship, ui);
      bindTreasureTiles(island, discoveredTreasures, ship, ui);
    });

    tabShop?.addEventListener('click', () => {
      setActiveTab('tab-shop');
      if (content) content.innerHTML = buildShopPanel(ship);
      bindShopButtons(ship, island, ui);
    });

    tabHeal?.addEventListener('click', () => {
      onHeal();
      setActiveTab('tab-heal');
      if (content) content.innerHTML = `<div class="heal-panel">
        <div class="heal-text">CREW FULLY HEALED!</div>
        <div style="font-family:var(--pixel-font);font-size:8px;color:var(--text-dim);margin-top:12px;">Your party HP has been fully restored.</div>
      </div>`;
    });

    tabSail?.addEventListener('click', () => {
      onClose();
    });

    // Bind initial treasure tiles
    bindTreasureTiles(island, discoveredTreasures, ship, ui);
  }, 50);
}

function buildExplorePanel(
  island: IslandData,
  discoveredTreasures: string[],
  ship: ShipComponent,
  ui: UIManager
): string {
  const spots = Array.from({ length: 9 }, (_, i) => {
    const found = discoveredTreasures.includes(`${island.id}_spot${i}`);
    const hasX = i === 1 || i === 7;
    if (found) return `<div class="treasure-tile treasure-dug" data-idx="${i}">✓</div>`;
    if (hasX) return `<div class="treasure-tile treasure-x" data-idx="${i}">✕</div>`;
    return `<div class="treasure-tile" data-idx="${i}">~</div>`;
  }).join('');
  return `<div class="explore-panel">
    <div class="treasure-label">DIG FOR TREASURE</div>
    <div class="treasure-grid" id="treasure-grid">${spots}</div>
    <div class="treasure-result" id="treasure-result"></div>
  </div>`;
}

function bindTreasureTiles(
  island: IslandData,
  discoveredTreasures: string[],
  ship: ShipComponent,
  ui: UIManager
): void {
  setTimeout(() => {
    document.querySelectorAll('.treasure-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const idx = parseInt((tile as HTMLElement).dataset.idx ?? '0');
        const key = `${island.id}_spot${idx}`;
        if (discoveredTreasures.includes(key)) return;
        const hasX = idx === 1 || idx === 7;

        discoveredTreasures.push(key);
        tile.classList.add('treasure-dug');

        if (hasX) {
          const loot = rollLoot();
          audio.playSFX('catch');
          if (loot.type === 'gold') {
            ship.gold = (ship.gold ?? 0) + (loot.amount ?? 0);
            tile.textContent = '💰';
          } else if (loot.type === 'bait' && loot.id) {
            if (!ship.baitInventory) ship.baitInventory = {};
            ship.baitInventory[loot.id] = (ship.baitInventory[loot.id] ?? 0) + 1;
            tile.textContent = '🎣';
          } else if (loot.type === 'item' && loot.id) {
            ship.items[loot.id] = (ship.items[loot.id] ?? 0) + 1;
            tile.textContent = '🧪';
          }
          const result = document.getElementById('treasure-result');
          if (result) {
            result.innerHTML = `<div class="loot-popup">FOUND: ${loot.label}</div>`;
            setTimeout(() => { result.innerHTML = ''; }, 3000);
          }
        } else {
          tile.textContent = '·';
          audio.playSFX('splash');
        }
      });
    });
  }, 30);
}

function buildShopPanel(ship: ShipComponent): string {
  const gold = ship.gold ?? 0;
  const baitRows = Object.entries(BAITS).map(([id, bait]) => {
    const owned = ship.baitInventory?.[id] ?? 0;
    return `<div class="shop-row">
      <div class="shop-item-name">${bait.name}</div>
      <div class="shop-item-desc">${bait.desc}</div>
      <div class="shop-item-owned">x${owned}</div>
      <button class="shop-buy-btn" data-id="${id}" data-price="${bait.price}" data-type="bait">
        BUY ${bait.price}g
      </button>
    </div>`;
  }).join('');

  const sellRows = ship.party.length > 0
    ? ship.party.map((f, i) => {
        const sp = FISH_SPECIES[f.speciesId];
        const sellPrice = 10 + f.level * 5;
        return `<div class="shop-row">
          <div class="shop-item-name" style="color:${sp.color}">${sp.name} Lv.${f.level}</div>
          <div class="shop-item-desc">${sp.type.toUpperCase()}</div>
          <button class="shop-sell-btn" data-idx="${i}" data-price="${sellPrice}">
            SELL ${sellPrice}g
          </button>
        </div>`;
      }).join('')
    : '<div style="font-family:var(--pixel-font);font-size:8px;color:var(--text-dim);">No fish to sell.</div>';

  return `<div class="shop-panel">
    <div class="shop-gold">Gold: <span style="color:var(--gold);">${gold}g</span></div>
    <div class="shop-section-label">── BUY BAIT ──</div>
    ${baitRows}
    <div class="shop-section-label" style="margin-top:10px;">── SELL FISH ──</div>
    ${sellRows}
  </div>`;
}

function bindShopButtons(ship: ShipComponent, island: IslandData, ui: UIManager): void {
  setTimeout(() => {
    document.querySelectorAll('.shop-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id!;
        const price = parseInt((btn as HTMLElement).dataset.price!);
        if ((ship.gold ?? 0) < price) return;
        ship.gold = (ship.gold ?? 0) - price;
        if (!ship.baitInventory) ship.baitInventory = {};
        ship.baitInventory[id] = (ship.baitInventory[id] ?? 0) + 1;
        audio.playSFX('catch');
        // Refresh shop
        const content = document.getElementById('island-content');
        if (content) {
          content.innerHTML = buildShopPanel(ship);
          bindShopButtons(ship, island, ui);
        }
      });
    });
    document.querySelectorAll('.shop-sell-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt((btn as HTMLElement).dataset.idx!);
        const price = parseInt((btn as HTMLElement).dataset.price!);
        ship.party.splice(idx, 1);
        ship.gold = (ship.gold ?? 0) + price;
        audio.playSFX('splash');
        const content = document.getElementById('island-content');
        if (content) {
          content.innerHTML = buildShopPanel(ship);
          bindShopButtons(ship, island, ui);
        }
      });
    });
  }, 30);
}

let stylesInjected = false;
function injectIslandStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    .island-overlay {
      position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.65); z-index: 80;
    }
    .island-panel {
      background: #2A1808; border: 4px solid #8B5E3C;
      box-shadow: 0 0 0 2px #C4854A, 8px 8px 0 rgba(0,0,0,0.5);
      padding: 0; min-width: 340px; max-width: 420px; width: 90%;
      font-family: var(--pixel-font);
    }
    .island-header {
      background: #3A2010; padding: 12px 16px;
      border-bottom: 3px solid #8B5E3C;
      display: flex; justify-content: space-between; align-items: center;
    }
    .island-title { font-size: 11px; color: #F5E6C8; letter-spacing: 2px; }
    .island-gold { font-size: 9px; }
    .island-tabs {
      display: flex; border-bottom: 3px solid #8B5E3C;
    }
    .island-tab {
      flex: 1; padding: 8px 4px; font-family: var(--pixel-font); font-size: 7px;
      background: #2A1808; color: #8B6040; border: none; border-right: 2px solid #8B5E3C;
      cursor: pointer; transition: background 0.1s;
    }
    .island-tab:last-child { border-right: none; }
    .island-tab:hover { background: #3A2010; color: #F5E6C8; }
    .island-tab-active { background: #3A2010 !important; color: #F5E6C8 !important; border-bottom: 2px solid #C4854A; }
    .island-tab-sail { color: var(--hp-green) !important; }
    .island-content { padding: 16px; min-height: 160px; }
    .treasure-label { font-size: 8px; color: var(--text-dim); text-align: center; margin-bottom: 12px; }
    .treasure-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; max-width: 200px; margin: 0 auto;
    }
    .treasure-tile {
      aspect-ratio: 1; background: #1A0E06; border: 2px solid #5C3A1E;
      display: flex; align-items: center; justify-content: center;
      font-family: var(--pixel-font); font-size: 10px; color: #8B6040;
      cursor: pointer; transition: background 0.1s;
    }
    .treasure-tile:hover { background: #2A1808; border-color: #8B5E3C; }
    .treasure-x { color: var(--gold) !important; border-color: var(--gold) !important; font-size: 14px; }
    .treasure-dug { background: #0A0604 !important; color: var(--hp-green) !important; cursor: default; }
    .treasure-result { margin-top: 12px; text-align: center; min-height: 24px; }
    .loot-popup { font-family: var(--pixel-font); font-size: 10px; color: var(--gold); animation: catchPop 0.3s steps(4); }
    .shop-panel { font-family: var(--pixel-font); font-size: 8px; }
    .shop-gold { font-size: 10px; color: var(--text); margin-bottom: 10px; }
    .shop-section-label { color: var(--text-dim); font-size: 7px; margin: 6px 0; }
    .shop-row { display: flex; align-items: center; gap: 6px; margin: 6px 0; flex-wrap: wrap; }
    .shop-item-name { min-width: 80px; color: #F5E6C8; font-size: 7px; }
    .shop-item-desc { flex: 1; color: var(--text-dim); font-size: 6px; }
    .shop-item-owned { color: var(--gold); font-size: 7px; min-width: 24px; }
    .shop-buy-btn, .shop-sell-btn {
      font-family: var(--pixel-font); font-size: 6px; padding: 4px 8px;
      background: #1A3A1A; border: 2px solid var(--hp-green); color: var(--hp-green); cursor: pointer;
    }
    .shop-sell-btn { background: #3A1A1A; border-color: var(--hp-red); color: var(--hp-red); }
    .shop-buy-btn:hover { background: #2A4A2A; }
    .shop-sell-btn:hover { background: #4A2A2A; }
    .heal-panel { text-align: center; padding: 20px; }
    .heal-text { font-family: var(--pixel-font); font-size: 12px; color: var(--hp-green); }
    .explore-panel {}
  `;
  document.head.appendChild(style);
}

export function hideIslandUI(ui: UIManager): void {
  ui.remove('island-ui');
}
