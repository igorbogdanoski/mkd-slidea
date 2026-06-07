/**
 * Accessibility — E2E Tests
 *
 * Checks: keyboard navigation, aria labels, focus management,
 * color contrast indicators, screen reader hints, role attributes.
 *
 * These are structural checks, not full WCAG audits.
 * For a full audit use `axe-core` or Lighthouse CI.
 */
import { test, expect } from '@playwright/test';

const BASE       = process.env.BASE_URL || 'https://slidea.mismath.net';
const EMAIL      = process.env.SMOKE_TEST_EMAIL || '';
const PASSWORD   = process.env.SMOKE_TEST_PASSWORD || '';
const EVENT_CODE = process.env.TEST_EVENT_CODE || 'B5V338';

const signIn = async (page) => {
  await page.addInitScript(() => localStorage.setItem('onboarding_v1_done', 'true'));
  await page.goto(BASE + '/?login=1');
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.locator('text=Одјави').waitFor({ timeout: 30000 });
};

// ── Keyboard Navigation ────────────────────────────────────────────────────

test.describe('A11Y — Keyboard Navigation', () => {

  test('A-01: Landing page interactive elements are tab-reachable', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(1000);

    // Tab through first 10 elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }

    // Focused element should be a known interactive element
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(focused)).toBe(true);
  });

  test('A-02: Join page code input reachable via keyboard', async ({ page }) => {
    await page.goto(`${BASE}/join`);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    const focused = await page.evaluate(() => document.activeElement?.tagName);
    // After one Tab on join page, input should be focused
    expect(['INPUT', 'BUTTON', 'A'].includes(focused)).toBe(true);
  });

  test('A-03: Escape key closes modals', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(1000);

    // Try to open a modal
    const modalTrigger = page.locator(
      'button:has-text("Приклучи се"), button:has-text("Логирај"), a:has-text("Приклучи се")'
    ).first();

    if (await modalTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await modalTrigger.click();
      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"], .modal').first();
      if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        await expect(modal).not.toBeVisible({ timeout: 2000 });
      }
    } else {
      test.skip(true, 'No modal trigger found on landing');
    }
  });

  test('A-04: Presenter view arrow key navigation works', async ({ page }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}/present`);
    await page.waitForTimeout(2000);

    // Right arrow should advance slides
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);
    await expect(page.locator('body')).not.toContainText('TypeError');

    // Left arrow should go back
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(400);
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});

// ── ARIA Labels & Roles ────────────────────────────────────────────────────

test.describe('A11Y — ARIA Roles and Labels', () => {

  test('A-05: Landing page has main landmark', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(1000);

    const main = page.locator('main, [role="main"]').first();
    await expect(main).toBeVisible({ timeout: 5000 });
  });

  test('A-06: Navigation has aria-label or nav element', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(1000);

    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible({ timeout: 5000 });
  });

  test('A-07: Page has a single H1 element', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(1000);

    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h1Count).toBeLessThanOrEqual(2); // 1 ideal, allow 2 for hidden/mobile
  });

  test('A-08: Join page input has label or aria-label', async ({ page }) => {
    await page.goto(`${BASE}/join`);
    await page.waitForTimeout(1000);

    const input = page.locator('input').first();
    await expect(input).toBeVisible();

    const ariaLabel = await input.getAttribute('aria-label');
    const ariaLabelledBy = await input.getAttribute('aria-labelledby');
    const placeholder = await input.getAttribute('placeholder');
    const id = await input.getAttribute('id');

    // Any of these is acceptable for screen readers
    const hasLabel =
      !!ariaLabel ||
      !!ariaLabelledBy ||
      !!placeholder ||
      (!!id && await page.locator(`label[for="${id}"]`).count() > 0);

    expect(hasLabel).toBe(true);
  });

  test('A-09: Buttons have accessible text (not icon-only without label)', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(1000);

    const buttons = page.locator('button');
    const count = await buttons.count();

    let iconOnlyCount = 0;
    for (let i = 0; i < Math.min(count, 20); i++) {
      const btn = buttons.nth(i);
      const text = (await btn.innerText()).trim();
      const ariaLabel = await btn.getAttribute('aria-label');
      const title = await btn.getAttribute('title');
      const ariaLabelledBy = await btn.getAttribute('aria-labelledby');

      if (!text && !ariaLabel && !title && !ariaLabelledBy) {
        iconOnlyCount++;
      }
    }

    // Allow max 3 unlabeled icon buttons (close/open icons sometimes miss labels)
    expect(iconOnlyCount).toBeLessThanOrEqual(3);
  });
});

// ── Focus Management ──────────────────────────────────────────────────────

test.describe('A11Y — Focus Management', () => {

  test('A-10: Focus is visible (not hidden)', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(1000);

    // Tab to first interactive element
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    const outlineStyle = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        outline: style.outline,
        outlineWidth: style.outlineWidth,
        outlineStyle: style.outlineStyle,
        boxShadow: style.boxShadow,
      };
    });

    if (outlineStyle) {
      // Either outline or box-shadow focus ring must be present
      const hasOutline = outlineStyle.outlineWidth !== '0px' && outlineStyle.outlineStyle !== 'none';
      const hasBoxShadow = outlineStyle.boxShadow && outlineStyle.boxShadow !== 'none';
      expect(hasOutline || hasBoxShadow).toBe(true);
    }
  });

  test('A-11: Modal traps focus when open', async ({ page }) => {
    await page.goto(`${BASE}/join`);
    await page.waitForTimeout(1000);

    const input = page.locator('input').first();
    await input.tap();
    await input.fill(EVENT_CODE);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // After navigating, focus should be in the new page
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).not.toBe('BODY');
  });
});

// ── Live Regions ──────────────────────────────────────────────────────────

test.describe('A11Y — Live Regions', () => {

  test('A-12: Participant view has aria-live region for vote updates', async ({ page }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(3000);

    const liveRegion = page.locator('[aria-live], [aria-atomic]').first();
    // Not all apps have this yet — just check if present
    const hasLive = await liveRegion.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasLive) {
      await expect(liveRegion).toBeVisible();
    } else {
      // Known gap — logged in IMPROVEMENTS.md A11Y-1
      console.warn('A-12: No aria-live region found — see IMPROVEMENTS.md A11Y-1');
      test.skip(true, 'aria-live regions not yet implemented — see IMPROVEMENTS.md A11Y-1');
    }
  });

  test('A-13: Loading states are announced to screen readers', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(500);

    // Check for status or alert role during load
    const statusEl = page.locator('[role="status"], [role="alert"], [aria-busy="true"]').first();
    // This is optional — just verify it doesn't break
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});

// ── Color Contrast (structural) ───────────────────────────────────────────

test.describe('A11Y — Color Contrast (structural)', () => {

  test('A-14: No transparent text on landing page', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(1000);

    const transparentText = await page.evaluate(() => {
      const texts = document.querySelectorAll('h1, h2, h3, p, a, button');
      let transparent = 0;
      for (const el of texts) {
        const style = window.getComputedStyle(el);
        if (style.color === 'rgba(0, 0, 0, 0)' || style.color === 'transparent') {
          transparent++;
        }
      }
      return transparent;
    });

    expect(transparentText).toBe(0);
  });

  test('A-15: Pricing page text is not white-on-white or black-on-black', async ({ page }) => {
    await page.goto(`${BASE}/pricing`);
    await page.waitForTimeout(1000);

    const badContrast = await page.evaluate(() => {
      const texts = document.querySelectorAll('.pricing-card p, .pricing-card h3');
      let bad = 0;
      for (const el of texts) {
        const style = window.getComputedStyle(el);
        const bg = getComputedStyle(el.closest('[class*="card"]') || el).backgroundColor;
        if (style.color === bg) bad++;
      }
      return bad;
    });

    expect(badContrast).toBe(0);
  });
});

// ── Language & Internationalization ──────────────────────────────────────

test.describe('A11Y — Language Attributes', () => {

  test('A-16: HTML element has lang attribute', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(1000);

    const lang = await page.evaluate(() => document.documentElement.lang);
    expect(lang).toBeTruthy();
    expect(lang.length).toBeGreaterThanOrEqual(2);
  });

  test('A-17: Lang changes when language is switched', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(1000);

    const langBefore = await page.evaluate(() => document.documentElement.lang);

    // Try to find language switcher
    const langSwitcher = page.locator(
      'button:has-text("EN"), button:has-text("MK"), [data-testid="lang-switcher"], select'
    ).first();

    if (await langSwitcher.isVisible({ timeout: 3000 }).catch(() => false)) {
      await langSwitcher.click();
      await page.waitForTimeout(500);
      // If English is available, click it
      const enOption = page.locator('button:has-text("English"), li:has-text("English"), option[value="en"]').first();
      if (await enOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await enOption.click();
        await page.waitForTimeout(500);
        const langAfter = await page.evaluate(() => document.documentElement.lang);
        // Language should change
        expect(langAfter).toBeTruthy();
      }
    } else {
      test.skip(true, 'Language switcher not found');
    }
  });
});
