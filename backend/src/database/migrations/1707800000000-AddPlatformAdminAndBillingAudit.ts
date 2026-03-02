import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlatformAdminAndBillingAudit1707800000000 implements MigrationInterface {
  name = 'AddPlatformAdminAndBillingAudit1707800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "is_platform_admin" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "billing_audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "organization_id" uuid,
        "actor_user_id" uuid,
        "action" character varying(100) NOT NULL,
        "reason" text,
        "payload_before" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "payload_after" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_billing_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_billing_audit_logs_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_billing_audit_logs_actor" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_billing_audit_logs_org" ON "billing_audit_logs" ("organization_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_billing_audit_logs_actor" ON "billing_audit_logs" ("actor_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_billing_audit_logs_action" ON "billing_audit_logs" ("action")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_billing_audit_logs_action"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_billing_audit_logs_actor"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_billing_audit_logs_org"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "billing_audit_logs"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_platform_admin"`);
  }
}

