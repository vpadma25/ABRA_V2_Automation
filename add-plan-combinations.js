require('dotenv').config();

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ---- Config ----
const credentials = {
  email: process.env.TEST_USER_EMAIL,
  password: process.env.TEST_USER_PASSWORD,
};

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const RUN_ID = TIMESTAMP.slice(11).replace(/-/g, '');
const TODAY = TIMESTAMP.slice(0, 10);
const GROUP_NAME = process.env.GROUP_NAME || `QA-Combo_${TODAY}_${RUN_ID}`;
const PLAN_TYPE = process.env.PLAN_TYPE || 'Dental';
const MAX_COMBOS = parseInt(process.env.MAX_COMBOS || '5', 10);

const screenshotsDir = path.join(__dirname, 'screenshots');
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const groupData = {
  name: GROUP_NAME,
  ein: '12-3456789',
  effectiveDate: '2026-01-01',
  renewalDate: '2026-12-31',
  street1: '123 Main Street',
  city: 'Charleston',
  state: 'SC',
  zip: '29401',
  contactFirst: 'John',
  contactLast: 'Doe',
  contactEmail: 'john@example.com',
  contactPhone: '(843) 555-0100',
};

function buildPlanData(planName) {
  return {
    name: planName,
    planName,
    planType: PLAN_TYPE,
    type: PLAN_TYPE,
    carrier: 'BlueCross BlueShield',
    policyNumber: 'POL-12345',
    effectiveDate: '2026-01-01',
    terminationDate: '2026-12-31',
    renewalDate: '2026-12-31',
    deductible: '1000',
    copay: '25',
    description: 'Automated test plan',
    employerContribution: '50',
    employeeContribution: '50',
    premium: '500',
    monthlyPremium: '500',
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
}

// ---- Helpers ----
async function shot(page, name) {
  const p = path.join(screenshotsDir, name);
  await page.screenshot({ path: p }).catch(() => {});
}

async function fillVisibleInputs(page, data) {
  const inputs = await page.locator('input:visible, textarea:visible').all();
  let filled = 0;
  for (const input of inputs) {
    try {
      const type = await input.getAttribute('type');
      if (['hidden', 'checkbox', 'radio', 'submit', 'button', 'file', 'search'].includes(type)) continue;
      const name = (await input.getAttribute('name'))
        || (await input.getAttribute('formcontrolname'))
        || (await input.getAttribute('id'))
        || '';
      const currentValue = await input.inputValue();
      const hasMeaningfulValue = currentValue && currentValue !== '0' && currentValue !== '0.00' && currentValue !== '$0.00';
      if (hasMeaningfulValue) continue;

      if (!name) {
        const placeholder = (await input.getAttribute('placeholder')) || '';
        if (placeholder === '0.00' && !currentValue) {
          await input.fill('100');
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
        else if (lower === 'carrier' || lower === 'carriername') value = data.carrier;
        else if (lower.includes('policy')) value = data.policyNumber;
        else if (lower.includes('deductible')) value = data.deductible;
        else if (lower.includes('copay')) value = data.copay;
        else if (lower.includes('wait')) value = '0';
        else if (lower.includes('age')) value = '26';
        else if (lower.includes('premium') || lower === 'rate' || lower.endsWith('rate')) value = data.premium;
        else if (lower.includes('employercost') || lower.includes('employer_cost')) value = data.employerContribution;
        else if (lower.includes('employeecost') || lower.includes('employee_cost')) value = data.employeeContribution;
        else if (lower.includes('contribution') && lower.includes('pct')) value = '50';
        else if (lower.includes('contribution')) value = data.employerContribution;
        else if (lower.includes('participation')) value = '100';
        else if (lower.includes('annualmax') || (lower.includes('annual') && lower.includes('max'))) value = '2000';
        else if (lower.includes('lifetimemax') || (lower.includes('lifetime') && lower.includes('max'))) value = '1500';
        else if (lower.endsWith('pct') || lower.includes('percent')) value = '100';
        else if (type === 'number' && !currentValue) value = '100';
      }
      if (!value) continue;
      await input.fill(value);
      filled++;
    } catch (e) {
      // skip
    }
  }
  return filled;
}

async function selectVisibleDropdowns(page, data) {
  const selects = await page.locator('select:visible').all();
  for (const select of selects) {
    try {
      const name = (await select.getAttribute('name'))
        || (await select.getAttribute('formcontrolname'))
        || (await select.getAttribute('id'))
        || '';
      const lower = name.toLowerCase();
      const looksLikePlanType = lower.includes('plantype') || lower.includes('plan_type') || lower === 'type';
      if (looksLikePlanType) {
        try {
          await select.selectOption({ label: data.planType });
          continue;
        } catch (e) {}
      }
      if (data[name]) {
        await select.selectOption(data[name]).catch(async () => {
          await select.selectOption({ label: data[name] });
        });
        continue;
      }
      const options = await select.locator('option').all();
      const optionTexts = [];
      for (const opt of options) {
        const t = ((await opt.textContent().catch(() => '')) || '').trim();
        optionTexts.push(t);
      }
      if (optionTexts.includes(data.planType)) {
        await select.selectOption({ label: data.planType });
        continue;
      }
      await select.selectOption({ index: 1 }).catch(() => {});
    } catch (e) {}
  }
}

async function tickAllRequiredCheckboxes(page) {
  const cbs = await page.locator('input[type="checkbox"]:visible').all();
  for (const cb of cbs) {
    try {
      const required = await cb.getAttribute('required');
      const name = (await cb.getAttribute('name')) || '';
      const lower = name.toLowerCase();
      if (required !== null || lower.includes('agree') || lower.includes('accept') || lower.includes('terms')) {
        if (!(await cb.isChecked())) await cb.check({ force: true });
      }
    } catch (e) {}
  }
}

async function getSelectOptions(page, formCtrlName) {
  const select = page.locator(
    `select[formcontrolname="${formCtrlName}"]:visible, select[name="${formCtrlName}"]:visible, select#${formCtrlName}:visible`
  ).first();
  if ((await select.count()) === 0) return [];
  const opts = await select.locator('option').all();
  const result = [];
  for (const opt of opts) {
    const v = await opt.getAttribute('value');
    const t = ((await opt.textContent()) || '').trim();
    if (v && v !== '' && t && !t.toLowerCase().startsWith('select')) {
      result.push({ value: v, label: t });
    }
  }
  return result;
}

async function selectByName(page, formCtrlName, value) {
  const select = page.locator(
    `select[formcontrolname="${formCtrlName}"]:visible, select[name="${formCtrlName}"]:visible, select#${formCtrlName}:visible`
  ).first();
  if ((await select.count()) === 0) return false;
  await select.selectOption(value).catch(async () => {
    await select.selectOption({ label: value });
  });
  return true;
}

async function clickSaveAndNext(page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  const candidates = [
    page.getByRole('button', { name: /^Save\s*&\s*Next/ }),
    page.getByRole('button', { name: /^Next/ }),
    page.getByRole('button', { name: /^Save Plan$/ }),
    page.getByRole('button', { name: /^Save$/ }),
    page.getByRole('button', { name: /^Submit$/ }),
    page.getByRole('button', { name: /^Finish$/ }),
  ];
  for (const loc of candidates) {
    if ((await loc.count()) > 0 && (await loc.first().isVisible().catch(() => false)) && (await loc.first().isEnabled().catch(() => false))) {
      await loc.first().click({ timeout: 5000 });
      return true;
    }
  }
  return false;
}

// ---- Top-level flows ----
async function login(page) {
  await page.goto(`${process.env.APP_BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.getByTestId('email-input').fill(credentials.email);
  await page.getByTestId('password-input').fill(credentials.password);
  await page.getByTestId('login-btn').click();
  await page.waitForNavigation({ waitUntil: 'networkidle' });
}

async function createNewGroup(page, gd) {
  await page.waitForTimeout(2000);
  await page.getByTestId('view-all-groups').click({ timeout: 5000 });
  await page.waitForTimeout(2000);
  await page.getByTestId('new-group-btn').click({ timeout: 5000 });
  await page.waitForTimeout(2000);

  await page.locator('input[name="name"]').fill(gd.name);
  await page.locator('input[name="ein"]').fill(gd.ein);
  await page.locator('input[name="effectiveDate"]').fill(gd.effectiveDate);
  await page.locator('input[name="renewalDate"]').fill(gd.renewalDate);
  await page.locator('input[name="street1"]').fill(gd.street1);
  await page.locator('input[name="city"]').fill(gd.city);
  try {
    const stateSelect = page.locator('select[name="state"]');
    if ((await stateSelect.count()) > 0) {
      await stateSelect.selectOption(gd.state);
    } else {
      await page.locator('input[name="state"]').fill(gd.state);
    }
  } catch (e) {}
  await page.locator('input[name="zip"]').fill(gd.zip);
  await page.locator('input[name="contactFirst"]').fill(gd.contactFirst);
  await page.locator('input[name="contactLast"]').fill(gd.contactLast);
  await page.locator('input[name="contactEmail"]').fill(gd.contactEmail);
  await page.locator('input[name="contactPhone"]').fill(gd.contactPhone);
  await page.waitForTimeout(1000);

  const submit = page.locator('button:has-text("Create Group & Start Setup")').first();
  await submit.click({ timeout: 5000 });
  await page.waitForTimeout(3500);
  await page.waitForLoadState('networkidle').catch(() => {});
}

async function navigateToGroup(page, groupName) {
  await page.goto(`${process.env.APP_BASE_URL}/groups`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const showTest = page.locator('label:has-text("Show test groups") input[type="checkbox"]').first();
  try {
    if ((await showTest.count()) > 0 && !(await showTest.isChecked())) {
      await showTest.check({ timeout: 3000 });
      await page.waitForTimeout(500);
    }
  } catch (e) {}

  const searchBox = page.locator('input[placeholder*="Search groups"]').first();
  if ((await searchBox.count()) > 0) {
    await searchBox.fill(groupName);
    await page.waitForTimeout(1500);
  }

  // Click "Open" link/button on the filtered card; fall back to clicking the group title
  const openBtn = page.locator('button:visible').filter({ hasText: /^\s*Open\s*$/ }).first();
  if ((await openBtn.count()) > 0) {
    await openBtn.click({ timeout: 5000 });
  } else {
    const link = page.locator(`a:visible:has-text("${groupName}")`).first();
    if ((await link.count()) > 0) {
      await link.click({ timeout: 5000 });
    } else {
      const heading = page.getByRole('heading', { name: groupName }).first();
      await heading.click({ timeout: 5000 });
    }
  }
  await page.waitForTimeout(2500);
  await page.waitForLoadState('networkidle').catch(() => {});
}

async function clickFirstVisible(page, locators, label) {
  for (const loc of locators) {
    try {
      if ((await loc.count()) > 0 && (await loc.first().isVisible().catch(() => false))) {
        await loc.first().click({ timeout: 5000 });
        return true;
      }
    } catch (e) {}
  }
  throw new Error(`${label} not found`);
}

async function startAddPlan(page) {
  // Wait for the group page to settle (Plans tab content loads after the main page)
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2500);

  // Wait explicitly for any of the entry points to become visible
  try {
    await Promise.race([
      page.locator('button:visible').filter({ hasText: 'Add Plan' }).first().waitFor({ state: 'visible', timeout: 15000 }),
      page.locator('button:visible').filter({ hasText: 'Add Plans' }).first().waitFor({ state: 'visible', timeout: 15000 }),
    ]);
  } catch (e) {
    // fall through; clickFirstVisible will diagnose
  }

  // Diagnostic: list ALL visible buttons (no slice)
  const btns = await page.locator('button:visible').all();
  const texts = [];
  for (const b of btns) {
    const t = ((await b.textContent().catch(() => '')) || '').trim();
    texts.push(t);
  }
  console.log(`  visible buttons (${texts.length}): ${JSON.stringify(texts)}`);

  // Also list any element with "Add Plan" text for diagnostics
  const addPlanCandidates = await page.locator(':text("Add Plan")').all();
  console.log(`  "Add Plan" candidates: ${addPlanCandidates.length}`);
  await shot(page, `combo_before_addplan_${Date.now()}.png`);

  // Try multiple locators. Use getByTestId (most stable), then fallbacks.
  await clickFirstVisible(page, [
    page.getByTestId('add-plan-btn'),
    page.locator('[data-testid="add-plan-btn"]'),
    page.locator('button').filter({ hasText: /^\s*\+\s*Add Plan\s*$/ }),
    page.locator('button').filter({ hasText: 'Add Plan' }),
    page.locator('button').filter({ hasText: 'Add Plans' }),
    page.locator('a').filter({ hasText: /^\s*\+\s*Add Plan\s*$/ }),
  ], '"+ Add Plan" / "Add Plans" button');
  await page.waitForTimeout(2500);
  await page.waitForLoadState('networkidle').catch(() => {});

  await clickFirstVisible(page, [
    page.getByText('Enter Plan Manually', { exact: false }),
    page.getByRole('heading', { name: /Enter Plan Manually/i }),
  ], '"Enter Plan Manually" card');
  await page.waitForTimeout(2500);
  await page.waitForLoadState('networkidle').catch(() => {});
}

// Walk the 5-step wizard. On step 1 set ratingTier; on step 3 set contributionType.
// If discover.* is true, also read the dropdown options at that step.
async function walkWizard(page, planData, ratingTierValue, contributionTypeValue, discover = {}) {
  const out = { discoveredRating: [], discoveredContrib: [], stepsCompleted: 0 };

  for (let step = 1; step <= 5; step++) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);

    if (step === 1 && discover.rating) {
      out.discoveredRating = await getSelectOptions(page, 'ratingTier');
    }
    if (step === 3 && discover.contrib) {
      out.discoveredContrib = await getSelectOptions(page, 'contributionTypeSelector');
      if (out.discoveredContrib.length === 0) {
        // try alternative names
        out.discoveredContrib = await getSelectOptions(page, 'contributionType');
      }
    }

    await fillVisibleInputs(page, planData);
    await selectVisibleDropdowns(page, planData);

    if (step === 1) {
      // ensure plan type and rating tier are correct (override any generic choices)
      await selectByName(page, 'planType', { label: planData.planType }).catch(() => {});
      if (ratingTierValue) {
        await selectByName(page, 'ratingTier', ratingTierValue).catch(() => {});
      }
    }
    if (step === 3 && contributionTypeValue) {
      await selectByName(page, 'contributionTypeSelector', contributionTypeValue).catch(async () => {
        await selectByName(page, 'contributionType', contributionTypeValue).catch(() => {});
      });
    }

    await tickAllRequiredCheckboxes(page);
    await page.waitForTimeout(500);
    await shot(page, `combo_${planData.planName}_step${step}.png`);

    const advanced = await clickSaveAndNext(page);
    if (!advanced) break;
    out.stepsCompleted = step;
    await page.waitForTimeout(2500);
    await page.waitForLoadState('networkidle').catch(() => {});
  }
  return out;
}

function safeForName(s) {
  return String(s).replace(/[^A-Za-z0-9]/g, '');
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const results = [];
  let groupUrl = '';
  let discoveredRating = [];
  let discoveredContrib = [];

  try {
    console.log(`🚀 Combinations run — group: ${GROUP_NAME}, plan type: ${PLAN_TYPE}, max combos: ${MAX_COMBOS}\n`);

    // Login
    console.log('=== Login ===');
    await login(page);
    console.log('✓ Logged in\n');

    // Create new group
    console.log(`=== Create new group: ${GROUP_NAME} ===`);
    await createNewGroup(page, groupData);
    groupUrl = page.url();
    console.log(`✓ Group created: ${groupUrl}\n`);

    // Plan 1: discover options + create with combo[0]
    console.log('=== Plan 1 (discovery + create) ===');
    await page.goto(groupUrl, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(1500);
    await startAddPlan(page);

    const tempName = `QA-Plan_TEMP_${RUN_ID}`;
    const tempData = buildPlanData(tempName);
    const w1 = await walkWizard(page, tempData, null, null, { rating: true, contrib: true });
    discoveredRating = w1.discoveredRating;
    discoveredContrib = w1.discoveredContrib;

    console.log(`\n📋 Discovered Rating Structures (${discoveredRating.length}):`);
    discoveredRating.forEach((o, i) => console.log(`  [${i}] ${o.label} (${o.value})`));
    console.log(`\n📋 Discovered Contribution Types (${discoveredContrib.length}):`);
    discoveredContrib.forEach((o, i) => console.log(`  [${i}] ${o.label} (${o.value})`));
    console.log('');

    // Record plan 1 result with whatever values the wizard auto-picked
    results.push({
      n: 1,
      ratingStructure: discoveredRating[0]?.label || 'auto',
      contributionType: discoveredContrib[0]?.label || 'auto',
      planName: tempName,
      status: w1.stepsCompleted >= 5 ? 'PASS' : 'PARTIAL',
      stepsCompleted: w1.stepsCompleted,
      url: page.url(),
    });
    console.log(`Plan 1 done: steps ${w1.stepsCompleted}/5\n`);

    // Build cross product (rating × contribution), skip first since we already created it
    const combinations = [];
    for (const r of discoveredRating) {
      for (const c of discoveredContrib) {
        combinations.push({ r, c });
      }
    }
    console.log(`Total possible combinations: ${combinations.length}. Will create ${Math.min(MAX_COMBOS, combinations.length) - 1} more (plus the discovery plan = ${Math.min(MAX_COMBOS, combinations.length)} total).\n`);

    // Plans 2..MAX_COMBOS: explicit (R, C) values
    for (let i = 1; i < MAX_COMBOS && i < combinations.length; i++) {
      const { r, c } = combinations[i];
      const planName = `QA-Plan_${safeForName(r.label)}_${safeForName(c.label)}_${RUN_ID}`;
      console.log(`=== Plan ${i + 1}: ${r.label} × ${c.label} ===`);
      const planData = buildPlanData(planName);

      try {
        // Back to group, start fresh
        await page.goto(groupUrl, { waitUntil: 'networkidle' }).catch(() => {});
        await page.waitForTimeout(1500);
        await startAddPlan(page);
        const w = await walkWizard(page, planData, r.value, c.value, {});
        results.push({
          n: i + 1,
          ratingStructure: r.label,
          contributionType: c.label,
          planName,
          status: w.stepsCompleted >= 5 ? 'PASS' : 'PARTIAL',
          stepsCompleted: w.stepsCompleted,
          url: page.url(),
        });
        console.log(`Plan ${i + 1} done: steps ${w.stepsCompleted}/5\n`);
      } catch (e) {
        await shot(page, `combo_plan${i + 1}_error.png`);
        results.push({
          n: i + 1,
          ratingStructure: r.label,
          contributionType: c.label,
          planName,
          status: 'FAIL',
          error: e.message,
        });
        console.log(`Plan ${i + 1} FAILED: ${e.message}\n`);
      }
    }
  } catch (e) {
    console.error(`\n❌ Fatal: ${e.message}`);
    await shot(page, 'combo_fatal_error.png');
  } finally {
    // Print final report
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL REPORT');
    console.log('='.repeat(70));
    console.log(`Group: ${GROUP_NAME}`);
    console.log(`Group URL: ${groupUrl}`);
    console.log(`Plan Type: ${PLAN_TYPE}`);
    console.log(`Plans created: ${results.length}`);
    console.log(`Pass: ${results.filter(r => r.status === 'PASS').length} | Partial: ${results.filter(r => r.status === 'PARTIAL').length} | Fail: ${results.filter(r => r.status === 'FAIL').length}`);
    console.log('-'.repeat(70));
    for (const r of results) {
      const tag = r.status === 'PASS' ? '✅' : (r.status === 'PARTIAL' ? '⚠️ ' : '❌');
      console.log(`${tag} #${r.n} | ${r.ratingStructure} × ${r.contributionType}`);
      console.log(`     plan: ${r.planName}`);
      console.log(`     steps: ${r.stepsCompleted ?? '-'}/5  status: ${r.status}${r.error ? '  err: ' + r.error : ''}`);
    }
    console.log('='.repeat(70));

    // Save JSON report
    const reportPath = path.join(reportsDir, `combo_report_${RUN_ID}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: TIMESTAMP,
      group: GROUP_NAME,
      groupUrl,
      planType: PLAN_TYPE,
      ratingStructures: discoveredRating,
      contributionTypes: discoveredContrib,
      results,
    }, null, 2));
    console.log(`📄 JSON report: ${reportPath}`);

    await browser.close();
  }
}

main();
