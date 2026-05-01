require('dotenv').config();

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Login credentials (loaded from .env)
const credentials = {
  email: process.env.TEST_USER_EMAIL,
  password: process.env.TEST_USER_PASSWORD
};

const screenshotsDir = path.join(__dirname, 'screenshots');

async function inspectNewGroupForm() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 Inspecting New Group Form...\n');

    // Step 1: Login
    console.log('--- Step 1: Logging in ---');
    await page.goto(`${process.env.APP_BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.getByTestId('email-input').fill(credentials.email);
    await page.getByTestId('password-input').fill(credentials.password);
    await page.getByTestId('login-btn').click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('✓ Login successful!\n');

    // Step 2: Navigate to View All Groups
    console.log('--- Step 2: Navigating to groups page ---');
    await page.waitForTimeout(2000);
    const viewAllGroupsButton = page.locator('button:has-text("View All Groups"), a:has-text("View All Groups")');
    await viewAllGroupsButton.click({ timeout: 5000 });
    await page.waitForTimeout(2000);
    console.log('✓ Navigated to groups page\n');

    // Step 3: Click +New Group button
    console.log('--- Step 3: Clicking +New Group button ---');
    const newGroupButton = page.getByTestId('new-group-btn');
    await newGroupButton.click({ timeout: 5000 });
    await page.waitForTimeout(2000);
    console.log('✓ New Group form opened\n');

    // Step 4: Inspect form elements
    console.log('--- Step 4: Inspecting form elements ---\n');

    // Get all input fields
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input fields:\n`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      const dataTestId = await input.getAttribute('data-testid');
      const ariaLabel = await input.getAttribute('aria-label');
      const visible = await input.isVisible().catch(() => false);

      console.log(`Input ${i + 1}:`);
      console.log(`  Name: ${name || 'N/A'}`);
      console.log(`  ID: ${id || 'N/A'}`);
      console.log(`  Type: ${type || 'text'}`);
      console.log(`  Placeholder: ${placeholder || 'N/A'}`);
      console.log(`  Data-TestId: ${dataTestId || 'N/A'}`);
      console.log(`  Aria-Label: ${ariaLabel || 'N/A'}`);
      console.log(`  Visible: ${visible}`);
      console.log('');
    }

    // Get all textarea fields
    const textareas = await page.locator('textarea').all();
    console.log(`\nFound ${textareas.length} textarea fields:\n`);
    
    for (let i = 0; i < textareas.length; i++) {
      const textarea = textareas[i];
      const name = await textarea.getAttribute('name');
      const id = await textarea.getAttribute('id');
      const placeholder = await textarea.getAttribute('placeholder');
      const dataTestId = await textarea.getAttribute('data-testid');
      const ariaLabel = await textarea.getAttribute('aria-label');
      const visible = await textarea.isVisible().catch(() => false);

      console.log(`Textarea ${i + 1}:`);
      console.log(`  Name: ${name || 'N/A'}`);
      console.log(`  ID: ${id || 'N/A'}`);
      console.log(`  Placeholder: ${placeholder || 'N/A'}`);
      console.log(`  Data-TestId: ${dataTestId || 'N/A'}`);
      console.log(`  Aria-Label: ${ariaLabel || 'N/A'}`);
      console.log(`  Visible: ${visible}`);
      console.log('');
    }

    // Get all labels
    const labels = await page.locator('label').all();
    console.log(`\nFound ${labels.length} labels:\n`);
    
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const text = await label.textContent();
      const htmlFor = await label.getAttribute('for');
      console.log(`Label ${i + 1}: "${text}" (for: ${htmlFor || 'N/A'})`);
    }

    // Take screenshot
    const inspectScreenshot = path.join(screenshotsDir, 'form_inspection.png');
    await page.screenshot({ path: inspectScreenshot });
    console.log(`\n📸 Screenshot saved: form_inspection.png`);

    // Keep browser open so you can use DevTools
    console.log('\n🔧 Browser DevTools are available - you can inspect elements manually');
    console.log('Press Ctrl+Shift+I to open DevTools in the browser window');
    console.log('The form will remain visible - close the browser when done\n');

    // Keep browser open indefinitely until user closes it
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Error:', error.message);
    const errorScreenshot = path.join(screenshotsDir, 'inspect_error.png');
    await page.screenshot({ path: errorScreenshot });
    console.log(`📸 Error screenshot saved: inspect_error.png`);
  } finally {
    await browser.close();
  }
}

inspectNewGroupForm();
