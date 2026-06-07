// Settings / profile e2e — authenticated flows.
// Requires SMOKE_TEST_EMAIL + SMOKE_TEST_PASSWORD env vars.
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'https://slidea.mismath.net';
const EMAIL = process.env.SMOKE_TEST_EMAIL || '';
const PASSWORD = process.env.SMOKE_TEST_PASSWORD || '';

const signInViaUI = async (page) => {
  await page.addInitScript(() => localStorage.setItem('onboarding_v1_done', 'true'));
  await page.goto(BASE + '/?login=1');
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.locator('text=Одјави').waitFor({ timeout: 30000 });
};

const clientNavigate = async (page, path) => {
  await page.evaluate((p) => {
    window.history.pushState({}, '', p);
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  }, path);
  await page.waitForTimeout(600);
};

const goToProfileTab = async (page) => {
  await clientNavigate(page, '/dashboard');
  await page.locator('button:has-text("Профил")').first().click();
  await page.waitForTimeout(600);
  await expect(page.locator('#profile-name')).toBeVisible({ timeout: 8000 });
};

test.describe('Settings / Profile', () => {
  test.skip(!EMAIL || !PASSWORD, 'SMOKE_TEST_EMAIL / SMOKE_TEST_PASSWORD not set');

  test('SET-01 — profile form renders with name field', async ({ page }) => {
    await signInViaUI(page);
    await goToProfileTab(page);
    const nameInput = page.locator('#profile-name');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeEnabled();
  });

  test('SET-02 — public teacher toggle is present and shows aria-checked', async ({ page }) => {
    await signInViaUI(page);
    await goToProfileTab(page);
    const toggle = page.locator('button[role="switch"]').first();
    await expect(toggle).toBeVisible();
    const ariaChecked = await toggle.getAttribute('aria-checked');
    expect(['true', 'false']).toContain(ariaChecked);
  });

  test('SET-03 — save button is present and not disabled when form is loaded', async ({ page }) => {
    await signInViaUI(page);
    await goToProfileTab(page);
    // Wait for loading to finish (button is disabled while loading)
    await page.waitForTimeout(2000);
    const saveBtn = page.locator('button[type="submit"]:has-text("Зачувај")').first();
    await expect(saveBtn).toBeEnabled({ timeout: 8000 });
  });

  test('SET-04 — editing display name and saving shows "Зачувано!" confirmation', async ({ page }) => {
    await signInViaUI(page);
    await goToProfileTab(page);
    await page.waitForTimeout(2000);
    const nameInput = page.locator('#profile-name');
    await nameInput.fill('Test Name ' + Date.now());
    await page.locator('button[type="submit"]:has-text("Зачувај")').first().click();
    await expect(page.locator('text=Зачувано').first()).toBeVisible({ timeout: 5000 });
  });

  test('SET-05 — notifications section visible with email digest toggle', async ({ page }) => {
    await signInViaUI(page);
    await goToProfileTab(page);
    await expect(page.locator('text=Нотификации').first()).toBeVisible();
    await expect(page.locator('text=Неделен дигест').first()).toBeVisible();
  });

  test('SET-06 — email digest toggle can be switched', async ({ page }) => {
    await signInViaUI(page);
    await goToProfileTab(page);
    await page.waitForTimeout(2000);
    // The last role=switch in the profile section is the digest toggle
    const toggle = page.locator('button[role="switch"]').last();
    const before = await toggle.getAttribute('aria-checked');
    await toggle.click();
    await page.waitForTimeout(300);
    const after = await toggle.getAttribute('aria-checked');
    expect(after).not.toBe(before);
  });

  test('SET-07 — GDPR section heading visible', async ({ page }) => {
    await signInViaUI(page);
    await goToProfileTab(page);
    await expect(page.locator('text=GDPR').first()).toBeVisible();
  });

  test('SET-08 — CSV download button is visible and enabled', async ({ page }) => {
    await signInViaUI(page);
    await goToProfileTab(page);
    await page.waitForTimeout(2000);
    const exportBtn = page.locator('button:has-text("Преземи CSV")').first();
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toBeEnabled();
  });

  test('SET-09 — delete account link has correct mailto href', async ({ page }) => {
    await signInViaUI(page);
    await goToProfileTab(page);
    const deleteLink = page.locator('a:has-text("Барај бришење")').first();
    await expect(deleteLink).toBeVisible();
    const href = await deleteLink.getAttribute('href');
    expect(href).toMatch(/^mailto:support@mismath\.net/);
    expect(href).toContain('subject=');
    expect(href).toContain(EMAIL);
  });

  test('SET-10 — clicking CSV export does not crash the page', async ({ page }) => {
    await signInViaUI(page);
    await goToProfileTab(page);
    await page.waitForTimeout(2000);
    const exportBtn = page.locator('button:has-text("Преземи CSV")').first();
    // Intercept download so the browser doesn't try to save a file
    page.on('download', (download) => download.cancel());
    await exportBtn.click();
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).not.toContainText('Cannot read');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});
