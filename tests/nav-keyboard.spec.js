import { test, expect } from '@playwright/test';

// The desktop mega-menus opened only on mouseenter and their items were
// <div onClick>. A keyboard user could not reach the product, solutions or
// resources navigation at all, and several "Ресурси" items had no destination
// — they closed the menu and did nothing. These tests hold the fix.
test.describe('desktop mega-menu keyboard access', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  const trigger = (page, name) =>
    page.getByRole('button', { name: new RegExp(name, 'i') }).first();

  test('a trigger reports its state and opens on click', async ({ page }) => {
    const t = trigger(page, 'Производ');
    await expect(t).toHaveAttribute('aria-expanded', 'false');
    await expect(t).toHaveAttribute('aria-haspopup', 'true');

    await t.click();
    await expect(t).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#megamenu-features')).toBeVisible();
  });

  test('Escape closes the menu and returns focus to the trigger', async ({ page }) => {
    const t = trigger(page, 'Ресурси');
    await t.click();
    await expect(page.locator('#megamenu-resources')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(t).toHaveAttribute('aria-expanded', 'false');
    await expect(t).toBeFocused();
  });

  test('every menu item is a real button, reachable by keyboard', async ({ page }) => {
    await trigger(page, 'Ресурси').click();
    const items = page.locator('#megamenu-resources button');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(4);

    for (let i = 0; i < count; i++) {
      await expect(items.nth(i)).toBeEnabled();
    }
  });

  test('a resources item actually navigates instead of just closing', async ({ page }) => {
    await trigger(page, 'Ресурси').click();
    await page.locator('#megamenu-resources button', { hasText: 'Блог' }).click();
    await expect(page).toHaveURL(/\/blog/);
  });

  test('an anonymous visitor is sent to the demo, not into a login modal', async ({ page }) => {
    await trigger(page, 'Производ').click();
    await page.locator('#megamenu-features button', { hasText: 'Word Cloud' }).click();
    await expect(page).toHaveURL(/\/demo/);
  });
});
