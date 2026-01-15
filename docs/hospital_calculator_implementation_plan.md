# Hospital Insurance Calculator - Implementation Plan

This document outlines the vertical slicing approach for building the Australian Private Hospital Insurance Cost Calculator as described in `docs/hospital_insurance_cost_formula.md`.

## Overview

**Goal:** Build a calculator tool as the homepage that helps users evaluate whether to purchase Australian private hospital insurance immediately or delay.

**Approach:** Test-first development with vertical slicing - each slice delivers end-to-end functionality that can be visually verified.

---

## Vertical Slices

### ✅ Slice 0: POC - Basic Homepage (COMPLETED)

**Status:** ✅ Implemented and committed

**What was delivered:**
- New homepage at `/` with calculator component
- Basic heading "Hospital Insurance Calculator"
- Placeholder text "Calculator coming soon..."
- Page title and metadata set

**Visual verification:**
- Visit http://localhost:3000
- See heading and placeholder text

**Tests:**
- ✅ `tests/e2e/hospital-calculator-poc.e2e.spec.ts`

---

### Slice 1: Basic Calculator with Core Formula

**Goal:** Prove the core calculation works with minimal inputs.

**What you'll see:**
- Simple form with 3 inputs:
  - Age (number input)
  - Annual Income (dollar input)
  - Base Premium (dollar input, default $2000)
- "Calculate" button
- Result display showing:
  - Net additional cost for delaying 1 year
  - Clear message: "Delaying 1 year costs $XXX more" or "saves $XXX"

**Hardcoded assumptions for this slice:**
- Single person (not family)
- Delay years: 1 (fixed)
- No immigrant status (Australian born, base age 30)
- Auto-calculate MLS rate from income
- Auto-calculate current loading L₀ from age

**Formula used:**
```
Net Additional Cost = P × X × 0.2 + Income × MLS Rate × X - P × (1 + L₀) × X
Where: X = 1 year (hardcoded)
```

**Example:**
```
Input:
- Age: 28
- Income: $120,000
- Premium: $2,000

Output:
"Delaying 1 year saves $100"
(or shows the actual calculated amount)
```

**What to verify:**
- Form accepts inputs
- Calculation displays a result
- Result makes sense for known test cases

---

### Slice 2: Family Status & MLS Auto-Calculation

**Goal:** Accurate MLS calculation based on family status.

**What you'll see:**
- Toggle: Single / Family
- If Family selected:
  - Input: Number of children (affects threshold)
- Display below income field:
  - "Your MLS rate: X.XX%"
  - "Tier X: $XX,xxx - $XX,xxx" (explanation)

**New functionality:**
- MLS rate updates dynamically as you change:
  - Income amount
  - Single/Family toggle
  - Number of children
- Calculation result updates accordingly

**Example:**
```
Input:
- Single, Income $120,000
Display: "Your MLS rate: 1.25% (Tier 2: $113k-$151k)"

Input:
- Family, Income $200,000, 2 children
Display: "Your MLS rate: 1.0% (Tier 1: $194k-$226k)"
```

**What to verify:**
- Toggle between Single/Family works
- MLS rate displays correctly
- Thresholds adjust for number of children
- Calculation updates with correct MLS rate

---

### Slice 3: Loading Calculation (Age-based & Immigrant)

**Goal:** Accurate loading calculation for both locals and immigrants.

**What you'll see:**
- Checkbox: "Are you an immigrant?"
- If checked:
  - Date picker: "When did you get Medicare?" (or age when got Medicare)
- Display below age field:
  - "Your current loading: X%"
  - Explanation: "You are X years late"

**New functionality:**
- For Australian born/childhood immigrants:
  - L₀ calculated from age (base age 30)
  - Shows: "Your current loading: 0%" if age < 30
  - Shows: "Your current loading: 10% (5 years late)" if age 35
- For adult immigrants:
  - L₀ calculated from Medicare date
  - Shows grace period status if within 12 months

**Example:**
```
Australian born, Age 35:
Display: "Your current loading: 10% (5 years past age 30)"

Immigrant, Age 42, got Medicare at 39:
Display: "Your current loading: 4% (2 years past grace period)"
```

**What to verify:**
- Checkbox toggles immigrant mode
- Loading calculation is correct for locals
- Loading calculation is correct for immigrants
- Display shows clear explanation

---

