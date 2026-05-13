// Generate a manual test case spreadsheet (.xlsx + .csv) for the 24
// Rating Structure × Contribution Type plan-creation combinations.
// Pulls actual run results from the JSON reports in reports/.
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const reportsDir = path.join(__dirname, 'reports');
const reportFiles = [
  'combo_report_094952.json',
  'combo_report_111914.json',
  'combo_report_113239.json',
  'combo_report_114103.json',
  'combo_report_114644.json',
];

const groupNameByUrl = {};
const all = [];
for (const f of reportFiles) {
  const p = path.join(reportsDir, f);
  if (!fs.existsSync(p)) continue;
  const r = JSON.parse(fs.readFileSync(p, 'utf8'));
  groupNameByUrl[r.groupUrl] = r.group;
  for (const result of r.results) {
    all.push({ ...result, group: r.group, runTimestamp: r.timestamp });
  }
}
all.sort((a, b) => a.n - b.n);

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  // Always quote — handles commas, quotes, and newlines uniformly.
  return '"' + s.replace(/"/g, '""') + '"';
}

const headers = [
  'Test Case ID',
  'Module',
  'Sub-Module',
  'Test Case Title',
  'Test Type',
  'Priority',
  'Pre-Conditions',
  'Test Steps',
  'Test Data',
  'Expected Result',
  'Actual Result',
  'Status',
  'Executed By',
  'Execution Date',
  'Group',
  'Plan Name',
  'Comments',
];

function pad(n) {
  return String(n).padStart(3, '0');
}

function preConditions() {
  return [
    '1. User has valid Abra application credentials',
    '2. The Abra environment is reachable (e.g., http://20.124.125.46) and the login page loads',
    '3. The user has permission to create groups and plans in their tenant',
    '4. The browser allows pop-ups / cookies for the Abra domain (the SPA uses session cookies)',
  ].join('\n');
}

function testSteps(rating, contribution, groupName) {
  return [
    '--- Login ---',
    '1. Open a browser and navigate to the Abra login URL (e.g., http://20.124.125.46/login)',
    '2. Enter a valid email in the Email field',
    '3. Enter the password in the Password field',
    '4. Click the "Login" / "Sign In" button',
    '5. Verify navigation to the Dashboard (URL contains "/dashboard" and the dashboard widgets are visible)',
    '',
    '--- Create a new test group ---',
    '6. From the left sidebar (or dashboard), click "View All Groups"',
    '7. On the Groups page, click the "+ New Group" button (top right)',
    '8. On the New Group form, fill the mandatory fields:',
    `    - Company Name: ${groupName}`,
    '    - EIN: 12-3456789',
    '    - Effective Date: 2026-01-01',
    '    - Renewal Date: 2026-12-31',
    '    - Street Address: 123 Main Street',
    '    - City: Charleston',
    '    - State: SC',
    '    - ZIP: 29401',
    '    - Contact First Name: John',
    '    - Contact Last Name: Doe',
    '    - Contact Email: john@example.com',
    '    - Contact Phone: (843) 555-0100',
    '9. Click the "Create Group & Start Setup" button at the bottom of the form',
    '10. Verify navigation to the newly-created group detail page (URL pattern /groups/<uuid>) with the group name as the heading. The Plans tab is selected by default and the "+ Add Plan" button is visible.',
    '',
    '--- Start plan creation ---',
    '11. Click the "+ Add Plan" button on the Plans tab',
    '12. On the "Add Benefit Plans" method screen, click the "Enter Plan Manually" card (do NOT pick "Upload Carrier Proposal" or "Import from Quoting Engine")',
    '',
    '--- Step 1 of 5: Plan Basics ---',
    '13. On Plan Basics, enter the following:',
    '    - Plan Name: <unique value, e.g. "QA-Plan_<RatingLabel>_<ContribLabel>_<timestamp>">',
    '    - Plan Type: Dental',
    `    - Rating Structure (Rating Tier dropdown): "${rating}"`,
    '    - Carrier Name: BlueCross BlueShield',
    '    - Policy Number: POL-12345',
    '    - Effective Date: 2026-01-01',
    '    - Termination Date / Renewal Date: 2026-12-31',
    '    - Network Type, Category, Situs State: any valid value',
    '    - Waiting Period (days): 0',
    '    - Dependent Age Out Age: 26',
    '    - Minimum Participation %: 100',
    '    - Minimum Contribution %: 50',
    '14. Click "Save & Next" to advance to Step 2',
    '',
    '--- Step 2 of 5: Benefits ---',
    '15. On Benefits ("Dental Plan Benefits"), keep defaults or fill: Annual Maximum, Preventive %, Basic %, Major %, Orthodontia %, Ortho Lifetime Max',
    '16. Set Dental Waiting Periods (Basic, Major) to 0 — values must be between 0 and 24 months',
    '17. Click "Save & Next" to advance to Step 3',
    '',
    '--- Step 3 of 5: Contributions ---',
    `18. On Contributions, set Contribution Type to "${contribution}" using the Contribution Type dropdown`,
    '19. Set Employer Contribution % to 50',
    '20. Click "Save & Next" to advance to Step 4',
    '',
    '--- Step 4 of 5: Rates ---',
    '21. On Plan Rates, enter Monthly Premium = $100 for each coverage tier displayed (Employee Only, Employee + Spouse, Employee + Child, …)',
    '22. Verify Employer Cost and Employee Cost auto-calculate based on the contribution strategy',
    '23. Click "Save & Next" to advance to Step 5',
    '',
    '--- Step 5 of 5: Review & Save ---',
    '24. On Review & Save, verify the Plan Information section shows the values entered (Plan Name, Plan Type=Dental, Carrier, Network, Metal Tier, Effective Date, Rating Structure, Situs State, Renewal Date)',
    '25. Confirm the toast "Plan saved" was displayed and the page heading is now "Edit Plan"',
    '26. Confirm all five wizard step indicators (Plan Basics, Benefits, Contributions, Rates, Review) show ✓ (green check)',
  ].join('\n');
}

