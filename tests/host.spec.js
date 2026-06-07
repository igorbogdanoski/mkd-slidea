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
    // Should show at least one way to add an activity
    const hasSelector = await page.locator(
      'button:has-text("Прашање"), button:has-text("Квиз"), button:has-text("Poll"), button:has-text("Додај")'
    ).first().isVisible().catch(() => false);
    const hasGrid = await page.locator('[data-testid="activity-type-grid"], .activity-type-grid').isVisible().catch(() => false);
    expect(hasSelector || hasGrid).toBe(true);
  });

  test('H-03: Can add a Poll activity', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');

    // Click add poll (keyboard shortcut or button)
    const pollBtn = page.locator(
      'button:has-text("Прашање"), button[title*="poll"], button[title*="Poll"], [data-type="poll"]'
    ).first();

    if (await pollBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pollBtn.click();
    } else {
      await page.keyboard.press('p');
    }

    await page.waitForTimeout(800);

    // Should see a question input field
    const questionInput = page.locator(
      'input[placeholder*="прашање"], input[placeholder*="Прашање"], textarea[placeholder*="прашање"], [data-testid="question-input"]'
    ).first();

    await expect(questionInput).toBeVisible({ timeout: 5000 });
  });

  test('H-04: Can add a Quiz activity', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');

    const quizBtn = page.locator(
      'button:has-text("Квиз"), button[title*="quiz"], [data-type="quiz"]'
    ).first();

    if (await quizBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await quizBtn.click();
    } else {
      await page.keyboard.press('q');
    }

    await page.waitForTimeout(800);

    // Quiz should have a "correct answer" indicator
    const correctIndicator = page.locator(
      'button:has-text("Точен"), [data-testid="correct-answer"], input[type="radio"], input[type="checkbox"]'
    ).first();

    await expect(correctIndicator).toBeVisible({ timeout: 5000 });
  });

  test('H-05: Session has a joinable code / QR', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');
    await page.waitForTimeout(1000);

    // Should show event code somewhere on the host page
    const codeEl = page.locator(
      '[data-testid="event-code"], .event-code, text=/[A-Z0-9]{5,8}/'
    ).first();

    await expect(codeEl).toBeVisible({ timeout: 8000 });
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

    // Click the first event's results button
    const resultsBtn = page.locator(
      'button:has-text("Резултати"), button:has-text("Results"), a:has-text("Резултати")'
    ).first();

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

    const qrBtn = page.locator(
      'button:has-text("QR"), button[title*="QR"], button[aria-label*="QR"]'
    ).first();

    await expect(qrBtn).toBeVisible({ timeout: 8000 });
  });

  test('H-11: Presenter shows participant count', async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/event/${EVENT_CODE}/present`);
    await page.waitForTimeout(2000);

    // Participant counter should be visible
    const counter = page.locator(
      '[data-testid="participant-count"], .participant-count, text=/\\d+ учесник/i'
    ).first();

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