### Slice 4: Multi-Year Comparison

**Goal:** Compare costs for different delay scenarios.

**What you'll see:**
- Slider or number input: "Delay years" (1-10)
- OR: Checkboxes for quick selection (1, 3, 5, 10 years)
- Comparison table:

| Delay Years | Net Additional Cost | Recommendation |
|-------------|--------------------:|----------------|
| 1 year      | -$200 (saves)       | Can wait       |
| 3 years     | +$500 (costs)       | Consider risk  |
| 5 years     | +$2,000 (costs)     | Buy now        |
| 10 years    | +$5,000 (costs)     | Buy now        |

- Optional: Simple bar chart visualization

**New functionality:**
- Select multiple delay periods
- See side-by-side comparison
- Identify which delay option is most economical
- Highlight best option (most negative = saves most)

**What to verify:**
- Can select multiple delay periods
- Table shows all selected periods
- Calculations are correct for each period
- Best option is highlighted

---

### Slice 5: Detailed Formula Breakdown

**Goal:** Educational transparency - show how the calculation works.

**What you'll see:**
- "Show calculation details" expandable section
- When expanded, shows:

```
Calculation Breakdown:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Loading increase cost:
   P × X × 0.2 = $2,000 × 3 × 0.2 = $1,200

2. MLS paid during delay:
   Income × MLS Rate × X
   = $120,000 × 1.25% × 3 = $4,500

3. Premium saved during delay:
   -P × (1 + L₀) × X
   = -$2,000 × 1.04 × 3 = -$6,240

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Net Additional Cost = $1,200 + $4,500 - $6,240
                    = -$540 (saves money by waiting)
```

**New functionality:**
- Toggle details on/off
- See each component of the formula
- Understand where numbers come from
- Help users learn the calculation

**What to verify:**
- Details section expands/collapses
- All three components shown
- Math is clear and correct
- Final total matches main result

---

### Slice 6: Decision Recommendation & Warnings

**Goal:** Actionable guidance, not just numbers.

**What you'll see:**
- Colored recommendation box at top of results:
  - 🟢 Green: "Recommend buying now" (cost > $3,000)
  - 🟡 Yellow: "Can wait, but consider risks" (cost $0-$3,000)
  - 🔵 Blue: "Economically can wait" (saves money)

- Age-based warnings:
  - Age < 30: "⏰ Buy before age 30 to avoid loading"
  - Age 30-40: "Consider health risks and long-term plans"
  - Age 40+: "⚠️ Health risks increase with age"

- Risk factors highlighted:
  - "You will pay MLS: $X,XXX over X years"
  - "Loading will increase by X%"
  - "Consider: waiting periods, health changes"

- Link to decision flowchart (from formula doc)

**New functionality:**
- Smart recommendations based on:
  - Net additional cost
  - Age
  - MLS status
- Clear warnings about non-economic factors
- Educational content

**Example:**
```
🟢 Recommendation: Buy now
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Delaying 5 years costs $2,500 more

Factors to consider:
⚠️ Age 45: Health risks increasing
💰 You'll pay $13,500 in MLS over 5 years
📈 Loading will increase by 10%

⚕️ Important: Medical costs not included
Any surgery could cost $10,000-$30,000
```

**What to verify:**
- Recommendation matches cost thresholds
- Age warnings appear appropriately
- Risk factors are highlighted
- Links to more info work

---

### Slice 7: Polish & Bilingual Support

**Goal:** Production-ready UI with EN/中文 support.

**What you'll see:**
- Language toggle (EN / 中文) in top right
- All text switches between English and Chinese
- Responsive design:
  - Mobile: Stacked layout
  - Tablet: 2-column
  - Desktop: Optimized spacing
- Professional styling:
  - shadcn/ui components throughout
  - Consistent color scheme
  - Proper spacing and typography
  - Loading states for calculations
- Help tooltips:
  - Hover/click icons next to labels
  - Show explanations for complex terms
  - Link to formula documentation
- Actions:
  - Print button (printer-friendly layout)
  - Share button (copy link with inputs)
  - Reset button (clear all inputs)

**New functionality:**
- Full internationalization (i18n)
- Responsive across all devices
- Polished UI/UX
- User convenience features

**What to verify:**
- Language toggle works perfectly
- All text is translated
- Layout looks good on mobile/tablet/desktop
- Tooltips are helpful
- Print layout is clean
- Share functionality works

