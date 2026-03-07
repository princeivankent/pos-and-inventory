import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerIsActive1707950000000 implements MigrationInterface {
  name = 'AddCustomerIsActive1707950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_customers_store_active"
      ON "customers" ("store_id", "is_active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_customers_store_active"
    `);

    await queryRunner.query(`
      ALTER TABLE "customers"
      DROP COLUMN IF EXISTS "is_active"
    `);
  }
}
