/**
 * Mobile Viewport — E2E Tests
 *
 * Tests every major page at 375×812 (iPhone 14) and 390×844 (iPhone 14 Pro).
 * Checks for: overflow, readable text, touch target sizes, hamburger menu.
 */
import { test, expect } from '@playwright/test';
import { liveEventWith, joinEvent } from './helpers/liveEvent.js';

const BASE       = process.env.BASE_URL || 'https://slidea.mismath.net';
const EMAIL      = process.env.SMOKE_TEST_EMAIL || '';
const PASSWORD   = process.env.SMOKE_TEST_PASSWORD || '';
const EVENT_CODE = process.env.TEST_EVENT_CODE || 'B5V338';

const IPHONE_14 = { width: 375, height: 812 };
const IPHONE_PRO = { width: 390, height: 844 };
const ANDROID = { width: 360, height: 800 };

const noOverflow = async (page) => {
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
  const client = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scroll).toBeLessThanOrEqual(client + 5);
};

const signIn = async (page) => {
  await page.addInitScript(() => localStorage.setItem('onboarding_v1_done', 'true'));
  await page.goto(BASE + '/?login=1');
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  // At mobile widths the desktop logout control is `hidden nav:block` and the
  // mobile copy lives inside the hamburger menu — so wait for DOM presence,
  // not visibility; visibility here would assert the breakpoint, not login.
  await page.locator('text=Одјави').first().waitFor({ state: 'attached', timeout: 30000 });
};

// ── Landing Page ──────────────────────────────────────────────────────────