---

## Implementation Notes

### Order of Implementation

The slices are ordered to:
1. **Prove core functionality first** (Slice 1)
2. **Add accuracy** (Slices 2-3)
3. **Add utility** (Slice 4)
4. **Add education** (Slice 5)
5. **Add guidance** (Slice 6)
6. **Add polish** (Slice 7)

### Test-First Development

For **each slice**:
1. Write Playwright e2e tests first
2. Submit tests for user review
3. Wait for approval
4. Implement to make tests pass
5. User verifies visually
6. Commit and move to next slice

### Visual Verification Checklist

After each slice, verify:
- ✅ Form inputs work
- ✅ Calculations are correct
- ✅ Display is clear
- ✅ No console errors
- ✅ Tests pass

---

## Technical Decisions

### Component Structure

```
src/components/
├── HospitalCalculator.tsx          (Main component)
├── calculator/
│   ├── CalculatorForm.tsx          (Form inputs)
│   ├── CalculatorResults.tsx       (Results display)
│   ├── MLSRateDisplay.tsx          (MLS info)
│   ├── LoadingDisplay.tsx          (Loading info)
│   ├── ComparisonTable.tsx         (Multi-year table)
│   ├── CalculationBreakdown.tsx    (Formula details)
│   └── RecommendationBox.tsx       (Decision guidance)
```

### State Management

- Start with React `useState` for simplicity
- Consider Zustand/Context if state gets complex

### Styling

- TailwindCSS for styling
- shadcn/ui components for UI elements
- Responsive design with mobile-first approach

### Internationalization

- Next.js i18n or react-i18next
- Translation files for EN and 中文
- Slice 7 only

---

## Success Criteria

### Each Slice

- ✅ All e2e tests pass
- ✅ Visually verified by user
- ✅ No breaking changes to previous slices
- ✅ Code committed

### Final Product

- ✅ Calculator homepage at `/`
- ✅ Accurate calculations matching formula doc
- ✅ Bilingual (EN/中文)
- ✅ Responsive design
- ✅ User-friendly with clear guidance
- ✅ Well-tested with Playwright e2e tests

---

## Current Status

- ✅ **Slice 0 (POC):** Complete - Basic homepage with calculator component
- ✅ **Slice 1:** Complete - Basic calculator with core formula (1-year delay, single person)
- ✅ **Refactoring:** Complete - Extracted all calculation logic with 31 unit tests
- ✅ **Slice 2:** Complete - Family status & MLS auto-calculation
- ✅ **Slice 3:** Complete - Loading calculation (age-based & immigrant)
- ✅ **Slice 4:** Complete - Multi-year comparison with cost scenarios
- ✅ **Slice 5:** Complete - Detailed formula breakdown
- ⏳ **Slice 6:** Pending - Decision recommendation & warnings
- ⏳ **Slice 7:** Pending - Polish & bilingual support

---

## Next Steps

1. ~~Review this plan and approve/adjust slices~~ ✅
2. ~~Write Playwright tests for Slice 1~~ ✅
3. ~~Get approval on tests~~ ✅
4. ~~Implement Slice 1~~ ✅
5. ~~Verify and commit~~ ✅
6. Continue with remaining slices

---

## Session 1 Summary (January 13, 2026)

### Completed Work

1. **Slice 0 (POC)** ✅
   - Created basic homepage with calculator component
   - Tests: 2 e2e tests passing
   - Commit: f8f6160

2. **Slice 1 (Basic Calculator)** ✅
   - Implemented core formula with 3 inputs (age, income, premium)
   - 1-year delay calculation (hardcoded)
   - Single person, Australian born (hardcoded)
   - Tests: 8 e2e tests passing
   - Commit: 789f671

3. **Refactoring (Calculation Logic)** ✅
   - Extracted all calculation logic to `src/utilities/hospitalCalculator.ts`
   - Created comprehensive unit tests (31 tests)
   - All calculations verified against requirements doc
   - Tests: 31 unit tests + 8 e2e tests passing
   - Commit: f103585

### Test Coverage

- **Unit tests:** 31 passing (calculator logic)
- **E2E tests:** 8 passing (Slice 1) + 2 passing (POC)
- **Total:** 41 tests passing

### Files Created/Modified

