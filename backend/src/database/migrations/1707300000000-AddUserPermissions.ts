import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPermissions1707300000000 implements MigrationInterface {
  name = 'AddUserPermissions1707300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add permissions column to user_stores table
    await queryRunner.query(
      `ALTER TABLE "user_stores" ADD "permissions" text`,
    );

    // Backfill existing CASHIER records with default permissions
    const defaultCashierPermissions = [
      'products:view',
      'inventory:view',
      'sales:create',
      'sales:view',
      'receipts:view',
      'customers:view',
    ].join(',');

    await queryRunner.query(
      `UPDATE "user_stores" SET "permissions" = $1 WHERE "role" = 'cashier'`,
      [defaultCashierPermissions],
    );

    // Backfill existing ADMIN records with all permissions
    const allPermissions = [
      'products:view',
      'products:manage',
      'inventory:view',
      'inventory:adjust',
      'sales:create',
      'sales:view',
      'sales:void',
      'receipts:view',
      'reports:view',
      'customers:view',
      'customers:manage',
      'users:manage',
      'stores:manage',
    ].join(',');

    await queryRunner.query(
      `UPDATE "user_stores" SET "permissions" = $1 WHERE "role" = 'admin'`,
      [allPermissions],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_stores" DROP COLUMN "permissions"`,
    );
  }
}
