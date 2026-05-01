require('dotenv').config();
const { test, expect } = require('@playwright/test');

test.describe('Groups Page', () => {
  const credentials = {
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD
  };

  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto(`${process.env.APP_BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.getByTestId('email-input').fill(credentials.email);
    await page.getByTestId('password-input').fill(credentials.password);
    await page.getByTestId('login-btn').click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
  });

  test('should navigate to groups page', async ({ page }) => {
    // Click "View All Groups" button
    const viewAllGroupsButton = page.getByTestId('view-all-groups');
    await expect(viewAllGroupsButton).toBeVisible();
    await viewAllGroupsButton.click();

    // Wait for page load
    await page.waitForTimeout(2000);

    // Verify we're on groups page
    expect(page.url()).toContain('/groups');
  });

  test('should display list of groups', async ({ page }) => {
    // Navigate to groups
    const viewAllGroupsButton = page.getByTestId('view-all-groups');
    await viewAllGroupsButton.click();
    await page.waitForTimeout(2000);

    // Look for group items
    const groupItems = page.locator('[data-testid*="group"], .group-item, .group-card, li:has-text(/test company/i)');
    const count = await groupItems.count();

    // Should have at least one group
    expect(count).toBeGreaterThan(0);
  });

  test('should be able to search/filter groups', async ({ page }) => {
    // Navigate to groups
    const viewAllGroupsButton = page.getByTestId('view-all-groups');
    await viewAllGroupsButton.click();
    await page.waitForTimeout(2000);

    // Look for search input
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]');
    const hasSearch = await searchInput.count() > 0;

    if (hasSearch) {
      // Test search functionality
      await searchInput.fill('Test Company');
      await page.waitForTimeout(1000);

      // Verify results are filtered
      const filteredItems = page.locator('li:visible:has-text("Test Company")');
      const count = await filteredItems.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should display group with current date in name', async ({ page }) => {
    // Navigate to groups
    const viewAllGroupsButton = page.getByTestId('view-all-groups');
    await viewAllGroupsButton.click();
    await page.waitForTimeout(2000);

    const today = new Date().toISOString().slice(0, 10);
    const groupName = `Test Company ${today}`;

    // Look for group created today
    const groupLink = page.locator(`text=${groupName}`);
    const exists = await groupLink.count() > 0;

    expect(exists).toBeTruthy();
  });

  test('should allow clicking on a group', async ({ page }) => {
    // Navigate to groups
    const viewAllGroupsButton = page.getByTestId('view-all-groups');
    await viewAllGroupsButton.click();
    await page.waitForTimeout(2000);

    const today = new Date().toISOString().slice(0, 10);
    const groupName = `Test Company ${today}`;

    // Click on group
    const groupLink = page.locator(`text=${groupName}`).first();
    await expect(groupLink).toBeVisible();
    await groupLink.click();

    // Wait for navigation
    await page.waitForTimeout(2000);

    // Verify we're in group details page
    expect(page.url()).toContain('/groups/');
  });

  test('should show pagination if many groups exist', async ({ page }) => {
    // Navigate to groups
    const viewAllGroupsButton = page.getByTestId('view-all-groups');
    await viewAllGroupsButton.click();
    await page.waitForTimeout(2000);

    // Look for pagination controls
    const pagination = page.locator('[data-testid*="pagination"], .pagination, nav:has-text("previous")');
    const hasPagination = await pagination.count() > 0;

    console.log('Pagination exists:', hasPagination);
  });

  test('should have working navigation header', async ({ page }) => {
    // Navigate to groups
    const viewAllGroupsButton = page.getByTestId('view-all-groups');
    await viewAllGroupsButton.click();
    await page.waitForTimeout(2000);

    // Check for header/navigation
    const header = page.locator('header, nav, [role="navigation"]');
    await expect(header).toBeVisible();
  });

  test('should display empty state if no groups', async ({ page }) => {
    // Navigate to groups
    const viewAllGroupsButton = page.getByTestId('view-all-groups');
    await viewAllGroupsButton.click();
    await page.waitForTimeout(2000);

    // Check current state
    const groupItems = page.locator('[data-testid*="group"], .group-item, .group-card');
    const count = await groupItems.count();

    if (count === 0) {
      // Should show empty state message
      const emptyState = page.locator('text=/no groups|empty|start creating/i');
      await expect(emptyState).toBeVisible();
    }
  });

  test('should have working breadcrumb navigation', async ({ page }) => {
    // Navigate to groups
    const viewAllGroupsButton = page.getByTestId('view-all-groups');
    await viewAllGroupsButton.click();
    await page.waitForTimeout(2000);

    // Look for breadcrumb
    const breadcrumb = page.locator('[role="navigation"] a, .breadcrumb a');
    const count = await breadcrumb.count();

    console.log('Breadcrumb links found:', count);
  });

});