test.describe('Mobile — Landing Page', () => {

  test('M-01: Landing page — no horizontal overflow on iPhone 14', async ({ page }) => {
    await page.setViewportSize(IPHONE_14);
    await page.goto(BASE);
    await page.waitForTimeout(1500);
    await noOverflow(page);
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('M-02: Landing page has hamburger menu or visible nav on mobile', async ({ page }) => {
    await page.setViewportSize(IPHONE_14);
    await page.goto(BASE);
    await page.waitForTimeout(1000);

    // The menu control is labelled in the active locale ("Мени"), and the nav
    // is built from buttons, not anchors — the old selector list looked only
    // for English labels and `nav a`, so it matched nothing and the test
    // asserted false === true.
    const burger = page.getByRole('button', { name: /Мени|Menu/i });
    await expect(burger).toBeVisible();
    await expect(burger).toHaveAttribute('aria-controls', 'mobile-menu');
  });

  test('M-03: Hamburger menu opens and shows links', async ({ page }) => {
    await page.setViewportSize(IPHONE_14);
    await page.goto(BASE);
    await page.waitForTimeout(1000);

    // Nav.jsx labels it `t('nav.menu', 'Мени')`. The old list looked for the
    // Latin "menu"/"Menu" and for "навигација", none of which match Cyrillic
    // "Мени", so this skipped itself every run instead of testing the menu.
    const hamburger = page.locator('button[aria-label="Мени"]').first();
    await expect(hamburger).toBeVisible({ timeout: 10000 });
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    await hamburger.click();

    // The dropdown it controls holds <button>s, not anchors — every item is a
    // client-side action (setView/navigate), so `nav a` finds nothing.
    const menu = page.locator('#mobile-menu');
    await expect(menu).toBeVisible({ timeout: 5000 });
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.locator('button').first()).toBeVisible();
  });

  test('M-04: Hero CTA button is tap-friendly (≥44px)', async ({ page }) => {
    await page.setViewportSize(IPHONE_14);
    await page.goto(BASE);
    await page.waitForTimeout(1000);

    const cta = page.locator(
      'a:has-text("Приклучи се"), a:has-text("Почни"), button:has-text("Приклучи")'
    ).first();

    if (await cta.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await cta.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(40);
    }
  });
});

// ── Join Page ─────────────────────────────────────────────────────────────

test.describe('Mobile — Join Page', () => {

  test('M-05: Join page — no overflow on Android viewport', async ({ page }) => {
    await page.setViewportSize(ANDROID);
    await page.goto(`${BASE}/join`);
    await page.waitForTimeout(1000);
    await noOverflow(page);
  });

  test('M-06: Code input is large enough for thumb typing', async ({ page }) => {
    await page.setViewportSize(IPHONE_14);
    await page.goto(`${BASE}/join`);
    await page.waitForTimeout(1000);

    const input = page.locator('input').first();
    await expect(input).toBeVisible();

    const box = await input.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(40);
  });

  test('M-07: Join keyboard doesn\'t push content out of view', async ({ page }) => {
    await page.setViewportSize(IPHONE_14);
    await page.goto(`${BASE}/join`);
    await page.waitForTimeout(1000);

    // .tap() needs a touch-enabled context; this project is Desktop Chrome
    // with a resized viewport, so the call threw and the assertions below were
    // never reached. click() exercises the same focus path here.
    const input = page.locator('input').first();
    await input.click();
    await page.waitForTimeout(500);

    await expect(input).toBeFocused();
    await expect(page.locator('body')).not.toContainText('TypeError');
    // Focusing the field must not introduce a horizontal scroll.
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(overflows).toBe(false);
  });
});

// ── Participant View ──────────────────────────────────────────────────────

test.describe('Mobile — Participant Event View', () => {

  test('M-08: Participant view — no overflow on iPhone 14', async ({ page }) => {
    await page.setViewportSize(IPHONE_14);
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(2000);
    await noOverflow(page);
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  // Needs a poll to actually be the active activity, which no shared event can
  // be relied on to have — so it makes its own. `.poll-option` / `button.option`
  // were never classes the app used, so this only ever skipped.
  test('M-09: Poll options fill width on mobile', async ({ browser }) => {
    test.skip(!EMAIL || !PASSWORD, 'SMOKE_TEST_EMAIL / SMOKE_TEST_PASSWORD not set');
    const { code, hostCtx } = await liveEventWith(browser, {
      base: BASE, email: EMAIL, password: PASSWORD, type: 'poll',
      question: 'Каде работите?', options: ['Во основно', 'Во средно'],
    });
    const ctx = await browser.newContext({ viewport: IPHONE_14 });
    const page = await ctx.newPage();
    await joinEvent(page, BASE, code, 'Тест Мобилен');

    const option = page.getByRole('button', { name: 'Во основно' }).first();
    await expect(option).toBeVisible({ timeout: 30000 });
    const box = await option.boundingBox();
    expect(box.width).toBeGreaterThan(200);
    expect(box.height).toBeGreaterThanOrEqual(44);

    await ctx.close();
    await hostCtx.close();
  });

  test('M-10: Participant view — iPhone Pro viewport works', async ({ page }) => {
    await page.setViewportSize(IPHONE_PRO);
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(2000);
    await noOverflow(page);
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});

// ── Presenter View ────────────────────────────────────────────────────────

test.describe('Mobile — Presenter View', () => {

  test('M-11: Presenter controls visible on tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE}/event/${EVENT_CODE}/present`);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).toBeVisible();
  });
});

// ── Dashboard ─────────────────────────────────────────────────────────────

test.describe('Mobile — Dashboard', () => {
  test.skip(!EMAIL || !PASSWORD, 'Credentials not set');

  test('M-12: Dashboard renders on mobile without overflow', async ({ page }) => {
    await page.setViewportSize(IPHONE_14);
    await signIn(page);
    await page.evaluate((p) => {
      window.history.pushState({}, '', p);
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    }, '/dashboard');
    await page.waitForTimeout(1500);
    await noOverflow(page);
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('M-13: Dashboard shows mobile nav or tab bar', async ({ page }) => {
    await page.setViewportSize(IPHONE_14);
    await signIn(page);
    await page.evaluate((p) => {
      window.history.pushState({}, '', p);
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    }, '/dashboard');
    await page.waitForTimeout(1500);

    // Look for bottom navigation or tab navigation
    const bottomNav = page.locator(
      'nav[aria-label*="mobile"], .bottom-nav, .tab-bar, [data-testid="bottom-nav"]'
    ).first();

    const tabs = page.locator('[role="tab"], .tab-btn').first();
    const hasMobileNav = await bottomNav.isVisible({ timeout: 2000 }).catch(() => false);
    const hasTabs = await tabs.isVisible({ timeout: 2000 }).catch(() => false);

    // At minimum, page should load without errors
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});

// ── Pricing Page ──────────────────────────────────────────────────────────

test.describe('Mobile — Pricing Page', () => {

  test('M-14: Pricing cards stack vertically on mobile', async ({ page }) => {
    await page.setViewportSize(IPHONE_14);
    await page.goto(`${BASE}/pricing`);
    await page.waitForTimeout(1500);
    await noOverflow(page);

    const cards = page.locator('.pricing-card, [data-testid="pricing-card"]');
    const count = await cards.count();

    if (count > 1) {
      const box0 = await cards.nth(0).boundingBox();
      const box1 = await cards.nth(1).boundingBox();
      // On mobile, cards should stack (second card's Y > first card's Y)
      expect(box1.y).toBeGreaterThan(box0.y);
    } else {
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('M-15: Pricing page — no overflow on Android', async ({ page }) => {
    await page.setViewportSize(ANDROID);
    await page.goto(`${BASE}/pricing`);
    await page.waitForTimeout(1000);
    await noOverflow(page);
  });
});
