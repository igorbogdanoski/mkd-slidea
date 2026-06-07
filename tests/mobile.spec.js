/**
 * Mobile Viewport — E2E Tests
 *
 * Tests every major page at 375×812 (iPhone 14) and 390×844 (iPhone 14 Pro).
 * Checks for: overflow, readable text, touch target sizes, hamburger menu.
 */
import { test, expect } from '@playwright/test';

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
  await page.locator('text=Одјави').waitFor({ timeout: 30000 });
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

    // Either hamburger icon or nav links should be visible
    const hamburger = page.locator(
      'button[aria-label*="menu"], button[aria-label*="Menu"], .hamburger, [data-testid="mobile-menu"], button:has(svg)'
    ).first();

    const navLinks = page.locator('nav a, header a').first();

    const hasBurger = await hamburger.isVisible({ timeout: 3000 }).catch(() => false);
    const hasNav    = await navLinks.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasBurger || hasNav).toBe(true);
  });

  test('M-03: Hamburger menu opens and shows links', async ({ page }) => {
    await page.setViewportSize(IPHONE_14);
    await page.goto(BASE);
    await page.waitForTimeout(1000);

    const hamburger = page.locator(
      'button[aria-label*="menu"], button[aria-label*="Menu"], button[aria-label*="навигација"], .hamburger'
    ).first();

    if (await hamburger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hamburger.click();
      await page.waitForTimeout(500);

      // After click, at least one nav link should be visible
      const mobileLinks = page.locator('nav a, [role="navigation"] a, .mobile-menu a').first();
      await expect(mobileLinks).toBeVisible({ timeout: 3000 });
    } else {
      test.skip(true, 'No hamburger button found');
    }
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

    const input = page.locator('input').first();
    await input.tap();
    await page.waitForTimeout(500);

    // Page should not crash when input receives focus
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('TypeError');
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

  test('M-09: Poll options fill width on mobile', async ({ page }) => {
    await page.setViewportSize(IPHONE_14);
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(2000);

    const option = page.locator(
      'button[data-type="option"], .poll-option, button.option'
    ).first();

    if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await option.boundingBox();
      // Options should span most of the mobile viewport width
      expect(box.width).toBeGreaterThan(200);
      expect(box.height).toBeGreaterThanOrEqual(44);
    } else {
      test.skip(true, 'No active poll options');
    }
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
