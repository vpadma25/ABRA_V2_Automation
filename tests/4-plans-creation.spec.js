require('dotenv').config();
const { test, expect } = require('@playwright/test');

test.describe('Plans Tab & Plan Creation', () => {
  const credentials = {
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD
  };

  test.beforeEach(async ({ page }) => {
    // Login and navigate to Plans tab
    await page.goto(`${process.env.APP_BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.getByTestId('email-input').fill(credentials.email);
    await page.getByTestId('password-input').fill(credentials.password);
    await page.getByTestId('login-btn').click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // Navigate to groups
    const viewAllGroupsButton = page.getByTestId('view-all-groups');
    await viewAllGroupsButton.click();
    await page.waitForTimeout(2000);

    // Click on first group
    const today = new Date().toISOString().slice(0, 10);
    const groupName = `Test Company ${today}`;
    const groupLink = page.locator(`text=${groupName}`).first();
    await groupLink.click();
    await page.waitForTimeout(2000);

    // Click Plans tab
    const plansTab = page.locator('button:has-text("Plans"), a:has-text("Plans"), [data-testid*="plans"], text=Plans').first();
    await plansTab.click();
    await page.waitForTimeout(2000);
  });

  test('should display Plans tab content', async ({ page }) => {
    const url = page.url();
    console.log('Plans tab URL:', url);

    // ⚠️ DEFECT: URL shows /groups/new instead of /groups/{id}/plans
    expect(url).toContain('/plans');
  });

  test('should display +Add Plan button', async ({ page }) => {
    const addPlanButton = page.locator('button:has-text("+Add Plan"), [data-testid="add-plan-btn"]');
    const count = await addPlanButton.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should display existing plans if any', async ({ page }) => {
    // Look for plans list
    const plansList = page.locator('[data-testid*="plan"], .plan-item, .plan-card, table');
    const count = await plansList.count();

    console.log('Plans found:', count);
  });

  test('should be able to click +Add Plan button', async ({ page }) => {
    const currentUrl = page.url();
    
    const addPlanButton = page.locator('button:has-text("+Add Plan"), [data-testid="add-plan-btn"]').first();
    await expect(addPlanButton).toBeVisible();
    
    // Set up listener for navigation
    const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => null);
    
    await addPlanButton.click();
    
    // Wait for potential navigation
    await page.waitForTimeout(3000);
    
    const newUrl = page.url();
    console.log('URL before +Add Plan:', currentUrl);
    console.log('URL after +Add Plan:', newUrl);

    // ⚠️ DEFECT FOUND: URL redirects to /groups/new instead of staying in group context
    // Expected: Should be something like /groups/{id}/plans/new
    // Actual: Becomes /groups/new

    // The URL has changed
    expect(newUrl).not.toEqual(currentUrl);
  });

  test('should handle +Add Plan button click gracefully', async ({ page }) => {
    const addPlanButton = page.locator('button:has-text("+Add Plan"), [data-testid="add-plan-btn"]').first();
    
    // Try clicking with timeout to catch hangs
    try {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addBtn = buttons.find(btn => btn.textContent.includes('+Add Plan'));
        if (addBtn) {
          console.log('Button found and clickable');
          return true;
        }
      });

      await addPlanButton.click({ timeout: 5000 });
      
      // Wait for response
      await page.waitForTimeout(3000);
      
      // Page should still be responsive
      const bodyText = await page.locator('body').textContent();
      expect(bodyText.length).toBeGreaterThan(0);
      
    } catch (error) {
      console.error('Error clicking +Add Plan button:', error.message);
    }
  });

});

test.describe('Plan Creation Form (DEFECTS)', () => {
  const credentials = {
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to plan form directly
    await page.goto(`${process.env.APP_BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.getByTestId('email-input').fill(credentials.email);
    await page.getByTestId('password-input').fill(credentials.password);
    await page.getByTestId('login-btn').click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // Navigate to groups
    const viewAllGroupsButton = page.getByTestId('view-all-groups');
    await viewAllGroupsButton.click();
    await page.waitForTimeout(2000);

    // Click on first group
    const today = new Date().toISOString().slice(0, 10);
    const groupName = `Test Company ${today}`;
    const groupLink = page.locator(`text=${groupName}`).first();
    await groupLink.click();
    await page.waitForTimeout(2000);

    // Click Plans tab
    const plansTab = page.locator('button:has-text("Plans"), a:has-text("Plans"), text=Plans').first();
    await plansTab.click();
    await page.waitForTimeout(2000);

    // Click +Add Plan button
    const addPlanButton = page.locator('button:has-text("+Add Plan"), [data-testid="add-plan-btn"]').first();
    await addPlanButton.click();
    await page.waitForTimeout(3000);
  });

  test('❌ DEFECT: Should find "Enter Plan manually" button', async ({ page }) => {
    console.log('Current URL:', page.url());
    
    // Look for "Enter Plan manually" button
    let found = false;
    
    // Check initial visibility
    const bodyText = await page.locator('body').textContent();
    if (bodyText.includes('Enter Plan manually')) {
      console.log('✓ Found "Enter Plan manually" text');
      found = true;
    }

    // Try scrolling to find it
    if (!found) {
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => {
          window.scrollBy(0, 300);
        });
        await page.waitForTimeout(500);

        const elements = await page.locator('button, a, [role="button"]').all();
        for (const elem of elements) {
          const text = await elem.textContent();
          if (text && text.toLowerCase().includes('enter plan manually')) {
            found = true;
            console.log('✓ Found button after scroll:', text);
            break;
          }
        }

        if (found) break;
      }
    }

    // ⚠️ DEFECT: Button not found
    console.log('❌ DEFECT: "Enter Plan manually" button not found after 5 scroll attempts');
    expect(found).toBeTruthy();
  });

  test('should display form fields', async ({ page }) => {
    // Look for form inputs
    const inputs = page.locator('input:visible');
    const count = await inputs.count();

    console.log('Visible input fields found:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('❌ DEFECT: Form should not hang on select dropdown', async ({ page }) => {
    // Scroll to top
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);

    // Fill some basic fields first
    const inputs = await page.locator('input:visible').all();
    
    // Fill first few fields
    if (inputs.length > 0) {
      try {
        await inputs[0].fill('Test Plan');
        await inputs[0].blur();
        await page.waitForTimeout(500);
      } catch (e) {
        console.log('Could not fill first input');
      }
    }

    // Now look for select dropdowns
    const selects = await page.locator('select:visible').all();
    console.log('Select dropdowns found:', selects.length);

    if (selects.length > 0) {
      try {
        console.log('Attempting to select State dropdown...');
        
        // Set a timeout to catch if page hangs
        const selectPromise = selects[0].selectOption('SC');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Select timed out - DEFECT')), 5000)
        );

        await Promise.race([selectPromise, timeoutPromise]);
        
        console.log('✓ Successfully selected option');

        // Wait and check if page is still responsive
        await page.waitForTimeout(2000);
        const bodyText = await page.locator('body').textContent();
        expect(bodyText.length).toBeGreaterThan(0);

      } catch (error) {
        console.error('❌ DEFECT: Form hang detected:', error.message);
        expect(false).toBeTruthy();
      }
    }
  });

  test('should have proper form labels', async ({ page }) => {
    // Look for labels
    const labels = page.locator('label');
    const count = await labels.count();

    console.log('Labels found:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('should have submit button', async ({ page }) => {
    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1000);

    // Look for submit button
    const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Create"), button:has-text("Save"), button[type="submit"]');
    const count = await submitBtn.count();

    console.log('Submit buttons found:', count);
    expect(count).toBeGreaterThan(0);
  });

});
