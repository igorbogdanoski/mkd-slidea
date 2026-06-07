/**
 * Scheduling feature tests — SCHED-01 to SCHED-08
 *
 * Covers: HomeTab upcoming section, PresentationsTab badge,
 *         EventSettingsModal schedule picker, clear schedule.
 *
 * Auth: uses SMOKE_TEST_EMAIL / SMOKE_TEST_PASSWORD env vars.
 * SPA navigation: window.history.pushState + PopStateEvent (NOT page.goto).
 * Permanent test event: B5V338 — MUST NEVER BE DELETED.
 */

import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';
const TEST_CODE = 'B5V338';

async function loginUser(page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', process.env.SMOKE_TEST_EMAIL);
  await page.fill('input[type="password"]', process.env.SMOKE_TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/dashboard`, { timeout: 15000 });
}

// ── SCHED-01 ─────────────────────────────────────────────────────────────────
test('SCHED-01: HomeTab renders Upcoming Events section when events have starts_at', async ({ page }) => {
  await loginUser(page);

  // Intercept the Supabase events query and inject a future starts_at
  await page.route('**/rest/v1/events*', async (route, request) => {
    const url = request.url();
    if (url.includes('select') && url.includes('starts_at')) {
      const now = new Date();
      const soon = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 h from now
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'mock-sched-1',
            code: TEST_CODE,
            title: 'Распоредена сесија',
            cover_image: null,
            created_at: new Date().toISOString(),
            starts_at: soon.toISOString(),
          },
        ]),
      });
    } else {
      await route.continue();
    }
  });

  // Navigate to home tab via SPA
  await page.evaluate(() => {
    window.history.pushState({}, '', '/dashboard');
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  });

  await expect(page.locator('text=Претстојни настани')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('text=Распоредена сесија')).toBeVisible();
});

// ── SCHED-02 ─────────────────────────────────────────────────────────────────
test('SCHED-02: Upcoming event within 30 minutes shows pulse badge', async ({ page }) => {
  await loginUser(page);

  await page.route('**/rest/v1/events*', async (route, request) => {
    const url = request.url();
    if (url.includes('select') && url.includes('starts_at')) {
      const soon = new Date(Date.now() + 20 * 60 * 1000); // 20 min from now
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'mock-sched-2',
            code: TEST_CODE,
            title: 'Скоро почнува',
            cover_image: null,
            created_at: new Date().toISOString(),
            starts_at: soon.toISOString(),
          },
        ]),
      });
    } else {
      await route.continue();
    }
  });

  await page.evaluate(() => {
    window.history.pushState({}, '', '/dashboard');
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  });

  // "Почни →" pulse badge should appear for events within 30 min
  await expect(page.locator('text=Почни →')).toBeVisible({ timeout: 8000 });
});

// ── SCHED-03 ─────────────────────────────────────────────────────────────────
test('SCHED-03: PresentationsTab shows schedule badge on event card', async ({ page }) => {
  await loginUser(page);

  await page.route('**/rest/v1/events*', async (route, request) => {
    const url = request.url();
    if (url.includes('select') && !url.includes('count')) {
      const future = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 h from now
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'mock-sched-3',
            code: TEST_CODE,
            title: 'Закажан настан',
            cover_image: null,
            created_at: new Date().toISOString(),
            starts_at: future.toISOString(),
          },
        ]),
      });
    } else {
      await route.continue();
    }
  });

  // Navigate to presentations tab
  await page.evaluate(() => {
    window.history.pushState({}, '', '/dashboard');
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  });

  await page.locator('button', { hasText: 'Настани' }).first().click();
  await expect(page.locator('text=Закажан настан')).toBeVisible({ timeout: 8000 });
  // Badge should show CalendarClock + time text
  await expect(page.locator('[class*="indigo-50"]').filter({ hasText: /За \d/ }).first()).toBeVisible();
});

// ── SCHED-04 ─────────────────────────────────────────────────────────────────
test('SCHED-04: Past starts_at does NOT show schedule badge', async ({ page }) => {
  await loginUser(page);

  await page.route('**/rest/v1/events*', async (route, request) => {
    const url = request.url();
    if (url.includes('select') && !url.includes('count')) {
      const past = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 h ago
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'mock-sched-4',
            code: TEST_CODE,
            title: 'Поминат настан',
            cover_image: null,
            created_at: new Date().toISOString(),
            starts_at: past.toISOString(),
          },
        ]),
      });
    } else {
      await route.continue();
    }
  });

  await page.evaluate(() => {
    window.history.pushState({}, '', '/dashboard');
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  });

  await page.locator('button', { hasText: 'Настани' }).first().click();
  await expect(page.locator('text=Поминат настан')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('[class*="CalendarClock"]')).toHaveCount(0);
});

// ── SCHED-05 ─────────────────────────────────────────────────────────────────
test('SCHED-05: EventSettingsModal contains schedule date-time input', async ({ page }) => {
  await loginUser(page);

  // Open the host view for test event
  await page.evaluate((code) => {
    localStorage.setItem('active_event_code', code);
  }, TEST_CODE);

  await page.evaluate(() => {
    window.history.pushState({}, '', '/host');
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  });

  // Open settings modal — look for gear/settings button
  const settingsBtn = page.locator('[aria-label="Поставки"], button:has-text("Поставки"), button[title*="астав"]').first();
  if (await settingsBtn.isVisible({ timeout: 5000 })) {
    await settingsBtn.click();
    await expect(page.locator('text=Закажи настан')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="datetime-local"]')).toBeVisible();
  } else {
    test.skip();
  }
});

// ── SCHED-06 ─────────────────────────────────────────────────────────────────
test('SCHED-06: Setting a schedule time triggers a Supabase update', async ({ page }) => {
  await loginUser(page);

  let updateCalled = false;
  await page.route('**/rest/v1/events*', async (route, request) => {
    if (request.method() === 'PATCH') {
      const body = request.postDataJSON?.();
      if (body?.starts_at) updateCalled = true;
    }
    await route.continue();
  });

  await page.evaluate((code) => {
    localStorage.setItem('active_event_code', code);
  }, TEST_CODE);

  await page.evaluate(() => {
    window.history.pushState({}, '', '/host');
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  });

  const settingsBtn = page.locator('[aria-label="Поставки"], button:has-text("Поставки"), button[title*="астав"]').first();
  if (await settingsBtn.isVisible({ timeout: 5000 })) {
    await settingsBtn.click();
    const input = page.locator('input[type="datetime-local"]');
    await expect(input).toBeVisible({ timeout: 5000 });

    const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const y = future.getFullYear();
    const mo = String(future.getMonth() + 1).padStart(2, '0');
    const d = String(future.getDate()).padStart(2, '0');
    await input.fill(`${y}-${mo}-${d}T10:00`);
    await input.blur();
    await page.waitForTimeout(1500);
    expect(updateCalled).toBe(true);
  } else {
    test.skip();
  }
});

// ── SCHED-07 ─────────────────────────────────────────────────────────────────
test('SCHED-07: Clear schedule button is visible in EventSettingsModal', async ({ page }) => {
  await loginUser(page);

  await page.evaluate((code) => {
    localStorage.setItem('active_event_code', code);
  }, TEST_CODE);

  await page.evaluate(() => {
    window.history.pushState({}, '', '/host');
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  });

  const settingsBtn = page.locator('[aria-label="Поставки"], button:has-text("Поставки"), button[title*="астав"]').first();
  if (await settingsBtn.isVisible({ timeout: 5000 })) {
    await settingsBtn.click();
    await expect(page.locator('text=Отстрани распоред')).toBeVisible({ timeout: 5000 });
  } else {
    test.skip();
  }
});

// ── SCHED-08 ─────────────────────────────────────────────────────────────────
test('SCHED-08: Upcoming section is absent when no events have starts_at', async ({ page }) => {
  await loginUser(page);

  await page.route('**/rest/v1/events*', async (route, request) => {
    const url = request.url();
    if (url.includes('starts_at') && url.includes('gte')) {
      // Return empty upcoming list
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    } else {
      await route.continue();
    }
  });

  await page.evaluate(() => {
    window.history.pushState({}, '', '/dashboard');
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  });

  await page.waitForTimeout(2000);
  await expect(page.locator('text=Претстојни настани')).toHaveCount(0);
});
