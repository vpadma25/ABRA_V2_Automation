require('dotenv').config();

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const credentials = {
  email: process.env.TEST_USER_EMAIL,
  password: process.env.TEST_USER_PASSWORD
};

const groupName = 'Test Company ' + new Date().toISOString().slice(0, 10);
const screenshotsDir = path.join(__dirname, 'screenshots');

async function scrollAndInspect() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Login
    console.log('Logging in...');
    await page.goto(`${process.env.APP_BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.getByTestId('email-input').fill(credentials.email);
    await page.getByTestId('password-input').fill(credentials.password);
    await page.getByTestId('login-btn').click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // Navigate to groups
    await page.waitForTimeout(2000);
    const viewAllGroupsButton = page.getByTestId('view-all-groups');
    await viewAllGroupsButton.click({ timeout: 5000 });
    await page.waitForTimeout(2000);

    // Click group
    const groupLink = page.locator(`text=${groupName}`).first();
    await groupLink.click({ timeout: 5000 });
    await page.waitForTimeout(2000);

    // Click Plans tab
    const plansTab = page.locator('text=Plans').first();
    await plansTab.click({ timeout: 5000 });
    await page.waitForTimeout(3000);

    // Click +Add Plan
    const addPlanButton = page.locator('button:has-text("+")').first();
    await addPlanButton.click({ timeout: 5000 });
    await page.waitForTimeout(3000);

    // Now scroll down more aggressively to find "Enter Plan manually"
    console.log('\nScrolling down to find "Enter Plan manually"...\n');
    
    for (let i = 0; i < 10; i++) {
      // Scroll
      await page.evaluate(() => {
        window.scrollBy(0, 500);
      });
      await page.waitForTimeout(800);

      // Check for the text
      const bodyText = await page.locator('body').textContent();
      if (bodyText.includes('Enter Plan manually') || bodyText.includes('enter plan manually')) {
        console.log(`✓ Found "Enter Plan manually" at scroll ${i + 1}\n`);
        
        // Take screenshot
        const screenshot = path.join(screenshotsDir, `found_manual_at_scroll_${i + 1}.png`);
        await page.screenshot({ path: screenshot });
        console.log(`📸 Screenshot: found_manual_at_scroll_${i + 1}.png\n`);
        
        // Now find and list buttons
        const buttons = await page.locator('button, a, [role="button"]').all();
        console.log('BUTTONS/LINKS visible at this scroll level:');
        for (let j = 0; j < buttons.length; j++) {
          const text = await buttons[j].textContent();
          const visible = await buttons[j].isVisible().catch(() => false);
          if (visible && text && text.trim()) {
            console.log(`  ${j + 1}. "${text.trim()}"`);
          }
        }
        
        break;
      }
      
      console.log(`Scroll attempt ${i + 1}: "Enter Plan manually" not found yet...`);
    }

    console.log('\nBrowser will remain open. Close it when done.');
    await new Promise(() => {});

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

scrollAndInspect();
