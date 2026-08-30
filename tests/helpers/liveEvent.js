/**
 * Builds a real event with one active activity, so a participant-side test can
 * assert against something that is actually on screen.
 *
 * Written because five tests were pointed at the permanent event B5V338 and
 * skipped themselves — "No active poll options", "No word cloud activity
 * active" — whenever it was not sitting on the type they needed. Only one
 * activity can be active at a time, so they could never all run, and a skip
 * reported as success. These build their own event instead, and never touch
 * anyone's real one.
 */
import { expect } from '@playwright/test';

const TYPE_CARD = {
  poll:      /Анкета \(Повеќе избор\)/,
  wordcloud: /Облак со зборови/,
  open:      /Отворен текст/,
  rating:    /Оценување/,
  ranking:   /Рангирање/,
  scale:     /Скала 1/,
  survey:    /Анкетен формулар/,
};

export async function hostSignIn(page, base, email, password) {
  await page.addInitScript(() => localStorage.setItem('onboarding_v1_done', 'true'));
  await page.goto(`${base}/?login=1`);
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.locator('text=Одјави').first().waitFor({ state: 'attached', timeout: 30_000 });
}

// /host with no active_event_code creates an event owned by the signed-in user.
export async function createFreshEvent(page, base) {
  await page.evaluate(() => localStorage.removeItem('active_event_code'));
  await page.goto(`${base}/host`);
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

export async function createActivity(page, { type, question, options = [] }) {
  await page.getByRole('button', { name: 'Додај активност' }).click();
  await page.getByRole('button', { name: TYPE_CARD[type] }).first().click();
  await page.locator('textarea[placeholder^="Што сакате"]').first().fill(question);
  for (let i = 0; i < options.length; i++) {
    if (i >= 2) await page.getByRole('button', { name: 'Додај уште една опција' }).click();
    await page.locator(`input[placeholder="Опција ${i + 1}"]`).fill(options[i]);
  }
  await page.getByRole('button', { name: 'Зачувај активност' }).click();
  await page.locator('p', { hasText: question }).first().waitFor({ timeout: 20_000 });
}

export async function activateActivity(page, question) {
  await page.locator('p', { hasText: question }).first().click();
  await page.getByText('АКТИВНА').first().waitFor({ timeout: 15_000 });
}

/**
 * One call: sign in, make an event, add an activity of `type`, activate it.
 * Returns the join code. The host context is the caller's to close.
 */
export async function liveEventWith(browser, { base, email, password, type, question, options = [] }) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await ctx.newPage();
  await hostSignIn(page, base, email, password);
  const code = await createFreshEvent(page, base);
  await createActivity(page, { type, question, options });
  await activateActivity(page, question);
  return { code, hostCtx: ctx };
}

export async function joinEvent(page, base, code, name) {
  await page.goto(`${base}/event/${code}`);
  const nameInput = page.locator('input[placeholder="Твоето име..."]');
  await nameInput.waitFor({ timeout: 30_000 });
  await nameInput.fill(name);
  await page.getByRole('button', { name: /Започни/ }).click();
}
