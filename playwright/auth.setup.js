// Global setup — runs once before all tests.
// Logs in with smoke credentials and saves storageState so auth tests
// start with a fresh, valid Supabase session (no auth race conditions).
import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.join(__dirname, '.auth/user.json');

const BASE = process.env.BASE_URL || 'https://slidea.mismath.net';
const EMAIL = process.env.SMOKE_TEST_EMAIL || '';
const PASSWORD = process.env.SMOKE_TEST_PASSWORD || '';

export default async function globalSetup() {
  if (!EMAIL || !PASSWORD) {
    console.log('[auth.setup] No credentials — creating empty auth state');
    fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('onboarding_v1_done', 'true');
  });

  await page.goto(BASE + '/?login=1');
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();

  // Wait for logout link — proves session is active
  await page.locator('text=Одјави').waitFor({ timeout: 20000 });

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await context.storageState({ path: AUTH_FILE });
  await browser.close();
  console.log('[auth.setup] Auth state saved →', AUTH_FILE);
}