function testData(r) {
  return [
    `Plan Type: Dental`,
    `Rating Structure: ${r.ratingStructure}`,
    `Contribution Type: ${r.contributionType}`,
    `Plan Name: ${r.planName}`,
    `Effective Date: 2026-01-01`,
    `Renewal Date: 2026-12-31`,
    `Group: ${r.group}`,
  ].join('\n');
}

function expectedResult() {
  return [
    '1. All 5 wizard steps (Plan Basics → Benefits → Contributions → Rates → Review) advance without validation errors',
    '2. "Plan saved" toast notification appears (typically after Save & Next on each step)',
    '3. Page heading changes from "Add Benefit Plan" to "Edit Plan" once the plan is persisted',
    '4. All step indicators show ✓ (green) on the Review page',
    '5. The Review & Save section shows the entered Plan Name, Plan Type=Dental, the selected Rating Structure, and the selected Contribution Type',
    '6. The plan appears in the Plans tab of the group',
  ].join('\n');
}

function actualResult(r) {
  if (r.status === 'PASS') {
    return [
      'Plan created and saved successfully.',
      `Wizard steps completed: ${r.stepsCompleted ?? 5}/5.`,
      '"Plan saved" toast observed; Review page displayed the entered values.',
    ].join('\n');
  }
  if (r.status === 'PARTIAL') {
    return [
      'Wizard partially completed.',
      `Steps completed: ${r.stepsCompleted ?? 0}/5.`,
      `Stopped before final save.`,
    ].join('\n');
  }
  // FAIL
  const reason = r.error || 'Unknown error';
  if (reason.toLowerCase().includes('add plan')) {
    return [
      'Plan creation could not start.',
      'After navigating to the group page, the application redirected to the Sign-in screen — the Abra session timed out during the long-running automation run, so the "+ Add Plan" button was not visible.',
      `Error: ${reason}`,
    ].join('\n');
  }
  return `Plan creation failed. Error: ${reason}`;
}

function buildRow(r) {
  return [
    `TC_PLAN_${pad(r.n)}`,
    'Plan Creation',
    'Rating × Contribution Combination',
    `Create Dental plan with Rating "${r.ratingStructure}" and Contribution "${r.contributionType}"`,
    'Functional, Combinatorial',
    'High',
    preConditions(),
    testSteps(r.ratingStructure, r.contributionType, r.group),
    testData(r),
    expectedResult(),
    actualResult(r),
    r.status,
    'QA Automation (Playwright)',
    '2026-05-05',
    r.group,
    r.planName,
    r.status === 'PASS'
      ? 'Verified end-to-end via add-plan-combinations.js'
      : (r.status === 'PARTIAL'
          ? 'Wizard ran but did not complete all 5 steps'
          : `Re-run recommended in a fresh session. Error: ${r.error || 'unknown'}`),
  ];
}

