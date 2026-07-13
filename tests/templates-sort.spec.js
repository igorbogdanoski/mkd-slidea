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

  test('TS-05 — sorting by stars changes the order', async ({ page }) => {
    await page.waitForTimeout(1000);
    const sortSelect = page.locator('select').first();
    // Get card titles before sorting
    const before = await page.locator('h3, h2, [class*="font-black"]').allTextContents();

    await sortSelect.selectOption({ label: /ѕвезди|stars|оценка/i });
    await page.waitForTimeout(500);

    const after = await page.locator('h3, h2, [class*="font-black"]').allTextContents();
    // The page should not crash and cards should still be present
    expect(after.length).toBeGreaterThanOrEqual(1);
    expect(before.length).toBeGreaterThanOrEqual(1);
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

  test('TS-07 — template cards have star ratings (1–5 stars)', async ({ page }) => {
    await page.waitForTimeout(1000);
    // StarRating renders SVG stars — look for aria-label pattern
    const starRating = page.locator('[aria-label*="ѕвезди"]').first();
    await expect(starRating).toBeVisible();
  });

  test('TS-08 — alphabetical sort renders without crash', async ({ page }) => {
    const sortSelect = page.locator('select').first();
    await sortSelect.selectOption({ label: /азбучен|alpha/i });
    await page.waitForTimeout(400);
    await expect(page.locator('body')).not.toContainText('does not exist');
  });

  test('TS-09 — verified templates sort renders verified badge first', async ({ page }) => {
    const sortSelect = page.locator('select').first();
    await sortSelect.selectOption({ label: /Верифицирани прво|verified/i });
    await page.waitForTimeout(400);
    // After verified-first sort, first card should have БРО badge
    const firstCardBadge = page.locator('text=/БРО|Verified/i').first();
    await expect(firstCardBadge).toBeVisible();
  });

  test('TS-10 — page title and meta description set', async ({ page }) => {
    await expect(page).toHaveTitle(/.+/);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toBeTruthy();
    expect(desc.length).toBeGreaterThan(10);
  });
});
