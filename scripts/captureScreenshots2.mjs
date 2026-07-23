// Follow-up: ги снима екраните што паднаа во првиот pass (dashboard табови,
// participant, presenter со гласови, remote control) — со force кликови.
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || 'http://localhost:5174';
const EMAIL = process.env.SMOKE_TEST_EMAIL || '';
const PASSWORD = process.env.SMOKE_TEST_PASSWORD || '';
const IMG = path.join(ROOT, 'docs', 'user-manual', 'images');

const browser = await chromium.launch();
const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

async function shot(page, name, opts = {}) {
  try { await page.screenshot({ path: path.join(IMG, name), ...opts }); console.log('  📸 ' + name); }
  catch (e) { console.log('  ⚠️ FAIL ' + name + ': ' + e.message.slice(0, 80)); }
}
async function section(label, fn) {
  console.log('\n▸ ' + label);
  try { await fn(); } catch (e) { console.log('  ⚠️ ' + e.message.slice(0, 140)); }
}

const host = await browser.newContext({ viewport: DESKTOP });
const hp = await host.newPage();
await hp.addInitScript(() => {
  localStorage.setItem('onboarding_v1_done', 'true');
  localStorage.setItem('mkd_checklist_dismissed_until', String(Date.now() + 86400000 * 365));
});

await section('Login', async () => {
  await hp.goto(BASE + '/?login=1', { waitUntil: 'networkidle' });
  await hp.locator('input[type="email"]').first().fill(EMAIL);
  await hp.locator('input[type="password"]').first().fill(PASSWORD);
  await hp.locator('button[type="submit"]').first().click();
  await hp.locator('text=Одјави').first().waitFor({ timeout: 30000 });
  await hp.waitForTimeout(1200);
});

await section('Dashboard tabs', async () => {
  await hp.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
  await hp.waitForTimeout(2500);
  await hp.keyboard.press('Escape');
  await hp.waitForTimeout(400);
  const tabs = [
    ['presentations', '09-dashboard-presentations.png'],
    ['analytics', '10-dashboard-analytics.png'],
    ['semantic', '11-dashboard-ai-search.png'],
    ['templates', '12-dashboard-templates.png'],
    ['organizations', '12b-dashboard-organizations.png'],
    ['profile', '12c-dashboard-profile.png'],
  ];
  for (const [id, file] of tabs) {
    const btn = hp.locator(`[data-tour="sidebar-${id}"]`);
    if (await btn.count()) {
      await btn.first().scrollIntoViewIfNeeded().catch(() => {});
      await btn.first().click({ force: true });
      await hp.waitForTimeout(1600);
      await shot(hp, file);
    } else console.log('  (нема таб: ' + id + ')');
  }
});

let eventCode = '';
await section('Host + participant + presenter', async () => {
  await hp.evaluate(() => localStorage.removeItem('active_event_code'));
  await hp.goto(BASE + '/host', { waitUntil: 'networkidle' });
  const subtitle = hp.locator('p:has-text("Управувајте со")');
  await subtitle.waitFor({ timeout: 30000 });
  eventCode = (((await subtitle.textContent()) || '').match(/[0-9A-Z]{6}/) || [])[0] || '';
  console.log('  event: ' + eventCode);

  await hp.getByRole('button', { name: 'Додај активност' }).click();
  await hp.waitForTimeout(700);
  await hp.getByRole('button', { name: /Анкета \(Повеќе избор\)/ }).first().click();
  await hp.waitForTimeout(700);
  await hp.locator('textarea[placeholder^="Што сакате"]').first().fill('Кој е твојот омилен предмет?');
  await hp.locator('input[placeholder="Опција 1"]').fill('Математика');
  await hp.locator('input[placeholder="Опција 2"]').fill('Физика');
  await hp.getByRole('button', { name: 'Зачувај активност' }).click();
  await hp.waitForTimeout(1600);

  await hp.locator('p', { hasText: 'Кој е твојот омилен предмет?' }).first().click({ force: true });
  await hp.waitForTimeout(1500);

  const pctx = await browser.newContext({ viewport: PHONE });
  const pp = await pctx.newPage();
  await pp.goto(`${BASE}/event/${eventCode}`, { waitUntil: 'networkidle' });
  const nameInput = pp.locator('input[placeholder="Твоето име..."]');
  await nameInput.waitFor({ timeout: 30000 });
  await shot(pp, '18-participant-join.png');
  await nameInput.fill('Ана Петрова');
  await pp.getByRole('button', { name: /Започни/ }).click();
  await pp.locator('#poll-question').waitFor({ timeout: 30000 });
  await pp.waitForTimeout(1200);
  await shot(pp, '19-participant-poll.png');
  await pp.getByRole('radio', { name: 'Математика' }).click();
  await pp.waitForTimeout(1800);
  await shot(pp, '20-participant-voted.png');
  await pctx.close();

  const prctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const pr = await prctx.newPage();
  await pr.goto(`${BASE}/event/${eventCode}/present`, { waitUntil: 'networkidle' });
  await pr.waitForTimeout(3000);
  await shot(pr, '21-presenter-results.png');
  await prctx.close();
});

await section('Remote control', async () => {
  await hp.setViewportSize(PHONE);
  await hp.waitForTimeout(600);
  await hp.getByRole('button', { name: /Далечинска/ }).first().click({ force: true });
  await hp.waitForTimeout(1300);
  await shot(hp, '22-remote-control.png');
  await hp.setViewportSize(DESKTOP);
});

await browser.close();
console.log('\n✅ Follow-up готово.');
