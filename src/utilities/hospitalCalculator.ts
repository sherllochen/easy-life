/**
 * Hospital Insurance Calculator - Core Logic
 *
 * Based on: docs/hospital_insurance_cost_formula.md
 * Formula: Net Additional Cost = P × X × 0.2 + Income × MLS Rate × X - P × (1 + L₀) × X
 */

// ============================================================================
// Types
// ============================================================================

export interface MlsRateInput {
  income: number
  isFamily: boolean
  numChildren?: number // Number of children beyond first 2
}

export interface LoadingInput {
  age: number
  isImmigrant: boolean
  medicareAge?: number // Age when got Medicare (required if isImmigrant = true)
}

export interface CalculationInput {
  age: number
  income: number
  premium: number
  delayYears: number
  isFamily: boolean
  isImmigrant: boolean
  medicareAge?: number
  numChildren?: number
}

export interface CalculationResult {
  netCost: number
  loadingCost: number
  mlsCost: number
  savedPremium: number
  currentLoading: number
  mlsRate: number
}

export interface BreakEvenInput {
  premium: number
  currentLoading: number
  mlsRate: number
}

export interface ValidationInput {
  age: number
  income: number
  premium: number
  delayYears: number
}

// ============================================================================
// MLS Rate Calculation
// ============================================================================

/**
 * Calculate Medicare Levy Surcharge (MLS) rate based on income and family status
 *
 * 2024-25 Financial Year thresholds:
 * Single:
 *   ≤ $97,000: 0%
 *   $97,001 - $113,000: 1.0%
 *   $113,001 - $151,000: 1.25%
 *   > $151,000: 1.5%
 *
 * Family:
 *   ≤ $194,000: 0%
 *   $194,001 - $226,000: 1.0%
 *   $226,001 - $302,000: 1.25%
 *   > $302,000: 1.5%
 *   (Add $1,500 per child after first 2)
 */
export function calculateMlsRate(input: MlsRateInput): number {
  const { income, isFamily, numChildren = 0 } = input

  // Calculate threshold adjustments for children
  const childAdjustment = numChildren * 1500

  if (isFamily) {
    const tier0 = 194000 + childAdjustment
    const tier1 = 226000 + childAdjustment
    const tier2 = 302000 + childAdjustment

    if (income <= tier0) return 0
    if (income <= tier1) return 0.01
    if (income <= tier2) return 0.0125
    return 0.015
  } else {
    // Single person thresholds
    if (income <= 97000) return 0
    if (income <= 113000) return 0.01
    if (income <= 151000) return 0.0125
    return 0.015
  }
}

/**
 * Simplified MLS rate function (for backwards compatibility)
 */
export function determineMlsRate(income: number, isFamily: boolean, numChildren = 0): number {
  return calculateMlsRate({ income, isFamily, numChildren })
}

// ============================================================================
// Loading Calculation
// ============================================================================

/**
 * Calculate current Lifetime Health Cover (LHC) Loading
 *
 * Australian born / childhood immigrant:
 *   Base age: 30 (July 1st after 31st birthday)
 *   Loading: 2% per year after base age
 *   Maximum: 70%
 *
 * Adult immigrant:
 *   Base age: Medicare age + 1 year (12-month grace period)
 *   Loading: 2% per year after grace period
 *   Maximum: 70%
 */
export function calculateCurrentLoading(input: LoadingInput): number {
  const { age, isImmigrant, medicareAge } = input

  let baseAge: number

  if (isImmigrant) {
    if (medicareAge === undefined) {
      throw new Error('medicareAge is required for immigrants')
    }
    // Base age is Medicare age + 1 year grace period
    baseAge = medicareAge + 1
  } else {
    // Australian born or childhood immigrant
    baseAge = 30
  }

  const yearsLate = Math.max(0, age - baseAge)
  const loading = Math.min(yearsLate * 0.02, 0.7) // Cap at 70%

  return loading
}

// ============================================================================
// Core Formula Calculation
// ============================================================================

/**
 * Calculate the net additional cost of delaying insurance purchase
 *
 * Formula: Net Additional Cost = P × X × 0.2 + Income × MLS Rate × X - P × (1 + L₀) × X
 *
 * Where:
 *   P = Base annual premium
 *   X = Delay years
 *   L₀ = Current loading percentage
 *   MLS Rate = Medicare Levy Surcharge rate
 *
 * Components:
 *   1. P × X × 0.2: Future loading increase cost
 *   2. Income × MLS Rate × X: MLS paid during delay period
 *   3. -P × (1 + L₀) × X: Premium saved during delay period (negative)
 *
 * Result:
 *   Positive: Delaying costs more money → Buy now
 *   Negative: Delaying saves money → Can wait (pure economic perspective)
 *   Zero: Break-even point
 */
export function calculateDelayCost(input: CalculationInput): CalculationResult {
  const { age, income, premium, delayYears, isFamily, isImmigrant, medicareAge, numChildren } =
    input

  // Calculate MLS rate
  const mlsRate = calculateMlsRate({ income, isFamily, numChildren })

  // Calculate current loading
  const currentLoading = calculateCurrentLoading({
    age,
    isImmigrant,
    medicareAge,
  })

  // Apply formula components
  const X = delayYears
  const P = premium
  const L0 = currentLoading

  const loadingCost = P * X * 0.2
  const mlsCost = income * mlsRate * X
  const savedPremium = P * (1 + L0) * X
  const netCost = loadingCost + mlsCost - savedPremium

  return {
    netCost,
    loadingCost,
    mlsCost,
    savedPremium,
    currentLoading,
    mlsRate,
  }
}

// ============================================================================
// Break-even Calculation
// ============================================================================

/**
 * Calculate break-even income level
 *
 * Formula: Income = P × (1 + L₀ - 0.2) / MLS Rate
 *
 * This is the income level at which immediate purchase becomes economical.
 * Above this income, delaying costs money.
 * Below this income, delaying saves money (pure economic perspective).
 */
export function calculateBreakEvenIncome(input: BreakEvenInput): number {
  const { premium, currentLoading, mlsRate } = input

  if (mlsRate === 0) {
    // No MLS, so never economical to buy from pure cost perspective
    return Infinity
  }

  const breakEvenIncome = (premium * (1 + currentLoading - 0.2)) / mlsRate

  return breakEvenIncome
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate input parameters
 *
 * Returns array of error messages (empty if all valid)
 */
export function validateInputs(input: ValidationInput): string[] {
  const errors: string[] = []
  const { age, income, premium, delayYears } = input

  if (age < 18 || age > 100) {
    errors.push('Age must be between 18-100')
  }

  if (income < 0) {
    errors.push('Income cannot be negative')
  }

  if (premium < 500 || premium > 10000) {
    errors.push('Premium should be between $500-$10,000')
  }

  if (delayYears < 0 || delayYears > 30) {
    errors.push('Delay years should be between 0-30')
  }

  return errors
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format currency in Australian dollars
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

/**
 * Format percentage
 */
export function formatPercentage(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`
}
