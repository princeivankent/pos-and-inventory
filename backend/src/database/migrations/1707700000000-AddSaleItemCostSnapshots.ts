import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSaleItemCostSnapshots1707700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sale_items" ADD COLUMN IF NOT EXISTS "unit_cost_snapshot" decimal(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" ADD COLUMN IF NOT EXISTS "cogs_subtotal" decimal(10,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sale_items" DROP COLUMN IF EXISTS "cogs_subtotal"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" DROP COLUMN IF EXISTS "unit_cost_snapshot"`,
    );
  }
}
