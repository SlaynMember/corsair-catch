import { test } from '@playwright/test';

test.use({ viewport: { width: 932, height: 430 }, hasTouch: true });

async function waitForScene(page: any, sceneKey: string, timeout = 15000) {
  await page.waitForFunction(
    (key: string) => {
      const game = (window as any).game;
      return game?.scene?.getScene(key)?.scene?.isActive();
    },
    sceneKey,
    { timeout },
  );
}

test('mobile UI screenshots', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.evaluate(() => localStorage.removeItem('corsair-catch-save'));
  await page.reload();

  await waitForScene(page, 'MainMenu');
  await page.waitForTimeout(3500);
  await page.screenshot({ path: 'e2e/screenshots/mobile-01-menu.png' });

  // Click New Game — use mouse.click to bypass canvas intercept issue
  const box = await page.locator('#game-shell canvas').first().boundingBox();
  if (!box) return;

  const scale = box.height / 720;
  const gameW = 1280 * scale;
  const xOff = box.x + (box.width - gameW) / 2;

  // New Game button ~(640, 400) in game coords
  await page.mouse.click(xOff + 640 * scale, box.y + 400 * scale);
  await page.waitForTimeout(500);
  await page.mouse.click(xOff + 640 * scale, box.y + 400 * scale);

  try {
    await waitForScene(page, 'Beach', 8000);
  } catch {
    await page.keyboard.press('Space');
    await waitForScene(page, 'Beach', 8000);
  }

  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'e2e/screenshots/mobile-02-beach.png' });

  // Focus game and open inventory
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(200);
  await page.keyboard.press('i');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'e2e/screenshots/mobile-03-inventory.png' });

  // Close inventory
  await page.keyboard.press('i');
  await page.waitForTimeout(300);

  // Walk toward chest — hold D key for a bit
  await page.keyboard.down('d');
  await page.waitForTimeout(800);
  await page.keyboard.up('d');
  await page.waitForTimeout(300);

  // Interact with chest if near
  await page.keyboard.press('Space');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'e2e/screenshots/mobile-04-dialogue.png' });
});
