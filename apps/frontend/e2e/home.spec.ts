import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the home page', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/EDU-ATELIER/i);
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');

    // Check for main navigation elements
    const nav = page.locator('nav, header');
    await expect(nav).toBeVisible();
  });

  test('should redirect unauthenticated users to login', async ({ page, context }) => {
    // Clear authentication state
    await context.clearCookies();

    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/(auth\/)?login|signin/i);
  });
});
