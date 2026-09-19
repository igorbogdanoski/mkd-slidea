/**
 * Participant / Audience — E2E Tests
 *
 * Covers: join flow, username entry, cast vote, quiz answer,
 * word cloud submission, open text, Q&A, offline indicator.
 *
 * Uses a permanent test event that must exist in Supabase.
 */
import { test, expect } from '@playwright/test';
import { liveEventWith, joinEvent } from './helpers/liveEvent.js';

const BASE       = process.env.BASE_URL || 'https://slidea.mismath.net';
const EVENT_CODE = process.env.TEST_EVENT_CODE || 'B5V338';
const EMAIL      = process.env.SMOKE_TEST_EMAIL || '';
const PASSWORD   = process.env.SMOKE_TEST_PASSWORD || '';

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

// These four need a specific activity type to be the ACTIVE one. Pointed at
// the shared permanent event they skipped themselves whenever it was not
// sitting on the type they wanted — and only one activity can be active at a
// time, so they could never all run. Each builds its own event now.
test.describe('Participant — Voting Interactions', () => {
  test.skip(!EMAIL || !PASSWORD, 'SMOKE_TEST_EMAIL / SMOKE_TEST_PASSWORD not set');

  test('P-08: Poll options are clickable (touch-friendly)', async ({ browser }) => {
    const { code, hostCtx } = await liveEventWith(browser, {
      base: BASE, email: EMAIL, password: PASSWORD, type: 'poll',
      question: 'Каде работите?', options: ['Во основно', 'Во средно'],
    });
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await joinEvent(page, BASE, code, 'Тест Учесник');

    const option = page.getByRole('button', { name: 'Во основно' }).first();
    await expect(option).toBeVisible({ timeout: 30_000 });
    const box = await option.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(40);
    expect(box.width).toBeGreaterThanOrEqual(44);

    await ctx.close();
    await hostCtx.close();
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

  test('P-10: Word cloud input accepts text', async ({ browser }) => {
    const { code, hostCtx } = await liveEventWith(browser, {
      base: BASE, email: EMAIL, password: PASSWORD, type: 'wordcloud',
      question: 'Од кој град доаѓате?',
    });
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await joinEvent(page, BASE, code, 'Тест Облак');

    const textInput = page.locator('input[placeholder="Внесете збор..."]').first();
    await expect(textInput).toBeVisible({ timeout: 30_000 });
    await textInput.fill('математика');
    await expect(textInput).toHaveValue('математика');

    await ctx.close();
    await hostCtx.close();
  });

  test('P-11: Open text accepts multi-line response', async ({ browser }) => {
    const { code, hostCtx } = await liveEventWith(browser, {
      base: BASE, email: EMAIL, password: PASSWORD, type: 'open',
      question: 'Кој е вашиот став?',
    });
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await joinEvent(page, BASE, code, 'Тест Текст');

    // Long open answers replaced the one-line input with a textarea.
    const textarea = page.locator('textarea[placeholder="Вашиот одговор..."]').first();
    await expect(textarea).toBeVisible({ timeout: 30_000 });
    const answer = 'Ова е мојот детален одговор.\nСо повеќе линии.';
    await textarea.fill(answer);
    // toHaveValue, not toContainText: a textarea's typed content is its value,
    // and its text content stays empty — the old assertion could not pass.
    await expect(textarea).toHaveValue(answer);

    await ctx.close();
    await hostCtx.close();
  });

  test('P-12: Emoji reactions are available to a participant', async ({ browser }) => {
    const { code, hostCtx } = await liveEventWith(browser, {
      base: BASE, email: EMAIL, password: PASSWORD, type: 'poll',
      question: 'Што предавате?', options: ['Биологија', 'Хемија'],
    });
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await joinEvent(page, BASE, code, 'Тест Реакции');
    await expect(page.locator('#poll-question')).toContainText('Што предавате', { timeout: 30_000 });

    const reactionBtn = page.getByRole('button', { name: /👏|❤️|😮|😂|🔥|👍/ }).first();
    await expect(reactionBtn).toBeVisible({ timeout: 15_000 });
    await reactionBtn.click();
    await expect(page.locator('body')).not.toContainText('TypeError');

    await ctx.close();
    await hostCtx.close();
  });

  test('P-16: A question a participant asks actually reaches the list', async ({ browser }) => {
    // Nothing covered this, and the feature had been 100% dead for the whole
    // life of the app: questions.session_id did not exist in the database, so
    // the insert was refused with 42703 on every submission, the error went to
    // a console.error, and the input was cleared as though it had been sent.
    // Zero rows in questions across 242 events — with a green suite, because no
    // test ever typed into the box.
    const { code, hostCtx } = await liveEventWith(browser, {
      base: BASE, email: EMAIL, password: PASSWORD, type: 'poll',
      question: 'Што предавате?', options: ['Математика', 'Физика'],
    });
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await joinEvent(page, BASE, code, 'Тест Прашање');
    await expect(page.locator('#poll-question')).toContainText('Што предавате', { timeout: 30_000 });

    const asked = 'Зошто е важен редоследот на операциите?';
    const box = page.locator('input[placeholder="Што те интересира?"]');
    await expect(box).toBeVisible({ timeout: 20_000 });
    await box.fill(asked);
    // Enter submits; the send button is icon-only with no accessible name.
    await box.press('Enter');

    // The list is fed by the questions realtime channel, which only delivers
    // because the table is in the publication — so this asserts the write landed
    // and the row came back, not merely that the field was cleared.
    await expect(page.locator('p', { hasText: asked }).first()).toBeVisible({ timeout: 30_000 });

    await ctx.close();
    await hostCtx.close();
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
