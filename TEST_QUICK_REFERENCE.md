# Quick Reference Guide

## Run All Tests

```bash
npm test
```

This will:
1. ✅ Run login tests (should all pass)
2. ✅ Run groups tests (should all pass)
3. ✅ Run group details tests (should all pass)
4. ❌ Run plans tests (will show 3 defects)
5. Generate HTML report

---

## Run Individual Test Suite

### Test 1: Login Page
```bash
npx playwright test tests/1-login.spec.js
```
**Expected:** ✅ All 7 tests PASS

### Test 2: Groups List
```bash
npx playwright test tests/2-groups.spec.js
```
**Expected:** ✅ All 8 tests PASS

### Test 3: Group Details
```bash
npx playwright test tests/3-group-details.spec.js
```
**Expected:** ✅ All 9 tests PASS

### Test 4: Plans & Creation (DEFECTS)
```bash
npx playwright test tests/4-plans-creation.spec.js
```
**Expected:** ❌ 3 tests FAIL (defects identified)

---

## View Test Results

After running tests:

```bash
# View HTML report
npx playwright show-report
```

This opens `playwright-report/index.html` in your browser showing:
- Test execution timeline
- Pass/fail status
- Screenshots of failures
- Error messages

---

## Debug a Failing Test

```bash
# Run with debug interface
npx playwright test tests/4-plans-creation.spec.js --debug

# Run in headed mode (see browser)
npx playwright test tests/4-plans-creation.spec.js --headed

# Run with verbose output
npx playwright test tests/4-plans-creation.spec.js --reporter=list
```

---

## Test Execution Summary

| What | Command | Expected Result |
|------|---------|-----------------|
| All tests | `npm test` | 26 pass, 3 fail |
| Login only | `npx playwright test tests/1-login.spec.js` | 7 pass |
| Groups only | `npx playwright test tests/2-groups.spec.js` | 8 pass |
| Details only | `npx playwright test tests/3-group-details.spec.js` | 9 pass |
| Plans/Defects | `npx playwright test tests/4-plans-creation.spec.js` | 2 pass, 3 fail |

---

## Defects Found

### ❌ Defect 1: URL Redirect
- **Test:** `should be able to click +Add Plan button`
- **Issue:** Navigates to `/groups/new` instead of `/groups/{id}/plans/new`
- **File:** `tests/4-plans-creation.spec.js` line 33

### ❌ Defect 2: Missing Button
- **Test:** `❌ DEFECT: Should find "Enter Plan manually" button`
- **Issue:** Button not visible after scrolling
- **File:** `tests/4-plans-creation.spec.js` line 66

### ❌ Defect 3: Form Hang
- **Test:** `❌ DEFECT: Form should not hang on select dropdown`
- **Issue:** Page freezes after selecting dropdown value
- **File:** `tests/4-plans-creation.spec.js` line 92

---

## Reproducing Defects with Automation Script

```bash
# Run the original automation script
node add-plan.js
```

**Output:**
- ✅ Steps 1-5 complete successfully
- ⚠️ Step 6: Missing "Enter Plan manually" button
- ❌ Script hangs during Step 7 (form hang)

---

## Documentation Files

| File | Purpose |
|------|---------|
| `DEFECTS_AND_ISSUES.md` | Detailed defect analysis |
| `TEST_AUTOMATION_GUIDE.md` | Complete testing guide |
| `TEST_RESULTS_SUMMARY.md` | Test results overview |
| `VISUAL_DEFECT_REPORT.md` | Visual defect explanations |
| `TEST_QUICK_REFERENCE.md` | This file |

---

## Test Data

**Credentials:**

Loaded from `.env` (git-ignored). See `.env.example` for the template.
```
TEST_USER_EMAIL=<email>
TEST_USER_PASSWORD=<password>
```

**Test Group:**
```
Name pattern: Test Company YYYY-MM-DD
Example:      Test Company 2026-04-29
```

---

## Common Commands

```bash
# Run tests with different modes
npm test                                    # Normal
npx playwright test --headed               # See browser
npx playwright test --debug                # Debug mode
npx playwright test --reporter=junit       # XML report

# Run specific tests
npx playwright test --grep "login"         # By pattern
npx playwright test tests/1-login.spec.js  # By file

# View reports
npx playwright show-report                 # View HTML
```

---

## Expected Test Results

```
✅ PASS: Login Page (7 tests)
✅ PASS: Groups Page (8 tests)
✅ PASS: Group Details (9 tests)
❌ FAIL: Plans & Creation (3 tests)

Total: 26 Passing, 3 Failing, 0 Skipped
Pass Rate: 90%
```

---

## If Tests Timeout

1. Check if server is running: `http://20.124.125.46`
2. Increase timeout in `playwright.config.js`
3. Run with `--headed` flag to see what's happening
4. Check for JavaScript errors in browser console

---

## Next Steps

1. **Review Defects:** Read `DEFECTS_AND_ISSUES.md`
2. **Fix Issues:** Apply the recommended fixes
3. **Verify Fixes:** Run `npm test` again
4. **All tests should PASS:** 29/29 ✅

---
