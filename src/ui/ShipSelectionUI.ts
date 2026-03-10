import { UIManager } from './UIManager';
import { SHIPS, ShipBlueprint, ShipRarity } from '../data/ship-db';
import type { ShipComponent } from '../components/ShipComponent';

// Rarity color mapping (matches fish UI)
const RARITY_COLORS: Record<ShipRarity, string> = {
  [ShipRarity.COMMON]: 'var(--text-dim)',
  [ShipRarity.UNCOMMON]: '#5FD47D', // hp-green
  [ShipRarity.RARE]: 'var(--gold)',
  [ShipRarity.LEGENDARY]: '#FFD700', // bright gold
};

const CLASS_COLORS: Record<string, string> = {
  'Merchant': '#6BA3D4',     // light blue
  'Pirate': '#D44747',       // red
  'Naval': '#4A7C99',        // steel blue
  'TreasureHunter': '#C4A038', // gold-ish
  'Ghost': '#9B7EC9',        // purple
  'Storm': '#667A8C',        // gray-blue
};

export function showShipSelection(
  ui: UIManager,
  currentShip: ShipComponent,
  onSelectShip: (shipId: number) => void,
  onClose: () => void
): void {
  // Build ship card grid
  const shipCardsHtml = SHIPS.map((ship) => {
    const isOwned = ship.id === currentShip.shipId;
    const rarityColor = RARITY_COLORS[ship.rarity];
    const classColor = CLASS_COLORS[ship.class];

    const statsHtml = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px; font-size:8px;">
        <div style="display:flex; justify-content:space-between;">
          <span style="color:var(--text-dim);">HULL</span>
          <span style="color:#FF6B6B; font-weight:bold;">${ship.baseStats.hull}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:var(--text-dim);">SPEED</span>
          <span style="color:#FFD040; font-weight:bold;">${ship.baseStats.speed}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:var(--text-dim);">CARGO</span>
          <span style="color:#5FD47D; font-weight:bold;">${ship.baseStats.cargo}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:var(--text-dim);">MANEUVER</span>
          <span style="color:#A8D5FF; font-weight:bold;">${ship.baseStats.maneuver}</span>
        </div>
      </div>
    `;

    const abilitiesHtml = ship.abilities
      .map((ab) => `<div style="font-size:7px; color:${classColor}; margin-top:4px;">▸ <b>${ab.name}</b></div>`)
      .join('');

    const currentClass = `<span style="color:${classColor}; font-weight:bold;">${ship.class}</span>`;
    const buttonText = isOwned ? 'CURRENT SHIP' : 'SELECT';
    const buttonColor = isOwned ? 'rgba(200, 150, 80, 0.3)' : 'var(--button-bg)';
    const buttonCursor = isOwned ? 'default' : 'pointer';

    return `
      <div style="
        background:#1A1410;
        border:2px solid #8B6B4D;
        border-radius:2px;
        padding:12px;
        margin-bottom:12px;
        box-shadow: inset 1px 1px 0 rgba(210, 166, 120, 0.1), 0 4px 0 rgba(0, 0, 0, 0.4);
      ">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div>
            <div style="font-family:var(--pixel-font); font-size:10px; color:var(--text); font-weight:bold;">
              ${ship.name}
            </div>
            <div style="font-family:var(--pixel-font); font-size:8px; color:${rarityColor}; margin-top:2px;">
              ${ship.rarity.toUpperCase()} • ${currentClass}
            </div>
          </div>
          <button
            class="ship-select-btn"
            data-ship-id="${ship.id}"
            style="
              background:${buttonColor};
              border:1px solid #8B6B4D;
              color:${isOwned ? 'var(--text-dim)' : 'var(--text)'};
              padding:6px 12px;
              font-family:var(--pixel-font);
              font-size:7px;
              cursor:${buttonCursor};
              font-weight:bold;
              letter-spacing:1px;
              ${isOwned ? 'opacity:0.5;' : ''}
            "
            ${isOwned ? 'disabled' : ''}
          >
            ${buttonText}
          </button>
        </div>

        ${statsHtml}

        <div style="margin-top:8px;">
          ${abilitiesHtml}
        </div>
      </div>
    `;
  }).join('');

  const panel = ui.show(
    'ship-selection',
    `<div style="
      position:fixed; inset:0; background:rgba(0,0,0,0.85);
      display:flex; align-items:center; justify-content:center;
      z-index:9000;
    ">
      <div style="
        width:90%; max-width:600px; max-height:90vh;
        background:#0A0A0A;
        border:4px solid #8B6B4D;
        box-shadow: inset 2px 2px 0 rgba(210, 166, 120, 0.15), 0 8px 0 rgba(0, 0, 0, 0.8);
      ">
        <!-- Header -->
        <div style="
          background:linear-gradient(to right, #2C1011 0%, #3D2B1F 50%, #2C1011 100%);
          padding:16px;
          border-bottom:2px solid #8B6B4D;
          display:flex; justify-content:space-between; align-items:center;
        ">
          <div style="
            font-family:var(--pixel-font);
            font-size:14px;
            color:var(--gold);
            text-shadow:2px 2px 0 rgba(0,0,0,0.8);
            letter-spacing:2px;
          ">
            ⚓ SHIP MANIFEST ⚓
          </div>
          <button
            id="ship-selection-close"
            style="
              background:transparent;
              border:1px solid #8B6B4D;
              color:var(--gold);
              font-size:14px;
              width:28px; height:28px;
              cursor:pointer;
              font-weight:bold;
            "
          >✕</button>
        </div>

        <!-- Ship cards (scrollable) -->
        <div style="
          padding:16px;
          max-height:calc(90vh - 120px);
          overflow-y:auto;
        ">
          <!-- Current ship info highlight -->
          <div style="
            background:rgba(253, 87, 75, 0.1);
            border-left:3px solid #FD574B;
            padding:12px;
            margin-bottom:16px;
            font-family:var(--pixel-font);
            font-size:8px;
          ">
            <div style="color:var(--gold);">CURRENT VESSEL</div>
            <div style="color:var(--text); margin-top:2px; font-size:9px; font-weight:bold;">
              ${SHIPS.find(s => s.id === currentShip.shipId)?.name || 'Unknown Ship'}
            </div>
          </div>

          <!-- All ships -->
          ${shipCardsHtml}
        </div>

        <!-- Footer -->
        <div style="
          background:#1A1410;
          border-top:2px solid #8B6B4D;
          padding:12px 16px;
          font-family:var(--pixel-font);
          font-size:7px;
          color:var(--text-dim);
          text-align:center;
        ">
          Select a ship to upgrade. Legendary vessels unlock new abilities.
        </div>
      </div>
    </div>`
  );

  // Event listeners
  const closeBtn = panel.querySelector('#ship-selection-close') as HTMLButtonElement;
  closeBtn?.addEventListener('click', onClose);

  const shipBtns = panel.querySelectorAll('.ship-select-btn') as NodeListOf<HTMLButtonElement>;
  shipBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const shipId = parseInt(btn.getAttribute('data-ship-id') || '1');
      onSelectShip(shipId);
      onClose();
    });
  });

  // Close on background click
  const backdrop = panel.parentElement;
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) onClose();
  });
}

/**
 * Mini ship stats card for HUD/inventory
 * Shows current ship stats at a glance
 */
export function buildShipStatsPanel(ship: ShipComponent, shipBlueprint?: any): string {
  if (!shipBlueprint) return '';

  const classColor = CLASS_COLORS[shipBlueprint.class] || 'var(--text)';

  return `
    <div style="
      background:#1A1410;
      border:2px solid #8B6B4D;
      padding:12px;
      margin-top:12px;
      font-family:var(--pixel-font);
    ">
      <div style="font-size:10px; color:var(--gold); margin-bottom:8px; letter-spacing:1px;">
        ⚓ ${shipBlueprint.name}
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
        <div style="font-size:8px;">
          <div style="color:var(--text-dim);">HULL</div>
          <div style="color:#FF6B6B; font-weight:bold; margin-top:2px;">
            ${ship.hullHp}/${ship.maxHullHp}
          </div>
        </div>
        <div style="font-size:8px;">
          <div style="color:var(--text-dim);">CLASS</div>
          <div style="color:${classColor}; font-weight:bold; margin-top:2px;">
            ${shipBlueprint.class}
          </div>
        </div>
      </div>
      <div style="background:#0a0a18; height:4px; border:1px solid #3a3a4a; margin:8px 0;">
        <div style="
          height:100%;
          background:#FF6B6B;
          width:${(ship.hullHp / ship.maxHullHp) * 100}%;
        "></div>
      </div>
    </div>
  `;
}
