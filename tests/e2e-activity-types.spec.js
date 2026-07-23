/**
 * Activity Types — Live End-to-End Tests
 *
 * Вистински create → vote → Presenter резултати за преостанатите 6 типа
 * активности (wordcloud, open, rating, scale, ranking, survey), низ 3 одделни
 * browser контексти (host / учесник / презентер).
 *
 * Ова е безбедносната мрежа за refactor-от на Presenter.jsx — го покрива
 * renderResults() патот за секој тип активност (претходно непрекриен).
 *
 * Requires: SMOKE_TEST_EMAIL + SMOKE_TEST_PASSWORD
 * Run:  BASE_URL=http://localhost:5174 npx playwright test e2e-activity-types
 */
import { test, expect } from '@playwright/test';

const BASE     = process.env.BASE_URL || 'http://localhost:5174';
const EMAIL    = process.env.SMOKE_TEST_EMAIL || '';
const PASSWORD = process.env.SMOKE_TEST_PASSWORD || '';

test.setTimeout(120_000);
test.describe.configure({ mode: 'serial' });
test.skip(!EMAIL || !PASSWORD, 'Credentials not set');

// ── Helpers ────────────────────────────────────────────────────────────────

async function hostSignIn(page) {
  await page.addInitScript(() => localStorage.setItem('onboarding_v1_done', 'true'));
  await page.goto(BASE + '/?login=1');
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.locator('text=Одјави').first().waitFor({ timeout: 30_000 });
}

async function createFreshEvent(page) {
  await page.evaluate(() => localStorage.removeItem('active_event_code'));
  await page.goto(BASE + '/host');
  const subtitle = page.locator('p:has-text("Управувајте со")');
  await subtitle.waitFor({ timeout: 30_000 });
  let code = '';
  await expect.poll(async () => {
    const text = (await subtitle.textContent()) || '';
    const m = text.match(/[0-9A-Z]{6}/);
    code = m ? m[0] : '';
    return code;
  }, { timeout: 30_000 }).not.toBe('');
  return code;
}

const TYPE_CARD = {
  wordcloud: /Облак со зборови/,
  open:      /Отворен текст/,
  rating:    /Оценување/,
  ranking:   /Рангирање/,
  scale:     /Скала 1/,
  survey:    /Анкетен формулар/,
};

// Создава активност од даден тип преку „Додај активност“ → InteractionTypeGrid → CreatePollModal.
async function createActivity(page, { type, question, options = [], surveyQuestion = '' }) {
  await page.getByRole('button', { name: 'Додај активност' }).click();
  await page.getByRole('button', { name: TYPE_CARD[type] }).first().click();

  await page.locator('textarea[placeholder^="Што сакате"]').first().fill(question);

  if (type === 'ranking') {
    for (let i = 0; i < options.length; i++) {
      if (i >= 2) await page.getByRole('button', { name: 'Додај уште една опција' }).click();
      await page.locator(`input[placeholder="Опција ${i + 1}"]`).fill(options[i]);
    }
  }
  if (type === 'survey') {
    await page.locator('input[placeholder="Текст на прашањето..."]').first().fill(surveyQuestion);
  }

  await page.getByRole('button', { name: 'Зачувај активност' }).click();
  await page.locator('p', { hasText: question }).first().waitFor({ timeout: 20_000 });
}

async function activatePoll(page, question) {
  await page.locator('p', { hasText: question }).first().click();
  await page.getByText('АКТИВНА').first().waitFor({ timeout: 15_000 });
}

async function joinEvent(page, code, name) {
  await page.goto(`${BASE}/event/${code}`);
  const nameInput = page.locator('input[placeholder="Твоето име..."]');
  await nameInput.waitFor({ timeout: 30_000 });
  await nameInput.fill(name);
  await page.getByRole('button', { name: /Започни/ }).click();
}

