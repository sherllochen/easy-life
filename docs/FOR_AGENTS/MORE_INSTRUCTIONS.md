# Development Instructions for AI Agents

This document provides critical guidelines for AI agents working on feature development in this repository.

## 1. Vertical Feature Slicing

**Always split feature development vertically to enable visual verification at each step.**

### What is Vertical Slicing?

Break down features into thin, end-to-end slices that go through all layers of the application (UI → API → Database). Each slice should be:
- **Independently deployable** - Can be merged and deployed without breaking existing functionality
- **Visually verifiable** - User can see and test the change in the browser/UI
- **Incrementally valuable** - Delivers a small but complete piece of functionality

### Why Vertical Slicing?

- ✅ Enables continuous visual verification by the user
- ✅ Reduces integration risks
- ✅ Provides faster feedback loops
- ✅ Makes it easier to catch issues early
- ✅ Keeps each PR small and reviewable

### How to Apply Vertical Slicing

**Bad Example (Horizontal Slicing):**
```
Task: Add user profile editing feature

❌ Step 1: Create all database schema changes
❌ Step 2: Build all API endpoints
❌ Step 3: Build all UI components
❌ Step 4: Connect everything together

Problem: Nothing is visually verifiable until step 4!
```

**Good Example (Vertical Slicing):**
```
Task: Add user profile editing feature

✅ Slice 1: Display current user profile (read-only)
   - Add API endpoint to fetch user data
   - Create basic profile page component
   - Display name and email fields
   → User can see their profile information

✅ Slice 2: Enable editing name field
   - Add API endpoint to update name
   - Add edit button and input field for name
   - Wire up save functionality
   → User can edit and save their name

✅ Slice 3: Enable editing email field
   - Add API endpoint to update email with validation
   - Add edit input for email
   - Add email validation
   → User can edit and save their email

✅ Slice 4: Add profile photo upload
   - Integrate with Media collection
   - Add photo upload UI
   - Display uploaded photo
   → User can upload and see their profile photo
```

### Applying to Payload CMS Features

When working with Payload CMS collections and features:

**Example: Adding a "Product Reviews" feature**

```
✅ Slice 1: Basic review collection
   - Create Reviews collection with minimal fields (rating, comment)
   - Add to Payload config
   - Verify in admin panel: Can create/view reviews

✅ Slice 2: Link reviews to products
   - Add relationship field to Products collection
   - Update admin UI to show related reviews
   - Verify in admin panel: Can link reviews to products

✅ Slice 3: Display reviews on frontend
   - Fetch reviews in product page
   - Display review list on frontend
   - Verify in browser: Reviews appear on product pages

✅ Slice 4: Add review submission form
   - Create frontend form component
   - Add form validation
   - Wire up to Payload API
   - Verify in browser: Users can submit reviews
```

### Guidelines

1. **Start with the simplest end-to-end path** - Get something visible first, then enhance
2. **Each slice should be testable in the browser** - If it can't be seen/verified, it's not a good slice
3. **Prioritize happy path first** - Error handling and edge cases come after basic functionality works
4. **Keep slices small** - Aim for slices that take less than 30 minutes to implement
5. **Always ask yourself**: "Can the user verify this change visually right now?"

## 2. Test-First Development with Playwright

**MANDATORY: For all new features, write Playwright e2e tests BEFORE implementation.**

### Workflow (MUST FOLLOW EXACTLY)

1. **Understand the feature requirements** with the user
2. **Write Playwright e2e test(s)** that describe the expected behavior
   - Create comprehensive tests covering all scenarios
   - Include happy paths AND edge cases
   - Use proper data-testid attributes
3. **Submit tests for user review and approval**
   - Share the test file with the user
   - Explain what scenarios are being tested
   - **STOP HERE - DO NOT PROCEED TO IMPLEMENTATION**
4. **Wait for explicit user confirmation**
   - User will review the tests
   - User will either approve or request changes
   - Only proceed when user explicitly says "approved" or "go ahead"
5. **Implement the feature** to make the tests pass
   - Write minimal code to satisfy the tests
   - Follow existing patterns and conventions
6. **Run tests** to verify implementation
7. **Let user verify visually** in the browser
8. **Iterate** if tests fail or requirements change

### Why Test-First?

- ✅ Ensures shared understanding of requirements before coding
- ✅ Tests serve as executable specifications
- ✅ Prevents over-engineering or under-delivering
- ✅ Provides immediate feedback when implementation is complete
- ✅ Documents expected behavior for future developers
- ✅ Reduces wasted effort on wrong implementations

### CRITICAL RULE

**NEVER start implementation before test approval.** If you write tests and immediately start implementing without waiting for user confirmation, you are violating this workflow and may waste time implementing the wrong thing.

