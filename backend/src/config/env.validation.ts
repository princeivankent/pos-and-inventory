type Env = Record<string, string | undefined>;

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
}

export function validateEnv(config: Env): Env {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'DATABASE_URL',
    'JWT_SECRET',
  ];

  const missing = required.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const nodeEnv = config.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be one of: development, test, production');
  }

  const bypassPayment = parseBoolean(config.BYPASS_PAYMENT, true);
  if (nodeEnv === 'production') {
    if (bypassPayment) {
      throw new Error('BYPASS_PAYMENT must be false in production');
    }
    if (!config.PAYMONGO_SECRET_KEY) {
      throw new Error('PAYMONGO_SECRET_KEY is required in production when BYPASS_PAYMENT=false');
    }
    if (!config.PAYMONGO_WEBHOOK_SECRET) {
      throw new Error('PAYMONGO_WEBHOOK_SECRET is required in production');
    }
  }

  return config;
}
