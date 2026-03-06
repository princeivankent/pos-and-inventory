import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSaleNumberUniqueness1707900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sales
      DROP CONSTRAINT IF EXISTS "sales_sale_number_key";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_sales_store_number";
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_sales_store_number"
      ON sales(store_id, sale_number);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_sales_store_number";
    `);

    await queryRunner.query(`
      ALTER TABLE sales
      ADD CONSTRAINT "sales_sale_number_key" UNIQUE (sale_number);
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_sales_store_number"
      ON sales(store_id, sale_number);
    `);
  }
}
