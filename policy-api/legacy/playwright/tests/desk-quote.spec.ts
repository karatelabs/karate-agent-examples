import { test, expect, Page } from '@playwright/test';

async function startQuote(page: Page, driver: { first: string; last: string; age: number; state: string }) {
  await page.getByRole('button', { name: 'New' }).click();
  await page.getByRole('menuitem', { name: 'Submission' }).click();
  await page.getByRole('menuitem', { name: 'Personal auto' }).click();
  await page.getByLabel('First name').fill(driver.first);
  await page.getByLabel('Last name').fill(driver.last);
  await page.getByLabel('Age').fill(String(driver.age));
  await page.getByLabel('Garaging state').selectOption(driver.state);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
}

test.describe('PolicyDesk quote wizard', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/desk/');
  });

  test('quick rate and the rating worksheet agree for Florida comprehensive', async ({ page }) => {
    await startQuote(page, { first: 'Rosa', last: 'Delgado', age: 40, state: 'FL' });
    await page.getByLabel('Comprehensive').check();

    await page.getByRole('button', { name: 'Rate', exact: true }).click();
    await expect(page.locator('#quick-out')).toHaveText('$155.00');

    await page.getByRole('button', { name: 'Rate quote' }).click();
    await expect(page).toHaveURL(/#\/worksheet\//);
    await expect(page.locator('#ws-total')).toHaveText('$155.00');
    await expect(page.locator('#ws-lines tr')).toHaveCount(2);
    await expect(page.locator('#ws-lines tr[data-line="territory"]')).toContainText('Florida');
  });

  test('binds a Washington collision policy and files a claim on it', async ({ page }) => {
    await startQuote(page, { first: 'Mei', last: 'Tanaka', age: 45, state: 'WA' });
    await page.getByLabel('Collision').check();
    await page.getByRole('button', { name: 'Rate quote' }).click();
    await page.getByRole('button', { name: 'Bind policy' }).click();

    await page.getByLabel('Signed application on file').check();
    await page.getByRole('button', { name: 'Bind', exact: true }).click();
    await expect(page.locator('#policy-status')).toHaveText('BOUND');
    await expect(page.locator('#policy-premium')).toHaveText('$90.00');

    await page.getByLabel('Loss amount ($)').fill('1800');
    await page.getByRole('button', { name: 'File claim' }).click();
    await expect(page.locator('#claim-status')).toHaveText('OPEN');
    await expect(page.locator('#claim-amount-shown')).toHaveText('$1800.00');
  });
});
