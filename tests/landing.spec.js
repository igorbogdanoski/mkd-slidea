import { test, expect } from '@playwright/test';

test.describe('MKD Slidea Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have the correct title and welcome message', async ({ page }) => {
    await expect(page).toHaveTitle(/MKD Slidea/i);
    await expect(page.locator('h1')).toContainText(/Слајдови кои реагираат/i);
  });

  test('should navigate to Join page when "Приклучи се" is clicked', async ({ page }) => {
    await page.click('text=Приклучи се');
    await expect(page).toHaveURL(/\/join/);
    await expect(page.locator('h2')).toContainText(/Внесете го кодот/i);
  });

  test('should navigate to Admin Dashboard when "Админ Панел" is clicked', async ({ page }) => {
    await page.click('text=Админ Панел');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1')).toContainText(/Добредојде, Игор Богданоски/i);
  });

  test('should toggle between dashboard tabs', async ({ page }) => {
    await page.click('text=Админ Панел');
    
    // Click on Analytics
    await page.click('button:has-text("Аналитика")');
    await expect(page.locator('h2')).toContainText(/Детална аналитика/i);
    
    // Click on Templates
    await page.click('button:has-text("Сите шаблони")');
    await expect(page.locator('h2')).toContainText(/Сите шаблони/i);
  });
});
