import { expect, test } from '@playwright/test';
import {
  acceptConfirmDialog,
  closeReceipt,
  createCategory,
  createCustomer,
  createProduct,
  createStore,
  loginViaUi,
  registerAccount,
  selectPrimeOption,
  stockInProduct,
  uniqueSuffix,
} from './helpers';

test.describe('Playwright smoke suite', () => {
  test('login, create product, stock in, complete cash sale, and void sale', async ({
    page,
    request,
  }) => {
    const session = await registerAccount(request, uniqueSuffix('smoke-cash'));
    const category = await createCategory(request, session, `General ${uniqueSuffix('cat')}`);
    const sku = `SKU-${uniqueSuffix('cash')}`;
    const productName = `Coffee ${uniqueSuffix('product')}`;

    await loginViaUi(page, session);

    await page.goto('/products');
    await page.getByRole('button', { name: 'Add Product' }).click();
    await page.getByTestId('product-name-input').fill(productName);
    await page.getByTestId('product-sku-input').fill(sku);
    await selectPrimeOption(page, '[data-testid="product-category-select"]', category.name);
    await page.locator('#product-retail-price-input').fill('120');
    await page.locator('#product-cost-price-input').fill('80');
    await page.locator('#product-reorder-level-input').fill('2');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText(productName)).toBeVisible();

    await page.goto('/inventory');
    await page.getByRole('button', { name: 'Stock In' }).click();
    await selectPrimeOption(page, '[data-testid="stock-in-product-select"]', productName);
    await page.locator('#stock-in-quantity-input').fill('5');
    await page.locator('#stock-in-unit-cost-input').fill('80');
    await page.locator('[data-testid="stock-in-submit-button"] button').click();
    await expect(page.getByTestId('inventory-page')).toContainText(productName);
    await expect(page.getByTestId('inventory-page')).toContainText('5 pcs');

    await page.goto('/pos');
    await page.getByTestId(`pos-product-${sku}`).click();
    await page.getByTestId('charge-button').click();
    await page.locator('#payment-amount-input').fill('200');
    await page.getByRole('button', { name: 'Complete Sale' }).click();
    await closeReceipt(page);

    await page.goto('/sales');
    const firstSaleRow = page.locator('[data-testid^="sale-row-"]').first();
    await expect(firstSaleRow).toBeVisible();
    const saleTestId = await firstSaleRow.getAttribute('data-testid');
    const saleNumber = saleTestId!.replace('sale-row-', '');
    await page.getByTestId(`void-sale-${saleNumber}`).click();
    await acceptConfirmDialog(page);
    await expect(firstSaleRow).toContainText('void');
  });

  test('complete credit and partial sales', async ({ page, request }) => {
    const session = await registerAccount(request, uniqueSuffix('smoke-credit'));
    const category = await createCategory(request, session, `Utang ${uniqueSuffix('cat')}`);
    const product = await createProduct(request, session, {
      category_id: category.id,
      sku: `SKU-${uniqueSuffix('utang')}`,
      name: `Milk ${uniqueSuffix('product')}`,
      retail_price: 100,
      cost_price: 60,
      reorder_level: 1,
    });
    await stockInProduct(request, session, product.id, 8, 60);
    const customer = await createCustomer(request, session, `Customer ${uniqueSuffix('cust')}`, 1000);

    await loginViaUi(page, session);
    // New accounts start on Negosyo trial which includes utang_management — no upgrade needed

    await page.goto('/pos');
    await page.getByTestId(`pos-product-${product.sku}`).click();
    await page.getByTestId('add-customer-button').click();
    await page.locator('#customer-search-input').fill(customer.name);
    await page.getByText(customer.name, { exact: true }).click();
    await page.getByTestId('charge-button').click();
    await page.getByTestId('payment-method-credit').click();
    await page.getByRole('button', { name: 'Complete Sale' }).click();
    await closeReceipt(page);

    await page.getByTestId(`pos-product-${product.sku}`).click();
    await page.getByTestId('add-customer-button').click();
    await page.locator('#customer-search-input').fill(customer.name);
    await page.getByText(customer.name, { exact: true }).click();
    await page.getByTestId('charge-button').click();
    await page.getByTestId('payment-method-partial').click();
    await page.locator('#partial-cash-amount-input').fill('50');
    await page.getByRole('button', { name: 'Complete Sale' }).click();
    await closeReceipt(page);

    await page.goto('/customers');
    await expect(page.getByTestId('customers-page')).toContainText(customer.name);

    const customersResponse = await request.get(`${process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3000/api'}/customers`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
        'X-Store-Id': session.storeId,
      },
    });
    expect(customersResponse.ok()).toBeTruthy();
    const customers = await customersResponse.json();
    const updatedCustomer = customers.find((item: { id: string }) => item.id === customer.id);
    expect(Number(updatedCustomer.current_balance)).toBeGreaterThan(0);
  });

  test('switch store and verify isolation', async ({ page, request }) => {
    const session = await registerAccount(request, uniqueSuffix('smoke-stores'));
    const category = await createCategory(request, session, `Main ${uniqueSuffix('cat')}`);
    const product = await createProduct(request, session, {
      category_id: category.id,
      sku: `SKU-${uniqueSuffix('isolation')}`,
      name: `Visible Product ${uniqueSuffix('product')}`,
      retail_price: 90,
      cost_price: 50,
    });

    await loginViaUi(page, session);
    // New accounts start on Negosyo trial which allows multi-store — no upgrade needed

    const secondStoreName = `Branch ${uniqueSuffix('store')}`;
    await createStore(request, session, secondStoreName);
    await page.getByTestId('user-menu-btn').click();
    await page.getByTestId('logout-button').click();
    await loginViaUi(page, session);

    await page.goto('/products');
    await expect(page.getByText(product.name)).toBeVisible();

    await selectPrimeOption(page, '[data-testid="store-switcher"]', secondStoreName);
    await page.goto('/products');
    await expect(page.getByText(product.name)).not.toBeVisible();

    await selectPrimeOption(page, '[data-testid="store-switcher"]', session.storeName);
    await page.goto('/products');
    await expect(page.getByText(product.name)).toBeVisible();
  });
});
