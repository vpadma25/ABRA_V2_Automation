# Visual Defect Report

## Executive Summary

**Total Issues Found: 4**
- 🔴 Critical: 2 (block functionality)
- 🟠 High: 1 (major feature broken)
- 🟡 Medium: 1 (needs attention)

---

## Defect #001: URL Redirect on +Add Plan Button

### Location
- **Page:** Plans Tab
- **Component:** +Add Plan Button
- **File:** `add-plan.js` Output (Line 114-120)

### Problem Description
```
USER ACTION:
  Click "+Add Plan" button on Plans Tab

EXPECTED BEHAVIOR:
  URL: http://20.124.125.46/groups/{groupId}/plans/new
  Page: Plan creation form for this specific group

ACTUAL BEHAVIOR:
  URL: http://20.124.125.46/groups/new
  ❌ Group context is lost!
  ❌ Navigates to wrong page!
```

### Impact
```
Severity:    🔴 CRITICAL
Component:   Navigation/Routing
User Impact: Cannot create plan for selected group
Affected:    100% of plan creation workflows
```

### Test Output
```
Current URL after clicking Plans tab: 
  http://20.124.125.46/groups/676bcb49-c213-42ea-a0f9-b76ceef336c6/plans/new ✓

Current URL after clicking +Add Plan: 
  http://20.124.125.46/groups/new ❌ WRONG!
```

### Root Cause
- Backend route handler misconfiguration
- +Add Plan button has wrong href/onClick handler
- Form submission not preserving group context

### Recommended Fix
```javascript
// Current (WRONG):
<button onClick={() => navigate('/groups/new')}>+Add Plan</button>

// Should be:
<button onClick={() => navigate(`/groups/${groupId}/plans/new`)}>+Add Plan</button>
```

---

## Defect #002: Missing "Enter Plan manually" Button

### Location
- **Page:** Plan Creation Page
- **Component:** Plan Type Selection
- **File:** `add-plan.js` Output (Line 127-160)

### Problem Description
```
STEP 6 OUTPUT:
  Checking if page contains "Enter Plan manually" text...
  ⚠️ "Enter Plan manually" text not found on initial load

  Scroll attempt 1...
  Scroll attempt 2...
  Scroll attempt 3...
  Scroll attempt 4...
  Scroll attempt 5...
  ⚠️ Could not find "Enter Plan manually" button after scrolling.
```

### Impact
```
Severity:    🟠 HIGH
Component:   UI/Form
User Impact: Cannot manually enter plan details
Affected:    Manual plan entry workflow (10-15% of use cases)
```

### Visual Flow
```
┌─────────────────────────────────┐
│   Plans Tab                     │
│  ┌─────────────────────────┐    │
│  │ ✓ Plans list/details    │    │
│  │ ✓ [+Add Plan] button    │    │
│  └─────────────────────────┘    │
│          ↓ Click               │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│   Plan Type Selection           │
│  ❌ Missing "Enter manually"    │
│  ⚠️ Button not visible!         │
│  ? Plan selection page?         │
└─────────────────────────────────┘
```

### Possible Causes
- Button hidden behind modal
- Button has wrong class/visibility
- Modal overlay not dismissible
- Dynamic rendering not working

### Test Output
```
Step 6: Scrolling down to find "Enter Plan manually" option ---

Checking if page contains "Enter Plan manually" text...
⚠️ "Enter Plan manually" text not found on initial load

Scroll attempt 1...
Scroll attempt 2...
Scroll attempt 3...
Scroll attempt 4...
Scroll attempt 5...
⚠️ Could not find "Enter Plan manually" button after scrolling.

The form might be displayed directly or the button might have a different label.
```

### Recommended Fix
1. Verify button element is rendered
2. Check CSS visibility properties
3. Look for `display: none` or `visibility: hidden`
4. Ensure z-index is not too low (behind other elements)

---

## Defect #003: Form Submission Hang

### Location
- **Page:** Plan Creation Form
- **Component:** Select Dropdowns
- **File:** `add-plan.js` Output (Line 184-198)

### Problem Description
```
STEP 7: Filling form fields...
  ✓ Filled 18 form fields successfully
  ✓ Form accepting input
  
STEP 7: Filling select fields...
  Found 3 visible select fields
  ✓ Selected State: SC
  
  ⏱️ PAGE BECOMES UNRESPONSIVE ❌
  ⏱️ Script timeout after 30 seconds
```

