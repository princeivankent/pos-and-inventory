import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

function parseBoolean(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true';
}

function shouldUseSsl(): boolean {
  if (parseBoolean(process.env.DATABASE_SSL)) {
    return true;
  }

  if ((process.env.PGSSLMODE ?? '').toLowerCase() === 'require') {
    return true;
  }

  return process.env.NODE_ENV === 'production';
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [join(__dirname, '..', 'database', 'entities', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'database', 'migrations', '**', '*{.ts,.js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: shouldUseSsl() ? { rejectUnauthorized: false } : false,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
