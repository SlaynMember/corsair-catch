import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

// Helper: wait for Phaser to be ready
async function waitForPhaser(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    const g = (window as any).game;
    return g && g.scene && g.scene.scenes && g.scene.scenes.length > 0;
  }, { timeout: 15000 });
}

// Helper: focus the Phaser canvas so keyboard events reach it
async function focusCanvas(page: import('@playwright/test').Page) {
  // Phaser renders to the second canvas inside #game-shell
  const canvas = page.locator('#game-shell canvas').last();
  await canvas.click({ force: true });
}

// Helper: get active scene key
async function activeScene(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => {
    const g = (window as any).game;
    const running = g.scene.scenes.filter((s: any) => s.scene.isActive());
    return running.map((s: any) => s.scene.key).join(', ');
  });
}

// Helper: dump game state
async function dumpState(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const g = (window as any).game;
    const reg = g.registry;
    return {
      scenes: g.scene.scenes.map((s: any) => ({
        key: s.scene.key,
        active: s.scene.isActive(),
      })),
      party: reg?.get('party') ?? null,
      inventory: reg?.get('inventory') ?? null,
      starterChosen: reg?.get('starterChosen') ?? null,
      selectedShip: reg?.get('selectedShip') ?? null,
    };
  });
}

// Helper: press key for a duration
async function holdKey(page: import('@playwright/test').Page, key: string, ms: number) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
}

// Helper: boot game and get past loading
async function bootGame(page: import('@playwright/test').Page) {
  await page.goto(BASE);
  await waitForPhaser(page);
  await page.waitForTimeout(3000); // let BootScene → MainMenu transition + animations
  await focusCanvas(page);
}

// ─── Tests ───────────────────────────────────────────────────────────

test.describe('Corsair Catch Smoke Tests', () => {

  test('1 — Game boots to MainMenu', async ({ page }) => {
    await bootGame(page);

    const scene = await activeScene(page);
    expect(scene).toContain('MainMenu');

    await page.screenshot({ path: 'e2e/screenshots/01-main-menu.png' });
    console.log('Active scene:', scene);
  });

  test('2 — NEW GAME → Beach', async ({ page }) => {
    await bootGame(page);

    // Press SPACE on canvas to start new game
    await page.keyboard.press('Space');
    await page.waitForTimeout(2500);

    const scene = await activeScene(page);
    await page.screenshot({ path: 'e2e/screenshots/02-beach-scene.png' });
    console.log('Active scene:', scene);

    expect(scene).toContain('Beach');
  });

  test('3 — Walk around beach', async ({ page }) => {
    await bootGame(page);
    await page.keyboard.press('Space');
    await page.waitForTimeout(2500);

    // Walk right
    await holdKey(page, 'd', 1000);
    await page.screenshot({ path: 'e2e/screenshots/03-walk-right.png' });

    // Walk down toward water
    await holdKey(page, 's', 1500);
    await page.screenshot({ path: 'e2e/screenshots/04-walk-down.png' });

    // Walk left
    await holdKey(page, 'a', 800);
    await page.screenshot({ path: 'e2e/screenshots/05-walk-left.png' });

    const scene = await activeScene(page);
    expect(scene).toContain('Beach');
  });

  test('4 — Open treasure chest + starter picker', async ({ page }) => {
    await bootGame(page);
    await page.keyboard.press('Space');
    await page.waitForTimeout(2500);

    // Walk toward chest (around 440, 505) — player starts ~center
    await holdKey(page, 'a', 500);
    await holdKey(page, 's', 800);

    // Interact with chest
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500);

    await page.screenshot({ path: 'e2e/screenshots/06-starter-picker.png' });

    // Pick first starter
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'e2e/screenshots/07-after-starter.png' });

    const state = await dumpState(page);
    console.log('Game state:', JSON.stringify(state, null, 2));
  });

  test('5 — Open inventory', async ({ page }) => {
    await bootGame(page);
    await page.keyboard.press('Space');
    await page.waitForTimeout(2500);

    // Open inventory
    await page.keyboard.press('i');
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'e2e/screenshots/08-inventory.png' });

    // Close inventory
    await page.keyboard.press('i');
    await page.waitForTimeout(300);
  });

  test('6 — Dump full game state', async ({ page }) => {
    await bootGame(page);
    await page.keyboard.press('Space');
    await page.waitForTimeout(2500);

    const state = await dumpState(page);
    console.log('\n══════ GAME STATE DUMP ══════');
    console.log(JSON.stringify(state, null, 2));
    console.log('═════════════════════════════\n');

    await page.screenshot({ path: 'e2e/screenshots/09-state-dump.png' });
  });
});
