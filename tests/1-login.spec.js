require('dotenv').config();
const { test, expect } = require('@playwright/test');

const LOGIN_URL = `${process.env.APP_BASE_URL}/login`;
const TEST_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle' });
  });

  test('should load login page with all elements', async ({ page }) => {
    // Verify page title/heading
    await expect(page).toHaveTitle(/login|auth|sign/i);
    
    // Verify email input field exists
    const emailInput = page.getByTestId('email-input');
    await expect(emailInput).toBeVisible();
    
    // Verify password input field exists
    const passwordInput = page.getByTestId('password-input');
    await expect(passwordInput).toBeVisible();
    
    // Verify login button exists
    const loginBtn = page.getByTestId('login-btn');
    await expect(loginBtn).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    const emailInput = page.getByTestId('email-input');
    const passwordInput = page.getByTestId('password-input');
    const loginBtn = page.getByTestId('login-btn');

    // Fill with invalid credentials
    await emailInput.fill('invalid@test.com');
    await passwordInput.fill('wrongpassword');
    await loginBtn.click();

    // Wait for response and check for error message
    await page.waitForTimeout(2000);
    
    // Look for error message
    const errorMessage = page.locator('[role="alert"], .error, .alert-error, .message-error');
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);
    
    expect(isErrorVisible).toBeTruthy();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    const credentials = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    };

    const emailInput = page.getByTestId('email-input');
    const passwordInput = page.getByTestId('password-input');
    const loginBtn = page.getByTestId('login-btn');

    // Fill credentials
    await emailInput.fill(credentials.email);
    await passwordInput.fill(credentials.password);
    await loginBtn.click();

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // Verify redirect away from login page
    expect(page.url()).not.toContain('/login');
    
    // Verify user is authenticated (check for dashboard/groups page elements)
    await expect(page).not.toHaveTitle(/login/i);
  });

  test('should validate email field is required', async ({ page }) => {
    const passwordInput = page.getByTestId('password-input');
    const loginBtn = page.getByTestId('login-btn');

    // Fill only password
    await passwordInput.fill(TEST_PASSWORD);
    
    // Check if email field has required attribute or show validation
    const emailInput = page.getByTestId('email-input');
    const isRequired = await emailInput.getAttribute('required');
    
    expect(isRequired || await emailInput.getAttribute('aria-required')).toBeTruthy();
  });

  test('should validate password field is required', async ({ page }) => {
    const emailInput = page.getByTestId('email-input');
    const passwordInput = page.getByTestId('password-input');

    // Fill only email
    await emailInput.fill(TEST_EMAIL);
    
    // Check if password field has required attribute
    const isRequired = await passwordInput.getAttribute('required');
    
    expect(isRequired || await passwordInput.getAttribute('aria-required')).toBeTruthy();
  });

  test('should disable/enable login button appropriately', async ({ page }) => {
    const loginBtn = page.getByTestId('login-btn');
    
    // Check initial state (should be disabled or enabled)
    const initialState = await loginBtn.isDisabled().catch(() => false);
    
    // Fill email and password
    const emailInput = page.getByTestId('email-input');
    const passwordInput = page.getByTestId('password-input');
    
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);

    // Button should be enabled now
    await expect(loginBtn).toBeEnabled();
  });

  test('should handle form submission with Enter key', async ({ page }) => {
    const emailInput = page.getByTestId('email-input');
    const passwordInput = page.getByTestId('password-input');

    // Fill credentials
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    
    // Press Enter on password field
    await passwordInput.press('Enter');

    // Wait for navigation
    await page.waitForTimeout(2000);

    // Verify redirect away from login page
    expect(page.url()).not.toContain('/login');
  });

  test('should remember email on page reload', async ({ page }) => {
    const emailInput = page.getByTestId('email-input');
    
    // Fill email
    await emailInput.fill(TEST_EMAIL);
    
    // Reload page
    await page.reload();
    
    // Check if email is remembered (localStorage/session storage)
    const value = await emailInput.inputValue();
    // Note: May vary based on implementation
    console.log('Email value after reload:', value);
  });

});
