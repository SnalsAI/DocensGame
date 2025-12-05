import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate as student', async ({ page }) => {
  // Navigate to login
  await page.goto('/auth/login');

  // Wait for Keycloak login page or custom login
  await page.waitForLoadState('networkidle');

  // Fill login form (adjust selectors based on your auth implementation)
  const usernameInput = page.locator('input[name="username"], input[name="email"], #username');
  const passwordInput = page.locator('input[name="password"], #password');
  const loginButton = page.locator('button[type="submit"], input[type="submit"]');

  if (await usernameInput.isVisible()) {
    await usernameInput.fill('studente@scuola.it');
    await passwordInput.fill('studente123');
    await loginButton.click();
  }

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard/**', { timeout: 30000 });

  // Verify we're logged in
  await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
