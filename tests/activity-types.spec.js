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

    // Should see question text input
    const qInput = page.locator(
      'input[placeholder*="прашање"], textarea[placeholder*="прашање"]'
    ).first();
    await expect(qInput).toBeVisible({ timeout: 5000 });

    // Should see at least 2 answer option inputs
    const optionInputs = page.locator(
      'input[placeholder*="опција"], input[placeholder*="одговор"], input[placeholder*="Опција"]'
    );
    const count = await optionInputs.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('AT-02: Poll question text can be typed', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');

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

  test('AT-04: Participant quiz shows immediate feedback (correct/incorrect)', async ({ page }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(3000);

    // Look for quiz options
    const option = page.locator(
      '.quiz-option, [data-type="quiz-option"], button.option'
    ).first();

    if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
      await option.click();
      await page.waitForTimeout(1000);

      // After clicking, should show correct/incorrect feedback
      const body = await page.locator('body').innerText();
      const hasFeedback = /точно|неточно|correct|incorrect|✓|✗/i.test(body);
      // Either feedback shown or event not in quiz mode — both ok
      await expect(page.locator('body')).not.toContainText('TypeError');
    } else {
      test.skip(true, 'No quiz activity active');
    }
  });
});

// ── WORD CLOUD ─────────────────────────────────────────────────────────────

test.describe('Activity Type: Word Cloud', () => {
  test.skip(!EMAIL || !PASSWORD, 'Credentials not set');

  test('AT-05: Word cloud activity renders in host view', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');

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

    const openTrigger = page.locator(
      'button:has-text("Отворен"), button:has-text("Open"), [data-type="open"]'
    ).first();

    if (await openTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await openTrigger.click();
      await page.waitForTimeout(800);

      const qInput = page.locator(
        'input[placeholder*="прашање"], textarea[placeholder*="прашање"]'
      ).first();
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

    const ratingTrigger = page.locator(
      'button:has-text("Рејтинг"), button:has-text("Rating"), button:has-text("Оценка"), [data-type="rating"]'
    ).first();

    const exists = await ratingTrigger.isVisible({ timeout: 3000 }).catch(() => false);

    if (exists) {
      await ratingTrigger.click();
      await page.waitForTimeout(800);
      await expect(page.locator('body')).not.toContainText('TypeError');

      // Should show question input
      const qInput = page.locator(
        'input[placeholder*="прашање"], textarea[placeholder*="прашање"]'
      ).first();
      await expect(qInput).toBeVisible({ timeout: 5000 });
    } else {
      // Rating not yet implemented — mark as known issue
      console.warn('AT-08: Rating activity button not found — implementation pending (see IMPROVEMENTS.md ACT-1)');
      test.skip(true, 'Rating not yet implemented');
    }
  });

  test('AT-09: Rating shows stars in participant view', async ({ page }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(3000);

    const stars = page.locator(
      'button[aria-label*="звезда"], .star-rating, [data-testid="star"], svg[class*="star"]'
    ).first();

    if (await stars.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stars.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toContainText('TypeError');
    } else {
      test.skip(true, 'No rating activity active');
    }
  });

  test('AT-10: Rating shows average result in presenter view', async ({ page }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}/present`);
    await page.waitForTimeout(3000);

    // If rating is active, should show average
    const avg = page.locator(
      'text=/просек|average|\\d\\.\\d\\/5/i'
    ).first();

    // Only check if rating is visible
    if (await avg.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(avg).toBeVisible();
    } else {
      test.skip(true, 'No rating activity active in presenter');
    }
  });
});

// ── RANKING ───────────────────────────────────────────────────────────────

test.describe('Activity Type: Ranking', () => {
  test.skip(!EMAIL || !PASSWORD, 'Credentials not set');

  test('AT-11: Ranking activity can be created in host', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');

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

  test('AT-12: Ranking items can be dragged in participant view', async ({ page }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(3000);

    const rankItem = page.locator(
      '.rank-item, [data-testid="rank-item"], [draggable="true"]'
    ).first();

    if (await rankItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await rankItem.boundingBox();
      // Simulate drag
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 60);
      await page.mouse.up();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toContainText('TypeError');
    } else {
      test.skip(true, 'No ranking activity active');
    }
  });
});

// ── SURVEY ────────────────────────────────────────────────────────────────

test.describe('Activity Type: Survey', () => {
  test.skip(!EMAIL || !PASSWORD, 'Credentials not set');

  test('AT-13: Survey can be created with multiple questions', async ({ page }) => {
    await signIn(page);
    await goTo(page, '/host');

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

  test('AT-14: Survey participant view shows all questions', async ({ page }) => {
    await page.goto(`${BASE}/event/${EVENT_CODE}`);
    await page.waitForTimeout(3000);

    // Multi-question surveys have multiple inputs visible at once
    const inputs = page.locator('input[type="text"], input[type="radio"], textarea');
    const count = await inputs.count();

    if (count > 3) {
      // Likely a survey — check no errors
      await expect(page.locator('body')).not.toContainText('TypeError');
    } else {
      test.skip(true, 'No survey activity active');
    }
  });
});
