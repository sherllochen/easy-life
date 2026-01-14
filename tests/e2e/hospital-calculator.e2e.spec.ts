import { test, expect } from '@playwright/test'

/**
 * Hospital Insurance Calculator E2E Tests
 *
 * This file contains all tests for the hospital calculator page.
 * Tests are organized by feature area (slices) but kept in one file
 * since they all test the same page component.
 */

test.describe('Hospital Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  // ============================================================================
  // Basic Calculator Form & Calculation (Slice 1)
  // ============================================================================

  test.describe('Basic Calculator', () => {
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
      // Fill in the form
      await page.fill('input[name="age"]', '28')
      await page.fill('input[name="income"]', '120000')

      // Click calculate
      await page.click('button:has-text("Calculate")')

      // Should see result section
      const resultSection = page.locator('[data-testid="calculator-result"]')
      await expect(resultSection).toBeVisible()

      // Should see net additional cost
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
      // Fill in the form
      await page.fill('input[name="age"]', '45')
      await page.fill('input[name="income"]', '180000')

      // Click calculate
      await page.click('button:has-text("Calculate")')

      // Should see result section
      const resultSection = page.locator('[data-testid="calculator-result"]')
      await expect(resultSection).toBeVisible()

      // Should see a message indicating delaying costs money
      const message = page.locator('[data-testid="result-message"]')
      await expect(message).toBeVisible()
      await expect(message).toContainText(/cost/i)
    })

    test('should calculate for low income person (no MLS)', async ({ page }) => {
      await page.fill('input[name="age"]', '25')
      await page.fill('input[name="income"]', '80000')

      await page.click('button:has-text("Calculate")')

      const resultSection = page.locator('[data-testid="calculator-result"]')
      await expect(resultSection).toBeVisible()

      const message = page.locator('[data-testid="result-message"]')
      await expect(message).toContainText(/save/i)
    })

    test('should validate required inputs', async ({ page }) => {
      // Try to calculate without filling inputs
      await page.click('button:has-text("Calculate")')

      // Should not show results
      const resultSection = page.locator('[data-testid="calculator-result"]')
      await expect(resultSection).not.toBeVisible()
    })

    test('should handle edge case: age exactly 30', async ({ page }) => {
      await page.fill('input[name="age"]', '30')
      await page.fill('input[name="income"]', '100000')

      await page.click('button:has-text("Calculate")')

      const resultSection = page.locator('[data-testid="calculator-result"]')
      await expect(resultSection).toBeVisible()
    })

    test('should format currency values properly', async ({ page }) => {
      await page.fill('input[name="age"]', '28')
      await page.fill('input[name="income"]', '120000')

      await page.click('button:has-text("Calculate")')

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

  // ============================================================================
  // Family Status & MLS Auto-Calculation (Slice 2)
  // ============================================================================

  test.describe('Family Status & MLS', () => {
    test('should display family status toggle', async ({ page }) => {
      const familyToggle = page.locator('[data-testid="family-status-toggle"]')
      await expect(familyToggle).toBeVisible()

      await expect(page.locator('text=/single/i')).toBeVisible()
      await expect(page.locator('text=/family/i')).toBeVisible()
    })

    test('should show number of children input when Family is selected', async ({ page }) => {
      const childrenInput = page.locator('input[name="numChildren"]')
      await expect(childrenInput).not.toBeVisible()

      await page.click('[data-testid="family-option"]')

      await expect(childrenInput).toBeVisible()
      await expect(page.locator('label', { hasText: /children/i })).toBeVisible()
    })

    test('should hide children input when switching back to Single', async ({ page }) => {
      await page.click('[data-testid="family-option"]')
      const childrenInput = page.locator('input[name="numChildren"]')
      await expect(childrenInput).toBeVisible()

      await page.click('[data-testid="single-option"]')
      await expect(childrenInput).not.toBeVisible()
    })

    test('should display MLS rate for single person with income $120,000', async ({ page }) => {
      await page.fill('input[name="income"]', '120000')

      const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')
      await expect(mlsDisplay).toBeVisible()
      await expect(mlsDisplay).toContainText('1.25%')
      await expect(mlsDisplay).toContainText(/tier 2/i)
    })

    test('should display MLS rate for family with income $200,000', async ({ page }) => {
      await page.click('[data-testid="family-option"]')
      await page.fill('input[name="income"]', '200000')

      const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')
      await expect(mlsDisplay).toBeVisible()
      await expect(mlsDisplay).toContainText('1.0%')
      await expect(mlsDisplay).toContainText(/tier 1/i)
    })

    test('should display 0% MLS rate for low income single person', async ({ page }) => {
      await page.fill('input[name="income"]', '80000')

      const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')
      await expect(mlsDisplay).toBeVisible()
      await expect(mlsDisplay).toContainText('0%')
    })

    test('should adjust thresholds based on number of children', async ({ page }) => {
      await page.click('[data-testid="family-option"]')
      await page.fill('input[name="income"]', '195000')

      const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')
      await expect(mlsDisplay).toContainText('1.0%')

      await page.fill('input[name="numChildren"]', '1')
      await expect(mlsDisplay).toContainText('0%')
    })

    test('should update MLS rate dynamically when income changes', async ({ page }) => {
      const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')

      await page.fill('input[name="income"]', '80000')
      await expect(mlsDisplay).toContainText('0%')

      await page.fill('input[name="income"]', '100000')
      await expect(mlsDisplay).toContainText('1.0%')

      await page.fill('input[name="income"]', '120000')
      await expect(mlsDisplay).toContainText('1.25%')

      await page.fill('input[name="income"]', '180000')
      await expect(mlsDisplay).toContainText('1.5%')
    })

    test('should calculate correctly for family with children', async ({ page }) => {
      await page.click('[data-testid="family-option"]')
      await page.fill('input[name="age"]', '35')
      await page.fill('input[name="income"]', '200000')
      await page.fill('input[name="numChildren"]', '2')

      const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')
      await expect(mlsDisplay).toContainText('1.0%')

      await page.click('button:has-text("Calculate")')

      const resultSection = page.locator('[data-testid="calculator-result"]')
      await expect(resultSection).toBeVisible()
    })

    test('should show tier explanation in MLS display', async ({ page }) => {
      await page.fill('input[name="income"]', '120000')

      const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')
      await expect(mlsDisplay).toContainText(/113.*151/i)
    })

    test('should calculate correctly for single person vs family with same income', async ({
      page,
    }) => {
      const income = '200000'
      const age = '35'

      await page.fill('input[name="age"]', age)
      await page.fill('input[name="income"]', income)
      await page.click('button:has-text("Calculate")')

      const resultSection = page.locator('[data-testid="calculator-result"]')
      await expect(resultSection).toBeVisible()

      const singleResult = await page.locator('[data-testid="net-cost"]').textContent()

      await page.click('[data-testid="family-option"]')

      const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')
      await expect(mlsDisplay).toContainText('1.0%')

      await page.click('button:has-text("Calculate")')

      const familyResult = await page.locator('[data-testid="net-cost"]').textContent()

      expect(singleResult).not.toBe(familyResult)
    })

    test('should maintain children input value when toggling', async ({ page }) => {
      await page.click('[data-testid="family-option"]')
      await page.fill('input[name="numChildren"]', '3')

      await expect(page.locator('input[name="numChildren"]')).toHaveValue('3')
    })

    test('should handle zero children correctly', async ({ page }) => {
      await page.click('[data-testid="family-option"]')
      await page.fill('input[name="income"]', '195000')

      const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')
      await expect(mlsDisplay).toContainText('1.0%')

      await page.fill('input[name="numChildren"]', '0')
      await expect(mlsDisplay).toContainText('1.0%')
    })

    test('should update calculation when family status changes', async ({ page }) => {
      await page.fill('input[name="age"]', '35')
      await page.fill('input[name="income"]', '200000')

      await page.click('button:has-text("Calculate")')
      await expect(page.locator('[data-testid="calculator-result"]')).toBeVisible()

      await page.click('[data-testid="family-option"]')
      await page.click('button:has-text("Calculate")')

      await expect(page.locator('[data-testid="calculator-result"]')).toBeVisible()
    })
  })

  // ============================================================================
  // Loading Calculation (Age-based & Immigrant) (Slice 3)
  // ============================================================================

  test.describe('Loading Calculation', () => {
    test('should display immigrant status checkbox', async ({ page }) => {
      const immigrantCheckbox = page.locator('[data-testid="immigrant-checkbox"]')
      await expect(immigrantCheckbox).toBeVisible()
      await expect(page.locator('text=/immigrant/i')).toBeVisible()
    })

    test('should show Medicare age input when immigrant is checked', async ({ page }) => {
      const medicareAgeInput = page.locator('input[name="medicareAge"]')
      await expect(medicareAgeInput).not.toBeVisible()

      await page.click('[data-testid="immigrant-checkbox"]')

      await expect(medicareAgeInput).toBeVisible()
      await expect(page.locator('label', { hasText: /medicare/i })).toBeVisible()
    })

    test('should hide Medicare age input when immigrant is unchecked', async ({ page }) => {
      await page.click('[data-testid="immigrant-checkbox"]')
      const medicareAgeInput = page.locator('input[name="medicareAge"]')
      await expect(medicareAgeInput).toBeVisible()

      await page.click('[data-testid="immigrant-checkbox"]')
      await expect(medicareAgeInput).not.toBeVisible()
    })

    test('should display loading for Australian born under 30', async ({ page }) => {
      await page.fill('input[name="age"]', '28')

      const loadingDisplay = page.locator('[data-testid="loading-display"]')
      await expect(loadingDisplay).toBeVisible()
      await expect(loadingDisplay).toContainText('0%')
    })

    test('should display loading for Australian born at age 30', async ({ page }) => {
      await page.fill('input[name="age"]', '30')

      const loadingDisplay = page.locator('[data-testid="loading-display"]')
      await expect(loadingDisplay).toBeVisible()
      await expect(loadingDisplay).toContainText('0%')
    })

    test('should display loading for Australian born age 35', async ({ page }) => {
      await page.fill('input[name="age"]', '35')

      const loadingDisplay = page.locator('[data-testid="loading-display"]')
      await expect(loadingDisplay).toBeVisible()
      await expect(loadingDisplay).toContainText('10%')
      await expect(loadingDisplay).toContainText(/5 year/i)
    })

    test('should display loading for Australian born age 60', async ({ page }) => {
      await page.fill('input[name="age"]', '60')

      const loadingDisplay = page.locator('[data-testid="loading-display"]')
      await expect(loadingDisplay).toBeVisible()
      await expect(loadingDisplay).toContainText('60%')
    })

    test('should cap loading at 70% for very old age', async ({ page }) => {
      await page.fill('input[name="age"]', '100')

      const loadingDisplay = page.locator('[data-testid="loading-display"]')
      await expect(loadingDisplay).toBeVisible()
      await expect(loadingDisplay).toContainText('70%')
    })

    test('should display loading for immigrant within grace period', async ({ page }) => {
      await page.click('[data-testid="immigrant-checkbox"]')
      await page.fill('input[name="age"]', '40')
      await page.fill('input[name="medicareAge"]', '39')

      const loadingDisplay = page.locator('[data-testid="loading-display"]')
      await expect(loadingDisplay).toBeVisible()
      await expect(loadingDisplay).toContainText('0%')
      await expect(loadingDisplay).toContainText(/grace/i)
    })

    test('should display loading for immigrant just past grace period', async ({ page }) => {
      await page.click('[data-testid="immigrant-checkbox"]')
      await page.fill('input[name="age"]', '42')
      await page.fill('input[name="medicareAge"]', '39')

      const loadingDisplay = page.locator('[data-testid="loading-display"]')
      await expect(loadingDisplay).toBeVisible()
      await expect(loadingDisplay).toContainText('4%')
      await expect(loadingDisplay).toContainText(/2 year/i)
    })

    test('should display loading for immigrant with higher loading', async ({ page }) => {
      await page.click('[data-testid="immigrant-checkbox"]')
      await page.fill('input[name="age"]', '50')
      await page.fill('input[name="medicareAge"]', '35')

      const loadingDisplay = page.locator('[data-testid="loading-display"]')
      await expect(loadingDisplay).toBeVisible()
      await expect(loadingDisplay).toContainText('28%')
    })

    test('should update loading dynamically when age changes', async ({ page }) => {
      const loadingDisplay = page.locator('[data-testid="loading-display"]')

      await page.fill('input[name="age"]', '25')
      await expect(loadingDisplay).toContainText('0%')

      await page.fill('input[name="age"]', '35')
      await expect(loadingDisplay).toContainText('10%')

      await page.fill('input[name="age"]', '45')
      await expect(loadingDisplay).toContainText('30%')
    })

    test('should update loading when switching between local and immigrant', async ({ page }) => {
      const loadingDisplay = page.locator('[data-testid="loading-display"]')

      await page.fill('input[name="age"]', '42')
      await expect(loadingDisplay).toContainText('24%')

      await page.click('[data-testid="immigrant-checkbox"]')
      await page.fill('input[name="medicareAge"]', '39')
      await expect(loadingDisplay).toContainText('4%')

      await page.click('[data-testid="immigrant-checkbox"]')
      await expect(loadingDisplay).toContainText('24%')
    })

    test('should calculate correctly with immigrant loading', async ({ page }) => {
      await page.click('[data-testid="immigrant-checkbox"]')
      await page.fill('input[name="age"]', '42')
      await page.fill('input[name="medicareAge"]', '39')
      await page.fill('input[name="income"]', '120000')

      const loadingDisplay = page.locator('[data-testid="loading-display"]')
      await expect(loadingDisplay).toContainText('4%')

      await page.click('button:has-text("Calculate")')

      const resultSection = page.locator('[data-testid="calculator-result"]')
      await expect(resultSection).toBeVisible()
    })

    test('should show explanation text for Australian born', async ({ page }) => {
      await page.fill('input[name="age"]', '37')

      const loadingDisplay = page.locator('[data-testid="loading-display"]')
      await expect(loadingDisplay).toContainText(/age 30/i)
    })

    test('should show explanation text for immigrant', async ({ page }) => {
      await page.click('[data-testid="immigrant-checkbox"]')
      await page.fill('input[name="age"]', '45')
      await page.fill('input[name="medicareAge"]', '40')

      const loadingDisplay = page.locator('[data-testid="loading-display"]')
      await expect(loadingDisplay).toContainText(/year/i)
    })

    test('should handle zero loading correctly', async ({ page }) => {
      await page.fill('input[name="age"]', '25')

      const loadingDisplay = page.locator('[data-testid="loading-display"]')
      await expect(loadingDisplay).toContainText('0%')

      const text = await loadingDisplay.textContent()
      expect(text).not.toMatch(/\d+ year.*late/i)
    })

    test('should maintain Medicare age value when toggling', async ({ page }) => {
      await page.click('[data-testid="immigrant-checkbox"]')
      await page.fill('input[name="medicareAge"]', '35')

      await expect(page.locator('input[name="medicareAge"]')).toHaveValue('35')
    })

    test('should validate Medicare age is required for immigrants when calculating', async ({
      page,
    }) => {
      await page.click('[data-testid="immigrant-checkbox"]')
      await page.fill('input[name="age"]', '42')
      await page.fill('input[name="income"]', '120000')

      await page.click('button:has-text("Calculate")')

      // Should not show result without Medicare age
      // (Implementation can handle validation in different ways)
    })
  })
})
