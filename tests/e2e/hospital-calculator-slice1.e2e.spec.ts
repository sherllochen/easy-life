import { test, expect } from '@playwright/test'

test.describe('Hospital Calculator - Slice 1: Basic Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display calculator form with required inputs', async ({ page }) => {
    // Should see form heading
    await expect(page.locator('h1', { hasText: 'Hospital Insurance Calculator' })).toBeVisible()

    // Should see Age input
    const ageInput = page.locator('input[name="age"]')
    await expect(ageInput).toBeVisible()
    await expect(page.locator('label', { hasText: /age/i })).toBeVisible()

    // Should see Annual Income input
    const incomeInput = page.locator('input[name="income"]')
    await expect(incomeInput).toBeVisible()
    await expect(page.locator('label', { hasText: /annual income/i })).toBeVisible()

    // Should see Base Premium input with default value
    const premiumInput = page.locator('input[name="premium"]')
    await expect(premiumInput).toBeVisible()
    await expect(page.locator('label', { hasText: /base premium/i })).toBeVisible()
    await expect(premiumInput).toHaveValue('2000')

    // Should see Calculate button
    const calculateButton = page.locator('button', { hasText: /calculate/i })
    await expect(calculateButton).toBeVisible()
  })

  test('should calculate and display result for young high earner (saves money)', async ({
    page,
  }) => {
    // Example from formula doc: Age 28, Income $120,000, Premium $2,000
    // Expected: Delaying 1 year saves money

    // Fill in the form
    await page.fill('input[name="age"]', '28')
    await page.fill('input[name="income"]', '120000')
    // Premium defaults to 2000, no need to change

    // Click calculate
    await page.click('button:has-text("Calculate")')

    // Should see result section
    const resultSection = page.locator('[data-testid="calculator-result"]')
    await expect(resultSection).toBeVisible()

    // Should see net additional cost (negative means saves money)
    const costDisplay = page.locator('[data-testid="net-cost"]')
    await expect(costDisplay).toBeVisible()

    // Should see a message indicating delaying saves money
    const message = page.locator('[data-testid="result-message"]')
    await expect(message).toBeVisible()
    await expect(message).toContainText(/save/i)
  })

  test('should calculate and display result for middle-aged high earner (costs money)', async ({
    page,
  }) => {
    // Example from formula doc: Age 45, Income $180,000, Premium $2,000, Loading 30%
    // Expected: Delaying costs money

    // Fill in the form
    await page.fill('input[name="age"]', '45')
    await page.fill('input[name="income"]', '180000')

    // Click calculate
    await page.click('button:has-text("Calculate")')

    // Should see result section
    const resultSection = page.locator('[data-testid="calculator-result"]')
    await expect(resultSection).toBeVisible()

    // Should see net additional cost (positive means costs money)
    const costDisplay = page.locator('[data-testid="net-cost"]')
    await expect(costDisplay).toBeVisible()

    // Should see a message indicating delaying costs money
    const message = page.locator('[data-testid="result-message"]')
    await expect(message).toBeVisible()
    await expect(message).toContainText(/cost/i)
  })

  test('should calculate for low income person (no MLS)', async ({ page }) => {
    // Low income, no MLS, should save money by delaying
    await page.fill('input[name="age"]', '25')
    await page.fill('input[name="income"]', '80000')

    await page.click('button:has-text("Calculate")')

    const resultSection = page.locator('[data-testid="calculator-result"]')
    await expect(resultSection).toBeVisible()

    // With no MLS and no loading, should save premium by delaying
    const message = page.locator('[data-testid="result-message"]')
    await expect(message).toContainText(/save/i)
  })

  test('should validate required inputs', async ({ page }) => {
    // Try to calculate without filling inputs
    await page.click('button:has-text("Calculate")')

    // Should see validation errors or button should be disabled
    // (Implementation detail - either approach is fine)
    // For now, just verify no crash and no result shown
    const resultSection = page.locator('[data-testid="calculator-result"]')
    await expect(resultSection).not.toBeVisible()
  })

  test('should handle edge case: age exactly 30', async ({ page }) => {
    // At exactly 30, loading should be 0%
    await page.fill('input[name="age"]', '30')
    await page.fill('input[name="income"]', '100000')

    await page.click('button:has-text("Calculate")')

    const resultSection = page.locator('[data-testid="calculator-result"]')
    await expect(resultSection).toBeVisible()

    // Should calculate correctly with L₀ = 0%
    const costDisplay = page.locator('[data-testid="net-cost"]')
    await expect(costDisplay).toBeVisible()
  })

  test('should format currency values properly', async ({ page }) => {
    await page.fill('input[name="age"]', '28')
    await page.fill('input[name="income"]', '120000')

    await page.click('button:has-text("Calculate")')

    // Cost should be formatted with dollar sign and commas if needed
    const costDisplay = page.locator('[data-testid="net-cost"]')
    const costText = await costDisplay.textContent()
    expect(costText).toMatch(/\$/)
  })

  test('should allow recalculation with different values', async ({ page }) => {
    // First calculation
    await page.fill('input[name="age"]', '28')
    await page.fill('input[name="income"]', '120000')
    await page.click('button:has-text("Calculate")')

    const resultSection = page.locator('[data-testid="calculator-result"]')
    await expect(resultSection).toBeVisible()

    // Change values and recalculate
    await page.fill('input[name="age"]', '45')
    await page.fill('input[name="income"]', '180000')
    await page.click('button:has-text("Calculate")')

    // Should still show results (updated)
    await expect(resultSection).toBeVisible()
  })
})
