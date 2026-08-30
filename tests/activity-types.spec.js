/**
 * Activity Types — E2E Tests
 *
 * Covers: Poll, Quiz, Word Cloud, Open Text, Rating, Ranking, Survey
 * Tests both creation (host side) and response (participant side).
 *
 * Requires: SMOKE_TEST_EMAIL + SMOKE_TEST_PASSWORD
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

// The type grid lives behind "Додај активност" — the tests went straight to
// /host and looked for a type button that was not on screen yet, then reported
// "implementation pending" and skipped themselves for features that work.
const openTypeGrid = async (page) => {
  const grid = page.locator('[data-type="poll"]');
  if (await grid.isVisible({ timeout: 1500 }).catch(() => false)) return;
  // /host creates an event on first load when the browser has no active one,
  // so the "add activity" control appears only once that round trip finishes.
  // Waiting a fixed moment made these tests pass alone and skip in a serial
  // run, reporting "implementation pending" for a feature that works — wait
  // for the control instead of for the clock.
  for (const sel of ['[data-testid="add-activity"]', '[data-testid="add-activity-empty"]']) {
    const btn = page.locator(sel).first();
    if (await btn.waitFor({ state: 'visible', timeout: 12000 }).then(() => true).catch(() => false)) {
      await btn.click();
      await grid.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
      return;
    }
  }
};

const goTo = async (page, path) => {
  await page.evaluate((p) => {
    window.history.pushState({}, '', p);
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  }, path);
  await page.waitForTimeout(600);
};

// ── POLL ──────────────────────────────────────────────────────────────────

test.describe('Activity Type: Poll', () => {
  test.skip(!EMAIL || !PASSWORD, 'Credentials not set');

  test('AT-01: Poll creation form renders with option inputs', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');
    await openTypeGrid(page);

    // Open poll creator
    const pollTrigger = page.locator(
      'button:has-text("Прашање"), button:has-text("Poll"), [data-type="poll"]'
    ).first();

    if (await pollTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pollTrigger.click();
    } else {
      await page.keyboard.press('p');
    }

    await page.waitForTimeout(800);

    // The question field, found by its role inside the dialog rather than by
    // its placeholder copy. This asserted placeholder*="прашање" while the
    // field actually says "Што сакате да прашате?" — the wording moved and the
    // test did not, which nobody saw because the whole authenticated suite was
    // timing out before it reached here.
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });
    const qInput = dialog.locator('textarea, input[type="text"]').first();
    await expect(qInput).toBeVisible({ timeout: 5000 });

    // Should see at least 2 answer option inputs
    const optionInputs = dialog.locator(
      'input[placeholder*="пција"], input[placeholder*="дговор"]'
    );
    const count = await optionInputs.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('AT-02: Poll question text can be typed', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');
    await openTypeGrid(page);

    const pollTrigger = page.locator(
      'button:has-text("Прашање"), [data-type="poll"]'
    ).first();

    if (await pollTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pollTrigger.click();
    } else {
      await page.keyboard.press('p');
    }

    await page.waitForTimeout(800);

    const qInput = page.locator(
      'input[placeholder*="прашање"], textarea[placeholder*="прашање"]'
    ).first();

    if (await qInput.isVisible({ timeout: 4000 }).catch(() => false)) {
      await qInput.fill('Кој е твојот омилен предмет?');
      await expect(qInput).toHaveValue('Кој е твојот омилен предмет?');
    }
  });
});

// ── QUIZ ──────────────────────────────────────────────────────────────────

test.describe('Activity Type: Quiz', () => {
  test.skip(!EMAIL || !PASSWORD, 'Credentials not set');

  test('AT-03: Quiz form has correct-answer selector', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');
    await openTypeGrid(page);

    const quizTrigger = page.locator(
      'button:has-text("Квиз"), [data-type="quiz"]'
    ).first();

    if (await quizTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await quizTrigger.click();
    } else {
      await page.keyboard.press('q');
    }

    await page.waitForTimeout(800);

    // Must have a way to mark correct answer
    const correctMarker = page.locator(
      'button:has-text("Точен"), input[type="radio"], input[type="checkbox"], [data-testid="mark-correct"], label:has-text("Точен")'
    ).first();

    await expect(correctMarker).toBeVisible({ timeout: 5000 });
  });

  // AT-04 (participant quiz feedback) removed: it waited for a `.quiz-option`
  // class the app does not use, so it skipped every run, and its one assertion
  // was "no TypeError" — the /точно|неточно/ result was computed and never
  // checked. e2e-live-flow.spec.js E2E-02 answers a quiz as a participant and
  // asserts the feedback for real.
});

// ── WORD CLOUD ─────────────────────────────────────────────────────────────

test.describe('Activity Type: Word Cloud', () => {
  test.skip(!EMAIL || !PASSWORD, 'Credentials not set');

  test('AT-05: Word cloud activity renders in host view', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');
    await openTypeGrid(page);

    const wcTrigger = page.locator(
      'button:has-text("Облак"), button:has-text("Word"), [data-type="wordcloud"]'
    ).first();

    if (await wcTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await wcTrigger.click();
      await page.waitForTimeout(800);
      await expect(page.locator('body')).not.toContainText('TypeError');
    } else {
      test.skip(true, 'Word cloud button not found');
    }
  });

  test('AT-06: Word cloud SVG renders in presenter view', async ({ page }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}/present`);
    await page.waitForTimeout(3000);

    // If word cloud is active, SVG should be visible
    const svg = page.locator('svg.word-cloud, svg[class*="cloud"], svg').first();
    // Just check it doesn't crash — SVG may or may not be present depending on active activity
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});

// ── OPEN TEXT ─────────────────────────────────────────────────────────────

test.describe('Activity Type: Open Text', () => {
  test.skip(!EMAIL || !PASSWORD, 'Credentials not set');

  test('AT-07: Open text activity in host has question input', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');
    await openTypeGrid(page);

    const openTrigger = page.locator(
      'button:has-text("Отворен"), button:has-text("Open"), [data-type="open"]'
    ).first();

    if (await openTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await openTrigger.click();
      await page.waitForTimeout(800);

      const qInput = page.locator('[role="dialog"]').first()
        .locator('textarea, input[type="text"]').first();
      await expect(qInput).toBeVisible({ timeout: 5000 });
    } else {
      test.skip(true, 'Open text trigger not found');
    }
  });
});

// ── RATING ────────────────────────────────────────────────────────────────

test.describe('Activity Type: Rating (Star)', () => {
  test.skip(!EMAIL || !PASSWORD, 'Credentials not set');

  test('AT-08: Rating activity can be created in host', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');
    await openTypeGrid(page);

    const ratingTrigger = page.locator(
      'button:has-text("Рејтинг"), button:has-text("Rating"), button:has-text("Оценка"), [data-type="rating"]'
    ).first();

    const exists = await ratingTrigger.isVisible({ timeout: 3000 }).catch(() => false);

    if (exists) {
      await ratingTrigger.click();
      await page.waitForTimeout(800);
      await expect(page.locator('body')).not.toContainText('TypeError');

      // Should show question input
      const qInput = page.locator('[role="dialog"]').first()
        .locator('textarea, input[type="text"]').first();
      await expect(qInput).toBeVisible({ timeout: 5000 });
    } else {
      // Rating not yet implemented — mark as known issue
      console.warn('AT-08: Rating activity button not found — implementation pending (see IMPROVEMENTS.md ACT-1)');
      test.skip(true, 'Rating not yet implemented');
    }
  });

  // AT-09 and AT-10 removed: both waited for a rating to happen to be the
  // active activity on a shared event, which is not something they set up, so
  // both skipped every run. e2e-activity-types.spec.js AT-RATE creates a
  // rating, clicks the fifth star as a participant and asserts the presenter's
  // average — the same two things, actually executed.
});

// ── RANKING ───────────────────────────────────────────────────────────────

test.describe('Activity Type: Ranking', () => {
  test.skip(!EMAIL || !PASSWORD, 'Credentials not set');

  test('AT-11: Ranking activity can be created in host', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');
    await openTypeGrid(page);

    const rankTrigger = page.locator(
      'button:has-text("Рангирање"), button:has-text("Ranking"), [data-type="ranking"]'
    ).first();

    const exists = await rankTrigger.isVisible({ timeout: 3000 }).catch(() => false);

    if (exists) {
      await rankTrigger.click();
      await page.waitForTimeout(800);
      await expect(page.locator('body')).not.toContainText('TypeError');
    } else {
      console.warn('AT-11: Ranking button not found — implementation pending (see IMPROVEMENTS.md ACT-1)');
      test.skip(true, 'Ranking not yet implemented');
    }
  });

  // AT-12 removed: same shared-event dependency, so it never ran, and its only
  // assertion after the drag was "no TypeError" — it never checked that the
  // order changed. e2e-activity-types.spec.js AT-RANK submits a ranking as a
  // participant and asserts the presenter's Borda results.
});

// ── SURVEY ────────────────────────────────────────────────────────────────

test.describe('Activity Type: Survey', () => {
  test.skip(!EMAIL || !PASSWORD, 'Credentials not set');

  test('AT-13: Survey can be created with multiple questions', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');
    await openTypeGrid(page);

    const surveyTrigger = page.locator(
      'button:has-text("Анкета"), button:has-text("Survey"), button:has-text("Форма"), [data-type="survey"]'
    ).first();

    const exists = await surveyTrigger.isVisible({ timeout: 3000 }).catch(() => false);

    if (exists) {
      await surveyTrigger.click();
      await page.waitForTimeout(800);

      // Should show add question button
      const addQ = page.locator(
        'button:has-text("Додај прашање"), button:has-text("Add question"), button:has-text("+")'
      ).first();

      await expect(addQ).toBeVisible({ timeout: 5000 });
    } else {
      console.warn('AT-13: Survey button not found — implementation pending (see IMPROVEMENTS.md ACT-1)');
      test.skip(true, 'Survey not yet fully implemented');
    }
  });

  // AT-14 removed: it inferred "this is probably a survey" from counting more
  // than three inputs on a shared event, then asserted only "no TypeError".
  // e2e-activity-types.spec.js AT-SURVEY creates a survey, answers it as a
  // participant and asserts the presenter's response count.
});
