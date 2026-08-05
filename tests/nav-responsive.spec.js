import { test, expect } from '@playwright/test';

// The header used to keep six primary links and a six-item utility cluster
// mounted at every width. At 1440px the "Регистрирај се" button — the most
// expensive click on the site — was clipped by the viewport edge, and at 390px
// the whole row ran off screen. A screenshot review caught it; nothing in the
// suite did. These tests measure it.

const WIDTHS = [
  { width: 390, height: 844, label: 'phone' },
  { width: 768, height: 1024, label: 'tablet' },
  { width: 1024, height: 800, label: 'small laptop' },
  { width: 1280, height: 800, label: 'laptop' },
  { width: 1440, height: 900, label: 'desktop' },
  { width: 1920, height: 1080, label: 'wide' },
];

for (const { width, height, label } of WIDTHS) {
  test(`header fits the viewport at ${width}px (${label})`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('nav', { timeout: 15000 });

    const result = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const vw = document.documentElement.clientWidth;
      const clipped = [];
      nav.querySelectorAll('button, a').forEach((el) => {
        const r = el.getBoundingClientRect();
        // 1px of tolerance for sub-pixel layout rounding.
        if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
          clipped.push(`${el.textContent.trim().slice(0, 24) || el.getAttribute('aria-label')} (right=${Math.round(r.right)}, viewport=${vw})`);
        }
      });
      return { clipped, pageScrollWidth: document.documentElement.scrollWidth, vw };
    });

    expect(result.clipped, `clipped header controls: ${result.clipped.join(' | ')}`).toEqual([]);
    // No horizontal page scroll either — a clipped nav often shows up as this.
    expect(result.pageScrollWidth).toBeLessThanOrEqual(result.vw + 1);
  });
}

test('the sign-up path survives on a laptop, where the CTA matters most', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const nav = page.locator('nav').first();
  await expect(nav.getByRole('button', { name: 'Регистрирај се' })).toBeVisible();
  await expect(nav.getByRole('button', { name: 'Најави се' })).toBeVisible();
});

test('on a phone the header is just the wordmark and the menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const nav = page.locator('nav').first();
  const visible = await nav.locator('button:visible').count();
  // Logo is a div; only the hamburger should remain as a visible control.
  expect(visible).toBeLessThanOrEqual(2);

  const burger = page.getByRole('button', { name: /Мени|Menu/i });
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  await burger.click();
  await expect(burger).toHaveAttribute('aria-expanded', 'true');

  // Everything pulled out of the header must be reachable in the sheet.
  const sheet = page.locator('#mobile-menu');
  await expect(sheet.getByRole('button', { name: 'Цени' })).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Приклучи се' })).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Регистрирај се' })).toBeVisible();
});
