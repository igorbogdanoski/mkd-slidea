// Password reset flow e2e — unauthenticated.
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'https://slidea.mismath.net';

// The control that switches the login modal to its reset form.
//
// This was `locator('text=/Заборав|forgot/i').first()`, which also matches the
// landing page's own marketing copy — EducationSection says "Направи ја секоја
// лекција незаборавна", and незаборавна contains заборав. Landing is lazy, so
// whether that paragraph existed yet when the click landed was a race: when it
// did, `.first()` resolved to it, the modal's own overlay intercepted the click,
// and the test timed out. Faster page loads make the losing side of that race
// more likely, not less.
//
// Scoped to the button by role and exact name, so nothing outside the modal can
// match it.
const forgotButton = (page) => page.getByRole('button', { name: 'Заборавена лозинка?' });

test.describe('Password reset flow', () => {
  test('PWR-01 — login modal opens from home page', async ({ page }) => {
    await page.goto(BASE + '/?login=1');
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('PWR-02 — "forgot password" link is visible in login modal', async ({ page }) => {
    await page.goto(BASE + '/?login=1');
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10000 });
    const forgot = forgotButton(page);
    await expect(forgot).toBeVisible();
  });

  test('PWR-03 — clicking forgot password shows email input for reset', async ({ page }) => {
    await page.goto(BASE + '/?login=1');
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10000 });
    await forgotButton(page).click();
    await page.waitForTimeout(400);
    // Reset form should have an email input visible
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test('PWR-04 — entering email and submitting shows success/sent state', async ({ page }) => {
    await page.goto(BASE + '/?login=1');
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10000 });
    await forgotButton(page).click();
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
    // Same locator PWR-03 and PWR-04 had: a bare text regex that also matches the
    // landing page's "незаборавна", so `.first()` could resolve to a paragraph
    // behind the modal and the click would be intercepted by its own overlay.
    await forgotButton(page).click();
    await page.waitForTimeout(400);
    // Should be a way back to login
    const backLink = page.locator('text=/Назад|back|Логирај|Login|Врати/i').first();
    await expect(backLink).toBeVisible();
  });
});
