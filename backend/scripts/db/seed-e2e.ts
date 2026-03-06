import 'dotenv/config';
import { Client } from 'pg';
import { seedBaseFixtures } from './seeds/base.seed';

function isApprovedSupabaseE2eTarget(databaseUrl: string, projectRef: string) {
  const database = new URL(databaseUrl);
  const directHost = `db.${projectRef}.supabase.co`;
  const isDirect = database.hostname === directHost;
  const isPooler =
    database.hostname.endsWith('.pooler.supabase.com') && database.username.includes(projectRef);

  return {
    approved: isDirect || isPooler,
    databaseHost: database.hostname,
    projectRef,
  };
}

function assertSafe() {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  const projectRef =
    process.env.E2E_SUPABASE_PROJECT_REF ??
    (process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname.split('.')[0] : '');
  const appEnv = process.env.APP_ENV;
  const allowReset = process.env.ALLOW_DB_RESET;

  if (appEnv !== 'e2e') {
    throw new Error('Refusing e2e seed: APP_ENV must be e2e');
  }

  if (allowReset !== 'true') {
    throw new Error('Refusing e2e seed: ALLOW_DB_RESET must be true');
  }

  if (!databaseUrl || !projectRef) {
    throw new Error(
      'Refusing e2e seed: DATABASE_URL and E2E_SUPABASE_PROJECT_REF are required',
    );
  }

  const target = isApprovedSupabaseE2eTarget(databaseUrl, projectRef);

  if (!target.projectRef || !target.approved) {
    throw new Error(
      `Refusing e2e seed: DATABASE_URL host ${target.databaseHost || '<missing>'} is not approved for Supabase project ${target.projectRef || '<missing>'}`,
    );
  }
}

async function main() {
  assertSafe();

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DATABASE_SSL === 'true' || process.env.PGSSLMODE === 'require'
        ? { rejectUnauthorized: false }
        : false,
  });

  await client.connect();
  await client.query('BEGIN');

  try {
    await seedBaseFixtures(client);
    await client.query('COMMIT');
    console.log('E2E seed complete');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
