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

  // Was: "PR-02 — 14-day free trial hero badge is visible". The badge was
  // there, the trial was not — every Pro CTA promising "Пробај 14 дена
  // бесплатно" led to a manual bank-transfer form that granted nothing. The
  // test enforced the false promise rather than catching it. Inverted: the
  // page must not advertise a trial until one actually exists, and the free
  // plan (which is real, and more generous than the trial ever was) carries
  // the message instead.
  test('PR-02 — no free-trial promise, and the free plan is advertised', async ({ page }) => {
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/пробен период|дена бесплатно|free trial/i);
    expect(body).toMatch(/без кредитна картичка/i);
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
    // A regex cannot appear inside a comma-joined CSS selector — Playwright
    // threw "Unexpected token /" on every run, so this test never actually
    // checked anything. Split into two locators instead.
    const linkCtas = page.locator('a[href*="checkout"], a[href*="upgrade"]');
    const buttonCtas = page.getByRole('button', { name: /Избери план|Започни|Купи|Start|Buy/i });
    const count = (await linkCtas.count()) + (await buttonCtas.count());
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
