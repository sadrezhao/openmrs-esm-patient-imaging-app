import test from '@playwright/test';
import { ImagingPage } from '../pages';
import { expect } from '@playwright/test';

// This test is a sample E2E test. You can delete it.

test('Imaging test', async ({ page }) => {
  const imagingPage = new ImagingPage(page);
  await imagingPage.goto();
  await expect(imagingPage.page.getByRole('link', { name: 'Imaging' })).toBeVisible();
});
