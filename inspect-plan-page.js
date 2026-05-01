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

async function inspectPlanPage() {
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
    console.log('✓ Logged in\n');

    // Navigate to groups
    console.log('Navigating to groups...');
    await page.waitForTimeout(2000);
    const viewAllGroupsButton = page.getByTestId('view-all-groups');
    await viewAllGroupsButton.click({ timeout: 5000 });
    await page.waitForTimeout(2000);
    console.log('✓ On groups page\n');

    // Click group
    console.log(`Clicking group: ${groupName}`);
    const groupLink = page.locator(`text=${groupName}`).first();
    await groupLink.click({ timeout: 5000 });
    await page.waitForTimeout(2000);
    console.log('✓ Opened group\n');

    // Click Plans tab
    console.log('Clicking Plans tab...');
    const plansTab = page.locator('text=Plans').first();
    await plansTab.click({ timeout: 5000 });
    await page.waitForTimeout(3000);
    console.log('✓ On Plans tab\n');

    // Take screenshot before clicking +Add Plan
    let screenshot = path.join(screenshotsDir, 'before_add_plan.png');
    await page.screenshot({ path: screenshot });
    console.log('📸 Screenshot: before_add_plan.png\n');

    // Click +Add Plan
    console.log('Clicking +Add Plan button...');
    const addPlanButton = page.locator('button:has-text("+")').first();
    await addPlanButton.click({ timeout: 5000 });
    await page.waitForTimeout(3000);
    console.log('✓ Clicked +Add Plan\n');

    // Take screenshot immediately after
    screenshot = path.join(screenshotsDir, 'after_add_plan_immediate.png');
    await page.screenshot({ path: screenshot });
    console.log('📸 Screenshot: after_add_plan_immediate.png\n');

    // Scroll down a little bit
    console.log('Scrolling down...');
    await page.evaluate(() => {
      window.scrollBy(0, 400);
    });
    await page.waitForTimeout(1000);

    // Take screenshot after scrolling
    screenshot = path.join(screenshotsDir, 'after_scroll_inspection.png');
    await page.screenshot({ path: screenshot });
    console.log('📸 Screenshot: after_scroll_inspection.png\n');

    // List all text on page
    const bodyText = await page.locator('body').textContent();
    console.log('='.repeat(60));
    console.log('PAGE TEXT (first 2000 chars):');
    console.log('='.repeat(60));
    console.log(bodyText.substring(0, 2000));
    console.log('='.repeat(60) + '\n');

    // List all buttons
    const buttons = await page.locator('button').all();
    console.log('='.repeat(60));
    console.log('ALL BUTTONS ON PAGE:');
    console.log('='.repeat(60));
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const visible = await buttons[i].isVisible().catch(() => false);
      if (visible && text && text.trim()) {
        console.log(`${i + 1}. "${text.trim()}"`);
      }
    }
    console.log('='.repeat(60) + '\n');

    // List all links
    const links = await page.locator('a').all();
    console.log('='.repeat(60));
    console.log('ALL LINKS ON PAGE:');
    console.log('='.repeat(60));
    for (let i = 0; i < links.length; i++) {
      const text = await links[i].textContent();
      const visible = await links[i].isVisible().catch(() => false);
      if (visible && text && text.trim().length < 100) {
        console.log(`${i + 1}. "${text.trim()}"`);
      }
    }
    console.log('='.repeat(60));

    console.log('\nBrowser will remain open. Close it when done reviewing.');
    await new Promise(() => {});

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

inspectPlanPage();
