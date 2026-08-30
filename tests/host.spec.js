/**
 * Host / Session Creation — E2E Tests
 *
 * Covers: create session, add poll, add quiz, start live session,
 * presenter controls, results view, delete session.
 *
 * Requires: SMOKE_TEST_EMAIL + SMOKE_TEST_PASSWORD env vars.
 */
import { test, expect } from '@playwright/test';

const BASE     = process.env.BASE_URL || 'https://slidea.mismath.net';
const EMAIL    = process.env.SMOKE_TEST_EMAIL || '';
const PASSWORD = process.env.SMOKE_TEST_PASSWORD || '';

// ── Helpers ────────────────────────────────────────────────────────────────

const signIn = async (page) => {
  await page.addInitScript(() => localStorage.setItem('onboarding_v1_done', 'true'));
  await page.goto(BASE + '/?login=1');
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.locator('text=Одјави').waitFor({ timeout: 30000 });
};

const goTo = async (page, path) => {
  await page.evaluate((p) => {
    window.history.pushState({}, '', p);
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  }, path);
  await page.waitForTimeout(600);
};

// "Додај активност" → InteractionTypeGrid → the create modal for that type.
// Waits for the add control first: /host with no active_event_code has to
// create the event before any of this renders.
const addActivityOfType = async (page, cardName) => {
  await page.locator('[data-testid="add-activity"], [data-testid="add-activity-empty"]')
    .first().click({ timeout: 30000 });
  await page.getByRole('button', { name: cardName }).first().click({ timeout: 15000 });
};

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe('Host — Session Creation', () => {
  test.skip(!EMAIL || !PASSWORD, 'Credentials not set');

  test('H-01: /host loads without errors', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');
    await expect(page).toHaveURL(/\/host/);
    await expect(page.locator('body')).not.toContainText('does not exist');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('H-02: Host page shows activity type selector', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');
    // /host with no active_event_code creates an event first, so this has to
    // wait rather than read visibility once. `activity-type-grid` is not a
    // hook the app has ever had; `add-activity` (and its empty-state twin) is.
    await expect(
      page.locator('[data-testid="add-activity"], [data-testid="add-activity-empty"]').first()
    ).toBeVisible({ timeout: 30000 });
  });

  test('H-03: Can add a Poll activity', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');

    // The real path is "Додај активност" → InteractionTypeGrid → CreatePollModal.
    // There is no keyboard shortcut and no `data-type="poll"`, so the old
    // locator list fell through to pressing "p", which does nothing, and then
    // looked for a placeholder containing "прашање" that the modal never had.
    await addActivityOfType(page, /Анкета \(Повеќе избор\)/);
    await expect(
      page.locator('textarea[placeholder^="Што сакате"]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('H-04: Can add a Quiz activity', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');

    // This one reported green without ever opening the quiz modal: pressing
    // "q" does nothing, and the assertion's `input[type="checkbox"]` fallback
    // matched a toggle already on the host page. Drive the real path and
    // assert on the modal's own hook.
    await addActivityOfType(page, /Квиз \(Натпревар\)/);
    await expect(
      page.locator('[data-testid="correct-answer"]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('H-05: Session has a joinable code / QR', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');
    await page.waitForTimeout(1000);

    // Should show event code somewhere on the host page
    const codeEl = page.locator(
      // A regex text engine cannot be comma-joined with CSS selectors —
      // Playwright rejects the whole string, so this check never ran. Split
      // into two locators and take whichever the page provides.
      '[data-testid="event-code"], .event-code'
    ).first();

    const codeFallback = page.getByText(/^[A-Z0-9]{5,8}$/).first();
    const shown = await codeEl.isVisible({ timeout: 4000 }).catch(() => false)
      ? codeEl
      : codeFallback;
    await expect(shown).toBeVisible({ timeout: 8000 });
  });

  test('H-06: AI Assistant modal opens', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');

    const aiBtn = page.locator(
      'button:has-text("AI"), button[title*="AI"], button[title*="генерирај"]'
    ).first();

    if (await aiBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await aiBtn.click();
    } else {
      await page.keyboard.press('a');
    }

    await page.waitForTimeout(600);

    const modal = page.locator(
      '[role="dialog"], .modal, [data-testid="ai-modal"]'
    ).first();

    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('H-06b: AI generation — successful response renders preview', async ({ page }) => {
    const mockQuestion = 'Колку планети има во Сончевиот систем?';

    await page.route('**/api/generate', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          question: mockQuestion,
          type: 'quiz',
          options: [
            { text: '6', is_correct: false },
            { text: '7', is_correct: false },
            { text: '8', is_correct: true },
            { text: '9', is_correct: false },
          ],
          correct_index: 2,
        }),
      })
    );

    await signIn(page);
    await goTo(page, '/host');

    // Open AI modal
    const aiBtn = page.locator(
      'button:has-text("AI"), button[title*="AI"], button[title*="генерирај"]'
    ).first();
    if (await aiBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await aiBtn.click();
    } else {
      await page.keyboard.press('a');
    }

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Fill prompt
    await modal.locator('textarea').fill('Сончев систем');

    // Click generate — button becomes "Генерирам..." (loading)
    const generateBtn = modal.locator('button:has-text("Генерирај")').first();
    await generateBtn.click();

    // Loading state: button text changes to "Генерирам..."
    await expect(modal.locator('text=Генерирам')).toBeVisible({ timeout: 3000 });

    // Preview panel appears with "✓ Генерирано" badge
    await expect(modal.locator('text=Генерирано')).toBeVisible({ timeout: 8000 });

    // Mocked question renders in preview textarea
    await expect(modal.locator(`textarea:has-text("${mockQuestion}")`)).toBeVisible({ timeout: 5000 });
  });

  test('H-06c: AI generation — error response shows error message', async ({ page }) => {
    await page.route('**/api/generate', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Gemini service unavailable' }),
      })
    );

    await signIn(page);
    await goTo(page, '/host');

    const aiBtn = page.locator(
      'button:has-text("AI"), button[title*="AI"], button[title*="генерирај"]'
    ).first();
    if (await aiBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await aiBtn.click();
    } else {
      await page.keyboard.press('a');
    }

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    await modal.locator('textarea').fill('Тест прашање');
    await modal.locator('button:has-text("Генерирај")').first().click();

    // Error message from the API should render
    await expect(modal.locator('text=Gemini service unavailable')).toBeVisible({ timeout: 8000 });
  });

  test('H-07: Templates modal opens', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');

    const tmplBtn = page.locator(
      'button:has-text("Шаблони"), button:has-text("Templates"), button[title*="шаблон"]'
    ).first();

    if (await tmplBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tmplBtn.click();
    } else {
      await page.keyboard.press('t');
    }

    await page.waitForTimeout(600);

    const modal = page.locator('[role="dialog"], .modal').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('H-08: Results view loads for existing event', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/dashboard');
    await page.waitForTimeout(1500);

    // The dashboard opens on "home", where the onboarding checklist has a
    // "Прегледај резултати" step — which is what the original
    // button:has-text("Резултати") matched first, so the click never reached
    // an event and no dialog was ever going to open. The per-event button is
    // in the "Мои презентации" tab, and :has-text is a case-insensitive
    // substring match, so it also matches "Сподели јавни резултати" on the
    // same card. Both mistakes are avoided by naming the button exactly.
    const eventsTab = page.getByRole('button', { name: /Мои презентации/ }).first();
    if (await eventsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await eventsTab.click();
      await page.waitForTimeout(1500);
    }

    const resultsBtn = page.locator('button:has-text("📊 Резултати")').first();

    if (await resultsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await resultsBtn.click();
      await page.waitForTimeout(1000);
      const modal = page.locator('[role="dialog"], .modal, [data-testid="results-modal"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      await expect(page.locator('body')).not.toContainText('does not exist');
    } else {
      test.skip(true, 'No events found to test results');
    }
  });
});

