import { expect, test } from '@playwright/test';

test('home page loads and exposes the primary tracker flow', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Instagram Followers Tracker' })).toBeVisible();
  await expect(page.getByLabel('Instagram username')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Check followers' })).toBeVisible();
  await expect(page.getByText('Safe follower tracking, no Instagram password')).toBeVisible();
});

test('pricing and public account pages render key data', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByRole('heading', { name: /Start safe\. Scale when tracking gets serious\./ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible();

  await page.goto('/cristiano');
  await expect(page.getByRole('heading', { name: '@cristiano', exact: true })).toBeVisible();
  await expect(page.getByText('Follower Count History')).toBeVisible();
  await expect(page.getByText(/saved snapshot/i)).toBeVisible();
});
