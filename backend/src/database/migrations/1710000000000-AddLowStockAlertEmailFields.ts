import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLowStockAlertEmailFields1710000000000 implements MigrationInterface {
  name = 'AddLowStockAlertEmailFields1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "low_stock_alerts" ADD COLUMN IF NOT EXISTS "email_sent" BOOLEAN NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "low_stock_alerts" ADD COLUMN IF NOT EXISTS "email_sent_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "low_stock_alerts" DROP COLUMN IF EXISTS "email_sent_at"`);
    await queryRunner.query(`ALTER TABLE "low_stock_alerts" DROP COLUMN IF EXISTS "email_sent"`);
  }
}
