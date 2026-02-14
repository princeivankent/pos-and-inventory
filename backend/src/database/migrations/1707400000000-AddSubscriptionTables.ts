import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionTables1707400000000 implements MigrationInterface {
  name = 'AddSubscriptionTables1707400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create subscription_status enum
    await queryRunner.query(`
      CREATE TYPE "subscription_status" AS ENUM (
        'trial', 'active', 'past_due', 'suspended', 'cancelled', 'expired'
      )
    `);

    // 2. Create organizations table
    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" varchar(255) NOT NULL,
        "owner_user_id" uuid NOT NULL,
        "billing_email" varchar(255),
        "billing_phone" varchar(50),
        "tax_id" varchar(50),
        "billing_address" text,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_organizations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_organizations_owner" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    // 3. Create subscription_plans table
    await queryRunner.query(`
      CREATE TABLE "subscription_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "plan_code" varchar(50) NOT NULL,
        "name" varchar(100) NOT NULL,
        "price_php" decimal(10,2) NOT NULL DEFAULT 0,
        "max_stores" int NOT NULL DEFAULT 1,
        "max_users_per_store" int NOT NULL DEFAULT 3,
        "max_products_per_store" int NOT NULL DEFAULT 100,
        "features" jsonb NOT NULL DEFAULT '{}',
        "sort_order" int NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_subscription_plans" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_subscription_plans_plan_code" UNIQUE ("plan_code")
      )
    `);

    // 4. Create subscriptions table
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "organization_id" uuid NOT NULL,
        "plan_id" uuid NOT NULL,
        "status" "subscription_status" NOT NULL DEFAULT 'trial',
        "trial_start" TIMESTAMP,
        "trial_end" TIMESTAMP,
        "current_period_start" TIMESTAMP,
        "current_period_end" TIMESTAMP,
        "cancel_at_period_end" boolean NOT NULL DEFAULT false,
        "usage_stats" jsonb NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_subscriptions_plan" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT
      )
    `);

    // 5. Add indexes
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_organization" ON "subscriptions" ("organization_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_status" ON "subscriptions" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_organizations_owner" ON "organizations" ("owner_user_id")`);

    // 6. ALTER stores - add organization_id FK
    await queryRunner.query(`ALTER TABLE "stores" ADD "organization_id" uuid`);
    await queryRunner.query(`
      ALTER TABLE "stores" ADD CONSTRAINT "FK_stores_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`CREATE INDEX "IDX_stores_organization" ON "stores" ("organization_id")`);

    // 7. Seed subscription plans
    await queryRunner.query(`
      INSERT INTO "subscription_plans" ("plan_code", "name", "price_php", "max_stores", "max_users_per_store", "max_products_per_store", "features", "sort_order")
      VALUES
        ('tindahan', 'Tindahan', 499, 1, 3, 100, '{"pos": true, "basic_inventory": true, "fifo_inventory": false, "reports": false, "utang_management": false, "multi_store": false, "receipt_customization": false, "export_data": false}', 1),
        ('negosyo', 'Negosyo', 1499, 3, 10, 500, '{"pos": true, "basic_inventory": true, "fifo_inventory": true, "reports": true, "utang_management": true, "multi_store": true, "receipt_customization": true, "export_data": false}', 2),
        ('kadena', 'Kadena', 3999, 10, 25, 2000, '{"pos": true, "basic_inventory": true, "fifo_inventory": true, "reports": true, "utang_management": true, "multi_store": true, "receipt_customization": true, "export_data": true}', 3)
    `);

    // 8. Data migration: create Organization per admin user, link stores, create trial subscription
    // Find the Kadena plan ID for existing user trials
    const kadenaResult = await queryRunner.query(`SELECT id FROM "subscription_plans" WHERE plan_code = 'kadena'`);
    const kadenaPlanId = kadenaResult[0]?.id;

    if (kadenaPlanId) {
      // Get all unique admin users who own stores
      const adminUsers = await queryRunner.query(`
        SELECT DISTINCT us.user_id, u.email, u.full_name
        FROM "user_stores" us
        JOIN "users" u ON u.id = us.user_id
        WHERE us.role = 'admin'
      `);

      for (const adminUser of adminUsers) {
        // Create organization for each admin user
        const orgResult = await queryRunner.query(`
          INSERT INTO "organizations" ("name", "owner_user_id", "billing_email")
          VALUES ($1, $2, $3)
          RETURNING id
        `, [`${adminUser.full_name}'s Organization`, adminUser.user_id, adminUser.email]);

        const orgId = orgResult[0]?.id;
        if (!orgId) continue;

        // Link all stores where this user is admin to the organization
        await queryRunner.query(`
          UPDATE "stores" SET "organization_id" = $1
          WHERE id IN (
            SELECT store_id FROM "user_stores"
            WHERE user_id = $2 AND role = 'admin'
          )
          AND "organization_id" IS NULL
        `, [orgId, adminUser.user_id]);

        // Create 30-day Kadena trial subscription for existing users
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        await queryRunner.query(`
          INSERT INTO "subscriptions" ("organization_id", "plan_id", "status", "trial_start", "trial_end")
          VALUES ($1, $2, 'trial', $3, $4)
        `, [orgId, kadenaPlanId, now.toISOString(), trialEnd.toISOString()]);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove FK and column from stores
    await queryRunner.query(`ALTER TABLE "stores" DROP CONSTRAINT IF EXISTS "FK_stores_organization"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stores_organization"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN IF EXISTS "organization_id"`);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_plans"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organizations"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE IF EXISTS "subscription_status"`);
  }
}
