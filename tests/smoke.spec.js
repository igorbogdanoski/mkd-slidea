import { test, expect } from '@playwright/test';

// Permanent test event — do NOT delete from Supabase
const EVENT_CODE = 'B5V338';

test.describe('MKD Slidea — Production Smoke Tests', () => {

  // ── 1. Landing ────────────────────────────────────────────────────────────
  test('1. Landing page renders headline', async ({ page }) => {
    await page.goto('/');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    const text = await heading.innerText();
    expect(text.trim().length).toBeGreaterThan(3);
  });

  // ── 2. Templates gallery ──────────────────────────────────────────────────
  test('2. Templates gallery shows ≥10 cards', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForTimeout(1500);
    const cards = page.locator('a[href*="/templates/"]');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  // ── 3. Template detail ────────────────────────────────────────────────────
  test('3. Template detail page has Use button', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForTimeout(1000);
    await page.locator('a[href*="/templates/"]').first().click();
    await page.waitForLoadState('networkidle');
    const useBtn = page.locator('button, a').filter({ hasText: /Користи|Use|Додај|Add/i }).first();
    await expect(useBtn).toBeVisible();
  });

  // ── 4. Join page ──────────────────────────────────────────────────────────
  test('4. Join page has code input', async ({ page }) => {
    await page.goto('/join');
    await expect(page.locator('input').first()).toBeVisible();
  });

  // ── 5. Participant event route loads ──────────────────────────────────────
  test('5. /event/:code does not redirect to root', async ({ page }) => {
    await page.goto(`/event/${EVENT_CODE}`);
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).toContain(EVENT_CODE);
    expect(url).not.toMatch(/\/$|\/$/); // not redirected to bare root
  });

  // ── 6. Participant username entry screen ──────────────────────────────────
  test('6. Participant sees username entry or poll', async ({ page }) => {
    await page.goto(`/event/${EVENT_CODE}`);
    await page.waitForTimeout(3000);
    const body = await page.locator('body').innerText();
    const hasNameEntry = body.includes('запишеме') || body.includes('Започни') || body.includes('Внесете');
    const hasPoll = body.includes('АКТИВНО') || body.includes('Чекаме') || body.includes('Гласај');
    const hasDBError = body.includes('column') && body.includes('does not exist');
    expect(hasDBError).toBe(false);
    expect(hasNameEntry || hasPoll).toBe(true);
  });

  // ── 7. Presenter view loads ───────────────────────────────────────────────
  test('7. Presenter view loads without DB errors', async ({ page }) => {
    await page.goto(`/event/${EVENT_CODE}/present`);
    await page.waitForTimeout(3000);
    const body = await page.locator('body').innerText();
    const hasDBError = body.includes('column') && body.includes('does not exist');
    const hasContent = body.includes(EVENT_CODE) || body.includes('ПРИКЛУЧИ') || body.includes('АКТИВНО');
    expect(hasDBError).toBe(false);
    expect(hasContent).toBe(true);
  });

  // ── 8. Dashboard redirects unauthenticated ────────────────────────────────
  test('8. Dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url).toMatch(/login|\/\?login/);
  });

  // ── 9. /api/vote-text endpoint exists ─────────────────────────────────────
  test('9. /api/vote-text endpoint is reachable (not 404)', async ({ request }) => {
    const res = await request.post('/api/vote-text', {
      data: { pollId: '00000000-0000-0000-0000-000000000000', text: 'smoke-test' },
      headers: { 'Content-Type': 'application/json' },
    });
    // 404 = endpoint missing; 4xx/5xx = endpoint exists but rejects invalid data (correct)
    expect(res.status()).not.toBe(404);
  });

  // ── 10. Scoreboard loads without DB errors ────────────────────────────────
  test('10. Scoreboard page loads without DB column errors', async ({ page }) => {
    await page.goto(`/event/${EVENT_CODE}/scores`);
    await page.waitForTimeout(2000);
    const body = await page.locator('body').innerText();
    expect(body).not.toContain('does not exist');
    expect(body).not.toContain('column reference');
  });

});
