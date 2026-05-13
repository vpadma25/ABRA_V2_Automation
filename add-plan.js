require('dotenv').config();

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ---- Configuration ----
const credentials = {
  email: process.env.TEST_USER_EMAIL,
  password: process.env.TEST_USER_PASSWORD,
};

// Group name pattern that addnewgroup.js creates
const TODAY = new Date().toISOString().slice(0, 10);
const GROUP_NAME = process.env.GROUP_NAME || `QA-Test_${TODAY}`;

// Unique plan name per run (so the script can be run repeatedly the same day)
const RUN_ID = new Date().toISOString().slice(11, 19).replace(/:/g, '');
const PLAN_NAME = process.env.PLAN_NAME || `QA-Plan_${TODAY}_${RUN_ID}`;

const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

// Plan type to select in the "Plan Type" dropdown
const PLAN_TYPE = process.env.PLAN_TYPE || 'Dental';

// Valid test data, keyed by likely form field names (matched against `name`, `formcontrolname`, or `id`)
const planData = {
  // Plan Basics
  name: PLAN_NAME,
  planName: PLAN_NAME,
  planType: PLAN_TYPE,
  type: PLAN_TYPE,
  carrier: 'BlueCross BlueShield',
  policyNumber: 'POL-12345',
  effectiveDate: '2026-01-01',
  terminationDate: '2026-12-31',
  renewalDate: '2026-12-31',
  // Benefits
  deductible: '1000',
  outOfPocketMax: '5000',
  copay: '25',
  coinsurance: '20',
  description: 'Automated test plan',
  // Contributions / Rates
  employerContribution: '50',
  employeeContribution: '50',
  premium: '500',
  monthlyPremium: '500',
  // Misc
  ein: '12-3456789',
  totalEmployees: '50',
  eligibleEmployees: '45',
  street1: '123 Main Street',
  city: 'Charleston',
  state: 'SC',
  zip: '29401',
  contactFirst: 'John',
  contactLast: 'Doe',
  contactEmail: 'john@example.com',
  contactPhone: '(843) 555-0100',
  payPeriodsPerYear: '26',
  waitingPeriodDays: '0',
};

// ---- Helpers ----
async function shot(page, name) {
  const p = path.join(screenshotsDir, name);
  await page.screenshot({ path: p });
  console.log(`📸 ${name}`);
}

async function clickFirstAvailable(page, locators, label) {
  for (const loc of locators) {
    try {
      if ((await loc.count()) > 0 && (await loc.first().isVisible().catch(() => false))) {
        await loc.first().click({ timeout: 5000 });
        console.log(`✓ ${label}`);
        return true;
      }
    } catch (e) {
      // try next
    }
  }
  return false;
}

