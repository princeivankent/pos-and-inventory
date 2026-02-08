import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductPriceAndStock1707100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "retail_price" decimal(10,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "cost_price" decimal(10,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "current_stock" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "current_stock"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "cost_price"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "retail_price"`,
    );
  }
}
