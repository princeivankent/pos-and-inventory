import 'dotenv/config';
import { Client } from 'pg';
import { seedBaseFixtures } from './seeds/base.seed';

function assertSafe() {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  const appEnv = process.env.APP_ENV;
  const allowReset = process.env.ALLOW_DB_RESET;
  const expectedHost = process.env.EXPECTED_E2E_DB_HOST;

  if (appEnv !== 'e2e') {
    throw new Error('Refusing e2e seed: APP_ENV must be e2e');
  }

  if (allowReset !== 'true') {
    throw new Error('Refusing e2e seed: ALLOW_DB_RESET must be true');
  }

  if (!expectedHost || !databaseUrl.includes(expectedHost)) {
    throw new Error('Refusing e2e seed: DATABASE_URL is not the expected E2E host');
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
