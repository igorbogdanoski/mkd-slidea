// ============================================================================
// Автоматско снимање на екрани за корисничкото упатство + UI/UX аудит.
// Run: set BASE_URL=http://localhost:5174&& set SMOKE_TEST_EMAIL=...&& set SMOKE_TEST_PASSWORD=...&& node scripts/captureScreenshots.mjs
// Слики → docs/user-manual/images/
// ============================================================================
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
  try {
    await page.screenshot({ path: path.join(IMG, name), ...opts });
    console.log('  📸 ' + name);
  } catch (e) {
    console.log('  ⚠️ FAIL ' + name + ': ' + e.message.slice(0, 80));
  }
}
async function section(label, fn) {
  console.log('\n▸ ' + label);
  try { await fn(); } catch (e) { console.log('  ⚠️ section error: ' + e.message.slice(0, 120)); }
}

// ── PUBLIC PAGES ────────────────────────────────────────────────
await section('Public pages', async () => {
  const ctx = await browser.newContext({ viewport: DESKTOP });
  const p = await ctx.newPage();

  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1800);
  await shot(p, '01-landing-hero.png');
  await p.evaluate(() => window.scrollBy(0, 950));
  await p.waitForTimeout(900);
  await shot(p, '02-landing-activities.png');
  await p.evaluate(() => window.scrollBy(0, 2600));
  await p.waitForTimeout(900);
  await shot(p, '03-landing-comparison.png');

  await p.goto(BASE + '/?login=1', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  await shot(p, '04-login-modal.png');

  await p.goto(BASE + '/templates', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1800);
  await shot(p, '05-templates-gallery.png');

  await p.goto(BASE + '/pricing', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1400);
  await shot(p, '06-pricing.png');

  await p.goto(BASE + '/join', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  await shot(p, '07-join-page.png');

  await ctx.close();
});

// ── AUTHENTICATED HOST ──────────────────────────────────────────
const host = await browser.newContext({ viewport: DESKTOP });
const hp = await host.newPage();
let eventCode = '';

await section('Login + Dashboard', async () => {
  await hp.addInitScript(() => localStorage.setItem('onboarding_v1_done', 'true'));
  await hp.goto(BASE + '/?login=1', { waitUntil: 'networkidle' });
  await hp.locator('input[type="email"]').first().fill(EMAIL);
  await hp.locator('input[type="password"]').first().fill(PASSWORD);
  await hp.locator('button[type="submit"]').first().click();
  await hp.locator('text=Одјави').first().waitFor({ timeout: 30000 });
  await hp.waitForTimeout(1200);

  await hp.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
  await hp.waitForTimeout(1800);
  await shot(hp, '08-dashboard-home.png');

  for (const [tour, file] of [
    ['sidebar-presentations', '09-dashboard-presentations.png'],
    ['sidebar-analytics', '10-dashboard-analytics.png'],
    ['sidebar-templates', '11-dashboard-templates.png'],
    ['sidebar-profile', '12-dashboard-profile.png'],
  ]) {
    const btn = hp.locator(`[data-tour="${tour}"]`);
    if (await btn.count()) { await btn.first().click(); await hp.waitForTimeout(1200); await shot(hp, file); }
  }
});

await section('Host — create event + activities', async () => {
  await hp.evaluate(() => localStorage.removeItem('active_event_code'));
  await hp.goto(BASE + '/host', { waitUntil: 'networkidle' });
  const subtitle = hp.locator('p:has-text("Управувајте со")');
  await subtitle.waitFor({ timeout: 30000 });
  const m = ((await subtitle.textContent()) || '').match(/[0-9A-Z]{6}/);
  eventCode = m ? m[0] : '';
  console.log('  event code: ' + eventCode);
  await hp.waitForTimeout(1200);

  // add a poll
  await hp.getByRole('button', { name: 'Додај активност' }).click();
  await hp.waitForTimeout(800);
  await shot(hp, '13-host-activity-types.png');
  await hp.getByRole('button', { name: /Анкета \(Повеќе избор\)/ }).first().click();
  await hp.waitForTimeout(800);
  await hp.locator('textarea[placeholder^="Што сакате"]').first().fill('Кој е твојот омилен предмет?');
  await hp.locator('input[placeholder="Опција 1"]').fill('Математика');
  await hp.locator('input[placeholder="Опција 2"]').fill('Физика');
  await shot(hp, '14-host-create-poll.png');
  await hp.getByRole('button', { name: 'Зачувај активност' }).click();
  await hp.waitForTimeout(1500);

  // add a quiz
  await hp.getByRole('button', { name: 'Додај активност' }).click();
  await hp.waitForTimeout(800);
  await hp.getByRole('button', { name: /Квиз \(Натпревар\)/ }).first().click();
  await hp.waitForTimeout(800);
  await hp.locator('textarea[placeholder^="Пр."]').first().fill('Колку е 2 + 2?');
  await hp.locator('input[placeholder="Опција 1"]').fill('4');
  await hp.locator('input[placeholder="Опција 2"]').fill('5');
  await shot(hp, '15-host-create-quiz.png');
  await hp.getByRole('button', { name: 'Зачувај квиз' }).click();
  await hp.waitForTimeout(1500);

  await shot(hp, '16-host-activity-list.png');

  // settings modal
  const settingsBtn = hp.locator('button[aria-label="Отвори поставки на настан"]');
  if (await settingsBtn.count()) {
    await settingsBtn.first().click();
    await hp.waitForTimeout(1000);
    await shot(hp, '17-host-settings.png');
    await hp.keyboard.press('Escape');
    await hp.waitForTimeout(500);
  }
});

// ── PARTICIPANT ─────────────────────────────────────────────────
await section('Participant view', async () => {
  if (!eventCode) { console.log('  skip (no event code)'); return; }
  // activate the poll first (first card)
  await hp.locator('p', { hasText: 'Кој е твојот омилен предмет?' }).first().click();
  await hp.waitForTimeout(1200);

  const pctx = await browser.newContext({ viewport: PHONE });
  const pp = await pctx.newPage();
  await pp.goto(`${BASE}/event/${eventCode}`, { waitUntil: 'networkidle' });
  const nameInput = pp.locator('input[placeholder="Твоето име..."]');
  await nameInput.waitFor({ timeout: 30000 });
  await shot(pp, '18-participant-join.png');
  await nameInput.fill('Ана Петрова');
  await pp.getByRole('button', { name: /Започни/ }).click();
  await pp.locator('#poll-question').waitFor({ timeout: 30000 });
  await pp.waitForTimeout(1000);
  await shot(pp, '19-participant-poll.png');
  await pp.getByRole('radio', { name: 'Математика' }).click();
  await pp.waitForTimeout(1500);
  await shot(pp, '20-participant-voted.png');
  await pctx.close();
});

// ── PRESENTER ───────────────────────────────────────────────────
await section('Presenter view', async () => {
  if (!eventCode) { console.log('  skip (no event code)'); return; }
  const prctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const pr = await prctx.newPage();
  await pr.goto(`${BASE}/event/${eventCode}/present`, { waitUntil: 'networkidle' });
  await pr.waitForTimeout(2500);
  await shot(pr, '21-presenter-results.png');
  await prctx.close();
});

// ── REMOTE CONTROL (phone) ──────────────────────────────────────
await section('Remote control', async () => {
  const remoteBtn = hp.getByRole('button', { name: /Далечинска/ });
  if (await remoteBtn.count()) {
    // resize host page to phone to show the mobile remote UI
    await hp.setViewportSize(PHONE);
    await remoteBtn.first().click();
    await hp.waitForTimeout(1200);
    await shot(hp, '22-remote-control.png');
    await hp.setViewportSize(DESKTOP);
  }
});

await browser.close();
console.log('\n✅ Готово. Слики во docs/user-manual/images/');
