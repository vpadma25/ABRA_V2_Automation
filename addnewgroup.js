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

// Group form data - adjust these based on your mandatory fields
const groupData = {
  name: 'Test Group ' + new Date().toISOString().slice(0, 10),
  description: 'Automated test group created by Playwright',
  // Add more fields if needed, e.g.:
  // category: 'General',
  // members: 'test@example.com'
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

    // Step 2: Click +New Group button on Dashboard
    console.log('\n--- Step 2: Clicking +New Group button ---');

    // Wait for dashboard to load
    await page.waitForTimeout(2000);

    // Try different selectors for +New Group button
    const newGroupSelectors = [
      'button:has-text("+New Group")',
      'button:has-text("New Group")',
      'button:has-text("+ New Group")',
      '[data-testid="new-group-btn"]',
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

    // Fill group name (mandatory)
    const nameSelectors = [
      'input[name="name"]',
      'input[name="groupName"]',
      'input[placeholder*="name"]',
      'input[placeholder*="Name"]',
      '[data-testid="group-name-input"]'
    ];

    let nameFilled = false;
    for (const selector of nameSelectors) {
      try {
        const field = page.locator(selector);
        if (await field.isVisible({ timeout: 3000 })) {
          await field.fill(groupData.name);
          console.log(`✓ Filled group name: ${groupData.name}`);
          nameFilled = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!nameFilled) {
      throw new Error('Group name field not found');
    }

    // Fill description (mandatory)
    const descSelectors = [
      'textarea[name="description"]',
      'input[name="description"]',
      'textarea[placeholder*="description"]',
      'textarea[placeholder*="Description"]',
      '[data-testid="group-description-input"]'
    ];

    let descFilled = false;
    for (const selector of descSelectors) {
      try {
        const field = page.locator(selector);
        if (await field.isVisible({ timeout: 3000 })) {
          await field.fill(groupData.description);
          console.log(`✓ Filled description: ${groupData.description}`);
          descFilled = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!descFilled) {
      throw new Error('Description field not found');
    }

    // Add more mandatory fields here if needed
    // Example: Category dropdown
    /*
    const categorySelectors = ['select[name="category"]', '[data-testid="category-select"]'];
    for (const selector of categorySelectors) {
      try {
        const select = page.locator(selector);
        if (await select.isVisible({ timeout: 3000 })) {
          await select.selectOption(groupData.category);
          console.log(`✓ Selected category: ${groupData.category}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    */

    // Capture form filled screenshot
    const formScreenshot = path.join(screenshotsDir, 'addnewgroup_form_filled.png');
    await page.screenshot({ path: formScreenshot });
    console.log('📸 Form filled screenshot saved');

    // Step 4: Submit the form
    console.log('\n--- Step 4: Submitting form ---');

    // Look for submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Create")',
      'button:has-text("Save")',
      'button:has-text("Add Group")',
      'button:has-text("Submit")',
      '[data-testid="submit-btn"]'
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
      groupDescription: groupData.description,
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