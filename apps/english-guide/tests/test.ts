import { expect, test } from '@playwright/test';

test('index page has expected h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'English Guide' })).toBeVisible();
});

test('index page shows three main features', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Vocabulary Building')).toBeVisible();
  await expect(page.getByText('Pronunciation Training')).toBeVisible();
  await expect(page.getByText('Conversation Practice')).toBeVisible();
});