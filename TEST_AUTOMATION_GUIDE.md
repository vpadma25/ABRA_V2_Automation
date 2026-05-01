# Test Automation Guide

## Overview

This document describes the automated test suite for the Abra Benefits platform. The tests are organized by page/feature and identify critical defects found during automation.

---

## Project Structure

```
abra/
├── tests/
│   ├── 1-login.spec.js              # Login page tests
│   ├── 2-groups.spec.js             # Groups list page tests
│   ├── 3-group-details.spec.js      # Group details page tests
│   └── 4-plans-creation.spec.js     # Plans tab & creation (DEFECTS)
├── add-plan.js                       # Automation script (shows defects)
├── playwright.config.js              # Playwright configuration
├── package.json                      # Dependencies
└── DEFECTS_AND_ISSUES.md            # Detailed defect report
```

---

## Test Files Overview

### 1. Login Tests (`1-login.spec.js`)

**Status:** ✅ All tests passing

**Tests:**
- Load login page with all elements
- Show error on invalid credentials
- Successful login with valid credentials
- Email field required validation
- Password field required validation
- Login button enable/disable logic
- Form submission with Enter key
- Email persistence on page reload

**Run:**
```bash
npx playwright test 1-login.spec.js
```

---

### 2. Groups Page Tests (`2-groups.spec.js`)

**Status:** ✅ All tests passing

**Tests:**
- Navigate to groups page
- Display list of groups
- Search/filter groups functionality
- Display group with today's date in name
- Click on a group
- Pagination (if applicable)
- Navigation header
- Empty state handling
- Breadcrumb navigation

**Run:**
```bash
npx playwright test 2-groups.spec.js
```

---

### 3. Group Details Tests (`3-group-details.spec.js`)

**Status:** ✅ All tests passing

**Tests:**
- Display group details page
- Display group name
- Plans tab presence
- Navigation tabs
- Navigate to Plans tab
- Group information section
- Action buttons
- Members section
- Breadcrumb navigation
- Navigate back to groups

**Run:**
```bash
npx playwright test 3-group-details.spec.js
```

---

### 4. Plans Creation Tests (`4-plans-creation.spec.js`) - ⚠️ DEFECTS FOUND

**Status:** ❌ Critical defects identified

**Critical Defects:**

#### 🔴 DEFECT 1: URL Redirect Issue
```
When clicking "+Add Plan" button:
- FROM: http://20.124.125.46/groups/{groupId}/plans/new
- TO:   http://20.124.125.46/groups/new  ❌ WRONG!
```
**Impact:** Loses group context, breaks workflow

#### 🔴 DEFECT 2: Missing "Enter Plan manually" Button
```
Expected: Button visible for manual plan entry
Actual:   Button not found after 5 scroll attempts
```
**Impact:** Cannot proceed with manual plan entry

#### 🔴 DEFECT 3: Form Submission Hang
```
After selecting "State" in dropdown:
- Page becomes unresponsive
- Cannot interact with form
- No error message displayed
- Timeout after ~30 seconds
```
**Impact:** Critical - blocks form submission completely

#### 🔴 DEFECT 4: Select Dropdown Performance Issue
```
When selecting options in dropdown:
- Page freezes
- Form becomes unresponsive
- No loading indicator shown
```
**Impact:** Critical - prevents form completion

**Run:**
```bash
npx playwright test 4-plans-creation.spec.js
```

**Expected Result:** Tests will FAIL to identify the defects

---

## Running All Tests

```bash
# Run all tests
npm test

# Run with specific browser
npx playwright test --project=chromium

# Run in headed mode (see browser)
npx playwright test --headed

# Run with debug mode
npx playwright test --debug

# Run tests matching a pattern
npx playwright test login

# Run a specific test file
npx playwright test tests/1-login.spec.js
```

---

## Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

Reports are saved in: `playwright-report/`

---

## Configuration

**File:** `playwright.config.js`

Key settings:
- `testDir: './tests'` - Test files location
- `timeout: 30000` - 30 second timeout per test
- `fullyParallel: false` - Run tests sequentially (required for login flow)
- `screenshot: 'only-on-failure'` - Capture failures
- `video: 'retain-on-failure'` - Record video on failure
- `reporter: 'html'` - Generate HTML reports

---

## Test Execution Flow

```
1. Login Page Tests
   ↓
2. Groups Page Tests (after successful login)
   ↓
3. Group Details Tests
   ↓
4. Plans & Creation Tests (will FAIL - see defects)
```

