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
      // Desktop Chrome is 1280 wide and the desktop nav only appears at the
      // `nav:` breakpoint of 1360px, so the logout control every authenticated
      // spec waits on was rendered hidden and each of them timed out on a login
      // that had actually succeeded. Wider than the breakpoint, once, here.
      use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 900 } },
      testIgnore: /auth\.spec/,
    },
    // Auth tests — UI login per test (storageState skipped: Supabase lock contention blocks INITIAL_SESSION)
    {
      name: 'chromium-auth',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 900 },
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