async function fillVisibleInputs(page, data) {
  const inputs = await page.locator('input:visible, textarea:visible').all();
  console.log(`Found ${inputs.length} visible inputs/textareas`);
  let filled = 0;
  const unmatched = [];
  for (const input of inputs) {
    try {
      const type = await input.getAttribute('type');
      if (['hidden', 'checkbox', 'radio', 'submit', 'button', 'file', 'search'].includes(type)) continue;

      // Identify field by name → formcontrolname → id (Angular reactive forms)
      const name = (await input.getAttribute('name'))
        || (await input.getAttribute('formcontrolname'))
        || (await input.getAttribute('id'))
        || '';

      const currentValue = await input.inputValue();
      // Skip if already has a non-zero value (preserve sensible defaults like Annual Maximum=2000)
      const hasMeaningfulValue = currentValue && currentValue !== '0' && currentValue !== '0.00' && currentValue !== '$0.00';
      if (hasMeaningfulValue) continue;

      // Special-case: unnamed money inputs in the Rates table (placeholder="0.00")
      if (!name) {
        const placeholder = (await input.getAttribute('placeholder')) || '';
        if (placeholder === '0.00' && !currentValue) {
          await input.fill('100');
          console.log(`  ✓ (rate input, placeholder=0.00) = 100`);
          filled++;
        }
        continue;
      }

      let value = data[name];
      if (!value) {
        const lower = name.toLowerCase();
        if (lower.includes('plan') && lower.includes('name')) value = data.planName;
        else if (lower.includes('email')) value = data.contactEmail;
        else if (lower.includes('phone')) value = data.contactPhone;
        else if (lower.includes('zip') || lower.includes('postal')) value = data.zip;
        else if (lower.includes('city')) value = data.city;
        else if (lower.includes('street') || lower.includes('address')) value = data.street1;
        // Carrier: only the canonical carrier-name field
        else if (lower === 'carrier' || lower === 'carriername') value = data.carrier;
        else if (lower.includes('policy')) value = data.policyNumber;
        else if (lower.includes('deductible')) value = data.deductible;
        else if (lower.includes('copay')) value = data.copay;
        // Waiting periods are in months, must be 0-24. Match "wait" anywhere in the name.
        else if (lower.includes('wait')) value = '0';
        // Age limits (e.g. dependentAgeOutAge ~ 26)
        else if (lower.includes('age')) value = '26';
        // Rates step: premium / monthly / employer cost / employee cost / rate fields
        else if (lower.includes('premium') || lower === 'rate' || lower.endsWith('rate')) value = data.premium;
        else if (lower.includes('employercost') || lower.includes('employer_cost')) value = data.employerContribution;
        else if (lower.includes('employeecost') || lower.includes('employee_cost')) value = data.employeeContribution;
        // Contributions / participation (percentages)
        else if (lower.includes('contribution') && lower.includes('pct')) value = '50';
        else if (lower.includes('contribution')) value = data.employerContribution;
        else if (lower.includes('participation')) value = '100';
        // Annual / lifetime maxes — dollars
        else if (lower.includes('annualmax') || (lower.includes('annual') && lower.includes('max'))) value = '2000';
        else if (lower.includes('lifetimemax') || (lower.includes('lifetime') && lower.includes('max'))) value = '1500';
        // Percent fields (preventivePct, basicPct, majorPct, orthodontiaPct, …)
        else if (lower.endsWith('pct') || lower.includes('percent')) value = '100';
        // Generic fallback for empty number fields with a name (Rates tier × column inputs)
        else if (type === 'number' && !currentValue) value = '100';
      }
      if (!value) {
        unmatched.push(name);
        continue;
      }

      await input.fill(value);
      console.log(`  ✓ ${name} = ${value}`);
      filled++;
    } catch (e) {
      // skip
    }
  }
  if (unmatched.length > 0) {
    console.log(`  ℹ️  unmatched: ${JSON.stringify(unmatched)}`);
  }
  return filled;
}

async function selectVisibleDropdowns(page, data) {
  const selects = await page.locator('select:visible').all();
  console.log(`Found ${selects.length} visible selects`);
  for (const select of selects) {
    try {
      const name = (await select.getAttribute('name'))
        || (await select.getAttribute('formcontrolname'))
        || (await select.getAttribute('id'))
        || '';

      // For "plan type" dropdowns, pick the user's PLAN_TYPE by visible label.
      // We avoid generic name matching here — try labels even when the form-control name is unknown.
      const lower = name.toLowerCase();
      const looksLikePlanType =
        lower.includes('plantype') || lower.includes('plan_type') || lower === 'type';

      if (looksLikePlanType) {
        try {
          await select.selectOption({ label: data.planType });
          console.log(`  ✓ ${name || '(plan type)'} = ${data.planType}`);
          continue;
        } catch (e) {
          // Fall through to name-based / first-option logic
        }
      }

      // Specific known field names
      if (data[name]) {
        await select.selectOption(data[name]).catch(async () => {
          await select.selectOption({ label: data[name] });
        });
        console.log(`  ✓ ${name} = ${data[name]}`);
        continue;
      }

      // Fallback 1: try to find an option whose label matches PLAN_TYPE (covers unnamed plan-type selects)
      const options = await select.locator('option').all();
      const optionTexts = [];
      for (const opt of options) {
        const t = ((await opt.textContent().catch(() => '')) || '').trim();
        optionTexts.push(t);
      }
      if (optionTexts.includes(data.planType)) {
        await select.selectOption({ label: data.planType });
        console.log(`  ✓ ${name || '(unnamed)'} = ${data.planType} (matched by option label)`);
        continue;
      }

      // Fallback 2: pick first non-empty option (skip the placeholder)
      await select.selectOption({ index: 1 }).catch(() => {});
      const selected = await select.inputValue().catch(() => '');
      console.log(`  ✓ ${name || '(unnamed)'} = ${selected || '(first option)'}`);
    } catch (e) {
      // skip
    }
  }
}

