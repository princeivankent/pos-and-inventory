import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSaleItemsTable1707200000000 implements MigrationInterface {
  name = 'FixSaleItemsTable1707200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add missing updated_at column to sale_items
    await queryRunner.query(`
      ALTER TABLE sale_items
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
    `);

    // Make batch_id nullable (for products without inventory batches)
    await queryRunner.query(`
      ALTER TABLE sale_items
      ALTER COLUMN batch_id DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sale_items
      ALTER COLUMN batch_id SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE sale_items
      DROP COLUMN IF EXISTS updated_at
    `);
  }
}
