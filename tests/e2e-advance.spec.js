/**
 * Does a participant follow the host to the NEXT activity?
 *
 * Written after event TQ6U57 ("ВИ во наставата по биологија", 24.08.2026):
 * 26 colleagues answered the first activity and every activity after it
 * recorded zero. Nothing in the suite covered the moment that matters in a
 * real session — the host activating a second activity while participants are
 * already sitting on the first one, most of them on the "thank you" screen.
 *
 * The path under test is useEvent.js: a realtime `postgres_changes` on
 * events.active_poll_id, with a 3-second REST poll as the safety net.
 *
 * Requires: SMOKE_TEST_EMAIL + SMOKE_TEST_PASSWORD
 * Against production:  BASE_URL=https://slidea.mismath.net npx playwright test e2e-advance
 */
import { test, expect } from '@playwright/test';

const BASE     = process.env.BASE_URL || 'http://localhost:5173';
const EMAIL    = process.env.SMOKE_TEST_EMAIL || '';
const PASSWORD = process.env.SMOKE_TEST_PASSWORD || '';

test.setTimeout(180_000);
test.describe.configure({ mode: 'serial' });
test.skip(!EMAIL || !PASSWORD, 'Credentials not set');

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

async function addPoll(page, { question, options }) {
  await page.getByRole('button', { name: 'Додај активност' }).click();
  await page.getByRole('button', { name: /Анкета \(Повеќе избор\)/ }).first().click();
  await page.locator('textarea[placeholder^="Што сакате"]').first().fill(question);
  for (let i = 0; i < options.length; i++) {
    if (i >= 2) await page.getByRole('button', { name: 'Додај уште една опција' }).click();
    await page.locator(`input[placeholder="Опција ${i + 1}"]`).fill(options[i]);
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

test('ADV-01: a participant who already answered follows the host to the next activity', async ({ browser }) => {
  const host = await browser.newContext();
  const hostPage = await host.newPage();
  await hostSignIn(hostPage);
  const code = await createFreshEvent(hostPage);

  const qA = 'Каде работите?';
  const qB = 'Што предавате?';
  await addPoll(hostPage, { question: qA, options: ['Во основно', 'Во средно'] });
  await addPoll(hostPage, { question: qB, options: ['Биологија', 'Хемија'] });
  await activatePoll(hostPage, qA);

  const partCtx = await browser.newContext();
  const partPage = await partCtx.newPage();
  await joinEvent(partPage, code, 'Колега 1');
  await expect(partPage.locator('#poll-question')).toContainText(qA, { timeout: 30_000 });

  // Answer the first one — this is the state 26 people were in on 24.08.
  await partPage.getByRole('button', { name: 'Во средно' }).first().click();
  await expect(partPage.locator('body')).toContainText(/Ви благодариме|Прифатено|Точно/i, { timeout: 20_000 });

  // Host moves on. Realtime should carry it; the 3s REST poll is the net.
  await activatePoll(hostPage, qB);

  // The whole question: does the participant leave the thank-you screen?
  await expect(partPage.locator('#poll-question')).toContainText(qB, { timeout: 30_000 });

  // …and can they actually answer the new one? A screen that advances but
  // still counts the session as "already voted" would look fine and record
  // nothing — which is exactly what the event data showed.
  await partPage.getByRole('button', { name: 'Биологија' }).first().click();
  await expect(partPage.locator('body')).toContainText(/Ви благодариме|Прифатено|Точно/i, { timeout: 20_000 });

  // Presenter must show the second question with a real tally, not "Чекаме".
  const presCtx = await browser.newContext();
  const presPage = await presCtx.newPage();
  await presPage.goto(`${BASE}/event/${code}/present`);
  await expect(presPage.locator('body')).toContainText(qB, { timeout: 30_000 });
  await expect(presPage.locator('body')).toContainText(/100%|одговориле|Вкупно/, { timeout: 30_000 });

  await host.close();
  await partCtx.close();
  await presCtx.close();
});
