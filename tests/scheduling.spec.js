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

const BASE = process.env.BASE_URL || 'http://localhost:5173';
const TEST_CODE = 'B5V338';

// There is no /login route — sign-in is the modal opened by /?login=1, the
// same flow every other spec uses. Waiting for the logout control proves the
// session is live without depending on a redirect that never happens.
async function loginUser(page) {
  await page.addInitScript(() => localStorage.setItem('onboarding_v1_done', 'true'));
  await page.goto(`${BASE}/?login=1`);
  await page.fill('input[type="email"]', process.env.SMOKE_TEST_EMAIL);
  await page.fill('input[type="password"]', process.env.SMOKE_TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.locator('text=Одјави').first().waitFor({ state: 'attached', timeout: 30000 });
}

// Going to /host with no active_event_code auto-creates an event owned by the
// signed-in user. SCHED-05..07 need that: B5V338 belongs to Igor, so a
// throwaway smoke account can read it but every PATCH it sends is refused by
// RLS — which is what made SCHED-06 meaningless against a shared account.
async function openOwnEventSettings(page) {
  await page.evaluate(() => localStorage.removeItem('active_event_code'));
  await page.goto(`${BASE}/host`);
  await page.locator('p:has-text("Управувајте со")').waitFor({ timeout: 30000 });
  // The control is icon-only: `title="Поставки"`, aria-label "Отвори поставки
  // на настан". The old selector list matched none of them, so all three tests
  // fell into `test.skip()` and reported green without touching the feature.
  await page.locator('button[title="Поставки"]').click();
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

  // The section heading is "Наскоро" (HomeTab.jsx) — "Претстојни настани" was
  // never in the UI, so the old selector could only ever time out.
  await expect(page.getByRole('heading', { name: 'Наскоро' })).toBeVisible({ timeout: 8000 });
  await expect(page.locator('text=Распоредена сесија').first()).toBeVisible();
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

  // The sidebar item is "Мои презентации"; `data-tour` is the stable handle.
  await page.locator('[data-tour="sidebar-presentations"]').click();
  await expect(page.locator('text=Закажан настан').first()).toBeVisible({ timeout: 8000 });
  // Badge shows CalendarClock + relative time ("За 5 часа" for a +5 h event).
  await expect(page.getByText(/За \d+ (мин|час|часа|дена)/).first()).toBeVisible({ timeout: 8000 });
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

  await page.locator('[data-tour="sidebar-presentations"]').click();
  await expect(page.locator('text=Поминат настан').first()).toBeVisible({ timeout: 8000 });
  // formatSchedule() returns null for a past starts_at, so the badge — and its
  // relative-time text — must not render at all. Asserting on the icon class
  // was a no-op: lucide renders `lucide-calendar-clock`, never "CalendarClock".
  await expect(page.getByText(/За \d+ (мин|час|часа|дена)|^Утре ·/)).toHaveCount(0);
});

// ── SCHED-05 ─────────────────────────────────────────────────────────────────
test('SCHED-05: EventSettingsModal contains schedule date-time input', async ({ page }) => {
  await loginUser(page);

  await openOwnEventSettings(page);
  await expect(page.locator('text=Закажи настан')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('input[type="datetime-local"]').first()).toBeVisible();
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

  await openOwnEventSettings(page);
  const input = page.locator('input[type="datetime-local"]').first();
  await expect(input).toBeVisible({ timeout: 5000 });

  const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const y = future.getFullYear();
  const mo = String(future.getMonth() + 1).padStart(2, '0');
  const d = String(future.getDate()).padStart(2, '0');
  await input.fill(`${y}-${mo}-${d}T10:00`);
  await input.blur();
  await expect.poll(() => updateCalled, { timeout: 10000 }).toBe(true);
});

// ── SCHED-07 ─────────────────────────────────────────────────────────────────
test('SCHED-07: Clear schedule button is visible in EventSettingsModal', async ({ page }) => {
  await loginUser(page);

  await openOwnEventSettings(page);
  // The clear-schedule control only renders once a schedule exists, so set one
  // first — otherwise this asserts on a button the UI is right to hide.
  const input = page.locator('input[type="datetime-local"]').first();
  await expect(input).toBeVisible({ timeout: 5000 });
  const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const stamp = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}T09:00`;
  await input.fill(stamp);
  await input.blur();
  await expect(page.locator('text=Отстрани распоред')).toBeVisible({ timeout: 10000 });
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
  // Same rename as SCHED-01: asserting count 0 on a string the UI never
  // rendered made this test pass no matter what the section did.
  await expect(page.getByRole('heading', { name: 'Наскоро' })).toHaveCount(0);
});
