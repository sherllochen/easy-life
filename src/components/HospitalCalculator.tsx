'use client'

import { useState } from 'react'
import { calculateDelayCost, calculateMlsRate, calculateCurrentLoading, formatCurrency, type CalculationResult } from '@/utilities/hospitalCalculator'

// Translations
const translations = {
  en: {
    title: 'Hospital Insurance Calculator',
    status: 'Status',
    single: 'Single',
    family: 'Family',
    numChildren: 'Number of Children',
    immigrant: 'Are you an immigrant?',
    medicareAge: 'Age When You Got Medicare',
    age: 'Age',
    annualIncome: 'Annual Income',
    basePremium: 'Base Premium (Annual)',
    delayYears: 'Delay Years',
    calculate: 'Calculate',
    showComparison: 'Show Comparison',
    hideComparison: 'Hide Comparison',
    showDetails: 'Show Details',
    hideDetails: 'Hide Details',
    results: 'Results',
    netCost: 'Net Additional Cost',
    year: 'year',
    years: 'years',
    delay: 'delay',
    saves: 'saves',
    costs: 'costs',
    more: 'more',
    breakeven: 'Break-even: Both options cost the same',
    canWait: 'Economically Can Wait',
    canWaitDesc: 'Delaying saves you money, but consider health and lifestyle factors.',
    consider: 'Consider Your Options',
    considerDesc: 'Moderate cost to delay. Consider risks and your personal situation.',
    buyNow: 'Recommend Buying Now',
    buyNowDesc: 'Delaying costs significantly more. Buy now to avoid extra expenses.',
    ageWarningYoung: 'Buy before age 30 to avoid lifetime loading on your premium.',
    ageWarningMid: 'Consider health risks and your long-term plans when deciding.',
    ageWarningOld: 'Health risks increase with age. Consider coverage sooner rather than later.',
    factorsTitle: 'Factors to Consider',
    mlsCost: 'MLS cost',
    mlsCostDesc: 'in Medicare Levy Surcharge over',
    loadingIncrease: 'Loading increase',
    loadingIncreaseDesc: 'Your premium loading will increase by',
    ifYouDelay: 'if you delay',
    waitingPeriods: 'Waiting periods',
    waitingPeriodsDesc: 'Most policies have 2-12 month waiting periods for benefits',
    medicalDisclaimer: 'Medical costs are not included in this calculation. Any surgery could cost $10,000-$30,000+ without insurance.',
    important: 'Important',
    yourMlsRate: 'Your MLS rate',
    tier: 'Tier',
    yourLoading: 'Your current loading',
    withinGrace: 'Within grace period',
    noLoadingYet: 'No loading yet',
    underBase: 'Under base age 30',
    atBase: 'At base age 30',
    yearPast: 'year past',
    yearsPast: 'years past',
    gracePeriod: 'grace period',
    multiYearComparison: 'Multi-Year Comparison',
    recommendation: 'Recommendation',
    best: 'Best',
    canWaitShort: 'Can wait',
    considerShort: 'Consider',
    buyNowShort: 'Buy now',
    breakdownTitle: 'Calculation Breakdown',
    loadingIncreaseCost: 'Loading Increase Cost',
    loadingIncreaseCostDesc: 'Extra premium you\'ll pay over 10 years due to increased loading from delaying.',
    mlsPaidDuring: 'MLS Paid During Delay',
    mlsPaidDuringDesc: 'Medicare Levy Surcharge paid while you don\'t have hospital cover.',
    premiumSaved: 'Premium Saved During Delay',
    premiumSavedDesc: 'Premium you don\'t pay while delaying (including your current loading).',
    netCostDelaying: 'Net Cost of Delaying',
    youSave: 'you save money by delaying',
    youPay: 'delaying costs you more',
    reset: 'Reset',
    share: 'Share',
    print: 'Print',
    copied: 'Link copied!',
    mlsTooltip: 'Medicare Levy Surcharge (MLS) is an additional tax for high-income earners who don\'t have private hospital insurance.',
    loadingTooltip: 'Lifetime Health Cover (LHC) loading is an extra charge added to your premium if you don\'t take out hospital cover before age 31.',
  },
  zh: {
    title: '医院保险计算器',
    status: '状态',
    single: '单身',
    family: '家庭',
    numChildren: '子女数量',
    immigrant: '您是移民吗？',
    medicareAge: '获得Medicare时的年龄',
    age: '年龄',
    annualIncome: '年收入',
    basePremium: '基本保费（年度）',
    delayYears: '延迟年数',
    calculate: '计算',
    showComparison: '显示对比',
    hideComparison: '隐藏对比',
    showDetails: '显示详情',
    hideDetails: '隐藏详情',
    results: '结果',
    netCost: '净额外费用',
    year: '年',
    years: '年',
    delay: '延迟',
    saves: '节省',
    costs: '花费',
    more: '更多',
    breakeven: '平衡点：两种选择花费相同',
    canWait: '可以等待',
    canWaitDesc: '延迟购买可以省钱，但请考虑健康和生活方式因素。',
    consider: '考虑您的选择',
    considerDesc: '延迟费用适中。请考虑风险和您的个人情况。',
    buyNow: '建议立即购买',
    buyNowDesc: '延迟费用显著增加。立即购买以避免额外支出。',
    ageWarningYoung: '在30岁之前购买以避免终身加载费用。',
    ageWarningMid: '在做决定时考虑健康风险和您的长期计划。',
    ageWarningOld: '健康风险随年龄增加。请尽早考虑购买保险。',
    factorsTitle: '需要考虑的因素',
    mlsCost: 'MLS费用',
    mlsCostDesc: '的Medicare税附加费，在',
    loadingIncrease: '加载增加',
    loadingIncreaseDesc: '您的保费加载将增加',
    ifYouDelay: '如果您延迟',
    waitingPeriods: '等待期',
    waitingPeriodsDesc: '大多数保单有2-12个月的等待期',
    medicalDisclaimer: '此计算不包括医疗费用。没有保险的情况下，任何手术可能花费$10,000-$30,000以上。',
    important: '重要',
    yourMlsRate: '您的MLS税率',
    tier: '等级',
    yourLoading: '您当前的加载',
    withinGrace: '在宽限期内',
    noLoadingYet: '暂无加载',
    underBase: '低于基准年龄30岁',
    atBase: '在基准年龄30岁',
    yearPast: '年超过',
    yearsPast: '年超过',
    gracePeriod: '宽限期',
    multiYearComparison: '多年对比',
    recommendation: '建议',
    best: '最佳',
    canWaitShort: '可以等待',
    considerShort: '考虑',
    buyNowShort: '立即购买',
    breakdownTitle: '计算明细',
    loadingIncreaseCost: '加载增加费用',
    loadingIncreaseCostDesc: '由于延迟导致加载增加，您在10年内将额外支付的保费。',
    mlsPaidDuring: '延迟期间支付的MLS',
    mlsPaidDuringDesc: '没有医院保险期间支付的Medicare税附加费。',
    premiumSaved: '延迟期间节省的保费',
    premiumSavedDesc: '延迟期间您不需要支付的保费（包括您当前的加载）。',
    netCostDelaying: '延迟的净费用',
    youSave: '延迟可以省钱',
    youPay: '延迟会花费更多',
    reset: '重置',
    share: '分享',
    print: '打印',
    copied: '链接已复制！',
    mlsTooltip: 'Medicare Levy Surcharge（MLS）是针对没有私人医院保险的高收入者的额外税款。',
    loadingTooltip: 'Lifetime Health Cover（LHC）加载是如果您在31岁之前没有购买医院保险而添加到保费上的额外费用。',
  },
}

