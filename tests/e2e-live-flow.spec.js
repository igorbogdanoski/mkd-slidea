/**
 * Live End-to-End Flow — E2E Tests
 *
 * Вистински create → vote → Presenter резултати низ три одделни browser
 * контексти (host / учесник / презентер), плус Remote control: далечинскиот
 * режим на host-от треба во живо да ја движи Presenter сцената на друг уред.
 *
 * Ова ја покрива празнината од SESSION_PLAN_NEXT.md — претходно беше направен
 * само код-преглед, не и вистинско кликање низ реален настан.
 *
 * Requires: SMOKE_TEST_EMAIL + SMOKE_TEST_PASSWORD
 * Run against local dev:  BASE_URL=http://localhost:5174 npx playwright test e2e-live-flow
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
  // „Одјави“ се појавува само кога сесијата е активна
  await page.locator('text=Одјави').first().waitFor({ timeout: 30_000 });
}

// Одење на /host без active_event_code → useHostSession креира свеж настан.
// Го враќа 6-знаковниот код прикажан во HostHeader („Управувајте со XXXXXX“).
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

// „Додај активност“ → InteractionTypeGrid → CreatePollModal/CreateQuizModal → зачувува.
async function addActivity(page, { kind, question, options }) {
  await page.getByRole('button', { name: 'Додај активност' }).click();

  const cardName = kind === 'quiz' ? /Квиз \(Натпревар\)/ : /Анкета \(Повеќе избор\)/;
  await page.getByRole('button', { name: cardName }).first().click();

  const qPlaceholder = kind === 'quiz' ? 'textarea[placeholder^="Пр."]' : 'textarea[placeholder^="Што сакате"]';
  await page.locator(qPlaceholder).first().fill(question);

  for (let i = 0; i < options.length; i++) {
    if (i >= 2) {
      const addBtn = kind === 'quiz' ? 'Додај опција' : 'Додај уште една опција';
      await page.getByRole('button', { name: addBtn }).click();
    }
    await page.locator(`input[placeholder="Опција ${i + 1}"]`).fill(options[i]);
  }

  const saveLabel = kind === 'quiz' ? 'Зачувај квиз' : 'Зачувај активност';
  await page.getByRole('button', { name: saveLabel }).click();

  // Полот се појавува во листата на host-от откако ќе се зачува
  await page.locator('p', { hasText: question }).first().waitFor({ timeout: 20_000 });
}

// Клик на PollCard-от на прашањето → setActivePoll → „АКТИВНА“ бејџ.
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

// ── E2E-01: POLL ───────────────────────────────────────────────────────────

test('E2E-01: Poll — host создава, учесник гласа, Presenter прикажува резултати', async ({ browser }) => {
  const host = await browser.newContext();
  const hostPage = await host.newPage();
  await hostSignIn(hostPage);
  const code = await createFreshEvent(hostPage);

  const question = 'Кој е твојот омилен предмет?';
  await addActivity(hostPage, { kind: 'poll', question, options: ['Математика', 'Физика'] });
  await activatePoll(hostPage, question);

  // Учесник (втор контекст, јавна страница, без најава)
  const partCtx = await browser.newContext();
  const partPage = await partCtx.newPage();
  await joinEvent(partPage, code, 'Тест Учесник');
  await expect(partPage.locator('#poll-question')).toContainText(question, { timeout: 30_000 });
  await partPage.getByRole('radio', { name: 'Математика' }).click();
  await expect(partPage.locator('body')).toContainText(/Ви благодариме|Точно|Прифатено/i, { timeout: 20_000 });

  // Presenter (трет контекст) — треба да го види прашањето и резултатите
  const presCtx = await browser.newContext();
  const presPage = await presCtx.newPage();
  await presPage.goto(`${BASE}/event/${code}/present`);
  await expect(presPage.locator('body')).toContainText(question, { timeout: 30_000 });
  // 1 глас на „Математика“ → 100% / „Вкупно“ / „одговориле“ (не „Чекаме гласови...“)
  await expect(presPage.locator('body')).toContainText(/100%|одговориле|Вкупно/, { timeout: 30_000 });

  await host.close();
  await partCtx.close();
  await presCtx.close();
});

// ── E2E-02: QUIZ ───────────────────────────────────────────────────────────

test('E2E-02: Quiz — host создава, учесник одговара со фидбек, Presenter има табела', async ({ browser }) => {
  const host = await browser.newContext();
  const hostPage = await host.newPage();
  await hostSignIn(hostPage);
  const code = await createFreshEvent(hostPage);

  const question = 'Колку е 2 + 2?';
  await addActivity(hostPage, { kind: 'quiz', question, options: ['4', '5'] });
  await activatePoll(hostPage, question);

  const partCtx = await browser.newContext();
  const partPage = await partCtx.newPage();
  await joinEvent(partPage, code, 'Тест Квиз');
  await expect(partPage.locator('#poll-question')).toContainText(question, { timeout: 30_000 });
  await partPage.getByRole('radio', { name: '4' }).click();
  // Квизот дава моментален фидбек (точно/неточно)
  await expect(partPage.locator('body')).toContainText(/Точно|Не\s*точно/i, { timeout: 20_000 });

  const presCtx = await browser.newContext();
  const presPage = await presCtx.newPage();
  await presPage.goto(`${BASE}/event/${code}/present`);
  await expect(presPage.locator('body')).toContainText(question, { timeout: 30_000 });
  await expect(presPage.locator('body')).toContainText(/Табела на лидери|pts|гласови|Вкупно/, { timeout: 30_000 });

  await host.close();
  await partCtx.close();
  await presCtx.close();
});

// ── E2E-03: REMOTE CONTROL ─────────────────────────────────────────────────

test('E2E-03: Remote control — „Далечинска“ next ја движи Presenter сцената во живо', async ({ browser }) => {
  const host = await browser.newContext();
  const hostPage = await host.newPage();
  await hostSignIn(hostPage);
  const code = await createFreshEvent(hostPage);

  const qA = 'Прво прашање за remote тест';
  const qB = 'Второ прашање за remote тест';
  await addActivity(hostPage, { kind: 'poll', question: qA, options: ['Да', 'Не'] });
  await addActivity(hostPage, { kind: 'poll', question: qB, options: ['Да', 'Не'] });
  await activatePoll(hostPage, qA);

  // Presenter на „друг уред“ — ја гледа активната (прва) активност
  const presCtx = await browser.newContext();
  const presPage = await presCtx.newPage();
  await presPage.goto(`${BASE}/event/${code}/present`);
  await expect(presPage.locator('body')).toContainText(qA, { timeout: 30_000 });

  // Вклучи далечински режим на host-от
  await hostPage.getByRole('button', { name: /Далечинска/ }).click();
  const remote = hostPage.locator('div.fixed.inset-0', { hasText: 'Далечинска Контрола' }).first();
  await expect(remote).toBeVisible({ timeout: 15_000 });

  // Следна (chevron-right) → setActivePoll(1) → broadcast active-poll
  await remote.locator('button:has(svg.lucide-chevron-right)').click();

  // Presenter треба во живо да се префрли на второто прашање
  await expect(presPage.locator('body')).toContainText(qB, { timeout: 30_000 });

  await host.close();
  await presCtx.close();
});