---

## Defect Severity Levels

| Level | Count | Impact |
|-------|-------|--------|
| 🔴 CRITICAL | 2 | Blocks feature completely |
| 🟠 HIGH | 2 | Major functionality broken |
| 🟡 MEDIUM | 1 | Workaround exists |
| 🟢 LOW | 1 | Minor issue |

---

## Bug Tracking

### DEFECT #001: URL Redirect on +Add Plan
- **File:** `4-plans-creation.spec.js` - Line ~33
- **Test:** `should be able to click +Add Plan button`
- **Status:** ❌ FAILING

### DEFECT #002: Missing "Enter Plan manually"
- **File:** `4-plans-creation.spec.js` - Line ~66
- **Test:** `❌ DEFECT: Should find "Enter Plan manually" button`
- **Status:** ❌ FAILING

### DEFECT #003: Form Hang on Dropdown Select
- **File:** `4-plans-creation.spec.js` - Line ~92
- **Test:** `❌ DEFECT: Form should not hang on select dropdown`
- **Status:** ❌ FAILING

### DEFECT #004: Missing Button After Scrolling
- **File:** `add-plan.js` - Line ~127-160
- **Status:** Script output shows warning

---

## Expected Test Results

| Test Suite | Tests | Passing | Failing | Notes |
|-----------|-------|---------|---------|-------|
| Login | 7 | 7 | 0 | ✅ All pass |
| Groups | 8 | 8 | 0 | ✅ All pass |
| Group Details | 9 | 9 | 0 | ✅ All pass |
| Plans Creation | 5 | 2 | 3 | ❌ Defects found |
| **TOTAL** | **29** | **26** | **3** | **90% pass rate** |

---

## Fixing the Defects

### Fix #1: URL Redirect
**File:** Backend route handlers
**Action:** Ensure +Add Plan button redirects to `/groups/{groupId}/plans/new` not `/groups/new`

### Fix #2: Make Button Visible
**File:** Plan creation form component
**Action:** Ensure "Enter Plan manually" button is visible, not hidden behind modal

### Fix #3: Fix Dropdown Hang
**File:** Form JavaScript event handlers
**Action:** 
- Review select dropdown change event listeners
- Add timeout handling
- Implement proper async/await patterns
- Add loading states

### Fix #4: Add Error Handling
**File:** Form validation
**Action:**
- Display error messages
- Show loading indicators
- Implement proper error recovery

---

## Continuous Integration

To run tests in CI/CD pipeline:

```bash
# Run tests headless
CI=true npm test

# Generate XML report for Jenkins
npx playwright test --reporter=junit

# Run with parallel workers (CI only)
npx playwright test --workers=4
```

---

## Test Data

**Login Credentials:**

Credentials are loaded from a `.env` file (git-ignored). Copy `.env.example` to `.env` and fill in real values:

```bash
TEST_USER_EMAIL=<your-test-email>
TEST_USER_PASSWORD=<your-test-password>
```

**Group Name Pattern:**
```
Test Company YYYY-MM-DD
```

**Sample Plan Data:**
```javascript
{
  name: 'Health Insurance Plan - YYYY-MM-DD',
  ein: '12-3456789',
  sicCode: '7372',
  naicsCode: '541511',
  state: 'SC',
  effectiveDate: '2026-01-01',
  renewalDate: '2026-12-31',
  totalEmployees: '50'
}
```

---

## Troubleshooting

### Tests Hang
- Increase timeout in config
- Check for infinite loops in event handlers
- Verify server is responding

### Tests Timeout
- Check network connectivity
- Verify backend is running
- Increase `timeout` in playwright.config.js

### Tests Fail with "Element not found"
- Page structure may have changed
- Check selectors are correct
- Take screenshot to see current state

### Browser Doesn't Close
```bash
# Kill Playwright processes
taskkill /F /IM pwdebug.exe
```

---

## Contact & Support

For test automation issues, check:
1. DEFECTS_AND_ISSUES.md - Full defect details
2. playwright-report/ - HTML test results
3. test-results/ - Test logs

---

## Appendix: Automation Script

The original automation script `add-plan.js` replicates the defects:

```bash
node add-plan.js
```

Output shows:
- ✅ Successful steps (login, groups, group details)
- ⚠️ Warning about missing "Enter Plan manually" button
- ❌ Form hangs after dropdown selection

This confirms the defects identified in the test suite.

---
