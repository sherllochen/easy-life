'use client'

import { useState } from 'react'
import { calculateDelayCost, calculateMlsRate, calculateCurrentLoading, formatCurrency, type CalculationResult } from '@/utilities/hospitalCalculator'

export function HospitalCalculator() {
  const [age, setAge] = useState<string>('')
  const [income, setIncome] = useState<string>('')
  const [premium, setPremium] = useState<string>('2000')
  const [isFamily, setIsFamily] = useState<boolean>(false)
  const [numChildren, setNumChildren] = useState<string>('0')
  const [isImmigrant, setIsImmigrant] = useState<boolean>(false)
  const [medicareAge, setMedicareAge] = useState<string>('')
  const [delayYears, setDelayYears] = useState<string>('1')
  const [showComparison, setShowComparison] = useState<boolean>(false)
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false)

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

  // Calculate loading info dynamically
  const getLoadingInfo = () => {
    const ageNum = parseInt(age) || 0
    const medicareAgeNum = parseInt(medicareAge) || undefined

    if (ageNum === 0) {
      return { loading: 0, explanation: '' }
    }

    try {
      const loading = calculateCurrentLoading({
        age: ageNum,
        isImmigrant,
        medicareAge: medicareAgeNum,
      })

      let explanation = ''
      if (loading === 0) {
        if (isImmigrant && medicareAgeNum) {
          const graceEndAge = medicareAgeNum + 1
          if (ageNum <= graceEndAge) {
            explanation = 'Within grace period'
          } else {
            explanation = 'No loading yet'
          }
        } else if (!isImmigrant && ageNum < 30) {
          explanation = 'Under base age 30'
        } else if (ageNum === 30) {
          explanation = 'At base age 30'
        }
      } else {
        const yearsLate = isImmigrant && medicareAgeNum
          ? Math.max(0, ageNum - (medicareAgeNum + 1))
          : Math.max(0, ageNum - 30)

        if (yearsLate === 1) {
          explanation = `${yearsLate} year past ${isImmigrant ? 'grace period' : 'age 30'}`
        } else if (yearsLate > 1) {
          explanation = `${yearsLate} years past ${isImmigrant ? 'grace period' : 'age 30'}`
        }
      }

      return { loading, explanation }
    } catch (error) {
      return { loading: 0, explanation: '' }
    }
  }

  // Calculate main result dynamically (reactive)
  const getMainResult = (): CalculationResult | null => {
    const ageNum = parseInt(age)
    const incomeNum = parseInt(income)
    const premiumNum = parseInt(premium)
    const childrenNum = parseInt(numChildren) || 0
    const medicareAgeNum = isImmigrant ? parseInt(medicareAge) : undefined
    const delayYearsNum = parseInt(delayYears) || 1

    // Validate all required inputs
    if (!ageNum || isNaN(ageNum) || !incomeNum || isNaN(incomeNum) || !premiumNum || isNaN(premiumNum)) {
      return null
    }

    // Validate Medicare age for immigrants
    if (isImmigrant && (!medicareAgeNum || isNaN(medicareAgeNum))) {
      return null
    }

    // Calculate using extracted utility
    return calculateDelayCost({
      age: ageNum,
      income: incomeNum,
      premium: premiumNum,
      delayYears: delayYearsNum,
      isFamily,
      isImmigrant,
      numChildren: childrenNum,
      medicareAge: medicareAgeNum,
    })
  }

  const result = getMainResult()

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    // No longer needed - result auto-calculates
    // But keep the function to prevent form submission
  }

  // Calculate multiple scenarios for comparison
  const getComparisonScenarios = () => {
    const ageNum = parseInt(age)
    const incomeNum = parseInt(income)
    const premiumNum = parseInt(premium)
    const childrenNum = parseInt(numChildren) || 0
    const medicareAgeNum = isImmigrant ? parseInt(medicareAge) : undefined

    // Validate all required inputs are valid numbers
    if (!ageNum || isNaN(ageNum) || !incomeNum || isNaN(incomeNum) || !premiumNum || isNaN(premiumNum)) {
      return []
    }

    if (isImmigrant && (!medicareAgeNum || isNaN(medicareAgeNum))) {
      return []
    }

    const scenarios = [1, 3, 5, 10]

    return scenarios.map((years) => {
      const result = calculateDelayCost({
        age: ageNum,
        income: incomeNum,
        premium: premiumNum,
        delayYears: years,
        isFamily,
        isImmigrant,
        numChildren: childrenNum,
        medicareAge: medicareAgeNum,
      })

      // Determine recommendation based on cost
      let recommendation = 'Consider'
      if (result.netCost < -500) {
        recommendation = 'Can wait'
      } else if (result.netCost > 1000) {
        recommendation = 'Buy now'
      }

      return {
        years,
        result,
        recommendation,
      }
    })
  }

  const comparisonScenarios = getComparisonScenarios()

  // Find best option (most negative = saves most)
  const bestScenarioIndex = comparisonScenarios.length > 0
    ? comparisonScenarios.reduce((bestIdx, scenario, idx, arr) =>
        scenario.result.netCost < arr[bestIdx].result.netCost ? idx : bestIdx
      , 0)
    : -1

  const loadingInfo = getLoadingInfo()

  const mlsTierInfo = getMlsTierInfo()

  // Calculate breakdown values for detailed formula display
  const getBreakdownValues = () => {
    const incomeNum = parseInt(income) || 0
    const premiumNum = parseInt(premium) || 0
    const delayYearsNum = parseInt(delayYears) || 1

    // Get current loading percentage
    const currentLoading = loadingInfo.loading

    // Get MLS rate
    const mlsRate = mlsTierInfo.rate

    // Calculate each component
    // Loading Increase Cost: P × X × 0.2 (per year of delay adds 2% loading, multiplied by 10 year factor)
    const loadingIncreaseCost = premiumNum * delayYearsNum * 0.2

    // MLS Cost: Income × MLS Rate × X (MLS paid during delay years)
    const mlsCost = incomeNum * mlsRate * delayYearsNum

    // Premium Saved: -P × (1 + L₀) × X (premium not paid during delay, including current loading)
    const premiumSaved = -premiumNum * (1 + currentLoading) * delayYearsNum

    // Net cost
    const netCost = loadingIncreaseCost + mlsCost + premiumSaved

    return {
      premium: premiumNum,
      income: incomeNum,
      delayYears: delayYearsNum,
      currentLoading,
      mlsRate,
      loadingIncreaseCost,
      mlsCost,
      premiumSaved,
      netCost,
    }
  }

  const breakdownValues = getBreakdownValues()

  const formatTierRange = (start: number, end: number) => {
    if (end === Infinity) {
      return `$${(start / 1000).toFixed(0)}k+`
    }
    return `$${(start / 1000).toFixed(0)}k - $${(end / 1000).toFixed(0)}k`
  }
  const formatPercentage = (rate: number, forLoading = false) => {
    if (rate === 0) return '0%'
    const percentage = rate * 100

    // For loading: show whole numbers without decimals (10%, 24%)
    // For MLS: show at least one decimal (1.0%, 1.5%, 1.25%)
    if (forLoading) {
      // Round to handle floating point precision issues
      const rounded = Math.round(percentage * 10) / 10
      if (Math.abs(rounded - Math.round(rounded)) < 0.01) {
        return `${Math.round(rounded)}%`
      } else {
        return `${rounded}%`
      }
    } else {
      // MLS rate formatting: 1.0%, 1.25%, 1.5%
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

        {/* Immigrant Status Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="immigrant"
            data-testid="immigrant-checkbox"
            checked={isImmigrant}
            onChange={(e) => setIsImmigrant(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="immigrant" className="ml-2 text-sm font-medium">
            Are you an immigrant?
          </label>
        </div>

        {/* Medicare Age (conditional) */}
        {isImmigrant && (
          <div>
            <label htmlFor="medicareAge" className="block text-sm font-medium mb-2">
              Age When You Got Medicare
            </label>
            <input
              type="number"
              id="medicareAge"
              name="medicareAge"
              value={medicareAge}
              onChange={(e) => setMedicareAge(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Age when got Medicare"
              min="18"
              max="100"
              required={isImmigrant}
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

          {/* Loading Display */}
          {age && parseInt(age) > 0 && (
            <div data-testid="loading-display" className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-md">
              <div className="text-sm font-medium text-purple-900">
                Your current loading: <span className="font-bold">{formatPercentage(loadingInfo.loading, true)}</span>
              </div>
              {loadingInfo.explanation && (
                <div className="text-xs text-purple-700 mt-1">
                  {loadingInfo.explanation}
                </div>
              )}
            </div>
          )}
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

        <div>
          <label htmlFor="delayYears" className="block text-sm font-medium mb-2">
            Delay Years
          </label>
          <input
            type="number"
            id="delayYears"
            data-testid="delay-years-input"
            value={delayYears}
            onChange={(e) => setDelayYears(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Years to delay"
            min="1"
            max="10"
            required
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Calculate
          </button>

          <button
            type="button"
            data-testid={showComparison ? 'hide-comparison' : 'show-comparison'}
            onClick={() => setShowComparison(!showComparison)}
            className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 transition-colors font-medium"
          >
            {showComparison ? 'Hide Comparison' : 'Show Comparison'}
          </button>

          <button
            type="button"
            data-testid="toggle-breakdown"
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 transition-colors font-medium"
          >
            {showBreakdown ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </form>

      {result && (
        <div data-testid="calculator-result" className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4">Results</h2>

          <div className="mb-4">
            <div className="text-lg font-medium mb-2">
              Net Additional Cost ({delayYears} {parseInt(delayYears) === 1 ? 'year' : 'years'} delay):
            </div>
            <div data-testid="net-cost" className="text-3xl font-bold text-blue-600">
              {result.netCost < 0 ? '-' : ''}
              {formatCurrency(result.netCost)}
            </div>
          </div>

          <div data-testid="result-message" className="text-lg mt-4">
            {result.netCost < 0 ? (
              <p className="text-green-700">
                💰 Delaying {delayYears} {parseInt(delayYears) === 1 ? 'year' : 'years'} <strong>saves</strong> {formatCurrency(Math.abs(result.netCost))}
              </p>
            ) : result.netCost > 0 ? (
              <p className="text-red-700">
                ⚠️ Delaying {delayYears} {parseInt(delayYears) === 1 ? 'year' : 'years'} <strong>costs</strong> {formatCurrency(result.netCost)} more
              </p>
            ) : (
              <p className="text-gray-700">Break-even: Both options cost the same</p>
            )}
          </div>
        </div>
      )}

      {showComparison && comparisonScenarios.length > 0 && (
        <div data-testid="comparison-table" className="mt-6 bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4">Multi-Year Comparison</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 font-semibold">Delay Years</th>
                  <th className="text-right py-3 px-4 font-semibold">Net Cost</th>
                  <th className="text-left py-3 px-4 font-semibold">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {comparisonScenarios.map((scenario, index) => {
                  const isBest = index === bestScenarioIndex
                  const netCost = scenario.result.netCost

                  return (
                    <tr
                      key={scenario.years}
                      data-testid="comparison-row"
                      className={`border-b border-gray-200 ${isBest ? 'bg-green-50 font-semibold' : ''}`}
                    >
                      <td className="py-3 px-4">
                        {scenario.years} {scenario.years === 1 ? 'year' : 'years'}
                        {isBest && <span data-testid="best-option" className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">Best</span>}
                      </td>
                      <td data-testid="scenario-cost" className={`py-3 px-4 text-right font-medium ${netCost < 0 ? 'text-green-600' : netCost > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {netCost < 0 ? (
                          <>-{formatCurrency(Math.abs(netCost))} <span className="text-sm font-normal">(saves)</span></>
                        ) : (
                          formatCurrency(netCost)
                        )}
                      </td>
                      <td className="py-3 px-4">{scenario.recommendation}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showBreakdown && (
        <div data-testid="calculation-breakdown" className="mt-6 bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h2 className="text-2xl font-semibold mb-4">Calculation Breakdown</h2>

          <div className="space-y-6">
            {/* Loading Increase Cost */}
            <div className="p-4 bg-white rounded-md border border-yellow-300">
              <h3 className="font-semibold text-lg mb-2 text-red-700">1. Loading Increase Cost</h3>
              <p className="text-sm text-gray-600 mb-2">
                Extra premium you&apos;ll pay over 10 years due to increased loading from delaying.
              </p>
              <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                P × X × 0.2 = {formatCurrency(breakdownValues.premium)} × {breakdownValues.delayYears} × 0.2
              </div>
              <div className="mt-2 text-lg font-bold text-red-600">
                = {formatCurrency(breakdownValues.loadingIncreaseCost)}
              </div>
            </div>

            {/* MLS Cost */}
            <div className="p-4 bg-white rounded-md border border-yellow-300">
              <h3 className="font-semibold text-lg mb-2 text-red-700">2. MLS Paid During Delay</h3>
              <p className="text-sm text-gray-600 mb-2">
                Medicare Levy Surcharge paid while you don&apos;t have hospital cover.
              </p>
              <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                Income × MLS Rate × X = {formatCurrency(breakdownValues.income)} × {formatPercentage(breakdownValues.mlsRate)} × {breakdownValues.delayYears}
              </div>
              <div className="mt-2 text-lg font-bold text-red-600">
                = {formatCurrency(breakdownValues.mlsCost)}
              </div>
            </div>

            {/* Premium Saved */}
            <div className="p-4 bg-white rounded-md border border-yellow-300">
              <h3 className="font-semibold text-lg mb-2 text-green-700">3. Premium Saved During Delay</h3>
              <p className="text-sm text-gray-600 mb-2">
                Premium you don&apos;t pay while delaying (including your current loading).
              </p>
              <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                -P × (1 + L₀) × X = -{formatCurrency(breakdownValues.premium)} × (1 + {formatPercentage(breakdownValues.currentLoading, true)}) × {breakdownValues.delayYears}
              </div>
              <div className="mt-2 text-lg font-bold text-green-600">
                = -{formatCurrency(Math.abs(breakdownValues.premiumSaved))}
              </div>
            </div>

            {/* Net Cost */}
            <div className="p-4 bg-gray-100 rounded-md border-2 border-gray-400">
              <h3 className="font-semibold text-lg mb-2">Net Cost of Delaying</h3>
              <div className="font-mono text-sm mb-2">
                {formatCurrency(breakdownValues.loadingIncreaseCost)} + {formatCurrency(breakdownValues.mlsCost)} + (-{formatCurrency(Math.abs(breakdownValues.premiumSaved))})
              </div>
              <div className={`text-2xl font-bold ${breakdownValues.netCost < 0 ? 'text-green-600' : breakdownValues.netCost > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                = {breakdownValues.netCost < 0 ? '-' : ''}{formatCurrency(Math.abs(breakdownValues.netCost))}
                {breakdownValues.netCost < 0 && <span className="text-sm font-normal ml-2">(you save money by delaying)</span>}
                {breakdownValues.netCost > 0 && <span className="text-sm font-normal ml-2">(delaying costs you more)</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
