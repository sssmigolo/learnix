import { test, expect } from '@playwright/test';

test('verify dashboard and search', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Login
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button:has-text("Sign In")');

  // Wait for navigation/dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  await page.screenshot({ path: 'dashboard.png' });
  console.log('Saved dashboard.png');

  // Test search filter
  await page.fill('input[placeholder*="Search"]', 'nonexistent');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'dashboard_filtered.png' });
  console.log('Saved dashboard_filtered.png');
});
