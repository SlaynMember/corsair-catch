import { UIManager } from './UIManager';
import type { ShipComponent } from '../components/ShipComponent';
import { FISH_SPECIES, getXpForLevel } from '../data/fish-db';
import { hpBarColor } from './ui-utils';
import { WORLD_SIZE } from '../data/constants';

let lastHudHash = '';

const TIPS = [
  'Sail to glowing rings to fish!',
  'Hold SPACE to charge your cast for better catches.',
  'Approach island docks to heal your crew.',
  'Type matchups matter! Check the TYPE CHART in inventory.',
  'Press I to see your crew and collection.',
  'Rare fish appear with low odds — keep fishing!',
  'Hook fish only when the bobber dunks under.',
  'Your crew heals slowly while sailing.',
  'Avoid pirate ships until your crew is ready!',
  'UNCOMMON and RARE fish have better stats.',
  'You can release fish in inventory to make room.',
  'Defeat all 3 pirate captains to conquer the seas!',
  'Explore islands to find buried treasure!',
];
let tipIndex = 0;
let tipTimer = 0;

export function showHUD(ui: UIManager, ship: ShipComponent): void {
  const fishCount = ship.party.length;

  // Rotate tips every 15 seconds
  const now = Date.now() / 1000;
  if (now - tipTimer > 15) {
    tipTimer = now;
    tipIndex = (tipIndex + 1) % TIPS.length;
  }
  const currentTip = TIPS[tipIndex];

  // Build a hash of party state to avoid unnecessary DOM rebuilds
  const hudHash = ship.party.map(f => `${f.speciesId}:${f.currentHp}:${f.maxHp}:${f.xp}:${f.level}`).join('|') + '|' + tipIndex;
  if (hudHash === lastHudHash) return;
  lastHudHash = hudHash;

  const crewDots = Array.from({ length: ship.maxPartySize }, (_, i) =>
    i < fishCount
      ? '<span style="color:#40c840;">&#9632;</span>'
      : '<span style="color:#2a4a6a;">&#9632;</span>'
  ).join(' ');

  // Lead fish XP bar
  let leadXpHtml = '';
  if (ship.party.length > 0) {
    const lead = ship.party[0];
    const sp = FISH_SPECIES[lead.speciesId];
    const xpToNext = getXpForLevel(lead.level + 1);
    const xpPct = xpToNext > 0 ? Math.min(100, Math.round((lead.xp / xpToNext) * 100)) : 100;
    leadXpHtml = `<div style="display:flex;align-items:center;gap:4px;margin-top:4px;">
      <span style="font-size:6px;color:${sp.color};min-width:24px;">${(lead.nickname ?? sp.name).slice(0, 5)}</span>
      <div style="flex:1;height:3px;background:#0a0a18;border:1px solid #2a4a6a;">
        <div style="width:${xpPct}%;height:100%;background:var(--water);"></div>
      </div>
      <span style="font-size:5px;color:var(--text-dim);">XP</span>
    </div>`;
  }

  const partyBars = ship.party.map(f => {
    const sp = FISH_SPECIES[f.speciesId];
    const pct = Math.round((f.currentHp / f.maxHp) * 100);
    const barColor = hpBarColor(f.currentHp, f.maxHp);
    return `<div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
      <span style="font-size:6px;color:${sp.color};min-width:24px;">${(f.nickname ?? sp.name).slice(0, 4).toUpperCase()}</span>
      <div style="flex:1;height:4px;background:#0a0a18;border:1px solid #2a4a6a;">
        <div style="width:${pct}%;height:100%;background:${barColor};"></div>
      </div>
    </div>`;
  }).join('');

  ui.show(
    'hud',
    `<div class="hud">
      <div class="hud-top-left">
        <div class="fish-count">CREW ${fishCount}/${ship.maxPartySize} ${crewDots}</div>
        ${partyBars ? `<div class="fish-count" style="padding:4px 8px;font-size:7px;">${partyBars}${leadXpHtml}</div>` : ''}
      </div>
      <div class="minimap-container">
        <canvas id="minimap-canvas" width="150" height="150"></canvas>
      </div>
      <div class="controls-hint">
        WASD SAIL<br>
        SPC INTERACT &nbsp; I INVENTORY<br>
        ESC SETTINGS<br>
        <span style="color:var(--gold-dim);margin-top:4px;display:block;">${currentTip}</span>
      </div>
    </div>`
  );
}

export interface MinimapEntity {
  x: number;
  z: number;
  color: string;
  type?: 'zone' | 'island' | 'enemy';
  radius?: number;
  label?: string;
}

export function updateMinimap(
  playerX: number,
  playerZ: number,
  playerRotation: number,
  entities: MinimapEntity[]
): void {
  const canvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;
  const worldBound = WORLD_SIZE; // -WORLD_SIZE to +WORLD_SIZE

  ctx.clearRect(0, 0, w, h);

  // Background — dark ocean
  ctx.fillStyle = '#050e20';
  ctx.fillRect(0, 0, w, h);

  // Grid lines (subtle)
  ctx.strokeStyle = '#0a1e38';
  ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 15) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
  }

  // Convert world coords to minimap coords
  const toMapX = (x: number) => ((x + worldBound) / (worldBound * 2)) * w;
  const toMapY = (z: number) => ((z + worldBound) / (worldBound * 2)) * h;

  // Draw zone areas as translucent circles
  for (const e of entities) {
    if (e.type === 'zone' && e.radius) {
      const mx = toMapX(e.x);
      const my = toMapY(e.z);
      const mr = Math.max(3, (e.radius / (worldBound * 2)) * w);
      ctx.fillStyle = e.color + '20';
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = e.color + '60';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (e.label) {
        ctx.font = '5px "Press Start 2P", monospace';
        ctx.fillStyle = e.color + 'aa';
        ctx.textAlign = 'center';
        ctx.fillText(e.label, mx, my + mr + 8);
      }
    }
  }

  // Draw entities as pixel squares
  for (const e of entities) {
    const mx = Math.floor(toMapX(e.x));
    const my = Math.floor(toMapY(e.z));

    if (e.type === 'enemy') {
      ctx.fillStyle = '#cc3030';
      ctx.beginPath();
      ctx.moveTo(mx, my - 3); ctx.lineTo(mx + 3, my);
      ctx.lineTo(mx, my + 3); ctx.lineTo(mx - 3, my);
      ctx.closePath(); ctx.fill();
    } else if (e.type === 'island') {
      ctx.fillStyle = '#6b8e23';
      ctx.fillRect(mx - 3, my - 3, 7, 7);
    } else if (e.type !== 'zone') {
      ctx.fillStyle = e.color;
      ctx.fillRect(mx - 2, my - 2, 5, 5);
    }
  }

  // Player — directional triangle
  const px = toMapX(playerX);
  const py = toMapY(playerZ);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(playerRotation);
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(0, -5); ctx.lineTo(-3, 3); ctx.lineTo(3, 3);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  // Compass labels
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillStyle = '#4a7a9a'; ctx.textAlign = 'center';
  ctx.fillText('N', w / 2, 10); ctx.fillText('S', w / 2, h - 3);
  ctx.fillText('W', 8, h / 2 + 3); ctx.fillText('E', w - 8, h / 2 + 3);

  // Border highlight
  ctx.strokeStyle = '#2a4a6a'; ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, w, h);
}

export function hideHUD(ui: UIManager): void {
  lastHudHash = '';
  ui.hide('hud');
}
