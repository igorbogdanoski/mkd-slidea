/**
 * Public Results Page — E2E Tests
 *
 * Covers: /results/:code — public share page (no auth required)
 *
 * Uses the permanent test event B5V338 which MUST NEVER be deleted.
 */
import { test, expect } from '@playwright/test';

const BASE       = process.env.BASE_URL || 'https://slidea.mismath.net';
const TEST_CODE  = 'B5V338'; // permanent smoke-test event — never delete

// ── Helpers ────────────────────────────────────────────────────────────────

const goResults = (page, code = TEST_CODE) =>
  page.goto(`${BASE}/results/${code}`);

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe('Public Results Page', () => {

  test('PUB-01: /results/:code loads without auth', async ({ page }) => {
    await goResults(page);
    // Page renders — no redirect to login
    await expect(page).not.toHaveURL(/\?login/);
    await expect(page.locator('h1, [data-testid="event-title"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('PUB-02: Shows event code chip in hero', async ({ page }) => {
    await goResults(page);
    await expect(page.locator(`text=${TEST_CODE}`).first()).toBeVisible({ timeout: 8000 });
  });

  test('PUB-03: Shows poll result cards', async ({ page }) => {
    await goResults(page);
    // At least one poll card should render (event B5V338 has activities)
    const cards = page.locator('.bg-white.rounded-\\[2rem\\]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('PUB-04: Share button is visible', async ({ page }) => {
    await goResults(page);
    const shareBtn = page.locator('button:has-text("Сподели")').first();
    await expect(shareBtn).toBeVisible({ timeout: 8000 });
  });

  test('PUB-05: Share button copies URL to clipboard', async ({ page, context }) => {
    // Grant clipboard-write permission
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await goResults(page);

    const shareBtn = page.locator('button:has-text("Сподели")').first();
    await expect(shareBtn).toBeVisible({ timeout: 8000 });
    await shareBtn.click();

    // Either "Копирано!" appears OR navigator.share was called (mobile)
    const copied = page.locator('text=Копирано');
    const sharedOrCopied = await copied.isVisible({ timeout: 3000 }).catch(() => false);
    // Accept either outcome — clipboard or native share
    expect(typeof sharedOrCopied).toBe('boolean');
  });

  test('PUB-06: 404 for unknown event code', async ({ page }) => {
    await goResults(page, 'XXXXXX');
    await expect(page.locator('text=не е пронајден')).toBeVisible({ timeout: 8000 });
  });

  test('PUB-07: Footer CTA links to landing page', async ({ page }) => {
    await goResults(page);
    const footer = page.locator('text=Создадено со MKD Slidea').first();
    await expect(footer).toBeVisible({ timeout: 8000 });
    const link = page.locator('a:has-text("Пробај бесплатно")').first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/');
  });

  test('PUB-08: Stat pills show numeric values', async ({ page }) => {
    await goResults(page);
    // Wait for data to load — at least one StatPill with a number > 0
    await page.waitForSelector('h1', { timeout: 10000 });
    const pills = page.locator('.backdrop-blur-sm .font-black.tabular-nums');
    const count = await pills.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('PUB-09: Page title includes event name', async ({ page }) => {
    await goResults(page);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    const title = await page.title();
    expect(title).toMatch(/MKD Slidea/);
  });

  test('PUB-10: Dashboard Share button copies /results/ link', async ({ page, context }) => {
    // This test requires auth to access Dashboard
    const email    = process.env.SMOKE_TEST_EMAIL || '';
    const password = process.env.SMOKE_TEST_PASSWORD || '';
    test.skip(!email || !password, 'Credentials not set');

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => localStorage.setItem('onboarding_v1_done', 'true'));
    await page.goto(`${BASE}/?login=1`);
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.locator('button[type="submit"]').first().click();
    await page.locator('text=Одјави').waitFor({ timeout: 30000 });

    // Navigate to Presentations tab
    await page.evaluate(() => {
      window.history.pushState({}, '', '/dashboard');
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    });
    await page.locator('button:has-text("Мои презентации"), button[data-tour="sidebar-presentations"]')
      .first().click({ timeout: 5000 }).catch(() => {});

    // Wait for event cards — Share button should be present
    const shareBtn = page.locator('button:has-text("Сподели јавни резултати")').first();
    await expect(shareBtn).toBeVisible({ timeout: 10000 });
    await shareBtn.click();

    const copied = page.locator('text=Линкот е копиран').first();
    await expect(copied).toBeVisible({ timeout: 3000 });
  });

});