async function tickAllRequiredCheckboxes(page) {
  // Best-effort: tick checkboxes near "required" labels (avoids T&Cs being blockers).
  // Skip generic test-mode toggles to avoid surprises.
  const checkboxes = await page.locator('input[type="checkbox"]:visible').all();
  for (const cb of checkboxes) {
    try {
      const required = await cb.getAttribute('required');
      const name = (await cb.getAttribute('name')) || '';
      const lower = name.toLowerCase();
      if (required !== null || lower.includes('agree') || lower.includes('accept') || lower.includes('terms')) {
        if (!(await cb.isChecked())) {
          await cb.check({ force: true });
          console.log(`  ✓ checked: ${name || '(unnamed)'}`);
        }
      }
    } catch (e) {
      // skip
    }
  }
}

// ---- Main flow ----
// Build employee data for the i-th employee in this run (1-based).
// All fields are kept under 15 characters per the form's input limits.
function buildEmployee(idx) {
  // ts4 = last 4 digits of timestamp → ensures uniqueness across runs without exceeding limits
  const ts4 = String(Date.now()).slice(-4);
  const first = idx === 1 ? 'John' : 'Jane';
  const last = idx === 1 ? 'Smith' : 'Doe';
  return {
    firstName: first,                  // 4
    lastName: last,                    // 3-5
    email: `${first.toLowerCase()}${idx}${ts4}@t.co`, // ≤15 (e.g. john17421@t.co = 14)
    phone: '8435550101',               // 10
    dateOfBirth: '1985-01-15',         // 10
    hireDate: '2026-01-01',            // 10
  };
}

async function addEmployees(page, groupUrl, count = 2) {
  console.log(`\n--- Step 9: Add ${count} Employee(s) ---`);
  const results = [];

  for (let i = 1; i <= count; i++) {
    const emp = buildEmployee(i);
    console.log(`\n  ▶ Employee ${i}/${count}: ${emp.firstName} ${emp.lastName} (${emp.email})`);

    // Navigate back to the group page each iteration so we land on a clean tab state.
    await page.goto(groupUrl, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(2500);
    await page.waitForLoadState('networkidle').catch(() => {});

    // Click the Employees tab. Tab text may include a count badge ("Employees 1").
    const tabClicked = await clickFirstAvailable(page, [
      page.locator('[data-testid="employees-tab"]'),
      page.locator('button:visible').filter({ hasText: /^Employees(\s+\d+)?$/ }),
      page.getByRole('button', { name: /^Employees(\s+\d+)?$/ }),
      page.locator('[role="tab"]').filter({ hasText: /^Employees(\s+\d+)?$/ }),
    ], `Clicked Employees tab (#${i})`);
    if (!tabClicked) {
      results.push({ idx: i, status: 'FAIL', reason: 'Employees tab not found' });
      continue;
    }
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle').catch(() => {});
    await shot(page, `addemployee_tab_${i}.png`);

    // Click "+ Add Employee"
    const addClicked = await clickFirstAvailable(page, [
      page.locator('[data-testid="add-employee-btn"]'),
      page.getByRole('button', { name: /^\+\s*Add Employee$/ }),
      page.locator('button:visible').filter({ hasText: /^\+\s*Add Employee$/ }),
      page.locator('button:visible').filter({ hasText: /Add Employee/ }),
      page.getByRole('link', { name: /Add Employee/ }),
    ], `Clicked "+ Add Employee" (#${i})`);
    if (!addClicked) {
      results.push({ idx: i, status: 'FAIL', reason: '"+ Add Employee" not found' });
      continue;
    }
    await page.waitForTimeout(2500);
    await page.waitForLoadState('networkidle').catch(() => {});
    await shot(page, `addemployee_form_opened_${i}.png`);

    // Fill any visible inputs and selects — handle either single-form or multi-step wizards.
    const MAX_FORM_STEPS = 4;
    let empSaved = false;
    for (let step = 1; step <= MAX_FORM_STEPS; step++) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      const filled = await fillVisibleInputs(page, emp);
      await selectVisibleDropdowns(page, emp);
      await tickAllRequiredCheckboxes(page);
      await page.waitForTimeout(500);
      await shot(page, `addemployee_${i}_step${step}.png`);
      console.log(`    ✓ Form step ${step}: filled ${filled} inputs`);

      // Scroll to bottom so action buttons are in view
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      // Terminal action first (Save / Submit / Add Employee / Create)
      const terminalLocators = [
        page.getByRole('button', { name: /^Save Employee$/ }),
        page.getByRole('button', { name: /^Save$/ }),
        page.getByRole('button', { name: /^Create Employee$/ }),
        page.getByRole('button', { name: /^Create$/ }),
        page.getByRole('button', { name: /^Submit$/ }),
        page.getByRole('button', { name: /^Add Employee$/ }),
        page.getByRole('button', { name: /^Finish$/ }),
      ];
      let terminalClicked = false;
      for (const loc of terminalLocators) {
        try {
          if ((await loc.count()) > 0 && (await loc.first().isVisible().catch(() => false)) && (await loc.first().isEnabled().catch(() => false))) {
            const text = (await loc.first().textContent().catch(() => '')) || '';
            await loc.first().click({ timeout: 5000 });
            console.log(`    ✓ Step ${step}: clicked terminal button "${text.trim()}"`);
            terminalClicked = true;
            break;
          }
        } catch (e) {
          // try next
        }
      }
      if (terminalClicked) {
        empSaved = true;
        await page.waitForTimeout(2500);
        break;
      }

      // Otherwise advance with Next / Save & Next
      const nextLocators = [
        page.getByRole('button', { name: /^Save\s*&\s*Next/ }),
        page.getByRole('button', { name: /^Next\b/ }),
        page.getByRole('button', { name: /^Continue\b/ }),
      ];
      let advanced = false;
      for (const loc of nextLocators) {
        try {
          if ((await loc.count()) > 0 && (await loc.first().isVisible().catch(() => false)) && (await loc.first().isEnabled().catch(() => false))) {
            await loc.first().click({ timeout: 5000 });
            console.log(`    ✓ Step ${step}: clicked Next`);
            advanced = true;
            break;
          }
        } catch (e) {
          // try next
        }
      }
      if (!advanced) {
        console.log(`    ⚠️  Step ${step}: no Next/Save button — stopping`);
        break;
      }
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    await page.waitForTimeout(2000);
    await shot(page, `addemployee_${i}_after_submit.png`);

    if (empSaved) {
      console.log(`  ✅ Employee ${i} "${emp.firstName} ${emp.lastName}" submitted`);
      results.push({ idx: i, status: 'PASS', firstName: emp.firstName, lastName: emp.lastName, email: emp.email });
    } else {
      console.log(`  ⚠️  Employee ${i} form did not reach a Save action`);
      results.push({ idx: i, status: 'PARTIAL', firstName: emp.firstName, lastName: emp.lastName, email: emp.email });
    }
  }

  // Summary
  console.log(`\n--- Add Employees summary ---`);
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'PARTIAL' ? '⚠️ ' : '❌';
    console.log(`${icon} #${r.idx}: ${r.firstName || ''} ${r.lastName || ''} ${r.email ? `<${r.email}>` : ''} ${r.reason ? `(${r.reason})` : ''}`);
  }
  return results;
}

