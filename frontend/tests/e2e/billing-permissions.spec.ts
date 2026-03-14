import { expect, test } from '@playwright/test';
import {
  createCashier,
  downgradePlan,
  loginViaUi,
  registerAccount,
  uniqueSuffix,
} from './helpers';

test.describe('Playwright billing and permissions suite', () => {
  test('Tindahan blocks reports-oriented UI', async ({ page, request }) => {
    const session = await registerAccount(request, uniqueSuffix('billing-tindahan'));
    // New accounts start on Negosyo trial; downgrade immediately (trial downgrades are instant)
    await downgradePlan(request, session, 'tindahan');
    await loginViaUi(page, session);

    await page.goto('/dashboard');
    await expect(page.getByTestId('nav-reports')).toHaveCount(0);
    await expect(page.getByText('Unlock Sales Trends')).toBeVisible();
  });

  test('upgrade flow changes the current plan to Kadena', async ({ page, request }) => {
    const session = await registerAccount(request, uniqueSuffix('billing-upgrade'));
    await loginViaUi(page, session);

    // New accounts start on Negosyo trial; upgrade to Kadena to test the upgrade flow
    await page.goto('/billing');
    await expect(page.getByTestId('billing-status-card')).toContainText('Negosyo');
    await page.locator('[data-testid="upgrade-plan-kadena"] button').click();
    await page.locator('[data-testid="confirm-upgrade-button"] button').click();
    await expect(page.getByTestId('billing-status-card')).toContainText('Kadena');
    await expect(page.getByTestId('plan-card-kadena')).toContainText('Current Plan');
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
