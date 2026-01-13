import { test, expect } from '@playwright/test'

test.describe('Hospital Insurance Calculator - POC', () => {
  test('should display calculator page as homepage', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')

    // Should see the calculator heading
    const heading = page.locator('h1', { hasText: 'Hospital Insurance Calculator' })
    await expect(heading).toBeVisible()

    // Should see placeholder text
    const placeholderText = page.locator('text=Calculator coming soon')
    await expect(placeholderText).toBeVisible()

    // Verify we're on the homepage (not redirected elsewhere)
    expect(page.url()).toBe('http://localhost:3000/')
  })

  test('should have proper page title', async ({ page }) => {
    await page.goto('/')

    // Check page title in browser tab
    await expect(page).toHaveTitle(/Hospital Insurance Calculator/i)
  })
})
