import { expect, test } from '@playwright/test';
import {
  createCashier,
  loginViaUi,
  registerAccount,
  uniqueSuffix,
} from './helpers';

test.describe('Playwright billing and permissions suite', () => {
  test('Tindahan blocks reports-oriented UI', async ({ page, request }) => {
    const session = await registerAccount(request, uniqueSuffix('billing-tindahan'));
    await loginViaUi(page, session);

    await page.goto('/dashboard');
    await expect(page.getByTestId('nav-reports')).toHaveCount(0);
    await expect(page.getByText('Unlock Sales Trends')).toBeVisible();
  });

  test('upgrade flow changes the current plan to Negosyo', async ({ page, request }) => {
    const session = await registerAccount(request, uniqueSuffix('billing-upgrade'));
    await loginViaUi(page, session);

    await page.goto('/billing');
    await expect(page.getByTestId('billing-status-card')).toContainText('Tindahan');
    await page.getByRole('button', { name: 'Upgrade' }).first().click();
    await page.getByRole('button', { name: /Upgrade to Negosyo/ }).click();
    await expect(page.getByTestId('billing-status-card')).toContainText('Negosyo');
    await expect(page.getByTestId('plan-card-negosyo')).toContainText('Current Plan');
  });

  test('cashier cannot access admin-only areas', async ({ page, request }) => {
    const session = await registerAccount(request, uniqueSuffix('billing-cashier'));
    const cashier = await createCashier(request, session);

    await loginViaUi(page, {
      ...session,
      email: cashier.email,
      password: cashier.password,
    });

    await expect(page.getByTestId('nav-users')).toHaveCount(0);
    await expect(page.getByTestId('nav-billing')).toHaveCount(0);

    await page.goto('/billing');
    await page.waitForURL('**/dashboard');
  });
});
