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

  await page.goto('/instagram-follower-count/cristiano');
  await expect(page.getByText('@cristiano', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Instagram follower count/i })).toBeVisible();
  await expect(page.getByText(/daily point/i)).toBeVisible();
});

test('legacy account URLs permanently redirect to the canonical route', async ({ request }) => {
  const response = await request.get('/cristiano', { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe('/instagram-follower-count/cristiano');
});
