import { expect, test } from '@playwright/test';

test('dashboard loads after dev login locally', async ({ page, baseURL }) => {
  const hostname = new URL(baseURL ?? 'http://localhost:3099').hostname;
  test.skip(hostname !== 'localhost' && hostname !== '127.0.0.1', 'dev login is only available locally');

  await page.goto('/api/dev-login?email=test%40ifttracker.local&redirectTo=/dashboard');
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: '@cristiano', exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Follower Count History')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share Report' })).toBeVisible();
  await expect(page.getByText('Unfollow Detector')).toBeVisible();
});
