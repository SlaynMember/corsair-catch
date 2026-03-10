import { UIManager } from './UIManager';

/** Play a Pokemon-style battle intro transition, then call onDone */
export function playBattleIntro(
  ui: UIManager,
  enemyName: string,
  onDone: () => void
): void {
  // Build the wipe bars (8 diagonal bars that sweep across)
  let wipeBars = '';
  for (let i = 0; i < 8; i++) {
    wipeBars += `<div class="wipe-bar"></div>`;
  }

  ui.show(
    'battle-intro',
    `<div class="battle-intro">
      <div class="battle-intro-flash"></div>
      ${wipeBars}
      <div class="battle-intro-vs">VS</div>
      <div class="battle-intro-name">${enemyName} wants to fight!</div>
    </div>`
  );

  // Remove after animation completes (~1.2s)
  setTimeout(() => {
    ui.remove('battle-intro');
    onDone();
  }, 1200);
}

/** Play a fishing zone intro transition, then call onDone */
export function playFishingIntro(
  ui: UIManager,
  zoneName: string,
  zoneColor: string,
  onDone: () => void
): void {
  ui.show(
    'fishing-intro',
    `<div class="fishing-intro">
      <div class="fishing-intro-ripple" style="border-color: ${zoneColor}"></div>
      <div class="fishing-intro-ripple" style="border-color: ${zoneColor}80"></div>
      <div class="fishing-intro-ripple" style="border-color: ${zoneColor}40"></div>
      <div class="fishing-intro-bg"></div>
      <div class="fishing-intro-text">FISHING!</div>
      <div class="fishing-intro-zone-name">${zoneName}</div>
    </div>`
  );

  // Remove after animation completes (~1s)
  setTimeout(() => {
    ui.remove('fishing-intro');
    onDone();
  }, 1000);
}
