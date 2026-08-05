import { test, expect } from '@playwright/test';

// Every hreflang alternate, the sitemap and index.html point at `?lang=xx`.
// Until 23.07.2026 nothing ever read that param, so all seven "alternates"
// served identical Macedonian — which is exactly how Google decides a hreflang
// cluster is duplicate content and drops it. These tests exist so that can't
// silently come back.
test.describe('?lang= locale selection', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('?lang=en renders the English navigation', async ({ page }) => {
    await page.goto('/?lang=en', { waitUntil: 'domcontentloaded' });
    const nav = page.locator('nav').first();
    await expect(nav.getByRole('button', { name: 'Pricing' })).toBeVisible({ timeout: 15000 });
    await expect(nav.getByRole('button', { name: 'Sign up' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('?lang=sq renders Albanian and sets html lang', async ({ page }) => {
    await page.goto('/?lang=sq', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'sq', { timeout: 15000 });
  });

  test('the URL wins over a previously stored preference', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.setItem('mkd_locale', 'mk'));
    await page.goto('/?lang=en', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en', { timeout: 15000 });
  });

  test('an unknown ?lang= value is ignored, not honoured', async ({ page }) => {
    // Falls through to the rest of the chain rather than breaking or blanking
    // the UI — here the stored preference, which must survive the junk param.
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.setItem('mkd_locale', 'sq'));
    await page.goto('/?lang=zz', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'sq', { timeout: 15000 });
  });
});
