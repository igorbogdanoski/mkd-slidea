import { test, expect } from '@playwright/test';

test.describe('MKD Slidea Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have the correct title and welcome message', async ({ page }) => {
    await expect(page).toHaveTitle(/MKD Slidea/i);
    await expect(page.locator('h1')).toContainText(/Слајдови кои/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText(/Идеи кои водат/);
  });

  test('should navigate to Join page via the code entry "Влези" button', async ({ page }) => {
    const codeInput = page.locator('input[placeholder="Внеси код..."]');
    await expect(codeInput).toBeVisible({ timeout: 15000 });
    await codeInput.fill('ABC');
    await page.getByRole('button', { name: 'Влези' }).click();
    await expect(page).toHaveURL(/\/join/);
    await expect(page.locator('h2')).toContainText(/Приклучи се/);
  });

  test('should navigate to Demo when "Пробај без регистрација" is clicked', async ({ page }) => {
    await page.getByRole('button', { name: /Пробај без регистрација/ }).click();
    await expect(page).toHaveURL(/\/demo/);
  });

  test('should open the co-host modal from "Сте Ко-домаќин?"', async ({ page }) => {
    await page.getByRole('button', { name: /Сте Ко-домаќин/ }).click();
    await expect(page.locator('body')).toContainText(/Внесете го кодот за пристап/, { timeout: 15000 });
  });
});
