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

// Group form data
const groupData = {
  name: 'Test Company ' + new Date().toISOString().slice(0, 10),
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

async function loginAndViewGroups() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('\n--- Login and View Groups ---');
    console.log('Navigating to login page...');
    await page.goto(`${process.env.APP_BASE_URL}/login`, { waitUntil: 'networkidle' });

    console.log('Filling in email...');
    await page.getByTestId('email-input').fill(credentials.email);

    console.log('Filling in password...');
    await page.getByTestId('password-input').fill(credentials.password);

    console.log('Clicking login button...');
    await page.getByTestId('login-btn').click();

    console.log('Waiting for navigation to dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    console.log('✓ Login successful!');
    console.log('Current URL:', page.url());

    // Wait a moment for page to fully load
    await page.waitForTimeout(2000);

    // Take screenshot before clicking View All Groups
    const beforeScreenshot = path.join(screenshotsDir, 'before_view_groups.png');
    await page.screenshot({ path: beforeScreenshot });
    console.log(`📸 Screenshot saved: before_view_groups.png`);

    // Click on View All Groups button
    console.log('Looking for View All Groups button...');
    const viewAllGroupsButton = page.getByTestId('view-all-groups');
    
    // Wait for button and click
    await viewAllGroupsButton.click({ timeout: 5000 });
    console.log('✓ Clicked View All Groups button!');

    // Wait for page navigation/content update
    await page.waitForTimeout(2000);

    console.log('Current URL:', page.url());

    // Take screenshot after clicking
    const afterScreenshot = path.join(screenshotsDir, 'after_view_groups.png');
    await page.screenshot({ path: afterScreenshot });
    console.log(`📸 Screenshot saved: after_view_groups.png`);

    console.log('\n✅ Successfully clicked View All Groups!');

    // Wait for groups page to load
    await page.waitForTimeout(1500);

    // Click on +New Group button
    console.log('Looking for +New Group button...');
    const newGroupButton = page.getByTestId('new-group-btn');
    
    await newGroupButton.click({ timeout: 5000 });
    console.log('✓ Clicked +New Group button!');

    // Wait for dialog/page update
    await page.waitForTimeout(2000);

    console.log('Current URL:', page.url());

    // Take screenshot after clicking New Group
    const newGroupScreenshot = path.join(screenshotsDir, 'after_new_group.png');
    await page.screenshot({ path: newGroupScreenshot });
    console.log(`📸 Screenshot saved: after_new_group.png`);

    console.log('\n✅ Successfully clicked +New Group button!');

    // Wait for form to fully load
    await page.waitForTimeout(1500);

    // Step 3: Fill mandatory fields
    console.log('\n--- Filling mandatory fields ---');

    // Fill Company Name (mandatory)
    console.log('Filling Company Name...');
    await page.locator('input[name="name"]').fill(groupData.name);
    console.log(`✓ Company Name: ${groupData.name}`);

    // Fill EIN (mandatory)
    console.log('Filling EIN...');
    await page.locator('input[name="ein"]').fill(groupData.ein);
    console.log(`✓ EIN: ${groupData.ein}`);

    // Fill Effective Date (mandatory)
    console.log('Filling Effective Date...');
    await page.locator('input[name="effectiveDate"]').fill(groupData.effectiveDate);
    console.log(`✓ Effective Date: ${groupData.effectiveDate}`);

    // Fill Renewal Date (mandatory)
    console.log('Filling Renewal Date...');
    await page.locator('input[name="renewalDate"]').fill(groupData.renewalDate);
    console.log(`✓ Renewal Date: ${groupData.renewalDate}`);

    // Fill Street Address (mandatory)
    console.log('Filling Street Address...');
    await page.locator('input[name="street1"]').fill(groupData.street1);
    console.log(`✓ Street Address: ${groupData.street1}`);

    // Fill City (mandatory)
    console.log('Filling City...');
    await page.locator('input[name="city"]').fill(groupData.city);
    console.log(`✓ City: ${groupData.city}`);

    // Fill State (mandatory) - Try as select first, then input
    console.log('Filling State...');
    try {
      const stateSelect = page.locator('select[name="state"]');
      const selectExists = await stateSelect.count() > 0;
      if (selectExists) {
        await stateSelect.selectOption(groupData.state);
        console.log(`✓ State (select): ${groupData.state}`);
      } else {
        const stateInput = page.locator('input[name="state"]');
        if (await stateInput.count() > 0) {
          await stateInput.fill(groupData.state);
          console.log(`✓ State (input): ${groupData.state}`);
        } else {
          console.log(`⚠️  State field not found`);
        }
      }
    } catch (e) {
      console.log(`⚠️  Error filling State: ${e.message}`);
    }

    // Fill ZIP Code (mandatory)
    console.log('Filling ZIP Code...');
    await page.locator('input[name="zip"]').fill(groupData.zip);
    console.log(`✓ ZIP Code: ${groupData.zip}`);

    // Fill Contact First Name (mandatory)
    console.log('Filling Contact First Name...');
    await page.locator('input[name="contactFirst"]').fill(groupData.contactFirst);
    console.log(`✓ First Name: ${groupData.contactFirst}`);

    // Fill Contact Last Name (mandatory)
    console.log('Filling Contact Last Name...');
    await page.locator('input[name="contactLast"]').fill(groupData.contactLast);
    console.log(`✓ Last Name: ${groupData.contactLast}`);

    // Fill Contact Email (mandatory)
    console.log('Filling Contact Email...');
    await page.locator('input[name="contactEmail"]').fill(groupData.contactEmail);
    console.log(`✓ Email: ${groupData.contactEmail}`);

    // Fill Contact Phone (mandatory)
    console.log('Filling Contact Phone...');
    await page.locator('input[name="contactPhone"]').fill(groupData.contactPhone);
    console.log(`✓ Phone: ${groupData.contactPhone}`);

    // Wait a moment for fields to be populated
    await page.waitForTimeout(1000);

    // Take screenshot after filling form
    const filledFormScreenshot = path.join(screenshotsDir, 'form_filled.png');
    await page.screenshot({ path: filledFormScreenshot });
    console.log(`📸 Screenshot saved: form_filled.png`);

    // Step 4: Submit the form by clicking "Create Group & Start Setup" button
    console.log('\n--- Submitting form ---');
    console.log('Looking for Create Group & Start Setup button...');
    
    const submitButtonSelectors = [
      'button:has-text("Create Group & Start Setup")',
      'button:has-text("Create Group")',
      '[data-testid="create-group-btn"]',
      'button[type="submit"]'
    ];

    let buttonClicked = false;
    for (const selector of submitButtonSelectors) {
      try {
        const button = page.locator(selector);
        if (await button.isVisible({ timeout: 3000 })) {
          await button.click();
          console.log(`✓ Clicked Create Group & Start Setup button (${selector})`);
          buttonClicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!buttonClicked) {
      throw new Error('Create Group & Start Setup button not found');
    }

    // Wait for form submission and navigation
    console.log('Waiting for form submission...');
    await page.waitForTimeout(3000);

    console.log('Current URL:', page.url());

    // Take screenshot after submission
    const submittedScreenshot = path.join(screenshotsDir, 'form_submitted.png');
    await page.screenshot({ path: submittedScreenshot });
    console.log(`📸 Screenshot saved: form_submitted.png`);

    console.log('\n✅ Successfully submitted the form!');

    console.log('\n✅ Successfully submitted the form!');
    console.log(`📁 Screenshots saved in: ${screenshotsDir}`);

    // Keep browser open for 3 seconds to see the result
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Try to capture error screenshot
    try {
      const errorScreenshot = path.join(screenshotsDir, 'error_view_groups.png');
      await page.screenshot({ path: errorScreenshot });
      console.log(`📸 Error screenshot saved: error_view_groups.png`);
    } catch (e) {
      console.log('Could not capture error screenshot');
    }
  } finally {
    await browser.close();
  }
}

// Run the function
loginAndViewGroups();
