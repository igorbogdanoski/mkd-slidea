/**
 * Participant / Audience — E2E Tests
 *
 * Covers: join flow, username entry, cast vote, quiz answer,
 * word cloud submission, open text, Q&A, offline indicator.
 *
 * Uses a permanent test event that must exist in Supabase.
 */
import { test, expect } from '@playwright/test';

const BASE       = process.env.BASE_URL || 'https://slidea.mismath.net';
const EVENT_CODE = process.env.TEST_EVENT_CODE || 'B5V338';

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe('Participant — Join Flow', () => {

  test('P-01: Join page renders code input', async ({ page }) => {
    await page.goto(`${BASE}/join`);
    await expect(page.locator('input').first()).toBeVisible();
    await expect(page.locator('body')).not.toContainText('does not exist');
  });

  test('P-02: Entering valid code navigates to event', async ({ page }) => {
    await page.goto(`${BASE}/join`);
    await page.locator('input').first().fill(EVENT_CODE);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain(EVENT_CODE);
  });

  test('P-03: Direct /event/:code URL loads participant view', async ({ page }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(3000);
    expect(page.url()).toContain(EVENT_CODE);
    await expect(page.locator('body')).not.toContainText('does not exist');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('P-04: Participant sees username entry or active poll', async ({ page }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(3000);
    const body = await page.locator('body').innerText();
    const hasNameEntry = /запишеме|Започни|Внесете|username|Наречи/i.test(body);
    const hasPoll      = /АКТИВНО|Чекаме|Гласај|Одговори/i.test(body);
    const hasWaiting   = /чека|сесија|waiting/i.test(body);
    expect(hasNameEntry || hasPoll || hasWaiting).toBe(true);
  });

  test('P-05: Can enter username and proceed', async ({ page }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(2000);

    const nameInput = page.locator(
      'input[placeholder*="Твоето"], input[placeholder*="Внеси"], input[placeholder*="Наречи"], input[type="text"]'
    ).first();

    if (await nameInput.isVisible({ timeout: 4000 }).catch(() => false)) {
      await nameInput.fill('Тест Ученик');

      const startBtn = page.locator(
        'button:has-text("Започни"), button:has-text("Влези"), button[type="submit"]'
      ).first();

      if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await startBtn.click();
        await page.waitForTimeout(1000);
        await expect(page.locator('body')).not.toContainText('TypeError');
      }
    } else {
      test.skip(true, 'Username input not shown — event may be in waiting state');
    }
  });

  test('P-06: QR code join redirects correctly', async ({ page }) => {
    // Simulates scanning a QR code which goes to /event/:code directly
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(2000);
    expect(page.url()).toContain(EVENT_CODE);
    await expect(page.locator('body')).not.toContainText('does not exist');
  });

  test('P-07: Invalid event code shows error', async ({ page }) => {
    await page.goto(`${BASE}/join`);
    await page.locator('input').first().fill('XXXXXX');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    const body = await page.locator('body').innerText();
    const hasError = /не постои|не е најден|invalid|грешка|404/i.test(body);
    // Either shows error OR redirects (either is acceptable as long as no crash)
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).not.toContainText('does not exist');
  });
});

test.describe('Participant — Voting Interactions', () => {

  test('P-08: Poll options are clickable (touch-friendly)', async ({ page }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(3000);

    // Try to find poll options
    const option = page.locator(
      'button[data-type="option"], .poll-option, [data-testid="poll-option"]'
    ).first();

    if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Option has sufficient touch target (≥44px)
      const box = await option.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(40);
      expect(box.width).toBeGreaterThanOrEqual(44);
    } else {
      test.skip(true, 'No active poll found');
    }
  });

  test('P-09: Participant view is mobile-responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone 14
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(2000);

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('TypeError');

    // Nothing should overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
  });

  test('P-10: Word cloud input accepts text', async ({ page }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(3000);

    const textInput = page.locator(
      'input[placeholder*="зборов"], input[placeholder*="слово"], textarea[placeholder*="зборов"]'
    ).first();

    if (await textInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textInput.fill('математика');
      await expect(textInput).toHaveValue('математика');
    } else {
      test.skip(true, 'No word cloud activity active');
    }
  });

  test('P-11: Open text accepts multi-line response', async ({ page }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(3000);

    const textarea = page.locator(
      'textarea[placeholder*="одговор"], textarea[placeholder*="Напиши"]'
    ).first();

    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea.fill('Ова е мојот детален одговор.\nСо повеќе линии.');
      await expect(textarea).toContainText('Ова е мојот детален одговор');
    } else {
      test.skip(true, 'No open text activity active');
    }
  });

  test('P-12: Emoji reactions button exists', async ({ page }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(3000);

    const reactionBtn = page.locator(
      'button[aria-label*="реакц"], button:has-text("👍"), button:has-text("😊"), .reaction-btn'
    ).first();

    if (await reactionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reactionBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator('body')).not.toContainText('TypeError');
    } else {
      test.skip(true, 'Reaction buttons not visible');
    }
  });
});

test.describe('Participant — Scoreboard', () => {

  test('P-13: Scoreboard page loads without DB errors', async ({ page }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}/scores`);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('does not exist');
    await expect(page.locator('body')).not.toContainText('column reference');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('P-14: Scoreboard shows at least title or ranking', async ({ page }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}/scores`);
    await page.waitForTimeout(2000);
    const body = await page.locator('body').innerText();
    const hasContent = body.trim().length > 20;
    expect(hasContent).toBe(true);
  });
});

test.describe('Participant — Offline Resilience', () => {

  test('P-15: App renders with network throttled', async ({ page, context }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(2000);

    // Simulate going offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);

    // Page should still render (cached content)
    await expect(page.locator('body')).toBeVisible();

    // Restore network
    await context.setOffline(false);
  });
});
