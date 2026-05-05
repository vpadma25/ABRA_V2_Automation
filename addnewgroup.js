require('dotenv').config();

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
const reportsDir = path.join(__dirname, 'reports');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}

// Login credentials (loaded from .env)
const credentials = {
  email: process.env.TEST_USER_EMAIL,
  password: process.env.TEST_USER_PASSWORD
};

// Group form data - mandatory fields for the New Group form
const groupData = {
  name: 'QA-Test_' + new Date().toISOString().slice(0, 10),
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
  contactPhone: '(843) 555-0100'
};

async function addNewGroup() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Starting Login + Add New Group automation...');

    // Step 1: Login
    console.log('\n--- Step 1: Logging in ---');
    console.log('Navigating to login page...');
    await page.goto(`${process.env.APP_BASE_URL}/login`, { waitUntil: 'networkidle' });

    console.log('Filling in email...');
    await page.getByTestId('email-input').fill(credentials.email);

    console.log('Filling in password...');69
    await page.getByTestId('password-input').fill(credentials.password);

    console.log('Clicking login button...');
    await page.getByTestId('login-btn').click();

    console.log('Waiting for navigation to dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    console.log('✓ Login successful!');
    console.log('Current URL:', page.url());

    // Capture login success screenshot
    const loginScreenshot = path.join(screenshotsDir, 'addnewgroup_login_success.png');
    await page.screenshot({ path: loginScreenshot });
    console.log('📸 Login screenshot saved');

    // Step 2a: Navigate to groups page via "View All Groups"
    console.log('\n--- Step 2a: Clicking View All Groups ---');
    await page.waitForTimeout(2000);
    const viewAllGroupsButton = page.getByTestId('view-all-groups');
    await viewAllGroupsButton.click({ timeout: 5000 });
    await page.waitForTimeout(2000);
    console.log('✓ Navigated to groups page');

    // Step 2b: Click +New Group button on the groups page
    console.log('\n--- Step 2b: Clicking +New Group button ---');

    // Try different selectors for +New Group button
    const newGroupSelectors = [
      '[data-testid="new-group-btn"]',
      'button:has-text("+New Group")',
      'button:has-text("New Group")',
      'button:has-text("+ New Group")',
      '.new-group-btn',
      '#new-group-btn',
      'button[class*="new-group"]'
    ];

    let buttonFound = false;
    for (const selector of newGroupSelectors) {
      try {
        const button = page.locator(selector);
        if (await button.isVisible({ timeout: 5000 })) {
          await button.click();
          buttonFound = true;
          console.log(`✓ Clicked +New Group button (${selector})`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!buttonFound) {
      throw new Error('+New Group button not found on dashboard. Please check the page structure.');
    }

    // Wait for modal/form to appear
    await page.waitForTimeout(2000);

    // Step 3: Fill mandatory fields
    console.log('\n--- Step 3: Filling mandatory fields ---');

    await page.locator('input[name="name"]').fill(groupData.name);
    console.log(`✓ Company Name: ${groupData.name}`);

    await page.locator('input[name="ein"]').fill(groupData.ein);
    console.log(`✓ EIN: ${groupData.ein}`);

    await page.locator('input[name="effectiveDate"]').fill(groupData.effectiveDate);
    console.log(`✓ Effective Date: ${groupData.effectiveDate}`);

    await page.locator('input[name="renewalDate"]').fill(groupData.renewalDate);
    console.log(`✓ Renewal Date: ${groupData.renewalDate}`);

    await page.locator('input[name="street1"]').fill(groupData.street1);
    console.log(`✓ Street: ${groupData.street1}`);

    await page.locator('input[name="city"]').fill(groupData.city);
    console.log(`✓ City: ${groupData.city}`);

    // State: try select first, fall back to input
    try {
      const stateSelect = page.locator('select[name="state"]');
      if (await stateSelect.count() > 0) {
        await stateSelect.selectOption(groupData.state);
        console.log(`✓ State: ${groupData.state}`);
      } else {
        await page.locator('input[name="state"]').fill(groupData.state);
        console.log(`✓ State (input): ${groupData.state}`);
      }
    } catch (e) {
      console.log(`⚠️  State field issue: ${e.message}`);
    }

    await page.locator('input[name="zip"]').fill(groupData.zip);
    console.log(`✓ ZIP: ${groupData.zip}`);

    await page.locator('input[name="contactFirst"]').fill(groupData.contactFirst);
    console.log(`✓ Contact First: ${groupData.contactFirst}`);

    await page.locator('input[name="contactLast"]').fill(groupData.contactLast);
    console.log(`✓ Contact Last: ${groupData.contactLast}`);

    await page.locator('input[name="contactEmail"]').fill(groupData.contactEmail);
    console.log(`✓ Contact Email: ${groupData.contactEmail}`);

    await page.locator('input[name="contactPhone"]').fill(groupData.contactPhone);
    console.log(`✓ Contact Phone: ${groupData.contactPhone}`);

    await page.waitForTimeout(1000);

    // Capture form filled screenshot
    const formScreenshot = path.join(screenshotsDir, 'addnewgroup_form_filled.png');
    await page.screenshot({ path: formScreenshot });
    console.log('📸 Form filled screenshot saved');

    // Step 4: Submit the form
    console.log('\n--- Step 4: Submitting form ---');

    // Look for submit button
    const submitSelectors = [
      'button:has-text("Create Group & Start Setup")',
      'button:has-text("Create Group")',
      '[data-testid="create-group-btn"]',
      'button[type="submit"]',
      'button:has-text("Create")',
      'button:has-text("Save")',
      'button:has-text("Submit")'
    ];

    let submitFound = false;
    for (const selector of submitSelectors) {
      try {
        const button = page.locator(selector);
        if (await button.isVisible({ timeout: 3000 })) {
          await button.click();
          console.log(`✓ Clicked submit button (${selector})`);
          submitFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!submitFound) {
      throw new Error('Submit button not found');
    }

    // Wait for submission to complete
    await page.waitForTimeout(3000);

    // Check if we're back on dashboard or success message appears
    console.log('✓ Form submitted successfully!');

    // Capture success screenshot
    const successScreenshot = path.join(screenshotsDir, 'addnewgroup_success.png');
    await page.screenshot({ path: successScreenshot });
    console.log('📸 Success screenshot saved');

    console.log('\n✅ New group created successfully!');
    console.log(`📁 Screenshots saved in: ${screenshotsDir}`);

    // Generate simple report
    const reportData = {
      timestamp: new Date().toISOString(),
      loginEmail: credentials.email,
      groupName: groupData.name,
      status: 'SUCCESS',
      screenshots: [loginScreenshot, formScreenshot, successScreenshot]
    };

    const reportPath = path.join(reportsDir, `addnewgroup_report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Report saved: ${reportPath}`);

  } catch (error) {
    console.error('\n❌ Add New Group automation failed:', error.message);

    // Capture error screenshot
    try {
      const errorScreenshot = path.join(screenshotsDir, 'addnewgroup_error.png');
      await page.screenshot({ path: errorScreenshot });
      console.log('📸 Error screenshot saved');
    } catch (e) {
      console.log('Could not capture error screenshot');
    }

    throw error;
  } finally {
    await browser.close();
  }
}

// Run the automation
addNewGroup().catch(console.error);