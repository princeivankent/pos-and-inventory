import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StoreContextService } from '../services/store-context.service';

const SKIP_PATHS = ['/auth/login', '/auth/register'];

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const storeContext = inject(StoreContextService);

  const shouldSkip = SKIP_PATHS.some((path) => req.url.includes(path));
  const storeId = storeContext.storeId();

  if (!shouldSkip && storeId) {
    req = req.clone({
      setHeaders: { 'X-Store-Id': storeId },
    });
  }

  return next(req);
};
