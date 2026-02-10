import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../config/database.config';

/**
 * Purges all POS transaction data from the database.
 * Useful for resetting test data while keeping master data
 * (stores, users, products, categories, suppliers, customers).
 *
 * Deletes: sale_items, credit_payments, sales, stock_movements,
 *          low_stock_alerts, inventory_batches
 * Resets:  products.current_stock → 0, customers.current_balance → 0
 */
async function purgeTransactions() {
  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('Connected to database.\n');

    await dataSource.transaction(async (manager) => {
      // Delete in FK-safe order (children first)
      const tables = [
        'sale_items',
        'credit_payments',
        'sales',
        'stock_movements',
        'low_stock_alerts',
        'inventory_batches',
      ];

      for (const table of tables) {
        const result = await manager.query(`DELETE FROM ${table}`);
        const count = result[1] ?? result?.rowCount ?? '?';
        console.log(`  Deleted ${count} rows from ${table}`);
      }

      // Reset product stock counts
      const productResult = await manager.query(
        `UPDATE products SET current_stock = 0 WHERE current_stock != 0`,
      );
      const productCount =
        productResult[1] ?? productResult?.rowCount ?? '?';
      console.log(`  Reset current_stock on ${productCount} products`);

      // Reset customer balances
      const customerResult = await manager.query(
        `UPDATE customers SET current_balance = 0 WHERE current_balance != 0`,
      );
      const customerCount =
        customerResult[1] ?? customerResult?.rowCount ?? '?';
      console.log(`  Reset current_balance on ${customerCount} customers`);
    });

    console.log('\nPurge complete.');
  } catch (error) {
    console.error('Purge failed:', error.message);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

purgeTransactions();
