import { SetMetadata } from '@nestjs/common';

export const CHECK_LIMIT_KEY = 'check_limit';

export interface CheckLimitOptions {
  resource: 'products' | 'stores' | 'users';
}

export const CheckLimit = (options: CheckLimitOptions) =>
  SetMetadata(CHECK_LIMIT_KEY, options);