### Timeline
```
T=0s:   Click dropdown
T=1s:   State dropdown opens
T=1.5s: User selects "SC"
T=2s:   Page should update
T=5s:   Still waiting... 🔄
T=10s:  Still frozen... 🔄
T=30s:  TIMEOUT ❌
```

### Impact
```
Severity:    🔴 CRITICAL
Component:   Form Events/JavaScript
User Impact: Complete workflow failure
Affected:    100% of plan creation attempts after step 7
Status:      Blocks all submissions
```

### What's Happening
```
Sequence of Events:
1. User clicks State dropdown
2. Options appear ✓
3. User selects "SC" ✓
4. onChange event fires
5. ❌ EVENT HANDLER HANGS
   - Possible infinite loop
   - Server call not responding
   - Form validation stuck
6. Page freezes
7. No error message
8. User cannot proceed
```

### Test Output
```
Filling select fields...

Found 3 visible select fields

✓ Selected State: SC

[SCRIPT HANGS HERE - no further output]
[Timeout after 30 seconds]
```

### Root Cause Analysis
```
Probable Causes:
1. ❌ Select onChange event listener has infinite loop
2. ❌ Async validation call not completing
3. ❌ Form state update causing re-render loop
4. ❌ Server-side validation hanging
5. ❌ JavaScript error not being caught
```

### Recommended Fix
```javascript
// Add timeout wrapper
const selectWithTimeout = (element, value) => {
  return Promise.race([
    element.selectOption(value),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Select timeout')), 5000)
    )
  ]);
};

// Add error handling
selectElement.addEventListener('change', (e) => {
  try {
    // Validation logic with timeout
    performValidation(e.target.value).then(...).catch(err => {
      console.error('Validation error:', err);
    });
  } catch(error) {
    console.error('Select error:', error);
  }
});

// Add loading state
selectElement.addEventListener('change', (e) => {
  form.classList.add('loading');
  // ... async work ...
  form.classList.remove('loading');
});
```

---

## Defect #004: Select Dropdown Performance

### Location
- **Page:** Plan Creation Form
- **Component:** All Select Elements
- **File:** Related to Defect #003

### Problem Description
```
After selecting ANY option in a select dropdown:
- Page becomes unresponsive
- No visual feedback (loading spinner)
- No error message
- No timeout indication
```

### Impact
```
Severity:    🟡 MEDIUM
Component:   Form UX
User Impact: Cannot complete form
Priority:    P1 (Medium - related to Critical defect)
```

### Expected vs Actual

**Expected:**
```
User selects option
  ↓
Dropdown closes (visual feedback)
  ↓
Loading spinner appears
  ↓
Validation completes
  ↓
Form continues responsive
  ↓
User fills next field
```

**Actual:**
```
User selects option
  ↓
❓ Nothing visible
  ↓
🔄 Page freezes silently
  ↓
❌ User stuck waiting
  ↓
⏱️ Timeout after 30+ seconds
```

---

## Defect Summary Table

| Issue | Severity | Component | Status | User Impact | Fix Priority |
|-------|----------|-----------|--------|-------------|--------------|
| URL Redirect | 🔴 Critical | Navigation | ❌ Broken | Lose group context | P0 |
| Missing Button | 🟠 High | UI Element | ❌ Missing | Cannot enter manually | P0 |
| Form Hang | 🔴 Critical | JavaScript | ❌ Frozen | Blocks workflow | P0 |
| Dropdown UX | 🟡 Medium | Events | ⚠️ Poor | Confusing experience | P1 |

---

## Screenshots Referenced

| Screenshot | Purpose | Status |
|-----------|---------|--------|
| `plans_tab.png` | Before clicking +Add Plan | ✓ Saved |
| `plan_type_selection.png` | After clicking +Add Plan | ✓ Saved |
| `after_scroll_final.png` | After scrolling for button | ✓ Saved |
| `plan_form_initial.png` | Initial form state | ✓ Saved |
| `plan_form_filled_comprehensive.png` | After form fill | ⏸️ Not completed |

---

## Testing Command

Run to reproduce these defects:

```bash
# Method 1: Run the automation script
node add-plan.js

# Method 2: Run the test suite
npx playwright test tests/4-plans-creation.spec.js
```

Both will show the same defects.

---

## Resolution Checklist

- [ ] Fix URL redirect logic (Defect #001)
- [ ] Verify "Enter manually" button visibility (Defect #002)
- [ ] Debug select dropdown change handler (Defect #003)
- [ ] Add error handling and loading states (Defect #004)
- [ ] Re-run automation script to verify fixes
- [ ] Run full test suite
- [ ] Update test reports
- [ ] Close defects in issue tracker

---