### Test Structure

**IMPORTANT: Organize tests by PAGE, not by feature slice.**

Tests are located in `tests/e2e/` with **one test file per page**:

```
tests/e2e/
├── homepage.e2e.spec.ts           # All tests for homepage
├── hospital-calculator.e2e.spec.ts # All tests for calculator page
├── product-detail.e2e.spec.ts      # All tests for product page
└── checkout.e2e.spec.ts            # All tests for checkout page
```

**Pattern:**

```typescript
import { test, expect } from '@playwright/test'

/**
 * Page Name E2E Tests
 *
 * This file contains all tests for the [page name] page.
 * Tests are organized by feature area but kept in one file
 * since they all test the same page.
 */

test.describe('Page Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/page-url')
  })

  // Group tests by feature area (slices)
  test.describe('Feature Area 1', () => {
    test('should do specific thing', async ({ page }) => {
      // Test code
    })
  })

  test.describe('Feature Area 2', () => {
    test('should do another thing', async ({ page }) => {
      // Test code
    })
  })
})
```

**When implementing slices:**
- Add new tests to the **same file** for the page
- Group related tests with `test.describe()`
- Keep all tests for one page together

### Example: Review Feature Tests

**Before implementation, write:**

```typescript
// tests/e2e/product-reviews.e2e.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Product Reviews', () => {
  test('should display existing reviews on product page', async ({ page }) => {
    await page.goto('/products/test-product')

    // Should see reviews section
    const reviewsSection = page.locator('[data-testid="reviews-section"]')
    await expect(reviewsSection).toBeVisible()

    // Should see at least one review
    const reviews = page.locator('[data-testid="review-item"]')
    await expect(reviews).toHaveCount(1, { timeout: 5000 })
  })

  test('should allow user to submit a new review', async ({ page }) => {
    await page.goto('/products/test-product')

    // Click "Write a Review" button
    await page.click('[data-testid="write-review-button"]')

    // Fill out review form
    await page.fill('[data-testid="review-comment"]', 'Great product!')
    await page.click('[data-testid="review-rating-5"]')

    // Submit
    await page.click('[data-testid="submit-review"]')

    // Should see success message
    await expect(page.locator('text=Review submitted')).toBeVisible()

    // Should see new review in the list
    await expect(page.locator('text=Great product!')).toBeVisible()
  })

  test('should show validation error for empty review', async ({ page }) => {
    await page.goto('/products/test-product')
    await page.click('[data-testid="write-review-button"]')

    // Try to submit without filling form
    await page.click('[data-testid="submit-review"]')

    // Should see validation error
    await expect(page.locator('text=Comment is required')).toBeVisible()
  })
})
```

**Then ask for review (REQUIRED):**
> "I've written the e2e tests for the product reviews feature. The tests cover:
> 1. Displaying existing reviews
> 2. Submitting a new review
> 3. Validation for empty reviews
>
> Please review the tests and let me know if they align with your requirements. I will wait for your approval before starting implementation."

**Wait for user to respond with approval before proceeding.**

### Running Tests

```bash
# Run all e2e tests
pnpm test:e2e

# Run specific test file
pnpm exec playwright test tests/e2e/product-reviews.e2e.spec.ts

# Run in UI mode (interactive)
pnpm exec playwright test --ui

# Run in headed mode (see browser)
pnpm exec playwright test --headed
```

### Test Best Practices

1. **Use data-testid attributes** - Add `data-testid` to components for reliable selectors
2. **Test user behavior, not implementation** - Focus on what users see and do
3. **Keep tests independent** - Each test should be able to run alone
4. **Use meaningful test descriptions** - Test names should describe the expected behavior
5. **Avoid hard-coded waits** - Use Playwright's auto-waiting and explicit assertions
6. **Test the happy path AND edge cases** - Cover both success and failure scenarios

## Summary

**Before starting any feature:**

1. ✅ Break it down into vertical slices
2. ✅ Write Playwright tests for the first slice
3. ✅ **STOP and submit tests to user for review**
4. ✅ **WAIT for explicit user approval**
5. ✅ Implement the slice (only after approval)
6. ✅ Verify tests pass
7. ✅ Let user verify visually
8. ✅ Commit the slice
9. ✅ Repeat for next slice

**Key Principles:**
- Make every change visually verifiable
- **Write tests BEFORE code (non-negotiable)**
- **Get approval BEFORE implementing (non-negotiable)**
- Keep changes small and incremental
- Prioritize user feedback over perfection

**Red Flags (What NOT to do):**
- ❌ Writing tests and implementation together
- ❌ Starting implementation without test approval
- ❌ Assuming tests are correct without user review
- ❌ Implementing multiple slices at once
- ❌ Skipping visual verification
