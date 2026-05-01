require('dotenv').config();

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Login credentials (loaded from .env)
const credentials = {
  email: process.env.TEST_USER_EMAIL,
  password: process.env.TEST_USER_PASSWORD
};

// Group name created earlier (use today's date)
const groupName = 'Test Company ' + new Date().toISOString().slice(0, 10);

const screenshotsDir = path.join(__dirname, 'screenshots');

async function addPlanToGroup() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Starting Add Plan to Group automation...\n');

    // Step 1: Login
    console.log('--- Step 1: Logging in ---');
    await page.goto(`${process.env.APP_BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.getByTestId('email-input').fill(credentials.email);
    await page.getByTestId('password-input').fill(credentials.password);
    await page.getByTestId('login-btn').click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('✓ Login successful!\n');

    // Step 2: Navigate to View All Groups
    console.log('--- Step 2: Navigating to View All Groups ---');
    await page.waitForTimeout(2000);
    const viewAllGroupsButton = page.getByTestId('view-all-groups');
    await viewAllGroupsButton.click({ timeout: 5000 });
    await page.waitForTimeout(2000);
    console.log('✓ Navigated to groups page\n');

    // Step 3: Find and click on the group we created
    console.log(`--- Step 3: Finding and clicking group "${groupName}" ---`);
    const groupLink = page.locator(`text=${groupName}`).first();
    const groupExists = await groupLink.count() > 0;
    
    if (!groupExists) {
      throw new Error(`Group "${groupName}" not found in the groups list`);
    }

    await groupLink.click({ timeout: 5000 });
    await page.waitForTimeout(2000);
    console.log(`✓ Clicked on group "${groupName}"\n`);

    // Take screenshot of group details
    const groupDetailsScreenshot = path.join(screenshotsDir, 'group_details.png');
    await page.screenshot({ path: groupDetailsScreenshot });
    console.log('📸 Screenshot saved: group_details.png\n');

    // Step 4: Click on Plans tab
    console.log('--- Step 4: Clicking on Plans tab ---');
    const plansTab = page.locator('button:has-text("Plans"), a:has-text("Plans"), [data-testid*="plans"]').first();
    const plansTabExists = await plansTab.count() > 0;
    
    if (!plansTabExists) {
      // Try alternative selector
      const altPlansTab = page.locator('text=Plans').first();
      if (await altPlansTab.count() > 0) {
        await altPlansTab.click({ timeout: 5000 });
      } else {
        throw new Error('Plans tab not found');
      }
    } else {
      await plansTab.click({ timeout: 5000 });
    }

    await page.waitForTimeout(3000);
    console.log('✓ Plans tab opened\n');
    console.log(`Current URL after clicking Plans tab: ${page.url()}\n`);

    // Take screenshot of Plans tab
    const plansTabScreenshot = path.join(screenshotsDir, 'plans_tab.png');
    await page.screenshot({ path: plansTabScreenshot });
    console.log('📸 Screenshot saved: plans_tab.png\n');

    // Step 5: Click +Add Plan button on the Plans tab (not the group page)
    console.log('--- Step 5: Clicking +Add Plan button on Plans tab ---');
    
    // Look for the +Add Plan button specifically on this tab
    let addPlanButton = page.locator('[data-testid="add-plan-btn"]').first();
    let buttonCount = await addPlanButton.count();
    
    if (buttonCount === 0) {
      // Try by text
      addPlanButton = page.locator('button:has-text("+Add Plan")').first();
      buttonCount = await addPlanButton.count();
    }
    
    if (buttonCount === 0) {
      // Try broader search
      addPlanButton = page.locator('button:has-text("Add Plan"), button:has-text("+")').first();
      buttonCount = await addPlanButton.count();
    }
    
    if (buttonCount > 0) {
      await addPlanButton.click({ timeout: 5000 });
      console.log('✓ Clicked +Add Plan button\n');
    } else {
      throw new Error('+Add Plan button not found on Plans tab');
    }

    // Wait for modal or page to appear
    await page.waitForTimeout(3000);
    console.log(`Current URL after clicking +Add Plan: ${page.url()}\n`);

    // Take screenshot of plan type selection page
    const planTypeScreenshot = path.join(screenshotsDir, 'plan_type_selection.png');
    await page.screenshot({ path: planTypeScreenshot });
    console.log('📸 Screenshot saved: plan_type_selection.png\n');

    // Step 6: Scroll down and click "Enter Plan manually" option
    console.log('--- Step 6: Scrolling down to find "Enter Plan manually" option ---\n');
    
    // Get all visible text on page first
    const bodyText = await page.locator('body').textContent();
    console.log('Checking if page contains "Enter Plan manually" text...');
    if (bodyText.includes('Enter Plan manually')) {
      console.log('✓ Page contains "Enter Plan manually" text\n');
    } else {
      console.log('⚠️ "Enter Plan manually" text not found on initial load\n');
    }
    
    // Scroll down gradually and look for the button at each step
    let foundManual = false;
    
    for (let scrollCount = 0; scrollCount < 5 && !foundManual; scrollCount++) {
      console.log(`Scroll attempt ${scrollCount + 1}...`);
      
      await page.evaluate(() => {
        window.scrollBy(0, 300);
      });
      await page.waitForTimeout(800);
      
      // After each scroll, look for the button
      const allElements = await page.locator('button, a, [role="button"]').all();
      
      for (const elem of allElements) {
        const text = await elem.textContent();
        const visible = await elem.isVisible().catch(() => false);
        
        if (visible && text) {
          const textLower = text.toLowerCase();
          if (textLower.includes('enter plan manually') || textLower.includes('enter manually')) {
            console.log(`✓ Found at scroll ${scrollCount + 1}: "${text.trim()}"\n`);
            
            // Scroll element into view and click
            await elem.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            await elem.click({ timeout: 5000 });
            console.log('✓ Successfully clicked "Enter Plan manually"\n');
            foundManual = true;
            break;
          }
        }
      }
    }
    
    if (!foundManual) {
      console.log('⚠️ Could not find "Enter Plan manually" button after scrolling.\n');
      console.log('The form might be displayed directly or the button might have a different label.\n');
    }
    
    // Take screenshot after scrolling
    const afterScrollScreenshot = path.join(screenshotsDir, 'after_scroll_final.png');
    await page.screenshot({ path: afterScrollScreenshot });
    console.log('📸 Screenshot saved: after_scroll_final.png\n');
    
    await page.waitForTimeout(2000);

    await page.waitForTimeout(2000);

    // Take screenshot of plan form
    const planFormScreenshot = path.join(screenshotsDir, 'plan_form_initial.png');
    await page.screenshot({ path: planFormScreenshot });
    console.log('📸 Screenshot saved: plan_form_initial.png\n');

    // Step 7: Fill in ALL visible form fields
    console.log('--- Step 7: Filling ALL visible form fields ---\n');

    // Scroll to top first
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);

    // Define comprehensive plan and company data
    const formData = {
      'name': 'Health Insurance Plan - ' + new Date().toISOString().slice(0, 10),
      'ein': '12-3456789',
      'sicCode': '7372',
      'naicsCode': '541511',
      'industry': 'Technology',
      'dbaName': 'HR Tech Company',
      'website': 'https://example.com',
      'effectiveDate': '2026-01-01',
      'renewalDate': '2026-12-31',
      'totalEmployees': '50',
      'eligibleEmployees': '45',
      'street1': '123 Main Street',
      'city': 'Charleston',
      'zip': '29401',
      'contactFirst': 'John',
      'contactLast': 'Doe',
      'contactEmail': 'john@example.com',
      'contactPhone': '(843) 555-0100',
      'payPeriodsPerYear': '26',
      'waitingPeriodDays': '0'
    };

    // Get all visible input fields
    const inputs = await page.locator('input:visible').all();
    console.log(`Found ${inputs.length} visible input fields\n`);

    for (const input of inputs) {
      try {
        const name = await input.getAttribute('name');
        const type = await input.getAttribute('type');
        const id = await input.getAttribute('id');
        
        if (!name || type === 'hidden') continue;

        const value = await input.inputValue();
        
        // Skip if already filled or is a special type
        if (value || type === 'checkbox' || type === 'radio' || type === 'submit' || type === 'button') {
          continue;
        }

        // Fill based on field name
        if (formData[name]) {
          await input.fill(formData[name]);
          console.log(`✓ Filled ${name}: ${formData[name]}`);
        } else if (name && name.includes('email')) {
          await input.fill(formData.contactEmail);
          console.log(`✓ Filled ${name}: ${formData.contactEmail}`);
        } else if (name && (name.includes('phone') || name.includes('phone'))) {
          await input.fill(formData.contactPhone);
          console.log(`✓ Filled ${name}: ${formData.contactPhone}`);
        }
      } catch (e) {
        // Skip fields that can't be filled
      }
    }

    console.log('\n');

    // Fill select dropdowns
    console.log('Filling select fields...\n');
    const selects = await page.locator('select:visible').all();
    console.log(`Found ${selects.length} visible select fields\n`);

    for (const select of selects) {
      const name = await select.getAttribute('name');
      const id = await select.getAttribute('id');
      
      if (name === 'state') {
        await select.selectOption('SC');
        console.log('✓ Selected State: SC');
      } else if (name === 'waitingPeriodEffectiveRule') {
        // Try to select the first non-empty option
        await select.selectOption('0');
        console.log('✓ Selected Waiting Period Rule: 0');
      } else if (name === 'payPeriodsPerYear') {
        await select.selectOption('26');
        console.log('✓ Selected Pay Periods: 26');
      }
    }

    console.log('\n');

    // Take screenshot after filling form
    const filledFormScreenshot = path.join(screenshotsDir, 'plan_form_filled_comprehensive.png');
    await page.screenshot({ path: filledFormScreenshot });
    console.log('📸 Screenshot saved: plan_form_filled_comprehensive.png\n');

    // Step 8: Submit the form
    console.log('--- Step 8: Submitting form ---');
    
    // Scroll down to see the submit button
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1500);
    
    // Take screenshot of bottom of form
    const beforeSubmitScreenshot = path.join(screenshotsDir, 'before_submit.png');
    await page.screenshot({ path: beforeSubmitScreenshot });
    console.log('📸 Screenshot saved: before_submit.png\n');
    
    // Look for submit button - try various selectors
    let submitButton = page.locator('button:has-text("Create Group & Start Setup")').first();
    let submitCount = await submitButton.count();
    
    if (submitCount === 0) {
      submitButton = page.locator('button:has-text("Submit"), button:has-text("Save"), button:has-text("Create"), button:has-text("Add")').first();
      submitCount = await submitButton.count();
    }
    
    if (submitCount === 0) {
      submitButton = page.locator('button[type="submit"]').first();
      submitCount = await submitButton.count();
    }
    
    if (submitCount > 0) {
      const buttonText = await submitButton.textContent();
      console.log(`✓ Found submit button: "${buttonText.trim()}"\n`);
      await submitButton.click({ timeout: 5000 });
      console.log('✓ Clicked submit button\n');
      
      await page.waitForTimeout(3000);
      
      const submittedScreenshot = path.join(screenshotsDir, 'after_form_submitted.png');
      await page.screenshot({ path: submittedScreenshot });
      console.log('📸 Screenshot saved: after_form_submitted.png\n');
      
      console.log(`✅ Form submitted successfully!`);
      console.log(`Final URL: ${page.url()}\n`);
      console.log('📁 All screenshots saved in:', screenshotsDir);
    } else {
      console.log('⚠️ Submit button not found.');
      const allButtons = await page.locator('button').all();
      console.log(`\nAvailable buttons on this page:\n`);
      for (const btn of allButtons) {
        const text = await btn.textContent();
        const visible = await btn.isVisible().catch(() => false);
        if (visible && text && text.trim()) {
          console.log(`  - "${text.trim()}"`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    const errorScreenshot = path.join(screenshotsDir, 'plan_error.png');
    try {
      await page.screenshot({ path: errorScreenshot });
      console.log(`📸 Error screenshot saved: plan_error.png`);
    } catch (e) {
      console.log('Could not capture error screenshot');
    }
  } finally {
    await browser.close();
  }
}

addPlanToGroup();
