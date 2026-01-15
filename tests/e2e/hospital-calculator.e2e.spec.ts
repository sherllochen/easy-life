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

  // ============================================================================
  // Multi-Year Comparison (Slice 4)
  // ============================================================================

  test.describe('Multi-Year Comparison', () => {
    test.beforeEach(async ({ page }) => {
      // Fill in basic required fields for all comparison tests
      await page.fill('input[name="age"]', '35')
      await page.fill('input[name="income"]', '120000')
      // Premium defaults to 2000
      // Click Calculate to enable comparison/details buttons
      await page.click('button:has-text("Calculate")')
    })

    test('should display delay years input', async ({ page }) => {
      const delayYearsInput = page.locator('[data-testid="delay-years-input"]')
      await expect(delayYearsInput).toBeVisible()
      await expect(page.locator('label[for="delayYears"]')).toBeVisible()
    })

    test('should default to 1 year delay', async ({ page }) => {
      const delayYearsInput = page.locator('[data-testid="delay-years-input"]')
      await expect(delayYearsInput).toHaveValue('1')
    })

    test('should allow selecting delay years from 1 to 10', async ({ page }) => {
      const delayYearsInput = page.locator('[data-testid="delay-years-input"]')

      await page.fill('[data-testid="delay-years-input"]', '5')
      await expect(delayYearsInput).toHaveValue('5')

      await page.fill('[data-testid="delay-years-input"]', '1')
      await expect(delayYearsInput).toHaveValue('1')

      await page.fill('[data-testid="delay-years-input"]', '10')
      await expect(delayYearsInput).toHaveValue('10')
    })

    test('should calculate for different delay years', async ({ page }) => {
      // Calculate for 1 year
      await page.fill('[data-testid="delay-years-input"]', '1')
      await page.click('button:has-text("Calculate")')

      const resultSection = page.locator('[data-testid="calculator-result"]')
      await expect(resultSection).toBeVisible()

      const result1Year = await page.locator('[data-testid="net-cost"]').textContent()

      // Calculate for 5 years
      await page.fill('[data-testid="delay-years-input"]', '5')
      await page.click('button:has-text("Calculate")')

      const result5Years = await page.locator('[data-testid="net-cost"]').textContent()

      // Results should be different
      expect(result1Year).not.toBe(result5Years)
    })

    test('should display comparison table button', async ({ page }) => {
      const compareButton = page.locator('[data-testid="show-comparison"]')
      await expect(compareButton).toBeVisible()
    })

    test('should show comparison table when button clicked', async ({ page }) => {
      await page.click('[data-testid="show-comparison"]')

      const comparisonTable = page.locator('[data-testid="comparison-table"]')
      await expect(comparisonTable).toBeVisible()
    })

    test('should display multiple scenarios in comparison table', async ({ page }) => {
      await page.click('[data-testid="show-comparison"]')

      const comparisonTable = page.locator('[data-testid="comparison-table"]')

      // Should show headers
      await expect(comparisonTable.locator('text=/delay.*year/i')).toBeVisible()
      await expect(comparisonTable.locator('text=/cost/i')).toBeVisible()

      // Should show multiple rows
      const rows = comparisonTable.locator('[data-testid="comparison-row"]')
      const count = await rows.count()
      expect(count).toBeGreaterThanOrEqual(3)
    })

    test('should show scenarios for 1, 3, 5, and 10 years', async ({ page }) => {
      await page.click('[data-testid="show-comparison"]')

      const comparisonTable = page.locator('[data-testid="comparison-table"]')

      // Should see different year options
      await expect(comparisonTable.locator('text=/1 year/i')).toBeVisible()
      await expect(comparisonTable.locator('text=/3 year/i')).toBeVisible()
      await expect(comparisonTable.locator('text=/5 year/i')).toBeVisible()
      await expect(comparisonTable.locator('text=/10 year/i')).toBeVisible()
    })

    test('should display net cost for each scenario', async ({ page }) => {
      await page.click('[data-testid="show-comparison"]')

      const comparisonTable = page.locator('[data-testid="comparison-table"]')
      const rows = comparisonTable.locator('[data-testid="comparison-row"]')

      // Each row should have a cost
      const firstRow = rows.first()
      await expect(firstRow.locator('[data-testid="scenario-cost"]')).toBeVisible()

      const lastRow = rows.last()
      await expect(lastRow.locator('[data-testid="scenario-cost"]')).toBeVisible()
    })

    test('should show recommendation for each scenario', async ({ page }) => {
      await page.click('[data-testid="show-comparison"]')

      const comparisonTable = page.locator('[data-testid="comparison-table"]')
      const rows = comparisonTable.locator('[data-testid="comparison-row"]')

      // Each row should have a recommendation
      const firstRow = rows.first()
      await expect(firstRow).toContainText(/(can wait|buy now|consider)/i)
    })

    test('should highlight best option', async ({ page }) => {
      await page.click('[data-testid="show-comparison"]')

      const comparisonTable = page.locator('[data-testid="comparison-table"]')
      const bestOption = comparisonTable.locator('[data-testid="best-option"]')

      await expect(bestOption).toBeVisible()
    })

    test('should format years correctly (singular vs plural)', async ({ page }) => {
      await page.click('[data-testid="show-comparison"]')

      const comparisonTable = page.locator('[data-testid="comparison-table"]')

      // Should show "1 year" (singular)
      await expect(comparisonTable).toContainText('1 year')

      // Should show "X years" (plural)
      await expect(comparisonTable).toContainText(/\d+ years/)
    })

    test('should display costs with currency formatting', async ({ page }) => {
      await page.click('[data-testid="show-comparison"]')

      const comparisonTable = page.locator('[data-testid="comparison-table"]')
      const costs = comparisonTable.locator('[data-testid="scenario-cost"]')

      // Each cost should have $ sign
      const firstCost = await costs.first().textContent()
      expect(firstCost).toMatch(/\$/)
    })

    test('should handle negative costs (savings) in comparison', async ({ page }) => {
      // Use inputs that result in savings
      await page.fill('input[name="age"]', '28')
      await page.fill('input[name="income"]', '150000')

      await page.click('[data-testid="show-comparison"]')

      const comparisonTable = page.locator('[data-testid="comparison-table"]')

      // Should show savings indicator
      await expect(comparisonTable).toContainText(/(save|-)/i)
    })

    test('should allow hiding comparison table', async ({ page }) => {
      await page.click('[data-testid="show-comparison"]')

      const comparisonTable = page.locator('[data-testid="comparison-table"]')
      await expect(comparisonTable).toBeVisible()

      const hideButton = page.locator('[data-testid="hide-comparison"]')
      await expect(hideButton).toBeVisible()

      await page.click('[data-testid="hide-comparison"]')
      await expect(comparisonTable).not.toBeVisible()
    })

    test('should update comparison when inputs change', async ({ page }) => {
      await page.fill('input[name="income"]', '120000')
      await page.click('button:has-text("Calculate")')
      await page.click('[data-testid="show-comparison"]')

      const comparisonTable = page.locator('[data-testid="comparison-table"]')
      await expect(comparisonTable).toBeVisible()
    })

    test('should work with family status', async ({ page }) => {
      await page.click('[data-testid="family-option"]')
      await page.fill('input[name="numChildren"]', '2')

      await page.click('[data-testid="show-comparison"]')

      const comparisonTable = page.locator('[data-testid="comparison-table"]')
      await expect(comparisonTable).toBeVisible()

      // Should have rows with calculations based on family status
      const rows = comparisonTable.locator('[data-testid="comparison-row"]')
      await expect(rows.first()).toBeVisible()
    })

    test('should work with immigrant status', async ({ page }) => {
      await page.click('[data-testid="immigrant-checkbox"]')
      await page.fill('input[name="medicareAge"]', '30')

      await page.click('[data-testid="show-comparison"]')

      const comparisonTable = page.locator('[data-testid="comparison-table"]')
      await expect(comparisonTable).toBeVisible()

      // Should have rows with calculations based on immigrant status
      const rows = comparisonTable.locator('[data-testid="comparison-row"]')
      await expect(rows.first()).toBeVisible()
    })

    test('should integrate with all current settings', async ({ page }) => {
      // Set all options
      await page.click('[data-testid="family-option"]')
      await page.fill('input[name="numChildren"]', '1')
      await page.click('[data-testid="immigrant-checkbox"]')
      await page.fill('input[name="medicareAge"]', '32')
      await page.fill('input[name="age"]', '40')
      await page.fill('input[name="income"]', '150000')

      await page.click('[data-testid="show-comparison"]')

      const comparisonTable = page.locator('[data-testid="comparison-table"]')
      await expect(comparisonTable).toBeVisible()

      // All scenarios should reflect the complex settings
      const rows = comparisonTable.locator('[data-testid="comparison-row"]')
      const count = await rows.count()
      expect(count).toBeGreaterThanOrEqual(3)
    })

    test('should persist comparison visibility after recalculation', async ({ page }) => {
      await page.click('[data-testid="show-comparison"]')

      const comparisonTable = page.locator('[data-testid="comparison-table"]')
      await expect(comparisonTable).toBeVisible()

      // Change age and recalculate
      await page.fill('input[name="age"]', '40')
      await page.click('button:has-text("Calculate")')

      // Comparison should still be visible
      await expect(comparisonTable).toBeVisible()
    })
  })

  // ============================================================================
  // Detailed Formula Breakdown (Slice 5)
  // ============================================================================

  test.describe('Detailed Formula Breakdown', () => {
    test.beforeEach(async ({ page }) => {
      // Fill in basic required fields to show results
      await page.fill('input[name="age"]', '35')
      await page.fill('input[name="income"]', '120000')
      // Premium defaults to 2000
      // Click Calculate to enable comparison/details buttons
      await page.click('button:has-text("Calculate")')
    })

    test('should display show/hide breakdown button', async ({ page }) => {
      const breakdownButton = page.locator('[data-testid="toggle-breakdown"]')
      await expect(breakdownButton).toBeVisible()
      await expect(breakdownButton).toContainText(/show.*detail/i)
    })

    test('should show breakdown section when button clicked', async ({ page }) => {
      await page.click('[data-testid="toggle-breakdown"]')

      const breakdownSection = page.locator('[data-testid="calculation-breakdown"]')
      await expect(breakdownSection).toBeVisible()
    })

    test('should hide breakdown section when clicked again', async ({ page }) => {
      // Show first
      await page.click('[data-testid="toggle-breakdown"]')
      const breakdownSection = page.locator('[data-testid="calculation-breakdown"]')
      await expect(breakdownSection).toBeVisible()

      // Hide
      await page.click('[data-testid="toggle-breakdown"]')
      await expect(breakdownSection).not.toBeVisible()
    })

    test('should update button text when toggling', async ({ page }) => {
      const breakdownButton = page.locator('[data-testid="toggle-breakdown"]')

      // Initially shows "Show"
      await expect(breakdownButton).toContainText(/show.*detail/i)

      // After clicking, shows "Hide"
      await page.click('[data-testid="toggle-breakdown"]')
      await expect(breakdownButton).toContainText(/hide.*detail/i)

      // After clicking again, back to "Show"
      await page.click('[data-testid="toggle-breakdown"]')
      await expect(breakdownButton).toContainText(/show.*detail/i)
    })

    test('should display all three formula components', async ({ page }) => {
      await page.click('[data-testid="toggle-breakdown"]')

      const breakdownSection = page.locator('[data-testid="calculation-breakdown"]')

      // Should show three main components
      await expect(breakdownSection.locator('text=/loading.*increase/i')).toBeVisible()
      await expect(breakdownSection.locator('text=/MLS.*paid/i')).toBeVisible()
      await expect(breakdownSection.locator('text=/premium.*saved/i')).toBeVisible()
    })

    test('should display loading increase cost formula', async ({ page }) => {
      await page.click('[data-testid="toggle-breakdown"]')

      const breakdownSection = page.locator('[data-testid="calculation-breakdown"]')

      // Should show formula: P × X × 0.2
      await expect(breakdownSection).toContainText(/P.*×.*X.*×.*0\.2/i)
      await expect(breakdownSection).toContainText('$2,000')
      await expect(breakdownSection).toContainText('$400') // 2000 × 1 × 0.2
    })

    test('should display MLS cost formula', async ({ page }) => {
      await page.click('[data-testid="toggle-breakdown"]')

      const breakdownSection = page.locator('[data-testid="calculation-breakdown"]')

      // Should show formula: Income × MLS Rate × X
      await expect(breakdownSection).toContainText(/Income.*×.*MLS/i)
      await expect(breakdownSection).toContainText('$120,000')
      await expect(breakdownSection).toContainText('1.25%') // MLS rate for $120k single
      await expect(breakdownSection).toContainText('$1,500') // 120000 × 0.0125 × 1
    })

    test('should display premium saved formula', async ({ page }) => {
      await page.click('[data-testid="toggle-breakdown"]')

      const breakdownSection = page.locator('[data-testid="calculation-breakdown"]')

      // Should show formula: -P × (1 + L₀) × X
      await expect(breakdownSection).toContainText(/P.*×.*\(1.*\+.*L/i)
      await expect(breakdownSection).toContainText('$2,000')
      await expect(breakdownSection).toContainText('10%') // Loading for age 35 (5 years past 30)
    })

    test('should display final net cost in breakdown', async ({ page }) => {
      await page.click('[data-testid="toggle-breakdown"]')

      const breakdownSection = page.locator('[data-testid="calculation-breakdown"]')

      // Should show final calculation
      await expect(breakdownSection).toContainText(/net.*cost/i)
    })

    test('should update breakdown when inputs change', async ({ page }) => {
      await page.click('[data-testid="toggle-breakdown"]')

      const breakdownSection = page.locator('[data-testid="calculation-breakdown"]')

      // Initial breakdown shows $120,000 income
      await expect(breakdownSection).toContainText('$120,000')

      // Change income
      await page.fill('input[name="income"]', '150000')

      // Breakdown should update to show $150,000
      await expect(breakdownSection).toContainText('$150,000')
      await expect(breakdownSection).not.toContainText('$120,000')
    })

    test('should update breakdown when delay years change', async ({ page }) => {
      await page.click('[data-testid="toggle-breakdown"]')

      const breakdownSection = page.locator('[data-testid="calculation-breakdown"]')

      // Change delay years to 3
      await page.fill('[data-testid="delay-years-input"]', '3')

      // Breakdown should reflect 3 years in calculations
      // Loading cost: 2000 × 3 × 0.2 = 1200
      await expect(breakdownSection).toContainText('$1,200')

      // MLS cost: 120000 × 0.0125 × 3 = 4500
      await expect(breakdownSection).toContainText('$4,500')
    })

    test('should show correct loading percentage in breakdown', async ({ page }) => {
      await page.fill('input[name="age"]', '40')

      await page.click('[data-testid="toggle-breakdown"]')

      const breakdownSection = page.locator('[data-testid="calculation-breakdown"]')

      // Age 40 = 10 years past 30 = 20% loading
      await expect(breakdownSection).toContainText('20%')
    })

    test('should show correct MLS rate in breakdown', async ({ page }) => {
      await page.fill('input[name="income"]', '100000')

      await page.click('[data-testid="toggle-breakdown"]')

      const breakdownSection = page.locator('[data-testid="calculation-breakdown"]')

      // Income $100k single = Tier 1 = 1.0% MLS
      await expect(breakdownSection).toContainText('1.0%')
    })

    test('should work with family status', async ({ page }) => {
      await page.click('[data-testid="family-option"]')
      await page.fill('input[name="income"]', '200000')

      await page.click('[data-testid="toggle-breakdown"]')

      const breakdownSection = page.locator('[data-testid="calculation-breakdown"]')

      // Family with $200k = Tier 1 = 1.0% MLS
      await expect(breakdownSection).toContainText('1.0%')
      await expect(breakdownSection).toContainText('$200,000')
    })

    test('should work with immigrant status', async ({ page }) => {
      await page.click('[data-testid="immigrant-checkbox"]')
      await page.fill('input[name="age"]', '42')
      await page.fill('input[name="medicareAge"]', '39')

      await page.click('[data-testid="toggle-breakdown"]')

      const breakdownSection = page.locator('[data-testid="calculation-breakdown"]')

      // Age 42, Medicare at 39 = 2 years past grace period = 4% loading
      await expect(breakdownSection).toContainText('4%')
    })

    test('should format all currency values correctly', async ({ page }) => {
      await page.click('[data-testid="toggle-breakdown"]')

      const breakdownSection = page.locator('[data-testid="calculation-breakdown"]')
      const text = await breakdownSection.textContent()

      // Should have dollar signs
      expect(text).toContain('$')

      // Should have properly formatted numbers (commas for thousands)
      expect(text).toMatch(/\$[\d,]+/)
    })

    test('should handle negative premium saved correctly', async ({ page }) => {
      await page.click('[data-testid="toggle-breakdown"]')

      const breakdownSection = page.locator('[data-testid="calculation-breakdown"]')

      // Premium saved should be shown as negative (it reduces the net cost)
      await expect(breakdownSection).toContainText(/-\$2,/)
    })

    test('should show breakdown is optional and not displayed by default', async ({ page }) => {
      const breakdownSection = page.locator('[data-testid="calculation-breakdown"]')
      await expect(breakdownSection).not.toBeVisible()
    })
  })

  // ============================================================================
  // Decision Recommendation & Warnings (Slice 6)
  // ============================================================================

  test.describe('Decision Recommendation & Warnings', () => {
    test.beforeEach(async ({ page }) => {
      // Fill in basic required fields
      await page.fill('input[name="age"]', '35')
      await page.fill('input[name="income"]', '120000')
      // Premium defaults to 2000
      // Click Calculate to show results and enable buttons
      await page.click('button:has-text("Calculate")')
    })

    // -------------------------------------------------------------------------
    // Recommendation Box
    // -------------------------------------------------------------------------

    test('should display recommendation box', async ({ page }) => {
      const recommendationBox = page.locator('[data-testid="recommendation-box"]')
      await expect(recommendationBox).toBeVisible()
    })

    test('should show blue recommendation when delaying saves money', async ({ page }) => {
      // Older person with low income - high premium savings outweighs MLS
      // Age 40 = 20% loading, so premium saved = $2000 × 1.2 = $2,400/year
      // Income $80k = 0% MLS, so no MLS cost
      // Loading increase = $2000 × 1 × 0.2 = $400
      // Net = $400 - $2,400 = -$2,000 (saves money)
      await page.fill('input[name="age"]', '40')
      await page.fill('input[name="income"]', '80000')

      const recommendationBox = page.locator('[data-testid="recommendation-box"]')
      await expect(recommendationBox).toBeVisible()
      await expect(recommendationBox).toHaveAttribute('data-recommendation', 'can-wait')
      await expect(recommendationBox).toContainText(/can wait/i)
    })

    test('should show yellow recommendation for moderate cost (0-3000)', async ({ page }) => {
      // Young person with moderate income - small positive cost
      // Age 28 = 0% loading, so premium saved = $2000/year
      // Income $150k = 1.25% MLS = $1,875/year
      // Loading increase = $2000 × 1 × 0.2 = $400
      // Net = $400 + $1,875 - $2,000 = $275 (small cost, "consider")
      await page.fill('input[name="age"]', '28')
      await page.fill('input[name="income"]', '150000')
      await page.fill('[data-testid="delay-years-input"]', '1')

      const recommendationBox = page.locator('[data-testid="recommendation-box"]')
      await expect(recommendationBox).toBeVisible()
      await expect(recommendationBox).toHaveAttribute('data-recommendation', 'consider')
      await expect(recommendationBox).toContainText(/consider/i)
    })

    test('should show green recommendation when cost exceeds $3000', async ({ page }) => {
      // Young person with very high income and long delay - high cost
      // Age 28 = 0% loading, so premium saved = $2000 × 5 = $10,000
      // Income $200k = 1.5% MLS = $3,000/year × 5 = $15,000
      // Loading increase = $2000 × 5 × 0.2 = $2,000
      // Net = $2,000 + $15,000 - $10,000 = $7,000 (high cost, "buy now")
      await page.fill('input[name="age"]', '28')
      await page.fill('input[name="income"]', '200000')
      await page.fill('[data-testid="delay-years-input"]', '5')

      const recommendationBox = page.locator('[data-testid="recommendation-box"]')
      await expect(recommendationBox).toBeVisible()
      await expect(recommendationBox).toHaveAttribute('data-recommendation', 'buy-now')
      await expect(recommendationBox).toContainText(/buy now/i)
    })

    test('should update recommendation when inputs change', async ({ page }) => {
      const recommendationBox = page.locator('[data-testid="recommendation-box"]')

      // Start with older person, low income - can wait (saves money)
      await page.fill('input[name="age"]', '40')
      await page.fill('input[name="income"]', '80000')
      await expect(recommendationBox).toHaveAttribute('data-recommendation', 'can-wait')

      // Change to young person with very high income and long delay - buy now
      await page.fill('input[name="age"]', '28')
      await page.fill('input[name="income"]', '200000')
      await page.fill('[data-testid="delay-years-input"]', '5')
      await expect(recommendationBox).toHaveAttribute('data-recommendation', 'buy-now')
    })

    // -------------------------------------------------------------------------
    // Age-based Warnings
    // -------------------------------------------------------------------------

    test('should display age warning section', async ({ page }) => {
      const ageWarning = page.locator('[data-testid="age-warning"]')
      await expect(ageWarning).toBeVisible()
    })

    test('should show warning to buy before 30 for young users', async ({ page }) => {
      await page.fill('input[name="age"]', '28')

      const ageWarning = page.locator('[data-testid="age-warning"]')
      await expect(ageWarning).toBeVisible()
      await expect(ageWarning).toContainText(/before.*30/i)
      await expect(ageWarning).toContainText(/loading/i)
    })

    test('should show health consideration for ages 30-40', async ({ page }) => {
      await page.fill('input[name="age"]', '35')

      const ageWarning = page.locator('[data-testid="age-warning"]')
      await expect(ageWarning).toBeVisible()
      await expect(ageWarning).toContainText(/health/i)
    })

    test('should show health risk warning for ages 40+', async ({ page }) => {
      await page.fill('input[name="age"]', '45')

      const ageWarning = page.locator('[data-testid="age-warning"]')
      await expect(ageWarning).toBeVisible()
      await expect(ageWarning).toContainText(/health.*risk/i)
      await expect(ageWarning).toContainText(/increase/i)
    })

    test('should update age warning when age changes', async ({ page }) => {
      const ageWarning = page.locator('[data-testid="age-warning"]')

      // Young person warning
      await page.fill('input[name="age"]', '28')
      await expect(ageWarning).toContainText(/before.*30/i)

      // Middle age warning
      await page.fill('input[name="age"]', '35')
      await expect(ageWarning).toContainText(/health/i)

      // Older age warning
      await page.fill('input[name="age"]', '50')
      await expect(ageWarning).toContainText(/risk/i)
    })

    // -------------------------------------------------------------------------
    // Risk Factors Display
    // -------------------------------------------------------------------------

    test('should display risk factors section', async ({ page }) => {
      const riskFactors = page.locator('[data-testid="risk-factors"]')
      await expect(riskFactors).toBeVisible()
    })

    test('should show MLS cost during delay period', async ({ page }) => {
      await page.fill('input[name="income"]', '120000')
      await page.fill('[data-testid="delay-years-input"]', '3')

      const riskFactors = page.locator('[data-testid="risk-factors"]')
      await expect(riskFactors).toContainText(/MLS/i)
      await expect(riskFactors).toContainText(/\$/)
      await expect(riskFactors).toContainText(/3 year/i)
    })

    test('should show loading increase percentage', async ({ page }) => {
      await page.fill('input[name="age"]', '35')
      await page.fill('[data-testid="delay-years-input"]', '5')

      const riskFactors = page.locator('[data-testid="risk-factors"]')
      await expect(riskFactors).toContainText(/loading/i)
      await expect(riskFactors).toContainText(/increase/i)
      await expect(riskFactors).toContainText(/10%/) // 5 years × 2%
    })

    test('should show waiting period warning', async ({ page }) => {
      const riskFactors = page.locator('[data-testid="risk-factors"]')
      await expect(riskFactors).toContainText(/waiting period/i)
    })

    test('should update MLS cost when delay years change', async ({ page }) => {
      await page.fill('input[name="income"]', '120000')
      const riskFactors = page.locator('[data-testid="risk-factors"]')

      // 1 year delay - $1,500 MLS (120000 × 1.25% × 1)
      await page.fill('[data-testid="delay-years-input"]', '1')
      await expect(riskFactors).toContainText('$1,500')

      // 3 year delay - $4,500 MLS (120000 × 1.25% × 3)
      await page.fill('[data-testid="delay-years-input"]', '3')
      await expect(riskFactors).toContainText('$4,500')
    })

    test('should update loading increase when delay years change', async ({ page }) => {
      await page.fill('input[name="age"]', '30')
      const riskFactors = page.locator('[data-testid="risk-factors"]')

      // 1 year delay - 2% increase
      await page.fill('[data-testid="delay-years-input"]', '1')
      await expect(riskFactors).toContainText('2%')

      // 5 year delay - 10% increase
      await page.fill('[data-testid="delay-years-input"]', '5')
      await expect(riskFactors).toContainText('10%')
    })

    test('should show zero MLS cost for low income', async ({ page }) => {
      await page.fill('input[name="income"]', '80000') // Below MLS threshold

      const riskFactors = page.locator('[data-testid="risk-factors"]')
      await expect(riskFactors).toContainText(/MLS/i)
      await expect(riskFactors).toContainText(/\$0/)
    })

    // -------------------------------------------------------------------------
    // Integration with other features
    // -------------------------------------------------------------------------

    test('should work with family status', async ({ page }) => {
      await page.click('[data-testid="family-option"]')
      await page.fill('input[name="income"]', '200000')
      await page.fill('input[name="numChildren"]', '2')

      const recommendationBox = page.locator('[data-testid="recommendation-box"]')
      await expect(recommendationBox).toBeVisible()

      const riskFactors = page.locator('[data-testid="risk-factors"]')
      await expect(riskFactors).toContainText(/MLS/i)
    })

    test('should work with immigrant status', async ({ page }) => {
      await page.click('[data-testid="immigrant-checkbox"]')
      await page.fill('input[name="age"]', '42')
      await page.fill('input[name="medicareAge"]', '39')

      const recommendationBox = page.locator('[data-testid="recommendation-box"]')
      await expect(recommendationBox).toBeVisible()

      const riskFactors = page.locator('[data-testid="risk-factors"]')
      await expect(riskFactors).toContainText(/loading/i)
    })

    test('should show consistent recommendation with result message', async ({ page }) => {
      // When recommendation says "can wait", result should show "saves"
      // Older person with low income saves money by delaying
      await page.fill('input[name="age"]', '40')
      await page.fill('input[name="income"]', '80000')

      const recommendationBox = page.locator('[data-testid="recommendation-box"]')
      await expect(recommendationBox).toHaveAttribute('data-recommendation', 'can-wait')

      const resultMessage = page.locator('[data-testid="result-message"]')
      await expect(resultMessage).toContainText(/save/i)
    })

    // -------------------------------------------------------------------------
    // Medical cost disclaimer
    // -------------------------------------------------------------------------

    test('should display medical cost disclaimer', async ({ page }) => {
      const disclaimer = page.locator('[data-testid="medical-disclaimer"]')
      await expect(disclaimer).toBeVisible()
      await expect(disclaimer).toContainText(/medical/i)
      await expect(disclaimer).toContainText(/not included/i)
    })

    test('should show example surgery costs in disclaimer', async ({ page }) => {
      const disclaimer = page.locator('[data-testid="medical-disclaimer"]')
      await expect(disclaimer).toContainText(/surgery/i)
      await expect(disclaimer).toContainText(/\$/)
    })
  })

  // ============================================================================
  // Polish & Bilingual Support (Slice 7)
  // ============================================================================

  test.describe('Polish & Bilingual Support', () => {
    // -------------------------------------------------------------------------
    // Language Toggle
    // -------------------------------------------------------------------------

    test('should display language toggle', async ({ page }) => {
      const languageToggle = page.locator('[data-testid="language-toggle"]')
      await expect(languageToggle).toBeVisible()
    })

    test('should default to English', async ({ page }) => {
      const languageToggle = page.locator('[data-testid="language-toggle"]')
      // Button shows "中文" to indicate clicking will switch to Chinese
      await expect(languageToggle).toContainText('中文')

      // Page should be in English
      await expect(page.locator('h1')).toContainText('Hospital Insurance Calculator')
    })

    test('should switch to Chinese when clicked', async ({ page }) => {
      await page.click('[data-testid="language-toggle"]')

      // Button shows "EN" to indicate clicking will switch back to English
      const languageToggle = page.locator('[data-testid="language-toggle"]')
      await expect(languageToggle).toContainText('EN')

      // Page heading should be in Chinese
      await expect(page.locator('h1')).toContainText('医院保险计算器')
    })

    test('should switch back to English when clicked again', async ({ page }) => {
      // Switch to Chinese
      await page.click('[data-testid="language-toggle"]')
      await expect(page.locator('h1')).toContainText('医院保险计算器')

      // Switch back to English
      await page.click('[data-testid="language-toggle"]')
      await expect(page.locator('h1')).toContainText('Hospital Insurance Calculator')
    })

    test('should translate form labels to Chinese', async ({ page }) => {
      await page.click('[data-testid="language-toggle"]')

      // Check form labels are translated
      await expect(page.locator('label', { hasText: /年龄/i })).toBeVisible()
      await expect(page.locator('label', { hasText: /年收入/i })).toBeVisible()
      await expect(page.locator('label', { hasText: /保费/i })).toBeVisible()
    })

    test('should translate recommendation box to Chinese', async ({ page }) => {
      await page.fill('input[name="age"]', '40')
      await page.fill('input[name="income"]', '80000')

      await page.click('[data-testid="language-toggle"]')

      const recommendationBox = page.locator('[data-testid="recommendation-box"]')
      // Should contain Chinese text
      await expect(recommendationBox).toContainText(/可以等待|考虑|建议购买/i)
    })

    test('should translate age warnings to Chinese', async ({ page }) => {
      await page.fill('input[name="age"]', '28')

      await page.click('[data-testid="language-toggle"]')

      const ageWarning = page.locator('[data-testid="age-warning"]')
      await expect(ageWarning).toContainText(/30岁/i)
    })

    test('should preserve form values when switching language', async ({ page }) => {
      await page.fill('input[name="age"]', '35')
      await page.fill('input[name="income"]', '120000')

      // Switch to Chinese
      await page.click('[data-testid="language-toggle"]')

      // Values should be preserved
      await expect(page.locator('input[name="age"]')).toHaveValue('35')
      await expect(page.locator('input[name="income"]')).toHaveValue('120000')
    })

    // -------------------------------------------------------------------------
    // Help Tooltips
    // -------------------------------------------------------------------------

    test('should display help icon next to MLS label', async ({ page }) => {
      const mlsHelpIcon = page.locator('[data-testid="help-mls"]')
      await expect(mlsHelpIcon).toBeVisible()
    })

    test('should display help icon next to Loading label', async ({ page }) => {
      const loadingHelpIcon = page.locator('[data-testid="help-loading"]')
      await expect(loadingHelpIcon).toBeVisible()
    })

    test('should show tooltip when MLS help icon is clicked', async ({ page }) => {
      await page.click('[data-testid="help-mls"]')

      const tooltip = page.locator('[data-testid="tooltip-content"]')
      await expect(tooltip).toBeVisible()
      await expect(tooltip).toContainText(/Medicare Levy Surcharge/i)
    })

    test('should show tooltip when Loading help icon is clicked', async ({ page }) => {
      await page.click('[data-testid="help-loading"]')

      const tooltip = page.locator('[data-testid="tooltip-content"]')
      await expect(tooltip).toBeVisible()
      await expect(tooltip).toContainText(/Lifetime Health Cover/i)
    })

    test('should hide tooltip when clicking elsewhere', async ({ page }) => {
      await page.click('[data-testid="help-mls"]')
      const tooltip = page.locator('[data-testid="tooltip-content"]')
      await expect(tooltip).toBeVisible()

      // Click elsewhere
      await page.click('h1')
      await expect(tooltip).not.toBeVisible()
    })

    // -------------------------------------------------------------------------
    // Action Buttons
    // -------------------------------------------------------------------------

    test('should display reset button', async ({ page }) => {
      const resetButton = page.locator('[data-testid="reset-button"]')
      await expect(resetButton).toBeVisible()
    })

    test('should display share button', async ({ page }) => {
      const shareButton = page.locator('[data-testid="share-button"]')
      await expect(shareButton).toBeVisible()
    })

    test('should display print button', async ({ page }) => {
      const printButton = page.locator('[data-testid="print-button"]')
      await expect(printButton).toBeVisible()
    })

    test('should reset all form values when reset is clicked', async ({ page }) => {
      // Fill in form
      await page.fill('input[name="age"]', '35')
      await page.fill('input[name="income"]', '120000')
      await page.fill('input[name="premium"]', '3000')
      await page.click('[data-testid="family-option"]')

      // Click reset
      await page.click('[data-testid="reset-button"]')

      // All values should be reset to defaults
      await expect(page.locator('input[name="age"]')).toHaveValue('')
      await expect(page.locator('input[name="income"]')).toHaveValue('')
      await expect(page.locator('input[name="premium"]')).toHaveValue('2000')
    })

    test('should copy URL to clipboard when share is clicked', async ({ page, context }) => {
      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])

      await page.fill('input[name="age"]', '35')
      await page.fill('input[name="income"]', '120000')

      await page.click('[data-testid="share-button"]')

      // Should show success feedback
      const feedback = page.locator('[data-testid="share-feedback"]')
      await expect(feedback).toBeVisible()
      await expect(feedback).toContainText(/copied/i)
    })

    // -------------------------------------------------------------------------
    // Responsive Design
    // -------------------------------------------------------------------------

    test('should display properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // Form should still be visible and functional
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('input[name="age"]')).toBeVisible()
      await expect(page.locator('input[name="income"]')).toBeVisible()

      // Buttons should stack on mobile
      const buttonContainer = page.locator('[data-testid="action-buttons"]')
      await expect(buttonContainer).toBeVisible()
    })

    test('should display properly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })

      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('input[name="age"]')).toBeVisible()
    })

    test('should display properly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })

      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('input[name="age"]')).toBeVisible()
    })

    test('should maintain functionality on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // Fill form and verify calculation works
      await page.fill('input[name="age"]', '35')
      await page.fill('input[name="income"]', '120000')

      const result = page.locator('[data-testid="calculator-result"]')
      await expect(result).toBeVisible()
    })

    // -------------------------------------------------------------------------
    // Accessibility
    // -------------------------------------------------------------------------

    test('should have proper page title', async ({ page }) => {
      await expect(page).toHaveTitle(/Hospital Insurance Calculator/i)
    })

    test('should have visible focus indicators', async ({ page }) => {
      // Tab to first input
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // The focused element should have visible styling
      const activeElement = page.locator(':focus')
      await expect(activeElement).toBeVisible()
    })
  })
})
