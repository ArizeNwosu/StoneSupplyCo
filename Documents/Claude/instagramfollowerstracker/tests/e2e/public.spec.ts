import { expect, test } from '@playwright/test';

test('home page loads and exposes the primary tracker flow', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Instagram Followers Tracker', exact: true })).toBeVisible();
  await expect(page.getByLabel('Instagram username')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Check followers' })).toBeVisible();
  await expect(page.getByText('Safe follower tracking, no Instagram password')).toBeVisible();
});

test('paid checkout intent survives authentication redirect and resumes with attribution', async ({ page }) => {
  let attempts = 0;
  const bodies: unknown[] = [];
  await page.route('**/api/stripe/checkout', async (route) => {
    bodies.push(route.request().postDataJSON());
    attempts += 1;
    await route.fulfill({
      status: attempts === 1 ? 401 : 200,
      contentType: 'application/json',
      body: JSON.stringify(attempts === 1 ? { error: 'Unauthorized' } : { url: '/checkout-resumed' }),
    });
  });

  await page.goto('/pricing');
  await page.getByRole('button', { name: 'Upgrade to Pro' }).first().click();
  await expect(page).toHaveURL(/\/auth\/signin\?returnTo=/);

  await page.goto('/pricing?resumeCheckout=1');
  await expect(page).toHaveURL(/\/checkout-resumed$/);
  expect(bodies).toEqual([
    { plan: 'PRO', interval: 'monthly', source: 'pricing' },
    expect.objectContaining({ plan: 'PRO', interval: 'monthly', source: 'pricing' }),
  ]);
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
