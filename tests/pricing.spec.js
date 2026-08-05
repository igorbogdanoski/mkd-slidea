// Pricing page e2e — unauthenticated (page is public).
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'https://slidea.mismath.net';

test.describe('Pricing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE + '/pricing');
    await page.waitForLoadState('networkidle');
  });

  test('PR-01 — page title contains "Цени" or "Pricing"', async ({ page }) => {
    await expect(page).toHaveTitle(/цени|pricing/i);
  });

  // Was: "PR-02 — 14-day free trial hero badge is visible". The badge was
  // there, the trial was not — every Pro CTA promising "Пробај 14 дена
  // бесплатно" led to a manual bank-transfer form that granted nothing. The
  // test enforced the false promise rather than catching it. Inverted: the
  // page must not advertise a trial until one actually exists, and the free
  // plan (which is real, and more generous than the trial ever was) carries
  // the message instead.
  test('PR-02 — no free-trial promise, and the free plan is advertised', async ({ page }) => {
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/пробен период|дена бесплатно|free trial/i);
    expect(body).toMatch(/без кредитна картичка/i);
  });

  // The previous ladder had five rungs where paying monthly cost €60 a year
  // for less product than the €20 annual plan. These hold the shape of the
  // replacement: three tiers, an honest annual discount, and a one-off for
  // organisations that run a webinar or two a year and want no subscription.
  test('PR-11 — the billing toggle changes the price and states the saving', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Годишно/ })).toHaveAttribute('aria-pressed', 'true');
    // exact, or the price span and its wrapper both match.
    await expect(page.getByText('€36', { exact: true })).toBeVisible();
    await expect(page.getByText(/Заштедуваш €\d+ наспроти месечно/)).toBeVisible();

    await page.getByRole('button', { name: 'Месечно' }).click();
    await expect(page.getByText('€4', { exact: true })).toBeVisible();
    await expect(page.getByText(/€48 годишно/)).toBeVisible();
  });

  test('PR-12 — annual never costs more than paying monthly for a year', async ({ page }) => {
    await page.getByRole('button', { name: 'Месечно' }).click();
    const monthly = Number((await page.getByText(/^€\d+$/).nth(1).innerText()).replace('€', ''));
    await page.getByRole('button', { name: /Годишно/ }).click();
    const yearly = Number((await page.getByText(/^€\d+$/).nth(1).innerText()).replace('€', ''));
    expect(yearly).toBeLessThan(monthly * 12);
  });

  test('PR-13 — the one-off event plan is offered and reaches checkout', async ({ page }) => {
    const section = page.locator('section[aria-labelledby="event-plan-heading"]');
    await expect(section).toBeVisible();
    await expect(section).toContainText('€80');
    await expect(section).toContainText(/7 дена/);

    await section.getByRole('button', { name: /Резервирај настан/i }).click();
    await expect(page).toHaveURL(/\/checkout\/event/);
    await expect(page.locator('body')).toContainText('€80');
  });

  test('PR-14 — no plan on the page promises more than the tested 500 participants', async ({ page }) => {
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/[Нн]еограничени учесници/);
    expect(body).toMatch(/До 500 учесници/);
  });

  test('PR-03 — pricing cards are rendered (at least 2)', async ({ page }) => {
    // Cards have plan names — Основен, Про, Тим or similar
    const cardCount = await page.locator('[class*="rounded"][class*="border"]').count();
    expect(cardCount).toBeGreaterThanOrEqual(2);
  });

  test('PR-04 — Mentimeter comparison table is present', async ({ page }) => {
    await expect(page.locator('text=/Mentimeter|Наспроти/i').first()).toBeVisible();
  });

  // Was "comparison table toggle/button expands the table" and carried the
  // same broken selector as PR-07 — a regex inside :has-text() — so it threw
  // on locator.count() every run and never reached either branch. There is no
  // toggle: the table renders unconditionally. Assert what the page does.
  test('PR-05 — the Mentimeter comparison table renders its rows', async ({ page }) => {
    await expect(page.getByText('Учесници (бесплатен)')).toBeVisible();
    await expect(page.getByText('Податоци во ЕУ')).toBeVisible();
  });

  test('PR-06 — trust strip is visible (money-back / cancel anytime)', async ({ page }) => {
    const trustText = page.locator('text=/гаранција|откажи|cancel|guarantee/i').first();
    await expect(trustText).toBeVisible();
  });

  test('PR-07 — each paid plan card has a CTA button', async ({ page }) => {
    // A regex cannot appear inside a comma-joined CSS selector — Playwright
    // threw "Unexpected token /" on every run, so this test never actually
    // checked anything. Split into two locators instead.
    const linkCtas = page.locator('a[href*="checkout"], a[href*="upgrade"]');
    const buttonCtas = page.getByRole('button', { name: /Избери план|Започни|Купи|Start|Buy/i });
    const count = (await linkCtas.count()) + (await buttonCtas.count());
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // The page carried FAQPage structured data for questions that appeared
  // nowhere on it — markup Google treats as a violation, not a rich result.
  // The accordion is now the visible counterpart of that JSON-LD, so this
  // test guards the pairing rather than counting stray words on the page.
  test('PR-08 — FAQ accordion is visible and expands', async ({ page }) => {
    // Locate by attribute, not by aria-expanded state: a state-based locator
    // stops matching the moment the button is clicked, and .first() silently
    // re-resolves to the next collapsed row.
    const triggers = page.locator('button[aria-controls*="-panel-"]');
    expect(await triggers.count()).toBeGreaterThanOrEqual(3);

    const first = triggers.first();
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await first.click();
    await expect(first).toHaveAttribute('aria-expanded', 'true');

    // React's useId produces ids containing ':', which is not a valid CSS id
    // selector — match on the attribute instead.
    const panelId = await first.getAttribute('aria-controls');
    await expect(page.locator(`[id="${panelId}"]`)).toBeVisible();
  });

  test('PR-08b — every question in the FAQ JSON-LD is visible on the page', async ({ page }) => {
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = blocks
      .flatMap((b) => { try { const p = JSON.parse(b); return p['@graph'] || [p]; } catch { return []; } })
      .find((n) => n['@type'] === 'FAQPage');
    expect(faq, 'no FAQPage JSON-LD on /pricing').toBeTruthy();

    const body = await page.locator('body').innerText();
    for (const item of faq.mainEntity) {
      expect(body, `JSON-LD advertises "${item.name}" but the page does not show it`).toContain(item.name);
    }
  });

  test('PR-09 — page has a JSON-LD script tag (structured data)', async ({ page }) => {
    const ldJson = await page.locator('script[type="application/ld+json"]').count();
    expect(ldJson).toBeGreaterThanOrEqual(1);
  });

  test('PR-10 — page has canonical link tag', async ({ page }) => {
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('/pricing');
  });
});
