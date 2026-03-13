import { APIRequestContext, expect, Page } from '@playwright/test';

const apiBaseUrl = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3000/api';

export interface TestSession {
  email: string;
  password: string;
  token: string;
  storeId: string;
  storeName: string;
}

export function uniqueSuffix(prefix = 'pw'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function authHeaders(token: string, storeId: string) {
  return {
    Authorization: `Bearer ${token}`,
    'X-Store-Id': storeId,
    'Content-Type': 'application/json',
  };
}

export async function registerAccount(
  request: APIRequestContext,
  suffix = uniqueSuffix('account'),
): Promise<TestSession> {
  const email = `${suffix}@example.com`;
  const password = 'Password123!';
  const response = await request.post(`${apiBaseUrl}/auth/register`, {
    data: {
      email,
      password,
      full_name: `Playwright ${suffix}`,
      store_name: `Store ${suffix}`,
    },
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();

  return {
    email,
    password,
    token: body.access_token,
    storeId: body.default_store.id,
    storeName: body.default_store.name,
  };
}

export async function loginViaUi(page: Page, session: TestSession) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(session.email);
  await page.locator('#login-password-input').fill(session.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard');
  await expect(page.getByTestId('app-header')).toBeVisible();
}

export async function createCategory(
  request: APIRequestContext,
  session: TestSession,
  name: string,
) {
  const response = await request.post(`${apiBaseUrl}/categories`, {
    headers: authHeaders(session.token, session.storeId),
    data: { name },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

export async function createProduct(
  request: APIRequestContext,
  session: TestSession,
  data: {
    category_id: string;
    sku: string;
    name: string;
    retail_price: number;
    cost_price: number;
    reorder_level?: number;
  },
) {
  const response = await request.post(`${apiBaseUrl}/products`, {
    headers: authHeaders(session.token, session.storeId),
    data: {
      unit: 'pcs',
      ...data,
    },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

export async function stockInProduct(
  request: APIRequestContext,
  session: TestSession,
  productId: string,
  quantity: number,
  unitCost = 0,
) {
  const response = await request.post(`${apiBaseUrl}/inventory/adjust`, {
    headers: authHeaders(session.token, session.storeId),
    data: {
      product_id: productId,
      type: 'stock_in',
      quantity,
      unit_cost: unitCost,
      notes: 'Playwright stock in',
    },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

export async function createCustomer(
  request: APIRequestContext,
  session: TestSession,
  name: string,
  creditLimit = 1000,
) {
  const response = await request.post(`${apiBaseUrl}/customers`, {
    headers: authHeaders(session.token, session.storeId),
    data: {
      name,
      phone: `09${Math.floor(Math.random() * 1_000_000_000)
        .toString()
        .padStart(9, '0')}`,
      credit_limit: creditLimit,
    },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

export async function upgradePlan(
  request: APIRequestContext,
  session: TestSession,
  planCode: 'negosyo' | 'kadena',
) {
  const response = await request.post(`${apiBaseUrl}/billing/upgrade`, {
    headers: authHeaders(session.token, session.storeId),
    data: { plan_code: planCode },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

export async function downgradePlan(
  request: APIRequestContext,
  session: TestSession,
  planCode: 'tindahan' | 'negosyo',
) {
  const plansRes = await request.get(`${apiBaseUrl}/subscription-plans`);
  expect(plansRes.ok()).toBeTruthy();
  const plans = await plansRes.json();
  const plan = plans.find((p: { plan_code: string }) => p.plan_code === planCode);
  expect(plan).toBeTruthy();

  const response = await request.post(`${apiBaseUrl}/billing/downgrade`, {
    headers: authHeaders(session.token, session.storeId),
    data: { plan_id: plan.id },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

export async function createStore(
  request: APIRequestContext,
  session: TestSession,
  name: string,
) {
  const response = await request.post(`${apiBaseUrl}/stores`, {
    headers: authHeaders(session.token, session.storeId),
    data: { name },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

export async function createCashier(
  request: APIRequestContext,
  session: TestSession,
  suffix = uniqueSuffix('cashier'),
) {
  const response = await request.post(`${apiBaseUrl}/users`, {
    headers: authHeaders(session.token, session.storeId),
    data: {
      email: `${suffix}@example.com`,
      full_name: `Cashier ${suffix}`,
      password: 'Password123!',
      role: 'cashier',
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return {
    email: `${suffix}@example.com`,
    password: 'Password123!',
    user: body,
  };
}

export async function selectPrimeOption(page: Page, trigger: string, optionText: string) {
  await page.locator(trigger).click();

  const optionByRole = page.getByRole('option', { name: optionText, exact: true });
  if (await optionByRole.count()) {
    await optionByRole.first().click();
    return;
  }

  await page
    .locator('.p-select-option, .p-dropdown-item, li')
    .filter({ hasText: optionText })
    .first()
    .click();
}

export async function closeReceipt(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Receipt' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Close' }).click();
}

export async function acceptConfirmDialog(page: Page) {
  await page.getByRole('alertdialog').getByRole('button', { name: 'Yes' }).click();
}

export async function upgradeToNegosyoViaUi(page: Page) {
  await page.goto('/billing');
  await page.getByRole('button', { name: 'Upgrade' }).first().click();
  await page.getByRole('button', { name: /Upgrade to Negosyo/ }).click();
  await expect(page.getByTestId('billing-status-card')).toContainText('Negosyo');
}
