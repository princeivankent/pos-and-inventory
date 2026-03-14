/**
 * Removes all Playwright / test users whose email ends in @example.com,
 * along with every piece of data that belongs to their stores and organizations.
 *
 * Deletion order (FK-safe):
 *   1. Transactional data inside each store
 *   2. Billing records for each organization
 *   3. Stores and user_stores
 *   4. Local users rows
 *   5. Organizations
 *   6. Supabase Auth users (after DB transaction commits — cannot be rolled back)
 */

import 'dotenv/config';
import { Client } from 'pg';
import { createSupabaseAdminClient } from '../../src/config/supabase.config';

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DATABASE_SSL === 'true' || process.env.PGSSLMODE === 'require'
        ? { rejectUnauthorized: false }
        : false,
  });

  await client.connect();

  // ── 1. Discover test users ───────────────────────────────────────────────
  const userResult = await client.query<{ id: string }>(
    `SELECT id FROM users WHERE email LIKE '%@example.com'`,
  );

  if (userResult.rows.length === 0) {
    console.log('No @example.com users found. Nothing to clean up.');
    await client.end();
    return;
  }

  const userIds = userResult.rows.map((r) => r.id);
  console.log(`Found ${userIds.length} test user(s): ${userIds.join(', ')}`);

  // ── 2. Discover their stores ─────────────────────────────────────────────
  const storeResult = await client.query<{ store_id: string }>(
    `SELECT DISTINCT store_id FROM user_stores WHERE user_id = ANY($1)`,
    [userIds],
  );
  const storeIds = storeResult.rows.map((r) => r.store_id);
  console.log(`  Stores to remove: ${storeIds.length}`);

  // ── 3. Discover their organizations ─────────────────────────────────────
  const orgResult = await client.query<{ organization_id: string }>(
    `SELECT DISTINCT organization_id FROM stores
     WHERE id = ANY($1) AND organization_id IS NOT NULL`,
    [storeIds],
  );
  const orgIds = orgResult.rows.map((r) => r.organization_id);
  console.log(`  Organizations to remove: ${orgIds.length}`);

  // ── 4. DB transaction: delete everything in FK-safe order ────────────────
  await client.query('BEGIN');

  try {
    if (storeIds.length > 0) {
      // sale_items has no store_id — delete via parent sales
      const siRes = await client.query(
        `DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE store_id = ANY($1))`,
        [storeIds],
      );
      if (Number(siRes.rowCount ?? 0) > 0) console.log(`  Deleted ${siRes.rowCount} rows from sale_items`);

      // Remaining store-scoped tables all have store_id
      const storeTables = [
        'credit_payments',
        'sales',
        'stock_movements',
        'low_stock_alerts',
        'inventory_batches',
        'products',
        'categories',
        'customers',
        'suppliers',
      ];

      for (const table of storeTables) {
        const res = await client.query(
          `DELETE FROM ${table} WHERE store_id = ANY($1)`,
          [storeIds],
        );
        const count = res.rowCount ?? '?';
        if (Number(count) > 0) console.log(`  Deleted ${count} rows from ${table}`);
      }
    }

    if (orgIds.length > 0) {
      // Billing records
      const billingTables = ['payments', 'invoices', 'subscriptions'];
      for (const table of billingTables) {
        const res = await client.query(
          `DELETE FROM ${table} WHERE organization_id = ANY($1)`,
          [orgIds],
        );
        const count = res.rowCount ?? '?';
        if (Number(count) > 0) console.log(`  Deleted ${count} rows from ${table}`);
      }
    }

    if (storeIds.length > 0) {
      // Stores
      const res = await client.query(`DELETE FROM stores WHERE id = ANY($1)`, [storeIds]);
      console.log(`  Deleted ${res.rowCount ?? '?'} rows from stores`);
    }

    if (userIds.length > 0) {
      // user_stores (may reference stores already deleted, cascade handles it, but delete explicitly)
      await client.query(`DELETE FROM user_stores WHERE user_id = ANY($1)`, [userIds]);

      // Local users
      const res = await client.query(`DELETE FROM users WHERE id = ANY($1)`, [userIds]);
      console.log(`  Deleted ${res.rowCount ?? '?'} rows from users`);
    }

    if (orgIds.length > 0) {
      // Organizations
      const res = await client.query(
        `DELETE FROM organizations WHERE id = ANY($1)`,
        [orgIds],
      );
      console.log(`  Deleted ${res.rowCount ?? '?'} rows from organizations`);
    }

    await client.query('COMMIT');
    console.log('\nDB cleanup committed.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }

  // ── 5. Delete Supabase Auth users (outside DB transaction) ───────────────
  if (userIds.length > 0) {
    const supabase = createSupabaseAdminClient();
    let authDeleted = 0;
    let authFailed = 0;

    for (const uid of userIds) {
      const { error } = await supabase.auth.admin.deleteUser(uid);
      if (error) {
        console.warn(`  Warning: could not delete Supabase auth user ${uid}: ${error.message}`);
        authFailed++;
      } else {
        authDeleted++;
      }
    }

    console.log(`  Supabase auth users deleted: ${authDeleted} / ${userIds.length}${authFailed > 0 ? ` (${authFailed} failed — check warnings above)` : ''}`);
  }

  console.log('\nPlaywright user cleanup complete.');
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
