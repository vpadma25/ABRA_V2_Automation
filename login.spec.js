require('dotenv').config();
const { test, expect } = require('@playwright/test');

test.use({
  locale: 'javascript'
});

test('test', async ({ page }) => {
  await page.goto(`${process.env.APP_BASE_URL}/login`);
  await page.getByTestId('email-input').click();
  await page.getByTestId('email-input').fill(process.env.TEST_USER_EMAIL);
  await page.getByTestId('password-input').click();
  await page.getByTestId('password-input').fill(process.env.TEST_USER_PASSWORD);
  await page.getByTestId('login-btn').click();
});
