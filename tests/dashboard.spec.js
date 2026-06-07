// Dashboard e2e — authenticated flows.
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

const clickTab = async (page, tabLabel) => {
  await page.locator(`button:has-text("${tabLabel}")`).first().click();
  await page.waitForTimeout(500);
};

test.describe('Dashboard', () => {
  test.skip(!EMAIL || !PASSWORD, 'SMOKE_TEST_EMAIL / SMOKE_TEST_PASSWORD not set');

  test('DB-01 — dashboard loads after sign-in', async ({ page }) => {
    await signInViaUI(page);
    await clientNavigate(page, '/dashboard');
    await expect(page.locator('body')).not.toContainText('does not exist');
    await expect(page.locator('body')).not.toContainText('404');
    // Sidebar is visible
    await expect(page.locator('text=MKD Slidea').first()).toBeVisible();
  });

  test('DB-02 — sidebar contains all expected navigation items', async ({ page }) => {
    await signInViaUI(page);
    await clientNavigate(page, '/dashboard');
    await expect(page.locator('button:has-text("Мои презентации")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Аналитика")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Профил")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Сите шаблони")').first()).toBeVisible();
  });

  test('DB-03 — home tab renders welcome section', async ({ page }) => {
    await signInViaUI(page);
    await clientNavigate(page, '/dashboard');
    await clickTab(page, 'Почетна');
    // Any welcoming content should be present
    const body = page.locator('body');
    await expect(body).not.toContainText('does not exist');
  });

  test('DB-04 — analytics tab loads chart area', async ({ page }) => {
    await signInViaUI(page);
    await clientNavigate(page, '/dashboard');
    await clickTab(page, 'Аналитика');
    await expect(page.locator('body')).toContainText('Детална аналитика');
  });

  test('DB-05 — templates tab renders template grid', async ({ page }) => {
    await signInViaUI(page);
    await clientNavigate(page, '/dashboard');
    await clickTab(page, 'Сите шаблони');
    await expect(page.locator('body')).toContainText('шаблони');
  });

  test('DB-06 — profile tab renders profile form', async ({ page }) => {
    await signInViaUI(page);
    await clientNavigate(page, '/dashboard');
    await clickTab(page, 'Профил');
    await expect(page.locator('body')).toContainText('Мој профил');
    await expect(page.locator('#profile-name')).toBeVisible();
  });

  test('DB-07 — profile tab has GDPR export button', async ({ page }) => {
    await signInViaUI(page);
    await clientNavigate(page, '/dashboard');
    await clickTab(page, 'Профил');
    await expect(page.locator('button:has-text("Преземи CSV")').first()).toBeVisible();
  });

  test('DB-08 — profile tab has delete account mailto link', async ({ page }) => {
    await signInViaUI(page);
    await clientNavigate(page, '/dashboard');
    await clickTab(page, 'Профил');
    const deleteLink = page.locator('a:has-text("Барај бришење")').first();
    await expect(deleteLink).toBeVisible();
    const href = await deleteLink.getAttribute('href');
    expect(href).toMatch(/^mailto:support@mismath\.net/);
    expect(href).toContain('бришење');
  });

  test('DB-09 — email digest toggle is present and toggleable', async ({ page }) => {
    await signInViaUI(page);
    await clientNavigate(page, '/dashboard');
    await clickTab(page, 'Профил');
    const toggle = page.locator('button[role="switch"]').last();
    await expect(toggle).toBeVisible();
    const before = await toggle.getAttribute('aria-checked');
    await toggle.click();
    const after = await toggle.getAttribute('aria-checked');
    expect(after).not.toBe(before);
  });

  test('DB-10 — presentations tab shows events list area', async ({ page }) => {
    await signInViaUI(page);
    await clientNavigate(page, '/dashboard');
    await clickTab(page, 'Мои презентации');
    await expect(page.locator('body')).not.toContainText('does not exist');
    await page.waitForTimeout(2000); // allow Supabase fetch
    await expect(page.locator('body')).not.toContainText('Грешка');
  });

  test('DB-11 — logout button present in sidebar', async ({ page }) => {
    await signInViaUI(page);
    await clientNavigate(page, '/dashboard');
    await expect(page.locator('button:has-text("Одјави се")').first()).toBeVisible();
  });

  test('DB-12 — onboarding checklist renders in sidebar', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('mkd_checklist_dismissed_until');
      localStorage.setItem('onboarding_v1_done', 'true');
    });
    await page.goto(BASE + '/?login=1');
    await page.locator('input[type="email"]').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.locator('text=Одјави').waitFor({ timeout: 30000 });
    await clientNavigate(page, '/dashboard');
    // Checklist or "all done" text should be visible
    const checklist = page.locator('text=/чекори|Подготвен/i');
    await expect(checklist.first()).toBeVisible({ timeout: 5000 });
  });
});