// Отвора Presenter во нов контекст и чека да се прикаже активното прашање.
async function openPresenter(browser, code, question) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/event/${code}/present`);
  await expect(page.locator('body')).toContainText(question, { timeout: 30_000 });
  return { ctx, page };
}

// ── WORD CLOUD ─────────────────────────────────────────────────────────────

// NOTE: wordcloud/open text-vote одат преку /api/vote-text (Vercel serverless),
// кој НЕ постои во Vite dev. Затоа овие два теста ја проверуваат креацијата +
// participant input-от + Presenter рендирањето (refactor safety за renderResults),
// а не самиот text-vote (тој работи на продукција).
test('AT-WC: Word Cloud — создава, учесник гледа input, Presenter рендерира без грешка', async ({ browser }) => {
  const host = await browser.newContext();
  const hostPage = await host.newPage();
  await hostSignIn(hostPage);
  const code = await createFreshEvent(hostPage);

  const question = 'Кажи еден збор за тест';
  await createActivity(hostPage, { type: 'wordcloud', question });
  await activatePoll(hostPage, question);

  const partCtx = await browser.newContext();
  const partPage = await partCtx.newPage();
  await joinEvent(partPage, code, 'Тест Збор');
  await expect(partPage.locator('#poll-question')).toContainText(question, { timeout: 30_000 });
  await expect(partPage.locator('input[placeholder="Внесете збор..."]')).toBeVisible({ timeout: 15_000 });

  const { ctx: presCtx, page: presPage } = await openPresenter(browser, code, question);
  await expect(presPage.locator('body')).toContainText('Чекаме одговори', { timeout: 30_000 });
  await expect(presPage.locator('body')).not.toContainText('TypeError');

  await host.close(); await partCtx.close(); await presCtx.close();
});

// ── OPEN TEXT ──────────────────────────────────────────────────────────────

test('AT-OPEN: Open Text — создава, учесник гледа input, Presenter рендерира без грешка', async ({ browser }) => {
  const host = await browser.newContext();
  const hostPage = await host.newPage();
  await hostSignIn(hostPage);
  const code = await createFreshEvent(hostPage);

  const question = 'Кажи го твоето мислење';
  await createActivity(hostPage, { type: 'open', question });
  await activatePoll(hostPage, question);

  const partCtx = await browser.newContext();
  const partPage = await partCtx.newPage();
  await joinEvent(partPage, code, 'Тест Текст');
  await expect(partPage.locator('#poll-question')).toContainText(question, { timeout: 30_000 });
  await expect(partPage.locator('input[placeholder="Вашиот одговор..."]')).toBeVisible({ timeout: 15_000 });

  const { ctx: presCtx, page: presPage } = await openPresenter(browser, code, question);
  await expect(presPage.locator('body')).toContainText(/нема одговори|Отворени одговори/, { timeout: 30_000 });
  await expect(presPage.locator('body')).not.toContainText('TypeError');

  await host.close(); await partCtx.close(); await presCtx.close();
});

// ── RATING ─────────────────────────────────────────────────────────────────

test('AT-RATE: Rating — создава, учесник оценува, Presenter прикажува просек', async ({ browser }) => {
  const host = await browser.newContext();
  const hostPage = await host.newPage();
  await hostSignIn(hostPage);
  const code = await createFreshEvent(hostPage);

  const question = 'Оцени го тестот';
  await createActivity(hostPage, { type: 'rating', question });
  await activatePoll(hostPage, question);

  const partCtx = await browser.newContext();
  const partPage = await partCtx.newPage();
  await joinEvent(partPage, code, 'Тест Оценка');
  await expect(partPage.locator('#poll-question')).toContainText(question, { timeout: 30_000 });
  await partPage.locator('button:has(svg.lucide-star)').nth(4).click(); // 5 ѕвезди

  const { ctx: presCtx, page: presPage } = await openPresenter(browser, code, question);
  await expect(presPage.locator('body')).toContainText(/Просечна оцена|Просек/, { timeout: 30_000 });
  await expect(presPage.locator('body')).not.toContainText('TypeError');

  await host.close(); await partCtx.close(); await presCtx.close();
});

// ── SCALE ──────────────────────────────────────────────────────────────────

test('AT-SCALE: Scale 1–10 — создава, учесник избира, Presenter прикажува просек', async ({ browser }) => {
  const host = await browser.newContext();
  const hostPage = await host.newPage();
  await hostSignIn(hostPage);
  const code = await createFreshEvent(hostPage);

  const question = 'Колку се согласуваш?';
  await createActivity(hostPage, { type: 'scale', question });
  await activatePoll(hostPage, question);

  const partCtx = await browser.newContext();
  const partPage = await partCtx.newPage();
  await joinEvent(partPage, code, 'Тест Скала');
  await expect(partPage.locator('#poll-question')).toContainText(question, { timeout: 30_000 });
  await partPage.getByRole('button', { name: '5', exact: true }).click();

  const { ctx: presCtx, page: presPage } = await openPresenter(browser, code, question);
  await expect(presPage.locator('body')).toContainText('Просек', { timeout: 30_000 });
  await expect(presPage.locator('body')).not.toContainText('TypeError');

  await host.close(); await partCtx.close(); await presCtx.close();
});

// ── RANKING ────────────────────────────────────────────────────────────────

test('AT-RANK: Ranking — создава, учесник рангира, Presenter прикажува резултати', async ({ browser }) => {
  const host = await browser.newContext();
  const hostPage = await host.newPage();
  await hostSignIn(hostPage);
  const code = await createFreshEvent(hostPage);

  const question = 'Подреди ги според важност';
  await createActivity(hostPage, { type: 'ranking', question, options: ['Прво', 'Второ', 'Трето'] });
  await activatePoll(hostPage, question);

  const partCtx = await browser.newContext();
  const partPage = await partCtx.newPage();
  await joinEvent(partPage, code, 'Тест Ранг');
  await expect(partPage.locator('#poll-question')).toContainText(question, { timeout: 30_000 });
  await partPage.getByRole('button', { name: 'Испрати рангирање' }).click();

  const { ctx: presCtx, page: presPage } = await openPresenter(browser, code, question);
  // Рангирањето ги прикажува опциите во резултатите
  await expect(presPage.locator('body')).toContainText(/Прво|Второ|Трето/, { timeout: 30_000 });
  await expect(presPage.locator('body')).not.toContainText('TypeError');

  await host.close(); await partCtx.close(); await presCtx.close();
});

// ── SURVEY ─────────────────────────────────────────────────────────────────

test('AT-SURVEY: Survey — создава, учесник одговара, Presenter прикажува број на одговори', async ({ browser }) => {
  const host = await browser.newContext();
  const hostPage = await host.newPage();
  await hostSignIn(hostPage);
  const code = await createFreshEvent(hostPage);

  const question = 'Анкетен формулар тест';
  await createActivity(hostPage, { type: 'survey', question, surveyQuestion: 'Како се чувствуваш?' });
  await activatePoll(hostPage, question);

  const partCtx = await browser.newContext();
  const partPage = await partCtx.newPage();
  await joinEvent(partPage, code, 'Тест Анкета');
  await expect(partPage.locator('#poll-question')).toContainText(question, { timeout: 30_000 });
  await partPage.locator('input[placeholder="Вашиот одговор..."]').first().fill('Добро');
  await partPage.getByRole('button', { name: 'Испрати одговори' }).click();

  const { ctx: presCtx, page: presPage } = await openPresenter(browser, code, question);
  await expect(presPage.locator('body')).toContainText(/одговор/, { timeout: 30_000 });
  await expect(presPage.locator('body')).not.toContainText('TypeError');

  await host.close(); await partCtx.close(); await presCtx.close();
});
