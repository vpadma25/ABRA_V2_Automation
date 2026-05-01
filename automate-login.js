require('dotenv').config();
const { chromium } = require('playwright');

async function loginToWebApp() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to login page...');
    await page.goto(`${process.env.APP_BASE_URL}/login`, { waitUntil: 'networkidle' });

    console.log('Filling in email...');
    await page.getByTestId('email-input').fill(process.env.TEST_USER_EMAIL);

    console.log('Filling in password...');
    await page.getByTestId('password-input').fill(process.env.TEST_USER_PASSWORD);

    console.log('Clicking login button...');
    await page.getByTestId('login-btn').click();

    console.log('Waiting for navigation...');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    console.log('Login successful!');
    console.log('Current URL:', page.url());

    // Keep browser open for 5 seconds to see the result
    await page.waitForTimeout(5000);
  } catch (error) {
    console.error('Login failed:', error.message);
  } finally {
    await browser.close();
  }
}

loginToWebApp();
