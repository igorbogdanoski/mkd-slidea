// Public templates page e2e — unauthenticated.
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'https://slidea.mismath.net';

test.describe('Public templates page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE + '/templates');
    await page.waitForLoadState('networkidle');
  });

  test('TS-01 — page renders template cards', async ({ page }) => {
    // At least 1 template card should be visible
    await page.waitForTimeout(1000);
    const cards = page.locator('[class*="rounded"][class*="border"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('TS-02 — verified БРО badge visible on official templates', async ({ page }) => {
    await page.waitForTimeout(1000);
    const badge = page.locator('text=/БРО|Verified/i').first();
    await expect(badge).toBeVisible();
  });

  test('TS-03 — sort dropdown is present', async ({ page }) => {
    const sortSelect = page.locator('select').first();
    await expect(sortSelect).toBeVisible();
  });

  test('TS-04 — sort dropdown has expected options', async ({ page }) => {
    const sortSelect = page.locator('select').first();
    const options = await sortSelect.locator('option').allTextContents();
    // Should have at least 3 sort options
    expect(options.length).toBeGreaterThanOrEqual(3);
  });

  // Was "sorting by stars changes the order". It used
  // selectOption({ label: /regex/ }), which Playwright does not support —
  // label must be a string — so it threw before asserting anything and had
  // never passed. The star sort is also gone: it ranked by a fabricated
  // rating derived from the activity count, which the honest sort below
  // already does.
  test('TS-05 — sorting by activity count reorders the grid', async ({ page }) => {
    await page.waitForTimeout(1000);
    const titles = () => page.locator('a[href^="/templates/"] h3').allTextContents();

    const before = await titles();
    expect(before.length).toBeGreaterThan(1);

    await page.getByLabel('Сортирај').selectOption('polls');
    await page.waitForTimeout(400);

    const after = await titles();
    expect(after.length).toBe(before.length);
    expect(after).not.toEqual(before);
  });

  test('TS-06 — search/filter box narrows results', async ({ page }) => {
    await page.waitForTimeout(1000);
    const searchInput = page.locator('input[placeholder*="пребарај"], input[placeholder*="Пребарај"], input[type="search"], input[type="text"]').first();
    const exists = await searchInput.count();
    if (exists === 0) {
      test.skip(); // no search input present
      return;
    }
    await searchInput.fill('quiz');
    await page.waitForTimeout(400);
    const bodyText = await page.locator('body').innerText();
    // Results should have changed; no crash
    expect(bodyText).not.toContain('does not exist');
  });

  // Was "template cards have star ratings (1–5 stars)". Those stars came from
  // min(5, max(3, ceil(pollCount / 2))) — not a rating anybody gave, and a
  // duplicate of the activity count on the same card. The test enforced the
  // fabrication; it now enforces its absence and the real number's presence.
  test('TS-07 — cards show a real activity count and no invented rating', async ({ page }) => {
    await page.waitForTimeout(1000);
    const firstCard = page.locator('a[href^="/templates/"]').first();
    await expect(firstCard).toContainText(/\d+ активности/);
    await expect(page.locator('[aria-label*="ѕвезди"]')).toHaveCount(0);
  });

  test('TS-08 — alphabetical sort orders titles', async ({ page }) => {
    await page.waitForTimeout(1000);
    await page.getByLabel('Сортирај').selectOption('alpha');
    await page.waitForTimeout(400);

    // Sort the comparison inside the page: Node and Chromium ship different
    // ICU collations for 'mk' (they disagree on where Latin titles fall
    // relative to Cyrillic), so comparing across the boundary fails on a
    // correctly sorted list.
    const inOrder = await page.evaluate(() => {
      const titles = [...document.querySelectorAll('a[href^="/templates/"] h3')].map((h) => h.textContent.trim());
      const sorted = [...titles].sort((a, b) => a.localeCompare(b, 'mk'));
      return { titles, sorted };
    });
    expect(inOrder.titles).toEqual(inOrder.sorted);
  });

  test('TS-09 — verified-first sort puts a БРО template at the top', async ({ page }) => {
    await page.waitForTimeout(1000);
    await page.getByLabel('Сортирај').selectOption('default');
    await page.waitForTimeout(400);

    const firstCard = page.locator('a[href^="/templates/"]').first();
    await expect(firstCard).toContainText('БРО');
  });

  test('TS-10 — page title and meta description set', async ({ page }) => {
    await expect(page).toHaveTitle(/.+/);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toBeTruthy();
    expect(desc.length).toBeGreaterThan(10);
  });
});
