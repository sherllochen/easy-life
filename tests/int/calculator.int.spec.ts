import { describe, it, expect } from 'vitest'
import type {
  CalculationInput,
  CalculationResult,
  MlsRateInput,
  LoadingInput,
} from '@/utilities/hospitalCalculator'
import {
  calculateMlsRate,
  calculateCurrentLoading,
  calculateDelayCost,
  calculateBreakEvenIncome,
  determineMlsRate,
  validateInputs,
} from '@/utilities/hospitalCalculator'

describe('Hospital Insurance Calculator - Unit Tests', () => {
  describe('calculateMlsRate', () => {
    describe('Single person', () => {
      it('should return 0% for income <= $97,000', () => {
        expect(calculateMlsRate({ income: 50000, isFamily: false })).toBe(0)
        expect(calculateMlsRate({ income: 97000, isFamily: false })).toBe(0)
      })

      it('should return 1.0% for income $97,001 - $113,000', () => {
        expect(calculateMlsRate({ income: 97001, isFamily: false })).toBe(0.01)
        expect(calculateMlsRate({ income: 100000, isFamily: false })).toBe(0.01)
        expect(calculateMlsRate({ income: 113000, isFamily: false })).toBe(0.01)
      })

      it('should return 1.25% for income $113,001 - $151,000', () => {
        expect(calculateMlsRate({ income: 113001, isFamily: false })).toBe(0.0125)
        expect(calculateMlsRate({ income: 120000, isFamily: false })).toBe(0.0125)
        expect(calculateMlsRate({ income: 151000, isFamily: false })).toBe(0.0125)
      })

      it('should return 1.5% for income > $151,000', () => {
        expect(calculateMlsRate({ income: 151001, isFamily: false })).toBe(0.015)
        expect(calculateMlsRate({ income: 180000, isFamily: false })).toBe(0.015)
        expect(calculateMlsRate({ income: 250000, isFamily: false })).toBe(0.015)
      })
    })

    describe('Family', () => {
      it('should return 0% for income <= $194,000', () => {
        expect(calculateMlsRate({ income: 150000, isFamily: true })).toBe(0)
        expect(calculateMlsRate({ income: 194000, isFamily: true })).toBe(0)
      })

      it('should return 1.0% for income $194,001 - $226,000', () => {
        expect(calculateMlsRate({ income: 194001, isFamily: true })).toBe(0.01)
        expect(calculateMlsRate({ income: 200000, isFamily: true })).toBe(0.01)
        expect(calculateMlsRate({ income: 226000, isFamily: true })).toBe(0.01)
      })

      it('should return 1.25% for income $226,001 - $302,000', () => {
        expect(calculateMlsRate({ income: 226001, isFamily: true })).toBe(0.0125)
        expect(calculateMlsRate({ income: 250000, isFamily: true })).toBe(0.0125)
        expect(calculateMlsRate({ income: 302000, isFamily: true })).toBe(0.0125)
      })

      it('should return 1.5% for income > $302,000', () => {
        expect(calculateMlsRate({ income: 302001, isFamily: true })).toBe(0.015)
        expect(calculateMlsRate({ income: 350000, isFamily: true })).toBe(0.015)
      })
    })

    describe('Family with children', () => {
      it('should adjust thresholds by $1,500 per child after first two', () => {
        // Base threshold: $194,000
        // With 1 extra child (3 total): $194,000 + $1,500 = $195,500
        expect(calculateMlsRate({ income: 195000, isFamily: true, numChildren: 1 })).toBe(0)
        expect(calculateMlsRate({ income: 195501, isFamily: true, numChildren: 1 })).toBe(0.01)

        // With 2 extra children (4 total): $194,000 + $3,000 = $197,000
        expect(calculateMlsRate({ income: 197000, isFamily: true, numChildren: 2 })).toBe(0)
        expect(calculateMlsRate({ income: 197001, isFamily: true, numChildren: 2 })).toBe(0.01)
      })
    })
  })

  describe('calculateCurrentLoading', () => {
    describe('Australian born / childhood immigrant', () => {
      it('should return 0% for age < 30', () => {
        expect(calculateCurrentLoading({ age: 25, isImmigrant: false })).toBe(0)
        expect(calculateCurrentLoading({ age: 29, isImmigrant: false })).toBe(0)
      })

      it('should return 0% for age exactly 30', () => {
        expect(calculateCurrentLoading({ age: 30, isImmigrant: false })).toBe(0)
      })

      it('should calculate 2% per year after age 30', () => {
        expect(calculateCurrentLoading({ age: 31, isImmigrant: false })).toBe(0.02)
        expect(calculateCurrentLoading({ age: 35, isImmigrant: false })).toBe(0.1) // 5 years * 2%
        expect(calculateCurrentLoading({ age: 40, isImmigrant: false })).toBe(0.2) // 10 years * 2%
        expect(calculateCurrentLoading({ age: 50, isImmigrant: false })).toBe(0.4) // 20 years * 2%
      })

      it('should cap at 70% maximum', () => {
        expect(calculateCurrentLoading({ age: 65, isImmigrant: false })).toBe(0.7) // 35 years would be 70%
        expect(calculateCurrentLoading({ age: 70, isImmigrant: false })).toBe(0.7) // Cap at 70%
        expect(calculateCurrentLoading({ age: 100, isImmigrant: false })).toBe(0.7)
      })
    })

    describe('Adult immigrant', () => {
      it('should return 0% within 12-month grace period', () => {
        // Got Medicare at age 39, now age 39 (same year)
        expect(
          calculateCurrentLoading({ age: 39, isImmigrant: true, medicareAge: 39 }),
        ).toBe(0)

        // Got Medicare at age 39, now age 40 (within 1 year grace)
        expect(
          calculateCurrentLoading({ age: 40, isImmigrant: true, medicareAge: 39 }),
        ).toBe(0)
      })

      it('should calculate 2% per year after grace period', () => {
        // Got Medicare at 39, base age is 40 (39 + 1 year grace)
        // Age 41 = 1 year late
        expect(
          calculateCurrentLoading({ age: 41, isImmigrant: true, medicareAge: 39 }),
        ).toBe(0.02)

        // Age 42 = 2 years late
        expect(
          calculateCurrentLoading({ age: 42, isImmigrant: true, medicareAge: 39 }),
        ).toBe(0.04)

        // Age 45 = 5 years late
        expect(
          calculateCurrentLoading({ age: 45, isImmigrant: true, medicareAge: 39 }),
        ).toBe(0.1)
      })

      it('should cap at 70% maximum for immigrants too', () => {
        expect(
          calculateCurrentLoading({ age: 75, isImmigrant: true, medicareAge: 39 }),
        ).toBe(0.7)
      })
    })
  })

  describe('calculateDelayCost', () => {
    it('should calculate correctly for Example 1: Young High Earner', () => {
      // Age 28, Income $120,000, Premium $2,000, Delay 2 years
      // Expected: -$200 (saves money)
      const input: CalculationInput = {
        age: 28,
        income: 120000,
        premium: 2000,
        delayYears: 2,
        isFamily: false,
        isImmigrant: false,
      }

      const result = calculateDelayCost(input)

      expect(result.netCost).toBe(-200)
      expect(result.loadingCost).toBe(800) // 2000 × 2 × 0.2
      expect(result.mlsCost).toBe(3000) // 120000 × 1.25% × 2
      expect(result.savedPremium).toBe(4000) // 2000 × 1 × 2
    })

    it('should calculate correctly for Example 2: Immigrant on TR Visa', () => {
      // Age 42, got Medicare at 39, Income $150,000 (family), Delay 3 years
      // Expected: -$5,040 (saves money)
      const input: CalculationInput = {
        age: 42,
        income: 150000,
        premium: 2000,
        delayYears: 3,
        isFamily: true,
        isImmigrant: true,
        medicareAge: 39,
      }

      const result = calculateDelayCost(input)

      expect(result.netCost).toBe(-5040)
      expect(result.loadingCost).toBe(1200) // 2000 × 3 × 0.2
      expect(result.mlsCost).toBe(0) // Income below family threshold
      expect(result.savedPremium).toBe(6240) // 2000 × 1.04 × 3
    })

    it('should calculate correctly for Example 3: High-income Middle-aged', () => {
      // Age 45, Income $180,000, Premium $2,000, Delay 5 years
      // Expected: +$2,500 (costs money)
      const input: CalculationInput = {
        age: 45,
        income: 180000,
        premium: 2000,
        delayYears: 5,
        isFamily: false,
        isImmigrant: false,
      }

      const result = calculateDelayCost(input)

      expect(result.netCost).toBe(2500)
      expect(result.loadingCost).toBe(2000) // 2000 × 5 × 0.2
      expect(result.mlsCost).toBe(13500) // 180000 × 1.5% × 5
      expect(result.savedPremium).toBe(13000) // 2000 × 1.30 × 5
    })

    it('should calculate for 1 year delay', () => {
      const input: CalculationInput = {
        age: 35,
        income: 100000,
        premium: 2000,
        delayYears: 1,
        isFamily: false,
        isImmigrant: false,
      }

      const result = calculateDelayCost(input)

      const expectedLoading = 0.1 // Age 35 = 5 years late = 10%
      const expectedMlsRate = 0.01 // $100k = Tier 1
      const expectedLoadingCost = 2000 * 1 * 0.2 // 400
      const expectedMlsCost = 100000 * expectedMlsRate * 1 // 1000
      const expectedSavedPremium = 2000 * (1 + expectedLoading) * 1 // 2200
      const expectedNetCost = expectedLoadingCost + expectedMlsCost - expectedSavedPremium // -800

      expect(result.currentLoading).toBe(expectedLoading)
      expect(result.mlsRate).toBe(expectedMlsRate)
      expect(result.loadingCost).toBe(expectedLoadingCost)
      expect(result.mlsCost).toBe(expectedMlsCost)
      expect(result.savedPremium).toBe(expectedSavedPremium)
      expect(result.netCost).toBe(expectedNetCost)
    })
  })

  describe('calculateBreakEvenIncome', () => {
    it('should calculate break-even income correctly', () => {
      // From doc: P = $2,000, L₀ = 0%, MLS rate = 1%
      // Break-even = 2000 × (1 + 0 - 0.2) / 0.01 = 2000 × 0.8 / 0.01 = $160,000
      const breakEven = calculateBreakEvenIncome({
        premium: 2000,
        currentLoading: 0,
        mlsRate: 0.01,
      })

      expect(breakEven).toBe(160000)
    })

    it('should calculate break-even with existing loading', () => {
      // P = $2,000, L₀ = 10%, MLS rate = 1%
      // Break-even = 2000 × (1 + 0.1 - 0.2) / 0.01 = 2000 × 0.9 / 0.01 = $180,000
      const breakEven = calculateBreakEvenIncome({
        premium: 2000,
        currentLoading: 0.1,
        mlsRate: 0.01,
      })

      expect(breakEven).toBeCloseTo(180000, 0) // Allow floating point precision
    })

    it('should handle zero MLS rate', () => {
      // If MLS rate is 0, break-even is infinity (never worth buying for pure economic reasons)
      const breakEven = calculateBreakEvenIncome({
        premium: 2000,
        currentLoading: 0,
        mlsRate: 0,
      })

      expect(breakEven).toBe(Infinity)
    })
  })

  describe('determineMlsRate (alias for calculateMlsRate)', () => {
    it('should work as alias', () => {
      expect(determineMlsRate(120000, false)).toBe(0.0125)
      expect(determineMlsRate(200000, true)).toBe(0.01)
    })
  })

  describe('validateInputs', () => {
    it('should validate age range', () => {
      expect(validateInputs({ age: 17, income: 100000, premium: 2000, delayYears: 1 })).toContain(
        'Age must be between 18-100',
      )
      expect(validateInputs({ age: 101, income: 100000, premium: 2000, delayYears: 1 })).toContain(
        'Age must be between 18-100',
      )
      expect(validateInputs({ age: 18, income: 100000, premium: 2000, delayYears: 1 })).toEqual(
        [],
      )
      expect(validateInputs({ age: 100, income: 100000, premium: 2000, delayYears: 1 })).toEqual(
        [],
      )
    })

    it('should validate income is non-negative', () => {
      expect(validateInputs({ age: 30, income: -1, premium: 2000, delayYears: 1 })).toContain(
        'Income cannot be negative',
      )
      expect(validateInputs({ age: 30, income: 0, premium: 2000, delayYears: 1 })).toEqual([])
    })

    it('should validate premium range', () => {
      expect(validateInputs({ age: 30, income: 100000, premium: 499, delayYears: 1 })).toContain(
        'Premium should be between $500-$10,000',
      )
      expect(
        validateInputs({ age: 30, income: 100000, premium: 10001, delayYears: 1 }),
      ).toContain('Premium should be between $500-$10,000')
      expect(validateInputs({ age: 30, income: 100000, premium: 500, delayYears: 1 })).toEqual([])
      expect(validateInputs({ age: 30, income: 100000, premium: 10000, delayYears: 1 })).toEqual(
        [],
      )
    })

    it('should validate delay years range', () => {
      expect(validateInputs({ age: 30, income: 100000, premium: 2000, delayYears: -1 })).toContain(
        'Delay years should be between 0-30',
      )
      expect(validateInputs({ age: 30, income: 100000, premium: 2000, delayYears: 31 })).toContain(
        'Delay years should be between 0-30',
      )
      expect(validateInputs({ age: 30, income: 100000, premium: 2000, delayYears: 0 })).toEqual([])
      expect(validateInputs({ age: 30, income: 100000, premium: 2000, delayYears: 30 })).toEqual(
        [],
      )
    })

    it('should return multiple errors if multiple validations fail', () => {
      const errors = validateInputs({ age: 17, income: -100, premium: 100, delayYears: 50 })
      expect(errors).toHaveLength(4)
    })

    it('should return empty array for valid inputs', () => {
      expect(validateInputs({ age: 30, income: 100000, premium: 2000, delayYears: 5 })).toEqual(
        [],
      )
    })
  })
})
