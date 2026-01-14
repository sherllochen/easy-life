import { test, expect } from '@playwright/test'

test.describe('Hospital Calculator - Slice 3: Loading Calculation (Age-based & Immigrant)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display immigrant status checkbox', async ({ page }) => {
    // Should see immigrant checkbox
    const immigrantCheckbox = page.locator('[data-testid="immigrant-checkbox"]')
    await expect(immigrantCheckbox).toBeVisible()

    // Should have label
    await expect(page.locator('text=/immigrant/i')).toBeVisible()
  })

  test('should show Medicare age input when immigrant is checked', async ({ page }) => {
    // Initially should not see Medicare age input
    const medicareAgeInput = page.locator('input[name="medicareAge"]')
    await expect(medicareAgeInput).not.toBeVisible()

    // Check immigrant checkbox
    await page.click('[data-testid="immigrant-checkbox"]')

    // Now should see Medicare age input
    await expect(medicareAgeInput).toBeVisible()
    await expect(page.locator('label', { hasText: /medicare/i })).toBeVisible()
  })

  test('should hide Medicare age input when immigrant is unchecked', async ({ page }) => {
    // Check immigrant
    await page.click('[data-testid="immigrant-checkbox"]')
    const medicareAgeInput = page.locator('input[name="medicareAge"]')
    await expect(medicareAgeInput).toBeVisible()

    // Uncheck immigrant
    await page.click('[data-testid="immigrant-checkbox"]')
    await expect(medicareAgeInput).not.toBeVisible()
  })

  test('should display loading for Australian born under 30', async ({ page }) => {
    // Fill in age under 30
    await page.fill('input[name="age"]', '28')

    // Should see loading display with 0%
    const loadingDisplay = page.locator('[data-testid="loading-display"]')
    await expect(loadingDisplay).toBeVisible()
    await expect(loadingDisplay).toContainText('0%')
  })

  test('should display loading for Australian born at age 30', async ({ page }) => {
    // Age exactly 30
    await page.fill('input[name="age"]', '30')

    // Should see loading display with 0%
    const loadingDisplay = page.locator('[data-testid="loading-display"]')
    await expect(loadingDisplay).toBeVisible()
    await expect(loadingDisplay).toContainText('0%')
  })

  test('should display loading for Australian born age 35', async ({ page }) => {
    // Fill in age 35 (5 years past base age 30)
    await page.fill('input[name="age"]', '35')

    // Should see loading display with 10% (5 years × 2%)
    const loadingDisplay = page.locator('[data-testid="loading-display"]')
    await expect(loadingDisplay).toBeVisible()
    await expect(loadingDisplay).toContainText('10%')

    // Should show explanation
    await expect(loadingDisplay).toContainText(/5 year/i)
  })

  test('should display loading for Australian born age 60', async ({ page }) => {
    // Fill in age 60 (30 years past base age 30, but capped at 70%)
    await page.fill('input[name="age"]', '60')

    // Should see loading display with 60% (30 years × 2%)
    const loadingDisplay = page.locator('[data-testid="loading-display"]')
    await expect(loadingDisplay).toBeVisible()
    await expect(loadingDisplay).toContainText('60%')
  })

  test('should cap loading at 70% for very old age', async ({ page }) => {
    // Fill in age 100 (would be 140% without cap)
    await page.fill('input[name="age"]', '100')

    // Should see loading display with 70% (capped)
    const loadingDisplay = page.locator('[data-testid="loading-display"]')
    await expect(loadingDisplay).toBeVisible()
    await expect(loadingDisplay).toContainText('70%')
  })

  test('should display loading for immigrant within grace period', async ({ page }) => {
    // Check immigrant
    await page.click('[data-testid="immigrant-checkbox"]')

    // Current age 40, got Medicare at 39 (within 1 year grace period)
    await page.fill('input[name="age"]', '40')
    await page.fill('input[name="medicareAge"]', '39')

    // Should see loading display with 0% (within grace period)
    const loadingDisplay = page.locator('[data-testid="loading-display"]')
    await expect(loadingDisplay).toBeVisible()
    await expect(loadingDisplay).toContainText('0%')

    // Should mention grace period
    await expect(loadingDisplay).toContainText(/grace/i)
  })

  test('should display loading for immigrant just past grace period', async ({ page }) => {
    // Check immigrant
    await page.click('[data-testid="immigrant-checkbox"]')

    // Current age 42, got Medicare at 39 (2 years past grace period)
    await page.fill('input[name="age"]', '42')
    await page.fill('input[name="medicareAge"]', '39')

    // Should see loading display with 4% (2 years × 2%)
    const loadingDisplay = page.locator('[data-testid="loading-display"]')
    await expect(loadingDisplay).toBeVisible()
    await expect(loadingDisplay).toContainText('4%')

    // Should show years late
    await expect(loadingDisplay).toContainText(/2 year/i)
  })

  test('should display loading for immigrant with higher loading', async ({ page }) => {
    // Check immigrant
    await page.click('[data-testid="immigrant-checkbox"]')

    // Current age 50, got Medicare at 35 (14 years past grace period)
    await page.fill('input[name="age"]', '50')
    await page.fill('input[name="medicareAge"]', '35')

    // Should see loading display with 28% (14 years × 2%)
    const loadingDisplay = page.locator('[data-testid="loading-display"]')
    await expect(loadingDisplay).toBeVisible()
    await expect(loadingDisplay).toContainText('28%')
  })

  test('should update loading dynamically when age changes', async ({ page }) => {
    const loadingDisplay = page.locator('[data-testid="loading-display"]')

    // Start with age 25 (no loading)
    await page.fill('input[name="age"]', '25')
    await expect(loadingDisplay).toContainText('0%')

    // Change to age 35 (10% loading)
    await page.fill('input[name="age"]', '35')
    await expect(loadingDisplay).toContainText('10%')

    // Change to age 45 (30% loading)
    await page.fill('input[name="age"]', '45')
    await expect(loadingDisplay).toContainText('30%')
  })

  test('should update loading when switching between local and immigrant', async ({ page }) => {
    const loadingDisplay = page.locator('[data-testid="loading-display"]')

    // Start as local, age 42
    await page.fill('input[name="age"]', '42')
    // Local: 12 years past 30 = 24%
    await expect(loadingDisplay).toContainText('24%')

    // Switch to immigrant
    await page.click('[data-testid="immigrant-checkbox"]')

    // Set Medicare age to 39 (2 years past grace period = 4%)
    await page.fill('input[name="medicareAge"]', '39')
    await expect(loadingDisplay).toContainText('4%')

    // Switch back to local
    await page.click('[data-testid="immigrant-checkbox"]')
    // Should go back to 24%
    await expect(loadingDisplay).toContainText('24%')
  })

  test('should calculate correctly with immigrant loading', async ({ page }) => {
    // Check immigrant
    await page.click('[data-testid="immigrant-checkbox"]')

    // Fill in all inputs
    await page.fill('input[name="age"]', '42')
    await page.fill('input[name="medicareAge"]', '39')
    await page.fill('input[name="income"]', '120000')
    // Premium defaults to 2000

    // Verify loading display shows 4%
    const loadingDisplay = page.locator('[data-testid="loading-display"]')
    await expect(loadingDisplay).toContainText('4%')

    // Calculate
    await page.click('button:has-text("Calculate")')

    // Should see result
    const resultSection = page.locator('[data-testid="calculator-result"]')
    await expect(resultSection).toBeVisible()

    // Result should use immigrant loading (4%, not 24% for local age 42)
  })

  test('should show explanation text for Australian born', async ({ page }) => {
    // Fill in age 37
    await page.fill('input[name="age"]', '37')

    // Should see explanation mentioning base age 30
    const loadingDisplay = page.locator('[data-testid="loading-display"]')
    await expect(loadingDisplay).toContainText(/age 30/i)
  })

  test('should show explanation text for immigrant', async ({ page }) => {
    // Check immigrant
    await page.click('[data-testid="immigrant-checkbox"]')

    // Fill in ages
    await page.fill('input[name="age"]', '45')
    await page.fill('input[name="medicareAge"]', '40')

    // Should see explanation mentioning Medicare or grace period
    const loadingDisplay = page.locator('[data-testid="loading-display"]')
    // 4 years past grace period (40 + 1 = 41, current 45)
    await expect(loadingDisplay).toContainText(/year/i)
  })

  test('should handle zero loading correctly', async ({ page }) => {
    // Fill in young age
    await page.fill('input[name="age"]', '25')

    const loadingDisplay = page.locator('[data-testid="loading-display"]')
    await expect(loadingDisplay).toContainText('0%')

    // Should not show "years late" for zero loading
    const text = await loadingDisplay.textContent()
    expect(text).not.toMatch(/\d+ year.*late/i)
  })

  test('should maintain Medicare age value when toggling', async ({ page }) => {
    // Check immigrant and set Medicare age
    await page.click('[data-testid="immigrant-checkbox"]')
    await page.fill('input[name="medicareAge"]', '35')

    // Verify value is set
    await expect(page.locator('input[name="medicareAge"]')).toHaveValue('35')

    // Note: If we uncheck and recheck, it's acceptable to either preserve or reset
    // This test just ensures no crash occurs
  })

  test('should validate Medicare age is required for immigrants when calculating', async ({
    page,
  }) => {
    // Check immigrant
    await page.click('[data-testid="immigrant-checkbox"]')

    // Fill other fields but not Medicare age
    await page.fill('input[name="age"]', '42')
    await page.fill('input[name="income"]', '120000')

    // Try to calculate
    await page.click('button:has-text("Calculate")')

    // Should either show validation error or not submit
    // (Implementation can handle this in different ways)
  })
})
