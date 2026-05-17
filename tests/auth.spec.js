// Authenticated e2e tests — require SMOKE_TEST_EMAIL + SMOKE_TEST_PASSWORD env vars.
// Strategy: perform a real browser login at the start of each test.
// Mirrors what playwright/auth.setup.js does — this is the approach we know works.
// storageState is unreliable here due to Supabase Web Lock contention on session init.
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'https://slidea.mismath.net';
const EMAIL = process.env.SMOKE_TEST_EMAIL || '';
const PASSWORD = process.env.SMOKE_TEST_PASSWORD || '';

// Log in via browser UI — navigate to /?login=1, fill form, wait for logout link.
const signInViaUI = async (page) => {
  await page.addInitScript(() => localStorage.setItem('onboarding_v1_done', 'true'));
  await page.goto(BASE + '/?login=1');
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.locator('text=Одјави').waitFor({ timeout: 30000 });
};

// Client-side pushState navigation — no full page reload, no auth race.
const clientNavigate = async (page, path) => {
  await page.evaluate((p) => {
    window.history.pushState({}, '', p);
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  }, path);
  await page.waitForTimeout(500);
};

test.describe('Authenticated flows', () => {
  test.skip(!EMAIL || !PASSWORD, 'SMOKE_TEST_EMAIL / SMOKE_TEST_PASSWORD not set — skipping auth tests');

  test('session is active — logout link visible on home page', async ({ page }) => {
    await signInViaUI(page);
    await expect(page.locator('text=Одјави').first()).toBeVisible();
    await expect(page.locator('body')).not.toContainText('does not exist');
  });

  test('/dashboard accessible when authenticated', async ({ page }) => {
    await signInViaUI(page);
    await clientNavigate(page, '/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator('body')).not.toContainText('does not exist');
  });

  test('/host accessible when authenticated', async ({ page }) => {
    await signInViaUI(page);
    await clientNavigate(page, '/host');
    await expect(page).toHaveURL(/\/host/, { timeout: 10000 });
    await expect(page.locator('body')).not.toContainText('does not exist');
  });

  test('onboarding wizard — step 1 → step 2 → /host', async ({ page }) => {
    await signInViaUI(page);
    await page.evaluate(() => localStorage.removeItem('pending_host_action'));
    await page.evaluate(() => localStorage.removeItem('onboarding_v1_done'));
    await clientNavigate(page, '/onboarding');

    // Step 1
    await expect(page.locator('body')).toContainText('Здраво', { timeout: 10000 });
    await page.locator('button').filter({ hasText: 'Продолжи' }).first().click();

    // Step 2 — AI card
    await page.locator('button').filter({ hasText: 'AI генерирај квиз' }).click();

    await page.waitForURL('**/host', { timeout: 10000 });
    await expect(page).toHaveURL(/\/host/);
    await expect(page.locator('body')).not.toContainText('does not exist');
  });
});
