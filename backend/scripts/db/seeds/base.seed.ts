import { Client } from 'pg';

export async function seedBaseFixtures(client: Client) {
  const storeId = '11111111-1111-4111-8111-111111111111';
  const categoryId = '22222222-2222-4222-8222-222222222222';
  const supplierId = '33333333-3333-4333-8333-333333333333';
  const customerId = '44444444-4444-4444-8444-444444444444';

  await client.query(
    `
    INSERT INTO stores (id, name, settings)
    VALUES ($1, $2, $3::jsonb)
    `,
    [storeId, 'E2E Seed Store', JSON.stringify({ tax_enabled: true, tax_rate: 12 })],
  );

  await client.query(
    `
    INSERT INTO categories (id, store_id, name, description)
    VALUES ($1, $2, $3, $4)
    `,
    [categoryId, storeId, 'E2E Seed Category', 'Base seeded category for CI'],
  );

  await client.query(
    `
    INSERT INTO suppliers (id, store_id, name, phone, email, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [supplierId, storeId, 'E2E Seed Supplier', '09170000000', 'e2e-supplier@example.com', true],
  );

  await client.query(
    `
    INSERT INTO customers (id, store_id, name, phone, email, address, credit_limit, current_balance, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      customerId,
      storeId,
      'E2E Seed Customer',
      '09179999999',
      'e2e-customer@example.com',
      'CI Fixture Address',
      5000,
      0,
      true,
    ],
  );
}