// Build short test data for a contribution strategy (all fields kept under 15 chars).
function buildStrategyData() {
  const ts4 = String(Date.now()).slice(-4);
  const shortName = `QAStrat_${ts4}`; // 12 chars
  return {
    // Variations of common form field names — fillVisibleInputs will match whatever the form uses.
    name: shortName,
    strategyName: shortName,
    contributionStrategyName: shortName,
    title: shortName,
    description: 'Auto test',         // 9
    effectiveDate: '2026-01-01',      // 10
    startDate: '2026-01-01',
    terminationDate: '2026-12-31',    // 10
    endDate: '2026-12-31',
    renewalDate: '2026-12-31',
    employerPct: '50',
    employerContributionPct: '50',
    employerContribution: '50',
    employeePct: '50',
    employeeContributionPct: '50',
    amount: '100',
    contributionAmount: '100',
    employerAmount: '50',
    employeeAmount: '50',
  };
}

async function addStrategy(page, groupUrl) {
  console.log('\n--- Step 10: Add Contribution Strategy ---');
  const stratData = buildStrategyData();
  console.log(`  ▶ Strategy: ${stratData.name}`);

  // Navigate back to group page so we're in a clean state
  await page.goto(groupUrl, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.waitForLoadState('networkidle').catch(() => {});

  // Click the Contributions tab. May include a count badge ("Contributions 2").
  const tabClicked = await clickFirstAvailable(page, [
    page.locator('[data-testid="contributions-tab"]'),
    page.locator('button:visible').filter({ hasText: /^Contributions(\s+\d+)?$/ }),
    page.getByRole('button', { name: /^Contributions(\s+\d+)?$/ }),
    page.locator('[role="tab"]').filter({ hasText: /^Contributions(\s+\d+)?$/ }),
  ], 'Clicked Contributions tab');
  if (!tabClicked) {
    throw new Error('Contributions tab not found on group page');
  }
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle').catch(() => {});
  await shot(page, 'addstrategy_tab.png');

  // Click "+ New Strategy" (try several label variations)
  const addClicked = await clickFirstAvailable(page, [
    page.locator('[data-testid="new-strategy-btn"]'),
    page.locator('[data-testid="add-strategy-btn"]'),
    page.getByRole('button', { name: /^\+\s*New Strategy$/ }),
    page.getByRole('button', { name: /^New Strategy$/ }),
    page.getByRole('button', { name: /^\+\s*Add Strategy$/ }),
    page.locator('button:visible').filter({ hasText: /^\+\s*New Strategy$/ }),
    page.locator('button:visible').filter({ hasText: /New Strategy/ }),
    page.locator('button:visible').filter({ hasText: /Add Strategy/ }),
  ], 'Clicked "+ New Strategy"');
  if (!addClicked) {
    throw new Error('"+ New Strategy" button not found on Contributions tab');
  }
  await page.waitForTimeout(2500);
  await page.waitForLoadState('networkidle').catch(() => {});
  await shot(page, 'addstrategy_form_opened.png');

  // Strategy form opens in a modal dialog. Scope all locators to the modal so labels
  // like "Effective Date" / "Strategy Type" don't collide with elements elsewhere on the page.
  function modalScope() {
    return page.locator('[role="dialog"], .modal, [class*="modal-content"]').filter({
      hasText: /New Contribution Strategy|Strategy Details|Strategy Type/,
    }).first();
  }

  async function fillStrategyStep1() {
    let n = 0;
    const modal = modalScope();
    // Name — placeholder "Standard Medical — 75% ER" (em-dash, use regex)
    try {
      await modal.getByPlaceholder(/Standard Medical/).fill(stratData.name);
      console.log(`    ✓ Name = ${stratData.name}`); n++;
    } catch (e) {
      try { await modal.getByLabel(/^Name/).fill(stratData.name); console.log(`    ✓ Name = ${stratData.name}`); n++; }
      catch (e2) { console.log(`    ⚠️  Name fill failed: ${e2.message.split('\n')[0]}`); }
    }
    // Description — placeholder "Describe this strategy"
    try {
      await modal.getByPlaceholder('Describe this strategy').fill(stratData.description);
      console.log(`    ✓ Description = ${stratData.description}`); n++;
    } catch (e) {
      try { await modal.getByLabel(/^Description/).fill(stratData.description); console.log(`    ✓ Description`); n++; }
      catch (e2) { console.log(`    ⚠️  Description fill failed: ${e2.message.split('\n')[0]}`); }
    }
    // Effective Date — the modal has a single date-typed input ("dd-mm-yyyy" placeholder).
    // The form's <label> isn't associated via `for=`, so target the input directly by type/placeholder.
    try {
      const dateLoc = modal.locator('input[type="date"]')
        .or(modal.getByPlaceholder('dd-mm-yyyy'))
        .first();
      await dateLoc.fill('2026-01-01', { timeout: 5000 });
      console.log(`    ✓ Effective Date = 2026-01-01`); n++;
    } catch (e) {
      console.log(`    ⚠️  Effective Date fill failed: ${e.message.split('\n')[0]}`);
    }
    // Strategy Type — modal has 2 visible <select>s: [0] Group (pre-set), [1] Strategy Type.
    try {
      const selects = await modal.locator('select:visible').all();
      // Choose the LAST visible select (Strategy Type) to avoid overwriting Group selection
      const target = selects[selects.length - 1];
      if (target) {
        await target.selectOption({ index: 1 });
        console.log(`    ✓ Strategy Type (first option)`); n++;
      } else {
        console.log(`    ⚠️  Strategy Type select not found in modal`);
      }
    } catch (e) {
      console.log(`    ⚠️  Strategy Type select failed: ${e.message.split('\n')[0]}`);
    }
    return n;
  }

  const MAX_FORM_STEPS = 4;
  let stratSaved = false;
  for (let step = 1; step <= MAX_FORM_STEPS; step++) {
    await page.waitForTimeout(700);
    // On step 1 the strategy details fields use labels — fill those first
    if (step === 1) await fillStrategyStep1();
    // Then run the generic fill for any other inputs/selects on this step
    const filled = await fillVisibleInputs(page, stratData);
    await selectVisibleDropdowns(page, stratData);
    await tickAllRequiredCheckboxes(page);
    await page.waitForTimeout(500);
    await shot(page, `addstrategy_step${step}.png`);
    console.log(`    ✓ Form step ${step}: filled ${filled} additional inputs`);

    // Try terminal action first (Save / Create Strategy / Submit / Finish)
    const terminalLocators = [
      page.getByRole('button', { name: /^Save Strategy$/ }),
      page.getByRole('button', { name: /^Create Strategy$/ }),
      page.getByRole('button', { name: /^Add Strategy$/ }),
      page.getByRole('button', { name: /^Save$/ }),
      page.getByRole('button', { name: /^Create$/ }),
      page.getByRole('button', { name: /^Submit$/ }),
      page.getByRole('button', { name: /^Finish$/ }),
      page.getByRole('button', { name: /^Done$/ }),
    ];
    let terminalClicked = false;
    for (const loc of terminalLocators) {
      try {
        if ((await loc.count()) > 0 && (await loc.first().isVisible().catch(() => false)) && (await loc.first().isEnabled().catch(() => false))) {
          const text = (await loc.first().textContent().catch(() => '')) || '';
          await loc.first().click({ timeout: 5000 });
          console.log(`    ✓ Step ${step}: clicked terminal button "${text.trim()}"`);
          terminalClicked = true;
          break;
        }
      } catch (e) {
        // try next
      }
    }
    if (terminalClicked) {
      stratSaved = true;
      await page.waitForTimeout(2500);
      break;
    }

    // Otherwise advance — modal button labels include "Next: Rules", "Next: Plans", etc.
    const nextLocators = [
      page.getByRole('button', { name: /^Next:/ }),
      page.locator('button:visible').filter({ hasText: /^Next:/ }),
      page.getByRole('button', { name: /^Save\s*&\s*Next/ }),
      page.getByRole('button', { name: /^Next\b/ }),
      page.locator('button:visible').filter({ hasText: /^Next/ }),
      page.getByRole('button', { name: /^Continue\b/ }),
    ];
    let advanced = false;
    let advancedText = '';
    for (const loc of nextLocators) {
      try {
        if ((await loc.count()) > 0 && (await loc.first().isVisible().catch(() => false)) && (await loc.first().isEnabled().catch(() => false))) {
          advancedText = ((await loc.first().textContent().catch(() => '')) || '').trim();
          await loc.first().click({ timeout: 5000 });
          console.log(`    ✓ Step ${step}: clicked "${advancedText}"`);
          advanced = true;
          break;
        }
      } catch (e) {
        // try next
      }
    }
    if (!advanced) {
      console.log(`    ⚠️  Step ${step}: no Next/Save button — stopping`);
      break;
    }
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle').catch(() => {});
  }

  await page.waitForTimeout(2000);
  await shot(page, 'addstrategy_after_submit.png');

  if (stratSaved) {
    console.log(`  ✅ Strategy "${stratData.name}" submitted`);
  } else {
    console.log(`  ⚠️  Strategy form did not reach a Save action`);
  }
  return { status: stratSaved ? 'PASS' : 'PARTIAL', name: stratData.name };
}

async function addPlan() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  let groupUrl = '';

  try {
    console.log(`🚀 Adding plan "${PLAN_NAME}" to group "${GROUP_NAME}"\n`);

    // Step 1: Login
    console.log('--- Step 1: Login ---');
    await page.goto(`${process.env.APP_BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.getByTestId('email-input').fill(credentials.email);
    await page.getByTestId('password-input').fill(credentials.password);
    await page.getByTestId('login-btn').click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('✓ Logged in\n');

    // Step 2: Navigate to Groups
    console.log('--- Step 2: View All Groups ---');
    await page.waitForTimeout(2000);
    await page.getByTestId('view-all-groups').click({ timeout: 5000 });
    await page.waitForTimeout(2000);
    console.log('✓ On groups page\n');

    // Step 3: Toggle "Show test groups" + search + open the group
    console.log(`--- Step 3: Open group "${GROUP_NAME}" ---`);

    const showTest = page.locator('label:has-text("Show test groups") input[type="checkbox"]').first();
    try {
      if ((await showTest.count()) > 0 && !(await showTest.isChecked())) {
        await showTest.check({ timeout: 3000 });
        console.log('✓ Enabled "Show test groups"');
        await page.waitForTimeout(800);
      }
    } catch (e) {
      console.log(`ℹ️  Could not toggle "Show test groups": ${e.message}`);
    }

    const searchBox = page.locator('input[placeholder*="Search groups"], input[placeholder*="search groups"]').first();
    if ((await searchBox.count()) > 0) {
      await searchBox.fill(GROUP_NAME);
      console.log(`✓ Searched: ${GROUP_NAME}`);
      await page.waitForTimeout(1500);
    }

    await shot(page, 'addplan_groups_filtered.png');

    // The group card's "Open" / title is rendered as an <a>, not <button>. Try several locators.
    const opened = await clickFirstAvailable(page, [
      page.getByRole('link', { name: 'Open', exact: true }),
      page.getByRole('link', { name: new RegExp(`^\\s*${GROUP_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) }),
      page.locator(`a:visible:has-text("${GROUP_NAME}")`),
      page.getByRole('heading', { name: GROUP_NAME }),
      page.locator(`:text-is("${GROUP_NAME}")`),
    ], 'Opened group');

    if (!opened) {
      throw new Error(`Group "${GROUP_NAME}" not found. Run addnewgroup.js first.`);
    }

    await page.waitForTimeout(2500);
    await page.waitForLoadState('networkidle').catch(() => {});
    groupUrl = page.url();
    await shot(page, 'addplan_group_details.png');
    console.log(`✓ Group page loaded: ${groupUrl}\n`);

    // Step 4: Plans tab is default after opening a group — but click it just in case
    console.log('--- Step 4: Ensure Plans tab is active ---');
    const plansTab = page.getByRole('tab', { name: /^Plans$/ })
      .or(page.locator('button:visible').filter({ hasText: /^Plans$/ }))
      .or(page.locator('a:visible').filter({ hasText: /^Plans$/ }));
    if ((await plansTab.count()) > 0) {
      await plansTab.first().click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1500);
      console.log('✓ Plans tab active');
    } else {
      console.log('ℹ️  Plans tab locator not found — assuming it is already active');
    }
    console.log('');

    // Step 5: Click "+ Add Plan"
    console.log('--- Step 5: Click "+ Add Plan" ---');
    const addClicked = await clickFirstAvailable(page, [
      page.locator('[data-testid="add-plan-btn"]'),
      page.getByRole('button', { name: /^\+\s*Add Plan$/ }),
      page.locator('button:visible').filter({ hasText: /^\+\s*Add Plan$/ }),
      page.locator('button:visible').filter({ hasText: /^Add Plan$/ }),
      page.getByRole('link', { name: /Add Plan/ }),
    ], 'Clicked "+ Add Plan"');
    if (!addClicked) {
      throw new Error('"+ Add Plan" button not found on Plans tab');
    }
    await page.waitForTimeout(3000);
    await shot(page, 'addplan_after_add_click.png');
    console.log('');

    // Step 6: On the "Add Benefit Plans" method screen, pick "Enter Plan Manually".
    // The cards are styled <div>s (not buttons/links), so target the heading text directly.
    // Explicitly avoid "Import from Quoting Engine" per the no-quotes rule.
    console.log('--- Step 6: Choose "Enter Plan Manually" ---');
    const manualHeading = page.getByText('Enter Plan Manually', { exact: false }).first();
    if ((await manualHeading.count()) > 0) {
      await manualHeading.scrollIntoViewIfNeeded().catch(() => {});
      await manualHeading.click({ timeout: 5000 });
      console.log('✓ Clicked "Enter Plan Manually" card');
      await page.waitForTimeout(2500);
      await page.waitForLoadState('networkidle').catch(() => {});
      await shot(page, 'addplan_manual_entry.png');
    } else {
      console.log('ℹ️  "Enter Plan Manually" card not found — assuming form is shown directly');
    }
    console.log('');

    // Step 7: Walk through the multi-step wizard.
    //   - Each step: scroll to top, fill visible inputs/selects/checkboxes, screenshot.
    //   - Look for "Next" → click and continue.
    //   - On the last step: look for Save/Create/Submit → click and finish.
    console.log('--- Step 7: Multi-step wizard ---');

    // Wizard has exactly 5 steps. Walk through each one filling all visible fields.
    // The app saves progressively via "Save & Next", so by the end of step 5 the plan exists.
    const TOTAL_STEPS = 5;
    let saved = false;
    let stepsCompleted = 0;

    for (let step = 1; step <= TOTAL_STEPS; step++) {
      console.log(`\n  ▶ Wizard step ${step}`);
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(800);

      const inputCount = await fillVisibleInputs(page, planData);
      await selectVisibleDropdowns(page, planData);
      await tickAllRequiredCheckboxes(page);
      await page.waitForTimeout(500);
      await shot(page, `addplan_step${step}.png`);
      console.log(`  ✓ Step ${step}: filled ${inputCount} inputs`);

      // Scroll to bottom so Next/Save is in view
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      // Try terminal action first (Save / Create Plan / Submit / Finish)
      const terminalLocators = [
        page.getByRole('button', { name: /^Save Plan$/ }),
        page.getByRole('button', { name: /^Save$/ }),
        page.getByRole('button', { name: /^Create Plan$/ }),
        page.getByRole('button', { name: /^Create$/ }),
        page.getByRole('button', { name: /^Submit$/ }),
        page.getByRole('button', { name: /^Finish$/ }),
        page.getByRole('button', { name: /^Confirm$/ }),
      ];
      let terminalClicked = false;
      for (const loc of terminalLocators) {
        try {
          if ((await loc.count()) > 0 && (await loc.first().isVisible().catch(() => false)) && (await loc.first().isEnabled().catch(() => false))) {
            const text = (await loc.first().textContent().catch(() => '')) || '';
            await loc.first().click({ timeout: 5000 });
            console.log(`  ✓ Step ${step}: clicked terminal button "${text.trim()}"`);
            terminalClicked = true;
            break;
          }
        } catch (e) {
          // try next
        }
      }
      if (terminalClicked) {
        saved = true;
        stepsCompleted = step;
        await page.waitForTimeout(2500);
        break;
      }

      // Otherwise advance with Next / Save & Next / Continue. Button may include an arrow ("Next →").
      const nextLocators = [
        page.getByRole('button', { name: /^Save\s*&\s*Next/ }),
        page.getByRole('button', { name: /^Next\b/ }),
        page.getByRole('button', { name: /^Continue\b/ }),
        page.getByRole('button', { name: /^Next Step\b/ }),
        page.locator('button:visible').filter({ hasText: /^Next/ }),
      ];
      let advanced = false;
      for (const loc of nextLocators) {
        try {
          if ((await loc.count()) > 0 && (await loc.first().isVisible().catch(() => false)) && (await loc.first().isEnabled().catch(() => false))) {
            await loc.first().click({ timeout: 5000 });
            console.log(`  ✓ Step ${step}: clicked Next`);
            advanced = true;
            break;
          }
        } catch (e) {
          // try next
        }
      }
      if (!advanced) {
        console.log(`  ⚠️  Step ${step}: no Next/Save button found — stopping wizard`);
        stepsCompleted = step;
        break;
      }
      await page.waitForTimeout(2500);
      stepsCompleted = step;
    }

    // If we completed all 5 wizard steps, the plan is saved progressively via Save & Next.
    if (stepsCompleted >= TOTAL_STEPS) saved = true;

    await page.waitForTimeout(3500);
    await shot(page, 'addplan_after_submit.png');

    if (saved) {
      console.log(`\n✅ Plan "${PLAN_NAME}" saved (after ${stepsCompleted} wizard step(s))`);
    } else {
      console.log(`\n⚠️  Wizard did not reach a Save action (stopped after ${stepsCompleted} step(s))`);
      process.exitCode = 1;
    }
    console.log(`Final URL: ${page.url()}`);

    // After plan creation: add 2 employees, then a contribution strategy.
    if (saved && groupUrl) {
      try {
        await addEmployees(page, groupUrl, 2);
      } catch (e) {
        console.error(`\n❌ Add Employees failed: ${e.message}`);
        await shot(page, 'addemployee_error.png').catch(() => {});
        process.exitCode = 1;
      }

      try {
        await addStrategy(page, groupUrl);
      } catch (e) {
        console.error(`\n❌ Add Strategy failed: ${e.message}`);
        await shot(page, 'addstrategy_error.png').catch(() => {});
        process.exitCode = 1;
      }
    } else if (!groupUrl) {
      console.log(`\nℹ️  Skipping Add Employees / Strategy — group URL was not captured`);
    } else {
      console.log(`\nℹ️  Skipping Add Employees / Strategy because plan was not saved`);
    }
  } catch (error) {
    console.error(`\n❌ Failed: ${error.message}`);
    await shot(page, 'addplan_error.png').catch(() => {});
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

addPlan();