type Language = 'en' | 'zh'

export function HospitalCalculator() {
  const [language, setLanguage] = useState<Language>('en')
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
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [shareFeedback, setShareFeedback] = useState<boolean>(false)

  const t = translations[language]

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en')
  }

  const handleReset = () => {
    setAge('')
    setIncome('')
    setPremium('2000')
    setIsFamily(false)
    setNumChildren('0')
    setIsImmigrant(false)
    setMedicareAge('')
    setDelayYears('1')
    setShowComparison(false)
    setShowBreakdown(false)
  }

  const handleShare = async () => {
    const params = new URLSearchParams()
    if (age) params.set('age', age)
    if (income) params.set('income', income)
    if (premium !== '2000') params.set('premium', premium)
    if (isFamily) params.set('family', '1')
    if (numChildren !== '0') params.set('children', numChildren)
    if (isImmigrant) params.set('immigrant', '1')
    if (medicareAge) params.set('medicareAge', medicareAge)
    if (delayYears !== '1') params.set('delay', delayYears)

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`

    try {
      await navigator.clipboard.writeText(url)
      setShareFeedback(true)
      setTimeout(() => setShareFeedback(false), 2000)
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      console.error('Failed to copy:', err)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const toggleTooltip = (id: string) => {
    setActiveTooltip(activeTooltip === id ? null : id)
  }

  const closeTooltip = () => {
    setActiveTooltip(null)
  }

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
    // Result is computed automatically when inputs are valid
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
    <div className="container mx-auto px-4 py-8 max-w-2xl" onClick={closeTooltip}>
      {/* Header with Language Toggle and Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold">{t.title}</h1>
        <div className="flex items-center gap-2" data-testid="action-buttons">
          <button
            type="button"
            data-testid="language-toggle"
            onClick={(e) => { e.stopPropagation(); toggleLanguage(); }}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 transition-colors font-medium"
          >
            {language === 'en' ? '中文' : 'EN'}
          </button>
          <button
            type="button"
            data-testid="reset-button"
            onClick={(e) => { e.stopPropagation(); handleReset(); }}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 transition-colors"
          >
            {t.reset}
          </button>
          <button
            type="button"
            data-testid="share-button"
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 transition-colors relative"
          >
            {t.share}
            {shareFeedback && (
              <span data-testid="share-feedback" className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {t.copied}
              </span>
            )}
          </button>
          <button
            type="button"
            data-testid="print-button"
            onClick={(e) => { e.stopPropagation(); handlePrint(); }}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 transition-colors"
          >
            {t.print}
          </button>
        </div>
      </div>

      {/* Help Icons for MLS and Loading */}
      <div className="flex gap-4 mb-6 text-sm">
        <div className="relative">
          <button
            type="button"
            data-testid="help-mls"
            onClick={(e) => { e.stopPropagation(); toggleTooltip('mls'); }}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
          >
            <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold">?</span>
            <span>MLS</span>
          </button>
          {activeTooltip === 'mls' && (
            <div data-testid="tooltip-content" className="absolute z-10 top-8 left-0 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg text-sm text-gray-700">
              {t.mlsTooltip}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            data-testid="help-loading"
            onClick={(e) => { e.stopPropagation(); toggleTooltip('loading'); }}
            className="flex items-center gap-1 text-purple-600 hover:text-purple-800"
          >
            <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold">?</span>
            <span>Loading</span>
          </button>
          {activeTooltip === 'loading' && (
            <div data-testid="tooltip-content" className="absolute z-10 top-8 left-0 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg text-sm text-gray-700">
              {t.loadingTooltip}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleCalculate} className="space-y-6 mb-8">
        {/* Family Status Toggle */}
        <div data-testid="family-status-toggle">
          <label className="block text-sm font-medium mb-2">{t.status}</label>
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
              {t.single}
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
              {t.family}
            </button>
          </div>
        </div>

        {/* Number of Children (conditional) */}
        {isFamily && (
          <div>
            <label htmlFor="numChildren" className="block text-sm font-medium mb-2">
              {t.numChildren}
            </label>
            <input
              type="number"
              id="numChildren"
              name="numChildren"
              value={numChildren}
              onChange={(e) => setNumChildren(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t.numChildren}
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
            {t.immigrant}
          </label>
        </div>

        {/* Medicare Age (conditional) */}
        {isImmigrant && (
          <div>
            <label htmlFor="medicareAge" className="block text-sm font-medium mb-2">
              {t.medicareAge}
            </label>
            <input
              type="number"
              id="medicareAge"
              name="medicareAge"
              value={medicareAge}
              onChange={(e) => setMedicareAge(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t.medicareAge}
              min="18"
              max="100"
              required={isImmigrant}
            />
          </div>
        )}

        <div>
          <label htmlFor="age" className="block text-sm font-medium mb-2">
            {t.age}
          </label>
          <input
            type="number"
            id="age"
            name="age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.age}
            min="18"
            max="100"
            required
          />

          {/* Loading Display */}
          {age && parseInt(age) > 0 && (
            <div data-testid="loading-display" className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-md">
              <div className="text-sm font-medium text-purple-900">
                {t.yourLoading}: <span className="font-bold">{formatPercentage(loadingInfo.loading, true)}</span>
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
            {t.annualIncome}
          </label>
          <input
            type="number"
            id="income"
            name="income"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.annualIncome}
            min="0"
            required
          />

          {/* MLS Rate Display */}
          {income && parseInt(income) > 0 && (
            <div data-testid="mls-rate-display" className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm font-medium text-blue-900">
                {t.yourMlsRate}: <span className="font-bold">{formatPercentage(mlsTierInfo.rate)}</span>
              </div>
              <div className="text-xs text-blue-700 mt-1">
                {t.tier} {mlsTierInfo.tier}: {formatTierRange(mlsTierInfo.rangeStart, mlsTierInfo.rangeEnd)}
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="premium" className="block text-sm font-medium mb-2">
            {t.basePremium}
          </label>
          <input
            type="number"
            id="premium"
            name="premium"
            value={premium}
            onChange={(e) => setPremium(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.basePremium}
            min="500"
            max="10000"
            required
          />
        </div>

        <div>
          <label htmlFor="delayYears" className="block text-sm font-medium mb-2">
            {t.delayYears}
          </label>
          <input
            type="number"
            id="delayYears"
            data-testid="delay-years-input"
            value={delayYears}
            onChange={(e) => setDelayYears(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.delayYears}
            min="1"
            max="10"
            required
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            {t.calculate}
          </button>

          {result && (
            <>
              <button
                type="button"
                data-testid={showComparison ? 'hide-comparison' : 'show-comparison'}
                onClick={() => setShowComparison(!showComparison)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 transition-colors font-medium"
              >
                {showComparison ? t.hideComparison : t.showComparison}
              </button>

              <button
                type="button"
                data-testid="toggle-breakdown"
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 transition-colors font-medium"
              >
                {showBreakdown ? t.hideDetails : t.showDetails}
              </button>
            </>
          )}
        </div>
      </form>

      {/* Recommendation Box - shows when we have valid inputs */}
      {result && (
        <div
          data-testid="recommendation-box"
          data-recommendation={
            result.netCost < 0 ? 'can-wait' :
            result.netCost <= 3000 ? 'consider' : 'buy-now'
          }
          className={`p-4 rounded-lg border-2 mb-4 ${
            result.netCost < 0
              ? 'bg-blue-50 border-blue-300 text-blue-800'
              : result.netCost <= 3000
              ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
              : 'bg-green-50 border-green-300 text-green-800'
          }`}
        >
          <div className="font-bold text-lg">
            {result.netCost < 0 ? (
              <>🔵 {t.canWait}</>
            ) : result.netCost <= 3000 ? (
              <>🟡 {t.consider}</>
            ) : (
              <>🟢 {t.buyNow}</>
            )}
          </div>
          <div className="text-sm mt-1">
            {result.netCost < 0 ? (
              <>{t.canWaitDesc}</>
            ) : result.netCost <= 3000 ? (
              <>{t.considerDesc}</>
            ) : (
              <>{t.buyNowDesc}</>
            )}
          </div>
        </div>
      )}

      {/* Age Warning */}
      {age && parseInt(age) > 0 && (
        <div
          data-testid="age-warning"
          className={`p-3 rounded-md mb-4 ${
            parseInt(age) < 30
              ? 'bg-blue-50 border border-blue-200 text-blue-800'
              : parseInt(age) < 40
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
              : 'bg-orange-50 border border-orange-200 text-orange-800'
          }`}
        >
          {parseInt(age) < 30 ? (
            <>⏰ {t.ageWarningYoung}</>
          ) : parseInt(age) < 40 ? (
            <>💭 {t.ageWarningMid}</>
          ) : (
            <>⚠️ {t.ageWarningOld}</>
          )}
        </div>
      )}

      {/* Risk Factors */}
      {age && parseInt(age) > 0 && income && parseInt(income) > 0 && (
        <div data-testid="risk-factors" className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
          <h3 className="font-semibold mb-3">{t.factorsTitle}</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-red-500">💰</span>
              <span>
                <strong>{t.mlsCost}:</strong> {formatCurrency(breakdownValues.mlsCost)} {t.mlsCostDesc} {breakdownValues.delayYears} {breakdownValues.delayYears === 1 ? t.year : t.years}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500">📈</span>
              <span>
                <strong>{t.loadingIncrease}:</strong> {t.loadingIncreaseDesc} {breakdownValues.delayYears * 2}% {t.ifYouDelay} {breakdownValues.delayYears} {breakdownValues.delayYears === 1 ? t.year : t.years}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500">⏳</span>
              <span>
                <strong>{t.waitingPeriods}:</strong> {t.waitingPeriodsDesc}
              </span>
            </li>
          </ul>
        </div>
      )}

      {/* Medical Disclaimer */}
      {age && parseInt(age) > 0 && (
        <div data-testid="medical-disclaimer" className="p-3 bg-red-50 border border-red-200 rounded-md mb-4 text-sm text-red-800">
          <strong>⚕️ {t.important}:</strong> {t.medicalDisclaimer}
        </div>
      )}

      {result && (
        <div data-testid="calculator-result" className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4">{t.results}</h2>

          <div className="mb-4">
            <div className="text-lg font-medium mb-2">
              {t.netCost} ({delayYears} {parseInt(delayYears) === 1 ? t.year : t.years} {t.delay}):
            </div>
            <div data-testid="net-cost" className="text-3xl font-bold text-blue-600">
              {result.netCost < 0 ? '-' : ''}
              {formatCurrency(result.netCost)}
            </div>
          </div>

          <div data-testid="result-message" className="text-lg mt-4">
            {result.netCost < 0 ? (
              <p className="text-green-700">
                💰 {t.delay} {delayYears} {parseInt(delayYears) === 1 ? t.year : t.years} <strong>{t.saves}</strong> {formatCurrency(Math.abs(result.netCost))}
              </p>
            ) : result.netCost > 0 ? (
              <p className="text-red-700">
                ⚠️ {t.delay} {delayYears} {parseInt(delayYears) === 1 ? t.year : t.years} <strong>{t.costs}</strong> {formatCurrency(result.netCost)} {t.more}
              </p>
            ) : (
              <p className="text-gray-700">{t.breakeven}</p>
            )}
          </div>
        </div>
      )}

      {showComparison && comparisonScenarios.length > 0 && (
        <div data-testid="comparison-table" className="mt-6 bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4">{t.multiYearComparison}</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 font-semibold">{t.delayYears}</th>
                  <th className="text-right py-3 px-4 font-semibold">{t.netCost}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t.recommendation}</th>
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
                        {scenario.years} {scenario.years === 1 ? t.year : t.years}
                        {isBest && <span data-testid="best-option" className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">{t.best}</span>}
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
          <h2 className="text-2xl font-semibold mb-4">{t.breakdownTitle}</h2>

          <div className="space-y-6">
            {/* Loading Increase Cost */}
            <div className="p-4 bg-white rounded-md border border-yellow-300">
              <h3 className="font-semibold text-lg mb-2 text-red-700">1. {t.loadingIncreaseCost}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {t.loadingIncreaseCostDesc}
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
              <h3 className="font-semibold text-lg mb-2 text-red-700">2. {t.mlsPaidDuring}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {t.mlsPaidDuringDesc}
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
              <h3 className="font-semibold text-lg mb-2 text-green-700">3. {t.premiumSaved}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {t.premiumSavedDesc}
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
              <h3 className="font-semibold text-lg mb-2">{t.netCostDelaying}</h3>
              <div className="font-mono text-sm mb-2">
                {formatCurrency(breakdownValues.loadingIncreaseCost)} + {formatCurrency(breakdownValues.mlsCost)} + (-{formatCurrency(Math.abs(breakdownValues.premiumSaved))})
              </div>
              <div className={`text-2xl font-bold ${breakdownValues.netCost < 0 ? 'text-green-600' : breakdownValues.netCost > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                = {breakdownValues.netCost < 0 ? '-' : ''}{formatCurrency(Math.abs(breakdownValues.netCost))}
                {breakdownValues.netCost < 0 && <span className="text-sm font-normal ml-2">({t.youSave})</span>}
                {breakdownValues.netCost > 0 && <span className="text-sm font-normal ml-2">({t.youPay})</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
