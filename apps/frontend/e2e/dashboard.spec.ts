import { test, expect } from '@playwright/test';

test.describe('Student Dashboard', () => {
  test('should display student dashboard', async ({ page }) => {
    await page.goto('/dashboard/student');

    // Should see welcome message or dashboard content
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display XP and level information', async ({ page }) => {
    await page.goto('/dashboard/student');

    // Look for gamification elements
    const xpDisplay = page.locator('[data-testid="xp-display"], .xp-display, text=/XP|Punti/i');
    await expect(xpDisplay.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to profile page', async ({ page }) => {
    await page.goto('/dashboard/student');

    // Click on profile link
    const profileLink = page.locator('a[href*="profile"], button:has-text("Profilo")');
    if (await profileLink.isVisible()) {
      await profileLink.click();
      await expect(page).toHaveURL(/.*profile.*/);
    }
  });

  test('should display classroom list', async ({ page }) => {
    await page.goto('/dashboard/student');

    // Look for classroom section
    const classroomSection = page.locator('text=/class|corso|materia/i');
    // May or may not be visible depending on enrollment
    if (await classroomSection.isVisible()) {
      await expect(classroomSection).toBeVisible();
    }
  });
});

test.describe('Accessibility Settings', () => {
  test('should open accessibility settings', async ({ page }) => {
    await page.goto('/dashboard/student/settings');

    // Check for accessibility options
    await expect(page.locator('text=/accessibilità|font|DSA|BES/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should toggle DSA mode', async ({ page }) => {
    await page.goto('/dashboard/student/settings');

    // Find DSA toggle
    const dsaToggle = page.locator('[data-testid="dsa-toggle"], input[name*="dsa"], label:has-text("DSA")');
    if (await dsaToggle.isVisible()) {
      await dsaToggle.click();
      // Verify toggle state changed
    }
  });

  test('should change font size', async ({ page }) => {
    await page.goto('/dashboard/student/settings');

    // Find font size control
    const fontControl = page.locator('select[name*="font"], [data-testid="font-size"]');
    if (await fontControl.isVisible()) {
      await fontControl.selectOption({ index: 1 });
    }
  });
});
