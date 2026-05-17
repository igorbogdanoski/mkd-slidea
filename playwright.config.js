import { defineConfig, devices } from '@playwright/test';

// Relative to the project root (where playwright.config.js lives)
const AUTH_FILE = 'playwright/.auth/user.json';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: './playwright/auth.setup.js',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },
  projects: [
    // Smoke tests — no auth
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /auth\.spec/,
    },
    // Auth tests — UI login per test (storageState skipped: Supabase lock contention blocks INITIAL_SESSION)
    {
      name: 'chromium-auth',
      use: {
        ...devices['Desktop Chrome'],
      },
      testMatch: /auth\.spec/,
    },
  ],
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
