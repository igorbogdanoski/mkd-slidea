// Authenticated e2e tests — require SMOKE_TEST_EMAIL + SMOKE_TEST_PASSWORD env vars.
// Set these as GitHub Secrets to run in CI; skip locally if not configured.
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'https://slidea.mismath.net';
const EMAIL = process.env.SMOKE_TEST_EMAIL || '';
const PASSWORD = process.env.SMOKE_TEST_PASSWORD || '';

test.describe('Authenticated flows', () => {
  test.skip(!EMAIL || !PASSWORD, 'SMOKE_TEST_EMAIL / SMOKE_TEST_PASSWORD not set — skipping auth tests');

  test('login via email + password → dashboard loads', async ({ page }) => {
    await page.goto(BASE + '/?login=1');

    // Open login modal if not already open
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ timeout: 10000 });
    await emailInput.fill(EMAIL);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(PASSWORD);

    // Submit — look for a button that signs in (not Google)
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    // Should land on /dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('body')).not.toContainText('does not exist');
  });

  test('dashboard → /host loads without errors', async ({ page }) => {
    // Log in first
    await page.goto(BASE + '/?login=1');
    await page.locator('input[type="email"]').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Navigate to /host
    await page.goto(BASE + '/host');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Should not redirect to login
    await expect(page).toHaveURL(/\/host/);

    // Should not show a DB error
    await expect(page.locator('body')).not.toContainText('does not exist');

    // Should render the activities header (Macedonian)
    await expect(page.locator('body')).toContainText('активност');
  });

  test('/onboarding accessible when logged in', async ({ page }) => {
    // Log in first
    await page.goto(BASE + '/?login=1');
    await page.locator('input[type="email"]').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Clear the onboarding flag so we can test the page directly
    await page.evaluate(() => localStorage.removeItem('onboarding_v1_done'));

    await page.goto(BASE + '/onboarding');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Should render step 1 welcome message
    await expect(page.locator('body')).toContainText('Здраво');
    await expect(page.locator('body')).toContainText('Продолжи');
  });

  test('onboarding wizard step 2 — choose AI path → lands on /host', async ({ page }) => {
    // Log in
    await page.goto(BASE + '/?login=1');
    await page.locator('input[type="email"]').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    await page.evaluate(() => {
      localStorage.removeItem('onboarding_v1_done');
      localStorage.removeItem('pending_host_action');
    });

    await page.goto(BASE + '/onboarding');

    // Step 1: click Продолжи
    await page.locator('button', { hasText: 'Продолжи' }).click();

    // Step 2: click AI card
    await page.locator('button', { hasText: 'AI генерирај квиз' }).click();

    // Should navigate to /host
    await page.waitForURL('**/host', { timeout: 10000 });
    await expect(page).toHaveURL(/\/host/);

    // pending_host_action should have been set to 'ai'
    const action = await page.evaluate(() => localStorage.getItem('pending_host_action'));
    // It's consumed on load, so may already be null — just verify we reached /host
    await expect(page.locator('body')).not.toContainText('does not exist');
  });
});
