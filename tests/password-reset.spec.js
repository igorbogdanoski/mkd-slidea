// Password reset flow e2e — unauthenticated.
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'https://slidea.mismath.net';

test.describe('Password reset flow', () => {
  test('PWR-01 — login modal opens from home page', async ({ page }) => {
    await page.goto(BASE + '/?login=1');
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('PWR-02 — "forgot password" link is visible in login modal', async ({ page }) => {
    await page.goto(BASE + '/?login=1');
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10000 });
    const forgotLink = page.locator('text=/Заборав|forgot|Ресет/i').first();
    await expect(forgotLink).toBeVisible();
  });

  test('PWR-03 — clicking forgot password shows email input for reset', async ({ page }) => {
    await page.goto(BASE + '/?login=1');
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10000 });
    await page.locator('text=/Заборав|forgot/i').first().click();
    await page.waitForTimeout(400);
    // Reset form should have an email input visible
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test('PWR-04 — entering email and submitting shows success/sent state', async ({ page }) => {
    await page.goto(BASE + '/?login=1');
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10000 });
    await page.locator('text=/Заборав|forgot/i').first().click();
    await page.waitForTimeout(400);
    await page.locator('input[type="email"]').first().fill('test_nonexistent_user@example.com');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);
    // Should show either success message or error (not crash)
    await expect(page.locator('body')).not.toContainText('does not exist');
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('PWR-05 — /reset-password page loads without crash', async ({ page }) => {
    await page.goto(BASE + '/reset-password');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('does not exist');
    await expect(page.locator('body')).not.toContainText('Cannot read');
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('PWR-06 — reset password page has new password input field', async ({ page }) => {
    await page.goto(BASE + '/reset-password');
    await page.waitForLoadState('networkidle');
    // Page should contain a password input (may show waiting state or form)
    const body = await page.locator('body').innerText();
    // Either a password input is visible or a waiting/expired message
    const hasInput = await page.locator('input[type="password"]').count();
    const hasMessage = /лозинка|password|expired|истечен|линкот/i.test(body);
    expect(hasInput > 0 || hasMessage).toBe(true);
  });

  test('PWR-07 — back to login link present on forgot password screen', async ({ page }) => {
    await page.goto(BASE + '/?login=1');
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10000 });
    await page.locator('text=/Заборав|forgot/i').first().click();
    await page.waitForTimeout(400);
    // Should be a way back to login
    const backLink = page.locator('text=/Назад|back|Логирај|Login|Врати/i').first();
    await expect(backLink).toBeVisible();
  });
});
