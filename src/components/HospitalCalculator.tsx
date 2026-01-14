'use client'

import { useState } from 'react'
import { calculateDelayCost, calculateMlsRate, formatCurrency, type CalculationResult } from '@/utilities/hospitalCalculator'

export function HospitalCalculator() {
  const [age, setAge] = useState<string>('')
  const [income, setIncome] = useState<string>('')
  const [premium, setPremium] = useState<string>('2000')
  const [isFamily, setIsFamily] = useState<boolean>(false)
  const [numChildren, setNumChildren] = useState<string>('0')
  const [result, setResult] = useState<CalculationResult | null>(null)

  // Calculate MLS rate and tier info dynamically
  const getMlsTierInfo = () => {
    const incomeNum = parseInt(income) || 0
    const childrenNum = parseInt(numChildren) || 0
    const rate = calculateMlsRate({ income: incomeNum, isFamily, numChildren: childrenNum })

    const childAdjustment = childrenNum * 1500

    if (isFamily) {
      const tier0 = 194000 + childAdjustment
      const tier1 = 226000 + childAdjustment
      const tier2 = 302000 + childAdjustment

      if (incomeNum <= tier0) {
        return { rate: 0, tier: 0, rangeStart: 0, rangeEnd: tier0 }
      } else if (incomeNum <= tier1) {
        return { rate: 0.01, tier: 1, rangeStart: tier0 + 1, rangeEnd: tier1 }
      } else if (incomeNum <= tier2) {
        return { rate: 0.0125, tier: 2, rangeStart: tier1 + 1, rangeEnd: tier2 }
      } else {
        return { rate: 0.015, tier: 3, rangeStart: tier2 + 1, rangeEnd: Infinity }
      }
    } else {
      // Single person thresholds
      if (incomeNum <= 97000) {
        return { rate: 0, tier: 0, rangeStart: 0, rangeEnd: 97000 }
      } else if (incomeNum <= 113000) {
        return { rate: 0.01, tier: 1, rangeStart: 97001, rangeEnd: 113000 }
      } else if (incomeNum <= 151000) {
        return { rate: 0.0125, tier: 2, rangeStart: 113001, rangeEnd: 151000 }
      } else {
        return { rate: 0.015, tier: 3, rangeStart: 151001, rangeEnd: Infinity }
      }
    }
  }

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()

    const ageNum = parseInt(age)
    const incomeNum = parseInt(income)
    const premiumNum = parseInt(premium)
    const childrenNum = parseInt(numChildren) || 0

    if (!ageNum || !incomeNum || !premiumNum) {
      return
    }

    // Calculate using extracted utility
    const calculationResult = calculateDelayCost({
      age: ageNum,
      income: incomeNum,
      premium: premiumNum,
      delayYears: 1, // Hardcoded to 1 for Slice 1
      isFamily, // Now dynamic based on toggle
      isImmigrant: false, // Hardcoded to Australian born for Slice 1
      numChildren: childrenNum,
    })

    setResult(calculationResult)
  }

  const mlsTierInfo = getMlsTierInfo()
  const formatTierRange = (start: number, end: number) => {
    if (end === Infinity) {
      return `$${(start / 1000).toFixed(0)}k+`
    }
    return `$${(start / 1000).toFixed(0)}k - $${(end / 1000).toFixed(0)}k`
  }
  const formatPercentage = (rate: number) => {
    if (rate === 0) return '0%'
    const percentage = rate * 100
    // Format percentages: 1.0%, 1.25%, 1.5%
    // Always show at least one decimal place
    if (percentage % 1 === 0) {
      // Whole number like 1.0 -> show "1.0%"
      return `${percentage.toFixed(1)}%`
    } else if ((percentage * 10) % 1 === 0) {
      // One decimal place like 1.5 -> show "1.5%"
      return `${percentage.toFixed(1)}%`
    } else {
      // Two decimal places like 1.25 -> show "1.25%"
      return `${percentage.toFixed(2)}%`
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8">Hospital Insurance Calculator</h1>

      <form onSubmit={handleCalculate} className="space-y-6 mb-8">
        {/* Family Status Toggle */}
        <div data-testid="family-status-toggle">
          <label className="block text-sm font-medium mb-2">Status</label>
          <div className="flex gap-4">
            <button
              type="button"
              data-testid="single-option"
              onClick={() => setIsFamily(false)}
              className={`flex-1 px-4 py-2 rounded-md border-2 transition-colors ${
                !isFamily
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              Single
            </button>
            <button
              type="button"
              data-testid="family-option"
              onClick={() => setIsFamily(true)}
              className={`flex-1 px-4 py-2 rounded-md border-2 transition-colors ${
                isFamily
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              Family
            </button>
          </div>
        </div>

        {/* Number of Children (conditional) */}
        {isFamily && (
          <div>
            <label htmlFor="numChildren" className="block text-sm font-medium mb-2">
              Number of Children
            </label>
            <input
              type="number"
              id="numChildren"
              name="numChildren"
              value={numChildren}
              onChange={(e) => setNumChildren(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Number of children"
              min="0"
              max="10"
            />
          </div>
        )}

        <div>
          <label htmlFor="age" className="block text-sm font-medium mb-2">
            Age
          </label>
          <input
            type="number"
            id="age"
            name="age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your age"
            min="18"
            max="100"
            required
          />
        </div>

        <div>
          <label htmlFor="income" className="block text-sm font-medium mb-2">
            Annual Income
          </label>
          <input
            type="number"
            id="income"
            name="income"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter annual income"
            min="0"
            required
          />

          {/* MLS Rate Display */}
          {income && parseInt(income) > 0 && (
            <div data-testid="mls-rate-display" className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm font-medium text-blue-900">
                Your MLS rate: <span className="font-bold">{formatPercentage(mlsTierInfo.rate)}</span>
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Tier {mlsTierInfo.tier}: {formatTierRange(mlsTierInfo.rangeStart, mlsTierInfo.rangeEnd)}
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="premium" className="block text-sm font-medium mb-2">
            Base Premium (Annual)
          </label>
          <input
            type="number"
            id="premium"
            name="premium"
            value={premium}
            onChange={(e) => setPremium(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Base premium"
            min="500"
            max="10000"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Calculate
        </button>
      </form>

      {result && (
        <div data-testid="calculator-result" className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4">Results</h2>

          <div className="mb-4">
            <div className="text-lg font-medium mb-2">Net Additional Cost (1 year delay):</div>
            <div data-testid="net-cost" className="text-3xl font-bold text-blue-600">
              {result.netCost < 0 ? '-' : ''}
              {formatCurrency(result.netCost)}
            </div>
          </div>

          <div data-testid="result-message" className="text-lg mt-4">
            {result.netCost < 0 ? (
              <p className="text-green-700">
                💰 Delaying 1 year <strong>saves</strong> {formatCurrency(result.netCost)}
              </p>
            ) : result.netCost > 0 ? (
              <p className="text-red-700">
                ⚠️ Delaying 1 year <strong>costs</strong> {formatCurrency(result.netCost)} more
              </p>
            ) : (
              <p className="text-gray-700">Break-even: Both options cost the same</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
