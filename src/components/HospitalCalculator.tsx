'use client'

import { useState } from 'react'
import { calculateDelayCost, formatCurrency, type CalculationResult } from '@/utilities/hospitalCalculator'

export function HospitalCalculator() {
  const [age, setAge] = useState<string>('')
  const [income, setIncome] = useState<string>('')
  const [premium, setPremium] = useState<string>('2000')
  const [result, setResult] = useState<CalculationResult | null>(null)

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()

    const ageNum = parseInt(age)
    const incomeNum = parseInt(income)
    const premiumNum = parseInt(premium)

    if (!ageNum || !incomeNum || !premiumNum) {
      return
    }

    // Calculate using extracted utility
    const calculationResult = calculateDelayCost({
      age: ageNum,
      income: incomeNum,
      premium: premiumNum,
      delayYears: 1, // Hardcoded to 1 for Slice 1
      isFamily: false, // Hardcoded to single for Slice 1
      isImmigrant: false, // Hardcoded to Australian born for Slice 1
    })

    setResult(calculationResult)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8">Hospital Insurance Calculator</h1>

      <form onSubmit={handleCalculate} className="space-y-6 mb-8">
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
