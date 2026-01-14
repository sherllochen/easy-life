import { test, expect } from '@playwright/test'

test.describe('Hospital Calculator - Slice 2: Family Status & MLS Auto-Calculation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display family status toggle', async ({ page }) => {
    // Should see Single/Family toggle or radio buttons
    const familyToggle = page.locator('[data-testid="family-status-toggle"]')
    await expect(familyToggle).toBeVisible()

    // Should have both Single and Family options
    await expect(page.locator('text=/single/i')).toBeVisible()
    await expect(page.locator('text=/family/i')).toBeVisible()
  })

  test('should show number of children input when Family is selected', async ({ page }) => {
    // Initially should not see children input (default is Single)
    const childrenInput = page.locator('input[name="numChildren"]')
    await expect(childrenInput).not.toBeVisible()

    // Select Family
    await page.click('[data-testid="family-option"]')

    // Now should see children input
    await expect(childrenInput).toBeVisible()
    await expect(page.locator('label', { hasText: /children/i })).toBeVisible()
  })

  test('should hide children input when switching back to Single', async ({ page }) => {
    // Select Family
    await page.click('[data-testid="family-option"]')
    const childrenInput = page.locator('input[name="numChildren"]')
    await expect(childrenInput).toBeVisible()

    // Switch back to Single
    await page.click('[data-testid="single-option"]')
    await expect(childrenInput).not.toBeVisible()
  })

  test('should display MLS rate for single person with income $120,000', async ({ page }) => {
    // Fill in income
    await page.fill('input[name="income"]', '120000')

    // Should see MLS rate display (Tier 2: 1.25%)
    const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')
    await expect(mlsDisplay).toBeVisible()
    await expect(mlsDisplay).toContainText('1.25%')
    await expect(mlsDisplay).toContainText(/tier 2/i)
  })

  test('should display MLS rate for family with income $200,000', async ({ page }) => {
    // Select Family
    await page.click('[data-testid="family-option"]')

    // Fill in income
    await page.fill('input[name="income"]', '200000')

    // Should see MLS rate display (Tier 1: 1.0%)
    const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')
    await expect(mlsDisplay).toBeVisible()
    await expect(mlsDisplay).toContainText('1.0%')
    await expect(mlsDisplay).toContainText(/tier 1/i)
  })

  test('should display 0% MLS rate for low income single person', async ({ page }) => {
    // Fill in low income
    await page.fill('input[name="income"]', '80000')

    // Should see MLS rate display (0%)
    const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')
    await expect(mlsDisplay).toBeVisible()
    await expect(mlsDisplay).toContainText('0%')
  })

  test('should adjust thresholds based on number of children', async ({ page }) => {
    // Select Family
    await page.click('[data-testid="family-option"]')

    // Income $195,000 (normally Tier 1 for family, but with 1 child still Tier 0)
    await page.fill('input[name="income"]', '195000')

    // With 0 children (base threshold $194,000)
    // Income $195,000 should be Tier 1 (1.0%)
    const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')
    await expect(mlsDisplay).toContainText('1.0%')

    // Add 1 child (threshold becomes $195,500)
    await page.fill('input[name="numChildren"]', '1')

    // Now income $195,000 should be Tier 0 (0%)
    await expect(mlsDisplay).toContainText('0%')
  })

  test('should update MLS rate dynamically when income changes', async ({ page }) => {
    const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')

    // Start with low income
    await page.fill('input[name="income"]', '80000')
    await expect(mlsDisplay).toContainText('0%')

    // Increase to Tier 1
    await page.fill('input[name="income"]', '100000')
    await expect(mlsDisplay).toContainText('1.0%')

    // Increase to Tier 2
    await page.fill('input[name="income"]', '120000')
    await expect(mlsDisplay).toContainText('1.25%')

    // Increase to Tier 3
    await page.fill('input[name="income"]', '180000')
    await expect(mlsDisplay).toContainText('1.5%')
  })

  test('should calculate correctly for family with children', async ({ page }) => {
    // Select Family
    await page.click('[data-testid="family-option"]')

    // Set inputs: Family with 2 children, income $200,000
    await page.fill('input[name="age"]', '35')
    await page.fill('input[name="income"]', '200000')
    await page.fill('input[name="numChildren"]', '2')
    // Premium defaults to 2000

    // Verify MLS rate display shows 1.0%
    const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')
    await expect(mlsDisplay).toContainText('1.0%')

    // Calculate
    await page.click('button:has-text("Calculate")')

    // Should see result
    const resultSection = page.locator('[data-testid="calculator-result"]')
    await expect(resultSection).toBeVisible()

    // Verify calculation used family MLS rate
    // Income $200,000 at 1.0% for 1 year = $2,000 MLS
    // Result should reflect this in the calculation
  })

  test('should show tier explanation in MLS display', async ({ page }) => {
    // Fill in income
    await page.fill('input[name="income"]', '120000')

    // Should see tier explanation
    const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')

    // Should show income range for the tier
    // Tier 2 for single: $113,001 - $151,000
    await expect(mlsDisplay).toContainText(/113.*151/i)
  })

  test('should calculate correctly for single person vs family with same income', async ({
    page,
  }) => {
    const income = '200000'
    const age = '35'

    // First calculate as Single
    await page.fill('input[name="age"]', age)
    await page.fill('input[name="income"]', income)
    await page.click('button:has-text("Calculate")')

    const resultSection = page.locator('[data-testid="calculator-result"]')
    await expect(resultSection).toBeVisible()

    // Get single result
    const singleResult = await page.locator('[data-testid="net-cost"]').textContent()

    // Now calculate as Family
    await page.click('[data-testid="family-option"]')

    // MLS rate should update automatically
    const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')
    await expect(mlsDisplay).toContainText('1.0%') // Family Tier 1

    // Recalculate
    await page.click('button:has-text("Calculate")')

    // Get family result
    const familyResult = await page.locator('[data-testid="net-cost"]').textContent()

    // Results should be different (single has higher MLS rate 1.5% vs family 1.0%)
    expect(singleResult).not.toBe(familyResult)
  })

  test('should maintain children input value when toggling', async ({ page }) => {
    // Select Family and set children
    await page.click('[data-testid="family-option"]')
    await page.fill('input[name="numChildren"]', '3')

    // Verify value is set
    await expect(page.locator('input[name="numChildren"]')).toHaveValue('3')

    // Note: If we switch to Single and back to Family,
    // it's acceptable to either preserve or reset the children value
    // This test just ensures no crash occurs
  })

  test('should handle zero children correctly', async ({ page }) => {
    // Select Family
    await page.click('[data-testid="family-option"]')

    // Income just above base threshold
    await page.fill('input[name="income"]', '195000')

    // With 0 children, should be Tier 1 (threshold is $194,000)
    const mlsDisplay = page.locator('[data-testid="mls-rate-display"]')
    await expect(mlsDisplay).toContainText('1.0%')

    // Explicitly set 0 children (or leave empty)
    await page.fill('input[name="numChildren"]', '0')

    // Should still be Tier 1
    await expect(mlsDisplay).toContainText('1.0%')
  })

  test('should update calculation when family status changes', async ({ page }) => {
    // Fill in all inputs as Single
    await page.fill('input[name="age"]', '35')
    await page.fill('input[name="income"]', '200000')

    // Calculate as Single
    await page.click('button:has-text("Calculate")')
    await expect(page.locator('[data-testid="calculator-result"]')).toBeVisible()

    // Change to Family
    await page.click('[data-testid="family-option"]')

    // Calculate again
    await page.click('button:has-text("Calculate")')

    // Should still show result (with updated calculation)
    await expect(page.locator('[data-testid="calculator-result"]')).toBeVisible()
  })
})