// ---- Write CSV ----
const csvRows = [headers.map(csvEscape).join(',')];
for (const r of all) csvRows.push(buildRow(r).map(csvEscape).join(','));
const csvOut = path.join(reportsDir, 'test-cases-plan-combinations.csv');
fs.writeFileSync(csvOut, csvRows.join('\n') + '\n');
console.log(`✅ CSV: ${csvOut}`);

// ---- Write XLSX with formatting ----
async function writeXlsx() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'QA Automation';
  wb.created = new Date();
  const ws = wb.addWorksheet('Test Cases', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }],
  });

  // Column widths tuned for readability
  ws.columns = [
    { header: 'Test Case ID', key: 'id', width: 14 },
    { header: 'Module', key: 'module', width: 16 },
    { header: 'Sub-Module', key: 'sub', width: 30 },
    { header: 'Test Case Title', key: 'title', width: 60 },
    { header: 'Test Type', key: 'type', width: 22 },
    { header: 'Priority', key: 'priority', width: 10 },
    { header: 'Pre-Conditions', key: 'pre', width: 50 },
    { header: 'Test Steps', key: 'steps', width: 70 },
    { header: 'Test Data', key: 'data', width: 40 },
    { header: 'Expected Result', key: 'expected', width: 50 },
    { header: 'Actual Result', key: 'actual', width: 50 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Executed By', key: 'by', width: 22 },
    { header: 'Execution Date', key: 'date', width: 14 },
    { header: 'Group', key: 'group', width: 26 },
    { header: 'Plan Name', key: 'plan', width: 50 },
    { header: 'Comments', key: 'comments', width: 50 },
  ];

  // Header style
  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    };
  });

  // Data rows
  for (const r of all) {
    const row = buildRow(r);
    const added = ws.addRow(row);
    added.alignment = { vertical: 'top', wrapText: true };
    added.height = 240; // tall row to show steps without expansion

    // Subtle zebra stripe
    if (r.n % 2 === 0) {
      added.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      });
    }

    // Color-code status cell (column index 12)
    const statusCell = added.getCell(12);
    if (r.status === 'PASS') {
      statusCell.font = { bold: true, color: { argb: 'FF065F46' } };
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
    } else if (r.status === 'FAIL') {
      statusCell.font = { bold: true, color: { argb: 'FF991B1B' } };
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
    } else {
      statusCell.font = { bold: true, color: { argb: 'FF92400E' } };
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
    }
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Cell borders
    added.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    });
  }

  // Add an autofilter on header
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };

  // Summary sheet
  const summary = wb.addWorksheet('Summary');
  summary.columns = [
    { header: 'Metric', key: 'k', width: 30 },
    { header: 'Value', key: 'v', width: 50 },
  ];
  const totalsHeader = summary.getRow(1);
  totalsHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  totalsHeader.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  });
  const passN = all.filter(r => r.status === 'PASS').length;
  const failN = all.filter(r => r.status === 'FAIL').length;
  const partialN = all.filter(r => r.status === 'PARTIAL').length;
  const summaryRows = [
    ['Total test cases', all.length],
    ['Passed', passN],
    ['Failed', failN],
    ['Partial', partialN],
    ['Plan Type', 'Dental'],
    ['Rating Structures tested', '8 (Composite, 2-Tier, 3-Tier, 6-Tier, Age-Banded, ACA, Volume-Based, Banded)'],
    ['Contribution Types tested', '3 (Percentage of Premium, Flat Dollar Amount, Defined Contribution)'],
    ['Test groups', '5 (QA-Combo_2026-05-05_094952, QA-Combo_5, QA-Combo_11, QA-Combo_16, QA-Combo_21)'],
    ['Execution date', '2026-05-05'],
    ['Executed by', 'QA Automation (Playwright)'],
    ['Tooling', 'Playwright + Chromium · scripts: addnewgroup.js, add-plan.js, add-plan-combinations.js'],
  ];
  for (const [k, v] of summaryRows) {
    const r = summary.addRow([k, v]);
    r.alignment = { vertical: 'top', wrapText: true };
  }

  const xlsxOut = path.join(reportsDir, 'test-cases-plan-combinations.xlsx');
  await wb.xlsx.writeFile(xlsxOut);
  console.log(`✅ XLSX: ${xlsxOut}`);
}

writeXlsx().then(() => {
  console.log(`Generated ${all.length} test cases.`);
}).catch((e) => {
  console.error('XLSX generation failed:', e);
  process.exit(1);
});
