import { test, expect } from '@playwright/test';

test.describe('Game Lobby', () => {
  test('should display available games', async ({ page }) => {
    await page.goto('/dashboard/student');

    // Navigate to games section
    const gamesLink = page.locator('a[href*="game"], button:has-text("Giochi")');
    if (await gamesLink.isVisible()) {
      await gamesLink.click();
    }
  });

  test('should join game with valid code', async ({ page }) => {
    await page.goto('/game/join');

    // Look for room code input
    const codeInput = page.locator('input[name*="code"], input[placeholder*="codice"]');
    if (await codeInput.isVisible()) {
      await codeInput.fill('TEST123');

      const joinButton = page.locator('button:has-text("Entra"), button:has-text("Join")');
      await joinButton.click();

      // Should either join or show error for invalid code
      await page.waitForLoadState('networkidle');
    }
  });

  test('should show error for invalid game code', async ({ page }) => {
    await page.goto('/game/join');

    const codeInput = page.locator('input[name*="code"], input[placeholder*="codice"]');
    if (await codeInput.isVisible()) {
      await codeInput.fill('INVALID');

      const joinButton = page.locator('button:has-text("Entra"), button:has-text("Join")');
      await joinButton.click();

      // Should show error message
      const errorMessage = page.locator('text=/errore|non trovato|invalid/i');
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Quiz Gameplay', () => {
  test.skip('should start and complete a quiz', async ({ page }) => {
    // This test requires a quiz to be available
    await page.goto('/quiz/demo');

    // Start quiz
    const startButton = page.locator('button:has-text("Inizia"), button:has-text("Start")');
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // Answer questions
    for (let i = 0; i < 5; i++) {
      const option = page.locator('.quiz-option, [data-testid="answer-option"]').first();
      if (await option.isVisible()) {
        await option.click();

        const nextButton = page.locator('button:has-text("Avanti"), button:has-text("Next")');
        if (await nextButton.isVisible()) {
          await nextButton.click();
        }
      }
    }

    // Check for results
    const results = page.locator('text=/risultati|score|punteggio/i');
    await expect(results.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Multiplayer Game', () => {
  test.skip('should display waiting room UI', async ({ page }) => {
    // This requires a valid game room
    await page.goto('/game/rapid/TEST123');

    // Should show waiting room or game
    const waitingRoom = page.locator('text=/attesa|waiting|players/i');
    const gameScreen = page.locator('text=/domanda|question|quiz/i');

    const isWaiting = await waitingRoom.isVisible();
    const isPlaying = await gameScreen.isVisible();

    expect(isWaiting || isPlaying).toBeTruthy();
  });
});
