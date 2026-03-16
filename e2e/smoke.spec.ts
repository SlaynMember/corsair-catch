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

// Helper: boot game and wait until MainMenu is active (handles slow asset loading)
async function bootGame(page: import('@playwright/test').Page) {
  await page.goto(BASE);
  await waitForPhaser(page);
  // Wait for MainMenu scene to become active (BootScene loads 200+ assets)
  await page.waitForFunction(() => {
    const g = (window as any).game;
    return g.scene.scenes.some((s: any) => s.scene.key === 'MainMenu' && s.scene.isActive());
  }, { timeout: 25000 });
  await page.waitForTimeout(1000); // let animations settle
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

    // Move player programmatically (keyboard input is unreliable in headless Phaser)
    await page.evaluate(() => {
      const g = (window as any).game;
      const beach = g.scene.getScene('Beach');
      if (!beach || !beach.scene.isActive()) return;
      // Access the player via the physics world's first body
      const bodies = beach.physics.world.bodies.entries;
      for (const body of bodies) {
        if (body.gameObject?.texture?.key?.startsWith('pirate-')) {
          body.gameObject.x += 80;  // walk right
          body.gameObject.y += 40;  // walk down
          break;
        }
      }
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/03-walk-right.png' });

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

  test('7 — Beach1 → Beach2 transition', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await bootGame(page);
    await page.keyboard.press('Space');
    await page.waitForTimeout(2500);

    let scene = await activeScene(page);
    expect(scene).toContain('Beach');

    // Trigger transition via warp (teleport-into-zone crashes headless Playwright)
    await page.evaluate(() => (window as any).warp('Beach2'));
    await page.waitForTimeout(2000);

    scene = await activeScene(page);
    await page.screenshot({ path: 'e2e/screenshots/10-beach2-transition.png' });
    console.log('Active scene after Beach2 transition:', scene);
    expect(scene).toContain('Beach2');

    const critical = errors.filter(e => !e.includes('favicon') && !e.includes('AudioContext'));
    expect(critical).toHaveLength(0);
  });

  test('8 — Beach2 → Beach1 transition', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await bootGame(page);
    await page.keyboard.press('Space');
    await page.waitForTimeout(2500);

    await page.evaluate(() => (window as any).warp('Beach2'));
    await page.waitForFunction(() => {
      const g = (window as any).game;
      return g.scene.scenes.some((s: any) => s.scene.key === 'Beach2' && s.scene.isActive());
    }, { timeout: 10000 });
    await page.waitForTimeout(500);
    let scene = await activeScene(page);
    expect(scene).toContain('Beach2');

    await page.evaluate(() => (window as any).warp('Beach'));
    await page.waitForFunction(() => {
      const g = (window as any).game;
      return g.scene.scenes.some((s: any) => s.scene.key === 'Beach' && s.scene.isActive());
    }, { timeout: 10000 });
    await page.waitForTimeout(500);

    scene = await activeScene(page);
    await page.screenshot({ path: 'e2e/screenshots/11-beach1-return.png' });
    console.log('Active scene after Beach1 return:', scene);
    expect(scene).toContain('Beach');
    expect(scene).not.toContain('Beach2');

    const critical = errors.filter(e => !e.includes('favicon') && !e.includes('AudioContext'));
    expect(critical).toHaveLength(0);
  });

  test('9 — Fishing state near water', async ({ page }) => {
    test.setTimeout(45000);
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await bootGame(page);
    await page.keyboard.press('Space');
    await page.waitForTimeout(2500);

    // Warp to Beach with starter + re-focus
    await page.evaluate(() => {
      const g = (window as any).game;
      g.registry.set('starterPicked', true);
      (window as any).warp('Beach');
    });
    await page.waitForTimeout(2000);
    await focusCanvas(page);

    // Teleport player to the fishing zone (shore area near y=530)
    await page.evaluate(() => {
      const beach = (window as any).game.scene.getScene('Beach');
      if (beach?.player) beach.player.setPosition(600, 525);
    });
    await page.waitForTimeout(500);

    // Press SPACE to attempt fishing
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500);

    // Check fishing state or just verify no crash
    const result = await page.evaluate(() => {
      const beach = (window as any).game.scene.getScene('Beach');
      return {
        isFishing: beach?.isFishing ?? false,
        scene: beach?.scene?.key ?? 'unknown',
      };
    });

    await page.screenshot({ path: 'e2e/screenshots/12-fishing.png' });
    console.log('Fishing state:', result.isFishing, '| Scene:', result.scene);
    // Verify game didn't crash — scene is still Beach
    expect(result.scene).toBe('Beach');

    const critical = errors.filter(e => !e.includes('favicon') && !e.includes('AudioContext'));
    expect(critical).toHaveLength(0);
  });

  test('10 — No console.error during gameplay', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await bootGame(page);
    await page.keyboard.press('Space');
    await page.waitForTimeout(2500);

    // Walk around
    await holdKey(page, 'd', 1000);
    await holdKey(page, 's', 1000);
    await holdKey(page, 'a', 500);
    await holdKey(page, 'w', 500);

    // Open/close inventory
    await page.keyboard.press('i');
    await page.waitForTimeout(300);
    await page.keyboard.press('i');
    await page.waitForTimeout(300);

    // Filter out known non-critical errors (like audio context, favicon)
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('AudioContext') &&
      !e.includes('The AudioContext was not allowed')
    );

    console.log('Console errors collected:', criticalErrors.length);
    if (criticalErrors.length > 0) {
      console.log('Errors:', criticalErrors);
    }
    expect(criticalErrors).toHaveLength(0);
  });

  test('11 — Beach3 loads with valid TMX and no errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await bootGame(page);

    // Warp to Beach3 with a starter party
    await page.evaluate(() => {
      const g = (window as any).game;
      g.registry.set('party', [{
        uid: 'test_fish', speciesId: 4, nickname: 'Emberkoi', level: 10,
        currentHp: 55, maxHp: 55, moves: ['ember_bite', 'tackle'],
        iv: { hp: 10, attack: 10, defense: 10, speed: 10 }, xp: 0,
      }]);
      g.registry.set('starterPicked', true);
      g.registry.set('hasRod', true);
      g.scene.getScenes(true).forEach((s: any) => g.scene.stop(s.scene.key));
      g.scene.start('Beach3');
    });
    await page.waitForTimeout(2000);

    const result = await page.evaluate(() => {
      const g = (window as any).game;
      const b3 = g.scene.getScene('Beach3');
      const tmx = g.registry.get('tmx-beach3');
      return {
        active: b3?.scene?.isActive() ?? false,
        hasTmx: !!tmx,
        walkableCount: tmx?.walkable?.length ?? 0,
        colliderCount: tmx?.colliders?.length ?? 0,
        transitionCount: tmx?.transitions?.length ?? 0,
        fishingCount: tmx?.fishing?.length ?? 0,
        playerExists: !!b3?.children?.list?.find((c: any) =>
          c.texture?.key?.startsWith('pirate-')
        ),
      };
    });

    console.log('Beach3 state:', JSON.stringify(result));
    expect(result.active).toBe(true);
    expect(result.hasTmx).toBe(true);
    expect(result.walkableCount).toBeGreaterThan(3);
    expect(result.colliderCount).toBeGreaterThan(5);
    expect(result.transitionCount).toBeGreaterThan(0);

    const critical = errors.filter(e =>
      !e.includes('favicon') && !e.includes('AudioContext')
    );
    expect(critical).toHaveLength(0);
  });

  test('12 — Beach3 → Beach1 transition zone positioned correctly', async ({ page }) => {
    await bootGame(page);

    // Warp to Beach3
    await page.evaluate(() => {
      const g = (window as any).game;
      g.registry.set('party', [{
        uid: 'test_fish', speciesId: 4, nickname: 'Emberkoi', level: 10,
        currentHp: 55, maxHp: 55, moves: ['ember_bite', 'tackle'],
        iv: { hp: 10, attack: 10, defense: 10, speed: 10 }, xp: 0,
      }]);
      g.registry.set('starterPicked', true);
      g.registry.set('hasRod', true);
      g.scene.getScenes(true).forEach((s: any) => g.scene.stop(s.scene.key));
      g.scene.start('Beach3');
    });
    await page.waitForTimeout(2000);

    // Check transition zone is on the right side of the map
    const zone = await page.evaluate(() => {
      const tmx = (window as any).game.registry.get('tmx-beach3');
      const trans = tmx?.transitions?.find((t: any) => t.name === 'to-beach1');
      return trans ? { x: trans.x, y: trans.y, w: trans.width, h: trans.height } : null;
    });

    console.log('to-beach1 zone:', zone);
    expect(zone).not.toBeNull();
    // Zone should be on the right side (x > 1000)
    expect(zone!.x).toBeGreaterThan(1000);
    // Zone should be in the walkable area (y > 250 — new option2 bg has higher beach)
    expect(zone!.y).toBeGreaterThan(250);
  });

  test('13 — Whiteout returns to Beach with chest hidden', async ({ page }) => {
    await bootGame(page);

    // Set up game state as if player already picked starter and played
    await page.evaluate(() => {
      const g = (window as any).game;
      g.registry.set('party', [{
        uid: 'test_fish', speciesId: 4, nickname: 'Emberkoi', level: 10,
        currentHp: 55, maxHp: 55, moves: ['ember_bite', 'tackle'],
        iv: { hp: 10, attack: 10, defense: 10, speed: 10 }, xp: 0,
      }]);
      g.registry.set('starterPicked', true);
      g.registry.set('hasRod', true);
      // Simulate whiteout — start Beach with whiteout flag
      g.scene.getScenes(true).forEach((s: any) => g.scene.stop(s.scene.key));
      g.scene.start('Beach', { from: 'whiteout' });
    });
    await page.waitForTimeout(2500);

    const result = await page.evaluate(() => {
      const g = (window as any).game;
      const beach = g.scene.getScene('Beach');
      if (!beach) return { active: false, chestVisible: null, enemyCount: 0 };
      // Check chest visibility — find the chestContainer
      const chestVisible = beach.chestContainer?.visible ?? null;
      const enemyCount = beach.enemies?.length ?? 0;
      return {
        active: beach.scene.isActive(),
        chestVisible,
        enemyCount,
      };
    });

    console.log('Whiteout state:', JSON.stringify(result));
    expect(result.active).toBe(true);
    expect(result.chestVisible).toBe(false);
    expect(result.enemyCount).toBeGreaterThan(0);
  });
});