test.describe('Host — Presenter View Controls', () => {
  test.skip(!EMAIL || !PASSWORD, 'Credentials not set');

  const EVENT_CODE = process.env.TEST_EVENT_CODE || 'B5V338';

  test('H-09: Presenter view renders without errors', async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/event/${EVENT_CODE}/present`);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('does not exist');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('H-10: Presenter shows QR code button', async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/event/${EVENT_CODE}/present`);
    await page.waitForTimeout(2000);

    // The QR is rendered inline in the header and is always on screen — there
    // is no button to press, which is the better behaviour for a projector.
    // This asserted a button that has never existed.
    const qr = page.locator('svg[height="100"], header svg').first();
    await expect(qr).toBeVisible({ timeout: 8000 });
  });

  test('H-11: Presenter shows participant count', async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/event/${EVENT_CODE}/present`);
    await page.waitForTimeout(2000);

    // Participant counter should be visible
    // The sidebar says "N во живо", not "N учесник" — and a regex text
    // engine cannot be comma-joined with CSS selectors anyway, so this
    // locator was rejected outright rather than merely not matching.
    const counter = page.getByText(/\d+\s+во живо/i).first();

    await expect(counter).toBeVisible({ timeout: 8000 });
  });

  test('H-12: Keyboard navigation — arrow keys work', async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/event/${EVENT_CODE}/present`);
    await page.waitForTimeout(2000);

    const bodyBefore = await page.locator('body').innerText();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    // App should not crash after arrow key
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});
