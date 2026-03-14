import 'dotenv/config';
import { Client } from 'pg';
import { seedDemoData } from './seeds/demo.seed';

async function main() {
  const storeId = process.env.DEMO_STORE_ID;
  if (!storeId) {
    throw new Error(
      'DEMO_STORE_ID env var is required.\n' +
      'Usage: DEMO_STORE_ID=<your-store-uuid> npm run db:seed:demo',
    );
  }

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
    await seedDemoData(client, storeId);
    await client.query('COMMIT');
    console.log('\nDemo seed complete.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
