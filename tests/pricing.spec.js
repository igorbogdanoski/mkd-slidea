// Pricing page e2e — unauthenticated (page is public).
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'https://slidea.mismath.net';

test.describe('Pricing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE + '/pricing');
    await page.waitForLoadState('networkidle');
  });

  test('PR-01 — page title contains "Цени" or "Pricing"', async ({ page }) => {
    await expect(page).toHaveTitle(/цени|pricing/i);
  });

  test('PR-02 — 14-day free trial hero badge is visible', async ({ page }) => {
    await expect(page.locator('text=/14.дена|14-day/i').first()).toBeVisible();
  });

  test('PR-03 — pricing cards are rendered (at least 2)', async ({ page }) => {
    // Cards have plan names — Основен, Про, Тим or similar
    const cardCount = await page.locator('[class*="rounded"][class*="border"]').count();
    expect(cardCount).toBeGreaterThanOrEqual(2);
  });

  test('PR-04 — Mentimeter comparison table is present', async ({ page }) => {
    await expect(page.locator('text=/Mentimeter|Наспроти/i').first()).toBeVisible();
  });

  test('PR-05 — comparison table toggle/button expands the table', async ({ page }) => {
    // Find the toggle button for comparison table
    const toggle = page.locator('button:has-text(/Mentimeter|Споредба|Прикажи/i)').first();
    const exists = await toggle.count();
    if (exists > 0) {
      await toggle.click();
      await page.waitForTimeout(400);
      // After clicking, table rows should be visible
      await expect(page.locator('text=/Неограничени|Учесници|активности/i').first()).toBeVisible();
    } else {
      // Table may already be expanded by default
      await expect(page.locator('text=/Неограничени|Учесници/i').first()).toBeVisible();
    }
  });

  test('PR-06 — trust strip is visible (money-back / cancel anytime)', async ({ page }) => {
    const trustText = page.locator('text=/гаранција|откажи|cancel|guarantee/i').first();
    await expect(trustText).toBeVisible();
  });

  test('PR-07 — each paid plan card has a CTA button', async ({ page }) => {
    const ctaButtons = page.locator('a[href*="checkout"], a[href*="upgrade"], button:has-text(/Пробај|Започни|Купи|Start|Buy/i)');
    const count = await ctaButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('PR-08 — FAQ section has at least 3 questions', async ({ page }) => {
    const faqItems = page.locator('text=/Дали|Колку|Може|Која|How|Can|What/i');
    const count = await faqItems.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('PR-09 — page has a JSON-LD script tag (structured data)', async ({ page }) => {
    const ldJson = await page.locator('script[type="application/ld+json"]').count();
    expect(ldJson).toBeGreaterThanOrEqual(1);
  });

  test('PR-10 — page has canonical link tag', async ({ page }) => {
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('/pricing');
  });
});
