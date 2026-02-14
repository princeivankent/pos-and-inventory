import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBillingTables1707500000000 implements MigrationInterface {
  name = 'AddBillingTables1707500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create invoice_status enum
    await queryRunner.query(`
      CREATE TYPE "invoice_status" AS ENUM ('draft', 'pending', 'paid', 'failed', 'void')
    `);

    // Create payment_status_billing enum (avoid conflict with existing payment_method enum)
    await queryRunner.query(`
      CREATE TYPE "payment_status_billing" AS ENUM ('pending', 'succeeded', 'failed', 'refunded')
    `);

    // Create invoices table
    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "organization_id" uuid NOT NULL,
        "plan_id" uuid,
        "invoice_number" varchar(50) NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "tax_amount" decimal(10,2) NOT NULL DEFAULT 0,
        "currency" varchar(3) NOT NULL DEFAULT 'PHP',
        "status" "invoice_status" NOT NULL DEFAULT 'pending',
        "due_date" TIMESTAMP NOT NULL,
        "paid_at" TIMESTAMP,
        "period_start" TIMESTAMP NOT NULL,
        "period_end" TIMESTAMP NOT NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_invoices_number" UNIQUE ("invoice_number"),
        CONSTRAINT "FK_invoices_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_invoices_plan" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE SET NULL
      )
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "organization_id" uuid NOT NULL,
        "invoice_id" uuid,
        "amount" decimal(10,2) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'PHP',
        "status" "payment_status_billing" NOT NULL DEFAULT 'pending',
        "payment_method" varchar(50) NOT NULL,
        "gateway_payment_id" varchar(255),
        "gateway_reference" varchar(255),
        "metadata" jsonb NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_payments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payments_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_payments_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL
      )
    `);

    // Create payment_methods table
    await queryRunner.query(`
      CREATE TABLE "payment_methods" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "organization_id" uuid NOT NULL,
        "type" varchar(50) NOT NULL,
        "gateway_method_id" varchar(255),
        "display_name" varchar(100),
        "last_four" varchar(4),
        "is_default" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_payment_methods" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payment_methods_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    // Add indexes
    await queryRunner.query(`CREATE INDEX "IDX_invoices_organization" ON "invoices" ("organization_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_invoices_status" ON "invoices" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_organization" ON "payments" ("organization_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_invoice" ON "payments" ("invoice_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_payment_methods_organization" ON "payment_methods" ("organization_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_methods"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_status_billing"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoice_status"`);
  }
}