```
src/components/HospitalCalculator.tsx          (created, refactored)
src/app/(frontend)/page.tsx                    (modified)
src/utilities/hospitalCalculator.ts            (created)
tests/e2e/hospital-calculator-poc.e2e.spec.ts  (created)
tests/e2e/hospital-calculator-slice1.e2e.spec.ts (created)
tests/int/calculator.int.spec.ts               (created)
docs/hospital_calculator_implementation_plan.md (created)
playwright.config.ts                           (modified)
README.md                                      (modified)
```

---

## Session 2 Summary (January 14, 2026)

### Completed Work

1. **Slice 2 (Family Status & MLS Auto-Calculation)** ✅
   - Implemented Single/Family toggle with conditional UI
   - Added number of children input (visible only when Family selected)
   - Real-time MLS rate calculation and display
   - Tier explanation showing income ranges
   - Dynamic threshold adjustments based on children count
   - Tests: 14 new e2e tests passing
   - Commit: 4321424

### Test Coverage

- **Unit tests:** 31 passing (calculator logic)
- **E2E tests:** 25 passing (2 POC + 8 Slice 1 + 14 Slice 2 + 1 frontend)
- **Total:** 56 tests passing

### Files Created/Modified

```
src/components/HospitalCalculator.tsx                    (modified - added family toggle & MLS display)
tests/e2e/hospital-calculator-slice2.e2e.spec.ts        (created - 14 tests)
tests/e2e/frontend.e2e.spec.ts                          (modified - updated for new homepage)
tests/e2e/hospital-calculator-poc.e2e.spec.ts           (modified - updated POC test)
```

### Features Delivered

- Single/Family toggle buttons with visual active state
- Conditional children input (0-10)
- MLS rate display card with:
  - Current rate (0%, 1.0%, 1.25%, 1.5%)
  - Tier level (Tier 0-3)
  - Income range explanation
- Real-time dynamic updates

---

## Session 3 Summary (January 15, 2026)

### Completed Work

1. **Slice 4 (Multi-Year Comparison)** ✅
   - Implemented delay years input (1-10 years, default 1)
   - Show/Hide comparison table button
   - Comparison table with 4 scenarios (1, 3, 5, 10 years)
   - Net cost calculation for each scenario
   - Recommendations (Buy now / Consider / Can wait)
   - Best option highlighting (most economical choice)
   - Dynamic updates based on all current settings
   - Works with family status and immigrant calculations
   - Tests: 19 new e2e tests passing
   - Commit: d6c4fcb

### Bug Fixes

- Fixed property name bug: `result.netAdditionalCost` → `result.netCost`
  - Was causing "$NaN" display in comparison table
  - Added improved NaN validation for comparison scenarios

### Test Coverage

- **Unit tests:** 31 passing (calculator logic)
- **E2E tests:** 61 passing (1 skipped)
- **Total:** 92 tests passing

### Files Created/Modified

```
src/components/HospitalCalculator.tsx           (modified - added multi-year comparison)
tests/e2e/hospital-calculator.e2e.spec.ts       (modified - added 19 Slice 4 tests)
```

### Features Delivered

- Delay years input with validation (1-10)
- Toggle comparison table visibility
- Multi-year cost comparison (1, 3, 5, 10 years)
- Best option highlighting with green background
- Dynamic recommendations based on thresholds
- Currency formatting for all costs
- Proper handling of negative costs (savings)

### Slice 5 Completed

2. **Slice 5 (Detailed Formula Breakdown)** ✅
   - Implemented toggle button "Show Details" / "Hide Details"
   - Expandable breakdown section showing:
     - Loading increase cost: P × X × 0.2
     - MLS paid during delay: Income × MLS Rate × X
     - Premium saved during delay: -P × (1 + L₀) × X
   - Net cost calculation with all values displayed
   - Dynamic updates when inputs change
   - Tests: 18 new e2e tests passing
   - Commit: 9602d68

### Ready for Next Session

**Next task:** Slice 6 - Decision Recommendation & Warnings

Features to implement:
- Colored recommendation box at top of results:
  - 🟢 Green: "Recommend buying now" (cost > $3,000)
  - 🟡 Yellow: "Can wait, but consider risks" (cost $0-$3,000)
  - 🔵 Blue: "Economically can wait" (saves money)
- Age-based warnings
- Risk factors highlighted (MLS cost, loading increase)

---

**Last Updated:** January 15, 2026
