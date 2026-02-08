import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StoreContextService } from '../services/store-context.service';
import { UserRole } from '../models/enums';

export const adminGuard: CanActivateFn = () => {
  const storeContext = inject(StoreContextService);
  const router = inject(Router);

  if (storeContext.currentRole() === UserRole.ADMIN) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
