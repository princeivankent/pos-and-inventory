import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSubscriptionPlans1708000000000 implements MigrationInterface {
  name = 'UpdateSubscriptionPlans1708000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Update Tindahan: ₱599, 300 products, include fifo + utang (moved from Negosyo)
    await queryRunner.query(`
      UPDATE subscription_plans SET
        price_php = 599,
        max_products_per_store = 300,
        features = '{"pos":true,"basic_inventory":true,"fifo_inventory":true,"utang_management":true}'::jsonb
      WHERE plan_code = 'tindahan'
    `);

    // 2. Update Negosyo: ₱1,499, 1000 products, add supplier_management
    await queryRunner.query(`
      UPDATE subscription_plans SET
        price_php = 1499,
        max_products_per_store = 1000,
        features = '{"pos":true,"basic_inventory":true,"fifo_inventory":true,"utang_management":true,"reports":true,"receipt_customization":true,"supplier_management":true,"multi_store":true,"export_data":true}'::jsonb
      WHERE plan_code = 'negosyo'
    `);

    // 3. Update Kadena: ₱2,999, unlimited products (99999), add tier-3 features
    await queryRunner.query(`
      UPDATE subscription_plans SET
        price_php = 2999,
        max_products_per_store = 99999,
        features = '{"pos":true,"basic_inventory":true,"fifo_inventory":true,"utang_management":true,"reports":true,"receipt_customization":true,"supplier_management":true,"multi_store":true,"export_data":true,"export_advanced":true,"low_stock_alerts":true}'::jsonb
      WHERE plan_code = 'kadena'
    `);

    // 4. Add billing_period column to subscriptions
    await queryRunner.query(`
      ALTER TABLE subscriptions
      ADD COLUMN IF NOT EXISTS billing_period VARCHAR(10) NOT NULL DEFAULT 'monthly'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert billing_period column
    await queryRunner.query(`
      ALTER TABLE subscriptions DROP COLUMN IF EXISTS billing_period
    `);

    // Revert Tindahan to original values
    await queryRunner.query(`
      UPDATE subscription_plans SET
        price_php = 499,
        max_products_per_store = 100,
        features = '{"pos":true,"basic_inventory":true,"fifo_inventory":false,"reports":false,"utang_management":false,"multi_store":false,"receipt_customization":false,"export_data":false}'::jsonb
      WHERE plan_code = 'tindahan'
    `);

    // Revert Negosyo to original values
    await queryRunner.query(`
      UPDATE subscription_plans SET
        price_php = 1499,
        max_products_per_store = 500,
        features = '{"pos":true,"basic_inventory":true,"fifo_inventory":true,"reports":true,"utang_management":true,"multi_store":true,"receipt_customization":true,"export_data":false}'::jsonb
      WHERE plan_code = 'negosyo'
    `);

    // Revert Kadena to original values
    await queryRunner.query(`
      UPDATE subscription_plans SET
        price_php = 3999,
        max_products_per_store = 2000,
        features = '{"pos":true,"basic_inventory":true,"fifo_inventory":true,"reports":true,"utang_management":true,"multi_store":true,"receipt_customization":true,"export_data":true}'::jsonb
      WHERE plan_code = 'kadena'
    `);
  }
}
