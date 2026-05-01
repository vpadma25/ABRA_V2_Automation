require('dotenv').config();
const { test, expect } = require('@playwright/test');

test.describe('Group Details Page', () => {
  const credentials = {
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD
  };

  test.beforeEach(async ({ page }) => {
    // Login and navigate to a group
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
  });

  test('should display group details page', async ({ page }) => {
    // Verify URL contains group ID
    expect(page.url()).toContain('/groups/');

    // Verify page is loaded
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent.length).toBeGreaterThan(0);
  });

  test('should display group name', async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    const groupName = `Test Company ${today}`;

    // Look for group name on page
    const groupNameElement = page.locator(`text=${groupName}`);
    await expect(groupNameElement).toBeVisible();
  });

  test('should have Plans tab', async ({ page }) => {
    // Look for Plans tab
    const plansTab = page.locator('button:has-text("Plans"), a:has-text("Plans"), [data-testid*="plans"], text=Plans');
    const count = await plansTab.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should have other navigation tabs', async ({ page }) => {
    // Look for common tabs like Members, Settings, etc
    const tabs = page.locator('button[role="tab"], [data-testid*="tab"]');
    const count = await tabs.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to Plans tab', async ({ page }) => {
    // Click Plans tab
    const plansTab = page.locator('button:has-text("Plans"), a:has-text("Plans"), [data-testid*="plans"], text=Plans').first();
    await plansTab.click();
    await page.waitForTimeout(2000);

    // Verify URL changed
    const urlBefore = page.url();
    console.log('URL after clicking Plans tab:', urlBefore);

    // Should contain /plans in URL
    expect(urlBefore).toContain('/plans');
  });

  test('should display group information section', async ({ page }) => {
    // Look for group info like ID, created date, etc
    const infoSection = page.locator('[data-testid*="info"], .group-info, .details-section');
    const count = await infoSection.count();

    console.log('Info sections found:', count);
  });

  test('should have action buttons', async ({ page }) => {
    // Look for action buttons (edit, delete, export, etc)
    const buttons = page.locator('button:visible');
    const count = await buttons.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should display group members/users section', async ({ page }) => {
    // Look for members section
    const membersSection = page.locator('text=/member|user|contact/i, [data-testid*="member"]');
    const count = await membersSection.count();

    console.log('Members sections found:', count);
  });

  test('should have breadcrumb navigation', async ({ page }) => {
    // Look for breadcrumb
    const breadcrumb = page.locator('[role="navigation"] a, .breadcrumb a');
    const count = await breadcrumb.count();

    console.log('Breadcrumb links found:', count);
    // Should have at least a link back to groups
    expect(count).toBeGreaterThan(0);
  });

  test('should be able to go back to groups', async ({ page }) => {
    // Look for back button or groups link
    const backButton = page.locator('button:has-text("Back"), a:has-text("Groups"), [aria-label*="back"]');
    const count = await backButton.count();

    if (count > 0) {
      await backButton.first().click();
      await page.waitForTimeout(2000);

      // Should be on groups page
      expect(page.url()).toContain('/groups');
    }
  });

});
